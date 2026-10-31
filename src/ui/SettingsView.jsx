import { useCallback, useEffect, useState } from 'react';
import { LockKey, Trash, Prohibit, DownloadSimple, ShieldCheck } from '@phosphor-icons/react';
import { auth, safety } from '../index.js';
import { useImages, Avatar } from './shared.jsx';
import { ask } from './dialog.jsx';
import { ErrorState, friendlyError } from './errors.jsx';
import PushToggle from './PushToggle.jsx';
import { crash } from './crash.js';
import { promptInstall, useCanInstall } from './install.js';
import { ChangePasswordModal } from './PasswordMeter.jsx';

/** People you blocked. Unblocking does not bring a friendship back (blocking removed it). */
function Blocked({ notify, go }) {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(null); const [busy, setBusy] = useState(null);
  const load = useCallback(() => { setErr(null); return safety.listBlocked().then((r) => setRows(r || [])).catch((e) => { setErr(e); setRows([]); }); }, []);
  useEffect(() => { load(); }, [load]);
  const img = useImages((rows || []).map((r) => r.user?.avatar_path));
  const unblock = async (u) => {
    if (!(await ask({ title: `Unblock ${u.display_name}?`, message: 'They will be able to see your profile and interact with you again. You will not be friends again automatically.', confirmLabel: 'Unblock' }))) return;
    setBusy(u.id);
    try { await safety.unblockUser(u.id); setRows((r) => r.filter((x) => x.user.id !== u.id)); notify('Unblocked'); }
    catch (e) { notify(friendlyError(e), 'err'); }
    setBusy(null);
  };
  if (err) return <ErrorState error={err} onRetry={load} title="Could not load your blocked list" />;
  if (rows === null) return <p className="empty" role="status">Loading…</p>;
  if (!rows.length) return <div className="empty"><p>You have not blocked anyone.</p><small>People you block can no longer see or contact you. Block someone from their profile.</small></div>;
  return (<>{rows.map(({ user: u }) => (<div className="row" key={u.id}><Avatar src={img[u.avatar_path]} size={44} />
    <span className="link" style={{ textAlign: 'left' }}>{u.display_name}<small>@{u.username}</small></span>
    <button type="button" className="ghost sm" disabled={busy === u.id} onClick={() => unblock(u)}>{busy === u.id ? '…' : 'Unblock'}</button></div>))}</>);
}

/** Settings row: add fiiyou to the home screen / desktop. Only rendered while the browser is willing to install it (see install.js). */
function InstallRow({ notify }) {
  const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); const r = await promptInstall(); if (r === 'unavailable') notify('Your browser cannot install fiiyou right now. Try its menu: Install app.', 'err'); setBusy(false); };
  return (<div className="srow"><span className="sico"><DownloadSimple size={20} weight="bold" aria-hidden="true" /></span><div><b>Install app</b><small>Add fiiyou to your home screen or desktop. It opens in its own window.</small></div>
    <button type="button" className="primary sm" disabled={busy} onClick={go}>Install</button></div>);
}

/** Settings row: crash reports on/off for this browser. Only rendered when the operator configured a crash server (VITE_ERROR_DSN). */
function CrashRow({ notify }) {
  const [on, setOn] = useState(crash.enabled());
  const flip = () => { crash.setEnabled(!on); setOn(!on); notify(on ? 'Crash reports off' : 'Crash reports on'); };
  return (<div className="srow"><span className="sico"><ShieldCheck size={20} weight="bold" aria-hidden="true" /></span>
    <div><b>Crash reports</b><small>{on ? 'If fiiyou crashes, a short technical report (the error text and what kind of page it was, nothing from your account) goes to the people who run it, so they can fix the problem.' : 'Off. Nothing is sent when something breaks.'}</small></div>
    <button type="button" className={on ? 'ghost sm' : 'primary sm'} onClick={flip}>{on ? 'Turn off' : 'Turn on'}</button></div>);
}

/** /settings: this device and this account, split into the same pill tabs the rest of the app uses. */
export default function SettingsView({ notify, go }) {
  const [tab, setTab] = useState('account'); const [pw, setPw] = useState(false);
  const canInstall = useCanInstall(); const crashOn = crash.available();
  const del = async () => {
    if (!(await ask({ title: 'Delete your account?', message: 'Your account and everything in it will be deleted. This cannot be undone.', confirmLabel: 'Delete account', danger: true }))) return;
    try { await auth.deleteAccount(); } catch (e) { notify(friendlyError(e, 'Could not delete the account. Nothing was lost, try again.'), 'err'); }
  };
  return (<div className="plain view settings"><h2>Settings</h2>
    <div className="tabs" role="tablist" aria-label="Settings">
      {[['account', 'Account'], ['notifications', 'Notifications'], ['blocked', 'Blocked']].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === 'account' && <>
      <div className="panel sgroup"><div className="srow"><span className="sico"><LockKey size={20} weight="bold" aria-hidden="true" /></span><div><b>Password</b><small>Choose a new password for signing in.</small></div><button type="button" className="ghost sm" onClick={() => setPw(true)}>Change</button></div></div>
      {(canInstall || crashOn) && <div className="panel sgroup">{canInstall && <InstallRow notify={notify} />}{crashOn && <CrashRow notify={notify} />}</div>}
      <div className="panel sgroup sdanger"><div className="srow"><span className="sico"><Trash size={20} weight="bold" aria-hidden="true" /></span><div><b>Delete account</b><small>Removes your profile, posts, photos and messages for good.</small></div><button type="button" className="ghost sm danger" onClick={del}>Delete</button></div></div></>}
    {tab === 'notifications' && <div className="panel sgroup"><PushToggle notify={notify} /></div>}
    {tab === 'blocked' && <Blocked notify={notify} go={go} />}
    {pw && <ChangePasswordModal onClose={() => setPw(false)} notify={notify} />}
  </div>);
}
