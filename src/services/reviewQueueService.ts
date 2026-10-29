import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ReviewLessonItem, SpacedRepetitionStage, AnkiRating } from '../types';
import { NotificationService } from './notificationService';

const STORAGE_PREFIX = 'learnora_review_queue_';
const DELETED_KEY_PREFIX = 'learnora_review_queue_deleted_';
const INITIALIZED_KEY_PREFIX = 'learnora_review_queue_initialized_';

export class ReviewQueueService {
  /**
   * Retrieves the set of item IDs that the user has deleted
   */
  static getDeletedIds(userId: string): Set<string> {
    if (!userId) return new Set();
    try {
      const raw = localStorage.getItem(`${DELETED_KEY_PREFIX}${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch (e) {
      console.warn('Error reading deleted review IDs:', e);
    }
    return new Set();
  }

  /**
   * Persists the deleted item IDs to local storage
   */
  static saveDeletedIdsLocally(userId: string, deletedSet: Set<string>): void {
    if (!userId) return;
    try {
      localStorage.setItem(`${DELETED_KEY_PREFIX}${userId}`, JSON.stringify(Array.from(deletedSet)));
    } catch (e) {
      console.warn('Error saving deleted review IDs:', e);
    }
  }

  /**
   * Checks whether the user's queue has been initialized at least once
   */
  static isQueueInitializedLocally(userId: string): boolean {
    if (!userId) return false;
    try {
      return (
        localStorage.getItem(`${INITIALIZED_KEY_PREFIX}${userId}`) === 'true' ||
        localStorage.getItem(`${STORAGE_PREFIX}${userId}`) !== null
      );
    } catch {
      return false;
    }
  }

  /**
   * Marks the user's queue as initialized locally
   */
  static markQueueInitializedLocally(userId: string): void {
    if (!userId) return;
    try {
      localStorage.setItem(`${INITIALIZED_KEY_PREFIX}${userId}`, 'true');
    } catch {}
  }

  /**
   * Generates default realistic seed review lessons simulating completions 1, 3, and 7 days ago
   */
  static getInitialSeedItems(userId: string): ReviewLessonItem[] {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return [
      {
        id: `rev-seed-1d-${userId.slice(0, 6)}`,
        userId,
        title: 'Cellular Respiration & The Krebs Cycle',
        subject: 'Molecular Biology',
        lessonType: 'interactive-lesson',
        completedAt: now - (1 * oneDayMs + 1000 * 60 * 45), // completed ~1 day ago
        repetitionStage: 1, // Stage 1: Day 1 Review
        targetIntervalDays: 1,
        nextReviewDate: now - 1000 * 60 * 30, // Overdue by 30 mins -> Due Now!
        easeFactor: 2.5,
        timesReviewed: 0,
        timesCorrect: 0,
        timesAgain: 0,
        retentionScore: 82,
        keyConcepts: ['Glycolysis', 'Acetyl-CoA', 'NADH/FADH2 Electron Transfer', 'ATP Synthase'],
        summarySnippet: 'Detailed walkthrough of mitochondrial respiration, from glucose conversion in the cytoplasm through oxidative phosphorylation in the inner cristae.',
        promptQuestion: 'What is the primary role of NAD+ in cellular respiration, and why does an absence of oxygen halt the Krebs cycle?',
        promptAnswer: 'NAD+ acts as a primary electron carrier, oxidizing substrate intermediates. Without oxygen as the terminal electron acceptor in the electron transport chain, NADH cannot donate electrons to regenerate NAD+, depleting the coenzyme pool and stalling the Krebs cycle.'
      },
      {
        id: `rev-seed-3d-${userId.slice(0, 6)}`,
        userId,
        title: 'Microeconomics: Price Elasticity & Market Equilibrium',
        subject: 'Economics',
        lessonType: 'quiz',
        completedAt: now - (3 * oneDayMs + 1000 * 60 * 120), // completed ~3 days ago
        repetitionStage: 2, // Stage 2: Day 3 Review
        targetIntervalDays: 3,
        nextReviewDate: now - 1000 * 60 * 90, // Due Now!
        easeFactor: 2.45,
        timesReviewed: 1,
        timesCorrect: 1,
        timesAgain: 0,
        retentionScore: 71,
        keyConcepts: ['Price Elasticity of Demand', 'Cross-Price Elasticity', 'Deadweight Loss', 'Consumer Surplus'],
        summarySnippet: 'Analysis of how price changes shift quantity demanded across necessity vs luxury goods using midpoint percentage formulas.',
        promptQuestion: 'How does the absolute value of Price Elasticity (|Ed|) distinguish elastic, inelastic, and unit-elastic demand curves?',
        promptAnswer: '|Ed| > 1 indicates Elastic demand (quantity changes proportionally more than price). |Ed| < 1 indicates Inelastic demand (consumers are less responsive to price). |Ed| = 1 indicates Unit Elastic demand (total revenue remains constant).'
      },
      {
        id: `rev-seed-7d-${userId.slice(0, 6)}`,
        userId,
        title: 'Calculus: Integration by Parts & Differential Equations',
        subject: 'Mathematics',
        lessonType: 'study-set',
        completedAt: now - (7 * oneDayMs + 1000 * 60 * 180), // completed ~7 days ago
        repetitionStage: 3, // Stage 3: Day 7 Review
        targetIntervalDays: 7,
        nextReviewDate: now - 1000 * 60 * 15, // Due Now!
        easeFactor: 2.6,
        timesReviewed: 2,
        timesCorrect: 2,
        timesAgain: 0,
        retentionScore: 59,
        keyConcepts: ['Product Rule Inversion', 'LIATE Rule for u Selection', 'Tabular Integration', 'Boundary Conditions'],
        summarySnippet: 'Standard methods for evaluating integrals of products of polynomial, exponential, and trigonometric functions.',
        promptQuestion: 'State the Integration by Parts formula and explain the LIATE guideline for choosing "u".',
        promptAnswer: 'Formula: ∫ u dv = u*v - ∫ v du. LIATE stands for Logarithmic, Inverse trig, Algebraic, Trigonometric, and Exponential; choose u according to whichever function appears highest in this priority list.'
      },
      {
        id: `rev-seed-today-${userId.slice(0, 6)}`,
        userId,
        title: 'Computer Architecture: Cache Coherence & MESI Protocol',
        subject: 'Computer Science',
        lessonType: 'flashcards',
        completedAt: now - 1000 * 60 * 60 * 3, // completed 3 hours ago
        repetitionStage: 1,
        targetIntervalDays: 1,
        nextReviewDate: now + (oneDayMs - 1000 * 60 * 60 * 3), // Due in ~21 hours (Tomorrow)
        easeFactor: 2.5,
        timesReviewed: 0,
        timesCorrect: 0,
        timesAgain: 0,
        retentionScore: 95,
        keyConcepts: ['Modified (M)', 'Exclusive (E)', 'Shared (S)', 'Invalid (I)', 'Bus Snooping'],
        summarySnippet: 'Mechanisms ensuring multiple processor caches maintain a single coherent view of main memory during parallel thread executions.',
        promptQuestion: 'What are the four states of the MESI cache coherence protocol and what does "Modified" signify?',
        promptAnswer: 'MESI states: Modified, Exclusive, Shared, Invalid. Modified signifies that the cache line is present only in the current cache and is "dirty" (has been written to and differs from main memory).'
      }
    ];
  }

  /**
   * Fetches the user's review queue from Firestore or local storage.
   * If a user has deleted items or cleared the queue, deletions are preserved across updates and reloads.
   */
  static async getQueue(userId: string): Promise<ReviewLessonItem[]> {
    if (!userId) return [];

    const deletedIds = this.getDeletedIds(userId);

    // 1. Try local storage first for instant load
    let localItems: ReviewLessonItem[] | null = null;
    let localHasRecord = false;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
      if (raw !== null) {
        localHasRecord = true;
        localItems = JSON.parse(raw) as ReviewLessonItem[];
      }
    } catch (e) {
      console.warn('Error reading local review queue:', e);
    }

    // 2. Fetch from Firestore
    try {
      const docRef = doc(db, 'reviewQueues', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data) {
          // Sync any cloud deleted IDs
          if (Array.isArray(data.deletedItemIds)) {
            data.deletedItemIds.forEach((id: string) => deletedIds.add(id));
            this.saveDeletedIdsLocally(userId, deletedIds);
          }

          // If the record exists and has items defined or initialized is true
          if (Array.isArray(data.items) || data.initialized === true) {
            const rawCloudItems = (data.items || []) as ReviewLessonItem[];
            // Filter out any deleted items
            const cleanCloudItems = rawCloudItems.filter(item => !deletedIds.has(item.id));
            
            // Update local cache
            localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(cleanCloudItems));
            this.markQueueInitializedLocally(userId);
            return cleanCloudItems;
          }
        }
      }
    } catch (e) {
      console.warn('Notice loading review queue from Firestore:', e);
    }

    // 3. Fall back to local items if queue was previously initialized or recorded (even if empty!)
    if (localHasRecord || this.isQueueInitializedLocally(userId)) {
      const cleanLocalItems = (localItems || []).filter(item => !deletedIds.has(item.id));
      return cleanLocalItems;
    }

    // 4. Truly first-time initialization: only for a brand new user who has never initialized the queue
    const seed = this.getInitialSeedItems(userId).filter(item => !deletedIds.has(item.id));
    await this.saveQueue(userId, seed);
    this.markQueueInitializedLocally(userId);
    return seed;
  }

  /**
   * Saves the entire queue to Firestore and local storage.
   * Also persists deleted IDs and marks initialized so empty queues are retained permanently.
   */
  static async saveQueue(
    userId: string, 
    items: ReviewLessonItem[], 
    newDeletedIds?: string[]
  ): Promise<void> {
    if (!userId) return;

    // Update deleted IDs if provided
    const deletedIds = this.getDeletedIds(userId);
    if (newDeletedIds && newDeletedIds.length > 0) {
      newDeletedIds.forEach(id => deletedIds.add(id));
      this.saveDeletedIdsLocally(userId, deletedIds);
    }

    // Filter out any items that are in deletedIds
    const cleanItems = items.filter(item => !deletedIds.has(item.id));

    // Save to local cache
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(cleanItems));
      this.markQueueInitializedLocally(userId);
    } catch (e) {
      console.warn('Error caching review queue locally:', e);
    }

    // Save to Firestore
    try {
      const docRef = doc(db, 'reviewQueues', userId);
      await setDoc(docRef, {
        userId,
        items: cleanItems,
        deletedItemIds: Array.from(deletedIds),
        initialized: true,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('Notice saving review queue to Firestore:', e);
    }
  }

  /**
   * Spaced Repetition Algorithm (SM-2 variant tailored for 1d, 3d, 7d intervals):
   * Calculates next interval, stage, review date, ease factor, and estimated retention.
   */
  static calculateNextReview(
    item: ReviewLessonItem, 
    rating: AnkiRating
  ): {
    nextStage: SpacedRepetitionStage;
    nextIntervalDays: number;
    nextReviewDate: number;
    newEaseFactor: number;
    retentionScore: number;
    timesReviewed: number;
    timesCorrect: number;
    timesAgain: number;
  } {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();

    let nextStage = item.repetitionStage;
    let nextIntervalDays = item.targetIntervalDays;
    let newEaseFactor = item.easeFactor || 2.5;
    let timesReviewed = (item.timesReviewed || 0) + 1;
    let timesCorrect = item.timesCorrect || 0;
    let timesAgain = item.timesAgain || 0;
    let retentionScore = item.retentionScore || 70;

    switch (rating) {
      case 'again': {
        // Reset to Stage 1 (1 day), review due soon (10 minutes or within 1 day)
        nextStage = 1;
        nextIntervalDays = 1;
        timesAgain += 1;
        // Ease factor decreases (Anki SM-2 formula penalty)
        newEaseFactor = Math.max(1.3, Number((newEaseFactor - 0.2).toFixed(2)));
        // Due in 12 hours so it appears at top of queue today
        const nextReviewDate = now + (12 * 60 * 60 * 1000);
        retentionScore = Math.max(25, retentionScore - 20);
        return {
          nextStage,
          nextIntervalDays,
          nextReviewDate,
          newEaseFactor,
          retentionScore,
          timesReviewed,
          timesCorrect,
          timesAgain
        };
      }

      case 'hard': {
        // Keeps near current stage with small interval growth
        timesCorrect += 1;
        newEaseFactor = Math.max(1.3, Number((newEaseFactor - 0.15).toFixed(2)));
        if (item.repetitionStage === 1) {
          nextStage = 1;
          nextIntervalDays = 2; // slight bump from 1 day
        } else if (item.repetitionStage === 2) {
          nextStage = 2;
          nextIntervalDays = 4; // slight bump from 3 days
        } else if (item.repetitionStage === 3) {
          nextStage = 3;
          nextIntervalDays = 8;
        } else {
          nextStage = 4;
          nextIntervalDays = Math.max(10, Math.round(item.targetIntervalDays * 1.2));
        }
        const nextReviewDate = now + (nextIntervalDays * oneDayMs);
        retentionScore = Math.min(100, Math.max(40, retentionScore + 5));
        return {
          nextStage,
          nextIntervalDays,
          nextReviewDate,
          newEaseFactor,
          retentionScore,
          timesReviewed,
          timesCorrect,
          timesAgain
        };
      }

      case 'good': {
        // Standard Anki Spaced Repetition Progression: 1d -> 3d -> 7d -> 14d+ (Mastered)
        timesCorrect += 1;
        if (item.repetitionStage === 1) {
          nextStage = 2; // Advance to Day 3
          nextIntervalDays = 3;
        } else if (item.repetitionStage === 2) {
          nextStage = 3; // Advance to Day 7
          nextIntervalDays = 7;
        } else if (item.repetitionStage === 3) {
          nextStage = 4; // Advance to Mastered (14 days)
          nextIntervalDays = 14;
        } else {
          nextStage = 4;
          nextIntervalDays = Math.round(item.targetIntervalDays * newEaseFactor);
        }
        const nextReviewDate = now + (nextIntervalDays * oneDayMs);
        retentionScore = Math.min(98, retentionScore + 12);
        return {
          nextStage,
          nextIntervalDays,
          nextReviewDate,
          newEaseFactor,
          retentionScore,
          timesReviewed,
          timesCorrect,
          timesAgain
        };
      }

      case 'easy': {
        // Accelerated Spaced Repetition leap: 1d -> 4d -> 10d -> 21d+
        timesCorrect += 1;
        newEaseFactor = Math.min(3.0, Number((newEaseFactor + 0.15).toFixed(2)));
        if (item.repetitionStage === 1) {
          nextStage = 2;
          nextIntervalDays = 4;
        } else if (item.repetitionStage === 2) {
          nextStage = 3;
          nextIntervalDays = 10;
        } else if (item.repetitionStage === 3) {
          nextStage = 4;
          nextIntervalDays = 21;
        } else {
          nextStage = 4;
          nextIntervalDays = Math.round(item.targetIntervalDays * newEaseFactor * 1.35);
        }
        const nextReviewDate = now + (nextIntervalDays * oneDayMs);
        retentionScore = Math.min(100, retentionScore + 20);
        return {
          nextStage,
          nextIntervalDays,
          nextReviewDate,
          newEaseFactor,
          retentionScore,
          timesReviewed,
          timesCorrect,
          timesAgain
        };
      }
    }
  }

  /**
   * Records a user's Anki rating review for a given lesson item
   */
  static async recordReview(
    userId: string, 
    itemId: string, 
    rating: AnkiRating
  ): Promise<{ updatedItem: ReviewLessonItem; allItems: ReviewLessonItem[] }> {
    const queue = await this.getQueue(userId);
    const index = queue.findIndex(i => i.id === itemId);
    if (index === -1) {
      throw new Error(`Lesson item with id ${itemId} not found in review queue.`);
    }

    const currentItem = queue[index];
    const calc = this.calculateNextReview(currentItem, rating);

    const updatedItem: ReviewLessonItem = {
      ...currentItem,
      repetitionStage: calc.nextStage,
      targetIntervalDays: calc.nextIntervalDays,
      nextReviewDate: calc.nextReviewDate,
      lastReviewedAt: Date.now(),
      easeFactor: calc.newEaseFactor,
      timesReviewed: calc.timesReviewed,
      timesCorrect: calc.timesCorrect,
      timesAgain: calc.timesAgain,
      retentionScore: calc.retentionScore
    };

    queue[index] = updatedItem;
    await this.saveQueue(userId, queue);

    return { updatedItem, allItems: queue };
  }

  /**
   * Enqueue a newly completed lesson, study set, or quiz into the spaced repetition queue
   */
  static async enqueueCompletedLesson(
    userId: string,
    lessonData: {
      studySetId?: string;
      title: string;
      subject?: string;
      lessonType?: ReviewLessonItem['lessonType'];
      keyConcepts?: string[];
      summarySnippet?: string;
      promptQuestion?: string;
      promptAnswer?: string;
      customCompletedDaysAgo?: number; // e.g., 1, 3, or 7 days ago for manual or retro testing
    }
  ): Promise<ReviewLessonItem> {
    const queue = await this.getQueue(userId);
    const oneDayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const daysAgo = lessonData.customCompletedDaysAgo || 0;
    const completedAt = now - (daysAgo * oneDayMs);

    // Determine initial stage and interval based on completion time
    let initialStage: SpacedRepetitionStage = 1;
    let initialIntervalDays = 1;

    if (daysAgo >= 7) {
      initialStage = 3;
      initialIntervalDays = 7;
    } else if (daysAgo >= 3) {
      initialStage = 2;
      initialIntervalDays = 3;
    } else {
      initialStage = 1;
      initialIntervalDays = 1;
    }

    // Due date is completedAt + targetIntervalDays
    const nextReviewDate = completedAt + (initialIntervalDays * oneDayMs);

    const newItem: ReviewLessonItem = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      studySetId: lessonData.studySetId,
      title: lessonData.title,
      subject: lessonData.subject || 'General Study',
      lessonType: lessonData.lessonType || 'interactive-lesson',
      completedAt,
      repetitionStage: initialStage,
      targetIntervalDays: initialIntervalDays,
      nextReviewDate,
      easeFactor: 2.5,
      timesReviewed: 0,
      timesCorrect: 0,
      timesAgain: 0,
      retentionScore: Math.max(40, 100 - (daysAgo * 6)),
      keyConcepts: lessonData.keyConcepts || ['Key Concept 1', 'Core Definition', 'Application'],
      summarySnippet: lessonData.summarySnippet || `Review materials and key insights for ${lessonData.title}.`,
      promptQuestion: lessonData.promptQuestion || `What is the most crucial concept to recall from "${lessonData.title}"?`,
      promptAnswer: lessonData.promptAnswer || `The core principle involves applying the foundational definitions and relationship models reviewed in this session.`
    };

    // Ensure new item ID is not blocked in deletedIds
    const deletedIds = this.getDeletedIds(userId);
    if (deletedIds.has(newItem.id)) {
      deletedIds.delete(newItem.id);
      this.saveDeletedIdsLocally(userId, deletedIds);
    }

    // Prepend to queue
    const updated = [newItem, ...queue];
    await this.saveQueue(userId, updated);
    return newItem;
  }

  /**
   * Delete an item from the user's review queue
   */
  static async deleteItem(userId: string, itemId: string): Promise<ReviewLessonItem[]> {
    const queue = await this.getQueue(userId);
    const updated = queue.filter(i => i.id !== itemId);
    await this.saveQueue(userId, updated, [itemId]);
    return updated;
  }

  /**
   * Delete all items belonging to a specific repetition stage or due status
   */
  static async deleteStage(
    userId: string, 
    stage: 1 | 2 | 3 | 4 | 'due'
  ): Promise<ReviewLessonItem[]> {
    const queue = await this.getQueue(userId);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const idsToDelete: string[] = [];
    const updated = queue.filter(item => {
      let matches = false;
      if (stage === 'due') {
        matches = item.nextReviewDate <= now;
      } else {
        const ageDays = (now - item.completedAt) / oneDayMs;
        if (stage === 1) {
          matches = (ageDays >= 0.8 && ageDays < 2.5) || item.repetitionStage === 1;
        } else if (stage === 2) {
          matches = (ageDays >= 2.5 && ageDays < 5.5) || item.repetitionStage === 2;
        } else if (stage === 3) {
          matches = ageDays >= 5.5 || item.repetitionStage === 3;
        } else if (stage === 4) {
          matches = item.repetitionStage === 4 || item.targetIntervalDays >= 14;
        }
      }

      if (matches) {
        idsToDelete.push(item.id);
        return false; // remove
      }
      return true; // keep
    });

    await this.saveQueue(userId, updated, idsToDelete);
    return updated;
  }

  /**
   * Change or reset a lesson's repetition stage directly
   */
  static async changeItemStage(
    userId: string,
    itemId: string,
    newStage: SpacedRepetitionStage
  ): Promise<{ updatedItem: ReviewLessonItem; allItems: ReviewLessonItem[] }> {
    const queue = await this.getQueue(userId);
    const index = queue.findIndex(i => i.id === itemId);
    if (index === -1) throw new Error('Item not found');

    const item = queue[index];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let targetIntervalDays = 1;
    if (newStage === 1) targetIntervalDays = 1;
    else if (newStage === 2) targetIntervalDays = 3;
    else if (newStage === 3) targetIntervalDays = 7;
    else if (newStage === 4) targetIntervalDays = 14;

    const updatedItem: ReviewLessonItem = {
      ...item,
      repetitionStage: newStage,
      targetIntervalDays,
      nextReviewDate: now + (targetIntervalDays * oneDayMs),
      retentionScore: newStage === 4 ? 98 : newStage === 3 ? 90 : newStage === 2 ? 80 : 70
    };

    queue[index] = updatedItem;
    await this.saveQueue(userId, queue);
    return { updatedItem, allItems: queue };
  }

  /**
   * Clear all items in review queue
   */
  static async deleteAllInQueue(userId: string): Promise<ReviewLessonItem[]> {
    const queue = await this.getQueue(userId);
    const allIds = queue.map(i => i.id);
    await this.saveQueue(userId, [], allIds);
    return [];
  }

  /**
   * Reset queue back to default 1, 3, 7 day examples
   */
  static async resetQueueWithSamples(userId: string): Promise<ReviewLessonItem[]> {
    // Explicit user action to restore sample lessons: clear deleted items list
    this.saveDeletedIdsLocally(userId, new Set());
    try {
      const docRef = doc(db, 'reviewQueues', userId);
      await setDoc(docRef, {
        userId,
        deletedItemIds: [],
        initialized: true,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('Notice resetting deletedItemIds in Firestore:', e);
    }

    const seed = this.getInitialSeedItems(userId);
    await this.saveQueue(userId, seed);
    return seed;
  }

  /**
   * Check if any items are due for review and trigger a phone popup notification with chime
   */
  static async checkAndNotifyDueReviews(userId: string): Promise<number> {
    if (!userId) return 0;
    try {
      const queue = await this.getQueue(userId);
      const now = Date.now();
      const dueItems = queue.filter(item => item.nextReviewDate <= now);
      
      if (dueItems.length > 0) {
        // Only notify if not notified recently in the last 4 hours
        const lastNotifKey = `learnora_last_review_queue_notif_${userId}`;
        const lastSent = parseInt(localStorage.getItem(lastNotifKey) || '0', 10);
        if (now - lastSent > 4 * 3600 * 1000) {
          localStorage.setItem(lastNotifKey, now.toString());
          const itemNames = dueItems.slice(0, 2).map(i => i.title).join(', ');
          const title = `🧠 ${dueItems.length} Study Review${dueItems.length > 1 ? 's' : ''} Due Today`;
          const body = `${itemNames}${dueItems.length > 2 ? ` and ${dueItems.length - 2} more` : ''} hit their 1, 3, or 7-day recall interval.`;
          
          NotificationService.showNativePhoneNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'spaced-repetition-due',
            actionUrl: 'review-queue'
          });
        }
      }
      return dueItems.length;
    } catch {
      return 0;
    }
  }
}
