import test from 'node:test'; import assert from 'node:assert/strict'; import http from 'node:http';
import { parseDsn, scrubText, routePattern, parseStack, shouldIgnore, normalize, fingerprint, uaInfo, buildEvent, buildEnvelope, createReporter, installGlobalHandlers } from '../../src/lib/errorReport.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const DSN = 'https://abc123@errors.example.org/7';
const err = (msg = 'boom') => { const e = new Error(msg); e.stack = `Error: ${msg}\n    at render (https://fiiyou.online/assets/index-9f8e7d.js:1:2345)\n    at https://fiiyou.online/assets/vendor-1a2b3c.js:3:44`; return e; };
const rig = (extra = {}) => { const calls = []; const r = createReporter({ dsn: DSN, release: 'abc1234', fetch: async (url, init) => { calls.push({ url, init }); return { ok: true }; }, storage: mem(), session: mem(), pathname: () => '/dalin', origin: 'https://fiiyou.online', ua: 'Mozilla/5.0 (Linux; Android 14) Chrome/120.0 Mobile Safari/537.36', ...extra }); return { r, calls }; };
const flush = () => new Promise((res) => setTimeout(res, 5));

test('parseDsn accepts https, keeps a path prefix, refuses cleartext and junk', () => {
  assert.deepEqual(parseDsn(DSN), { origin: 'https://errors.example.org', key: 'abc123', project: '7', endpoint: 'https://errors.example.org/api/7/envelope/?sentry_key=abc123&sentry_version=7' });
  assert.equal(parseDsn('https://k@host.example/sentry/12').endpoint, 'https://host.example/sentry/api/12/envelope/?sentry_key=k&sentry_version=7');
  assert.ok(parseDsn('http://k@localhost:9000/1'));
  for (const bad of ['', undefined, 'nope', 'http://k@errors.example.org/7', 'https://errors.example.org/7', 'https://k@errors.example.org/', 'https://k@errors.example.org/a b']) assert.equal(parseDsn(bad), null, String(bad));
});

test('scrubText removes emails, tokens, ids and query strings', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijk';
  const out = scrubText(`fail for dalin@example.com id 3f2504e0-4f89-41d3-9a0c-0305e82c3301 ${jwt} https://x.supabase.co/storage/v1/o.webp?token=SECRET#frag access_token=abc.def password: "hunter2"`);
  for (const leak of ['dalin@example.com', '3f2504e0', 'eyJhbGci', 'SECRET', 'frag', 'abc.def', 'hunter2']) assert.ok(!out.includes(leak), `${leak} leaked: ${out}`);
  assert.ok(out.includes('<email>') && out.includes('<id>') && out.includes('<token>') && out.includes('https://x.supabase.co/storage/v1/o.webp'));
  assert.equal(scrubText('x'.repeat(40)), '<secret>'); assert.equal(scrubText('ab '.repeat(300)).length, 501); assert.equal(scrubText(null), '');
});

test('routePattern reports the kind of page, never who or what', () => {
  const cases = [['/', '/'], ['', '/'], ['/map', '/map'], ['/dalin', '/:user'], ['/dalin/edit', '/:user'], ['/post/3f2504e0-4f89-41d3-9a0c-0305e82c3301', '/post/:id'], ['/chat/abc', '/chat/:id'],
    ['/chat', '/chat'], ['/tag/food', '/tag/:tag'], ['/invite/dalin', '/invite/:user'], ['/admin/users', '/admin'], ['/Settings', '/settings'], ['/dalin?x=1#y', '/:user']];
  for (const [p, want] of cases) assert.equal(routePattern(p), want, p);
  assert.equal(routePattern('/app/dalin', '/app'), '/:user'); assert.equal(routePattern('/app', '/app'), '/');
});

test('parseStack reads Chrome and Firefox/Safari stacks, oldest call first, with source-map friendly names', () => {
  const v8 = parseStack(err().stack);
  assert.equal(v8.length, 2);
  assert.deepEqual(v8[0], { function: '?', filename: '~/assets/vendor-1a2b3c.js', lineno: 3, colno: 44, in_app: true });
  assert.equal(v8[1].function, 'render'); assert.equal(v8[1].filename, '~/assets/index-9f8e7d.js'); assert.equal(v8[1].colno, 2345);
  const gecko = parseStack('render@https://fiiyou.online/assets/index-9f8e7d.js:10:20\n@https://fiiyou.online/assets/b.js:1:1\nsomething else');
  assert.deepEqual(gecko.map((f) => [f.function, f.lineno]), [['?', 1], ['render', 10]]);
  assert.deepEqual(parseStack(''), []); assert.deepEqual(parseStack(undefined), []);
  assert.equal(parseStack('    at f (https://h/a.js?token=SECRET:1:2)')[0].filename, '~/a.js');
  assert.equal(parseStack(Array.from({ length: 120 }, (_, i) => `    at f${i} (https://h/a.js:${i}:1)`).join('\n')).length, 50);
});

