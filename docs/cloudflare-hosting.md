# Cloudflare hosting

Prepared September 17, 2026 for GitHub issue #5. **Not deployed yet.**

Pat selected Workers with a browser HTTP Basic login, username `Crystal` (case sensitive). The password is in the `Little Spoon` item in the user-named `Tilly` 1Password vault. The item and vault spelling have not yet been verified because the desktop CLI authorization timed out while Pat was at work. Do not print or write the password into project files or logs.

The intended address is `little-spoon.patdubois.com`; Pat also permitted a subdomain of `pat.do`. The existing Wrangler OAuth session can list Workers in account `e162d36042b08a9b53cd44f6f0435b7f`, but its zone queries return no domains, including a query for `patdubois.com`. Whether this is the wrong account or a credential scope restriction is unknown. T3's Cloudflare dashboard tab requires sign-in. No other 1Password or Cloudflare connector was found in the plugin search.

## Prepared implementation

`cloudflare/worker.mjs` checks credentials before calling the asset binding. `run_worker_first: true` applies this to every URL, including direct HTML downloads. A missing password returns 503 and never serves the calculator. Invalid credentials return 401 with the browser login challenge. Responses prohibit shared/browser caching and request no indexing. Request credentials are removed before calling the asset binding. Worker observability and alternate Workers/preview addresses are disabled in configuration.

`scripts/prepare-cloudflare.mjs` copies only `dist/index.html` and `dist/little-spoon.html` to the deployment directory. The existing `dist` also contains a private review sheet and other assets, so never deploy that entire directory. Both accepted HTML files have SHA-256 `9dc3f2c1db4613231d79e180575045aafbb793466bb7ebe224a32812f3cd41f9`.

## Resume

1. Restore authorized 1Password CLI access and Cloudflare access to the intended domain. Verify the account and existing hostname before deploying; update the account ID if needed.
2. Run `node scripts/prepare-cloudflare.mjs`, `node --test cloudflare/worker.test.mjs`, and `wrangler deploy --dry-run`.
3. Deploy the Worker. It fails closed until its `PASSWORD` secret is provisioned. Transfer the authorized 1Password field directly through a subprocess pipe into `wrangler secret put PASSWORD`, without printing it, passing it as a command-line argument, or writing a secret file. Alternatively Pat can enter it in the Cloudflare dashboard as an encrypted secret named `PASSWORD`.
4. Verify the live site denies absent/wrong credentials, authenticates `Crystal`, serves the accepted checksum, excludes the review sheet, and works in desktop/phone browsers. Update the login item's URL if authorized access is available.
5. Update README, AGENTS hosting map, issue #5, and append a deployment receipt to Pulse with the real URL and version. Keep the prior Sites deployment unless Pat requests its removal.

## Checks completed

22 authentication unit checks pass. Wrangler deployment dry run passes. Fifteen HTTP checks against the local Workers runtime pass: no/wrong/correct credentials across the root, both HTML paths, the excluded review sheet, and Pulse. Authorized calculator responses match the accepted checksum byte for byte; excluded files return 404. Local verification used a throwaway test password, not Crystal's password. Live deployment, Crystal's actual credential, and hosted browser use remain unverified.

The compatibility date is pinned to `2026-02-05`, supported by the installed local runtime. No app code, calculations, reference data, or clinical qualifications changed. The original calculator checks remain historical evidence, not new test runs in this session.

## Sources

- [Cloudflare HTTP Basic example](https://developers.cloudflare.com/workers/examples/basic-auth/)
- [Run the Worker before static assets](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)

Basic authentication uses a persistent password, not a timed email login. Browser credential retention varies, so do not promise a specific remembered-login duration. Downloaded offline copies still work without authentication.
