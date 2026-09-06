# Little Spoon historical session state

Retired as the current handoff on September 5, 2026 at Pat's request. Start with [Pulse](pulse.html) and [README](README.md). The record below is preserved as written; its changing status and temporary preview links describe earlier points in the session.

Updated: 2026-09-05. Coordinating agent: tili. Host: pdhome.

## Current state

The rebuild is implemented on `feat/verified-clinical-rebuild`. Work is tracked in [GitHub issue #1](https://github.com/pat-dubois/little-spoon/issues/1). The original implementation commit is `e410494`; phone fixes are in `afaaaaf`. GitHub repeats the build and browser checks on the pull request. Latest local verification is complete: 232 tests and 54 browser checks pass. The review build is saved in [draft pull request #2](https://github.com/pat-dubois/little-spoon/pull/2); see [verification report](docs/verification.md) for the actual passing evidence and limits.

The app includes the shared patient card, Nutrition landing tab, Z-score charts, DRI / RDA table, light/dark themes, source links and complete calculation steps. The build emits a self-contained offline HTML file. Patient fields remain in memory only. Original legacy snapshots and private transcripts were left unchanged.

Pat authorized implementation, all needed tests, a swarm, T3 browser checks and mobile verification. Clinical functionality and reliable information come first. Do not ask the previous setup questions again.

## Agreed direction

1. Vite + TypeScript with tests and a standalone offline file. The implementation uses React and locally bundled fonts/reference data.
2. One shared patient card above Nutrition, Z-score and DRI / RDA. Preserve the familiar nutrition workflow and show the work.
3. Crystal's Serene Parfait attachment: cream, cocoa, berry, sage and fawn; Literata headings and Geist body text. Both themes. The generic GI-clinic features in the design document were examples, not app scope.
4. Real WHO charts, with the entered measurement and a dotted same-z reference curve. The curve is explicitly not a prediction and stops at reference boundaries.
5. A small Labs footer credit. The dictated brand spelling remains unresolved and was not invented.

## Clinical results and decisions

[Growth validation](docs/growth-validation.md) records 3,576 independent WHO numeric comparisons and 733 correctly unavailable results. Reproduced legacy errors include daily versus monthly reference lookup, wrong percentile conversion, missing extreme-tail adjustment and using length references for standing height. The inherited 123-day, 5-kg boy comparison displays z -2.93 and percentile 0.2.

[Nutrition validation](docs/nutrition-validation.md) records current Health Canada 2023 energy equations, protein boundary corrections, Holliday-Segar daily maintenance, and all 26 DRI/UL rows. The 624-field independent nutrient comparison has no differences. The energy comparison has 300 matches and 72 explained differences caused by the official calculator's early ninth-year deposition switch; this app follows the published equation table.

Nutrition and DRI use attained calendar age; WHO growth uses exact elapsed days divided by 30.4375. Growth requires an explicit posture before height-dependent results appear. Weight-only and head-only growth remain possible. Incomplete age text withholds results rather than silently becoming zero. Edited shared fields recompute valid results immediately and clear invalid ones. Reset clears all patient fields and results.

The general infant protein/DRI transition follows the current Health Canada calculator at seven months. Calcium and vitamin D follow explicit published footnotes at six months. The conflicting NASEM six-month description and the mixed-band behavior are visible in the affected result notes and documented. This is an implementation decision, not a decision made by Crystal.

## Outstanding clinical review

Crystal has not signed off on the rebuilt tools. Compare her actual discrepant AnthroCalc cases with the version/reference selected, measurement posture, dates, units and any age correction recorded. Only the inherited comparison has been reproduced, not a new full AnthroCalc app session. Confirm the six-to-under-seven-month infant convention with the treating team. Do not turn automated reference agreement into a claim of clinical approval.

No prematurity correction, preterm reference, longitudinal patient records, diagnosis, pregnancy/lactation workflow or prescribed-fluid therapy is inferred. The current scope notes remain attached to results.

## Review build

The built app is in `dist/little-spoon.html` and `dist/index.html`. On pdhome, the temporary Tailscale preview is `http://100.68.234.84:4174/`; the local preview is `http://127.0.0.1:4173/`. These are review processes, not a permanent public deployment. T3 collaborative browser tab `tab_12` was used for direct checks. Precise mobile viewport checks were done with Playwright because T3 resizing reported inconsistent actual CSS dimensions.

Clinical research/import scripts and fixture generators are in `scripts/`. Source provenance is committed alongside data. Browser screenshots, test reports and Lighthouse output are local under ignored `artifacts/`; committed reports summarize results and limitations.

## Prior thread intake

The complete requested T3 thread `a547969e-401f-4233-a0a7-5db6cbb1b9a7` was read, including 21 messages, both completed research reports and the latest message's two attachments. The thread title is Revive Pediatric Feeding Calculator. The latest attached message was `da935fb3-232e-4b21-a5a3-1ca3b98110cf`; its sketch and DESIGN (1).md informed this build.

If the originals are needed, query that thread only in the local T3 state database, read-only. Attachment records are under the same thread ID in T3's userdata attachments. Do not search archives again. The relevant AnthroCalc listing is [Canadian App Store](https://apps.apple.com/ca/app/anthrocalc/id1521729239).

The repository began this rebuild at `5186df0`. The three legacy snapshots and historical audit remain untouched. The older handoff files are under `legacy/`; this root NEXT.md is the current state. This file records task decisions and evidence, not new standing rules for Pat.

## Crystal review sheet

A standalone, fillable review sheet is saved at `artifacts/crystal-review.html` and copied to `dist/crystal-review.html`. It is open in T3 preview tab `tab_13` at `http://100.68.234.84:4174/crystal-review.html`. It asks only for a reproducible AnthroCalc comparison and the infant age convention/source. Copy, text download, print preparation, both themes and 320/390px layout were checked in Chromium and WebKit. Responses remain in page memory unless the user explicitly copies or downloads them; no clinical answer is preselected.

Pat briefly reported the activity selector missing, then immediately said they could see it. No calculator change was made in response.

## Hosted calculator publication

Pat requested the calculator itself online for Crystal outside Tailscale. A Sites project was created once: `appgprj_6a9c9ce4776c8191ba2e17eed377cfff`. Its dedicated static source checkout and hosting manifest are at `artifacts/sites/little-spoon/`. Sites confirmed successful private publication at `https://little-spoon.patdubois.chatgpt.site`. The initial expected origin redirected to this canonical address. Saved Sites version: `appgprj_6a9c9ce4776c8191ba2e17eed377cfff~appgver_9abcc59688408191b92ba024452d193f`; deployment: `appgdep_6a9c9d572bb88191a83a66b5db0259be`. Sites source commit: `3fc1f3f58de87fc2b7c6bcc42a39e1f698a22df6`. Access remains the new site's default owner-only ChatGPT sign-in. Reuse this project ID for subsequent updates. Only the two validated calculator HTML files are staged; the Crystal review sheet is excluded.


## Phone follow-up

Pat identified Arc on their phone and the DOB fields as the overlap location. Date controls now have bounded native sizing and separate phone rows. Nutrient references use stacked phone cards with complete daily/UL units and notes; the desktop table is retained. Clinical functions and reference data did not change. The production build, 209 tests and 48 browser checks pass. Additional independent mobile evidence is saved at `artifacts/mobile-fix-2026-09-05/`. See the phone follow-up in `docs/verification.md`. Actual Arc native picker behavior remains unverified.

Pat confirmed Crystal uses the Gmail-based ChatGPT account that owns the Site. T3's browser was signed into Pat's work account, which correctly received Access Denied after normal ChatGPT consent; a successful owner-account browser session has not been verified. Do not claim the shared site was exercised under the owner login. The tested phone update was successfully published to the existing owner-only Site at 23:04 UTC on September 5. The T3 browser also verified the new date constraints, date entry, derived age and reset against the local production build. All 48 browser checks use that exact build.


Latest publication: version 2, saved version `appgprj_6a9c9ce4776c8191ba2e17eed377cfff~appgver_fd37896282a08191afde826f9aad1137`, successful deployment `appgdep_6a9c9fdf7bc88191bf776260f4949925`, Sites source commit `15961fd10499b698f09fbe37047c76def59724c3`, GitHub app source `afaaaaf3222cee2f98d854d95948b22de1529237`. URL remains `https://little-spoon.patdubois.chatgpt.site`. The two app files have SHA-256 `5d8f7e4fa0dbae7da3dbe2a7debb834fae584d5798fe4def037499535a85097d`. The official package contains exactly those two files plus the hosting manifest; the Crystal sheet is excluded. Draft PR #2 describes the phone fixes and current validation. The owner-account live browser workflow remains unverified because T3 has the other account signed in; Pat confirmed Crystal has the correct Gmail account.


Pat then supplied IMG_3496/IMG_3497 showing portrait date boxes extending beyond the card and landscape boxes touching. Their portrait sex/age layout is from before the published phone fix. Independent visual review confirmed that distinction. The unchanged published build passed 48 additional focused geometry checks in Chromium/WebKit across portrait, landscape and 767/768/1023/1024px boundaries, with retained dates and at least 20px vertical or 23px horizontal spacing. Evidence: `artifacts/date-orientations/2026-09-05T23-05-32-272Z/report.json`. The existing date regression now covers rotation and both breakpoints; it passes in all three configured browser profiles. No app code or published asset changed in this follow-up. Actual Arc/iOS confirmation requires refreshing the phone's older page.


Pat confirmed Crystal successfully opened the private hosted app using the shared Gmail ChatGPT account. She will review it and Pat will relay feedback; clinical review is still pending. Pat requested the existing Crystal review sheet again, covering an AnthroCalc mismatch and the six-to-under-seven-month reference convention.


Pat canceled the broad Ped's history request as an old message; do not resume that investigation. Pat then supplied IMG_6700/IMG_6701 with a specific same-input comparison of the current Sites build and original blue Ped's calculator. That narrow case was verified in both browser UIs, including blank additional months. Original Ped's shows 1,512 kcal/day and 60.5 kcal/kg/day; the exact published rebuild shows 1,507 and 60.27. Independent review confirms the applicable Health Canada growth term is +15, whereas original Ped's uses +20. Both treat blank months as zero; no date conversion contributes to this case. Local evidence is `artifacts/peds-energy-investigation/crystal-exact-case.json`. No calculator code or deployment changed.


## Crystal vitamin units and fifth-birthday feedback

Crystal reported the other tools looked good, requested vitamin A and D in IU as well as micrograms, and supplied a five-year WHO-mode AnthroCalc comparison. This is useful review feedback, not a blanket clinical sign-off. Work is tracked in [issue #3](https://github.com/pat-dubois/little-spoon/issues/3).

Both vitamin units are implemented using Health Canada's published paired columns. D uses IU first; A keeps µg RAE first and labels IU as retinol. Preformed-only A UL scope remains explicit. Rounded D ULs 38/63 µg retain the correct 1,500/2,500 IU values and visible rounding labels. All canonical values and classifications for all 26 nutrients are unchanged. Clinical details are in docs/nutrition-validation.md.

For the female fifth-birthday example, unmodified WHO R returns height 2.23, weight 2.02 and BMI 1.26; independent R probabilities confirm height percentile 98.7 and BMI 89.6. Monthly WHO height interpolation can reproduce AnthroCalc's 2.22 because the raw values straddle a rounding boundary. It does not explain AnthroCalc's BMI 89.7. Its internal implementation remains unconfirmed; no growth algorithm/data was altered to match it. Evidence is retained in artifacts/anthrocalc-five-year/ and summarized in docs/growth-validation.md.

The latest source passes 232 tests, the production build and 54 browser tests. A separate interface agent passed 58 focused phone/desktop/print checks. Local evidence is retained in artifacts/vitamin-units/. The tested bundle was successfully published to the existing private Site at 23:35 UTC on September 5. Pat also asked for a plain explanation of the earlier energy finding after the current work.


Latest publication: version 3, saved version `appgprj_6a9c9ce4776c8191ba2e17eed377cfff~appgver_bc23d31f15d4819189a4c8949ff5f2bb`, successful deployment `appgdep_6a9ca71e7dac8191b3a73fc0a5355ce6`, Sites source commit `d492f8ac3bb2da9f6e64627133ed3604a9a8641a`, GitHub app source `55ac795b8e100e43afe344fe674663e3f0971b18`. URL remains `https://little-spoon.patdubois.chatgpt.site`. Both validated HTML files contain 951,212 bytes with SHA-256 `9dc3f2c1db4613231d79e180575045aafbb793466bb7ebe224a32812f3cd41f9`. The package contains only those two calculator files and the hosting manifest. Existing owner-only access was verified before publication and preserved. T3 tab_12 was returned to the live Site; its signed-in work account still cannot verify the Gmail owner workflow. Pat has already confirmed Crystal's Gmail access. GitHub repeats the verification on draft PR #2; local passing results are not a claim about pending remote checks.
