import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NotificationItem, NotificationType } from '../types';

const STORAGE_KEY = 'learnora_notifications_cache_';
const BROADCAST_EVENT_KEY = 'learnora_last_broadcast_notification';
const DELETED_IDS_KEY = 'learnora_deleted_notif_ids_';
const GLOBAL_DELETED_KEY = 'learnora_deleted_notif_ids_global';
const LIVE_ALERTS_KEY = 'learnora_live_alerts_enabled';

export class NotificationService {
  /**
   * Retrieves set of deleted notification IDs for a given user & global blacklist to prevent resurrection
   */
  static getDeletedIds(userId?: string): Set<string> {
    const set = new Set<string>();
    try {
      // 1. Global blacklist
      const globalRaw = localStorage.getItem(GLOBAL_DELETED_KEY);
      if (globalRaw) {
        JSON.parse(globalRaw).forEach((id: string) => set.add(id));
      }

      // 2. User-specific blacklist
      if (userId) {
        const userRaw = localStorage.getItem(`${DELETED_IDS_KEY}${userId}`);
        if (userRaw) {
          JSON.parse(userRaw).forEach((id: string) => set.add(id));
        }
      }
    } catch {}
    return set;
  }

  /**
   * Adds an ID to both user-scoped and global deleted blacklist
   */
  static addDeletedId(userId: string | undefined, id: string): void {
    if (!id) return;
    try {
      // Add to global set
      const globalSet = this.getDeletedIds();
      globalSet.add(id);
      localStorage.setItem(GLOBAL_DELETED_KEY, JSON.stringify(Array.from(globalSet)));

      // Add to user set
      if (userId) {
        const userSet = this.getDeletedIds(userId);
        userSet.add(id);
        localStorage.setItem(`${DELETED_IDS_KEY}${userId}`, JSON.stringify(Array.from(userSet)));
      }
    } catch {}
  }

  /**
   * Checks if in-app live drop alerts & chime are enabled
   */
  static isLiveAlertsEnabled(): boolean {
    try {
      const val = localStorage.getItem(LIVE_ALERTS_KEY);
      return val !== 'false'; // Default to enabled
    } catch {
      return true;
    }
  }

