'use client';

import { useEffect, useState } from 'react';

export type SignalLevel = 0 | 1 | 2 | 3 | 4; // 0=offline, 1=fraco, 2=regular, 3=bom, 4=excelente

export interface SignalInfo {
  level: SignalLevel;
  label: string;
  latency: number | null; // ms
  effectiveType: string | null; // '4g' | '3g' | '2g' | 'slow-2g' | null
}

function getNetworkInfo(): { effectiveType: string | null; downlink: number | null } {
  if (typeof navigator === 'undefined') return { effectiveType: null, downlink: null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection;
  if (!conn) return { effectiveType: null, downlink: null };
  return {
    effectiveType: conn.effectiveType ?? null,
    downlink: conn.downlink ?? null,
  };
}

function effectiveTypeToLevel(effectiveType: string | null, latency: number | null): SignalLevel {
  // Se a latência foi medida, refine com base nela
  if (latency !== null) {
    if (latency > 1500) return 1;
    if (latency > 500) return 2;
    if (latency > 150) return 3;
    return 4;
  }
  // Fallback pela Network Information API
  switch (effectiveType) {
    case 'slow-2g': return 1;
    case '2g':      return 2;
    case '3g':      return 3;
    case '4g':      return 4;
    default:        return 3; // assume bom se não tiver info
  }
}

const LABELS: Record<SignalLevel, string> = {
  0: 'Offline',
  1: 'Fraco',
  2: 'Regular',
  3: 'Bom',
  4: 'Ótimo',
};

async function measureLatency(): Promise<number | null> {
  try {
    const url = `${window.location.origin}/favicon.ico?_=${Date.now()}`;
    const start = performance.now();
    await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return Math.round(performance.now() - start);
  } catch {
    return null;
  }
}

export function useSignalStrength(): SignalInfo {
  const [info, setInfo] = useState<SignalInfo>({
    level: 3,
    label: 'Bom',
    latency: null,
    effectiveType: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    async function update() {
      const isOnline = navigator.onLine;
      if (!isOnline) {
        if (!cancelled) setInfo({ level: 0, label: 'Offline', latency: null, effectiveType: null });
        return;
      }

      const { effectiveType, downlink } = getNetworkInfo();
      const latency = await measureLatency();
      if (cancelled) return;

      const level = effectiveTypeToLevel(effectiveType, latency);
      setInfo({ level, label: LABELS[level], latency, effectiveType });
    }

    // Medição inicial
    update();

    // Atualiza a cada 15 segundos
    const interval = setInterval(update, 15_000);

    const handleOnline = () => update();
    const handleOffline = () => {
      if (!cancelled) setInfo({ level: 0, label: 'Offline', latency: null, effectiveType: null });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Escuta mudanças da Network Information API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection;
    conn?.addEventListener('change', update);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      conn?.removeEventListener('change', update);
    };
  }, []);

  return info;
}