test('shouldIgnore drops noise but keeps real bugs', () => {
  for (const m of ['ResizeObserver loop completed with undelivered notifications.', 'Script error.', 'TypeError: Failed to fetch', 'Load failed', 'NetworkError when attempting to fetch resource.', 'The user aborted a request.']) assert.equal(shouldIgnore({ message: m }), true, m);
  assert.equal(shouldIgnore({ message: 'x', stack: 'at f (chrome-extension://abcd/content.js:1:1)' }), true);
  assert.equal(shouldIgnore({ message: "Cannot read properties of undefined (reading 'id')" }), false);
  assert.equal(shouldIgnore({ message: 'real bug' }, { online: false }), true);
});

test('normalize copes with anything that can be thrown', () => {
  const n = normalize(new TypeError('t')); assert.equal(n.type, 'TypeError'); assert.equal(n.message, 't'); assert.ok(n.stack.startsWith('TypeError: t'));
  assert.equal(normalize('plain').message, 'plain'); assert.equal(normalize(undefined).message, 'Unknown error'); assert.equal(normalize({ code: 5 }).message, '{"code":5}');
  const circ = {}; circ.self = circ; assert.equal(typeof normalize(circ).message, 'string');
});

test('fingerprint is stable for one bug and different for another', () => {
  const f = parseStack(err().stack);
  assert.equal(fingerprint('Error', 'boom', f), fingerprint('Error', 'boom', f));
  assert.notEqual(fingerprint('Error', 'boom', f), fingerprint('Error', 'other', f));
  assert.equal(fingerprint('Error', 'user 3f2504e0-4f89-41d3-9a0c-0305e82c3301 failed', f), fingerprint('Error', 'user 11111111-4f89-41d3-9a0c-0305e82c3301 failed', f));   // ids do not split one bug into many
});

test('uaInfo is coarse', () => {
  assert.deepEqual(uaInfo('Mozilla/5.0 (Linux; Android 14) AppleWebKit Chrome/120 Mobile Safari/537.36'), { browser: 'Chrome', device: 'mobile' });
  assert.deepEqual(uaInfo('Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36 Edg/120'), { browser: 'Edge', device: 'desktop' });
  assert.deepEqual(uaInfo('Mozilla/5.0 (Macintosh) Version/17 Safari/605.1.15'), { browser: 'Safari', device: 'desktop' });
  assert.deepEqual(uaInfo(''), { browser: 'Other', device: 'desktop' });
});

test('the event carries nothing about the person', () => {
  const ev = buildEvent({ id: 'a'.repeat(32), now: 1_700_000_000_000, type: 'TypeError', message: 'x for dalin@example.com', frames: parseStack(err().stack), kind: 'react', route: '/:user', origin: 'https://fiiyou.online', release: 'r1', environment: 'production', ua: 'Firefox/120', standalone: true, componentStack: '\n    at Foo\n    at Bar', ref: 'aaaaaaaa' });
  const text = JSON.stringify(ev);
  for (const key of ['"user"', '"breadcrumbs"', '"contexts"', '"cookies"', 'dalin']) assert.ok(!text.includes(key), key);
  assert.equal(ev.request.url, 'https://fiiyou.online/:user'); assert.equal(ev.tags.standalone, 'yes'); assert.equal(ev.exception.values[0].mechanism.handled, true);
  const env = buildEnvelope(ev.event_id, ev, 1_700_000_000_000).split('\n');
  assert.equal(env.length, 3); assert.deepEqual(JSON.parse(env[1]), { type: 'event' }); assert.match(JSON.parse(env[0]).event_id, /^[0-9a-f]{32}$/); assert.equal(JSON.parse(env[2]).event_id, ev.event_id);
});

test('reporter sends one scrubbed envelope, privately, and returns a reference', async () => {
  const { r, calls } = rig(); const ref = r.report(err('failed for dalin@example.com'), { kind: 'react', componentStack: '\n at Foo' }); await flush();
  assert.match(ref, /^[0-9a-f]{8}$/); assert.equal(calls.length, 1);
  const { url, init } = calls[0];
  assert.equal(url, 'https://errors.example.org/api/7/envelope/?sentry_key=abc123&sentry_version=7');
  assert.equal(init.method, 'POST'); assert.equal(init.credentials, 'omit'); assert.equal(init.referrerPolicy, 'no-referrer'); assert.equal(init.headers['Content-Type'], 'text/plain;charset=UTF-8');
  const ev = JSON.parse(init.body.split('\n')[2]);
  assert.equal(ev.tags.ref, ref); assert.equal(ev.tags.route, '/:user'); assert.equal(ev.tags.browser, 'Chrome'); assert.equal(ev.tags.device, 'mobile'); assert.equal(ev.release, 'abc1234');
  assert.ok(!init.body.includes('dalin@example.com') && ev.exception.values[0].value.includes('<email>'));
});

