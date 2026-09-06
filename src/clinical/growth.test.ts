import { describe, expect, it } from 'vitest'
import {
  calculateAge, calculateGrowth, calculateGrowthAtAge, getGrowthChart, lmsZScore, lmsValue,
  normalCDF, WHO_DAYS_PER_MONTH, whoReferenceValue, whoZScore,
  type GrowthAtAgeInput, type GrowthMetric, type GrowthSex,
} from './growth'
import under5 from './data/growth/who-under5-fixtures.json'
import older from './data/growth/who2007-fixtures.json'
import weight from './data/growth/weianthro.json'
import wfl from './data/growth/wflanthro.json'
import wfh from './data/growth/wfhanthro.json'
import cdfFixture from './data/growth/normal-cdf-fixtures.json'

const find = (input: GrowthAtAgeInput, metric: GrowthMetric) => calculateGrowthAtAge(input).results.find(result => result.metric === metric)!
const base: GrowthAtAgeInput = { sex: 'male', ageDays: 123, weightKg: 5, heightCm: 60, measurementType: 'length', headCircumferenceCm: 40 }

describe('WHO official reference implementation, independently executed in R', () => {
  it(`matches ${under5.fixtures.length} cases and all five metrics from unmodified WHO anthro`, () => {
    let compared = 0
    for (const fixture of under5.fixtures) {
      const actual = calculateGrowthAtAge(fixture.input as GrowthAtAgeInput)
      expect(actual.adjustedHeightCm).toBeCloseTo(fixture.adjustedHeightCm, 11)
      expect(actual.bmi).toBeCloseTo(fixture.bmi, 11)
      for (const result of actual.results) {
        const expected = fixture.expected[result.metric]
        const context = JSON.stringify({ input: fixture.input, metric: result.metric, expected, actual: result.zScore })
        if (expected === null) expect(result.status, context).not.toBe('ok')
        else {
          expect(result.status, context).toBe('ok')
          // WHO public API rounds to 2 decimals. Compare at that resolution.
          expect(Number(result.zScore!.toFixed(2)) || 0, context).toBe(expected)
          expect(Number(result.flagged), context).toBe(fixture.flags[result.metric])
          compared++
        }
      }
    }
    expect(compared).toBeGreaterThan(1300)
  })

  it(`matches the WHO-published ${older.length}-case AnthroPlus reference dataset`, () => {
    let compared = 0
    for (const fixture of older) {
      const input: GrowthAtAgeInput = {
        sex: fixture.sex as GrowthSex, ageDays: fixture.ageMonths * WHO_DAYS_PER_MONTH,
        weightKg: fixture.weightKg ?? undefined, heightCm: fixture.heightCm ?? undefined,
        measurementType: 'height', oedema: fixture.oedema,
      }
      const actual = calculateGrowthAtAge(input)
      for (const metric of ['weightForAge', 'heightForAge', 'bmiForAge'] as const) {
        const result = actual.results.find(item => item.metric === metric)!
        const expected = fixture.expected[metric]
        const context = `WHO fixture ${fixture.id}, ${metric}: expected ${expected}, actual ${result.zScore}`
        if (expected === null) expect(result.status, context).not.toBe('ok')
        else {
          expect(result.status, context).toBe('ok')
          expect(Number(result.zScore!.toFixed(2)) || 0, context).toBe(expected)
          compared++
        }
      }
    }
    expect(compared).toBeGreaterThan(1900)
  })

  it('matches the official AnthroPlus regression for the old 60-to-61-month gap', () => {
    const cases = [
      { age: 60.32, weight: 18.7, height: 113.8, wfa: 0.21, bmi: -0.58, hfa: 0.96 },
      { age: 60.911701, weight: 20.5, height: 113.6, wfa: 0.79, bmi: 0.42, hfa: 0.85 },
    ]
    for (const fixture of cases) {
      const input: GrowthAtAgeInput = { sex: 'female', ageDays: fixture.age * WHO_DAYS_PER_MONTH, weightKg: fixture.weight, heightCm: fixture.height, measurementType: 'height' }
      for (const [metric, expected] of [['weightForAge', fixture.wfa], ['bmiForAge', fixture.bmi], ['heightForAge', fixture.hfa]] as const) {
        expect(find(input, metric).zScore).toBeCloseTo(expected, 2)
      }
    }
  })
})

