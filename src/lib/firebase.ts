'use client';

// ── Firebase Configuration & Initialization ──
// Firestore + Authentication only (no Analytics, no Storage, no Messaging)
// Configuration is loaded from environment variables (.env.local)

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryEagerGarbageCollector } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase is properly configured
const isFirebaseConfigured = Object.values(firebaseConfig).every(value => value && value.length > 0);

let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let db: ReturnType<typeof getFirestore> | undefined;

if (isFirebaseConfigured) {
  // Initialize Firebase (prevent re-initialization in dev hot reload)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  
  // Initialize Firestore with cache settings (replaces deprecated enableIndexedDbPersistence)
  if (typeof window !== 'undefined') {
    db = initializeFirestore(app, {
      cache: { kind: 'persistent' }
    });
  } else {
    db = getFirestore(app);
  }
} else if (typeof window !== 'undefined') {
  console.warn('[Firebase] Missing Firebase configuration. Please set environment variables.');
}

export { app, auth, db };
export default app;
