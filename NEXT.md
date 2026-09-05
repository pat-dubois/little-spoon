# Little Spoon session state

Updated: 2026-09-05. Coordinating agent: tili. Host: pdhome.

## Current state

The rebuild is implemented on `feat/verified-clinical-rebuild`. Work is tracked in [GitHub issue #1](https://github.com/pat-dubois/little-spoon/issues/1). Local verification is complete: 209 tests and 42 browser checks pass. The review handoff is being saved; see [verification report](docs/verification.md) for the actual passing evidence and limits.

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
