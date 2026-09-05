# Growth calculation validation

Verified 2026-09-05. The rebuilt growth engine matches independently obtained WHO expectations in **3,576 numeric z-score cases**, and correctly withholds **733 unavailable results**. The underlying comparisons are 302 under-five cases across five metrics and 933 older-child cases across three metrics. The growth test file currently contains 52 tests, including these full-dataset comparisons, boundary checks, calendar age, measurement conversion, probabilities, derived-value overflow/underflow, chart behavior and a fifth-birthday display comparison.

This verifies the implemented reference calculations. It does not establish agreement with every AnthroCalc setting or replace Crystal's clinical review. No new AnthroCalc measurements were entered during this work.

## Authoritative sources and pinned data

All reference values come from the World Health Organization's own repositories, linked from WHO's [child growth tools](https://www.who.int/tools/child-growth-standards/software) and [5 to 19 years application tools](https://www.who.int/tools/growth-reference-data-for-5to19-years/application-tools). No CDC reference has been mixed in.

| Reference | Pinned source | Data included |
| --- | --- | --- |
| WHO Child Growth Standards | [anthro commit b776d8a](https://github.com/WorldHealthOrganization/anthro/tree/b776d8a12b1c97369c748b561159fd2ec4f4db58) | Daily weight, length/height, BMI and head circumference; separate weight-for-length and weight-for-height tables at 0.1 cm resolution |
| WHO Growth Reference 2007 | [anthroplus commit 7cfcdb3](https://github.com/WorldHealthOrganization/anthroplus/tree/7cfcdb39026e9a55de55732bc3cf14c82261bcf7) | Monthly weight, height and BMI reference parameters, including the interpolation support rows at 60, 121 and 229 months |
| Normal probabilities | [NIST DLMF series](https://dlmf.nist.gov/8.7) and [continued fractions](https://dlmf.nist.gov/8.9) | Standard normal CDF through the incomplete gamma / complementary error-function identity |

The nine data files contain **17,824 reference rows**. `src/clinical/data/growth/sources.json` records every original URL, commit and SHA-256 digest. `scripts/growth-import.py` downloads and converts the full-precision numeric tables without reducing resolution; it checks order, positive medians and positive coefficients of variation. All data is included locally in the app. Calculations require no network access.

WHO's `anthro` declares GPL-3; `anthroplus` declares GPL version 3 or later. The full GPL text is retained in `src/clinical/data/growth/WHO-LICENSE.txt`. `growth.ts` is marked GPL-3.0-only, and the bundled WHO data retains its source attribution. These files should not be represented as solely MIT-licensed project material.

## Exact implemented conventions

| Topic | Behavior |
| --- | --- |
| Dates | Strict `YYYY-MM-DD` validation and UTC calendar-date subtraction. Impossible dates and measurement dates before birth produce no results. Daylight saving cannot change age. |
| Reference age | Elapsed days divided by 30.4375 for WHO months. Human-readable completed calendar years/months are calculated separately and never substituted for reference age. |
| Under-five reference | WHO daily tables for age below 60 WHO months. Actual date inputs give integer day lookups. For externally supplied fractional ages in tests, WHO's nearest-day rule rounds `.5` upward. |
| Older-child reference | WHO 2007 from 60 months, interpolating L, M and S between adjacent monthly rows. No 60-to-61-month gap and no endpoint clamping. |
| Age limits | Weight for age: below 121 months. Height and BMI for age: below 229 months. Head circumference and weight for length/height: below 60 months. These correspond to the current WHO packages' exclusive bounds, not an invented extension through the entire 10th or 19th year. |
| Position | Use recumbent length below 731 days and standing height from 731 days. Add 0.7 cm to standing height for younger children; subtract 0.7 cm from recumbent length for older children. BMI uses the same converted measurement. |
| Very young standing measurement | Below 9 WHO months, standing height triggers an explicit request to confirm recumbent length. The current WHO survey package flags and then drops the posture field; this interface withholds the affected results instead of silently treating the value as length. Weight for age and head circumference remain available. |
| Weight for stature | Separate WFL tables for adjusted length 45 through 110 cm, and WFH tables for adjusted height 65 through 120 cm. Bounds include endpoints. Fractional measurements interpolate between 0.1-cm rows. |
| LMS score | `z = ((X/M)^L - 1)/(L*S)`, with the exact logarithmic limit at `L = 0`. `expm1` and `log1p` preserve accuracy near zero. |
| Extreme weight/BMI score | Above +3 or below -3, WHO's fixed distance between the corresponding 2 and 3 SD measurements extends the tail. This applies to weight for age, BMI for age and weight for stature. Length/height and head circumference keep their ordinary LMS result. |
| Percentile | `100 * Phi(z)` using the unrounded, adjusted score. Display rounding is separate. The implementation calculates the small negative tail directly instead of discarding it. |
| Oedema | Withhold all weight-related z-scores, while retaining height and head circumference. |
| Unusual values | Reject missing, non-positive or non-finite inputs per affected metric. WHO data-quality flags remain visible for WFA below -6 or above +5; length/height beyond ±6; BMI, WFL/H and HC beyond ±5. Flagging uses the WHO two-decimal score convention. Flags are prompts to verify measurement/context, not diagnoses. |

These conventions follow the pinned WHO [under-five calculation code](https://github.com/WorldHealthOrganization/anthro/blob/b776d8a12b1c97369c748b561159fd2ec4f4db58/R/z-score.R), [LMS helpers](https://github.com/WorldHealthOrganization/anthro/blob/b776d8a12b1c97369c748b561159fd2ec4f4db58/R/z-score-helper.R) and [older-child implementation and bounds](https://github.com/WorldHealthOrganization/anthroplus/blob/7cfcdb39026e9a55de55732bc3cf14c82261bcf7/R/zscores.R). Older Anthro desktop manuals describe some different boundary conventions. Matching the current published packages is an explicit choice, and the app identifies its selected WHO source on each result.

## Independent checks actually run

The expectations in these tests were not calculated by copying the TypeScript implementation into another test helper.

| Check | Independent authority | Observed result |
| --- | --- | --- |
| Under-five calculations | Unmodified pinned WHO `anthro_zscores`, its actual supporting R functions and official `sysdata.rda`, executed in R 4.6.0 through WebR 0.6.0 | 302 cases; 1,475 numeric outputs agree at WHO's public 0.01 z precision; 35 unavailable outputs agree; flags, converted length/height and BMI agree |
| Older-child calculations | WHO's [published reference dataset](https://github.com/WorldHealthOrganization/anthroplus/blob/7cfcdb39026e9a55de55732bc3cf14c82261bcf7/data-raw/survey_who2007_z.csv), also used in its own regression suite | All 933 cases: 2,101 numeric z-scores agree at 0.01 precision and 698 unavailable outcomes agree |
| Probability conversion | Python standard-library C `math.erfc`, independent of the TypeScript incomplete-gamma algorithm | 413 points across both numerical branches and tails: absolute probability error below 3e-15; negative-tail relative error below 1e-12 for tested points from -20 through -3 |
| Critical boundaries | WHO's own 60.32- and 60.911701-month regression expectations, daily medians, separate WFL/H endpoint rows, current exclusive age bounds | Passes the old 60-to-61-month gap, source switch, 731-day position change, length/height endpoint inclusion and out-of-range refusal |
| Chart consistency | Inverse calculation checked against the child's independently validated result | The current point and same-z comparison agree; charts do not join different sources or different measurement conventions |

The independent datasets include **842 numeric outputs outside ±3 SD**, both sexes, early newborn days, ages around the length-to-height switch, fractional centimetres, boundary measurements, missing measurements and oedema. The under-five fixture records every executed R file's SHA-256 digest and the R runtime version. R and WebR are test-generation tools only; the application contains neither.

The relevant files are `growth.test.ts`, `who-under5-fixtures.json`, `who2007-fixtures.json` and `normal-cdf-fixtures.json`. Fixtures are imported only from the tests, not from application code. Regeneration is captured in `scripts/growth-reference-fixtures.mjs`, `scripts/growth-import.py` and `scripts/growth-cdf-fixtures.py`. For the R generator, `WEBR_MODULE` can point at a temporary WebR `dist/webr.mjs`; the run here used `/tmp/little-spoon-who-validation/node_modules/webr/dist/webr.mjs`.

## What the AnthroCalc example does and does not prove

Boy, birth 2025-10-11, measurement 2026-02-11, 5 kg:

| Quantity | WHO daily result |
| --- | --- |
| Age | 123 days; 4.0410677618 WHO months |
| LMS | L 0.1546; M 7.0252 kg; S 0.11303 |
| Weight-for-age z | -2.9309126459, displayed **-2.93** |
| Percentile | 0.1689839012%, displayed **0.2** |

The inherited thread reports AnthroCalc at -2.93 and 0.2. The new result is consistent with that reported comparison. The old monthly table produces -2.9276054215, which also rounds to -2.93; therefore that example cannot validate the old daily-age method. Moreover, running the actual old percentile formula produces **0.1260614803%**, which would display **0.1** with one-decimal rounding. That differs from the historical claim that the old calculator returned 0.2.

`scripts/growth-legacy-comparison.py` reads the existing snapshot without altering it, and independently uses Python's `erfc` for correct probabilities. It reproduces these additional differences:

| Case, all boys | Legacy z | Correct WHO z | Cause |
| --- | --- | --- | --- |
| Day 1, 3.3174 kg, weight for age | -0.13471 | 0.00000 | Monthly interpolation misses the daily neonatal reference |
| Day 731, BMI 16 | +0.21002 | -0.01517 | Monthly interpolation smears the length-to-height BMI transition |
| Day 1000, standing height 90 cm, 12 kg | -0.73303 | -0.89850 | Legacy uses the length reference for standing height |
| Day 123, 15 kg, weight for age | +7.12130 | +8.20500 | WHO extended-tail adjustment is absent in the old formula, alongside monthly reference differences |

The old normal-probability function also mixed an error-function polynomial evaluated at `abs(z)` with the exponential for `z / sqrt(2)`. For z = -1 it gives percentile 12.9671 instead of 15.8655, and for z = -2 it gives 1.72825 instead of 2.27501. That is an implementation defect regardless of the reference table. These are demonstrated causes in the old code, not a claim to know which setting or example Crystal saw in AnthroCalc.

## Fifth-birthday display comparison

A supplied WHO-mode AnthroCalc screenshot shows height z 2.22 and BMI percentile 89.7, while Little Spoon shows 2.23 and 89.6. The reproducible inputs are female, birth 2021-09-05, measurement 2026-09-05, 25 kg and standing height 120 cm. Exact elapsed age is 1,826 days, or 59.9917864476386 WHO months. This is a fifth calendar birthday but remains below the WHO package's 60-month source boundary.

The unmodified pinned WHO `anthro_zscores` function was executed again in R 4.6.0 for this case. It returns height 2.23, weight 2.02 and BMI 1.26. Independent R `pnorm` applied to the full-precision daily LMS scores confirms these displays:

| Metric | Full-precision z | Percentile | Little Spoon display |
| --- | ---: | ---: | --- |
| Height for age | 2.225095996886071 | 98.69626027835358 | 2.23; 98.7 |
| Weight for age | 2.0207145473147334 | 97.83453384763192 | 2.02; 97.8 |
| BMI for age | 1.2614870540516514 | 89.64332893240542 | 1.26; 89.6 |

The unrounded BMI is 17.36111111111111. The height daily reference has L = 1, M = 109.4189 and S = 0.04346. Interpolating the WHO [monthly height table](https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/length-height-for-age/hfa_girls_2_5_zscores.pdf?sfvrsn=9d3a6c08_9) at the same fractional age produces z 2.224625135965279, which rounds to 2.22. The raw score difference is about 0.00047 and straddles the 2.225 rounding boundary. This reproduces the screenshot's height display without establishing AnthroCalc's internal method.

Monthly BMI interpolation still gives percentile 89.6, so it does not explain the screenshot's 89.7. AnthroCalc's internal percentile method and exact stored inputs remain unconfirmed. No growth calculation or reference data was changed to force agreement. A regression checks all three WHO results, their unrounded percentiles and displayed rounding; the browser suite also checks the height and BMI displays.

Local evidence, including the executed WHO source hashes and R output, is retained in `artifacts/anthrocalc-five-year/`. User screenshots and private investigation notes are excluded from Git. These findings verify this reference calculation, not every AnthroCalc version or clinical workflow.

## Chart meaning and remaining clinical comparison

The chart plots the present measurement against the same sex, age and reference used for its result. Curves are labelled by z-score (-3, -2, -1, 0, +1, +2, +3). The dotted line follows the same z-score within that reference segment. It describes a comparison curve, **not a prediction** or a treatment target. It stops before an unsupported age or a change in reference/measurement convention. WFL/H charts use centimetres on the horizontal axis, not time. Flagged extreme results do not get a dotted continuation.

No prematurity correction, preterm growth reference, longitudinal patient record or clinical diagnosis is inferred. Exact chronological age is explicit. There is no patient-data persistence in this module.

The remaining clinical review is a comparison with Crystal's actual discrepant AnthroCalc cases, including its version, selected growth reference, date inputs, posture, any age correction and displayed units. Automated numerical agreement is strong evidence for the implemented WHO methods; it does not substitute for that workflow check.