describe('calendar dates and reference age', () => {
  it('uses exact elapsed calendar days for the inherited AnthroCalc case', () => {
    const age = calculateAge('2025-10-11', '2026-02-11')
    expect(age.days).toBe(123)
    expect(age.months).toBeCloseTo(4.0410677618069815, 12)
    expect(age.completedYears).toBe(0)
    expect(age.completedMonths).toBe(4)
    const result = calculateGrowth({ ...base, dateOfBirth: '2025-10-11', measurementDate: '2026-02-11' }).results.find(metric => metric.metric === 'weightForAge')!
    expect(result.zScore).toBeCloseTo(-2.930912645903303, 12)
    expect(result.percentile).toBeCloseTo(0.16898390116251372, 12)
  })
  it('matches unmodified WHO R for the five-year birthday screenshot near two rounding boundaries', () => {
    // Independently executed WHO anthro_zscores and R pnorm, not AnthroCalc's display.
    // Reproduction and source hashes: artifacts/anthrocalc-five-year/who-r-result.json.
    const calculation = calculateGrowth({
      sex: 'female', dateOfBirth: '2021-09-05', measurementDate: '2026-09-05',
      weightKg: 25, heightCm: 120, measurementType: 'height',
    })
    expect(calculation.age!.days).toBe(1826)
    expect(calculation.age!.months).toBeCloseTo(59.9917864476386, 12)
    expect(calculation.age!.completedYears).toBe(5)
    expect(calculation.adjustedHeightCm).toBe(120)
    expect(calculation.bmi).toBeCloseTo(17.36111111111111, 12)
    const expected = [
      ['heightForAge', 2.225095996886071, 98.69626027835358, '2.23', '98.7'],
      ['weightForAge', 2.0207145473147334, 97.83453384763192, '2.02', '97.8'],
      ['bmiForAge', 1.2614870540516514, 89.64332893240542, '1.26', '89.6'],
    ] as const
    for (const [metric, z, percentile, displayedZ, displayedPercentile] of expected) {
      const result = calculation.results.find(item => item.metric === metric)!
      expect(result.status).toBe('ok')
      expect(result.source!.title).toContain('daily LMS')
      expect(result.zScore).toBeCloseTo(z, 12)
      expect(result.percentile).toBeCloseTo(percentile, 12)
      expect(result.zScore!.toFixed(2)).toBe(displayedZ)
      expect(result.percentile!.toFixed(1)).toBe(displayedPercentile)
    }
  })
  it('handles leap days, month ends and same-day birth', () => {
    expect(calculateAge('2024-02-28', '2024-03-01').days).toBe(2)
    expect(calculateAge('2023-02-28', '2023-03-01').days).toBe(1)
    expect(calculateAge('2024-02-29', '2025-02-28').completedYears).toBe(1)
    expect(calculateAge('2026-01-31', '2026-02-28').completedMonths).toBe(1)
    expect(calculateAge('2026-09-05', '2026-09-05').days).toBe(0)
  })
  it('counts days correctly across daylight-saving transitions', () => {
    expect(calculateAge('2026-03-07', '2026-03-09').days).toBe(2)
    expect(calculateAge('2025-11-01', '2025-11-03').days).toBe(2)
  })
  it.each([
    ['2025-02-29', '2026-01-01'], ['2026-04-31', '2026-06-01'],
    ['2026-13-01', '2026-01-01'], ['', '2026-01-01'],
    ['2026-01-02', '2026-01-01'], ['2026-1-1', '2026-01-02'],
  ])('rejects invalid dates %s / %s without calculating', (birth, measured) => {
    expect(() => calculateAge(birth, measured)).toThrow()
    const result = calculateGrowth({ ...base, dateOfBirth: birth, measurementDate: measured })
    expect(result.age).toBeNull()
    expect(result.results.every(metric => metric.status !== 'ok')).toBe(true)
  })
})

