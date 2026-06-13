'use client';

// ── Firebase Configuration & Initialization ──
// Firestore + Authentication only (no Analytics, no Storage, no Messaging)
// Configuration is loaded from environment variables (.env.local)

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

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

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured) {
  // Initialize Firebase (prevent re-initialization in dev hot reload)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  
  // Initialize Firestore
  db = getFirestore(app);
} else if (typeof window !== 'undefined') {
  console.warn('[Firebase] Missing Firebase configuration. Please set environment variables.');
}

// Type casting for exports so the rest of the app doesn't complain about undefined.
// If they are used without being initialized, it will throw at runtime (which is expected if missing config).
const exportedApp = app as FirebaseApp;
const exportedAuth = auth as Auth;
const exportedDb = db as Firestore;

export { exportedApp as app, exportedAuth as auth, exportedDb as db };
export default exportedApp;
