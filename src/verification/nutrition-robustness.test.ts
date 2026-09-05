import { expect, it } from 'vitest';
import { calculateNutrition } from '../clinical/nutrition';

it('the combined nutrition API withholds a partial result when a derived value overflows', () => {
  expect(() => calculateNutrition({ ageMonths: 84, sex: 'male', heightCm: 122, weightKg: 1e-307, activity: 'active' })).toThrow(/per kilogram/);
});