test('reporter is off without a DSN, off when the person says so, and back on when they change their mind', async () => {
  const none = createReporter({ dsn: '', fetch: async () => {} }); assert.equal(none.available(), false); assert.equal(none.report(err()), null);
  const { r, calls } = rig(); assert.equal(r.available(), true); assert.equal(r.enabled(), true);
  r.setEnabled(false); assert.equal(r.enabled(), false); assert.equal(r.report(err('a')), null); await flush(); assert.equal(calls.length, 0);
  r.setEnabled(true); assert.equal(r.enabled(), true); assert.ok(r.report(err('b'))); await flush(); assert.equal(calls.length, 1);
});

test('the same bug is sent once, different bugs are capped, and the cap survives a reload within the tab', async () => {
  const { r, calls } = rig({ maxPerPage: 3 });
  assert.ok(r.report(err('same'))); assert.equal(r.report(err('same')), null);
  assert.ok(r.report(err('two'))); assert.ok(r.report(err('three'))); assert.equal(r.report(err('four')), null); await flush(); assert.equal(calls.length, 3);
  const session = mem(); session.setItem('fiiyou.crash.n', '9');
  const again = rig({ maxPerPage: 3, session }).r; assert.equal(again.report(err('after reload')), null);   // 9 >= 3 * 3
});

test('noise and offline are not reported; nothing that is thrown can make the reporter throw', async () => {
  const { r, calls } = rig(); assert.equal(r.report(new Error('Failed to fetch')), null); assert.equal(r.report('Script error.'), null);
  const off = rig({ online: () => false }); assert.equal(off.r.report(err('real')), null);
  assert.equal(calls.length, 0);   // none of the noise above went out
  const nullProtoCircular = Object.create(null); nullProtoCircular.self = nullProtoCircular;
  for (const weird of [undefined, null, 0, '', {}, [], Symbol.iterator, () => {}, Object.create(null), nullProtoCircular]) assert.doesNotThrow(() => r.report(weird));
  const failing = createReporter({ dsn: DSN, fetch: () => { throw new Error('sync'); }, storage: mem(), session: mem() }); assert.doesNotThrow(() => failing.report(err('x')));
  const rejecting = createReporter({ dsn: DSN, fetch: async () => { throw new Error('async'); }, storage: mem(), session: mem() }); assert.doesNotThrow(() => rejecting.report(err('y'))); await flush();
});

test('global handlers feed the reporter and can be removed', () => {
  const seen = []; const l = {}; const target = { addEventListener: (t, f) => { l[t] = f; }, removeEventListener: (t) => { delete l[t]; } };
  const off = installGlobalHandlers({ report: (e, c) => seen.push([e, c.kind]) }, target);
  const boom = new Error('x'); l.error({ error: boom }); l.unhandledrejection({ reason: 'why' }); l.error({});   // an error event with no error and no message is ignored
  assert.deepEqual(seen, [[boom, 'onerror'], ['why', 'unhandledrejection']]); off(); assert.deepEqual(Object.keys(l), []);
});

test('end to end: a real HTTP server receives a Sentry-protocol envelope', async () => {
  const got = []; const server = http.createServer((req, res) => { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => { got.push({ url: req.url, type: req.headers['content-type'], referer: req.headers.referer, cookie: req.headers.cookie, body: b }); res.writeHead(200, { 'access-control-allow-origin': '*' }); res.end('{}'); }); });
  await new Promise((res) => server.listen(0, '127.0.0.1', res));
  try {
    const r = createReporter({ dsn: `http://pubkey@127.0.0.1:${server.address().port}/3`, release: 'e2e', fetch, storage: mem(), session: mem(), pathname: () => '/post/3f2504e0-4f89-41d3-9a0c-0305e82c3301' });
    const ref = r.report(err('e2e failure')); for (let i = 0; i < 40 && !got.length; i++) await flush();
    assert.equal(got.length, 1); assert.equal(got[0].url, '/api/3/envelope/?sentry_key=pubkey&sentry_version=7'); assert.equal(got[0].type, 'text/plain;charset=UTF-8'); assert.equal(got[0].cookie, undefined); assert.equal(got[0].referer, undefined);
    const [head, item, body] = got[0].body.split('\n').map((x) => JSON.parse(x)); const ev = body;
    assert.equal(item.type, 'event'); assert.equal(head.event_id, ev.event_id); assert.equal(ev.tags.ref, ref); assert.equal(ev.tags.route, '/post/:id'); assert.equal(ev.exception.values[0].stacktrace.frames.at(-1).function, 'render');
  } finally { server.close(); }
});
