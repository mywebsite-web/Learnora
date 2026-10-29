import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  CommunityMessage, 
  CommunityRoom, 
  CommunityRoomId, 
  UserPresence,
  isAdminEmail 
} from '../types';
import { DBService } from './dbService';

export const COMMUNITY_ROOMS: CommunityRoom[] = [
  {
    id: 'general-lounge',
    name: 'Campus Study Hall',
    topic: 'Introductions, study banter, academic goals, and platform discussions',
    icon: 'MessageSquare',
    category: 'campus',
    description: 'Open community lounge for all students across courses and fields',
    badge: 'Popular'
  },
  {
    id: 'exam-prep',
    name: 'Exam Prep & Midterms',
    topic: 'Study deck recommendations, spaced repetition streaks, memory mastery',
    icon: 'Target',
    category: 'academics',
    description: 'Collaborate on upcoming exams, high-yield decks, and retention tips',
    badge: 'Active'
  },
  {
    id: 'study-partners',
    name: 'Accountability & Groups',
    topic: 'Find study partners, weekly sprint goals, and virtual study sessions',
    icon: 'Users',
    category: 'campus',
    description: 'Keep each other motivated through the weekly run and daily study goals',
    badge: 'Daily'
  },
  {
    id: 'nora-tips',
    name: 'Nora AI Tutor Tips',
    topic: 'Socratic prompts, Feynman method workflows, cognitive adaptations',
    icon: 'BrainCircuit',
    category: 'ai',
    description: 'Discover pedagogical tricks to get 10x more out of Nora AI sessions',
    badge: 'AI Pro'
  },
  {
    id: 'stem-hub',
    name: 'STEM & Technical',
    topic: 'Computer Science, Medicine, Mathematics, Engineering & Sciences',
    icon: 'Atom',
    category: 'academics',
    description: 'Deep technical discussions, problem sets, and lab concepts'
  },
  {
    id: 'humanities-law',
    name: 'Humanities, Law & Biz',
    topic: 'Economics, Legal case briefs, Philosophy, Literature, Essay debates',
    icon: 'Scale',
    category: 'academics',
    description: 'Case analysis, essay critiques, and humanities conceptual debates'
  }
];

const LOCAL_STORAGE_PREFIX = 'learnora_community_real_room_';

// Immediate purge of any legacy fake / seed messages from browser localStorage
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('learnora_community_room_') || key.startsWith('learnora_community_real_room_'))) {
        try {
          const val = localStorage.getItem(key);
          if (val && val.includes('seed_')) {
            keysToRemove.push(key);
          }
        } catch (_) {}
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
} catch (_) {}

