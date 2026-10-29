import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserComplaint, ComplaintStatus, ComplaintCategory, ComplaintPriority } from '../types';
import { NotificationService } from './notificationService';

const LOCAL_STORAGE_KEY = 'learnora_user_complaints_';
const ADMIN_CACHE_KEY = 'learnora_admin_all_complaints_cache';

export class ComplaintService {
  /**
   * Helper to strip undefined values so Firestore does not reject writes
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
   * Get cached complaints from localStorage for offline resilience
   */
  private static getLocalComplaints(userId?: string): UserComplaint[] {
    try {
      if (userId) {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}${userId}`);
        return raw ? JSON.parse(raw) : [];
      }
      const raw = localStorage.getItem(ADMIN_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static saveLocalComplaints(complaints: UserComplaint[], userId?: string): void {
    try {
      if (userId) {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}${userId}`, JSON.stringify(complaints));
      }
      localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(complaints));
    } catch {}
  }

  /**
   * Submit a new student complaint / ticket
   */
  static async submitComplaint(data: {
    userId: string;
    userEmail: string;
    userName?: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
    title: string;
    description: string;
    relatedSetTitle?: string;
  }): Promise<UserComplaint> {
    const id = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const complaint: UserComplaint = {
      id,
      userId: data.userId,
      userEmail: data.userEmail.trim(),
      userName: data.userName?.trim() || 'Learner',
      category: data.category,
      priority: data.priority,
      title: data.title.trim(),
      description: data.description.trim(),
      relatedSetTitle: data.relatedSetTitle?.trim() || undefined,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    // 1. Save to local storage for instant responsiveness
    const local = this.getLocalComplaints(data.userId);
    this.saveLocalComplaints([complaint, ...local.filter(c => c.id !== id)], data.userId);

    // 2. Persist to Firestore /complaints collection
    try {
      const cleaned = this.cleanUndefined(complaint);
      await setDoc(doc(db, 'complaints', id), cleaned);
    } catch (err) {
      console.warn('Complaint saved locally, Firestore sync deferred:', err);
    }

    return complaint;
  }

  /**
   * Fetch all complaints filed by a specific student
   */
  static async getUserComplaints(userId: string): Promise<UserComplaint[]> {
    try {
      const q = query(
        collection(db, 'complaints'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const remote = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserComplaint));
      if (remote.length > 0) {
        this.saveLocalComplaints(remote, userId);
        return remote;
      }
    } catch (err) {
      console.warn('Failed to query remote complaints for user, using local cache:', err);
    }
    return this.getLocalComplaints(userId);
  }

  /**
   * Real-time subscription to complaints for a specific student
   */
  static subscribeToUserComplaints(
    userId: string, 
    callback: (complaints: UserComplaint[]) => void
  ): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'complaints'),
        where('userId', '==', userId)
      );

      return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserComplaint));
        // Sort descending by createdAt
        list.sort((a, b) => b.createdAt - a.createdAt);
        this.saveLocalComplaints(list, userId);
        callback(list);
      }, (error) => {
        console.warn('User complaints snapshot error, falling back to local cache:', error);
        callback(this.getLocalComplaints(userId));
      });
    } catch (err) {
      console.warn('Failed to initialize complaints subscription:', err);
      callback(this.getLocalComplaints(userId));
      return () => {};
    }
  }

  /**
   * Admin: Fetch all platform complaints across all students
   */
  static async getAllComplaints(): Promise<UserComplaint[]> {
    try {
      const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const remote = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserComplaint));
      if (remote.length > 0) {
        this.saveLocalComplaints(remote);
        return remote;
      }
    } catch (err) {
      console.warn('Failed to fetch all complaints from Firestore, using admin cache:', err);
    }
    return this.getLocalComplaints();
  }

  /**
   * Admin: Real-time subscription to all complaints for the admin panel
   */
  static subscribeToAllComplaints(
    callback: (complaints: UserComplaint[]) => void
  ): () => void {
    try {
      const q = query(collection(db, 'complaints'));
      return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserComplaint));
        list.sort((a, b) => b.createdAt - a.createdAt);
        this.saveLocalComplaints(list);
        callback(list);
      }, (error) => {
        console.warn('Admin complaints snapshot error, falling back to local cache:', error);
        callback(this.getLocalComplaints());
      });
    } catch (err) {
      console.warn('Failed to subscribe to all complaints:', err);
      callback(this.getLocalComplaints());
      return () => {};
    }
  }

  /**
   * Admin: Respond to a complaint and update its status
   */
  static async updateComplaintStatus(
    complaintId: string, 
    data: {
      status: ComplaintStatus;
      adminResponse?: string;
      adminEmail?: string;
      notifyUser?: boolean;
      targetUserId?: string;
      complaintTitle?: string;
    }
  ): Promise<void> {
    const now = Date.now();
    const updatePayload: Partial<UserComplaint> = {
      status: data.status,
      updatedAt: now,
      ...(data.adminResponse !== undefined ? { adminResponse: data.adminResponse.trim() } : {}),
      ...(data.adminEmail ? { adminResponderEmail: data.adminEmail } : {}),
      ...(data.status === 'resolved' ? { resolvedAt: now } : {})
    };

    // 1. Update Firestore
    try {
      await updateDoc(doc(db, 'complaints', complaintId), this.cleanUndefined(updatePayload));
    } catch (err) {
      console.error('Failed to update complaint in Firestore:', err);
      // Fallback: update in localStorage cache
      const cached = this.getLocalComplaints();
      const idx = cached.findIndex(c => c.id === complaintId);
      if (idx !== -1) {
        cached[idx] = { ...cached[idx], ...updatePayload };
        this.saveLocalComplaints(cached);
      }
    }

    // 2. Notify student if requested
    if (data.notifyUser && data.targetUserId) {
      try {
        const statusLabel = data.status === 'resolved' 
          ? '✅ Resolved' 
          : data.status === 'investigating' 
            ? '🔍 Under Investigation' 
            : data.status === 'dismissed' 
              ? 'ℹ️ Closed' 
              : '📝 Updated';

        const notifTitle = `Complaint Update: ${statusLabel}`;
        const notifMsg = data.adminResponse 
          ? `Admin Response on "${data.complaintTitle || 'Your ticket'}": ${data.adminResponse}`
          : `The administrator has updated the status of your complaint "${data.complaintTitle || 'ticket'}" to ${data.status}.`;

        await NotificationService.sendUserLiveNotification(data.targetUserId, {
          title: notifTitle,
          message: notifMsg,
          type: 'system',
          priority: data.status === 'resolved' ? 'normal' : 'high',
          actionUrl: 'home',
          actionLabel: 'View Complaints',
          sender: 'Learnora Platform Support'
        });

        // Trigger native system push if user is on mobile/PWA
        try {
          await fetch('/api/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: notifTitle,
              message: notifMsg,
              actionUrl: 'home',
              actionLabel: 'View Complaints',
              type: 'system',
              priority: 'high',
              targetUserId: data.targetUserId
            })
          });
        } catch (_) {}
      } catch (notifErr) {
        console.warn('Failed to send notification for complaint update:', notifErr);
      }
    }
  }

  /**
   * Delete a complaint (admin or creator)
   */
  static async deleteComplaint(complaintId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'complaints', complaintId));
    } catch (err) {
      console.warn('Failed to delete complaint from Firestore:', err);
    }
    const cached = this.getLocalComplaints();
    this.saveLocalComplaints(cached.filter(c => c.id !== complaintId));
  }
}
