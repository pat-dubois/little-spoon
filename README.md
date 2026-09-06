# Little Spoon

Pediatric nutrition, growth and nutrient reference tools in one offline app.

The rebuild shares patient inputs across Nutrition, Z-score and DRI / RDA. Each result shows its method, calculation steps and source. Both light and dark themes support desktop and phone layouts. Patient entries exist only in memory; the app makes no calculation requests and writes no patient storage.

## Status: settled

Pat reports that Crystal says the app is working well and has accepted this phase as settled on September 5, 2026. The verified rebuild is merged into `main`; the calculator is live at [Little Spoon](https://little-spoon.patdubois.chatgpt.site) with the same private ChatGPT access Crystal already uses.

Open [Pulse](pulse.html) for the project state, completed work, checks, tickets and links. It opens directly as an HTML file. Its evidence lives in append-only `pulse.jsonl`; `pulse-tickets.json` is a dated GitHub snapshot. The older `NEXT.md` is preserved as historical session material and is no longer the starting point.

## Pick up later

No new feature work is queued. Pat may return for chart improvements or a Fable design pass. Start from Pulse and the current code when that happens; do not restart the completed rebuild or the canceled broad Ped's history investigation.

The supplied five-year growth example matches WHO's calculation. The documented infant reference convention at six to under seven months and AnthroCalc's internal method remain qualified in the reference reports. Crystal's successful use is recorded without claiming those specific questions have been resolved.

## What is verified

WHO growth calculations are checked against the organization's R implementation and published reference fixtures. Nutrition equations and all 26 nutrient references are checked against Health Canada's published sources. The reports distinguish explained source disagreements from implementation failures:

- [Growth methods, independent comparisons and legacy defects](docs/growth-validation.md)
- [Nutrition and DRI sources, comparisons and infant age convention](docs/nutrition-validation.md)
- [Browser, accessibility, offline and performance verification](docs/verification.md)
- [Interface decisions](docs/design-decisions.md)
- [Project state and work log](pulse.html)

The published app passed 232 calculation/input tests, 54 browser checks and 58 additional vitamin-unit phone/desktop/print checks. Both GitHub verification runs for the final rebuild branch passed before merge. The reports preserve the precise evidence and its limits.

## Develop and verify

Use Node 22.12 or newer. CI uses Node 24. Install the locked dependencies with `npm ci`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development on port 5173 |
| `npm test` / `npm run test:coverage` | Calculation, reference and shared-input checks |
| `npm run build` | Strict TypeScript check and self-contained HTML build |
| `npm run preview` | Serve the production build on port 4173 |
| `npm run test:e2e` | Chromium desktop, Android-sized Chromium and iPhone-sized WebKit |

For browser setup, use `PLAYWRIGHT_SKIP_BROWSER_GC=1 npx playwright install chromium webkit` so Playwright does not remove other cached browser versions. CI installs Linux browser dependencies as well. `node scripts/audit-browser.mjs` audits the running production preview with Lighthouse. Browser reports are written to timestamped folders under `artifacts/`.

Build outputs `dist/index.html` and `dist/little-spoon.html` contain the same complete app, fonts, reference data and licences. Open `little-spoon.html` directly in a browser without a server. The online app also offers an Offline copy download. No service worker, analytics or patient database is included. Sites supplies sign-in around the hosted version; the offline calculator needs no login. The production content-security policy blocks outgoing application connections.

## Pulse and publication

The repository-local `scripts/pulse.mjs` refreshes the GitHub snapshot, appends verified session receipts and renders the board. It does not install Tili's planned universal `pulse save` engine. Future agents maintain this evidence; Pat does not need to keep a handoff document current. See [AGENTS.md](AGENTS.md) for the small update workflow.

The latest receipt containing `deployment` records the exact deployed build, source commit, checksum, existing Sites project and version. The Sites checkout is local at `artifacts/sites/little-spoon/`. Reuse that project when publishing future app changes. Only the two tested calculator HTML files belong in its public output; Pulse, private review notes and the Crystal review sheet stay outside the deployed calculator. GitHub has no Pages deployment; its workflow verifies the source and saves test artifacts.

## Reference maintenance

Reference data is pinned and committed. Routine builds and tests do not download clinical data. Source-refresh scripts in `scripts/` are deliberate maintenance tools; review their diffs and independent expectations before accepting updates. The DRI HTML importer needs Python with Beautiful Soup. WHO fixture regeneration uses WebR, described in the growth report. Original source URLs, retrieval records and checksums live with the datasets in `src/clinical/data/`.

The rebuild uses Vite, TypeScript and React. The existing snapshots in `legacy/` are preserved unchanged; they do not supply the rebuilt calculation expectations. Private transcripts remain excluded from Git.

## Licence

The rebuild is distributed under [GNU GPL version 3](LICENSE), including the WHO reference work. React and Phosphor use MIT licences; Geist and Literata use the SIL Open Font License. Complete notices are included in `src/software-notices.txt` and accessible inside each offline HTML copy. Little Spoon is not a WHO or Health Canada product or endorsement.