describe('mathematical anchors independent of application tables', () => {
  // Expected CDF numbers from Python math.erfc, independently verified by parent.
  it.each([
    [-3, 0.0013498980316300957], [-2.93, 0.0016948100192772637],
    [-2, 0.02275013194817922], [-1, 0.15865525393145707], [0, 0.5],
    [1, 0.8413447460685429], [2, 0.9772498680518208], [3, 0.9986501019683699],
  ])('normal CDF(%s) agrees with independent normal probabilities', (z, expected) => {
    expect(Math.abs(normalCDF(z) - expected)).toBeLessThan(3e-15)
  })
  it(`matches ${cdfFixture.values.length} independent erfc probabilities across both numerical branches`, () => {
    for (const [z, expected] of cdfFixture.values) {
      const actual = normalCDF(z)
      expect(Math.abs(actual - expected), `CDF(${z}) absolute error`).toBeLessThan(3e-15)
      // A small absolute error alone could hide the old far-tail clamping bug.
      if (z < -3 && z > -38) expect(Math.abs(actual / expected - 1), `CDF(${z}) relative tail error`).toBeLessThan(1e-12)
    }
  })
  it('has correct tails, symmetry, NaN and infinity behavior', () => {
    expect(normalCDF(0)).toBe(0.5)
    expect(normalCDF(-10)).toBeGreaterThan(0)
    expect(normalCDF(-Infinity)).toBe(0)
    expect(normalCDF(Infinity)).toBe(1)
    expect(normalCDF(NaN)).toBeNaN()
    expect(normalCDF(-2.4) + normalCDF(2.4)).toBe(1)
  })
  it('supports L=0 exactly and smoothly near zero', () => {
    const expected = Math.log(1.2) / 0.1
    expect(lmsZScore(12, { l: 0, m: 10, s: 0.1 })).toBe(expected)
    expect(lmsZScore(12, { l: 1e-12, m: 10, s: 0.1 })).toBeCloseTo(expected, 10)
    expect(lmsValue(expected, { l: 0, m: 10, s: 0.1 })).toBeCloseTo(12, 12)
  })
  it('applies WHO extended tails to skewed weight metrics only', () => {
    const lms = { l: -0.3, m: 10, s: 0.1 }
    for (const z of [-5, -3.1, -3, 0, 3, 3.1, 5]) {
      const value = whoReferenceValue(z, lms, true)!
      expect(whoZScore(value, lms, true)).toBeCloseTo(z, 12)
      if (Math.abs(z) > 3) expect(Math.abs(lmsZScore(value, lms) - z)).toBeGreaterThan(0.001)
    }
    expect(whoZScore(20, lms, false)).toBe(lmsZScore(20, lms))
  })
  it('does not extrapolate inverse LMS outside its mathematical domain', () => {
    expect(lmsValue(20, { l: -1, m: 10, s: 0.1 })).toBeNull()
    expect(lmsZScore(0, { l: 1, m: 10, s: 0.1 })).toBeNaN()
  })
})

