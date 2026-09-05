# Pediatric Nutrition Calculator

**Purpose:** A surprise gift for Crystal - a web-based tool to calculate pediatric nutrition requirements (energy, protein, fluid) for her work at Jim Pattison Children's Hospital.

**Status:** In Development

**Obsidian Project:** `~/Notes/pat-dubois/02 Projects/Personal/Pediatric Nutrition Calculator.md`

---

## What This Project Does

Replaces error-prone Excel spreadsheets with a fast, reliable, mobile-friendly calculator for pediatric dietitians and clinicians.

**Inputs:**
- Weight (kg)
- Height (cm)
- Age (years + months)
- Gender (Male/Female)
- Activity Level (Sedentary, Low Active, Active, Very Active)

**Outputs:**
- Energy Requirement (kcal/day)
- Protein Requirement (g/day)
- Fluid Requirement (mL/day)

Each output includes a "Show Your Work" toggle to display the actual calculation.

---

## Formula Sources

### Energy (EER) - Health Canada 2023 DRIs

**Source:** https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html

**Children 0-3 years** (gender-specific, no activity level):

*Males:*
`EER = –716.45 – (1.00 × age_y) + (17.82 × height_cm) + (15.06 × weight_kg) + energy_deposition`

*Females:*
`EER = –69.15 + (80.0 × age_y) + (2.65 × height_cm) + (54.15 × weight_kg) + energy_deposition`

| Age Range | Male Energy Dep | Female Energy Dep |
|-----------|-----------------|-------------------|
| 0-3 mo    | +200            | +180              |
| 3-6 mo    | +50             | +60               |
| 6-12 mo   | +20             | +20               |
| 1-3 yr    | +20             | +15               |

**Children 3-18 years** (activity-specific equations):

Each activity level has a completely different equation (not PA coefficients).

*Males:*
| Activity | Equation |
|----------|----------|
| Inactive | `–447.51 + (3.68 × age) + (13.01 × height) + (13.15 × weight) + growth` |
| Low Active | `19.12 + (3.68 × age) + (8.62 × height) + (20.28 × weight) + growth` |
| Active | `–388.19 + (3.68 × age) + (12.66 × height) + (20.46 × weight) + growth` |
| Very Active | `–671.75 + (3.68 × age) + (15.38 × height) + (23.25 × weight) + growth` |

*Females:*
| Activity | Equation |
|----------|----------|
| Inactive | `55.59 – (22.25 × age) + (8.43 × height) + (17.07 × weight) + growth` |
| Low Active | `–297.54 – (22.25 × age) + (12.77 × height) + (14.73 × weight) + growth` |
| Active | `–189.55 – (22.25 × age) + (11.74 × height) + (18.34 × weight) + growth` |
| Very Active | `–709.59 – (22.25 × age) + (18.22 × height) + (14.25 × weight) + growth` |

**Growth Allowances:**
| Age Range | Allowance |
|-----------|-----------|
| 3-8 years | +20 kcal  |
| 9-13 years| +25 kcal  |
| 14-18 years| +20 kcal |

### Protein - Health Canada DRIs (RDA g/kg/day)

| Age Group    | g/kg/day |
|--------------|----------|
| 0-6 months   | 1.52     |
| 7-12 months  | 1.2      |
| 1-3 years    | 1.05     |
| 4-8 years    | 0.95     |
| 9-13 years   | 0.95     |
| 14-18 years  | 0.85     |

### Fluid - Holliday-Segar Formula (1957)

- First 10 kg: 100 mL/kg/day
- Next 10 kg (11-20 kg): 50 mL/kg/day
- Each kg > 20 kg: 20 mL/kg/day

---

## Technical Stack

- **Single HTML file** with embedded CSS and JavaScript
- **No dependencies** - works anywhere, no build process
- **Hosting:** GitHub Pages

---

## Project Files

```
pedes-app/
├── index.html      # The complete app
├── CLAUDE.md       # This file
├── README.md       # User documentation
└── test-cases.md   # Validation test cases
```

---

## Key Design Decisions

1. **Single HTML file:** Maximum portability, Crystal can even save it locally
2. **Years + Months age input:** Intuitive for clinical use
3. **Show Your Work:** Builds trust, proves no hallucinations
4. **Mobile-first:** Crystal moves between patients
5. **Jim Pattison-inspired colors:** Professional, familiar

---

## Validation Reference

The Baylor College of Medicine calculator (https://www.bcm.edu/cnrc-apps/bodycomp/bmiz3.html) can be used to cross-validate energy calculations.

---

## Future Enhancements (v2+)

- Pencil animation for "show your work"
- Gus the dog sprite as signature
- Print/PDF export
- Adult calculator
- PWA for offline use
- COPY toggle that copies the results to the clipboard nicely formatted

---

## Session Status (2025-12-18)

### What Was Accomplished
- Built complete Pediatric Nutrition Calculator from scratch (Dec 17)
- Deployed to GitHub Pages: https://pat-dubois.github.io/peds-nutrition-calc/
- Crystal tested and found formula version issue (Dec 18)
- **Updated to Health Canada 2023 equations:**
  - 0-3 years: Now gender-specific with height included
  - 3-18 years: Activity-specific equations (replaces old PA coefficient approach)
- Improved dark mode toggle (clean switch design)
- Updated "Show Your Work" to reflect new formulas

### Lessons Learned
- **Research currency matters**: Initial search found widely-cited IOM 2002 formulas, but Health Canada has since updated. Always verify you have the NEWEST version of reference materials, especially for clinical/scientific tools.

### Next Session TODO
1. Crystal re-validation with updated formulas
2. Consider v2 enhancements: Gus sprite, pencil animation, copy-to-clipboard