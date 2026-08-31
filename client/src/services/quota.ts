const KEY = "dossier.general.quota.v1";
export const GENERAL_LIMIT = 8;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 15_000;

type Quota = {
  used: number;
  resetAt: number;
  lastAt: number;
};

function empty(): Quota {
  return { used: 0, resetAt: Date.now() + WINDOW_MS, lastAt: 0 };
}

function read(): Quota {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Quota;
    if (parsed.resetAt <= Date.now()) return empty();
    return parsed;
  } catch {
    return empty();
  }
}

function write(quota: Quota) {
  window.localStorage.setItem(KEY, JSON.stringify(quota));
}

export function generalQuota() {
  const quota = read();
  return {
    remaining: Math.max(0, GENERAL_LIMIT - quota.used),
    limit: GENERAL_LIMIT,
    cooldownMs: Math.max(0, COOLDOWN_MS - (Date.now() - quota.lastAt)),
  };
}

export function canConsumeGeneral(): { ok: true } | { ok: false; reason: "limit" | "cooldown"; waitMs?: number } {
  const quota = read();
  const waitMs = COOLDOWN_MS - (Date.now() - quota.lastAt);
  if (quota.used >= GENERAL_LIMIT) return { ok: false, reason: "limit" };
  if (waitMs > 0) return { ok: false, reason: "cooldown", waitMs };
  return { ok: true };
}

export function consumeGeneral(): { ok: true } | { ok: false; reason: "limit" | "cooldown"; waitMs?: number } {
  const gate = canConsumeGeneral();
  if (!gate.ok) return gate;
  const quota = read();
  write({ ...quota, used: quota.used + 1, lastAt: Date.now() });
  return { ok: true };
}
