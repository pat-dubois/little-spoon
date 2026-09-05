# Legacy audit (Sept 5, 2026)

What the two old repos actually contain, so the rebuild can port faithfully and test against it.
Source snapshots: `legacy/peds-nutrition-calc/` and `legacy/littlespoon/`.

## Timeline

| When | What |
|---|---|
| Dec 17, 2025 | v1 shipped: single-file Nutrition calculator. Energy used IOM 2002. |
| Dec 18, 2025 | Crystal caught the version issue. Energy switched to Health Canada 2023 EER. Dark theme locked. |
| Dec 22, 2025 | Copy-to-clipboard built on branch `claude/implement-todo-item-a9uM2`. Never merged. |
| Jan 9, 2026 | kcal/kg/day added at Crystal's request. Animated counters, staggered reveal. HANDOFF.md. |
| Feb 15, 2026 | v2 in one evening: three tabs (Nutrition, Growth, DRI), rebrand to "little spoon, a zhuzh labs joint", WHO LMS 0-60 mo then extended to 19 y, DRI tables, guide.html + PDF. |
| Feb 15, 2026 | `littlespoon` repo created as a copy of index-v2. Guide link added, then lost in the last commit. |

Newest code: `peds-nutrition-calc/index-v2.html` and `littlespoon/index.html` are byte-identical (1755 lines, ~112 KB).

## What v2 does

Vanilla JS, embedded CSS, one external dependency (Google Fonts "Outfit"). Warm dark Flexoki-ish palette, gold accent, rainbow gradient on brand words. No storage of any kind. No print, export, or copy. Validation via `alert()`.

Shared patient card: weight (kg), height/length (cm), gender pills. Single Reset All.

**Tab 1 Nutrition.** Age years + months, activity level (3 y and up). Energy kcal/day and kcal/kg, protein g/day and g/kg, fluid mL/day and mL/kg. "Show calculation" per card.

**Tab 2 Growth.** DOB + date of measurement, optional head circumference, BMI vs weight-for-length toggle. Z-score and percentile per metric, colour by |Z|, marker on a -3.5..+3.5 bar. Replaces AnthroCalc for Crystal's daily case.

**Tab 3 DRI.** Age group dropdown, gender for 9-13 y and 14-18 y. RDA/AI and UL columns for 14 vitamins and 12 minerals.

## Formulas as implemented (port these exactly, then test)

Age for Nutrition: `ageM = years*12 + months`, `ageY = ageM/12`. Height in cm, weight in kg.

**Energy 0 to <36 mo (Health Canada 2023):** `EER = i + a*ageY + h*ht + w*wt + deposition`
- male: i -716.45, a -1.00, h 17.82, w 15.06
- female: i -69.15, a 80.0, h 2.65, w 54.15
- deposition, first bucket where ageM < max: male [3,200],[6,50],[12,20],[36,20]; female [3,180],[6,60],[12,20],[36,15]

**Energy 36 to 216 mo:** `EER = i + a*ageY + h*ht + w*wt + growth`
- male: sedentary {-447.51, 3.68, 13.01, 13.15}, low {19.12, 3.68, 8.62, 20.28}, active {-388.19, 3.68, 12.66, 20.46}, very {-671.75, 3.68, 15.38, 23.25}
- female: sedentary {55.59, -22.25, 8.43, 17.07}, low {-297.54, -22.25, 12.77, 14.73}, active {-189.55, -22.25, 11.74, 18.34}, very {-709.59, -22.25, 18.22, 14.25}
- growth: ageY < 9 → 20; ageY < 14 → 25; else 20

**Protein g/kg,** first bucket where ageM <= max: [6,1.52],[12,1.2],[36,1.05],[96,0.95],[156,0.95],[216,0.85].

**Fluid (Holliday-Segar):** wt<=10: wt*100; wt<=20: 1000+(wt-10)*50; else 1500+(wt-20)*20.

**Growth age:** days between DOB and DOM (local midnight) / 30.4375. Matches AnthroCalc.

**LMS Z:** |L| < 0.001 → ln(X/M)/S, else ((X/M)^L - 1)/(L*S). Linear interpolation between rows, clamped at ends.

**Normal CDF:** Abramowitz & Stegun 7.1.26 (a1 0.254829592, a2 -0.284496736, a3 1.421413741, a4 -1.453152027, a5 1.061405429, p 0.3275911).

**Table selection:** WFA 0-60 mo only; length-for-age <24 mo, height-for-age 24-60, height 5-19 y above 60; BMI 0-60 vs 61-228; WFL by height 45-110 cm; HC 0-60 mo.

**Z colour:** |Z|<1 normal, <2 warn, <3 alert, >=3 danger.

WHO LMS data: 16 datasets embedded in index-v2.html. `reference/who_lms_*.json` hold 10 of them (not BMI, not 5-19).

DRI tables: index-v2.html lines 1637-1667. Typed in one 7-minute commit, no per-row sources, no tests. **Re-verify every value against Health Canada before shipping.**

## Regression targets (what the shipped v2 code produces)

| Case | Input | Energy | Protein | Fluid |
|---|---|---|---|---|
| Infant | 5.5 kg, 62 cm, 0y 4m, F | 480 kcal (87.3/kg) | 8.4 g | 550 mL |
| Toddler | 12 kg, 86 cm, 2y 0m, M | 1015 kcal | 12.6 g | 1100 mL |
| Child | 25 kg, 122 cm, 7y 0m, M, active | 1714 kcal | 23.8 g | 1600 mL |
| Adolescent | 50 kg, 162 cm, 14y 0m, F, low active | 2216 kcal | 42.5 g | 2100 mL |
| Large adolescent | 75 kg, 180 cm, 17y 0m, M, very active | 3923 kcal | 63.8 g | 2600 mL |

Growth: boy, DOB 2025-10-11, DOM 2026-02-11, 5.0 kg → 4.04 mo, WFA Z -2.93, 0.2nd percentile (AnthroCalc match).

Note: the old `test-cases.md` energy expectations are IOM 2002 and wrong for the shipped code.

## Known bugs and gaps in v2

1. README, test-cases, GUIDE, guide.html, PDF all stale (2002 formulas, "0-5 years" growth).
2. Copy-to-clipboard never merged.
3. `user-scalable=no` blocks pinch zoom. Validation by alert. No aria-live. No focus management on tab switch.
4. Google Fonts dependency contradicts the "works offline" claim.
5. Ages 18y 1m to 18y 11m rejected in Nutrition though field allows 18.
6. Growth 60 to 61 month gap clamps to the 61-month row. WFL range error is an alert that fires after other results rendered.
7. "Grey out calculators until shared fields filled" was planned, never built.
8. Open wishes: Crystal's feedback on animations, Gus the dog sprite, pencil animation, print/PDF export, adult calculator, PWA.

## People and place

Built as a surprise gift for Crystal. Audience: Peds GI team at Jim Pattison Children's Hospital. Crystal uses it on her phone between patients. Reference comparators: Baylor BMI-z calculator, Health Canada DRI calculator, AnthroCalc 3.0.2.
