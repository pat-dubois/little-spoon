# Cloudflare hosting

Live September 17, 2026: https://little-spoon.smgyxe.workers.dev

Browser HTTP Basic authentication uses username `Crystal` (case sensitive) and Cloudflare secret `PASSWORD`. Pat supplied a temporary password for immediate use and plans to change it tonight. The value is not in project files or receipts. The original `Little Spoon` item in the user-named `Tilly` 1Password vault remains unread because desktop authorization is unavailable while Pat is at work; it may not match the temporary password.

## Account and deployment

Pat confirmed the connected login `pat.dubois@saskatoonmedia.ca` is his work account and explicitly authorized deploying here. Account ID: `e162d36042b08a9b53cd44f6f0435b7f`. Worker: `little-spoon`. Current version: `874497f1-dec0-4074-9d83-cb2991dd6f69`.

The login's domain queries return no zones. Personal domains likely require another login, but their ownership has not been verified. The Workers address works without them. Pat's preferred future custom address was `little-spoon.patdubois.com`, with `pat.do` also acceptable.

Pat authorized brief public access while credentials were unavailable. The app was briefly published that way, then immediately password-protected after he supplied a temporary password. The final code and configuration contain no public-access bypass or expiry variable.

## Change the password

Open the [Worker settings](https://dash.cloudflare.com/e162d36042b08a9b53cd44f6f0435b7f/workers/services/view/little-spoon/production/settings). Under Variables and Secrets, replace the encrypted secret named `PASSWORD`, then deploy/save the change. Keep the login in 1Password up to date. Username remains `Crystal`.

Alternatively, use `wrangler secret put PASSWORD` with the password provided directly through standard input. Never include it in command-line arguments, source files, logs, or receipts. Once authorized vault access works, transfer the field directly from 1Password through a subprocess pipe.

## Implementation and updates

`cloudflare/worker.mjs` authenticates every request before calling the static asset binding. `run_worker_first: true` includes direct HTML URLs. Missing secrets return 503; invalid credentials return 401 with the browser prompt. Credentials are stripped before calling the binding. Responses use `private, no-store` and request no indexing. Worker observability and preview URLs are disabled.

Run `node scripts/prepare-cloudflare.mjs`, `node --test cloudflare/worker.test.mjs`, then `wrangler deploy`. The staging script includes only `dist/index.html` and `dist/little-spoon.html`; never deploy all of `dist`, which also holds the private review sheet. The existing deployment secret is retained across normal Worker deployments.

Both accepted HTML files have SHA-256 `554b30291e4a0c7c010ec83550e0b05321908ad2894b96985be81e919f58f74f`. The compatibility date is pinned to `2026-02-05`, supported by the installed local runtime. The current app adds the visible BMI value and removes the Labs footer. Clinical equations, references, measurement controls and qualifications are unchanged.

## Verification

The September 17 BMI/footer update passed all 232 calculation/input checks, the production build and 54 browser checks across desktop Chromium, Android-sized Chromium and iPhone-sized WebKit. Twelve new live HTTP checks verified authentication, excluded files and both HTML checksums. Standing/lying controls remain unchanged while Pat asks Crystal about the proposed age-based default and optional override.

Original hosting verification follows:

22 authentication unit checks pass. Fifteen live HTTPS checks pass across root, both HTML paths, review sheet and Pulse: no/wrong credentials return 401, valid credentials return the exact accepted HTML checksum, and excluded files return 404. The checks used the deployed temporary password without recording its value.

T3 loaded the live app during the brief public window and exercised a synthetic nutrition calculation at desktop width, then switched Growth and DRI tabs at 390 pixels with no horizontal overflow. Keyboard focus was exercised. Browser password-dialog entry was not automated; actual authentication was verified by the live HTTP checks. Crystal's own device login is still awaiting her use.

A Python HTTP client initially received a 403. Curl subsequently verified all 15 cases, and the T3 browser loaded the app. An attempted in-page fetch was blocked by the app's intended `connect-src none` policy; no policy was weakened. Original clinical tests remain prior-session evidence.

## Sources

- [Cloudflare HTTP Basic example](https://developers.cloudflare.com/workers/examples/basic-auth/)
- [Run the Worker before static assets](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- [Workers default addresses](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)

Basic authentication uses a persistent password. Browser credential retention varies, so do not promise a specific remembered-login duration. Downloaded offline copies work without authentication. Preserve the existing Sites deployment unless Pat requests its removal.
