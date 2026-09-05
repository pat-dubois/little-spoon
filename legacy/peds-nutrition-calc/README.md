# Pediatric Nutrition Calculator

A fast, reliable web tool for calculating pediatric nutrition requirements. Built for dietitians and clinicians at Jim Pattison Children's Hospital.

## Live Demo

**https://pat-dubois.github.io/peds-nutrition-calc/**

## Features

- **Energy Requirement** (kcal/day) - Based on Health Canada DRIs
- **Protein Requirement** (g/day) - Based on Health Canada DRIs
- **Fluid Requirement** (mL/day) - Based on Holliday-Segar formula

### Key Features

- Works on desktop and mobile
- No login required
- No data stored (privacy-first)
- "Show Your Work" for each calculation
- Supports ages 0-18 years

## How to Use

1. Enter the patient's **weight** in kilograms
2. Enter the patient's **height** in centimeters
3. Enter the patient's **age** (years and months)
4. Select **gender** (Male/Female)
5. Select **activity level** (for children 3+ years)
6. Click **Calculate**

Results appear instantly. Click "Show calculation" to see the formula and values used.

## Formula Sources

### Energy (Estimated Energy Requirements)

**Source:** Health Canada Dietary Reference Intakes (DRIs)

| Age Group | Formula |
|-----------|---------|
| 0-3 months | `(89 × weight) - 100 + 175` |
| 4-6 months | `(89 × weight) - 100 + 56` |
| 7-12 months | `(89 × weight) - 100 + 22` |
| 13-35 months | `(89 × weight) - 100 + 20` |
| Boys 3-8y | `88.5 - (61.9 × age) + PA × [(26.7 × weight) + (903 × height_m)] + 20` |
| Boys 9-18y | `88.5 - (61.9 × age) + PA × [(26.7 × weight) + (903 × height_m)] + 25` |
| Girls 3-8y | `135.3 - (30.8 × age) + PA × [(10.0 × weight) + (934 × height_m)] + 20` |
| Girls 9-18y | `135.3 - (30.8 × age) + PA × [(10.0 × weight) + (934 × height_m)] + 25` |

**Physical Activity (PA) Coefficients:**
- Sedentary: 1.0
- Low Active: 1.11
- Active: 1.25
- Very Active: 1.48

### Protein

**Source:** Health Canada DRIs (Recommended Dietary Allowance)

| Age Group | g/kg/day |
|-----------|----------|
| 0-6 months | 1.52 |
| 7-12 months | 1.2 |
| 1-3 years | 1.05 |
| 4-8 years | 0.95 |
| 9-13 years | 0.95 |
| 14-18 years | 0.85 |

### Fluid

**Source:** Holliday-Segar Formula (Holliday & Segar, 1957)

| Weight Range | mL/kg/day |
|--------------|-----------|
| First 10 kg | 100 |
| 11-20 kg | 50 |
| >20 kg | 20 |

**Example:** A 25 kg child needs:
- First 10 kg: 10 × 100 = 1,000 mL
- Next 10 kg: 10 × 50 = 500 mL
- Remaining 5 kg: 5 × 20 = 100 mL
- **Total: 1,600 mL/day**

## Validation

This calculator has been validated against:
- Hand calculations using the source formulas
- Baylor College of Medicine Children's BMI & Energy Calculator

**Important:** Always verify critical calculations and use clinical judgment. This tool is intended to assist, not replace, professional assessment.

## References

1. Health Canada. (2023). Dietary Reference Intakes Tables. https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables.html

2. Holliday, M. A., & Segar, W. E. (1957). The maintenance need for water in parenteral fluid therapy. Pediatrics, 19(5), 823-832.

3. Institute of Medicine. (2005). Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids. National Academies Press.

## Technical Details

- **Stack:** Single HTML file (HTML + CSS + JavaScript)
- **Dependencies:** None
- **Browser Support:** All modern browsers
- **Offline:** Can be saved locally and used offline

## License

MIT License - Free to use and modify.

---

Built with care for the Peds GI team at Jim Pattison Children's Hospital.