  /**
   * Sets in-app live drop alert preference
   */
  static setLiveAlertsEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(LIVE_ALERTS_KEY, enabled ? 'true' : 'false');
    } catch {}
  }

  /**
   * Generates realistic initial notifications for learners
   */
  static getSeedNotifications(userId: string): NotificationItem[] {
    const now = Date.now();
    return [
      {
        id: `notif-seed-announcement-${userId.slice(0, 5)}`,
        userId,
        title: '🚀 Spaced Repetition Review Queue Live!',
        message: 'Anki-style 1, 3, and 7-day memory consolidation intervals are now active. Lessons completed 1, 3, and 7 days ago will alert you right on schedule.',
        type: 'announcement',
        read: false,
        createdAt: now - 1000 * 60 * 15, // 15 mins ago
        priority: 'high',
        actionUrl: 'review-queue',
        actionLabel: 'Open Review Queue',
        sender: 'Platform Update'
      },
      {
        id: `notif-seed-spaced-${userId.slice(0, 5)}`,
        userId,
        title: '🧠 3 Lessons Due for Review Today',
        message: 'Calculus, Molecular Biology, and Microeconomics have reached their 1, 3, and 7-day recall intervals. Review today to halt memory decay.',
        type: 'spaced-review',
        read: false,
        createdAt: now - 1000 * 60 * 45, // 45 mins ago
        priority: 'high',
        actionUrl: 'review-queue',
        actionLabel: 'Review Due Cards',
        sender: 'Nora Spaced Engine'
      },
      {
        id: `notif-seed-tutor-${userId.slice(0, 5)}`,
        userId,
        title: '🤖 Nora Socratic Study Prompt Ready',
        message: 'Nora noticed you completed the Cellular Respiration set. Would you like a 3-minute voice dialogue testing mitochondrial ATP synthesis?',
        type: 'study-reminder',
        read: true,
        createdAt: now - 1000 * 60 * 60 * 3, // 3 hours ago
        priority: 'normal',
        actionUrl: 'tutor',
        actionLabel: 'Start Voice Dialogue',
        sender: 'Nora AI Tutor'
      },
      {
        id: `notif-seed-streak-${userId.slice(0, 5)}`,
        userId,
        title: '🔥 3-Day Daily Study Streak!',
        message: 'Great consistency! Complete 15 more study minutes today to maintain your weekly run sprint pace.',
        type: 'streak',
        read: true,
        createdAt: now - 1000 * 60 * 60 * 14, // 14 hours ago
        priority: 'normal',
        actionUrl: 'weekly-run',
        actionLabel: 'View Weekly Run',
        sender: 'Learnora Cadence'
      }
    ];
  }

  /**
   * Plays a gentle, crisp dual-tone notification chime using Web Audio API synthesis
   */
  static playNotificationChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Resume context if suspended by browser autoplay policy
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: B5 (987.77 Hz) - harmonic fifth higher
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.08);
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  }

  /**
   * Request native browser desktop push notification permission.
   * Gracefully handles iframe sandboxing and cross-origin restrictions.
   */
  static async requestBrowserPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Enable in-app live drop alerts immediately
    this.setLiveAlertsEnabled(true);

    if (!('Notification' in window)) {
      return true;
    }

    try {
      // Check if in iframe
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        // In iframe environments, browsers block Notification.requestPermission.
        // Return true because in-app live drop banners are active!
        return true;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch (e) {
      console.warn('Native notification request notice:', e);
      return true;
    }
  }

  /**
   * Phone dual-buzz vibration mimicking WhatsApp / native phone haptics
   */
  static triggerPhoneVibration(pattern: number[] = [140, 60, 140]): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  /**
   * Request native phone / browser notification permission directly
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
   * Show real native phone system notification (displays in phone's top notification shade / tray)
   * Exactly matching Community Chat's mobile pop-up with vibration & audio chime
   */
  static showNativePhoneNotification(
    title: string, 
    options: { 
      body: string; 
      icon?: string; 
      badge?: string; 
      tag?: string; 
      actionUrl?: string;
      vibrate?: number[];
    }
  ): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const notifOptions: any = {
      body: options.body,
      icon: options.icon || '/pwa-192x192.png',
      badge: options.badge || '/pwa-192x192.png',
      tag: options.tag || `learnora-${Date.now()}`,
      renotify: true,
      vibrate: options.vibrate || [140, 60, 140],
      data: {
        url: options.actionUrl || '/',
        timestamp: Date.now()
      }
    };

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, notifOptions);
        }).catch(() => {
          try {
            new Notification(title, notifOptions);
          } catch {}
        });
      } else if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, notifOptions);
        }).catch(() => {
          try {
            new Notification(title, notifOptions);
          } catch {}
        });
      } else {
        new Notification(title, notifOptions);
      }
    } catch (e) {
      console.warn('Notice triggering native phone notification:', e);
    }
  }

  /**
   * Backward-compatible alias for desktop and mobile notifications
   */
  static triggerBrowserNotification(notif: NotificationItem, onClick?: () => void): void {
    this.showNativePhoneNotification(notif.title, {
      body: notif.message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: notif.id,
      actionUrl: notif.actionUrl
    });
    if (onClick && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(notif.title, {
          body: notif.message,
          icon: '/pwa-192x192.png',
          tag: notif.id
        });
        n.onclick = () => {
          window.focus();
          onClick();
          n.close();
        };
      } catch {}
    }
  }

  /**
   * Dispatches a real test Live Platform Update to preview the phone popup,
   * audio chime, vibration, and in-app banner immediately.
   */
  static triggerTestLiveUpdate(userId: string, callback?: (item: NotificationItem) => void): NotificationItem {
    const sampleUpdates = [
      {
        title: '🚀 Platform Update: Spaced Review Online',
        message: 'Anki-style 1, 3, and 7-day memory intervals are now active for all your enrolled courses.',
        actionUrl: 'review-queue',
        actionLabel: 'Open Review Queue',
        sender: 'Platform Admin'
      },
      {
        title: '📢 Nora AI Study Engine v2.4 Live',
        message: 'Voice dialogue quizzes and active recall prompts are now synced with your coursework.',
        actionUrl: 'tutor',
        actionLabel: 'Start Voice Dialogue',
        sender: 'Learnora Core'
      },
      {
        title: '⚡ Weekly Run Sprint Leaderboard Updated',
        message: 'New campus study challenges dropped! Complete 20 study minutes to climb the leaderboards.',
        actionUrl: 'weekly-run',
        actionLabel: 'View Leaderboard',
        sender: 'Learnora Cadence'
      }
    ];

    const pick = sampleUpdates[Math.floor(Math.random() * sampleUpdates.length)];
    const id = `test_live_${Date.now()}`;
    const notif: NotificationItem = {
      id,
      userId: userId || 'all',
      title: pick.title,
      message: pick.message,
      type: 'announcement',
      read: false,
      createdAt: Date.now(),
      priority: 'high',
      actionUrl: pick.actionUrl,
      actionLabel: pick.actionLabel,
      sender: pick.sender
    };

    // 1. Web Audio Chime
    this.playNotificationChime();

    // 2. Dual-pulse vibration
    this.triggerPhoneVibration();

    // 3. Native phone system push popup
    this.showNativePhoneNotification(notif.title, {
      body: notif.message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'live-update-drop',
      actionUrl: notif.actionUrl
    });

    // 4. In-app drop event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('learnora_live_notification_drop', { detail: notif }));
    }

    if (callback) {
      callback(notif);
    }

    return notif;
  }

  /**
   * Dispatches a real test Study Reminder / Spaced Repetition Due alert
   * with native phone popup, sound, vibration, and in-app card.
   */
  static triggerTestStudyReminder(userId: string, callback?: (item: NotificationItem) => void): NotificationItem {
    const sampleReminders = [
      {
        title: '🧠 3 Lessons Due for Review Today',
        message: 'Calculus, Molecular Biology, and Microeconomics reached their 1, 3, and 7-day recall intervals.',
        actionUrl: 'review-queue',
        actionLabel: 'Review Due Cards',
        sender: 'Nora Spaced Engine'
      },
      {
        title: '⏰ 15-Minute Study Sprint Due',
        message: 'Keep your 3-day streak alive! Complete a quick 10-flashcard review to halt forgetting decay.',
        actionUrl: 'review-queue',
        actionLabel: 'Start Quick Review',
        sender: 'Nora Study Companion'
      },
      {
        title: '🔥 Daily Streak Protection Alert',
        message: 'Your study streak ends at midnight. Review Cellular Respiration for 5 minutes to stay on pace!',
        actionUrl: 'weekly-run',
        actionLabel: 'Protect Streak',
        sender: 'Learnora Cadence'
      }
    ];

    const pick = sampleReminders[Math.floor(Math.random() * sampleReminders.length)];
    const id = `test_study_${Date.now()}`;
    const notif: NotificationItem = {
      id,
      userId: userId || 'all',
      title: pick.title,
      message: pick.message,
      type: 'spaced-review',
      read: false,
      createdAt: Date.now(),
      priority: 'high',
      actionUrl: pick.actionUrl,
      actionLabel: pick.actionLabel,
      sender: pick.sender
    };

    // 1. Web Audio Chime
    this.playNotificationChime();

    // 2. Dual-pulse vibration
    this.triggerPhoneVibration();

    // 3. Native phone system push popup
    this.showNativePhoneNotification(notif.title, {
      body: notif.message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'study-reminder-drop',
      actionUrl: notif.actionUrl
    });

    // 4. In-app drop event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('learnora_live_notification_drop', { detail: notif }));
    }

    if (callback) {
      callback(notif);
    }

    return notif;
  }

  /**
   * Subscribes to live real-time notifications for a user & platform-wide broadcasts
   * Calls onNewNotificationDrop when a fresh notification arrives in real-time!
   */
  static subscribeToLiveNotifications(
    userId: string,
    onNotificationsUpdated: (notifications: NotificationItem[]) => void,
    onNewNotificationDrop: (notif: NotificationItem) => void
  ): () => void {
    if (!userId) return () => {};

    const subscriptionStartTime = Date.now();
    const seenIds = new Set<string>();

    const getCleanList = (list: NotificationItem[]): NotificationItem[] => {
      const deletedIds = NotificationService.getDeletedIds(userId);
      return list.filter(n => !deletedIds.has(n.id));
    };

    // 1. Load initial cache
    let cachedList: NotificationItem[] = [];
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}${userId}`);
      if (raw) {
        cachedList = getCleanList(JSON.parse(raw));
        cachedList.forEach(n => seenIds.add(n.id));
        onNotificationsUpdated(cachedList);
      } else {
        cachedList = getCleanList(this.getSeedNotifications(userId));
        cachedList.forEach(n => seenIds.add(n.id));
        localStorage.setItem(`${STORAGE_KEY}${userId}`, JSON.stringify(cachedList));
        onNotificationsUpdated(cachedList);
      }
    } catch {
      cachedList = getCleanList(this.getSeedNotifications(userId));
      cachedList.forEach(n => seenIds.add(n.id));
      onNotificationsUpdated(cachedList);
    }

    const mergeAndBroadcast = (incoming: NotificationItem[]) => {
      const deletedIds = NotificationService.getDeletedIds(userId);
      const map = new Map<string, NotificationItem>();
      
      // Keep cached (filtering out any deleted IDs)
      cachedList.filter(n => !deletedIds.has(n.id)).forEach(n => map.set(n.id, n));

      // Merge incoming (filtering out any deleted IDs)
      incoming.filter(n => !deletedIds.has(n.id)).forEach(n => {
        const isNewArrival = !seenIds.has(n.id) && (n.createdAt >= subscriptionStartTime - 3000);
        
        map.set(n.id, n);
        seenIds.add(n.id);

        if (isNewArrival && NotificationService.isLiveAlertsEnabled()) {
          this.playNotificationChime();
          this.triggerPhoneVibration();
          this.showNativePhoneNotification(n.title, {
            body: n.message,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: n.id,
            actionUrl: n.actionUrl
          });
          onNewNotificationDrop(n);
        }
      });

      const updated = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      cachedList = updated;

      try {
        localStorage.setItem(`${STORAGE_KEY}${userId}`, JSON.stringify(updated));
      } catch {}

      onNotificationsUpdated(updated);
    };

    // 2. Realtime listener on Firestore: User Notifications & Broadcasts
    const unsubs: (() => void)[] = [];

    try {
      // User-specific notifications
      const userQ = query(
        collection(db, 'notifications'), 
        where('userId', '==', userId),
        limit(50)
      );
      const unsubUser = onSnapshot(userQ, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationItem));
        mergeAndBroadcast(items);
      }, (err) => {
        console.warn('Notice listening to user notifications:', err);
      });
      unsubs.push(unsubUser);

      // Platform broadcast notifications ('all')
      const broadcastQ = query(
        collection(db, 'notifications'),
        where('userId', '==', 'all'),
        limit(20)
      );
      const unsubBroadcast = onSnapshot(broadcastQ, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationItem));
        mergeAndBroadcast(items);
      }, (err) => {
        console.warn('Notice listening to broadcast notifications:', err);
      });
      unsubs.push(unsubBroadcast);
    } catch (e) {
      console.warn('Notice setting up Firestore notification listeners:', e);
    }

    // 3. Listen to local cross-tab / window drop events & deletion events
    const handleLocalDrop = (event: CustomEvent<NotificationItem>) => {
      const item = event.detail;
      if (item && (item.userId === 'all' || item.userId === userId)) {
        mergeAndBroadcast([item]);
      }
    };

    const handleDeleteEvent = (e: CustomEvent<{ notifId: string }>) => {
      const notifId = e.detail?.notifId;
      if (notifId) {
        cachedList = cachedList.filter(n => n.id !== notifId);
        onNotificationsUpdated(cachedList);
      }
    };

    const handleClearEvent = () => {
      cachedList = [];
      onNotificationsUpdated([]);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === BROADCAST_EVENT_KEY && e.newValue) {
        try {
          const item = JSON.parse(e.newValue) as NotificationItem;
          if (item && (item.userId === 'all' || item.userId === userId)) {
            mergeAndBroadcast([item]);
          }
        } catch {}
      }
    };

    window.addEventListener('learnora_live_notification_drop' as any, handleLocalDrop as any);
    window.addEventListener('learnora_notification_deleted' as any, handleDeleteEvent as any);
    window.addEventListener('learnora_notifications_cleared' as any, handleClearEvent as any);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubs.forEach(u => u());
      window.removeEventListener('learnora_live_notification_drop' as any, handleLocalDrop as any);
      window.removeEventListener('learnora_notification_deleted' as any, handleDeleteEvent as any);
      window.removeEventListener('learnora_notifications_cleared' as any, handleClearEvent as any);
      window.removeEventListener('storage', handleStorageChange);
    };
  }

  /**
   * Broadcasts a live platform-wide notification to ALL users
   */
  static async broadcastPlatformUpdate(data: {
    title: string;
    message: string;
    type?: NotificationType;
    priority?: 'normal' | 'high' | 'urgent';
    actionUrl?: string;
    actionLabel?: string;
    sender?: string;
  }): Promise<NotificationItem> {
    const id = `broadcast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const notification: NotificationItem = {
      id,
      userId: 'all',
      title: data.title,
      message: data.message,
      type: data.type || 'announcement',
      read: false,
      createdAt: Date.now(),
      priority: data.priority || 'high',
      actionUrl: data.actionUrl || undefined,
      actionLabel: data.actionLabel || undefined,
      sender: data.sender || 'Platform Admin'
    };

    // 1. Write to Firestore
    try {
      await setDoc(doc(db, 'notifications', id), notification);
    } catch (e) {
      console.warn('Notice writing broadcast to Firestore:', e);
    }

    // 2. Broadcast across tabs and local storage
    try {
      localStorage.setItem(BROADCAST_EVENT_KEY, JSON.stringify(notification));
      this.playNotificationChime();
      this.triggerPhoneVibration();
      this.showNativePhoneNotification(notification.title, {
        body: notification.message,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: notification.id,
        actionUrl: notification.actionUrl
      });
      window.dispatchEvent(new CustomEvent('learnora_live_notification_drop', { detail: notification }));
    } catch {}

    return notification;
  }

  /**
   * Sends a targeted live notification to a specific user
   */
  static async sendUserLiveNotification(
    userId: string,
    data: {
      title: string;
      message: string;
      type: NotificationType;
      priority?: 'normal' | 'high' | 'urgent';
      actionUrl?: string;
      actionLabel?: string;
      sender?: string;
    }
  ): Promise<NotificationItem> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const notification: NotificationItem = {
      id,
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: false,
      createdAt: Date.now(),
      priority: data.priority || 'normal',
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      sender: data.sender || 'Nora AI Study Companion'
    };

    // 1. Write to Firestore
    try {
      await setDoc(doc(db, 'notifications', id), notification);
    } catch (e) {
      console.warn('Notice writing notification to Firestore:', e);
    }

    // 2. Broadcast local event with native phone popup, audio, and haptics
    try {
      this.playNotificationChime();
      this.triggerPhoneVibration();
      this.showNativePhoneNotification(notification.title, {
        body: notification.message,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: notification.id,
        actionUrl: notification.actionUrl
      });
      window.dispatchEvent(new CustomEvent('learnora_live_notification_drop', { detail: notification }));
    } catch {}

    return notification;
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(userId: string, notifId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch {}

    // Update local storage cache
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}${userId}`);
      if (raw) {
        const list: NotificationItem[] = JSON.parse(raw);
        const updated = list.map(n => n.id === notifId ? { ...n, read: true } : n);
        localStorage.setItem(`${STORAGE_KEY}${userId}`, JSON.stringify(updated));
      }
    } catch {}
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string, notifications: NotificationItem[]): Promise<void> {
    const unread = notifications.filter(n => !n.read);
    
    // Cloud Firestore batch updates
    for (const notif of unread) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), { read: true });
      } catch {}
    }

    // Local storage cache update
    try {
      const updated = notifications.map(n => ({ ...n, read: true }));
      localStorage.setItem(`${STORAGE_KEY}${userId}`, JSON.stringify(updated));
    } catch {}
  }

  /**
   * Delete a notification permanently from memory, localStorage cache, blacklist, and Firestore
   */
  static async deleteNotification(userId: string, notifId: string): Promise<void> {
    if (!notifId) return;

    // 1. Blacklist ID globally and per-user so it can NEVER reappear
    this.addDeletedId(userId, notifId);

    // 2. Remove from local storage cache across all user keys
    try {
      if (userId) {
        const raw = localStorage.getItem(`${STORAGE_KEY}${userId}`);
        if (raw) {
          const list: NotificationItem[] = JSON.parse(raw);
          const updated = list.filter(n => n.id !== notifId);
          localStorage.setItem(`${STORAGE_KEY}${userId}`, JSON.stringify(updated));
        }
      }

      // Purge from any matching cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY)) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const list: NotificationItem[] = JSON.parse(raw);
              if (list.some(n => n.id === notifId)) {
                localStorage.setItem(key, JSON.stringify(list.filter(n => n.id !== notifId)));
              }
            }
          } catch {}
        }
      }
    } catch {}

    // 3. Delete from Firestore if it exists
    try {
      await deleteDoc(doc(db, 'notifications', notifId));
    } catch {}

    // 4. Dispatch event so any open drop listener or active tab immediately removes it
    window.dispatchEvent(new CustomEvent('learnora_notification_deleted', { detail: { notifId } }));
  }

  /**
   * Clear all notifications for a user permanently
   */
  static async clearAll(userId: string, notifications: NotificationItem[]): Promise<void> {
    // 1. Blacklist all current IDs
    notifications.forEach(n => this.addDeletedId(userId, n.id));

    // 2. Clear cache
    try {
      localStorage.removeItem(`${STORAGE_KEY}${userId}`);
    } catch {}

    // 3. Delete user documents from Firestore
    for (const n of notifications) {
      if (n.userId !== 'all') {
        try {
          await deleteDoc(doc(db, 'notifications', n.id));
        } catch {}
      }
    }

    // 4. Dispatch event
    window.dispatchEvent(new CustomEvent('learnora_notifications_cleared'));
  }
}
