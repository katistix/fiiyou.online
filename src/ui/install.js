// "Install fiiyou" on Android and on desktop Chrome / Edge. These browsers fire `beforeinstallprompt` when the site is installable;
// we keep that event, and only offer an Install button when we really hold one (so the button always does something).
// iPhone has no such event: PushToggle already explains "Share, then Add to Home Screen". Firefox and desktop Safari cannot install, so they see nothing.
import { useSyncExternalStore } from 'react';
import { countVisit, dismiss, markInstalled, readState, shouldShow } from '../lib/installHint.js';

let deferred = null;
const subs = new Set(); const emit = () => subs.forEach((f) => f());
const store = (kind) => { try { return window[kind]; } catch { return null; } };

export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/** Call once from main.jsx before the first render: the browser fires the event once, usually long before anybody has signed in. */
export function watchInstall() {
  countVisit(store('localStorage'), store('sessionStorage'));
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; emit(); });
  addEventListener('appinstalled', () => { deferred = null; markInstalled(store('localStorage')); emit(); });
}

const canInstall = () => deferred !== null && !isStandalone();
const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };
/** True while the browser is willing to install the app. */
export const useCanInstall = () => useSyncExternalStore(subscribe, canInstall, () => false);
/** The Home card is shown only when installable, not on the first visit, not installed, and not snoozed. */
export const hintWanted = () => canInstall() && shouldShow(readState(store('localStorage')));
export const snoozeHint = () => dismiss(store('localStorage'));

/** Opens the browser's own install dialog. -> 'accepted' | 'dismissed' | 'unavailable'. The event can be used once, so it is dropped here. */
export async function promptInstall() {
  const e = deferred; if (!e) return 'unavailable';
  deferred = null; emit();
  try { e.prompt(); return (await e.userChoice).outcome; } catch { return 'unavailable'; }
}
