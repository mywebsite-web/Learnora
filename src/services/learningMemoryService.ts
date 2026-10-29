import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  StudentLearningMemory, 
  LastStudyActivity, 
  WeakLearningArea, 
  RecommendedNextStep, 
  AutomatedReminderLog 
} from '../types';

const MEMORY_STORAGE_PREFIX = 'learnora_learning_memory_';

export class LearningMemoryService {
  /**
   * Helper: Clean undefined values for Firestore serialization
   */
  private static cleanUndefined<T extends Record<string, any>>(obj: T): T {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
          cleaned[key] = this.cleanUndefined(val);
        } else {
          cleaned[key] = val;
        }
      }
    }
    return cleaned;
  }

  /**
   * Retrieves the student's persistent learning memory.
   * Returns cached local data immediately and syncs with Firestore & backend.
   */
  static async getMemory(userId: string, userEmail?: string): Promise<StudentLearningMemory> {
    if (!userId) {
      return this.createDefaultMemory('guest');
    }

    // 1. Try local cache
    let cached: StudentLearningMemory | null = null;
    try {
      const raw = localStorage.getItem(`${MEMORY_STORAGE_PREFIX}${userId}`);
      if (raw) {
        cached = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[LearningMemory] Failed to read local cache:', e);
    }

    // 2. Fetch from Firestore
    try {
      const docRef = doc(db, 'learningMemories', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const remoteData = snap.data() as StudentLearningMemory;
        const merged: StudentLearningMemory = {
          ...this.createDefaultMemory(userId, userEmail),
          ...cached,
          ...remoteData,
          userId,
          userEmail: userEmail || remoteData.userEmail || cached?.userEmail
        };
        this.cacheLocally(userId, merged);
        return merged;
      }
    } catch (err) {
      console.warn('[LearningMemory] Firestore read failed, using cached memory:', err);
    }

    // 3. Fallback to cached or fresh initialized default
    if (cached) {
      return cached;
    }

    const defaultMem = this.createDefaultMemory(userId, userEmail);
    await this.saveMemory(defaultMem);
    return defaultMem;
  }

  /**
   * Saves updated student learning memory across LocalStorage, Firestore, and backend.
   */
  static async saveMemory(memory: StudentLearningMemory): Promise<void> {
    if (!memory || !memory.userId) return;

    memory.updatedAt = Date.now();
    this.cacheLocally(memory.userId, memory);

    // Sync to Firestore
    try {
      const docRef = doc(db, 'learningMemories', memory.userId);
      const cleaned = this.cleanUndefined(memory);
      await setDoc(docRef, cleaned, { merge: true });
    } catch (err) {
      console.warn('[LearningMemory] Firestore save error:', err);
    }

    // Also push to backend so server-side scheduler has instant grounded facts
    try {
      await fetch('/api/reminders/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memory)
      });
    } catch (_) {
      // Backend sync error can be ignored silently
    }
  }

  /**
   * Records that the student has opened / accessed a lesson or study section.
   */
  static async recordLessonAccess(
    userId: string,
    data: {
      lessonId: string;
      title: string;
      courseId?: string;
      courseTitle?: string;
      subject: string;
      topic?: string;
      sectionHeading?: string;
      sectionIndex?: number;
      totalSections?: number;
      isCompleted?: boolean;
    }
  ): Promise<StudentLearningMemory> {
    const mem = await this.getMemory(userId);
    const now = Date.now();

    const subject = data.subject || mem.currentSubject || 'General Studies';
    const topic = data.topic || data.title;

    mem.currentSubject = subject;
    mem.currentTopic = topic;
    if (data.courseId && data.courseTitle) {
      mem.currentCourse = {
        id: data.courseId,
        title: data.courseTitle,
        subject
      };
    }

    mem.lastLessonAccessed = {
      id: data.lessonId,
      title: data.title,
      courseId: data.courseId,
      courseTitle: data.courseTitle,
      subject,
      topic,
      sectionHeading: data.sectionHeading || data.title,
      sectionIndex: data.sectionIndex ?? 1,
      totalSections: data.totalSections ?? 3,
      isCompleted: Boolean(data.isCompleted),
      timestamp: now
    };

    mem.lastStudyActivity = {
      type: 'lesson',
      courseId: data.courseId,
      courseTitle: data.courseTitle,
      subject,
      topic,
      lessonId: data.lessonId,
      lessonTitle: data.title,
      sectionHeading: data.sectionHeading,
      sectionIndex: data.sectionIndex,
      totalSections: data.totalSections,
      isCompleted: Boolean(data.isCompleted),
      timestamp: now
    };

    // Update unfinished lessons list
    if (!data.isCompleted) {
      const existingIdx = mem.unfinishedLessons.findIndex(u => u.lessonId === data.lessonId);
      const record = {
        lessonId: data.lessonId,
        title: data.title,
        subject,
        topic,
        sectionIndex: data.sectionIndex ?? 1,
        totalSections: data.totalSections ?? 3,
        lastAccessedAt: now
      };
      if (existingIdx >= 0) {
        mem.unfinishedLessons[existingIdx] = record;
      } else {
        mem.unfinishedLessons.unshift(record);
        if (mem.unfinishedLessons.length > 8) mem.unfinishedLessons.pop();
      }

      mem.recommendedNextStep = {
        action: 'resume-lesson',
        title: `Resume: ${data.title}`,
        subject,
        topic,
        targetUrl: `tutor?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}&resume=1`,
        rationale: `You paused at section ${data.sectionIndex ?? 1} of ${data.totalSections ?? 3}. Complete this section to secure your progress.`
      };
    }

    await this.saveMemory(mem);
    return mem;
  }

  /**
   * Records that the student has completed a lesson.
   */
  static async recordLessonCompleted(
    userId: string,
    data: {
      lessonId: string;
      title: string;
      courseId?: string;
      courseTitle?: string;
      subject: string;
      topic?: string;
    }
  ): Promise<StudentLearningMemory> {
    const mem = await this.getMemory(userId);
    const now = Date.now();
    const subject = data.subject || mem.currentSubject || 'General Studies';
    const topic = data.topic || data.title;

    // Remove from unfinished
    mem.unfinishedLessons = mem.unfinishedLessons.filter(u => u.lessonId !== data.lessonId);

    // Add to completed
    const existingCompIdx = mem.completedLessons.findIndex(c => c.lessonId === data.lessonId);
    if (existingCompIdx === -1) {
      mem.completedLessons.unshift({
        lessonId: data.lessonId,
        title: data.title,
        subject,
        topic,
        completedAt: now
      });
      if (mem.completedLessons.length > 25) mem.completedLessons.pop();
    }

    if (mem.lastLessonAccessed && mem.lastLessonAccessed.id === data.lessonId) {
      mem.lastLessonAccessed.isCompleted = true;
      mem.lastLessonAccessed.timestamp = now;
    }

    mem.lastStudyActivity = {
      type: 'lesson',
      courseId: data.courseId,
      courseTitle: data.courseTitle,
      subject,
      topic,
      lessonId: data.lessonId,
      lessonTitle: data.title,
      isCompleted: true,
      timestamp: now
    };

    // Calculate next step
    if (mem.weakAreas.length > 0) {
      const topWeakness = mem.weakAreas[0];
      mem.recommendedNextStep = {
        action: 'review-weakness',
        title: `Review Weak Concept: ${topWeakness.topic}`,
        subject: topWeakness.subject,
        topic: topWeakness.topic,
        targetUrl: `tutor?subject=${encodeURIComponent(topWeakness.subject)}&topic=${encodeURIComponent(topWeakness.topic)}&mode=quiz`,
        rationale: `You mastered ${data.title}! Reinforce your diagnosed weakness in ${topWeakness.topic} to maintain top exam readiness.`
      };
    } else {
      mem.recommendedNextStep = {
        action: 'continue-subject',
        title: `Continue Mastering: ${subject}`,
        subject,
        topic,
        targetUrl: 'courses',
        rationale: `Great work finishing ${data.title}! Choose the next chapter or challenge Nora in Socratic mode.`
      };
    }

    await this.saveMemory(mem);
    return mem;
  }

  /**
   * Records a completed quiz or practice test to update cognitive memory, scores, and weak areas.
   */
  static async recordQuizOrTestCompletion(
    userId: string,
    data: {
      quizId?: string;
      subject: string;
      topic: string;
      score: number;
      totalQuestions: number;
      weakTopics: string[];
      strongTopics: string[];
      source: 'quiz' | 'practice-test';
    }
  ): Promise<StudentLearningMemory> {
    const mem = await this.getMemory(userId);
    const now = Date.now();

    mem.currentSubject = data.subject || mem.currentSubject;
    mem.currentTopic = data.topic || mem.currentTopic;

    mem.lastStudyActivity = {
      type: data.source,
      subject: data.subject,
      topic: data.topic,
      score: data.score,
      isCompleted: true,
      timestamp: now
    };

    // Process weak areas
    const updatedWeakAreas = [...mem.weakAreas];
    for (const weakTopic of data.weakTopics) {
      const existing = updatedWeakAreas.find(
        w => w.topic.toLowerCase() === weakTopic.toLowerCase() && w.subject.toLowerCase() === data.subject.toLowerCase()
      );
      if (existing) {
        existing.accuracy = data.score;
        existing.timestamp = now;
        existing.identifiedFrom = data.source;
      } else {
        updatedWeakAreas.unshift({
          topic: weakTopic,
          subject: data.subject,
          accuracy: data.score,
          identifiedFrom: data.source,
          timestamp: now
        });
      }
    }

    // If student scored high on strong topics, remove them from weak areas
    if (data.score >= 80) {
      for (const strongTopic of data.strongTopics) {
        const idx = updatedWeakAreas.findIndex(
          w => w.topic.toLowerCase() === strongTopic.toLowerCase() && w.subject.toLowerCase() === data.subject.toLowerCase()
        );
        if (idx >= 0) {
          updatedWeakAreas.splice(idx, 1);
        }
      }
    }

    mem.weakAreas = updatedWeakAreas.slice(0, 10);

    // Update recommendation based on results
    if (mem.weakAreas.length > 0) {
      const primaryWeakness = mem.weakAreas[0];
      mem.recommendedNextStep = {
        action: 'review-weakness',
        title: `Targeted Practice: ${primaryWeakness.topic}`,
        subject: primaryWeakness.subject,
        topic: primaryWeakness.topic,
        targetUrl: `tutor?subject=${encodeURIComponent(primaryWeakness.subject)}&topic=${encodeURIComponent(primaryWeakness.topic)}&mode=quiz`,
        rationale: `Diagnostic accuracy was ${data.score}%. Practicing ${primaryWeakness.topic} with Nora will quickly close this knowledge gap.`
      };
    } else {
      mem.recommendedNextStep = {
        action: 'spaced-review',
        title: 'High Score Review Session',
        subject: data.subject,
        topic: data.topic,
        targetUrl: 'review-queue',
        rationale: `Scored ${data.score}%! Your concepts are solid. Review in 3 days to lock them into long-term memory.`
      };
    }

    await this.saveMemory(mem);
    return mem;
  }

  /**
   * Records Nora AI Tutor dialogue session to keep memory informed of socratic check-ins.
   */
  static async recordTutorInteraction(
    userId: string,
    data: {
      subject: string;
      topic: string;
      mode?: string;
      weakAreaIdentified?: string;
    }
  ): Promise<StudentLearningMemory> {
    const mem = await this.getMemory(userId);
    const now = Date.now();

    mem.currentSubject = data.subject || mem.currentSubject;
    mem.currentTopic = data.topic || mem.currentTopic;

    mem.lastStudyActivity = {
      type: 'tutor',
      subject: data.subject,
      topic: data.topic,
      isCompleted: true,
      timestamp: now
    };

    if (data.weakAreaIdentified) {
      const exists = mem.weakAreas.some(w => w.topic.toLowerCase() === data.weakAreaIdentified!.toLowerCase());
      if (!exists) {
        mem.weakAreas.unshift({
          topic: data.weakAreaIdentified,
          subject: data.subject,
          identifiedFrom: 'tutor',
          timestamp: now
        });
        if (mem.weakAreas.length > 10) mem.weakAreas.pop();
      }
    }

    await this.saveMemory(mem);
    return mem;
  }

  /**
   * Pauses or resumes automated push notifications for this student.
   */
  static async pauseOrResumeReminders(userId: string, paused: boolean): Promise<boolean> {
    const mem = await this.getMemory(userId);
    mem.remindersPaused = paused;
    await this.saveMemory(mem);
    return paused;
  }

  /**
   * Retrieves automated reminder delivery history from Firestore.
   */
  static async getReminderLogs(userId?: string): Promise<AutomatedReminderLog[]> {
    try {
      let q;
      if (userId) {
        q = query(
          collection(db, 'reminderLogs'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
      } else {
        q = query(
          collection(db, 'reminderLogs'),
          orderBy('timestamp', 'desc'),
          limit(25)
        );
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    } catch (err) {
      console.warn('[LearningMemory] Firestore logs query error:', err);
      // Fallback: try fetching from server endpoint
      try {
        const res = await fetch(`/api/reminders/logs${userId ? `?userId=${userId}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          return data.logs || [];
        }
      } catch (_) {}
      return [];
    }
  }

  /**
   * Helper: Cache in localStorage for ultra-fast load
   */
  private static cacheLocally(userId: string, memory: StudentLearningMemory): void {
    try {
      localStorage.setItem(`${MEMORY_STORAGE_PREFIX}${userId}`, JSON.stringify(memory));
    } catch (_) {}
  }

  /**
   * Default schema generator for new students
   */
  private static createDefaultMemory(userId: string, userEmail?: string): StudentLearningMemory {
    return {
      userId,
      userEmail,
      currentSubject: 'African Morphology & Linguistics',
      currentTopic: 'Word Formation Processes',
      completedLessons: [],
      unfinishedLessons: [],
      weakAreas: [],
      preferredStudyTimes: ['18:00', '20:00'],
      timeZone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
      remindersPaused: false,
      recommendedNextStep: {
        action: 'continue-subject',
        title: 'Start First Lesson',
        subject: 'African Morphology & Linguistics',
        topic: 'Word Formation Processes',
        targetUrl: 'courses',
        rationale: 'Begin exploring interactive audio lessons to build your foundational knowledge.'
      },
      updatedAt: Date.now()
    };
  }
}
