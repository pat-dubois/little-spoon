# Peds Calculator v2 - Architecture Plan

## Brand: zhuzhsoft
- Rainbow gradient footer (8s cycling linear-gradient, a la Olympics dashboard `tilli-rainbow`)
- Flexoki palette base but brighter - warm, not cold
- "zhuzh" from RuPaul = rainbow homage

## Structure: Three Calculator Tabs

### Shared Fields (top of page, always visible)
- Weight (kg)
- Height/Length (cm)
- Gender (M/F)
- These persist across all tabs
- Calculators grayed out until shared fields are filled

### Tab 1: Nutrition Requirements (existing calculator, upgraded design)
- **Additional inputs:** Age (years + months), Activity Level (only 3+ years)
- **Outputs:** Energy (kcal/day + kcal/kg/day), Protein (g/day), Fluid (mL/day)
- **Show Your Work** toggle for each
- **Formulas:** Health Canada 2023 DRIs (energy), Health Canada DRI (protein), Holliday-Segar (fluid)

### Tab 2: Growth Charts (NEW - replaces AnthroCalc)
- **Additional inputs:** Date of Birth, Date of Measurement (auto-calculates age)
- **Toggle:** BMI vs Weight-for-Length (like AnthroCalc)
- **Outputs per metric:**
  - Weight-for-age: Z-score + percentile
  - Length/Height-for-age: Z-score + percentile  
  - BMI-for-age OR Weight-for-Length: Z-score + percentile (based on toggle)
  - Head Circumference (optional, if HC entered): Z-score + percentile
- **Reference:** WHO Growth Charts (0-5 years)
- **Math:** LMS method: Z = ((X/M)^L - 1) / (L*S)
- **Percentile:** Standard normal CDF of Z-score

### Tab 3: DRI Reference (NEW - from Health Canada link)
- **Additional inputs:** Just Age and Gender (from shared fields)
- **Outputs:** Daily recommended intakes table
  - Vitamins (A, C, D, E, K, B-complex)
  - Minerals (Calcium, Iron, Zinc, Phosphorus, Magnesium, etc.)
  - Grouped by age bracket
- **Source:** Health Canada DRI tables (https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes.html)

## Reset Behavior
- Reset All clears EVERYTHING (shared fields + all tab-specific data + all results)
- Single reset button, not per-tab

## Data Architecture (single HTML file)
- WHO LMS tables embedded as JS objects (compressed)
- Health Canada DRI tables embedded as JS objects
- Standard normal CDF via approximation function (no external libs)
- All calculation done client-side
- Zero dependencies, zero network calls

## WHO LMS Data Status
| Dataset | Sex | Range | Status |
|---------|-----|-------|--------|
| Weight-for-age | Boys | 0-60 mo | ✅ Downloaded |
| Weight-for-age | Girls | 0-60 mo | ✅ Downloaded |
| Length-for-age | Boys | 0-24 mo | ✅ Downloaded |
| Length-for-age | Girls | 0-24 mo | ✅ Downloaded |
| Weight-for-length | Boys | 45-110 cm | ✅ Downloaded |
| Weight-for-length | Girls | 45-110 cm | ✅ Downloaded |
| Height-for-age | Both | 2-5 yr | ❌ Need to find |
| BMI-for-age | Both | 0-5 yr | ❌ Need to find |
| Head circ-for-age | Both | 0-5 yr | ❌ Need to find |

## Z-Score Formula (CDC/WHO standard)
```
When L ≠ 0: Z = ((X/M)^L - 1) / (L * S)
When L = 0: Z = ln(X/M) / S
```
Where:
- X = measured value (weight, length, BMI, etc.)
- L, M, S = LMS parameters for that age/sex
- M = median, S = generalized coefficient of variation, L = Box-Cox power

## Percentile from Z-Score
Use standard normal CDF approximation (Abramowitz & Stegun or similar)

## Design Direction
- Flexoki-derived palette, leaning brighter/warmer
- Dark mode locked (matches v1)
- Rainbow gradient on "zhuzhsoft" brand at footer
- Animated number counters (carry forward from v1)
- Staggered card reveals (carry forward from v1)
- Mobile-first (Crystal uses on phone between patients)
- Tab navigation: clean, touch-friendly pill buttons

## AnthroCalc Reference (from Crystal's screenshots)
- App: AnthroCalc 3.0.2
- Uses WHO Growth Charts under "Child Growth"
- Has: direct date entry toggle, DOB + measurement date, BMI/WfL toggle
- Outputs Z-score (SD) and percentile
- Also offers: Head, Waist, BP 2017, Obesity, CDC charts, Syndromes, Preterm Infants
- Our scope: WHO Child Growth only (covers Crystal's daily use case)

## Files
- `/Users/Shared/dev/Lab/personal/crystal/pedes-app/index.html` - current v1
- `/Users/Shared/dev/Lab/personal/crystal/pedes-app/reference/` - AnthroCalc screenshots
- `/tmp/who-data/who_lms_data.json` - extracted WHO LMS tables
- Source Granola transcript: Healthcare privacy training compliance issues (Feb 11, 2026)
