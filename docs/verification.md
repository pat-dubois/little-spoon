# Rebuild verification

Verified on pdhome on 2026-09-05. This report records engineering checks and their limits. The clinical source reports separately explain method choices and remaining clinical review.

## Passing checks

| Area | Evidence |
| --- | --- |
| Automated calculations and inputs | **209 tests pass** across five test files: 195 clinical tests and 14 shared-input/integration checks. Clinical coverage: 99.33% of lines, 94.91% of branches and 100% of functions. Nutrition has 100% line and branch coverage. |
| WHO independent expectations | **3,576 numeric outputs** agree with WHO's R implementation or published fixtures at its public z-score precision; **733 unavailable results** agree. Also 413 independent normal-probability checks. A second agent checked 96 chart combinations and 1,248 inverse/tail calculations. See [growth validation](growth-validation.md). |
| Health Canada comparisons | All **624 nutrient fields** agree with the independent official CSV. Of 372 energy examples, 300 match the official calculator and 72 expose its documented early age-nine switch; no unexplained differences. See [nutrition validation](nutrition-validation.md). |
| Browser workflows | **42 tests pass, zero skipped or retried**, across desktop Chromium, Android-sized Chromium and iPhone-sized WebKit. All three tools, shown work, edited values, missing/invalid values, reset, reference boundaries, explicit posture, oedema, infant exceptions and different UL units are exercised. |
| Accessibility and phone layouts | Axe reports no WCAG 2 A/AA or 2.1 AA violations in populated Nutrition, Growth and DRI screens in both themes. Keyboard tabs pass. Additional visual checks at 320 and 390 CSS pixels confirm no page overflow, readable charts, sticky nutrient names/units, scrollable expanded notes and doubled-text reflow. |

Expected values were obtained independently where clinical correctness matters. The source reports identify the authority, retrieval record, precision and scope of each comparison. Coverage is a guide to exercised code, not proof of clinical suitability.

## Offline and patient-state checks

Both `dist/index.html` and `dist/little-spoon.html` contain the complete application, WHO data, nutrient references, fonts, styles and software licences. The reviewed file is **944,471 bytes** with SHA-256 `71c371807cb998d5e67dc4a5c31231db9aa3059d816d5428373ac76ab1b92116`.

The actual `file:` artifact was opened in Chromium and WebKit with every HTTP(S) request blocked before navigation. All three calculators and a growth chart worked, with zero external requests or runtime errors. Reload cleared the patient fields and results. A separate test switches a loaded page into network-offline mode and rejects attempted storage/database writes while exercising calculations; it passes with no cookies, local storage or session storage entries.

WebKit's network-offline emulation initially rejected `file:` navigation itself. The file test therefore blocks HTTP(S) requests explicitly instead; it does not pretend that a failed navigation proved the app worked. The loaded-page offline-mode test still covers WebKit. Manual browser source links intentionally open external references when the user chooses them; calculations do not fetch those sources.

The production content-security policy uses `connect-src 'none'` and blocks form submission. No service worker, analytics, backend, patient persistence or downloaded runtime asset is part of the app. Patient state is local to the open page. Reset all clears the input values, activity, posture, head circumference, oedema and results.

## T3 browser walkthrough

The T3 collaborative browser was used directly against pdhome's Tailscale preview. It confirmed the seven-year nutrition example, the female 12-year nutrient references, the 123-day growth example, the visible WHO chart and calculation disclosure, theme switching and reset. The final pass also confirmed that unfinished age text clears results and that height-dependent metrics wait for an explicit measurement posture while weight/head results remain available. The final page had no console errors.

T3's requested viewport size did not consistently match its actual CSS viewport. Precise phone-size claims in this report therefore come from Playwright and direct DOM measurements, not T3's resize setting. T3's historical network panel retained an initial failed localhost navigation because that browser runs on another host; the subsequent Tailscale preview worked.

## Performance

The final production bundle was measured with Lighthouse 13.4.1 against the compressed Vite preview on localhost. Mobile uses Lighthouse's simulated mobile network/CPU settings; desktop uses its desktop configuration.

| Profile | Performance | Accessibility | Best practices |
| --- | ---: | ---: | ---: |
| Mobile | **96** | **100** | **100** |
| Desktop | **100** | **100** | **100** |

These are local lab scores, not field measurements on Crystal's phone or hospital network. An earlier uncompressed Python preview scored 67 for mobile performance; the review preview was switched to Vite's gzip-compressed server. The single-file design deliberately includes all reference tables and licences up front so it can work from disk. Lighthouse still reports unused code for inactive tools and missing production source maps as diagnostics; neither caused a runtime failure.

## Evidence and reproduction

The final browser report is `artifacts/e2e/2026-09-05T22-38-17-243Z/report.json`. The final Lighthouse JSON and HTML reports are in `artifacts/lighthouse/2026-09-05T22-38-38-439Z/`. Visual review screenshots are under `artifacts/visual-review-2026-09-05/`; the T3 observations are under `artifacts/t3/`. These generated artifacts are kept locally and excluded from Git. Source fixtures, provenance, tests and this summary are committed.

`npm run build` completed strict TypeScript checks. `npm run test:coverage` and `npm run test:e2e` completed successfully. The installed dependency audit reported zero vulnerabilities. GitHub's verification workflow repeats the locked install, calculation tests, production build and Chromium/WebKit browser tests, and retains the HTML and browser reports as run artifacts. Its outcome is recorded in the pull request checks; local results are not presented as a remote CI pass.

## What still needs review

Crystal's actual discrepant AnthroCalc examples have not been entered into a fresh AnthroCalc session. The inherited example is reproduced, and demonstrated defects in the old code are documented, but complete application-to-application agreement is not claimed. The general infant age convention at six to under seven months needs agreement with the treating team; affected results show this explicitly.

Physical iPhone/Android devices, screen-reader listening, hospital-network behavior and a real browser-menu zoom operation have not been tested. Phone emulation, keyboard behavior, automated accessibility, narrow-width reflow and synthetic doubled-text checks passed. Print styles exist but printing was not independently verified. There is no new clinical sign-off or permanent public deployment in this report.
