import { describe, expect, it } from 'vitest';
import { calculateEnergy, calculateMaintenanceFluid, calculateNutrition, calculateProtein, getActivityRanges, type ActivityLevel, type NutritionInput, type Sex } from './nutrition';

const child: NutritionInput = { ageMonths: 84, sex: 'male', weightKg: 25, heightCm: 122, activity: 'active' };

describe('Health Canada 2023 energy equations', () => {
  // Independently evaluated decimal arithmetic from each of the eight published equations.
  // All cases: age 7 years, height 122 cm, weight 25 kg; deposition = 15 kcal/day.
  it.each<[Sex, ActivityLevel, number]>([
    ['male', 'inactive', 1509.22], ['male', 'low-active', 1618.52],
    ['male', 'active', 1708.59], ['male', 'very-active', 1826.62],
    ['female', 'inactive', 1370.05], ['female', 'low-active', 1487.90],
    ['female', 'active', 1560.48], ['female', 'very-active', 1728.75],
  ])('%s / %s equation matches independently evaluated published coefficients', (sex, activity, expected) => {
    const result = calculateEnergy({ ...child, sex, activity });
    expect(result.value).toBeCloseTo(expected, 10);
    expect(result.perKg).toBeCloseTo(expected / 25, 10);
  });

  it.each([
    [{ ageMonths: 4, sex: 'female', weightKg: 5.5, heightCm: 62 }, 479.64166666666665],
    [{ ageMonths: 24, sex: 'male', weightKg: 12, heightCm: 86 }, 1014.79],
    [{ ageMonths: 168, sex: 'female', weightKg: 50, heightCm: 162, activity: 'low-active' }, 2216.2],
    [{ ageMonths: 204, sex: 'male', weightKg: 75, heightCm: 180, activity: 'very-active' }, 3922.96],
  ] as [NutritionInput, number][])('preserves unrounded energy for %o', (input, expected) => {
    expect(calculateEnergy(input).value).toBeCloseTo(expected, 10);
  });

  // Isolate deposition by subtracting the published base equation, then test both
  // sides of every age boundary. These explicit expected tables are not imported
  // from production coefficients or deposition logic.
  it.each<[Sex, number, number]>([
    ['male', 0, 200], ['male', 2.999999, 200], ['male', 3, 50],
    ['male', 5.999999, 50], ['male', 6, 20], ['male', 11.999999, 20], ['male', 12, 20], ['male', 35.999999, 20],
    ['female', 0, 180], ['female', 2.999999, 180], ['female', 3, 60],
    ['female', 5.999999, 60], ['female', 6, 20], ['female', 11.999999, 20], ['female', 12, 15], ['female', 35.999999, 15],
  ])('%s infant at %d months uses deposition %d', (sex, ageMonths, deposition) => {
    const value = calculateEnergy({ ageMonths, sex, weightKg: 12, heightCm: 86 }).value;
    const base = sex === 'male' ? -716.45 - ageMonths / 12 + 17.82 * 86 + 15.06 * 12
      : -69.15 + 80 * ageMonths / 12 + 2.65 * 86 + 54.15 * 12;
    expect(value - base).toBeCloseTo(deposition, 10);
  });

  it.each<[Sex, number, number]>([
    ['male', 36, 20], ['male', 47.999999, 20], ['male', 48, 15],
    ['male', 96.001, 15], ['male', 107.999999, 15], ['male', 108, 25],
    ['male', 167.999999, 25], ['male', 168, 20], ['male', 227.999999, 20],
    ['female', 36, 15], ['female', 47.999999, 15], ['female', 48, 15],
    ['female', 96.001, 15], ['female', 107.999999, 15], ['female', 108, 30],
    ['female', 167.999999, 30], ['female', 168, 20], ['female', 227.999999, 20],
  ])('%s child at %d months uses deposition %d', (sex, ageMonths, deposition) => {
    const value = calculateEnergy({ ...child, ageMonths, sex }).value;
    const base = sex === 'male' ? -388.19 + 3.68 * ageMonths / 12 + 12.66 * 122 + 20.46 * 25
      : -189.55 - 22.25 * ageMonths / 12 + 11.74 * 122 + 18.34 * 25;
    expect(value - base).toBeCloseTo(deposition, 10);
  });

  it('requires explicit activity at 3 years, uses all infant activity categories identically', () => {
    expect(() => calculateEnergy({ ...child, activity: undefined })).toThrow(/activity/);
    const infant = { ...child, ageMonths: 35.999, activity: undefined };
    expect(calculateEnergy(infant).value).toBe(calculateEnergy({ ...infant, activity: 'very-active' }).value);
    expect(() => calculateEnergy({ ...infant, ageMonths: 36 })).toThrow(/activity/);
  });

  it('returns readable substituted work and the primary reference', () => {
    const result = calculateNutrition(child);
    expect(result.energy.steps.join(' ')).toContain('12.66 × 122');
    expect(result.energy.steps.join(' ')).toContain('+ 15 =');
    expect(result.energy.sources[0]!.url).toContain('canada.ca');
    expect(result.protein.steps.join(' ')).toContain('0.95 g/kg/day × 25 kg');
    expect(result.fluid.steps.join(' ')).toContain('Remaining 5 kg × 20');
  });

  it('uses age-specific published PAL cutoffs, with no infant activity requirement', () => {
    expect(getActivityRanges(35.999)).toBeNull();
    expect(getActivityRanges(36)!.inactive).toEqual([1, 1.31]);
    expect(getActivityRanges(107.999)!.active).toEqual([1.44, 1.59]);
    expect(getActivityRanges(108)!['low-active']).toEqual([1.44, 1.59]);
    expect(getActivityRanges(168)!.active).toEqual([1.73, 1.92]);
  });
});

