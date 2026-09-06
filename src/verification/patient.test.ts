import { describe, expect, it } from 'vitest';
import { blankPatient, patientAge, readNumber } from '../components/patient';
import { calculateGrowth } from '../clinical/growth';

describe('shared patient input semantics', () => {
  it('never assumes measurement posture and still supports weight-only growth', () => {
    expect(blankPatient().measurementType).toBe('');
    const result = calculateGrowth({ sex: 'male', dateOfBirth: '2019-02-11', measurementDate: '2026-02-11', weightKg: 25, heightCm: 122 });
    expect(result.results.find((item) => item.metric === 'weightForAge')?.status).toBe('ok');
    expect(result.results.find((item) => item.metric === 'heightForAge')?.status).toBe('invalid');
    expect(result.adjustedHeightCm).toBeUndefined();
  });
  it('distinguishes an empty age from a newborn age of zero', () => {
    expect(patientAge(blankPatient()).months).toBeUndefined();
    expect(patientAge({ ...blankPatient(), years: '0' }).months).toBe(0);
    expect(readNumber('')).toBeUndefined();
    expect(readNumber(' ')).toBeUndefined();
    expect(readNumber('0')).toBe(0);
    expect(readNumber('Infinity')).toBeUndefined();
  });

  it.each([
    ['2024-09-06', '2025-09-06', 12],
    ['2024-09-06', '2027-09-06', 36],
    ['2022-03-01', '2026-03-01', 48],
    ['2017-09-06', '2026-09-06', 108],
    ['2012-09-06', '2026-09-06', 168],
    ['2026-01-01', '2026-07-01', 6],
    ['2026-01-31', '2026-02-28', 1],
    ['2024-02-29', '2025-02-28', 12],
  ])('nutrition/DRI age switches at attained calendar birthdays: %s to %s', (dateOfBirth, measurementDate, months) => {
    const age = patientAge({ ...blankPatient(), ageMode: 'dates', dateOfBirth, measurementDate });
    expect(age.error).toBeUndefined();
    expect(age.months).toBe(months);
  });

  it('rejects malformed dates and dates in reverse order', () => {
    for (const [dateOfBirth, measurementDate] of [['2025-02-30', '2025-03-01'], ['2026-03-02', '2026-03-01']]) {
      expect(patientAge({ ...blankPatient(), ageMode: 'dates', dateOfBirth, measurementDate }).error).toBeTruthy();
    }
  });

  it('rejects fractional or out-of-range additional months', () => {
    for (const months of ['12', '-1', '0.5']) {
      expect(patientAge({ ...blankPatient(), years: '2', months }).error).toBeTruthy();
    }
  });

  it('never treats an unfinished numeric age component as a blank zero', () => {
    for (const years of ['-', '1e', '1e2', '0x10', '.', '1.5']) {
      expect(patientAge({ ...blankPatient(), years, months: '6' }).error).toBeTruthy();
    }
    expect(patientAge({ ...blankPatient(), years: '1', months: '-' }).months).toBeUndefined();
  });
});
