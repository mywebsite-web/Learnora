import { doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  PushDeviceRecord, 
  PushNotificationPreferences, 
  DEFAULT_PUSH_PREFERENCES 
} from '../types';

const PREFS_STORAGE_KEY = 'learnora_push_preferences_';
const DEVICE_ID_STORAGE_KEY = 'learnora_push_device_id';
const SUBSCRIPTION_CACHE_KEY = 'learnora_push_subscription_cached';

// Helper: Convert URL-safe base64 string to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper: Detect client device type and browser
function detectDeviceContext() {
  if (typeof window === 'undefined') {
    return { deviceType: 'unknown' as const, browser: 'unknown', userAgent: '' };
  }

  const ua = navigator.userAgent.toLowerCase();
  let deviceType: 'android' | 'ios' | 'desktop' | 'mobile' | 'unknown' = 'desktop';

  if (/android/.test(ua)) {
    deviceType = 'android';
  } else if (/iphone|ipad|ipod/.test(ua)) {
    deviceType = 'ios';
  } else if (/mobile|blackberry|iemobile|opera mini/.test(ua)) {
    deviceType = 'mobile';
  }

  let browser = 'Unknown Browser';
  if (/edg\//.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/.test(ua) && !/chrome/.test(ua)) browser = 'Apple Safari';
  else if (/opera|opr\//.test(ua)) browser = 'Opera';

  return { deviceType, browser, userAgent: navigator.userAgent };
}

export class WebPushService {
  private static cachedVapidKey: string | null = null;
  private static swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Check if the browser environment supports Service Workers and Push API
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Check whether the application is running inside an iframe (like AI Studio preview)
   */
  static isInIframe(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  /**
   * Returns current browser notification permission
   */
  static getPermissionState(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Helper to open the app standalone outside of an iframe so the browser's native permission prompt can display
   */
  static openStandaloneToPrompt(): void {
    if (typeof window === 'undefined') return;
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('request_push', '1');
      window.open(currentUrl.toString(), '_blank');
    } catch {
      window.open(window.location.href, '_blank');
    }
  }

  /**
   * Directly request native notification permission
   */
  static async requestNativePermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      return await Notification.requestPermission();
    } catch (e) {
      console.warn('Native permission request notice:', e);
      return Notification.permission || 'denied';
    }
  }

  /**
   * Generates or retrieves a persistent unique identifier for this device/browser
   */
  static getDeviceId(): string {
    if (typeof window === 'undefined') return 'server_device';
    let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!deviceId) {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    }
    return deviceId;
  }

  /**
   * Retrieve the active VAPID public key from the backend proxy
   */
  static async getVapidPublicKey(): Promise<string> {
    if (this.cachedVapidKey) {
      return this.cachedVapidKey;
    }

    try {
      const res = await fetch('/api/push/vapid-public-key');
      if (res.ok) {
        const data = await res.json();
        if (data.publicKey) {
          this.cachedVapidKey = data.publicKey;
          return data.publicKey;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch VAPID key from server:', e);
    }

    // Default fallback application server key if network unavailable
    return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
  }

  /**
   * Register or retrieve the Firebase messaging push service worker
   */
  static async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;

    if (this.swRegistration && this.swRegistration.active) {
      return this.swRegistration;
    }

    try {
      // Look for existing registrations first
      const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (existing) {
        this.swRegistration = existing;
        return existing;
      }

      // Register firebase-messaging-sw.js
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });

      // Wait for service worker to activate
      await navigator.serviceWorker.ready;
      this.swRegistration = reg;
      return reg;
    } catch (error) {
      console.warn('Service worker registration notice:', error);
      try {
        const fallbackReady = await navigator.serviceWorker.ready;
        this.swRegistration = fallbackReady;
        return fallbackReady;
      } catch {
        return null;
      }
    }
  }

  /**
   * Get existing native push subscription if one already exists
   */
  static async getExistingSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;

    try {
      const reg = await this.getServiceWorkerRegistration();
      if (!reg) return null;
      return await reg.pushManager.getSubscription();
    } catch (e) {
      console.warn('Error reading existing push subscription:', e);
      return null;
    }
  }

  /**
   * Request push permission and subscribe the device to Web Push / FCM
   */
  static async subscribeDevice(
    userId: string,
    userEmail?: string,
    customPrefs?: Partial<PushNotificationPreferences>
  ): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
    if (!this.isSupported()) {
      return { 
        success: false, 
        error: 'Web Push is not supported in this browser. Please use Chrome, Edge, Firefox, or install as PWA.' 
      };
    }

    // 1. Explicit permission request - always attempt prompt on user gesture
    let permission: NotificationPermission = Notification.permission;
    try {
      if (typeof Notification !== 'undefined' && typeof Notification.requestPermission === 'function') {
        permission = await Notification.requestPermission();
      }
    } catch (err: any) {
      console.warn('Notification permission request notice:', err);
    }

    if (permission !== 'granted') {
      const isIframe = this.isInIframe();
      return { 
        success: false, 
        error: isIframe
          ? 'Browser restricted notification prompt inside embedded preview. Open in a standalone tab or install as PWA to allow.'
          : permission === 'denied' 
            ? 'Browser blocked notifications. Tap the lock/tune icon beside the URL to set Notifications to Allow, then click Re-Check.' 
            : 'Notification permission dismissed.' 
      };
    }

    // 2. Ensure service worker is registered & ready
    const reg = await this.getServiceWorkerRegistration();
    if (!reg) {
      return { success: false, error: 'Could not initialize push service worker.' };
    }

    // 3. Fetch public VAPID key
    const vapidKey = await this.getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    // 4. Create or reuse PushSubscription
    let subscription: PushSubscription | null = await reg.pushManager.getSubscription();

    if (!subscription) {
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any
        });
      } catch (subErr: any) {
        console.error('pushManager.subscribe error:', subErr);
        return { 
          success: false, 
          error: `Failed to subscribe with push service: ${subErr?.message || subErr}` 
        };
      }
    }

    if (!subscription) {
      return { success: false, error: 'Failed to obtain push subscription from browser.' };
    }

    // 5. Build full device registration record
    const subJson = subscription.toJSON();
    const deviceId = this.getDeviceId();
    const context = detectDeviceContext();
    const existingPrefs = this.getPreferences(userId);
    const preferences: PushNotificationPreferences = {
      ...existingPrefs,
      ...customPrefs
    };

    const record: PushDeviceRecord = {
      id: deviceId,
      userId,
      userEmail: userEmail || '',
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subJson.keys?.p256dh || '',
        auth: subJson.keys?.auth || ''
      },
      deviceType: context.deviceType,
      browser: context.browser,
      userAgent: context.userAgent,
      enabled: true,
      preferences,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastSeenAt: Date.now()
    };

    // 6. Register with Server API
    try {
      await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          userId,
          userEmail,
          subscription: subJson,
          deviceType: context.deviceType,
          browser: context.browser,
          userAgent: context.userAgent,
          preferences
        })
      });
    } catch (apiErr) {
      console.warn('Notice registering device to server API:', apiErr);
    }

    // 7. Store in Firestore pushDevices collection for high-availability synchronization
    try {
      await setDoc(doc(db, 'pushDevices', deviceId), record);
    } catch (fsErr) {
      console.warn('Notice syncing push device to Firestore:', fsErr);
    }

    // 8. Cache locally
    try {
      localStorage.setItem(`${PREFS_STORAGE_KEY}${userId}`, JSON.stringify(preferences));
      localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(subJson));
    } catch {}

    return { success: true, subscription };
  }

  /**
   * Unsubscribe this device from push notifications and disable token on server
   */
  static async unsubscribeDevice(userId: string): Promise<boolean> {
    try {
      // 1. Unsubscribe native push manager
      const existing = await this.getExistingSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      const deviceId = this.getDeviceId();

      // 2. Notify server
      try {
        await fetch('/api/push/unregister', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, userId })
        });
      } catch {}

      // 3. Update Firestore record
      try {
        await updateDoc(doc(db, 'pushDevices', deviceId), {
          enabled: false,
          updatedAt: Date.now()
        });
      } catch {}

      // 4. Update local cache
      try {
        localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
      } catch {}

      return true;
    } catch (e) {
      console.error('Error during unsubscribe:', e);
      return false;
    }
  }

  /**
   * Load user push preferences (daily reminders, quiet hours, etc.)
   */
  static getPreferences(userId?: string): PushNotificationPreferences {
    if (typeof window === 'undefined') return DEFAULT_PUSH_PREFERENCES;
    try {
      const key = userId ? `${PREFS_STORAGE_KEY}${userId}` : 'learnora_push_preferences_guest';
      const stored = localStorage.getItem(key);
      if (stored) {
        return { ...DEFAULT_PUSH_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_PUSH_PREFERENCES;
  }

  /**
   * Save user notification preferences
   */
  static async savePreferences(
    userId: string, 
    prefs: Partial<PushNotificationPreferences>
  ): Promise<PushNotificationPreferences> {
    const current = this.getPreferences(userId);
    const updated: PushNotificationPreferences = { ...current, ...prefs };

    // 1. LocalStorage
    try {
      localStorage.setItem(`${PREFS_STORAGE_KEY}${userId}`, JSON.stringify(updated));
    } catch {}

    const deviceId = this.getDeviceId();

    // 2. Server API
    try {
      await fetch('/api/push/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, userId, preferences: updated })
      });
    } catch {}

    // 3. Firestore
    try {
      await updateDoc(doc(db, 'pushDevices', deviceId), {
        preferences: updated,
        updatedAt: Date.now()
      });
    } catch {}

    return updated;
  }

  /**
   * Dispatches a real test push notification to this user's registered device
   */
  static async sendTestPushToDevice(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          deviceId: this.getDeviceId() 
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { 
          success: true, 
          message: data.message || 'Push notification dispatched! Check your phone or desktop notification tray.' 
        };
      }
      return { 
        success: false, 
        message: data.error || 'Failed to dispatch test notification' 
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: err?.message || 'Network error dispatching test push' 
      };
    }
  }

  /**
   * Setup listener for service-worker background/foreground push messages
   */
  static listenForMessages(callback: (payload: any) => void): () => void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return () => {};
    }

    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LEARNORA_PUSH_RECEIVED') {
        callback(event.data.payload);
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handler);
    };
  }
}
