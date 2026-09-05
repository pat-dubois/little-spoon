# Little Spoon - Quick Start Guide

A pediatric nutrition calculator built for clinical use. Three tools in one page, no app to install, no patient data stored.

**Open it:** [pat-dubois.github.io/peds-nutrition-calc/index-v2.html](https://pat-dubois.github.io/peds-nutrition-calc/index-v2.html)

Works on your phone, tablet, or computer. Bookmark it for quick access.

---

## How It Works

There are **three tabs** at the top: **Nutrition**, **Growth**, and **DRI**.

All three tabs share the **Patient** section at the top (weight, height, and gender). Fill that in first, then pick your tab.

The **Reset** button clears everything across all tabs at once.

---

## Tab 1: Nutrition

Calculates daily energy, protein, and fluid requirements.

**What to enter:**
- Weight (kg) and Height (cm) in the Patient section
- Gender (tap Male or Female)
- Age in years and months
- Activity level (only needed for kids 3 and older)

**Hit Calculate.** You'll get:
- **Energy** in kcal/day (Health Canada 2023 equations)
- **Protein** in g/day (Health Canada DRI by age)
- **Fluid** in mL/day (Holliday-Segar 4-2-1 rule)

Each result shows the per-kg rate in brackets. Tap **Show calculation** to see the full formula and math.

---

## Tab 2: Growth

WHO growth chart Z-scores and percentiles for children 0-5 years.

**What to enter:**
- Weight and Height in the Patient section
- Gender
- Date of Birth
- Date of Measurement (defaults to today)
- Head circumference (optional - only if you need it)
- Choose BMI or Weight-for-Length mode

**Hit Calculate.** You'll get:
- **Weight-for-Age** Z-score and percentile
- **Length-for-Age** (under 2) or **Height-for-Age** (2 and up)
- **BMI-for-Age** or **Weight-for-Length** (your choice)
- **Head Circumference** (only shows if you entered a value)

**Color coding:**
- 🟢 Green = within normal range
- 🟡 Gold = mild concern (Z between -1 and -2 or +1 and +2)
- 🟠 Orange = moderate concern (Z between -2 and -3 or +2 and +3)
- 🔴 Red = severe (Z beyond -3 or +3)

**Note:** This tab covers ages 0-5 years (0-60 months). That's the range of the WHO Child Growth Standards.

---

## Tab 3: DRI Reference

Quick-reference table of daily vitamin and mineral needs by age group.

**What to enter:**
- Gender (in the Patient section)
- Age group (pick from the dropdown)

**Important:** For the **9-13 years** and **14-18 years** age groups, you need to select Male or Female first. Some nutrient needs differ by gender at those ages.

**Reading the table:**
- **Teal numbers** = RDA (Recommended Dietary Allowance) - strong evidence behind these
- **Blue numbers with an asterisk (*)** = AI (Adequate Intake) - best available estimate when research isn't conclusive enough for an RDA. Still the official recommendation.
- **UL column** = Tolerable Upper Intake Level (the max daily amount that's unlikely to cause harm)
- A dash (-) in the UL column means no upper limit has been set

---

## Good to Know

- **No data is saved.** Nothing is stored on any server. When you close the page, everything is gone. Safe for clinical use.
- **Works offline.** Once the page loads, you don't need internet. Great for areas with spotty WiFi.
- **Sources:** Health Canada 2023 DRI equations, Holliday-Segar (1957), WHO Child Growth Standards, IOM Dietary Reference Intakes (1997-2011).
- **Always verify.** This is a calculation tool, not a replacement for clinical judgment.

---

*a zhuzh labs joint*
