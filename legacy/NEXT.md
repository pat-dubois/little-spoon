# NEXT.md — Little Spoon session state

Updated: 2026-09-05 (session 1, setup)

## Where we are

Step 1 of N done: repo created, old work gathered, design skills installed. Nothing new built yet.

- Repo: https://github.com/pat-dubois/little-spoon (public, like its predecessors, so GitHub Pages is free)
- Old code snapshots in `legacy/` (three versions, see `legacy/README.md`)
- Full audit of the old code: `docs/legacy-audit.md` (formulas, constants, regression targets, bugs)
- Brand docs: `docs/brand/`
- Crystal transcripts (Dec 17, Feb 11, Feb 16): `_private/transcripts/` on pdhome only, gitignored, never commit
- Design skills: `.claude/skills/` (design-taste-frontend, high-end-visual-design, minimalist-ui, redesign-existing-projects, full-output-enforcement)

## What Little Spoon is

A no-data clinical calculator for Crystal (pediatric dietitian, Peds GI, Jim Pattison Children's Hospital) and colleagues. Replaces an error-prone Excel sheet, a dead Baylor website, and the slow AnthroCalc app. Used on phones between patients and on hospital desktops. Zero persistence, zero network after load. "For clinical use. Always verify calculations."

Three parts (from the Feb 11 dinner, confirmed in V2-ARCHITECTURE):

1. **Nutrition requirements.** Weight, height, age, sex, activity level in. Energy (Health Canada 2023 EER), protein (DRI g/kg), fluid (Holliday-Segar) out, with "show your work." Used before prescribing TPN or enteral feeds.
2. **Growth.** DOB + measurement date + measurements in. WHO z-scores and percentiles out for weight, length/height, BMI or weight-for-length, head circumference. Replaces AnthroCalc.
3. **DRI reference.** Age group + sex in. Table of RDA/AI and UL for vitamins and minerals out.

Shared patient fields sit above all three. One Reset clears everything.

## Decisions still open (ask Pat)

1. Stack: single HTML file like before, or Vite + TypeScript + tests that also builds a single offline file. Recommendation: the latter.
2. Structure: three tabs under one patient card (as before) or three separate tools with a home screen. Pat said "three distinct uses and workflows."
3. Light mode in addition to dark. Pat said Feb 22 all zhuzh labs apps should have both.
4. Tagline: "a zhuzh labs joint" or "a zhuzh labs app". Pat leaned toward dropping "joint" in March.
5. Keep the repo public.

## Crystal's open asks (highest value first)

1. Weight-for-age z-score past age 5. The old build stopped at 5 and she hit it on a 10-year-old. WHO 2007 Reference publishes weight-for-age LMS for 5 to 10 years. CDC 2000 covers 2 to 20. Neither was added.
2. Projected growth curve ("dotted lines") following the child's percentile forward.
3. She never signed off on tabs 2 and 3 ("I need to triple check it").

## Known debts to fix in the rebuild

- DRI table values were typed from memory in one commit. Re-verify every row against Health Canada.
- Confirm Health Canada EER equations are still the current version (last checked Dec 2025).
- Accessibility: 44 px touch targets, pinch zoom allowed, no alert() dialogs, aria-live results.
- Offline for real: self-host fonts, no CDN.
- Copy-to-clipboard was built once and lost. Print/PDF and PWA never started.

## Session notes

- Browser preview snapshots via the T3 preview tool cost ~25k tokens each. Use a headless screenshot script instead next time.