export class CommunityChatService {
  /**
   * Helper to clean undefined properties before saving to Firestore
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
   * Retrieve cached room messages from localStorage (only real messages)
   */
  private static getLocalRoomMessages(roomId: CommunityRoomId): CommunityMessage[] {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${roomId}`);
      if (raw) {
        const parsed: CommunityMessage[] = JSON.parse(raw);
        // Strictly filter out any fake or seed messages
        return parsed.filter(m => m && !m.id.startsWith('seed_'));
      }
    } catch (e) {
      console.warn('Notice reading local chat cache:', e);
    }
    return [];
  }

  /**
   * Save messages into localStorage cache
   */
  private static saveLocalRoomMessages(roomId: CommunityRoomId, messages: CommunityMessage[]): void {
    try {
      const onlyReal = messages.filter(m => m && !m.id.startsWith('seed_'));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${roomId}`, JSON.stringify(onlyReal));
    } catch (e) {
      console.warn('Notice saving local chat cache:', e);
    }
  }

  /**
   * Get all registered community study rooms
   */
  static getRooms(): CommunityRoom[] {
    return COMMUNITY_ROOMS;
  }

  /**
   * Get a single room by ID
   */
  static getRoom(id: CommunityRoomId): CommunityRoom {
    return COMMUNITY_ROOMS.find(r => r.id === id) || COMMUNITY_ROOMS[0];
  }

  /**
   * Subscribe to real-time messages for a designated study room
   */
  static subscribeToRoomMessages(
    roomId: CommunityRoomId,
    callback: (messages: CommunityMessage[]) => void
  ): () => void {
    // 1. Immediately provide cached real messages for zero latency
    const initialCached = this.getLocalRoomMessages(roomId);
    callback(initialCached);

    try {
      const messagesCol = collection(db, 'community_messages');
      const unsubscribe = onSnapshot(
        messagesCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreMessages: CommunityMessage[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as CommunityMessage;
              // Only load real messages belonging to this room
              if (data.roomId === roomId && !docSnap.id.startsWith('seed_')) {
                firestoreMessages.push({
                  ...data,
                  id: docSnap.id,
                  isAdmin: data.isAdmin || isAdminEmail(data.userEmail)
                });
              }
            });

            // Sort chronologically ascending
            firestoreMessages.sort((a, b) => a.createdAt - b.createdAt);
            this.saveLocalRoomMessages(roomId, firestoreMessages);
            callback(firestoreMessages);
            return;
          }

          // If no remote messages found in Firestore yet, room is genuinely empty
          this.saveLocalRoomMessages(roomId, []);
          callback([]);
        },
        (error) => {
          console.warn('Notice connecting to live community chat (using local cache):', error?.message);
          callback(this.getLocalRoomMessages(roomId));
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Notice initializing chat listener:', err);
      callback(initialCached);
      return () => {};
    }
  }

  /**
   * Send a new message to a community study room
   */
  static async sendMessage(params: {
    roomId: CommunityRoomId;
    userId: string;
    userEmail: string;
    userName: string;
    userAvatarUrl?: string;
    userCourse?: string;
    text: string;
    replyTo?: CommunityMessage['replyTo'];
    attachment?: CommunityMessage['attachment'];
  }): Promise<CommunityMessage> {
    const isUserAdmin = isAdminEmail(params.userEmail);
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const newMessage: CommunityMessage = {
      id: messageId,
      roomId: params.roomId,
      userId: params.userId,
      userName: params.userName || (isUserAdmin ? 'Platform Admin' : 'Learner'),
      userEmail: params.userEmail,
      userAvatarUrl: params.userAvatarUrl,
      isAdmin: isUserAdmin,
      userRole: isUserAdmin ? 'Platform Admin' : 'Learner',
      userCourse: params.userCourse,
      text: params.text.trim(),
      reactions: {},
      replyTo: params.replyTo,
      attachment: params.attachment,
      createdAt: Date.now()
    };

    // 1. Optimistically update local cache
    const current = this.getLocalRoomMessages(params.roomId);
    const nextList = [...current, newMessage];
    this.saveLocalRoomMessages(params.roomId, nextList);

    // 2. Persist to Firestore
    try {
      const cleanData = this.cleanUndefined(newMessage);
      await setDoc(doc(db, 'community_messages', messageId), cleanData);
    } catch (err) {
      console.warn('Notice saving message to Firestore (cached locally):', err);
    }

    return newMessage;
  }

  /**
   * Toggle emoji reaction on a message
   */
  static async toggleReaction(
    roomId: CommunityRoomId,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<void> {
    const currentList = this.getLocalRoomMessages(roomId);
    const msgIndex = currentList.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const msg = { ...currentList[msgIndex] };
    const reactions = { ...(msg.reactions || {}) };
    const userList = reactions[emoji] ? [...reactions[emoji]] : [];

    const existingIdx = userList.indexOf(userId);
    if (existingIdx >= 0) {
      userList.splice(existingIdx, 1);
      if (userList.length === 0) {
        delete reactions[emoji];
      } else {
        reactions[emoji] = userList;
      }
    } else {
      userList.push(userId);
      reactions[emoji] = userList;
    }

    msg.reactions = reactions;
    currentList[msgIndex] = msg;
    this.saveLocalRoomMessages(roomId, currentList);

    // Update Firestore if remote document exists
    try {
      const msgRef = doc(db, 'community_messages', messageId);
      await updateDoc(msgRef, { reactions: this.cleanUndefined(reactions) });
    } catch {
      // Ignored for offline
    }
  }

  /**
   * Delete a message (author or platform admin)
   */
  static async deleteMessage(
    roomId: CommunityRoomId,
    messageId: string
  ): Promise<void> {
    const current = this.getLocalRoomMessages(roomId);
    const updated = current.filter(m => m.id !== messageId);
    this.saveLocalRoomMessages(roomId, updated);

    try {
      await deleteDoc(doc(db, 'community_messages', messageId));
    } catch {
      // Ignored if offline
    }
  }

  /**
   * Subtle pleasant audio chime for incoming messages
   */
  static playMessageChime(): void {
    this.playWhatsAppChime();
  }

  /**
   * Signature two-tone WhatsApp incoming message chime (Web Audio API)
   */
  static playWhatsAppChime(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Note 1: 659.25Hz (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.1);

      // Note 2: 1046.5Hz (C6) - WhatsApp second high tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0.001, ctx.currentTime);
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.28);
    } catch {
      // AudioContext policy
    }
  }

  /**
   * Phone dual-buzz vibration mimicking WhatsApp
   */
  static triggerWhatsAppVibration(): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([140, 60, 140]);
      } catch {}
    }
  }

  /**
   * Request native phone / browser notification permission
   */
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const result = await Notification.requestPermission();
      return result;
    } catch {
      return 'denied';
    }
  }

  /**
   * Show real native phone system notification (displays in phone's top notification shade)
   */
  static showNativePhoneNotification(title: string, options: { body: string; icon?: string; tag?: string }): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body: options.body,
            icon: options.icon || '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: options.tag || 'learnora-message',
            renotify: true,
            vibrate: [140, 60, 140]
          } as any);
        });
      } else {
        new Notification(title, {
          body: options.body,
          icon: options.icon || '/pwa-192x192.png',
          tag: options.tag || 'learnora-message'
        });
      }
    } catch (e) {
      console.warn('Notice triggering native phone notification:', e);
    }
  }

  /**
   * Broadcast active user presence and current room
   */
  static async updateUserPresence(
    user: { uid: string; email?: string; displayName?: string; avatarUrl?: string },
    activeRoomId: CommunityRoomId = 'general-lounge'
  ): Promise<void> {
    if (!user || !user.uid) return;

    // Strict guard: if user account was deleted by admin (locally or on cloud), purge presence and abort
    if (DBService.isUserDeletedLocally(user.uid, user.email)) {
      try {
        await deleteDoc(doc(db, 'presence', user.uid));
      } catch {}
      return;
    }

    try {
      const isDeleted = await DBService.isUserDeleted(user.uid, user.email);
      if (isDeleted) {
        await deleteDoc(doc(db, 'presence', user.uid));
        return;
      }
    } catch {}

    try {
      const presenceData: UserPresence = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Learner',
        avatarUrl: user.avatarUrl,
        isAdmin: isAdminEmail(user.email),
        activeRoomId,
        lastSeen: Date.now()
      };
      await setDoc(doc(db, 'presence', user.uid), this.cleanUndefined(presenceData), { merge: true });
    } catch {
      // Ignore offline failures
    }
  }

  /**
   * Subscribe to 100% REAL online user presence across community rooms
   * Strictly counts active sessions with zero synthetic/fake baselines.
   */
  static subscribeToOnlinePresence(
    callback: (data: {
      totalOnline: number;
      roomCounts: Record<CommunityRoomId, number>;
      onlineUsers: UserPresence[];
    }) => void
  ): () => void {
    const emptyRoomCounts: Record<CommunityRoomId, number> = {
      'general-lounge': 0,
      'exam-prep': 0,
      'study-partners': 0,
      'nora-tips': 0,
      'stem-hub': 0,
      'humanities-law': 0
    };

    const deletedUids = new Set<string>(['usr_y0na13', 'demo_user']);
    const deletedEmails = new Set<string>(['alex.morgan@learnora.app']);

    let unsubDeleted: (() => void) | null = null;
    try {
      unsubDeleted = onSnapshot(collection(db, 'deleted_users'), (snap) => {
        snap.docs.forEach((d) => {
          deletedUids.add(d.id);
          const data = d.data();
          if (data?.email) deletedEmails.add(data.email.toLowerCase().trim());
        });
      }, () => {});
    } catch {}

    try {
      const presenceCol = collection(db, 'presence');
      const unsubscribe = onSnapshot(
        presenceCol,
        (snapshot) => {
          const now = Date.now();
          const activeUsers: UserPresence[] = [];
          
          snapshot.forEach((d) => {
            const data = d.data() as UserPresence;
            const cleanEmail = data?.email?.toLowerCase().trim() || '';

            // Filter out deleted/tombstoned users across cloud and local registries
            if (deletedUids.has(d.id) || (cleanEmail && deletedEmails.has(cleanEmail))) {
              return;
            }
            if (DBService.isUserDeletedLocally(d.id, cleanEmail)) {
              return;
            }
            if (cleanEmail === 'alex.morgan@learnora.app' || data?.displayName === 'Alex Morgan' || d.id === 'usr_y0na13') {
              return;
            }

            // Real active user: heartbeat ping recorded within the last 90 seconds (1.5 mins)
            if (data && data.lastSeen && (now - data.lastSeen) < 90 * 1000) {
              activeUsers.push({
                ...data,
                uid: d.id,
                isAdmin: data.isAdmin || isAdminEmail(data.email)
              });
            }
          });

          // Strictly real online count
          const totalOnline = activeUsers.length;

          const roomCounts: Record<CommunityRoomId, number> = {
            'general-lounge': activeUsers.filter(u => u.activeRoomId === 'general-lounge').length,
            'exam-prep': activeUsers.filter(u => u.activeRoomId === 'exam-prep').length,
            'study-partners': activeUsers.filter(u => u.activeRoomId === 'study-partners').length,
            'nora-tips': activeUsers.filter(u => u.activeRoomId === 'nora-tips').length,
            'stem-hub': activeUsers.filter(u => u.activeRoomId === 'stem-hub').length,
            'humanities-law': activeUsers.filter(u => u.activeRoomId === 'humanities-law').length
          };

          callback({
            totalOnline,
            roomCounts,
            onlineUsers: activeUsers
          });
        },
        () => {
          callback({
            totalOnline: 0,
            roomCounts: emptyRoomCounts,
            onlineUsers: []
          });
        }
      );

      return () => {
        unsubscribe();
        if (unsubDeleted) unsubDeleted();
      };
    } catch {
      callback({
        totalOnline: 0,
        roomCounts: emptyRoomCounts,
        onlineUsers: []
      });
      return () => {};
    }
  }

  /**
   * Set user offline immediately
   */
  static async setOfflinePresence(userId: string): Promise<void> {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'presence', userId), {
        lastSeen: 0
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Real-time listener for incoming messages to trigger live drop-down notifications
   */
  static subscribeToAllIncomingMessages(
    currentUserId: string,
    onNewMessage: (msg: CommunityMessage) => void,
    options?: { includeSelf?: boolean }
  ): () => void {
    let isInitialLoad = true;
    const knownIds = new Set<string>();

    try {
      const messagesCol = collection(db, 'community_messages');
      const unsubscribe = onSnapshot(
        messagesCol,
        (snapshot) => {
          if (isInitialLoad) {
            snapshot.forEach((d) => knownIds.add(d.id));
            isInitialLoad = false;
            return;
          }

          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const d = change.doc;
              if (!knownIds.has(d.id)) {
                knownIds.add(d.id);
                const data = d.data() as CommunityMessage;
                const shouldNotify = (options?.includeSelf || data.userId !== currentUserId) && 
                  Date.now() - (data.createdAt || 0) < 60000;
                
                if (shouldNotify) {
                  onNewMessage({
                    ...data,
                    id: d.id,
                    isAdmin: data.isAdmin || isAdminEmail(data.userEmail)
                  });
                }
              }
            }
          });
        },
        (err) => {
          console.warn('Notice listening for community message drops:', err);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Notice attaching incoming message drop listener:', err);
      return () => {};
    }
  }

  /**
   * Dispatches a test incoming message to immediately preview and verify
   * the WhatsApp-style drop notification on the phone with vibration and sound.
   */
  static triggerTestIncomingMessage(currentUserId: string, callback?: (msg: CommunityMessage) => void): CommunityMessage {
    const testSenders = [
      { name: 'Ademola (Platform Admin)', role: 'Admin', course: 'Learnora System', text: '🚀 Hey! Welcome to the new Community Lounge. Live WhatsApp-style drop notifications are now active!' },
      { name: 'Marcus Chen', role: 'Student', course: 'Computer Science', text: '👋 Has anyone completed the Chapter 4 practice test yet? Let’s compare notes!' },
      { name: 'Amara Kalu', role: 'Student', course: 'Pre-Med & Bio', text: '📚 Just finished a 25-minute Pomodoro on flashcards. Who wants to study together?' }
    ];

    const pick = testSenders[Math.floor(Math.random() * testSenders.length)];
    const testMsg: CommunityMessage = {
      id: `test_drop_${Date.now()}`,
      roomId: 'general-lounge',
      userId: 'test_peer_' + Date.now(),
      userName: pick.name,
      userEmail: 'adedayoademola171@gmail.com',
      isAdmin: pick.role === 'Admin',
      userRole: pick.role,
      userCourse: pick.course,
      text: pick.text,
      createdAt: Date.now()
    };

    // Play WhatsApp signature chime
    this.playWhatsAppChime();

    // Trigger dual pulse phone vibration
    this.triggerWhatsAppVibration();

    // Native phone system push notification
    this.showNativePhoneNotification(`💬 ${testMsg.userName} (#Campus)`, {
      body: testMsg.text,
      tag: 'whatsapp-test-drop'
    });

    if (callback) {
      callback(testMsg);
    }

    return testMsg;
  }
}
