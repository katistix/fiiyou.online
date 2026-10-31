// When to offer "Install fiiyou". Pure logic, unit-tested (tests/client/installHint.test.mjs); the browser side is src/ui/install.js.
// Rules, so the hint is helpful and never naggy: not on the very first visit, never once installed, and after "Not now" it stays away for 30 days.
export const KEY = 'fiiyou.install';
export const MIN_VISITS = 2;
export const SNOOZE_DAYS = 30;

const blank = () => ({ visits: 0, dismissedAt: 0, installed: false });
export function readState(storage) {
  try { const s = JSON.parse(storage?.getItem(KEY) || '{}'); return { visits: Math.max(0, +s.visits || 0), dismissedAt: +s.dismissedAt || 0, installed: s.installed === true }; } catch { return blank(); }
}
const save = (storage, s) => { try { storage?.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: the hint just comes back next time */ } return s; };

/** Counts this browser tab session once, however many times the page code runs (sessionStorage remembers that it was counted). */
export function countVisit(storage, session) {
  try { if (session?.getItem(`${KEY}.counted`)) return readState(storage); session?.setItem(`${KEY}.counted`, '1'); } catch { /* count it anyway */ }
  const s = readState(storage);
  return save(storage, { ...s, visits: s.visits + 1 });
}
export const dismiss = (storage, now = Date.now()) => save(storage, { ...readState(storage), dismissedAt: now });
export const markInstalled = (storage) => save(storage, { ...readState(storage), installed: true });

export function shouldShow(state, now = Date.now()) {
  if (state.installed || state.visits < MIN_VISITS) return false;
  if (state.dismissedAt && now - state.dismissedAt < SNOOZE_DAYS * 86_400_000) return false;
  return true;
}
