import { NextResponse } from 'next/server';

const FIREBASE_VERSION = '12.13.0';

function jsonForWorker(value: string | undefined): string {
  return JSON.stringify(value || '');
}

export async function GET() {
  const worker = `
importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: ${jsonForWorker(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)},
  authDomain: ${jsonForWorker(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)},
  projectId: ${jsonForWorker(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)},
  storageBucket: ${jsonForWorker(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)},
  messagingSenderId: ${jsonForWorker(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)},
  appId: ${jsonForWorker(process.env.NEXT_PUBLIC_FIREBASE_APP_ID)},
  measurementId: ${jsonForWorker(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)}
});

const CACHE_NAME = 'apex-porter-v5';
const messaging = firebase.messaging();
const FIREBASE_DOMAINS = [
  'firebase.googleapis.com',
  'firestore.googleapis.com',
  'firebaseapp.com',
  'firebase.io',
  'googleapis.com',
  'securetoken.googleapis.com',
  'identitytoolkit.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'fcm.googleapis.com',
  'gstatic.com'
];

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || 'APEX Portaria';
  const body = data.body || 'Nova atualização no sistema.';
  const link = data.link || '/';
  const notificationId = data.notificationId || ('apex-' + Date.now());

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/maskable-icon-512x512.png',
      tag: notificationId,
      renotify: true,
      silent: false,
    data: { link, notificationId }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.link || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && client.url !== targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;
  const url = new URL(event.request.url);
  if (FIREBASE_DOMAINS.some((domain) => url.hostname.endsWith(domain))) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') return caches.match('/');
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }))
  );
});
`;

  return new NextResponse(worker, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
