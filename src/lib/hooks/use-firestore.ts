// ── Custom Firestore Hooks (Phase 8) ──
// Reusable hooks for subscribing to Firestore collections and documents
// These hooks automatically subscribe on mount and unsubscribe on unmount

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import {
  subscribeCollection,
  subscribeDocument,
  type Unsubscribe,
} from '@/lib/firestore';

/**
 * Hook that subscribes to a Firestore collection in real-time
 * and updates the Zustand store automatically.
 *
 * @param collectionPath - The Firestore collection path
 * @param storeKey - The key in the Zustand store to update
 * @param enabled - Whether the subscription should be active (default: true)
 *
 * @example
 * useFirestoreCollection<Empresa>('empresas', 'empresas');
 */
export function useFirestoreCollection<T extends { id: string }>(
  collectionPath: string,
  storeKey: keyof typeof useAppStore.getState,
  enabled = true,
): void {
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      return;
    }

    unsubRef.current = subscribeCollection<T>(collectionPath, (data) => {
      useAppStore.setState({ [storeKey]: data } as Partial<typeof useAppStore.getState>);
    });

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [collectionPath, storeKey, enabled]);
}

/**
 * Hook that subscribes to a single Firestore document in real-time.
 *
 * @param collectionPath - The Firestore collection path
 * @param docId - The document ID
 * @param callback - Callback function when data changes
 * @param enabled - Whether the subscription should be active (default: true)
 *
 * @example
 * useFirestoreDocument<Empresa>('empresas', 'emp1', (data) => { ... });
 */
export function useFirestoreDocument<T extends { id: string }>(
  collectionPath: string,
  docId: string,
  callback: (data: T | null) => void,
  enabled = true,
): void {
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!enabled || !docId) {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      return;
    }

    unsubRef.current = subscribeDocument<T>(collectionPath, docId, callback);

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [collectionPath, docId, enabled, callback]);
}

/**
 * Hook that tracks online/offline status and updates the store.
 * Should be used once at the app root level.
 *
 * @example
 * useOnlineStatus();
 */
export function useOnlineStatus(): boolean {
  const isOnline = useAppStore((s) => s.isOnline);
  const setOnlineStatus = useAppStore((s) => s.setOnlineStatus);

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    // Set initial status
    setOnlineStatus(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return isOnline;
}
