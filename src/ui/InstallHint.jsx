import { useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import { hintWanted, promptInstall, snoozeHint, useCanInstall } from './install.js';

/** One dismissible card on Home, only where the browser can really install fiiyou (Android, Chrome/Edge on desktop). See install.js for the rules. */
export default function InstallHint() {
  const can = useCanInstall(); const [hidden, setHidden] = useState(false); const [busy, setBusy] = useState(false);
  if (!can || hidden || !hintWanted()) return null;
  const later = () => { snoozeHint(); setHidden(true); };
  const install = async () => {
    setBusy(true);
    const r = await promptInstall();
    if (r === 'dismissed') snoozeHint();   // said no in the browser's own dialog: do not ask again for a while
    setHidden(true); setBusy(false);
  };
  return (<div className="panel sgroup installhint" role="region" aria-label="Install fiiyou"><div className="srow">
    <span className="sico"><DownloadSimple size={20} weight="bold" aria-hidden="true" /></span>
    <div><b>Install fiiyou</b><small>Open it from your home screen or desktop, in its own window.</small></div>
    <span className="sacts"><button type="button" className="ghost sm" disabled={busy} onClick={later}>Not now</button><button type="button" className="primary sm" disabled={busy} onClick={install}>Install</button></span></div></div>);
}
