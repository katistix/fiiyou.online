// Crash reports for fiiyou: small, private, and off unless the operator sets VITE_ERROR_DSN.
//
// Speaks the Sentry "envelope" protocol, so it works with GlitchTip or a self-hosted Sentry and needs no SDK (no extra bundle weight,
// no breadcrumbs, no session replay, no automatic collection of anything). What it sends, and nothing else:
//   error type + message + stack (text scrubbed), the KIND of page (/post/:id, never a real id or username), app version, browser family.
// What it never sends: user id, email, username, cookies, request bodies, URLs with query strings or #fragments (auth tokens live there).
// Pure functions + a factory with injected fetch/storage, so everything is unit-tested in node (tests/client/errorReport.test.mjs).

const SENTRY_VERSION = '7';
const FLAG = 'fiiyou.crashReports';           // localStorage: '0' = this person turned crash reports off
const SESSION_COUNT = 'fiiyou.crash.n';       // sessionStorage: reports already sent by this tab

/** 'https://<key>@host[/prefix]/<project>' -> { endpoint, origin, key, project } | null. https only (http allowed for localhost). */
export function parseDsn(dsn) {
  try {
    const u = new URL(String(dsn || '').trim());
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname);
    if (!u.username || !(u.protocol === 'https:' || (u.protocol === 'http:' && local))) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    const project = parts.pop();
    if (!project || !/^[\w-]+$/.test(project)) return null;
    const prefix = parts.length ? `/${parts.join('/')}` : '';
    const key = decodeURIComponent(u.username);
    return { origin: u.origin, key, project, endpoint: `${u.origin}${prefix}/api/${project}/envelope/?sentry_key=${encodeURIComponent(key)}&sentry_version=${SENTRY_VERSION}` };
  } catch { return null; }
}

