// Browser side of crash reporting (the logic is in src/lib/errorReport.js). Does nothing unless VITE_ERROR_DSN is set at build time.
import { createReporter, installGlobalHandlers } from '../lib/errorReport.js';

const safe = (f) => { try { return f(); } catch { return null; } };   // storage can throw in private mode

export const crash = createReporter({
  dsn: import.meta.env.VITE_ERROR_DSN,
  release: import.meta.env.VITE_APP_VERSION || 'dev',          // short git commit, set by vite.config.js
  environment: import.meta.env.MODE,
  storage: safe(() => localStorage), session: safe(() => sessionStorage),
  online: () => navigator.onLine !== false,
  ua: navigator.userAgent,
  standalone: () => !!safe(() => matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true,
  pathname: () => location.pathname, base: import.meta.env.BASE_URL.replace(/\/$/, ''), origin: location.origin,
});

/** Returns a short reference (also a searchable tag on the report) or null when nothing was sent. */
export const reportCrash = (error, ctx) => crash.report(error, ctx);
export const installCrashReporting = () => installGlobalHandlers(crash, window);
