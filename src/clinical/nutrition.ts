/** Pure reference calculations. Values are deliberately not rounded here. */
export type Sex = 'male' | 'female';
export type ActivityLevel = 'inactive' | 'low-active' | 'active' | 'very-active';

export interface ClinicalSource { title: string; url: string }
export interface NutritionInput {
  ageMonths: number;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  activity?: ActivityLevel;
}
export interface NutritionEstimate {
  value: number;
  perKg: number;
  unit: 'kcal/day' | 'g/day' | 'mL/day';
  perKgUnit: 'kcal/kg/day' | 'g/kg/day' | 'mL/kg/day';
  method: string;
  steps: string[];
  sources: ClinicalSource[];
  notes: string[];
  referenceType?: 'EER' | 'RDA' | 'AI' | 'maintenance';
}
export interface NutritionResult {
  energy: NutritionEstimate;
  protein: NutritionEstimate;
  fluid: NutritionEstimate;
}

const HC_BASE = 'https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/';
export const NUTRITION_SOURCES = {
  energy: { title: 'Health Canada: energy equations (2023 DRI)', url: `${HC_BASE}equations-estimate-energy-requirement.html` },
  protein: { title: 'Health Canada: protein reference intakes', url: `${HC_BASE}reference-values-macronutrients.html#tbl1` },
  ageBands: { title: 'Health Canada DRI calculator: age classification', url: 'https://health-infobase.canada.ca/nutrition/dietary-reference-intakes-calculator/' },
  fluid: { title: 'Holliday and Segar, Pediatrics (1957)', url: 'https://doi.org/10.1542/peds.19.5.823' },
  fluidReview: { title: 'American Academy of Pediatrics: daily maintenance fluid formula', url: 'https://publications.aap.org/pediatrics/resources/24215/Top-Pediatric-Hospital-Medicine-Articles-in' },
} satisfies Record<string, ClinicalSource>;

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  inactive: 'Inactive', 'low-active': 'Low active', active: 'Active', 'very-active': 'Very active',
};

/** Inclusive lower bound, exclusive upper bound, following the published PAL table. */
export function getActivityRanges(ageMonths: number): Record<ActivityLevel, [number, number]> | null {
  validateAge(ageMonths);
  if (ageMonths < 36) return null;
  const cuts = ageMonths < 108 ? [1, 1.31, 1.44, 1.59, 2.5]
    : ageMonths < 168 ? [1, 1.44, 1.59, 1.77, 2.5] : [1, 1.56, 1.73, 1.92, 2.5];
  return {
    inactive: [cuts[0]!, cuts[1]!], 'low-active': [cuts[1]!, cuts[2]!],
    active: [cuts[2]!, cuts[3]!], 'very-active': [cuts[3]!, cuts[4]!],
  };
}

export function validateAge(ageMonths: number): void {
  if (!Number.isFinite(ageMonths) || ageMonths < 0 || ageMonths >= 228) {
    throw new RangeError('Use an age from birth to before the 19th birthday.');
  }
}

export function validateSex(sex: Sex): void {
  if (sex !== 'male' && sex !== 'female') throw new RangeError('Select the sex used by the reference equations.');
}

