const STORAGE_KEY = 'apex_porter_auth_rate_limit_v1';
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const BASE_COOLDOWN_MS = 15 * 1000;
const MAX_COOLDOWN_MS = 15 * 60 * 1000;

type RateLimitState = {
  failures: number;
  windowStartedAt: number;
  lockedUntil: number;
};

const EMPTY_STATE: RateLimitState = {
  failures: 0,
  windowStartedAt: 0,
  lockedUntil: 0,
};

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readState(now = Date.now()): RateLimitState {
  const storage = getStorage();
  if (!storage) return EMPTY_STATE;

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || 'null') as Partial<RateLimitState> | null;
    if (!parsed || typeof parsed !== 'object') return EMPTY_STATE;

    const state: RateLimitState = {
      failures: Number.isFinite(parsed.failures) ? Math.max(0, Number(parsed.failures)) : 0,
      windowStartedAt: Number.isFinite(parsed.windowStartedAt) ? Math.max(0, Number(parsed.windowStartedAt)) : 0,
      lockedUntil: Number.isFinite(parsed.lockedUntil) ? Math.max(0, Number(parsed.lockedUntil)) : 0,
    };

    if ((state.windowStartedAt && now - state.windowStartedAt >= WINDOW_MS) || state.lockedUntil <= now) {
      if (state.lockedUntil <= now) state.lockedUntil = 0;
      if (state.windowStartedAt && now - state.windowStartedAt >= WINDOW_MS) {
        state.failures = 0;
        state.windowStartedAt = 0;
      }
      writeState(state);
    }

    return state;
  } catch {
    return EMPTY_STATE;
  }
}

function writeState(state: RateLimitState): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable in private browsing or restrictive environments.
  }
}

export function getLoginRateLimitStatus(now = Date.now()): { allowed: boolean; retryAfterMs: number } {
  const state = readState(now);
  const retryAfterMs = Math.max(0, state.lockedUntil - now);
  return { allowed: retryAfterMs === 0, retryAfterMs };
}

export function recordLoginFailure(now = Date.now()): { allowed: boolean; retryAfterMs: number } {
  const current = readState(now);
  const state = current.windowStartedAt && now - current.windowStartedAt < WINDOW_MS
    ? current
    : { ...EMPTY_STATE, windowStartedAt: now };

  const failures = state.failures + 1;
  const cooldownMultiplier = Math.max(0, failures - MAX_FAILURES);
  const cooldownMs = failures >= MAX_FAILURES
    ? Math.min(MAX_COOLDOWN_MS, BASE_COOLDOWN_MS * (2 ** cooldownMultiplier))
    : 0;

  const nextState: RateLimitState = {
    failures,
    windowStartedAt: state.windowStartedAt || now,
    lockedUntil: cooldownMs ? now + cooldownMs : 0,
  };
  writeState(nextState);

  return {
    allowed: cooldownMs === 0,
    retryAfterMs: cooldownMs,
  };
}

export function clearLoginFailures(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures; Firebase remains the authoritative control.
  }
}

export function formatLoginCooldown(retryAfterMs: number): string {
  const totalSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.ceil(totalSeconds / 60);
  return `${minutes} min`;
}