describe('measurement conventions and clinical boundaries', () => {
  it('uses daily WHO medians, including neonatal days, for both sexes', () => {
    for (const sex of ['male', 'female'] as const) {
      for (const day of [0, 1, 2, 7, 30, 123, 730, 731, 1826]) {
        const row = weight[sex][day]
        expect(row[0]).toBe(day)
        expect(find({ ...base, sex, ageDays: day, weightKg: row[2] }, 'weightForAge').zScore).toBe(0)
      }
    }
  })
  it('adds 0.7 cm below 731 days and subtracts 0.7 cm from that day', () => {
    expect(calculateGrowthAtAge({ ...base, ageDays: 730, heightCm: 80, measurementType: 'height' }).adjustedHeightCm).toBe(80.7)
    expect(calculateGrowthAtAge({ ...base, ageDays: 731, heightCm: 80, measurementType: 'length' }).adjustedHeightCm).toBe(79.3)
    expect(calculateGrowthAtAge({ ...base, ageDays: 731, heightCm: 80, measurementType: 'height' }).adjustedHeightCm).toBe(80)
    // Decimal WHO months are converted to days and rounded up at .5 in anthro.
    expect(calculateGrowthAtAge({ ...base, ageDays: 24 * WHO_DAYS_PER_MONTH, heightCm: 80, measurementType: 'length' }).adjustedHeightCm).toBe(79.3)
  })
  it('requires recumbent length below 9 months rather than silently imputing posture', () => {
    const result = calculateGrowthAtAge({ ...base, ageDays: 200, measurementType: 'height' })
    expect(result.results.find(metric => metric.metric === 'heightForAge')!.status).toBe('invalid')
    expect(result.results.find(metric => metric.metric === 'weightForAge')!.status).toBe('ok')
    expect(result.errors[0]).toContain('below 9 months')
  })
  it('uses separate WFL and WFH tables including their exact endpoints', () => {
    for (const sex of ['male', 'female'] as const) {
      for (const [ageDays, table] of [[100, wfl], [1000, wfh]] as const) {
        for (const row of [table[sex][0], table[sex].at(-1)!]) {
          const result = find({ ...base, sex, ageDays, measurementType: ageDays < 731 ? 'length' : 'height', heightCm: row[0], weightKg: row[2] }, 'weightForLengthHeight')
          expect(result.status).toBe('ok')
          expect(result.zScore).toBe(0)
        }
      }
    }
  })
  it.each([[100, 44.99], [100, 110.01], [1000, 64.99], [1000, 120.01]])('does not clamp age %s, length/height %s outside WHO range', (ageDays, heightCm) => {
    const input: GrowthAtAgeInput = { ...base, ageDays, heightCm, measurementType: ageDays < 731 ? 'length' : 'height' }
    expect(find(input, 'weightForLengthHeight').status).toBe('unavailable')
    expect(find(input, 'weightForAge').status).toBe('ok')
  })
  it('switches directly to actual WHO 2007 rows at 60 months without a gap', () => {
    for (const ageMonths of [59.99, 60, 60.001, 60.5, 60.999, 61]) {
      const result = find({ ...base, ageDays: ageMonths * WHO_DAYS_PER_MONTH, heightCm: 110, weightKg: 18, measurementType: 'height' }, 'weightForAge')
      expect(result.status).toBe('ok')
      expect(result.source!.title.includes('Reference 2007')).toBe(ageMonths >= 60)
    }
  })
  it('enforces exclusive WHO upper boundaries with no extrapolation', () => {
    for (const [metric, limit] of [['weightForAge', 121], ['heightForAge', 229], ['bmiForAge', 229], ['headCircumferenceForAge', 60], ['weightForLengthHeight', 60]] as const) {
      const at = { ...base, heightCm: 100, measurementType: 'height' as const, ageDays: limit * WHO_DAYS_PER_MONTH }
      expect(find(at, metric).status).toBe('unavailable')
      expect(find({ ...at, ageDays: (limit - 0.01) * WHO_DAYS_PER_MONTH }, metric).status).toBe('ok')
    }
  })
  it('preserves height and head results when oedema suppresses weight indicators', () => {
    const result = calculateGrowthAtAge({ ...base, oedema: true })
    for (const metric of result.results) expect(metric.status).toBe(['heightForAge', 'headCircumferenceForAge'].includes(metric.metric) ? 'ok' : 'unavailable')
  })
  it('flags extreme values instead of presenting them as ordinary results', () => {
    const result = find({ ...base, weightKg: 50 }, 'weightForAge')
    expect(result.status).toBe('ok')
    expect(result.flagged).toBe(true)
    expect(result.reason).toContain('Confirm')
  })
  it.each([0, -1, NaN, Infinity])('rejects non-positive/non-finite weight %s independently of height', weightKg => {
    expect(find({ ...base, weightKg }, 'weightForAge').status).toBe('invalid')
    expect(find({ ...base, weightKg }, 'heightForAge').status).toBe('ok')
  })
  it('allows weight for age without unrelated measurements', () => {
    const result = calculateGrowthAtAge({ sex: 'male', ageDays: 123, weightKg: 5, measurementType: 'length' })
    expect(result.results.find(metric => metric.metric === 'weightForAge')!.status).toBe('ok')
    expect(result.bmi).toBeUndefined()
  })
  it.each([1e-200, 1e200])('withholds BMI overflow/underflow for finite height %s', heightCm => {
    const result = calculateGrowthAtAge({ ...base, heightCm })
    expect(result.bmi).toBeUndefined()
    expect(result.results.find(metric => metric.metric === 'bmiForAge')!.status).toBe('invalid')
    expect(result.results.find(metric => metric.metric === 'weightForAge')!.status).toBe('ok')
  })
})

