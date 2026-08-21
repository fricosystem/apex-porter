import { useSyncExternalStore } from 'react';

export type ViewportMode = 'mobile' | 'tablet' | 'desktop';

export const TABLET_BREAKPOINT = 768;
export const DESKTOP_BREAKPOINT = 1280;

const DESKTOP_QUERY = `(min-width: ${DESKTOP_BREAKPOINT}px)`;
const TABLET_QUERY = `(min-width: ${TABLET_BREAKPOINT}px)`;

function getMode(): ViewportMode {
  if (typeof window === 'undefined') return 'mobile';
  if (window.matchMedia(DESKTOP_QUERY).matches) return 'desktop';
  if (window.matchMedia(TABLET_QUERY).matches) return 'tablet';
  return 'mobile';
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  const desktopMedia = window.matchMedia(DESKTOP_QUERY);
  const tabletMedia = window.matchMedia(TABLET_QUERY);
  desktopMedia.addEventListener('change', onStoreChange);
  tabletMedia.addEventListener('change', onStoreChange);

  return () => {
    desktopMedia.removeEventListener('change', onStoreChange);
    tabletMedia.removeEventListener('change', onStoreChange);
  };
}

function getServerSnapshot(): ViewportMode {
  return 'mobile';
}

export function useViewport() {
  const mode = useSyncExternalStore(subscribe, getMode, getServerSnapshot);
  return {
    mode,
    isMobile: mode === 'mobile',
    isTablet: mode === 'tablet',
    isDesktop: mode === 'desktop',
  };
}

export function useIsDesktop() {
  return useViewport().isDesktop;
}