function positive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be a finite number greater than zero.`);
}

// Intercept, age in years, height in cm, weight in kg. Published coefficients, no fitting.
const COEFFICIENTS: Record<Sex, Record<ActivityLevel, readonly [number, number, number, number]>> = {
  male: {
    inactive: [-447.51, 3.68, 13.01, 13.15],
    'low-active': [19.12, 3.68, 8.62, 20.28],
    active: [-388.19, 3.68, 12.66, 20.46],
    'very-active': [-671.75, 3.68, 15.38, 23.25],
  },
  female: {
    inactive: [55.59, -22.25, 8.43, 17.07],
    'low-active': [-297.54, -22.25, 12.77, 14.73],
    active: [-189.55, -22.25, 11.74, 18.34],
    'very-active': [-709.59, -22.25, 18.22, 14.25],
  },
};

function growthDeposition(ageMonths: number, sex: Sex): number {
  if (ageMonths < 3) return sex === 'male' ? 200 : 180;
  if (ageMonths < 6) return sex === 'male' ? 50 : 60;
  if (ageMonths < 12) return 20;
  if (ageMonths < 48) return sex === 'male' ? 20 : 15;
  if (ageMonths < 108) return 15;
  if (ageMonths < 168) return sex === 'male' ? 25 : 30;
  return 20;
}

// Display rounding never feeds back into calculation values.
const show = (number: number): string => Number(number.toFixed(8)).toString();

export function calculateEnergy(input: NutritionInput): NutritionEstimate {
  const { ageMonths, sex, weightKg, heightCm, activity } = input;
  validateAge(ageMonths);
  validateSex(sex);
  positive(weightKg, 'Weight');
  positive(heightCm, 'Height or length');
  if (activity !== undefined && !Object.hasOwn(ACTIVITY_LABELS, activity)) throw new RangeError('Select a valid activity category.');
  if (ageMonths >= 36 && activity === undefined) throw new RangeError('Select an activity category from age 3 years.');
  const ageYears = ageMonths / 12;
  const coeff = ageMonths < 36
    ? (sex === 'male' ? [-716.45, -1, 17.82, 15.06] : [-69.15, 80, 2.65, 54.15])
    : COEFFICIENTS[sex][activity!];
  const [intercept, ageCoefficient, heightCoefficient, weightCoefficient] = coeff as readonly [number, number, number, number];
  const deposition = growthDeposition(ageMonths, sex);
  const value = intercept + ageCoefficient * ageYears + heightCoefficient * heightCm + weightCoefficient * weightKg + deposition;
  positive(value, 'Calculated energy; check the entered measurements');
  const perKg = value / weightKg;
  positive(perKg, 'Calculated energy per kilogram; check the entered weight');
  const pal = ageMonths >= 36 ? getActivityRanges(ageMonths)![activity!] : null;
  return {
    value, perKg, unit: 'kcal/day', perKgUnit: 'kcal/kg/day',
    method: 'Health Canada 2023 estimated energy requirement', referenceType: 'EER',
    steps: [
      `Age: ${show(ageMonths)} months ÷ 12 = ${show(ageYears)} years.`,
      `Reference: ${sex}; ${ageMonths < 36 ? 'under 3 years, no activity category' : ACTIVITY_LABELS[activity!] + ' (PAL ' + pal![0] + ' to <' + pal![1] + ')'}.`,
      `EER = intercept + (age coefficient × years) + (height coefficient × cm) + (weight coefficient × kg) + growth energy.`,
      `${intercept} + (${ageCoefficient} × ${show(ageYears)}) + (${heightCoefficient} × ${heightCm}) + (${weightCoefficient} × ${weightKg}) + ${deposition} = ${show(value)} kcal/day.`,
      `${show(value)} ÷ ${weightKg} = ${show(value / weightKg)} kcal/kg/day.`,
    ],
    sources: [NUTRITION_SOURCES.energy],
    notes: ['Reference estimate for healthy children. Growth, weight change and the clinical picture guide individual energy needs.'],
  };
}

export function calculateProtein(ageMonths: number, weightKg: number): NutritionEstimate {
  validateAge(ageMonths);
  positive(weightKg, 'Weight');
  // Health Canada's current calculator selects the older-infant group at 7 months.
  // See docs/nutrition-validation.md for the conflicting NASEM infant convention.
  const perKg = ageMonths < 7 ? 1.52 : ageMonths < 12 ? 1.2 : ageMonths < 48 ? 1.05 : ageMonths < 168 ? 0.95 : 0.85;
  const band = ageMonths < 7 ? '0 to <7 months' : ageMonths < 12 ? '7 to <12 months'
    : ageMonths < 48 ? '1 to <4 years' : ageMonths < 108 ? '4 to <9 years' : ageMonths < 168 ? '9 to <14 years' : '14 to <19 years';
  const referenceType = ageMonths < 7 ? 'AI' : 'RDA';
  const value = perKg * weightKg;
  positive(value, 'Calculated protein');
  const notes = ['Uses the published g/kg/day reference with the entered weight; the table’s fixed g/day value uses a reference body weight. Clinical needs may differ.'];
  if (ageMonths >= 6 && ageMonths < 7) notes.push('At 6 to <7 months, this follows the current Health Canada calculator’s younger-infant protein group. The NASEM overview describes two six-month infant intervals; confirm the intended convention with the treating team.');
  return {
    value, perKg, unit: 'g/day', perKgUnit: 'g/kg/day', method: `Health Canada protein ${referenceType}`, referenceType,
    steps: [`Age group: ${band}; ${referenceType} = ${perKg} g/kg/day.`, `${perKg} g/kg/day × ${weightKg} kg = ${show(value)} g/day.`],
    sources: [NUTRITION_SOURCES.protein, NUTRITION_SOURCES.ageBands], notes,
  };
}

/** Daily 100/50/20 formula. This is not the hourly 4/2/1 approximation. */
export function calculateMaintenanceFluid(weightKg: number): NutritionEstimate {
  positive(weightKg, 'Weight');
  const first = Math.min(weightKg, 10);
  const second = Math.max(0, Math.min(weightKg - 10, 10));
  const rest = Math.max(0, weightKg - 20);
  const value = first * 100 + second * 50 + rest * 20;
  positive(value, 'Calculated fluid');
  const steps = [`First ${show(first)} kg × 100 mL/kg/day = ${show(first * 100)} mL/day.`];
  if (second > 0) steps.push(`Next ${show(second)} kg × 50 mL/kg/day = ${show(second * 50)} mL/day.`);
  if (rest > 0) steps.push(`Remaining ${show(rest)} kg × 20 mL/kg/day = ${show(rest * 20)} mL/day.`);
  steps.push(`Total = ${show(value)} mL/day; ${show(value)} ÷ ${weightKg} = ${show(value / weightKg)} mL/kg/day.`);
  return {
    value, perKg: value / weightKg, unit: 'mL/day', perKgUnit: 'mL/kg/day',
    method: 'Holliday-Segar daily maintenance estimate', referenceType: 'maintenance',
    steps, sources: [NUTRITION_SOURCES.fluid, NUTRITION_SOURCES.fluidReview],
    notes: ['Baseline maintenance arithmetic, not a fluid prescription or total-water DRI. Does not include deficit replacement, ongoing losses or disease-specific fluid restrictions. Neonates need a separate age-specific assessment.'],
  };
}

export function calculateNutrition(input: NutritionInput): NutritionResult {
  return { energy: calculateEnergy(input), protein: calculateProtein(input.ageMonths, input.weightKg), fluid: calculateMaintenanceFluid(input.weightKg) };
}