/* ---------- scrubbing ---------- */
const stripUrl = (u) => { try { const x = new URL(u); return `${x.origin}${x.pathname}`; } catch { return u.split(/[?#]/)[0]; } };
const RULES = [
  [/https?:\/\/[^\s"'<>)]+/g, (u) => stripUrl(u)],                                           // query strings and #fragments can hold tokens
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '<email>'],
  [/eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]*/g, '<token>'],                                          // JWTs (Supabase sessions)
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<id>'],           // user, post and file ids
  [/\b(access_token|refresh_token|apikey|api_key|token|password|secret)(["']?\s*[=:]\s*)["']?[^\s&"',;]+/gi, '$1$2<redacted>'],
  [/\b[A-Za-z0-9_-]{32,}\b/g, '<secret>'],                                                   // any other long opaque string
];
/** Removes emails, tokens, ids and URL query strings from free text, then caps the length. */
export function scrubText(s, max = 500) {
  let t = String(s ?? '');
  for (const [re, to] of RULES) t = t.replace(re, to);
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

const PAGES = new Set(['home', 'me', 'u', 'map', 'people', 'chat', 'messages', 'post', 'admin', 'notifications', 'invite', 'tag', 'search', 'login', 'signup', 'settings', 'about', 'help', 'privacy', 'terms']);
const WITH_ID = { post: ':id', chat: ':id', tag: ':tag', invite: ':user', u: ':user' };
/** '/dalin' -> '/:user', '/post/3f2a…' -> '/post/:id', '/map' -> '/map'. Only the page TYPE is ever reported, never who or what it was about. */
export function routePattern(pathname, base = '') {
  let p = String(pathname || '/'); if (base && p.startsWith(base)) p = p.slice(base.length) || '/';
  const seg = p.split(/[?#]/)[0].split('/').filter(Boolean);
  if (!seg.length) return '/';
  const first = seg[0].toLowerCase();
  if (!PAGES.has(first)) return '/:user';
  return WITH_ID[first] && seg[1] ? `/${first}/${WITH_ID[first]}` : `/${first}`;
}

/* ---------- stacks ---------- */
const V8 = /^\s*at (?:(.*?) \()?(.+?):(\d+):(\d+)\)?\s*$/;      // "at fn (url:1:2)" and "at url:1:2"
const GECKO = /^\s*(.*?)@(.+?):(\d+):(\d+)\s*$/;                 // "fn@url:1:2" (Firefox, Safari)
const fileOf = (u) => { try { return `~${new URL(u).pathname}`; } catch { return scrubText(u, 80); } };   // '~/assets/x.js' is how Sentry matches uploaded source maps
/** Browser stack text -> Sentry frames, oldest call first. Lines that are not frames (the "Error: message" header) are skipped. */
export function parseStack(stack) {
  const frames = [];
  for (const line of String(stack || '').split('\n').slice(0, 200)) {
    const m = V8.exec(line) || GECKO.exec(line); if (!m) continue;
    frames.push({ function: scrubText(m[1] || '?', 80), filename: fileOf(m[2]), lineno: +m[3], colno: +m[4], in_app: true });
  }
  return frames.reverse().slice(-50);
}

/* ---------- noise ---------- */
const NOISE = [
  /ResizeObserver loop/i, /^Script error\.?$/i,
  /failed to fetch|networkerror|network request failed|load failed|fetch failed|err_internet|timed? ?out|aborterror|user aborted/i,   // flaky connections are not bugs
  /Non-Error promise rejection/i,
];
const EXTENSION = /(chrome|moz|safari|safari-web)-extension:\/\//i;
/** True for errors that say nothing about fiiyou: lost connections, browser extensions, cross-origin "Script error." */
export function shouldIgnore({ message = '', stack = '' }, { online = true } = {}) {
  if (!online) return true;
  if (EXTENSION.test(stack) || EXTENSION.test(message)) return true;
  return NOISE.some((re) => re.test(message));
}

/** Takes whatever was thrown (Error, string, object, undefined) and returns { type, message, stack }. */
export function normalize(e) {
  if (e && typeof e === 'object' && ('message' in e || 'stack' in e)) return { type: String(e.name || 'Error').slice(0, 60), message: String(e.message ?? ''), stack: String(e.stack ?? '') };
  if (typeof e === 'string') return { type: 'Error', message: e, stack: '' };
  let m; try { m = e == null ? 'Unknown error' : (JSON.stringify(e) ?? String(e)); } catch { m = 'Unserializable value'; }
  return { type: 'Error', message: m, stack: '' };
}

const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(16).padStart(8, '0'); };
/** Same bug -> same fingerprint (message + top frames), so one bug is sent once per page load. */
export const fingerprint = (type, message, frames) => hash([type, scrubText(message, 120), ...frames.slice(-2).map((f) => `${f.function}@${f.filename}:${f.lineno}`)].join('|'));

/** Browser family + device class from the user agent. Coarse on purpose. */
export function uaInfo(ua = '') {
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\/|CriOS\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  return { browser, device: /Mobi|Android|iPhone|iPad|iPod/.test(ua) ? 'mobile' : 'desktop' };
}

const hex32 = () => {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, '');
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

/** The event Sentry/GlitchTip expects. No `user`, no `breadcrumbs`, no `contexts`: nothing about the person. */
export function buildEvent({ id, now, type, message, frames, kind, route, origin, release, environment, ua, standalone, componentStack, ref }) {
  const { browser, device } = uaInfo(ua);
  return {
    event_id: id, timestamp: now / 1000, platform: 'javascript', level: 'error', release, environment,
    sdk: { name: 'fiiyou.crash', version: '1' },
    exception: { values: [{ type, value: scrubText(message), mechanism: { type: kind, handled: kind === 'react' }, ...(frames.length ? { stacktrace: { frames } } : {}) }] },
    request: { url: `${origin}${route}` },
    tags: { route, kind, browser, device, standalone: standalone ? 'yes' : 'no', ref },
    ...(componentStack ? { extra: { componentStack: scrubText(String(componentStack).split('\n').slice(0, 10).join('\n'), 800) } } : {}),
  };
}
/** Three newline-separated JSON lines: envelope header, item header, the event. */
export const buildEnvelope = (id, event, now) => `${JSON.stringify({ event_id: id, sent_at: new Date(now).toISOString() })}\n${JSON.stringify({ type: 'event' })}\n${JSON.stringify(event)}`;

/**
 * Makes a reporter. Everything environmental is injected so tests can run in node:
 *   dsn, release, environment, fetch, storage (localStorage), session (sessionStorage), now(), online(), ua, standalone(), origin, base, maxPerPage
 * report(error, { kind, componentStack }) returns a short reference (8 hex chars, also sent as the "ref" tag) or null when nothing was sent.
 */
export function createReporter(o = {}) {
  const cfg = parseDsn(o.dsn);
  const doFetch = o.fetch || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  const now = o.now || Date.now;
  const max = o.maxPerPage ?? 10, maxSession = max * 3;
  const seen = new Set(); let sent = 0;
  const read = (store, k) => { try { return store?.getItem(k) ?? null; } catch { return null; } };
  const write = (store, k, v) => { try { v == null ? store?.removeItem(k) : store?.setItem(k, v); } catch { /* private mode */ } };

  const available = () => !!cfg && !!doFetch;                              // the operator set a valid DSN
  const enabled = () => available() && read(o.storage, FLAG) !== '0';      // ...and this person has not switched it off
  const setEnabled = (on) => write(o.storage, FLAG, on ? null : '0');

  function report(err, { kind = 'error', componentStack = '' } = {}) {
    try {
      if (!enabled()) return null;
      const { type, message, stack } = normalize(err);
      if (shouldIgnore({ message, stack }, { online: o.online ? o.online() : true })) return null;
      const frames = parseStack(stack);
      const fp = fingerprint(type, message, frames);
      const used = Number(read(o.session, SESSION_COUNT)) || 0;
      if (seen.has(fp) || sent >= max || used >= maxSession) return null;
      seen.add(fp); sent++; write(o.session, SESSION_COUNT, String(used + 1));

      const id = hex32(); const ref = id.slice(0, 8); const t = now();
      const event = buildEvent({
        id, now: t, type, message, frames, kind, ref, componentStack, release: o.release || 'dev', environment: o.environment || 'production',
        route: routePattern(o.pathname ? o.pathname() : '/', o.base || ''), origin: o.origin || '', ua: o.ua || '', standalone: o.standalone ? o.standalone() : false,
      });
      Promise.resolve().then(() => doFetch(cfg.endpoint, {
        method: 'POST', body: buildEnvelope(id, event, t),
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },     // a "simple" request: no CORS preflight
        mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
      })).catch(() => {});
      return ref;
    } catch { return null; }                                          // reporting must never be the thing that crashes the app
  }
  return { report, available, enabled, setEnabled };
}

/** window 'error' and 'unhandledrejection' -> reporter. Returns a function that removes them again. */
export function installGlobalHandlers(reporter, target = globalThis) {
  const onError = (e) => { if (e?.error || e?.message) reporter.report(e.error || e.message, { kind: 'onerror' }); };
  const onRejection = (e) => reporter.report(e?.reason, { kind: 'unhandledrejection' });
  target.addEventListener('error', onError); target.addEventListener('unhandledrejection', onRejection);
  return () => { target.removeEventListener('error', onError); target.removeEventListener('unhandledrejection', onRejection); };
}
