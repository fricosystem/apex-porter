'use client';

import { useEffect } from 'react';
import {
  notificationsSupported,
  requestNotificationPermission,
  showSystemNotification,
} from '@/lib/notifications';

// Ponte que espelha os toasts do sonner para as notificações nativas do sistema
// (barra de notificações do Android PWA, tablet e desktop).
export default function NotificationBridge() {
  useEffect(() => {
    if (!notificationsSupported()) return;

    // Solicita permissão no primeiro gesto do usuário (exigido no iOS/Android)
    const requestOnGesture = () => {
      requestNotificationPermission();
      window.removeEventListener('pointerdown', requestOnGesture);
      window.removeEventListener('keydown', requestOnGesture);
      window.removeEventListener('touchstart', requestOnGesture);
    };
    if (window.Notification.permission === 'default') {
      window.addEventListener('pointerdown', requestOnGesture);
      window.addEventListener('keydown', requestOnGesture);
      window.addEventListener('touchstart', requestOnGesture);
    }

    let observer: MutationObserver | null = null;

    const startObserving = () => {
      const toaster = document.querySelector('[data-sonner-toaster]');
      if (!toaster) return false;

      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            // Toasts de "loading" não geram notificação nativa
            if (node.getAttribute('data-type') === 'loading') return;
            const text = (node.textContent || '').trim();
            if (!text) return;
            showSystemNotification('APEX Portaria', text);
          });
        });
      });
      observer.observe(toaster, { childList: true, subtree: true });
      return true;
    };

    if (startObserving()) {
      return () => observer?.disconnect();
    }

    // O toaster pode montar depois deste componente; aguarda aparecer
    const interval = window.setInterval(() => {
      if (startObserving()) {
        window.clearInterval(interval);
      }
    }, 500);

    return () => {
      window.clearInterval(interval);
      observer?.disconnect();
    };
  }, []);

  return null;
}