describe('protein age bands and daily maintenance fluid', () => {
  it.each([
    [0, 1.52, 'AI'], [5.999, 1.52, 'AI'], [6, 1.52, 'AI'], [6.999, 1.52, 'AI'],
    [7, 1.2, 'RDA'], [11.999, 1.2, 'RDA'], [12, 1.05, 'RDA'],
    [36, 1.05, 'RDA'], [47.999, 1.05, 'RDA'], [48, 0.95, 'RDA'],
    [108, 0.95, 'RDA'], [156, 0.95, 'RDA'], [167.999, 0.95, 'RDA'],
    [168, 0.85, 'RDA'], [216, 0.85, 'RDA'], [227.999, 0.85, 'RDA'],
  ])('%d months applies %d g/kg/day (%s)', (ageMonths, perKg, type) => {
    const result = calculateProtein(ageMonths as number, 10);
    expect(result.perKg).toBe(perKg);
    expect(result.value).toBeCloseTo((perKg as number) * 10, 12);
    expect(result.referenceType).toBe(type);
  });

  it('reports the unresolved infant convention at the affected age only', () => {
    expect(calculateProtein(6.5, 8).notes.join(' ')).toContain('two six-month');
    expect(calculateProtein(7, 8).notes.join(' ')).not.toContain('two six-month');
  });

  it.each([[1, 100], [5.5, 550], [9.99, 999], [10, 1000], [10.01, 1000.5], [12, 1100],
    [19.99, 1499.5], [20, 1500], [20.01, 1500.2], [25, 1600], [50, 2100], [75, 2600]])(
    '%d kg gives %d mL/day without hourly-rule rounding', (weight, expected) => {
      const result = calculateMaintenanceFluid(weight);
      expect(result.value).toBeCloseTo(expected, 10);
      expect(result.perKg).toBeCloseTo(expected / weight, 10);
    });
  it('does not claim a fluid prescription or total-water DRI', () => {
    expect(calculateMaintenanceFluid(5).notes.join(' ')).toMatch(/not a fluid prescription/);
    expect(calculateMaintenanceFluid(5).notes.join(' ')).toMatch(/Neonates/);
  });
});

describe('invalid clinical inputs fail explicitly', () => {
  it.each([-1, NaN, Infinity, -Infinity, 228, 300])('rejects age %s', (ageMonths) => {
    expect(() => calculateNutrition({ ...child, ageMonths })).toThrow(RangeError);
    expect(() => calculateProtein(ageMonths, 20)).toThrow(RangeError);
  });
  it.each([0, -1, NaN, Infinity, -Infinity])('rejects weight/length %s', (invalid) => {
    expect(() => calculateNutrition({ ...child, weightKg: invalid })).toThrow(RangeError);
    expect(() => calculateNutrition({ ...child, heightCm: invalid })).toThrow(RangeError);
    expect(() => calculateProtein(24, invalid)).toThrow(RangeError);
    expect(() => calculateMaintenanceFluid(invalid)).toThrow(RangeError);
  });
  it('rejects unknown categories, numeric strings, nonpositive predictions and overflow', () => {
    expect(() => calculateEnergy({ ...child, sex: 'other' as Sex })).toThrow(RangeError);
    expect(() => calculateEnergy({ ...child, activity: 'unknown' as ActivityLevel })).toThrow(RangeError);
    expect(() => calculateEnergy({ ...child, weightKg: '25' as unknown as number })).toThrow(RangeError);
    expect(() => calculateEnergy({ ...child, ageMonths: 2, heightCm: 1, weightKg: 1 })).toThrow(RangeError);
    expect(() => calculateProtein(2, Number.MAX_VALUE)).toThrow(RangeError);
    expect(() => calculateMaintenanceFluid(Number.MAX_VALUE)).toThrow(RangeError);
  });
  it('rejects division overflow even when total energy is finite', () => {
    expect(() => calculateEnergy({ ...child, weightKg: 1e-307 })).toThrow(/energy per kilogram/);
  });
});
