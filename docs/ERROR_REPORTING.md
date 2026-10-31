# Crash reports (optional)

fiiyou can send a short crash report to **a server you run yourself**, so you find out about bugs before your users email you. It is off until you set `VITE_ERROR_DSN`. No third party is involved and no SDK is bundled: `src/lib/errorReport.js` speaks the Sentry envelope protocol directly (about 4 KB of code).

## What is sent (and what is not)
| Sent | Never sent |
|---|---|
| error type, message and stack trace | user id, email, username, display name |
| kind of page: `/post/:id`, `/:user`, `/map` (never a real id or name) | post, comment or message text |
| app version (short git commit), browser family, mobile/desktop, installed-app yes/no | cookies, request bodies, URLs with `?query` or `#fragment` |
| a random 8-character reference, shown to the person on the crash screen | breadcrumbs, console logs, session replay, screenshots |

Free text is scrubbed before it leaves the browser: emails, JWTs, UUIDs, `token=` / `password=` pairs, long opaque strings and URL query strings are replaced. Scrubbing is best effort: a message that contains a username in plain words (for example "profile @dalin not found") would pass through. Keep error messages free of personal data.

Noise is dropped: lost connections ("Failed to fetch", "Load failed"), browser extensions, `ResizeObserver` warnings, cross-origin "Script error.". One bug is reported once per page load, at most 10 reports per page load and 30 per tab session.

People can turn reports off in **Settings → Account → Crash reports** (shown only when a server is configured). The choice is kept in their browser.

## Set it up
1. **Pick a server.** [GlitchTip](https://glitchtip.com) is the light option (Sentry-compatible, runs on a small VPS, about 1 GB RAM). Self-hosted Sentry works too but wants roughly 16 GB RAM, which is a lot for a small project.
2. Create a project (platform: JavaScript / Browser) and copy its **DSN**: `https://<key>@errors.example.org/<project-number>`. It is public by design, like the Supabase anon key. It must be `https` (plain `http` is only accepted for `localhost`).
3. **Vercel → Settings → Environment Variables:** `VITE_ERROR_DSN` = the DSN, then redeploy. The build adds the server's address to the Content-Security-Policy automatically.
4. **On the server, protect your users:**
   - **required, because the privacy page promises it:** turn on **"Prevent storing of IP addresses"** (Sentry: Project Settings → Security & Privacy; in GlitchTip check its privacy settings). The browser sends no user id, but the server sees the connection's IP unless you turn this off;
   - set **data retention to 30 days or less**;
   - set the project's **allowed domains / CORS** to `https://fiiyou.online`;
   - rate-limit the project key (anyone can read the DSN from the site, so someone could flood it).
5. Keep `public/privacy.html` in step: it already has a "Crash reports" entry. **If you do not configure a server, delete that entry** so the policy stays true.

## Check that it works
Open the live site, open the browser console and run:

    setTimeout(() => { throw new Error('fiiyou crash test') })

The error should appear in your server within a few seconds. A tab can send at most a few reports, so reload before testing again. To test the crash screen itself, throw while rendering (in a dev build): it shows a **Reference** code, also searchable on the server as the tag `ref:<code>`.

## Limits worth knowing
- **Stack traces are minified** (`index-9f8e7d.js:1:2345`) because the build ships no source maps (they would publish your source). Reports carry the release (git commit) and file names as `~/assets/...`, which is what Sentry uses to match uploaded maps. To get readable traces, build with `build.sourcemap: 'hidden'`, upload the `.map` files with `sentry-cli` / GlitchTip's API in your deploy, and **delete them from `dist` before publishing**.
- Errors are reported from the browser only. Failed database calls that the app already handles (it shows an error message) are not reported; only crashes and unhandled errors are.
- A stale tab after a deploy can fail to load a lazy chunk ("Failed to fetch dynamically imported module"). That is filtered as network noise; the crash screen's **Reload** fixes it.
