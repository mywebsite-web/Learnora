import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  UserProfile, 
  StudySet, 
  StudyNote, 
  Flashcard, 
  Quiz, 
  QuizAttempt, 
  PracticeTest, 
  PracticeTestAttempt, 
  StudyPlan, 
  TutorSession, 
  TutorMessage,
  EssayFeedback,
  TeachingStyle,
  Achievement,
  NotificationItem,
  UserSubscription,
  StudentCognitiveMemory,
  TeachingEvolutionLog,
  ReviewLessonItem,
  SpacedRepetitionStage,
  AnkiRating
} from '../types';

export class DBService {
  // Helper to remove undefined fields which Firestore rejects
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

  // Profiles local cache helpers
  private static getLocalCachedProfile(uid: string): UserProfile | null {
    try {
      const raw = localStorage.getItem(`learnora_profile_${uid}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private static setLocalCachedProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(`learnora_profile_${profile.uid}`, JSON.stringify(profile));
    } catch {
      // Storage quota or private mode
    }
  }

  // Profiles
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!uid) return null;
    if (this.isUserDeletedLocally(uid)) return null;

    try {
      const snap = await getDoc(doc(db, 'profiles', uid));
      if (snap.exists()) {
        const prof = snap.data() as UserProfile;
        this.setLocalCachedProfile(prof);
        return prof;
      }
      // Document does not exist in Cloud Firestore (deleted by administrator or non-existent)
      // Check if user has tombstone; purge any stale local cache
      const isDeleted = await this.isUserDeleted(uid);
      if (isDeleted) {
        this.markUserDeletedLocally(uid);
        localStorage.removeItem(`learnora_profile_${uid}`);
      }
      return null;
    } catch (e: any) {
      // If Firestore reports permission-denied or network disconnect, check local cache only if not deleted
      if (this.isUserDeletedLocally(uid)) return null;
      const cached = this.getLocalCachedProfile(uid);
      if (cached && !this.isUserDeletedLocally(cached.uid, cached.email)) return cached;
      console.warn('Notice getting profile from cloud:', e?.message || e);
      return null;
    }
  }

  static async saveUserProfile(profile: UserProfile): Promise<void> {
    this.setLocalCachedProfile(profile);
    try {
      const data = this.cleanUndefined(profile);
      await setDoc(doc(db, 'profiles', profile.uid), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving profile (offline/retrying):', e);
    }
  }

  // Study Sets
  static async getStudySets(userId: string): Promise<StudySet[]> {
    try {
      const q = query(
        collection(db, 'studySets'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudySet));
    } catch (e) {
      try {
        const q = query(collection(db, 'studySets'), where('userId', '==', userId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudySet));
      } catch (fallbackErr) {
        console.warn('Notice loading study sets from cloud:', fallbackErr);
        return [];
      }
    }
  }

  static async getStudySet(setId: string): Promise<StudySet | null> {
    try {
      const snap = await getDoc(doc(db, 'studySets', setId));
      if (snap.exists()) return { id: snap.id, ...snap.data() } as StudySet;
      return null;
    } catch (e) {
      console.warn('Notice getting study set:', e);
      return null;
    }
  }

  static async saveStudySet(studySet: StudySet): Promise<void> {
    try {
      const data = this.cleanUndefined(studySet);
      await setDoc(doc(db, 'studySets', studySet.id), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving study set (offline/retrying):', e);
    }
  }

  static async deleteStudySet(setId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'studySets', setId));

      // Cleanup associated notes, flashcards, and quizzes in background
      const subCollections = ['notes', 'flashcards', 'quizzes', 'practiceTests'];
      for (const col of subCollections) {
        try {
          const q = query(collection(db, col), where('studySetId', '==', setId));
          const snap = await getDocs(q);
          const deletes = snap.docs.map(d => deleteDoc(d.ref));
          await Promise.allSettled(deletes);
        } catch (e) {
          console.warn(`Clean up error on ${col} for set ${setId}:`, e);
        }
      }
    } catch (err) {
      console.warn('Notice deleting study set:', err);
    }
  }

  static async deleteAllStudySets(userId: string): Promise<void> {
    try {
      const sets = await this.getStudySets(userId);
      for (const set of sets) {
        await this.deleteStudySet(set.id);
      }
    } catch (e) {
      console.warn('Notice deleting all study sets:', e);
    }
  }

  // Notes
  static async getNotes(studySetId: string): Promise<StudyNote[]> {
    try {
      const q = query(collection(db, 'notes'), where('studySetId', '==', studySetId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudyNote));
    } catch (e) {
      console.warn('Notice loading notes:', e);
      return [];
    }
  }

  static async saveNote(note: StudyNote): Promise<void> {
    try {
      const data = this.cleanUndefined(note);
      await setDoc(doc(db, 'notes', note.id), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving note (offline/retrying):', e);
    }
  }

  // Flashcards
  static async getFlashcards(studySetId: string): Promise<Flashcard[]> {
    try {
      const q = query(collection(db, 'flashcards'), where('studySetId', '==', studySetId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard));
    } catch (e) {
      console.warn('Notice loading flashcards:', e);
      return [];
    }
  }

  static async saveFlashcard(card: Flashcard): Promise<void> {
    try {
      const data = this.cleanUndefined(card);
      await setDoc(doc(db, 'flashcards', card.id), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving flashcard (offline/retrying):', e);
    }
  }

  static async updateFlashcardMastery(cardId: string, mastery: 'new' | 'learning' | 'mastered', isCorrect: boolean): Promise<void> {
    try {
      const cardRef = doc(db, 'flashcards', cardId);
      const snap = await getDoc(cardRef);
      if (!snap.exists()) return;
      const data = snap.data() as Flashcard;
      const timesReviewed = (data.timesReviewed || 0) + 1;
      const timesCorrect = (data.timesCorrect || 0) + (isCorrect ? 1 : 0);
      const timesMissed = (data.timesMissed || 0) + (isCorrect ? 0 : 1);
      
      // Spaced repetition interval calculation
      let nextIntervalDays = 1;
      if (isCorrect) {
        if (mastery === 'mastered') nextIntervalDays = 7;
        else if (mastery === 'learning') nextIntervalDays = 3;
      }

      await updateDoc(cardRef, {
        mastery,
        timesReviewed,
        timesCorrect,
        timesMissed,
        intervalDays: nextIntervalDays,
        nextReviewDate: Date.now() + (nextIntervalDays * 24 * 60 * 60 * 1000)
      });
    } catch (e) {
      console.warn('Notice updating flashcard mastery:', e);
    }
  }

  // Quizzes
  static async getQuizzes(studySetId: string): Promise<Quiz[]> {
    try {
      const q = query(collection(db, 'quizzes'), where('studySetId', '==', studySetId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));
    } catch (e) {
      console.warn('Notice loading quizzes:', e);
      return [];
    }
  }

  static async saveQuiz(quiz: Quiz): Promise<void> {
    try {
      const data = this.cleanUndefined(quiz);
      await setDoc(doc(db, 'quizzes', quiz.id), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving quiz:', e);
    }
  }

  static async saveQuizAttempt(attempt: QuizAttempt): Promise<void> {
    try {
      const data = this.cleanUndefined(attempt);
      await setDoc(doc(db, 'quizAttempts', attempt.id), data);
    } catch (e) {
      console.warn('Notice saving quiz attempt:', e);
    }
  }

  static async getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    try {
      const q = query(collection(db, 'quizAttempts'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizAttempt));
    } catch (e) {
      console.warn('Notice loading quiz attempts:', e);
      return [];
    }
  }

  // Practice Tests
  static async getPracticeTests(studySetId: string): Promise<PracticeTest[]> {
    try {
      const q = query(collection(db, 'practiceTests'), where('studySetId', '==', studySetId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as PracticeTest));
    } catch (e) {
      console.warn('Notice loading practice tests:', e);
      return [];
    }
  }

  static async savePracticeTest(test: PracticeTest): Promise<void> {
    try {
      const data = this.cleanUndefined(test);
      await setDoc(doc(db, 'practiceTests', test.id), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving practice test:', e);
    }
  }

  static async saveTestAttempt(attempt: PracticeTestAttempt): Promise<void> {
    try {
      const data = this.cleanUndefined(attempt);
      await setDoc(doc(db, 'testAttempts', attempt.id), data);
    } catch (e) {
      console.warn('Notice saving test attempt:', e);
    }
  }

  // Study Plans
  static async getStudyPlans(userId: string): Promise<StudyPlan[]> {
    try {
      const q = query(collection(db, 'studyPlans'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudyPlan));
    } catch (e) {
      console.warn('Notice loading study plans:', e);
      return [];
    }
  }

  static async saveStudyPlan(plan: StudyPlan): Promise<void> {
    try {
      const data = this.cleanUndefined(plan);
      await setDoc(doc(db, 'studyPlans', plan.id), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving study plan:', e);
    }
  }

  static async deleteStudyPlan(planId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'studyPlans', planId));
    } catch (e) {
      console.warn('Notice deleting study plan:', e);
    }
  }

  // Tutor Messages & Sessions
  static async getTutorSessions(userId: string): Promise<TutorSession[]> {
    try {
      const q = query(collection(db, 'tutorSessions'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as TutorSession));
    } catch (e) {
      console.warn('Notice loading tutor sessions:', e);
      return [];
    }
  }

  static async saveTutorSession(session: TutorSession): Promise<void> {
    try {
      const data = this.cleanUndefined(session);
      await setDoc(doc(db, 'tutorSessions', session.id), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving tutor session:', e);
    }
  }

  static async deleteTutorSession(sessionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'tutorSessions', sessionId));
      await this.clearTutorMessages(sessionId);
    } catch (e) {
      console.warn('Notice deleting tutor session:', e);
    }
  }

  static async getTutorMessages(sessionId: string): Promise<TutorMessage[]> {
    try {
      const q = query(collection(db, 'tutorMessages'), where('sessionId', '==', sessionId));
      const snap = await getDocs(q);
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as TutorMessage));
      return msgs.sort((a, b) => a.timestamp - b.timestamp);
    } catch (e) {
      console.warn('Notice loading tutor messages:', e);
      return [];
    }
  }

  static async saveTutorMessage(msg: TutorMessage): Promise<void> {
    try {
      const data = this.cleanUndefined(msg);
      await setDoc(doc(db, 'tutorMessages', msg.id), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving tutor message:', e);
    }
  }

  static async clearTutorMessages(sessionId: string): Promise<void> {
    try {
      const q = query(collection(db, 'tutorMessages'), where('sessionId', '==', sessionId));
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (e) {
      console.warn('Notice clearing tutor messages:', e);
    }
  }

  // Essay Feedback
  static async getEssays(userId: string): Promise<EssayFeedback[]> {
    try {
      const q = query(collection(db, 'essays'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as EssayFeedback));
    } catch (e) {
      console.warn('Notice loading essays:', e);
      return [];
    }
  }

  static async saveEssay(essay: EssayFeedback): Promise<void> {
    try {
      const data = this.cleanUndefined(essay);
      await setDoc(doc(db, 'essays', essay.id), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving essay:', e);
    }
  }

  // Teaching Styles
  static async getTeachingStyles(userId: string): Promise<TeachingStyle[]> {
    try {
      const q = query(collection(db, 'teachingStyles'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as TeachingStyle));
    } catch (e) {
      console.warn('Notice loading teaching styles:', e);
      return [];
    }
  }

  static async saveTeachingStyle(style: TeachingStyle): Promise<void> {
    try {
      const data = this.cleanUndefined(style);
      await setDoc(doc(db, 'teachingStyles', style.id), data, { merge: true });
    } catch (e) {
      console.warn('Notice saving teaching style:', e);
    }
  }

  // Cognitive Memory & AI Self-Improvement
  static async getCognitiveMemory(userId: string): Promise<StudentCognitiveMemory> {
    const cleanUid = userId || 'guest';
    
    // First check local backup
    let localMemory: StudentCognitiveMemory | null = null;
    try {
      const local = localStorage.getItem(`learnora_cog_mem_${cleanUid}`);
      if (local) localMemory = JSON.parse(local);
    } catch {}

    try {
      const snap = await getDoc(doc(db, 'cognitiveMemories', cleanUid));
      if (snap.exists()) {
        const remoteData = snap.data() as StudentCognitiveMemory;
        try {
          localStorage.setItem(`learnora_cog_mem_${cleanUid}`, JSON.stringify(remoteData));
        } catch {}
        return remoteData;
      }
    } catch (e) {
      console.warn('Could not fetch cognitive memory from Firestore, using local fallback:', e);
      if (localMemory) return localMemory;
    }

    if (localMemory) return localMemory;

    const defaultMemory: StudentCognitiveMemory = {
      id: cleanUid,
      userId: cleanUid,
      learnedKnowledgeGaps: [],
      demonstratedStrengths: [],
      preferredExplanations: {
        usesAnalogies: true,
        technicalDepth: 'balanced',
        pacingSpeed: 'standard',
        effectiveHooks: ['Intuitive analogies', 'Step-by-step conceptual walkthroughs']
      },
      recurringMistakesCount: {},
      noraPedagogicalStrategy: {
        strategyName: 'Baseline Adaptive Socratic Mentorship',
        focusAreas: ['Active diagnostic questioning', 'Continuous scaffolding'],
        recentSelfAdjustment: 'Initialized adaptive cognitive baseline to track student learning behaviors.',
        adaptationLevel: 1,
        totalInteractionsReflected: 0
      },
      lastSelfReflectionAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem(`learnora_cog_mem_${cleanUid}`, JSON.stringify(defaultMemory));
    } catch {}

    try {
      await setDoc(doc(db, 'cognitiveMemories', cleanUid), defaultMemory);
    } catch (err) {
      console.warn('Notice: Firestore cognitive memory write fell back to local cache:', err);
    }

    return defaultMemory;
  }

  static async saveCognitiveMemory(memory: StudentCognitiveMemory): Promise<void> {
    const cleanUid = memory.userId || memory.id || 'guest';
    const data = this.cleanUndefined({ ...memory, id: cleanUid, userId: cleanUid });
    try {
      localStorage.setItem(`learnora_cog_mem_${cleanUid}`, JSON.stringify(data));
    } catch {}

    try {
      await setDoc(doc(db, 'cognitiveMemories', cleanUid), data, { merge: true });
    } catch (err) {
      console.warn('Notice: Firestore saveCognitiveMemory fell back to local persistence:', err);
    }
  }

  static async recordTeachingEvolutionLog(log: TeachingEvolutionLog): Promise<void> {
    const data = this.cleanUndefined(log);
    try {
      const existing = localStorage.getItem(`learnora_evo_logs_${log.userId}`);
      const logs = existing ? JSON.parse(existing) : [];
      logs.unshift(data);
      localStorage.setItem(`learnora_evo_logs_${log.userId}`, JSON.stringify(logs.slice(0, 50)));
    } catch {}

    try {
      await setDoc(doc(db, 'teachingEvolutionLogs', log.id), data);
    } catch (err) {
      console.warn('Notice: Firestore recordTeachingEvolutionLog fell back to local storage:', err);
    }
  }

  static async getTeachingEvolutionLogs(userId: string): Promise<TeachingEvolutionLog[]> {
    try {
      const q = query(
        collection(db, 'teachingEvolutionLogs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as TeachingEvolutionLog));
    } catch (e) {
      try {
        const q = query(collection(db, 'teachingEvolutionLogs'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as TeachingEvolutionLog));
        return items.sort((a, b) => b.timestamp - a.timestamp);
      } catch (err) {
        const local = localStorage.getItem(`learnora_evo_logs_${userId}`);
        return local ? JSON.parse(local) : [];
      }
    }
  }

  // Notifications
  static async getNotifications(userId: string): Promise<NotificationItem[]> {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationItem));
  }

  static async saveNotification(notif: NotificationItem): Promise<void> {
    const data = this.cleanUndefined(notif);
    await setDoc(doc(db, 'notifications', notif.id), data);
  }

  static async markNotificationRead(notifId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  }

  // Subscriptions & Usage
  static async getUserSubscription(userId: string): Promise<UserSubscription> {
    const snap = await getDoc(doc(db, 'subscriptions', userId));
    if (snap.exists()) return snap.data() as UserSubscription;
    // Default free plan
    const defaultSub: UserSubscription = {
      userId,
      plan: 'free',
      status: 'active',
      renewalDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      limits: {
        monthlyGenerations: 50,
        fileUploadsRemaining: 15,
        audioLessonsRemaining: 5,
        storageUsedMB: 2.5,
        storageLimitMB: 100
      }
    };
    await setDoc(doc(db, 'subscriptions', userId), defaultSub);
    return defaultSub;
  }

  // Admin Portal Methods (Restricted to adedayoademola171@gmail.com)
  static async getAllUsers(): Promise<UserProfile[]> {
    const userMap = new Map<string, UserProfile>();

    // 0. Load tombstone registries of deleted users
    const deletedUids = new Set<string>();
    const deletedEmails = new Set<string>();

    try {
      const rawUids = localStorage.getItem('learnora_deleted_uids');
      if (rawUids) (JSON.parse(rawUids) as string[]).forEach(id => deletedUids.add(id));
      const rawEmails = localStorage.getItem('learnora_deleted_emails');
      if (rawEmails) (JSON.parse(rawEmails) as string[]).forEach(em => deletedEmails.add(em.toLowerCase().trim()));
    } catch {}

    try {
      const deletedSnap = await getDocs(collection(db, 'deleted_users'));
      deletedSnap.docs.forEach(d => {
        deletedUids.add(d.id);
        const data = d.data();
        if (data?.email) deletedEmails.add(data.email.toLowerCase().trim());
      });
    } catch {}

    const isRecordDeleted = (uid?: string, email?: string) => {
      if (uid && deletedUids.has(uid)) return true;
      if (email && deletedEmails.has(email.toLowerCase().trim())) return true;
      if (uid && (uid === 'usr_y0na13' || uid === 'demo_user') && (deletedUids.has('usr_y0na13') || deletedEmails.has('alex.morgan@learnora.app'))) return true;
      if (email && email.toLowerCase().trim() === 'alex.morgan@learnora.app' && (deletedUids.has('usr_y0na13') || deletedEmails.has('alex.morgan@learnora.app'))) return true;
      return false;
    };

    // 1. Fetch from Cloud Firestore
    try {
      const q = query(collection(db, 'profiles'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      snap.docs.forEach(d => {
        const prof = { uid: d.id, ...d.data() } as UserProfile;
        if (!isRecordDeleted(prof.uid, prof.email)) {
          userMap.set(prof.uid, prof);
        }
      });
    } catch (e) {
      console.warn('Fallback fetching profiles without orderBy:', e);
      try {
        const snap = await getDocs(collection(db, 'profiles'));
        snap.docs.forEach(d => {
          const prof = { uid: d.id, ...d.data() } as UserProfile;
          if (!isRecordDeleted(prof.uid, prof.email)) {
            userMap.set(prof.uid, prof);
          }
        });
      } catch (fallbackErr) {
        console.warn('Could not read Firestore profiles:', fallbackErr);
      }
    }

    // 2. Supplement with any cached local profiles in browser storage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('learnora_profile_')) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const prof = JSON.parse(raw) as UserProfile;
              if (prof && prof.uid && !isRecordDeleted(prof.uid, prof.email) && !userMap.has(prof.uid)) {
                userMap.set(prof.uid, prof);
              }
            }
          } catch {}
        }
      }
    } catch {}

    // 3. Supplement with any locally registered accounts (purging deleted ones)
    try {
      const rawAccounts = localStorage.getItem('learnora_registered_accounts');
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        let accountsModified = false;
        Object.entries(accounts).forEach(([em, acc]: [string, any]) => {
          if (isRecordDeleted(acc?.uid, acc?.email || em)) {
            delete accounts[em];
            accountsModified = true;
            return;
          }
          if (acc?.uid && !userMap.has(acc.uid)) {
            userMap.set(acc.uid, {
              uid: acc.uid,
              email: acc.email,
              displayName: acc.displayName || acc.email.split('@')[0],
              educationLevel: 'University',
              proficiencyLevel: 'Intermediate',
              primaryGoal: 'Understand classes',
              learningStyles: ['Interactive tutoring', 'Flashcards'],
              dailyStudyTime: '1 hour',
              tutorNickname: (acc.displayName || 'Learner').split(' ')[0],
              onboardingCompleted: true,
              streakDays: 1,
              totalStudyMinutes: 0,
              points: 100,
              createdAt: acc.createdAt || Date.now(),
              updatedAt: acc.createdAt || Date.now(),
              status: acc.status || 'active',
              role: acc.role || 'student'
            });
          }
        });
        if (accountsModified) {
          localStorage.setItem('learnora_registered_accounts', JSON.stringify(accounts));
        }
      }
    } catch {}

    // Convert map values to list (deduplicating by BOTH uid AND normalized email, strictly filtering deleted)
    const uniqueUsers: UserProfile[] = [];
    const seenUids = new Set<string>();
    const seenEmails = new Set<string>();

    userMap.forEach((prof) => {
      if (!prof || !prof.uid) return;
      const cleanEmail = prof.email ? prof.email.toLowerCase().trim() : '';

      if (isRecordDeleted(prof.uid, cleanEmail)) return;
      if (prof.displayName === 'Alex Morgan' && (deletedUids.has('usr_y0na13') || deletedEmails.has('alex.morgan@learnora.app') || isRecordDeleted(prof.uid, 'alex.morgan@learnora.app'))) {
        return;
      }

      if (seenUids.has(prof.uid)) return;
      if (cleanEmail && seenEmails.has(cleanEmail)) return;

      seenUids.add(prof.uid);
      if (cleanEmail) seenEmails.add(cleanEmail);
      uniqueUsers.push(prof);
    });

    return uniqueUsers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  static async updateUserByAdmin(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const data = this.cleanUndefined({
      ...updates,
      updatedAt: Date.now()
    });

    // 1. Cloud Firestore write with setDoc merge
    try {
      await setDoc(doc(db, 'profiles', uid), data, { merge: true });
    } catch (e) {
      console.warn('Notice updating cloud profile:', e);
    }

    // 2. Update local cached profile
    try {
      const cached = this.getLocalCachedProfile(uid);
      if (cached) {
        this.setLocalCachedProfile({ ...cached, ...updates, updatedAt: Date.now() });
      }
    } catch {}

    // 3. Update registered accounts storage if applicable
    try {
      const rawAccounts = localStorage.getItem('learnora_registered_accounts');
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        let modified = false;
        for (const email of Object.keys(accounts)) {
          if (accounts[email].uid === uid) {
            if (updates.status) accounts[email].status = updates.status;
            modified = true;
          }
        }
        if (modified) {
          localStorage.setItem('learnora_registered_accounts', JSON.stringify(accounts));
        }
      }
    } catch {}

    // 4. If status changed, manage suspended uids registry & broadcast immediately
    if (updates.status) {
      try {
        const rawSuspended = localStorage.getItem('learnora_suspended_uids');
        const suspendedList: string[] = rawSuspended ? JSON.parse(rawSuspended) : [];
        if (updates.status === 'suspended') {
          if (!suspendedList.includes(uid)) {
            suspendedList.push(uid);
          }
        } else if (updates.status === 'active') {
          const idx = suspendedList.indexOf(uid);
          if (idx !== -1) suspendedList.splice(idx, 1);
        }
        localStorage.setItem('learnora_suspended_uids', JSON.stringify(suspendedList));
      } catch {}

      const eventPayload = {
        uid,
        status: updates.status,
        reason: updates.suspensionReason || null,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem('learnora_last_suspension_event', JSON.stringify(eventPayload));
      } catch {}

      try {
        window.dispatchEvent(new CustomEvent('learnora_user_status_changed', { detail: eventPayload }));
      } catch {}
    }
  }

  /**
   * Updates a user's real-time online presence and last active timestamp.
   * Updates Firestore, local profile cache, and notifies backend heartbeat endpoint.
   */
  static async updateUserPresence(uid: string, isOnline: boolean = true): Promise<void> {
    if (!uid) return;

    // Strict guard: if user was deleted locally, permanently remove from presence and abort
    if (this.isUserDeletedLocally(uid)) {
      try {
        await deleteDoc(doc(db, 'presence', uid));
        localStorage.removeItem(`learnora_profile_${uid}`);
      } catch {}
      return;
    }

    const now = Date.now();

    // 1. Update Firestore profile doc
    try {
      const userRef = doc(db, 'profiles', uid);
      await updateDoc(userRef, {
        lastActiveAt: now,
        isOnline,
        updatedAt: now
      });
    } catch {
      // Non-blocking if offline or permission denied
    }

    // 2. Update local cached profile
    try {
      const cached = this.getLocalCachedProfile(uid);
      if (cached) {
        cached.lastActiveAt = now;
        cached.isOnline = isOnline;
        this.setLocalCachedProfile(cached);
      }
    } catch {}

    // 3. Post to backend presence heartbeat
    try {
      fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, isOnline, timestamp: now })
      }).catch(() => {});
    } catch {}
  }

  /**
   * Fast synchronous check against cached tombstone lists
   */
  static isUserDeletedLocally(uid?: string, email?: string): boolean {
    if (!uid && !email) return false;
    try {
      // Demo Persona special case
      if (uid === 'usr_y0na13' || uid === 'demo_user' || email?.toLowerCase().trim() === 'alex.morgan@learnora.app') {
        const rawUids = localStorage.getItem('learnora_deleted_uids');
        const rawEmails = localStorage.getItem('learnora_deleted_emails');
        if (
          (rawUids && (JSON.parse(rawUids).includes('usr_y0na13') || JSON.parse(rawUids).includes('demo_user'))) ||
          (rawEmails && JSON.parse(rawEmails).includes('alex.morgan@learnora.app'))
        ) {
          return true;
        }
      }

      if (uid) {
        const rawUids = localStorage.getItem('learnora_deleted_uids');
        if (rawUids) {
          const list: string[] = JSON.parse(rawUids);
          if (list.includes(uid)) return true;
        }
      }
      if (email) {
        const clean = email.toLowerCase().trim();
        const rawEmails = localStorage.getItem('learnora_deleted_emails');
        if (rawEmails) {
          const list: string[] = JSON.parse(rawEmails);
          if (list.includes(clean)) return true;
        }
      }
    } catch {}
    return false;
  }

  /**
   * Records a user as permanently deleted in local device registry and purges local caches
   */
  static markUserDeletedLocally(uid?: string, email?: string, displayName?: string): void {
    try {
      const cleanEmail = email ? email.toLowerCase().trim() : undefined;
      const isAlexMorgan = cleanEmail === 'alex.morgan@learnora.app' || displayName === 'Alex Morgan' || uid === 'usr_y0na13';

      const uidsToAdd = uid ? [uid] : [];
      if (isAlexMorgan) {
        if (!uidsToAdd.includes('usr_y0na13')) uidsToAdd.push('usr_y0na13');
        if (!uidsToAdd.includes('demo_user')) uidsToAdd.push('demo_user');
      }

      const rawUids = localStorage.getItem('learnora_deleted_uids');
      const listUids: string[] = rawUids ? JSON.parse(rawUids) : [];
      for (const u of uidsToAdd) {
        if (!listUids.includes(u)) listUids.push(u);
        localStorage.removeItem(`learnora_profile_${u}`);
      }
      localStorage.setItem('learnora_deleted_uids', JSON.stringify(listUids));

      const rawEmails = localStorage.getItem('learnora_deleted_emails');
      const listEmails: string[] = rawEmails ? JSON.parse(rawEmails) : [];
      if (cleanEmail && !listEmails.includes(cleanEmail)) {
        listEmails.push(cleanEmail);
      }
      if (isAlexMorgan && !listEmails.includes('alex.morgan@learnora.app')) {
        listEmails.push('alex.morgan@learnora.app');
      }
      localStorage.setItem('learnora_deleted_emails', JSON.stringify(listEmails));

      // Deep purge from all local profile caches
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('learnora_profile_')) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const prof = JSON.parse(raw);
              if (
                (uid && prof.uid === uid) ||
                (cleanEmail && prof.email?.toLowerCase().trim() === cleanEmail) ||
                (displayName && prof.displayName?.toLowerCase().trim() === displayName.toLowerCase().trim()) ||
                (isAlexMorgan && (prof.uid === 'usr_y0na13' || prof.displayName === 'Alex Morgan' || prof.email?.toLowerCase().trim() === 'alex.morgan@learnora.app'))
              ) {
                localStorage.removeItem(key);
              }
            }
          } catch {}
        }
      }

      // Purge from local registered accounts
      const rawAccounts = localStorage.getItem('learnora_registered_accounts');
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        let modified = false;
        for (const accKey of Object.keys(accounts)) {
          const acc = accounts[accKey];
          if (
            (uid && acc?.uid === uid) ||
            (cleanEmail && (accKey === cleanEmail || acc?.email?.toLowerCase().trim() === cleanEmail)) ||
            (isAlexMorgan && (accKey === 'alex.morgan@learnora.app' || acc?.displayName === 'Alex Morgan'))
          ) {
            delete accounts[accKey];
            modified = true;
          }
        }
        if (modified) {
          localStorage.setItem('learnora_registered_accounts', JSON.stringify(accounts));
        }
      }

      // Purge local active session if matching
      const stored = localStorage.getItem('learnora_local_session');
      if (stored) {
        const sess = JSON.parse(stored);
        if (
          (uid && sess.uid === uid) ||
          (cleanEmail && sess.email?.toLowerCase().trim() === cleanEmail) ||
          (isAlexMorgan && (sess.uid === 'usr_y0na13' || sess.displayName === 'Alex Morgan' || sess.email?.toLowerCase().trim() === 'alex.morgan@learnora.app'))
        ) {
          localStorage.removeItem('learnora_local_session');
        }
      }
    } catch {}
  }

  /**
   * Verifies if a user or email is permanently blacklisted/deleted across local cache and Cloud Firestore tombstones
   */
  static async isUserDeleted(uid?: string, email?: string): Promise<boolean> {
    if (!uid && !email) return false;

    // 1. Fast local tombstone check
    if (this.isUserDeletedLocally(uid, email)) {
      return true;
    }

    // 2. Cloud Firestore UID tombstone check
    if (uid) {
      try {
        const uSnap = await getDoc(doc(db, 'deleted_users', uid));
        if (uSnap.exists()) {
          this.markUserDeletedLocally(uid, email);
          return true;
        }
      } catch {}
    }

    // 3. Cloud Firestore Email tombstone check
    if (email) {
      try {
        const cleanEmail = email.toLowerCase().trim();
        const eSnap = await getDoc(doc(db, 'deleted_emails', cleanEmail));
        if (eSnap.exists()) {
          this.markUserDeletedLocally(uid, cleanEmail);
          return true;
        }
      } catch {}
    }

    return false;
  }

  /**
   * Complete multi-collection deletion and permanent account eradication by an administrator.
   * Completely purges profiles, study sets, flashcards, tutor sessions, cognitive memory, push tokens,
   * creates permanent Cloud & local tombstones, terminates active sessions, and broadcasts real-time deletion.
   */
  static async deleteUserByAdmin(uid: string, targetEmail?: string, targetDisplayName?: string): Promise<void> {
    const cleanEmail = targetEmail ? targetEmail.toLowerCase().trim() : undefined;
    const isAlexMorgan = cleanEmail === 'alex.morgan@learnora.app' || targetDisplayName === 'Alex Morgan' || uid === 'usr_y0na13';

    // 1. Write permanent tombstone to Cloud Firestore
    try {
      await setDoc(doc(db, 'deleted_users', uid), {
        uid,
        email: cleanEmail || '',
        displayName: targetDisplayName || '',
        deletedAt: Date.now(),
        reason: 'Account permanently removed by administrator.'
      });
      if (cleanEmail) {
        await setDoc(doc(db, 'deleted_emails', cleanEmail), {
          email: cleanEmail,
          uid,
          deletedAt: Date.now()
        });
      }
      if (isAlexMorgan) {
        await setDoc(doc(db, 'deleted_users', 'usr_y0na13'), {
          uid: 'usr_y0na13',
          email: 'alex.morgan@learnora.app',
          displayName: 'Alex Morgan',
          deletedAt: Date.now(),
          reason: 'Demo persona permanently removed by administrator.'
        });
        await setDoc(doc(db, 'deleted_emails', 'alex.morgan@learnora.app'), {
          email: 'alex.morgan@learnora.app',
          uid: 'usr_y0na13',
          deletedAt: Date.now()
        });
      }
    } catch (tombErr) {
      console.warn('Notice writing deletion tombstone:', tombErr);
    }

    // 2. Mark locally & purge local browser storage
    this.markUserDeletedLocally(uid, cleanEmail, targetDisplayName);

    // 3. Purge profile, presence, cognitive memory, and review queue documents
    const singleDocs = [
      doc(db, 'profiles', uid),
      doc(db, 'presence', uid),
      doc(db, 'reviewQueues', uid),
      doc(db, 'cognitiveMemories', uid)
    ];
    if (isAlexMorgan) {
      singleDocs.push(
        doc(db, 'profiles', 'usr_y0na13'),
        doc(db, 'presence', 'usr_y0na13'),
        doc(db, 'reviewQueues', 'usr_y0na13'),
        doc(db, 'cognitiveMemories', 'usr_y0na13')
      );
    }
    await Promise.allSettled(singleDocs.map(d => deleteDoc(d)));

    // 3b. Purge any matching presence records in Firestore
    try {
      const pSnap = await getDocs(collection(db, 'presence'));
      const deletes: Promise<any>[] = [];
      pSnap.forEach((d) => {
        const data = d.data();
        if (
          d.id === uid ||
          (cleanEmail && data?.email?.toLowerCase().trim() === cleanEmail) ||
          (isAlexMorgan && (d.id === 'usr_y0na13' || data?.displayName === 'Alex Morgan' || data?.email === 'alex.morgan@learnora.app'))
        ) {
          deletes.push(deleteDoc(d.ref));
        }
      });
      await Promise.allSettled(deletes);
    } catch {}

    // 4. Purge all study sets, flashcards, notes, quizzes, tests
    try {
      await this.deleteAllStudySets(uid);
      if (isAlexMorgan && uid !== 'usr_y0na13') {
        await this.deleteAllStudySets('usr_y0na13');
      }
    } catch (e) {
      console.warn('Notice deleting study sets:', e);
    }

    // 5. Purge user-level collections in Firestore
    const userCollections = ['tutorSessions', 'studyPlans', 'quizAttempts', 'notifications', 'practiceTests'];
    const uidsToPurge = [uid];
    if (isAlexMorgan && uid !== 'usr_y0na13') uidsToPurge.push('usr_y0na13');

    for (const targetUid of uidsToPurge) {
      for (const col of userCollections) {
        try {
          const q = query(collection(db, col), where('userId', '==', targetUid));
          const snap = await getDocs(q);
          const deletes = snap.docs.map(d => deleteDoc(d.ref));
          await Promise.allSettled(deletes);
        } catch (colErr) {
          console.warn(`Notice purging user collection ${col}:`, colErr);
        }
      }
    }

    // 6. Notify server backend to purge presence, push device tokens, and memory
    try {
      await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email: cleanEmail, displayName: targetDisplayName })
      });
    } catch (serverErr) {
      console.warn('Notice notifying server of deletion:', serverErr);
    }

    // 7. Real-time Cross-tab and window broadcast to terminate any active session immediately
    const eventPayload = {
      uid,
      email: cleanEmail,
      displayName: targetDisplayName,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('learnora_last_deletion_event', JSON.stringify(eventPayload));
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent('learnora_user_deleted', { detail: eventPayload }));
    } catch {}
  }

  static async getPlatformStats(): Promise<{
    totalUsers: number;
    totalStudySets: number;
    totalFlashcards: number;
    proUsers: number;
    activeUsers: number;
  }> {
    try {
      const [profilesSnap, setsSnap, cardsSnap] = await Promise.all([
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'studySets')),
        getDocs(collection(db, 'flashcards'))
      ]);

      const users = profilesSnap.docs.map(d => d.data() as UserProfile);
      const proUsers = users.filter(u => u.tier === 'pro' || u.tier === 'elite').length;
      const activeUsers = users.filter(u => u.status !== 'suspended').length;

      return {
        totalUsers: profilesSnap.size,
        totalStudySets: setsSnap.size,
        totalFlashcards: cardsSnap.size,
        proUsers,
        activeUsers
      };
    } catch (e) {
      console.error('Error fetching platform stats:', e);
      return {
        totalUsers: 1,
        totalStudySets: 0,
        totalFlashcards: 0,
        proUsers: 0,
        activeUsers: 1
      };
    }
  }
}
