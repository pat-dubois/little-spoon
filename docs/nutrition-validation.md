# Nutrition and DRI validation

Verified 2026-09-05. This documents implementation checks, source conflicts and scope. It is not a record of clinical sign-off by Crystal or Pat.

## Result

The rebuilt reference engine uses the current Health Canada 2023 energy equations, the published protein g/kg/day values and daily Holliday-Segar maintenance arithmetic. It includes all 26 vitamins and minerals in the previous calculator. Calculations return unrounded numbers, substituted work, source links and scope notes. Invalid ages, categories, nonfinite numbers, nonpositive measurements and nonpositive energy predictions fail explicitly.

166 targeted automated tests pass. The DRI tests independently transcribe and check all 208 age/sex/nutrient intake values, their AI/RDA classifications, and all 208 UL values or explicit nulls. They also check all 32 published vitamin A/D IU values and the affected age boundaries. A separate online comparison checks 624 fields against the Health Canada calculator's CSV with **zero differences**. The energy comparator runs **372 synthetic cases** through both this engine and the current Health Canada calculator code: **300 match**, and **72 differ only because the official calculator switches growth deposition before the ninth birthday, contrary to its published equation table**. There are **zero unexplained energy differences** in that comparison. TypeScript checking also passes.

## Sources and provenance

