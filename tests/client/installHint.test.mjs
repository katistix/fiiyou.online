import test from 'node:test'; import assert from 'node:assert/strict';
import { readState, countVisit, dismiss, markInstalled, shouldShow, KEY, MIN_VISITS, SNOOZE_DAYS } from '../../src/lib/installHint.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const DAY = 86_400_000;

test('a new browser has seen nothing', () => { assert.deepEqual(readState(mem()), { visits: 0, dismissedAt: 0, installed: false }); assert.deepEqual(readState(null), { visits: 0, dismissedAt: 0, installed: false }); });

test('corrupt or hostile stored data falls back to the blank state', () => {
  for (const bad of ['{', 'null', '[]', '"x"', '{"visits":"lots","dismissedAt":"x","installed":"yes"}']) { const s = mem(); s.setItem(KEY, bad); const r = readState(s); assert.deepEqual(r, { visits: 0, dismissedAt: 0, installed: false }, bad); }
  const neg = mem(); neg.setItem(KEY, '{"visits":-4}'); assert.equal(readState(neg).visits, 0);
});

test('a visit is counted once per tab session', () => {
  const store = mem(), session = mem();
  assert.equal(countVisit(store, session).visits, 1); assert.equal(countVisit(store, session).visits, 1);
  assert.equal(countVisit(store, mem()).visits, 2);   // a new tab session is a new visit
});

test('never on the first visit, then yes', () => {
  const store = mem(); countVisit(store, mem()); assert.equal(shouldShow(readState(store)), false);
  countVisit(store, mem()); assert.ok(readState(store).visits >= MIN_VISITS); assert.equal(shouldShow(readState(store)), true);
});

test('"Not now" hides it for 30 days, then it may return', () => {
  const store = mem(); countVisit(store, mem()); countVisit(store, mem()); const t0 = Date.UTC(2026, 9, 31);
  dismiss(store, t0);
  assert.equal(shouldShow(readState(store), t0 + 1000), false); assert.equal(shouldShow(readState(store), t0 + (SNOOZE_DAYS - 1) * DAY), false);
  assert.equal(shouldShow(readState(store), t0 + SNOOZE_DAYS * DAY + 1), true);
});

test('once installed it never comes back', () => {
  const store = mem(); countVisit(store, mem()); countVisit(store, mem()); markInstalled(store);
  assert.equal(shouldShow(readState(store), Date.now() + 365 * DAY), false);
});

test('storage that throws (private mode) never breaks the app', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.doesNotThrow(() => { countVisit(broken, broken); dismiss(broken); markInstalled(broken); readState(broken); });
  assert.equal(shouldShow(readState(broken)), false);
});
