# Little Spoon

Pediatric nutrition, growth and nutrient reference tools in one offline app.

The rebuild shares patient inputs across Nutrition, Z-score and DRI / RDA. Each result shows its method, calculation steps and source. Both light and dark themes support desktop and phone layouts. Patient entries exist only in memory; the app makes no calculation requests and writes no patient storage.

## What is verified

WHO growth calculations are checked against the organization's R implementation and published reference fixtures. Nutrition equations and all 26 nutrient references are checked against Health Canada's published sources. The reports distinguish explained source disagreements from implementation failures:

- [Growth methods, independent comparisons and legacy defects](docs/growth-validation.md)
- [Nutrition and DRI sources, comparisons and infant age convention](docs/nutrition-validation.md)
- [Browser, accessibility, offline and performance verification](docs/verification.md)
- [Interface decisions](docs/design-decisions.md)
- [Current handoff and remaining clinical comparison](NEXT.md)

Crystal's comparison using her actual discrepant AnthroCalc cases remains outstanding. The six-to-under-seven-month infant convention also needs agreement with the treating team. Automated source agreement is evidence for the implemented methods, not clinical sign-off.

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

Build outputs `dist/index.html` and `dist/little-spoon.html` contain the same complete app, fonts, reference data and licences. Open `little-spoon.html` directly in a browser without a server. The online preview also offers an Offline copy download. No service worker, login, analytics or patient database is included. The production content-security policy blocks outgoing application connections.

## Reference maintenance

Reference data is pinned and committed. Routine builds and tests do not download clinical data. Source-refresh scripts in `scripts/` are deliberate maintenance tools; review their diffs and independent expectations before accepting updates. The DRI HTML importer needs Python with Beautiful Soup. WHO fixture regeneration uses WebR, described in the growth report. Original source URLs, retrieval records and checksums live with the datasets in `src/clinical/data/`.

The rebuild uses Vite, TypeScript and React. The existing snapshots in `legacy/` are preserved unchanged; they do not supply the rebuilt calculation expectations. Private transcripts remain excluded from Git.

## Licence

The rebuild is distributed under [GNU GPL version 3](LICENSE), including the WHO reference work. React and Phosphor use MIT licences; Geist and Literata use the SIL Open Font License. Complete notices are included in `src/software-notices.txt` and accessible inside each offline HTML copy. Little Spoon is not a WHO or Health Canada product or endorsement.
