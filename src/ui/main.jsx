import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { DialogHost, installDialogs } from './dialog.jsx';
import { bootRouter } from './router.jsx';
import { Boundary, OfflineBanner } from './errors.jsx';
import { configMissing } from '../lib/client.js';
import { installCrashReporting } from './crash.js';
import { watchInstall } from './install.js';
import { captureInvite } from '../lib/invite.js';
import './styles.css';
import './design.css';
import './ui-theme.css';
import './social-ui.css';   // hashtags, comment layout, chat message menu (loads last so it wins)

if (configMissing) {
  document.getElementById('root').innerHTML = '<main style="font:16px system-ui;color:#eee;max-width:34rem;margin:20vh auto;padding:0 20px"><h1 style="font-size:1.4rem">fiiyou is not configured</h1><p>This build has no Supabase settings. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (see <code>.env.example</code>), then rebuild.</p></main>';
} else {
bootRouter();       // old /#/... links become real paths
captureInvite({ base: import.meta.env.BASE_URL.replace(/\/$/, '') });   // /invite/<username>: remember who invited you, then show the normal page
installDialogs();   // any leftover window.alert() shows the in-app card too
installCrashReporting();   // window errors and unhandled promise rejections -> src/lib/errorReport.js (off unless VITE_ERROR_DSN is set)
watchInstall();            // keeps the browser's install prompt for the Home card and Settings (Android, desktop Chrome/Edge)
createRoot(document.getElementById('root')).render(<Boundary><App /><DialogHost /><OfflineBanner /></Boundary>);
}
