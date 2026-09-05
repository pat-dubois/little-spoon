# Test Cases for Pediatric Nutrition Calculator

Use these test cases to validate the calculator's accuracy. Hand-calculate or compare against trusted sources.

---

## Test Case 1: Infant (4 months)

**Input:**
- Weight: 5.5 kg
- Height: 62 cm
- Age: 0 years, 4 months
- Gender: Female
- Activity: N/A (not used for infants)

**Expected Output:**

**Energy:**
- Formula: `EER = (89 × weight - 100) + 56` (4-6 months)
- Calculation: `(89 × 5.5 - 100) + 56 = (489.5 - 100) + 56 = 445.5`
- **Expected: ~446 kcal/day**

**Protein:**
- Formula: `weight × 1.52 g/kg/day` (0-6 months)
- Calculation: `5.5 × 1.52 = 8.36`
- **Expected: 8.4 g/day**

**Fluid:**
- Formula: Holliday-Segar (first 10 kg = 100 mL/kg)
- Calculation: `5.5 × 100 = 550`
- **Expected: 550 mL/day**

---

## Test Case 2: Toddler (2 years)

**Input:**
- Weight: 12 kg
- Height: 86 cm
- Age: 2 years, 0 months (24 months)
- Gender: Male
- Activity: N/A (not used for under 3)

**Expected Output:**

**Energy:**
- Formula: `EER = (89 × weight - 100) + 20` (13-35 months)
- Calculation: `(89 × 12 - 100) + 20 = (1068 - 100) + 20 = 988`
- **Expected: ~988 kcal/day**

**Protein:**
- Formula: `weight × 1.05 g/kg/day` (1-3 years)
- Calculation: `12 × 1.05 = 12.6`
- **Expected: 12.6 g/day**

**Fluid:**
- Formula: Holliday-Segar
- Calculation: `(10 × 100) + (2 × 50) = 1000 + 100 = 1100`
- **Expected: 1,100 mL/day**

---

## Test Case 3: Child (7-year-old boy, Active)

**Input:**
- Weight: 25 kg
- Height: 122 cm
- Age: 7 years, 0 months
- Gender: Male
- Activity: Active (PA = 1.25)

**Expected Output:**

**Energy:**
- Formula: `EER = 88.5 - (61.9 × age) + PA × [(26.7 × weight) + (903 × height_m)] + 20`
- Height in meters: 1.22 m
- Inner calculation: `(26.7 × 25) + (903 × 1.22) = 667.5 + 1101.66 = 1769.16`
- Full calculation: `88.5 - (61.9 × 7) + 1.25 × 1769.16 + 20`
- `= 88.5 - 433.3 + 2211.45 + 20`
- `= 1886.65`
- **Expected: ~1,887 kcal/day**

**Protein:**
- Formula: `weight × 0.95 g/kg/day` (4-8 years)
- Calculation: `25 × 0.95 = 23.75`
- **Expected: 23.8 g/day**

**Fluid:**
- Formula: Holliday-Segar
- Calculation: `(10 × 100) + (10 × 50) + (5 × 20) = 1000 + 500 + 100 = 1600`
- **Expected: 1,600 mL/day**

---

## Test Case 4: Adolescent (14-year-old girl, Low Active)

**Input:**
- Weight: 50 kg
- Height: 162 cm
- Age: 14 years, 0 months
- Gender: Female
- Activity: Low Active (PA = 1.11)

**Expected Output:**

**Energy:**
- Formula: `EER = 135.3 - (30.8 × age) + PA × [(10.0 × weight) + (934 × height_m)] + 25`
- Height in meters: 1.62 m
- Inner calculation: `(10.0 × 50) + (934 × 1.62) = 500 + 1513.08 = 2013.08`
- Full calculation: `135.3 - (30.8 × 14) + 1.11 × 2013.08 + 25`
- `= 135.3 - 431.2 + 2234.52 + 25`
- `= 1963.62`
- **Expected: ~1,964 kcal/day**

**Protein:**
- Formula: `weight × 0.85 g/kg/day` (14-18 years)
- Calculation: `50 × 0.85 = 42.5`
- **Expected: 42.5 g/day**

**Fluid:**
- Formula: Holliday-Segar
- Calculation: `(10 × 100) + (10 × 50) + (30 × 20) = 1000 + 500 + 600 = 2100`
- **Expected: 2,100 mL/day**

---

## Test Case 5: Large Adolescent (17-year-old boy, Very Active)

**Input:**
- Weight: 75 kg
- Height: 180 cm
- Age: 17 years, 0 months
- Gender: Male
- Activity: Very Active (PA = 1.48)

**Expected Output:**

**Energy:**
- Formula: `EER = 88.5 - (61.9 × age) + PA × [(26.7 × weight) + (903 × height_m)] + 25`
- Height in meters: 1.80 m
- Inner calculation: `(26.7 × 75) + (903 × 1.80) = 2002.5 + 1625.4 = 3627.9`
- Full calculation: `88.5 - (61.9 × 17) + 1.48 × 3627.9 + 25`
- `= 88.5 - 1052.3 + 5369.29 + 25`
- `= 4430.49`
- **Expected: ~4,430 kcal/day**

**Protein:**
- Formula: `weight × 0.85 g/kg/day` (14-18 years)
- Calculation: `75 × 0.85 = 63.75`
- **Expected: 63.8 g/day**

**Fluid:**
- Formula: Holliday-Segar
- Calculation: `(10 × 100) + (10 × 50) + (55 × 20) = 1000 + 500 + 1100 = 2600`
- **Expected: 2,600 mL/day**

---

## Validation Checklist

- [ ] Test Case 1 (Infant) - All three outputs match
- [ ] Test Case 2 (Toddler) - All three outputs match
- [ ] Test Case 3 (Child, Male, Active) - All three outputs match
- [ ] Test Case 4 (Adolescent, Female, Low Active) - All three outputs match
- [ ] Test Case 5 (Large Adolescent, Male, Very Active) - All three outputs match
- [ ] Activity level disabled for ages under 3
- [ ] Show calculation displays correct formulas
- [ ] Reset button clears all fields
- [ ] Mobile responsive layout works
- [ ] Results scroll into view after calculation

---

## Reference Comparison

You can also compare energy calculations against:
- **Baylor Calculator:** https://www.bcm.edu/cnrc-apps/bodycomp/bmiz3.html
- **Health Canada DRI Calculator:** https://health-infobase.canada.ca/nutrition/dietary-reference-intakes-calculator/

Note: Slight variations may occur due to rounding differences.