| Reference | What it supports |
| --- | --- |
| [Health Canada energy equations](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html) | Current EER coefficients, deposition bands, sex, centimetre/kilogram/year units and PAL categories |
| [Health Canada macronutrient table](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-macronutrients.html#tbl1) | Protein AI/RDA in g/kg/day, distinguished from the fixed reference-body-weight g/day values |
| [Health Canada vitamin tables](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-vitamins.html) and [element tables](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-elements.html) | All 26 intake/UL rows, AI versus RDA, chemical units, infant exceptions, diet/menstruation assumptions and UL scope |
| [Holliday and Segar, Pediatrics, 1957](https://doi.org/10.1542/peds.19.5.823), reviewed by the [American Academy of Pediatrics](https://publications.aap.org/pediatrics/resources/24215/Top-Pediatric-Hospital-Medicine-Articles-in) | Daily 100/50/20 mL/kg maintenance arithmetic |
| [Health Canada live calculator](https://health-infobase.canada.ca/nutrition/dietary-reference-intakes-calculator/) | Independent implementation/data comparison, including discrepancies documented below |

The source table values were extracted afresh from Health Canada HTML. They were not copied from the old app. The importer reads the AI footnote markers, strips superscripts before reading numbers and uses an explicit reviewed map of the multilevel table columns. It preserves selected source rows, table identifiers, exact source URLs, retrieval time and SHA-256 hashes in `src/clinical/data/dri-provenance.json`. The app uses `dri-values.json`, which contains the numeric values and the source link for each nutrient. Tests contain a separate manually reviewed expected-value matrix.

The independent CSV comparison and energy comparison store retrieval times, source hashes, counts and any discrepancies in `dri-verification.json` and `nutrition-verification.json`. No downloaded source is fetched at app runtime. The import/verification scripts use only public references and synthetic examples; they do not accept patient data.

## Energy implementation

The base equation is `intercept + ageCoefficient × ageYears + heightCoefficient × heightCm + weightCoefficient × weightKg + deposition`. Height/length is required even in infancy. The older weight-only infant formula is not the current 2023 equation. Activity must be selected explicitly from age 3 years; it does not affect infant equations. The supported range is birth to before the nineteenth birthday, including all of the eighteenth year.

The deposition term is:

| Age, lower bound included and upper bound excluded | Male, kcal/day | Female, kcal/day |
| --- | ---: | ---: |
| Birth to 3 months | 200 | 180 |
| 3 to 6 months | 50 | 60 |
| 6 to 12 months | 20 | 20 |
| 1 to 3 years | 20 | 15 |
| 3 to 4 years | 20 | 15 |
| 4 to 9 years | 15 | 15 |
| 9 to 14 years | 25 | 30 |
| 14 to 19 years | 20 | 20 |

Each coefficient and each side of every boundary is tested. In particular, a 7-year-old boy at 25 kg and 122 cm, active, now gives **1708.59 kcal/day**, rather than the old rounded **1714**. The old build used 20 instead of 15 kcal/day for growth at that age. Female 3 to under 4 and 9 to under 14 growth terms were also wrong in the old build.

PAL means total energy expenditure divided by basal energy expenditure. This engine exposes the published age-specific PAL intervals; adult walking/activity examples must not be presented as validated child definitions. A clinical assessment of activity remains necessary.

### A discrepancy in the official energy calculator

The published table uses `4 to <9 years` and `9 to <14 years`. At retrieval, the [official calculator JavaScript](https://health-infobase.canada.ca/src/js/nutrition/dietary-reference-intakes-calculator/EER_Equations.js) instead uses `age > 8` when selecting deposition. For ages greater than 8 but below 9, its estimates are 10 kcal/day higher for boys and 15 kcal/day higher for girls. The new engine follows the explicit published table. The comparator labels and records all 72 affected synthetic cases as an explained discrepancy, rather than treating them as either a pass or a reason to copy the bug.

The comparator checks rounded kcal/day because that is what the official function returns. Separate tests verify our unrounded results using independent decimal arithmetic. A matching displayed total alone would not establish precision or complete coverage.

## Protein and infant age conventions

| Implemented age band | g/kg/day | Reference type |
| --- | ---: | --- |
| Birth to under 7 months | 1.52 | AI |
| 7 to under 12 months | 1.2 | RDA |
| 1 to under 4 years | 1.05 | RDA |
| 4 to under 9 years | 0.95 | RDA |
| 9 to under 14 years | 0.95 | RDA |
| 14 to under 19 years | 0.85 | RDA |

For the general DRI and protein bands, the implementation follows the current Health Canada calculator's `ageToDRIAgeRange` function, which switches the infant band at `7 / 12` years. The displayed labels spell out the exact implemented intervals instead of repeating ambiguous integer-age labels. The old app incorrectly switched protein after 36 months instead of at 48 months, and after 156 months instead of at 168 months. These errors are covered by boundary tests.

There is a real source conflict. The [NASEM overview of DRI life-stage groups](https://www.nationalacademies.org/read/10872/chapter/6) says infancy is divided into “two 6-month intervals.” Current Health Canada calcium and vitamin D table footnotes explicitly say: “Life-stage groups for infants were 0-5.9 and 6-11.9 months.” Yet the general Health Canada calculator uses a 7-month transition. This is not silently resolved or claimed to be a decision by Crystal or Pat.

The implementation decision is to follow the requested current Health Canada calculator's general protein/DRI bands, while applying the **explicit 6-month calcium and vitamin D footnotes**. Each DRI row carries its actual age-band label. At 6 to under 7 months, the result notes explain the mixed bands; the protein note also names the conflicting six-month NASEM convention. The affected conventions still need agreement with the treating team before clinical reliance. Tests cover 5.999, 6, 6.999, 7, 11.999 and 12 months.

The pure calculation API accepts an exact numeric age in months, converting it to years by division by 12. Health Canada's formula page does not specify a day-count conversion. The app should use attained calendar age for Nutrition/DRI classification so birthdays select the next band on the birthday; the WHO-specific fixed-day month convention belongs to the growth engine.

## DRI distinctions preserved

All 26 nutrients are verified across two infant bands, ages 1 to under 4 and 4 to under 9, and both sexes at 9 to under 14 and 14 to under 19. The source values for female 9-to-13-year-olds are **1.6 mg manganese** and **21 µg chromium**, correcting the old app's male values of 1.9 mg and 25 µg.

The nutrient display must preserve these distinctions:

1. `null` means no UL established, never zero or unlimited. AI and RDA remain separate labels, including infant iron and zinc, which switch to RDA in the older-infant band.
2. The magnesium UL covers supplemental/pharmacological intake and excludes food and water. A UL lower than the total-intake RDA is therefore possible and is not a data error.
3. Folate intake uses µg DFE; its UL uses µg folic acid from supplements/fortified foods. Vitamin A's UL covers preformed vitamin A only. Niacin and vitamin E ULs are limited to their specified synthetic sources.
4. Younger-infant niacin is measured as preformed niacin, not NE. Vitamin D and calcium use the source's reported rounded numeric values, including vitamin D ULs of 38 and 63 µg/day; they are not silently changed to 37.5 or 62.5.
5. Source notes retain iron/zinc diet modifiers and the iron table's menstruation assumption for girls. The numbers are baseline reference values; those adjustments are not silently applied without the relevant inputs.

## Vitamin A and D dual units

The September 5 follow-up imports the existing IU intake and UL columns directly from [Health Canada's vitamin table 1](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-vitamins.html#tbl1). These paired values supplement the canonical microgram values. Reimporting the sources left every canonical value, AI/RDA classification and nutrient source URL unchanged across all 26 nutrients.

Vitamin D displays IU/day first and µg/day second. Its published intake pairs are 400 IU with 10 µg and 600 IU with 15 µg. The UL pairs are 1,000/25, 1,500/38, 2,500/63, 3,000/75 and 4,000/100 IU/µg. The 38 and 63 µg ULs visibly say “rounded”; their notes give the exact 37.5 and 62.5 µg equivalents. Multiplying the rounded source values by 40 would incorrectly display 1,520 and 2,520 IU. The display uses the published IU columns instead. The [NIH vitamin D reference](https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/) supports the 40 IU per µg conversion and published UL pairs.

Vitamin A keeps µg RAE/day first and adds the published “IU/day as retinol” value. Its UL separately labels both units as preformed vitamin A. Notes explain that carotenoid conversions depend on form and source; the display does not imply that one conversion applies to every food or supplement. It also retains the note excluding beta-carotene from the preformed-vitamin-A UL. The [NIH vitamin A reference](https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/) explains these distinctions. RAE has not been relabeled RE.

The additional 22 DRI tests check the eight source groups, the separate vitamin D infant boundary, rounded UL pairs, retinol/preformed scope, source links and unchanged behavior for other nutrients. Desktop tables, phone cards and print tables all show the paired units. Browser regressions include both rounded vitamin D ULs and the five-year vitamin A/D references.

## Fluid scope

The function calculates the **daily** 100 mL/kg for the first 10 kg, 50 mL/kg for the next 10 kg, then 20 mL/kg for each additional kg. It does not use the different hourly 4/2/1 approximation or derive an hourly prescription. Boundary tests verify just below, at and just above 10 and 20 kg, and independently calculated 5.5, 12, 25, 50 and 75 kg cases. The returned notes distinguish baseline maintenance arithmetic from total-water DRI, deficits, ongoing losses, disease restrictions and neonatal fluid assessment. The reference estimates do not replace individualized clinical assessment.

## Reproduction and limits

The following were run successfully by the agent; these are audit commands, not tasks left for Pat:

```text
npx vitest run src/clinical/nutrition.test.ts src/clinical/dri.test.ts
npx tsc --noEmit
python3 scripts/dri-import.py
python3 scripts/dri-verify-reference-csv.py
node scripts/nutrition-verify-health-canada.mjs
```

The numerical checks establish agreement with the stated references and make the identified disagreements visible. They do not validate these population reference equations for individual GI disease, prematurity, pregnancy/lactation, unusual body composition or prescribed fluid therapy. Clinical team review of the infant convention remains outstanding. End-to-end UI display, keyboard, mobile, print, offline and growth-engine checks are tracked separately by the main task.
