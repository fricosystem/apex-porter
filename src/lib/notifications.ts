// Utilitários de notificações nativas (barra de notificações do sistema).
// Funciona em PWA Android, tablet e desktop quando o usuário concede permissão.

let lastNotificationBody = '';
let lastNotificationTime = 0;

const PUSH_PERMISSION_PROMPTED_KEY = 'apex_porter_push_permission_prompted_v1';
const PUSH_PREFERENCE_SET_KEY = 'apex_porter_push_preference_set_v1';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && !!window.Notification;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!notificationsSupported()) return 'unsupported';
  return window.Notification.permission;
}

export function requestNotificationPermission(): Promise<NotificationPermissionState> {
  return new Promise((resolve) => {
    if (!notificationsSupported()) {
      resolve('unsupported');
      return;
    }
    if (window.Notification.permission === 'granted' || window.Notification.permission === 'denied') {
      resolve(window.Notification.permission);
      return;
    }
    window.Notification
      .requestPermission()
      .then((p) => resolve(p))
      .catch(() => resolve('denied'));
  });
}

export function hasNotificationPermissionPromptBeenShown(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PUSH_PERMISSION_PROMPTED_KEY) === 'true';
}

export function markNotificationPermissionPromptAsShown(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PUSH_PERMISSION_PROMPTED_KEY, 'true');
}

export function hasNotificationPreferenceBeenSet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PUSH_PREFERENCE_SET_KEY) === 'true';
}

export function markNotificationPreferenceAsSet(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PUSH_PREFERENCE_SET_KEY, 'true');
}

/** Solicita a permissão uma única vez durante o primeiro login/cadastro no dispositivo. */
export async function requestNotificationPermissionOnAuth(): Promise<NotificationPermissionState> {
  const permission = getNotificationPermission();
  if (permission !== 'default' || hasNotificationPermissionPromptBeenShown()) {
    return permission;
  }

  markNotificationPermissionPromptAsShown();
  return requestNotificationPermission();
}

export function showSystemNotification(title: string, body: string): void {
  if (!notificationsSupported()) return;
  if (window.Notification.permission !== 'granted') return;
  try {
    const now = Date.now();
    // Evita duplicar a mesma mensagem disparada em sequência
    if (body === lastNotificationBody && now - lastNotificationTime < 3000) return;
    lastNotificationBody = body;
    lastNotificationTime = now;

    const notification = new window.Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/maskable-icon-512x512.png',
      tag: `apex-${now}`,
    });

    notification.onclick = () => {
      notification.close();
      if (typeof window !== 'undefined' && 'focus' in window) {
        window.focus();
      }
    };
  } catch {
    // Nunca deve quebrar o fluxo do app por causa de notificação
  }
}
