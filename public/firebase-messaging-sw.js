// Learnora AI Learning Platform - Web Push & FCM Service Worker
// Supports background system push notifications on Android, Desktop, and iOS PWA

const SW_VERSION = 'learnora-push-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Native Web Push / FCM Push Event Handler
self.addEventListener('push', (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = {
        title: 'Learnora - Study Reminder',
        message: event.data.text()
      };
    }
  }

  // Support both standard Web Push and FCM data/notification structures
  const notification = payload.notification || payload;
  const data = payload.data || payload;

  const title = notification.title || data.title || 'Learnora - AI Personal Lecturer';
  const body = notification.body || notification.message || data.message || 'You have a study update waiting for you.';
  const icon = notification.icon || data.icon || '/pwa-192x192.png';
  const badge = notification.badge || data.badge || '/favicon-32x32.png';
  const actionUrl = data.url || data.actionUrl || notification.click_action || '/';
  const actionLabel = data.actionLabel || 'Open Learnora';
  const tag = data.tag || notification.tag || 'learnora-push-alert';

  const notificationOptions = {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    requireInteraction: data.priority === 'urgent' || data.priority === 'high',
    vibrate: [120, 60, 120],
    data: {
      url: actionUrl,
      timestamp: Date.now(),
      id: data.id || ('push_' + Date.now()),
      type: data.type || 'study-reminder'
    },
    actions: [
      { action: 'open', title: actionLabel },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Notify active foreground windows to show in-app drop without duplicate chime
      const hasFocusedClient = clients.some(c => c.focused);
      for (const client of clients) {
        client.postMessage({
          type: 'LEARNORA_PUSH_RECEIVED',
          payload: {
            title,
            body,
            data: notificationOptions.data,
            isInForeground: hasFocusedClient
          }
        });
      }

      // Always show native notification on mobile / background
      return self.registration.showNotification(title, notificationOptions);
    })
  );
});

// Notification Click Handler: Deep Link Navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const rawUrl = event.notification.data?.url || '/';
  // Construct absolute URL
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then((focusedClient) => {
            if (focusedClient && 'navigate' in focusedClient) {
              return focusedClient.navigate(targetUrl);
            }
          });
        }
      }
      // If no window is open, open a new browser window/PWA instance
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
