'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import {
  registerPushTokenSilently,
  subscribeToPushMessages,
} from '@/lib/push-notifications';
import { subscribeDeviceNotificationEvents } from '@/lib/notification-events';
import { showSystemNotification } from '@/lib/notifications';

const seenNotificationIds = new Set<string>();

function payloadText(payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) {
  const title = payload.notification?.title || payload.data?.title || 'APEX Portaria';
  const body = payload.notification?.body || payload.data?.body || 'Nova atualização no sistema.';
  const notificationId = payload.data?.notificationId || `fcm-${title}-${body}`;
  const link = payload.data?.link || '/';
  return { title, body, notificationId, link };
}

async function showDeviceNotification(input: {
  title: string;
  body: string;
  notificationId: string;
  link?: string;
}) {
  if (seenNotificationIds.has(input.notificationId)) return;
  seenNotificationIds.add(input.notificationId);
  if (seenNotificationIds.size > 200) {
    const firstId = seenNotificationIds.values().next().value;
    if (firstId) seenNotificationIds.delete(firstId);
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(input.title, {
        body: input.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/maskable-icon-512x512.png',
        tag: input.notificationId,
        silent: false,
        data: { link: input.link || '/', notificationId: input.notificationId },
      });
      return;
    }
  } catch (error) {
    console.warn('[Notifications] Service Worker indisponível; usando fallback nativo:', error);
  }

  // Continua sendo uma notificação do sistema, nunca um toast dentro da aplicação.
  showSystemNotification(input.title, input.body);
}

// Ponte global de notificações: registra o dispositivo habilitado, escuta eventos
// Firestore sem servidor e trata FCM quando disponível.
export default function NotificationBridge() {
  const userId = useAppStore((state) => state.user?.id);
  const notificationsEnabled = useAppStore((state) => state.settings.notificationsEnabled);

  useEffect(() => {
    if (!userId || !notificationsEnabled) return;

    let disposed = false;
    let unsubscribeFcm = () => {};

    const unsubscribeEvents = subscribeDeviceNotificationEvents(userId, (event) => {
      if (disposed) return;
      void showDeviceNotification({
        title: event.title,
        body: event.body,
        notificationId: event.notificationId || event.id,
        link: event.link,
      });
    });

    registerPushTokenSilently(userId)
      .then((result) => {
        if (!result.enabled || disposed) return;
        return subscribeToPushMessages((payload) => {
          if (disposed) return;
          const notification = payloadText(payload);
          void showDeviceNotification(notification);
        });
      })
      .then((cleanup) => {
        if (cleanup) {
          if (disposed) cleanup();
          else unsubscribeFcm = cleanup;
        }
      })
      .catch((error) => {
        console.warn('[FCM] Falha ao registrar/ouvir notificações:', error);
      });

    return () => {
      disposed = true;
      unsubscribeEvents();
      unsubscribeFcm();
    };
  }, [userId, notificationsEnabled]);

  return null;
}
