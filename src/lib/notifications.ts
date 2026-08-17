// Utilitários de notificações nativas (barra de notificações do sistema).
// Funciona em PWA Android, tablet e desktop quando o usuário concede permissão.

let lastNotificationBody = '';
let lastNotificationTime = 0;

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && !!window.Notification;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported';
  return window.Notification.permission;
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  return new Promise((resolve) => {
    if (!notificationsSupported()) {
      resolve('denied');
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
      icon: '/icons/icone-site.png',
      badge: '/icons/icon-192x192.png',
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
