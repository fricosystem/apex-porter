const CACHE_NAME = 'apex-porter-v2';

const PRECACHE_URLS = [
  '/',
];

// Firebase domains that should NOT be intercepted by the service worker
// Firestore uses WebSocket/long-polling connections that must go directly to the server
const FIREBASE_DOMAINS = [
  'firebase.googleapis.com',
  'firestore.googleapis.com',
  'firebaseapp.com',
  'firebase.io',
  'googleapis.com',
  'securetoken.googleapis.com',
  'identitytoolkit.googleapis.com',
];

// Install event - precache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
// Firebase requests are passed through without caching
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  // Skip Firebase requests — let them pass through directly
  // Firebase manages its own offline persistence via IndexedDB
  const url = new URL(event.request.url);
  if (FIREBASE_DOMAINS.some((domain) => url.hostname.endsWith(domain))) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache same-origin responses with OK status
        if (response.ok && url.origin === self.location.origin) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache, return the offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
