// Rankify Background Notification & Cache Hygiene Service Worker
const SW_CACHE_VERSION = 'rankify-sw-v3';
const PRECACHE_ASSETS = [
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/favicon-32.png',
  '/favicon.ico',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SW_CACHE_VERSION).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache icon assets warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith('rankify-sw-') && name !== SW_CACHE_VERSION
            )
            .map((name) => caches.delete(name))
        );
      } catch (err) {
        // Ignore cache cleanup errors
      }
      await self.clients.claim();
    })()
  );
});

// Never cache Firebase Auth, Firestore, or dynamic API requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  try {
    const url = new URL(request.url);
    const isAuthOrFirestoreOrApi =
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/__/') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com') ||
      url.hostname.includes('googleapis.com');

    if (isAuthOrFirestoreOrApi) {
      return;
    }
  } catch (err) {
    return;
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            action: event.action || 'default',
            data: event.notification.data || {},
          });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, data, actions } = event.data.payload || {};
    if (!title) return;

    event.waitUntil(
      self.registration.showNotification(title, {
        body: body || '',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: tag || 'rankify-study-alert',
        renotify: true,
        data: data || {},
        actions: actions || [],
      })
    );
  }
});
