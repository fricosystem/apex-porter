'use client';

import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { MessagePayload, Messaging } from 'firebase/messaging';
import { app, db } from './firebase';
import { createDeviceNotificationEvent } from './notification-events';
import {
  getNotificationPermission,
  requestNotificationPermission,
  requestNotificationPermissionOnAuth,
  hasNotificationPreferenceBeenSet,
  markNotificationPreferenceAsSet,
  type NotificationPermissionState,
} from './notifications';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const SERVICE_WORKER_PATH = '/sw';

export type PushSetupResult = {
  enabled: boolean;
  permission: NotificationPermissionState;
  token?: string;
  tokenId?: string;
};

export type PushMessage = MessagePayload;

function tokenDocumentId(token: string): string {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(token).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 500);
  }
  return encodeURIComponent(token).slice(0, 500);
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Este navegador não oferece suporte a service workers.');
  }

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
    scope: '/',
    updateViaCache: 'none',
  });
  return navigator.serviceWorker.ready.then(() => registration);
}

async function getMessagingContext(): Promise<{
  messaging: Messaging;
  registration: ServiceWorkerRegistration;
} | null> {
  if (typeof window === 'undefined' || !app || !db || !VAPID_KEY) return null;

  const { isSupported, getMessaging } = await import('firebase/messaging');
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const registration = await getServiceWorkerRegistration();
  return { messaging: getMessaging(app), registration };
}

export async function enablePushNotifications(
  uid: string,
  options: { requestPermission?: boolean } = {},
): Promise<PushSetupResult> {
  let permission = getNotificationPermission();
  if (options.requestPermission !== false && permission === 'default') {
    permission = await requestNotificationPermission();
  }

  if (permission !== 'granted') {
    return { enabled: false, permission };
  }

  const context = await getMessagingContext();
  if (!context || !db || !VAPID_KEY) {
    return { enabled: false, permission: 'unsupported' };
  }

  const { getToken } = await import('firebase/messaging');
  const token = await getToken(context.messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: context.registration,
  });

  if (!token) {
    return { enabled: false, permission };
  }

  const tokenId = tokenDocumentId(token);
  await setDoc(
    doc(db, 'usuarios', uid, 'pushTokens', tokenId),
    {
      token,
      enabled: true,
      platform: 'web',
      userAgent: navigator.userAgent,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { enabled: true, permission, token, tokenId };
}

export async function setupPushNotificationsAfterAuth(uid: string): Promise<PushSetupResult> {
  if (hasNotificationPreferenceBeenSet()) {
    return { enabled: false, permission: getNotificationPermission() };
  }

  const permission = await requestNotificationPermissionOnAuth();
  const { markNotificationPermissionPromptAsShown } = await import('./notifications');
  markNotificationPermissionPromptAsShown();
  if (permission !== 'granted') {
    return { enabled: false, permission };
  }

  const result = await enablePushNotifications(uid, { requestPermission: false });
  if (result.enabled) markNotificationPreferenceAsSet();
  return result;
}

export async function disablePushNotifications(uid: string): Promise<void> {
  const context = await getMessagingContext().catch(() => null);
  if (!context || !db) return;

  const { getToken, deleteToken } = await import('firebase/messaging');
  const token = await getToken(context.messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: context.registration,
  }).catch(() => null);

  if (token) {
    await deleteDoc(doc(db, 'usuarios', uid, 'pushTokens', tokenDocumentId(token))).catch(() => {});
  }
  await deleteToken(context.messaging).catch(() => {});
}

export async function registerPushTokenSilently(uid: string): Promise<PushSetupResult> {
  if (getNotificationPermission() !== 'granted') {
    return { enabled: false, permission: getNotificationPermission() };
  }
  return enablePushNotifications(uid, { requestPermission: false });
}

export async function subscribeToPushMessages(
  callback: (payload: PushMessage) => void,
): Promise<() => void> {
  const context = await getMessagingContext().catch(() => null);
  if (!context) return () => {};

  const { onMessage } = await import('firebase/messaging');
  return onMessage(context.messaging, callback);
}

export async function createTestPushRequest(uid: string, userName: string): Promise<string> {
  if (!db) throw new Error('Firebase não está configurado.');
  const ref = await addDoc(collection(db, 'pushTestRequests'), {
    requestedByUid: uid,
    targetUid: uid,
    requestedByName: userName,
    createdAt: serverTimestamp(),
  });

  await createDeviceNotificationEvent({
    kind: 'push-test',
    authorUid: uid,
    targetUid: uid,
    notificationId: `push-test-${ref.id}`,
    title: 'TESTE DE NOTIFICAÇÃO',
    body: `Olá, ${userName}. As notificações do dispositivo estão funcionando.`,
    link: '/#perfil',
  });

  return ref.id;
}

export function getPushStatus(): NotificationPermissionState {
  return getNotificationPermission();
}