describe('growth chart uses the calculation reference, with honest limits', () => {
  it.each([123, 1000, 2000, 6500])('child and same-z comparison agree at day %s', ageDays => {
    const input = { ...base, ageDays, weightKg: ageDays < 1000 ? 5 : 25, heightCm: ageDays < 1000 ? 65 : 130, measurementType: ageDays < 731 ? 'length' as const : 'height' as const }
    for (const metric of ['weightForAge', 'heightForAge', 'bmiForAge'] as const) {
      const result = find(input, metric)
      const chart = getGrowthChart({ metric, sex: input.sex, ageDays, measurement: result.value, zScore: result.zScore })
      if (result.status !== 'ok') expect(chart).toBeNull()
      else {
        expect(chart!.source).toEqual(result.source)
        expect(chart!.childPoint!.x).toBeCloseTo(ageDays / WHO_DAYS_PER_MONTH, 12)
        expect(chart!.childPoint!.y).toBe(result.value)
        if (!result.flagged) expect(chart!.trackingCurve[0].y).toBeCloseTo(result.value!, 10)
        expect(chart!.curves.map(curve => curve.zScore)).toEqual([-3, -2, -1, 0, 1, 2, 3])
      }
    }
  })
  it('does not connect posture/reference jumps or extend the comparison outside valid data', () => {
    const infant = getGrowthChart({ metric: 'heightForAge', sex: 'male', ageDays: 123, zScore: 0 })!
    const child = getGrowthChart({ metric: 'heightForAge', sex: 'male', ageDays: 1000, zScore: 0 })!
    const olderChild = getGrowthChart({ metric: 'heightForAge', sex: 'male', ageDays: 2000, zScore: 0 })!
    expect(infant.curves[0].points.at(-1)!.x).toBe(730 / WHO_DAYS_PER_MONTH)
    expect(child.curves[0].points[0].x).toBe(731 / WHO_DAYS_PER_MONTH)
    expect(child.curves[0].points.at(-1)!.x).toBeLessThan(60)
    expect(olderChild.curves[0].points[0].x).toBe(60)
    expect(olderChild.curves[0].points.at(-1)!.x).toBeLessThan(229)
    expect(infant.notes.join(' ')).toContain('does not predict')
  })
  it('plots WFL/H against stature, with the exact converted measurement point', () => {
    const input = { ...base, ageDays: 500, measurementType: 'height' as const, heightCm: 70, weightKg: 9 }
    const result = calculateGrowthAtAge(input)
    const wflResult = result.results.find(item => item.metric === 'weightForLengthHeight')!
    const chart = getGrowthChart({ metric: wflResult.metric, sex: 'male', ageDays: 500, childX: result.adjustedHeightCm, measurement: 9, zScore: wflResult.zScore })!
    expect(chart.childPoint).toEqual({ x: 70.7, y: 9 })
    expect(chart.trackingCurve[0].y).toBeCloseTo(9, 11)
    expect(chart.xLabel).toBe('Length (cm)')
  })
  it('does not draw a same-z comparison for flagged extremes', () => {
    const chart = getGrowthChart({ metric: 'weightForAge', sex: 'male', ageDays: 123, zScore: 8, measurement: 30 })!
    expect(chart.trackingCurve).toEqual([])
    expect(chart.childPoint).toEqual({ x: 123 / WHO_DAYS_PER_MONTH, y: 30 })
  })
})
