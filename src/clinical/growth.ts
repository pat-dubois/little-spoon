// SPDX-License-Identifier: GPL-3.0-only
// WHO LMS method and reference behavior: see data/growth/WHO-LICENSE.txt and sources.json.
import weightUnder5 from './data/growth/weianthro.json'
import heightUnder5 from './data/growth/lenanthro.json'
import bmiUnder5 from './data/growth/bmianthro.json'
import headUnder5 from './data/growth/hcanthro.json'
import weightLength from './data/growth/wflanthro.json'
import weightHeight from './data/growth/wfhanthro.json'
import weightOlder from './data/growth/wfawho2007.json'
import heightOlder from './data/growth/hfawho2007.json'
import bmiOlder from './data/growth/bfawho2007.json'

export type GrowthSex = 'male' | 'female'
export type GrowthMetric = 'weightForAge' | 'heightForAge' | 'bmiForAge' | 'weightForLengthHeight' | 'headCircumferenceForAge'
export type MeasurementType = 'length' | 'height'
export interface GrowthSource { title: string; url: string }
export interface LMS { l: number; m: number; s: number }
export interface GrowthAge {
  days: number
  /** WHO reference age: elapsed calendar days / 30.4375, not completed calendar months. */
  months: number
  years: number
  completedYears: number
  /** Remaining completed calendar months after completedYears. */
  completedMonths: number
}
export interface GrowthInput {
  sex: GrowthSex
  dateOfBirth: string
  measurementDate: string
  weightKg?: number
  heightCm?: number
  /** Required for height-dependent results; weight/head-only inputs may omit it. */
  measurementType?: MeasurementType
  headCircumferenceCm?: number
  oedema?: boolean
}
export interface GrowthResult {
  metric: GrowthMetric
  label: string
  unit: string
  status: 'ok' | 'unavailable' | 'invalid'
  value?: number
  zScore?: number
  percentile?: number
  /** WHO data-quality flag, not a diagnosis or a colour-coded normal range. */
  flagged?: boolean
  reason?: string
  source?: GrowthSource
  steps: string[]
  lms?: LMS
}
export interface GrowthCalculation {
  age: GrowthAge | null
  results: GrowthResult[]
  errors: string[]
  notes: string[]
  adjustedHeightCm?: number
  bmi?: number
}
export interface GrowthAtAgeInput extends Omit<GrowthInput, 'dateOfBirth' | 'measurementDate'> {
  /** Exact days; fractional values are useful for independently supplied reference ages. */
  ageDays: number
}
export interface ChartPoint { x: number; y: number }
export interface GrowthChart {
  xLabel: string
  yLabel: string
  source: GrowthSource
  curves: { zScore: number; points: ChartPoint[] }[]
  childPoint?: ChartPoint
  trackingCurve: ChartPoint[]
  notes: string[]
}
export const WHO_DAYS_PER_MONTH = 30.4375
export const WHO_UNDER5_SOURCE: GrowthSource = {
  title: 'WHO Child Growth Standards (2006/2007), daily LMS tables',
  url: 'https://www.who.int/tools/child-growth-standards',
}
export const WHO_2007_SOURCE: GrowthSource = {
  title: 'WHO Growth Reference 2007, interpolated monthly LMS tables',
  url: 'https://www.who.int/tools/growth-reference-data-for-5to19-years',
}

const DAY_MS = 86_400_000
type Table = { male: number[][]; female: number[][] }
const METRICS: GrowthMetric[] = ['weightForAge', 'heightForAge', 'bmiForAge', 'weightForLengthHeight', 'headCircumferenceForAge']
const UNITS: Record<GrowthMetric, string> = {
  weightForAge: 'kg', heightForAge: 'cm', bmiForAge: 'kg/m²', weightForLengthHeight: 'kg', headCircumferenceForAge: 'cm',
}

function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Enter complete birth and measurement dates.')
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1000 || year > 9999) throw new Error('Enter a valid four-digit year.')
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error('Enter valid calendar dates.')
  }
  return date
}

/** Calendar-date subtraction in UTC prevents daylight-saving/time-zone age errors. */
export function calculateAge(dateOfBirth: string, measurementDate: string): GrowthAge {
  const birth = parseDateOnly(dateOfBirth)
  const measured = parseDateOnly(measurementDate)
  const days = (measured.getTime() - birth.getTime()) / DAY_MS
  if (days < 0) throw new Error('Measurement date must be on or after the date of birth.')
  let totalMonths = (measured.getUTCFullYear() - birth.getUTCFullYear()) * 12 + measured.getUTCMonth() - birth.getUTCMonth()
  const lastDay = new Date(Date.UTC(measured.getUTCFullYear(), measured.getUTCMonth() + 1, 0)).getUTCDate()
  if (measured.getUTCDate() < Math.min(birth.getUTCDate(), lastDay)) totalMonths--
  return {
    days, months: days / WHO_DAYS_PER_MONTH, years: days / 365.25,
    completedYears: Math.floor(totalMonths / 12), completedMonths: totalMonths % 12,
  }
}

/** Numerically stable LMS formula, including the exact L=0 logarithmic limit. */
export function lmsZScore(value: number, { l, m, s }: LMS): number {
  if (![value, l, m, s].every(Number.isFinite) || value <= 0 || m <= 0 || s <= 0) return NaN
  const logRatio = Math.log(value / m)
  return l === 0 ? logRatio / s : Math.expm1(l * logRatio) / (l * s)
}

/** Inverse LMS; null means that requested tail falls outside the mathematical domain. */
export function lmsValue(zScore: number, { l, m, s }: LMS): number | null {
  if (![zScore, l, m, s].every(Number.isFinite) || m <= 0 || s <= 0) return null
  if (l === 0) return m * Math.exp(s * zScore)
  if (1 + l * s * zScore <= 0) return null
  return m * Math.exp(Math.log1p(l * s * zScore) / l)
}

/** WHO restricts skewed weight/BMI tails to the distance between 2 and 3 SD. */
export function whoZScore(value: number, lms: LMS, adjustExtreme: boolean): number {
  const raw = lmsZScore(value, lms)
  if (!adjustExtreme || Math.abs(raw) <= 3 || !Number.isFinite(raw)) return raw
  const sign = Math.sign(raw)
  const at3 = lmsValue(sign * 3, lms)
  const at2 = lmsValue(sign * 2, lms)
  if (at3 === null || at2 === null) return NaN
  return sign * 3 + (value - at3) / Math.abs(at3 - at2)
}

export function whoReferenceValue(zScore: number, lms: LMS, adjustExtreme: boolean): number | null {
  if (!adjustExtreme || Math.abs(zScore) <= 3) return lmsValue(zScore, lms)
  const sign = Math.sign(zScore)
  const at3 = lmsValue(sign * 3, lms)
  const at2 = lmsValue(sign * 2, lms)
  if (at3 === null || at2 === null) return null
  const value = at3 + (zScore - sign * 3) * Math.abs(at3 - at2)
  return value > 0 ? value : null
}

/** Standard normal CDF from Q(1/2, z²/2) = erfc(|z|/sqrt(2)).
 * NIST DLMF 8.7.1 (series) and 8.9.2 (continued fraction). The small tail is
 * computed directly; the legacy erf approximation used the wrong argument.
 * Verified against independent Python erfc probabilities, including both tails.
 */
export function normalCDF(z: number): number {
  if (Number.isNaN(z)) return NaN
  if (z === 0) return 0.5
  if (z === Infinity) return 1
  if (z === -Infinity) return 0
  if (Math.abs(z) > 40) return z < 0 ? 0 : 1
  const x = z * z / 2
  const scale = Math.exp(-x + 0.5 * Math.log(x) - 0.5 * Math.log(Math.PI))
  let q: number
  if (x < 1.5) {
    let term = 2
    let sum = term
    for (let n = 1; n < 100; n++) {
      term *= x / (n + 0.5)
      sum += term
      if (Math.abs(term) < Math.abs(sum) * Number.EPSILON) break
    }
    q = 1 - scale * sum
  } else {
    // Modified Lentz evaluation of the upper incomplete-gamma fraction.
    const tiny = 1e-300
    let b = x + 0.5
    let c = 1 / tiny
    let d = 1 / b
    let fraction = d
    for (let n = 1; n < 300; n++) {
      const numerator = -n * (n - 0.5)
      b += 2
      d = numerator * d + b
      if (Math.abs(d) < tiny) d = tiny
      c = b + numerator / c
      if (Math.abs(c) < tiny) c = tiny
      d = 1 / d
      const delta = d * c
      fraction *= delta
      if (Math.abs(delta - 1) < 4 * Number.EPSILON) break
    }
    q = scale * fraction
  }
  const tail = q / 2
  return z < 0 ? tail : 1 - tail
}

/** Linear interpolation strictly within a table's range; never clamp/extrapolate. */
function interpolate(table: Table, sex: GrowthSex, x: number): LMS | null {
  const rows = table[sex]
  if (!rows || !Number.isFinite(x) || x < rows[0][0] || x > rows[rows.length - 1][0]) return null
  let low = 0
  let high = rows.length - 1
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (rows[mid][0] < x) low = mid + 1
    else high = mid
  }
  const upper = rows[low]
  if (upper[0] === x || low === 0) return { l: upper[1], m: upper[2], s: upper[3] }
  const lower = rows[low - 1]
  const fraction = (x - lower[0]) / (upper[0] - lower[0])
  return {
    l: lower[1] + fraction * (upper[1] - lower[1]),
    m: lower[2] + fraction * (upper[2] - lower[2]),
    s: lower[3] + fraction * (upper[3] - lower[3]),
  }
}

function labelFor(metric: GrowthMetric, ageDays: number): string {
  ageDays = Math.floor(ageDays + 0.5)
  switch (metric) {
    case 'weightForAge': return 'Weight for age'
    case 'heightForAge': return ageDays < 731 ? 'Length for age' : 'Height for age'
    case 'bmiForAge': return 'BMI for age'
    case 'weightForLengthHeight': return ageDays < 731 ? 'Weight for length' : 'Weight for height'
    case 'headCircumferenceForAge': return 'Head circumference for age'
  }
}

interface Reference { lms: LMS; source: GrowthSource; key: number; keyUnit: string; adjustExtreme: boolean }
function getReference(metric: GrowthMetric, sex: GrowthSex, ageDays: number, heightCm?: number): Reference | null {
  if (!Number.isFinite(ageDays) || ageDays < 0 || !['male', 'female'].includes(sex)) return null
  const months = ageDays / WHO_DAYS_PER_MONTH
  const under5 = months < 60
  const adjustExtreme = ['weightForAge', 'bmiForAge', 'weightForLengthHeight'].includes(metric)
  let table: Table
  let key: number
  let keyUnit: string
  if (metric === 'weightForLengthHeight') {
    if (!under5 || heightCm === undefined) return null
    table = Math.floor(ageDays + 0.5) < 731 ? weightLength : weightHeight
    key = heightCm
    keyUnit = 'cm'
  } else if (under5) {
    table = ({ weightForAge: weightUnder5, heightForAge: heightUnder5, bmiForAge: bmiUnder5, headCircumferenceForAge: headUnder5 })[metric]
    key = Math.floor(ageDays + 0.5) // WHO rounding for ages supplied as decimal months.
    keyUnit = 'days'
  } else {
    if (metric === 'headCircumferenceForAge' || (metric === 'weightForAge' ? months >= 121 : months >= 229)) return null
    table = ({ weightForAge: weightOlder, heightForAge: heightOlder, bmiForAge: bmiOlder })[metric]
    key = months
    keyUnit = 'months'
  }
  const lms = interpolate(table, sex, key)
  return lms ? { lms, source: under5 ? WHO_UNDER5_SOURCE : WHO_2007_SOURCE, key, keyUnit, adjustExtreme } : null
}

function rangeReason(metric: GrowthMetric, ageDays: number): string {
  if (metric === 'weightForLengthHeight') return ageDays / WHO_DAYS_PER_MONTH >= 60
    ? 'WHO weight for length/height is available below 60 months. Use BMI for age for older children.'
    : Math.floor(ageDays + 0.5) < 731 ? 'WHO weight for length requires an adjusted length from 45 to 110 cm.' : 'WHO weight for height requires an adjusted height from 65 to 120 cm.'
  if (metric === 'headCircumferenceForAge') return 'WHO head circumference for age is available below 60 months.'
  if (metric === 'weightForAge') return 'WHO weight for age is available below 121 months (through month 120, or 10 years 0 months). It is not used through adolescence.'
  return 'WHO height and BMI for age are available below 229 months (through month 228, or 19 years 0 months).'
}

function missingOrInvalid(value: number | undefined, label: string): { status: 'unavailable' | 'invalid'; reason: string } | null {
  if (value === undefined) return { status: 'unavailable', reason: `Enter ${label}.` }
  if (!Number.isFinite(value) || value <= 0) return { status: 'invalid', reason: `${label[0].toUpperCase() + label.slice(1)} must be a finite number greater than zero.` }
  return null
}

function isFlagged(metric: GrowthMetric, z: number): boolean {
  // WHO flags are applied to displayed, two-decimal z-scores.
  const rounded = Math.round(z * 100) / 100
  return metric === 'weightForAge' ? rounded < -6 || rounded > 5 : Math.abs(rounded) > (metric === 'heightForAge' ? 6 : 5)
}

/** Low-level entry used by independently supplied WHO test datasets. */
export function calculateGrowthAtAge(input: GrowthAtAgeInput): Omit<GrowthCalculation, 'age'> {
  const { ageDays, sex, weightKg, heightCm, headCircumferenceCm, measurementType, oedema } = input
  const months = ageDays / WHO_DAYS_PER_MONTH
  const roundedDays = Math.floor(ageDays + 0.5)
  const notes: string[] = []
  const errors: string[] = []
  let heightIssue = missingOrInvalid(heightCm, 'height or length in cm')
  const weightIssue = missingOrInvalid(weightKg, 'weight in kg')
  const headIssue = missingOrInvalid(headCircumferenceCm, 'head circumference in cm')
  if (!heightIssue && measurementType !== 'height' && measurementType !== 'length') heightIssue = { status: 'invalid', reason: 'Choose how height or length was measured.' }
  if (measurementType === 'height' && months < 9 && !heightIssue) {
    heightIssue = { status: 'invalid', reason: 'Standing height is not appropriate below 9 months. Confirm a recumbent length measurement.' }
  }
  let adjustedHeightCm = heightIssue ? undefined : heightCm
  if (adjustedHeightCm !== undefined && roundedDays < 731 && measurementType === 'height') {
    adjustedHeightCm += 0.7
    notes.push('Standing height converted to recumbent length: add 0.7 cm for WHO age below 731 days.')
  } else if (adjustedHeightCm !== undefined && roundedDays >= 731 && measurementType === 'length') {
    adjustedHeightCm -= 0.7
    notes.push('Recumbent length converted to standing height: subtract 0.7 cm for WHO age from 731 days.')
  }
  if (adjustedHeightCm !== undefined && adjustedHeightCm <= 0) {
    heightIssue = { status: 'invalid', reason: 'Height after the WHO measurement adjustment must be greater than zero.' }
    adjustedHeightCm = undefined
  }
  const computedBmi = !weightIssue && weightKg !== undefined && adjustedHeightCm !== undefined ? weightKg / (adjustedHeightCm / 100) ** 2 : undefined
  const bmi = computedBmi !== undefined && Number.isFinite(computedBmi) && computedBmi > 0 ? computedBmi : undefined
  const bmiIssue = computedBmi !== undefined && bmi === undefined
    ? { status: 'invalid' as const, reason: 'These measurements do not produce a finite, positive BMI. Check weight, length/height and units.' } : null
  let sharedIssue: { status: 'invalid'; reason: string } | null = null
  if (!Number.isFinite(ageDays) || ageDays < 0) sharedIssue = { status: 'invalid', reason: 'Age must be a finite number of days on or after birth.' }
  if (!['male', 'female'].includes(sex)) sharedIssue = { status: 'invalid', reason: 'Choose the sex used for the WHO reference.' }
  const results = METRICS.map((metric): GrowthResult => {
    const base = { metric, label: labelFor(metric, roundedDays), unit: UNITS[metric], steps: [] as string[] }
    if (sharedIssue) return { ...base, ...sharedIssue }
    let issue = metric === 'weightForAge' ? weightIssue : metric === 'heightForAge' ? heightIssue : metric === 'headCircumferenceForAge' ? headIssue : weightIssue || heightIssue
    if (metric === 'bmiForAge' && !issue) issue = bmiIssue
    if (oedema && ['weightForAge', 'bmiForAge', 'weightForLengthHeight'].includes(metric)) {
      issue = { status: 'unavailable', reason: 'Weight-related z-scores are not calculated when oedema is present.' }
    }
    if (issue) return { ...base, ...issue }
    const value = metric === 'heightForAge' ? adjustedHeightCm : metric === 'headCircumferenceForAge' ? headCircumferenceCm : metric === 'bmiForAge' ? bmi : weightKg
    if (value === undefined) return { ...base, status: 'unavailable', reason: 'Enter the required measurements.' }
    const reference = getReference(metric, sex, ageDays, adjustedHeightCm)
    if (!reference) return { ...base, status: 'unavailable', reason: rangeReason(metric, ageDays), value }
    const { lms, source, key, keyUnit, adjustExtreme } = reference
    const zScore = whoZScore(value, lms, adjustExtreme)
    if (!Number.isFinite(zScore)) return { ...base, status: 'invalid', reason: 'These measurements do not produce a valid result. Check their values and units.' }
    const rawZ = lmsZScore(value, lms)
    const steps = [
      `Exact age: ${ageDays.toFixed(Number.isInteger(ageDays) ? 0 : 3)} days ÷ 30.4375 = ${months.toFixed(5)} WHO months.`,
      ...(['heightForAge', 'bmiForAge', 'weightForLengthHeight'].includes(metric) ? notes : []),
      `${source.title}; ${sex} reference at ${key.toFixed(keyUnit === 'days' ? 0 : 5)} ${keyUnit}.`,
      ...(metric === 'bmiForAge' && adjustedHeightCm !== undefined ? [`BMI = ${weightKg} kg ÷ (${adjustedHeightCm.toFixed(2)} cm ÷ 100)² = ${value.toFixed(5)} kg/m².`] : []),
      `L = ${lms.l.toFixed(8)}, M = ${lms.m.toFixed(8)}, S = ${lms.s.toFixed(8)}.`,
      lms.l === 0 ? `z = ln(${value.toFixed(5)} ÷ M) ÷ S = ${rawZ.toFixed(5)}.` : `z = ((${value.toFixed(5)} ÷ M)^L − 1) ÷ (L × S) = ${rawZ.toFixed(5)}.`,
      ...(adjustExtreme && Math.abs(rawZ) > 3 ? [`WHO extended tail: use the measurement distance between ${Math.sign(rawZ) * 2} and ${Math.sign(rawZ) * 3} SD; adjusted z = ${zScore.toFixed(5)}.`] : []),
      `Percentile = standard normal CDF(${zScore.toFixed(5)}) × 100 = ${(normalCDF(zScore) * 100).toFixed(5)}.`,
    ]
    const flagged = isFlagged(metric, zScore)
    return {
      ...base, status: 'ok', value, zScore, percentile: normalCDF(zScore) * 100,
      flagged, source, lms, steps,
      ...(flagged ? { reason: 'Outside the WHO data-quality flag limits. Confirm age, measurement, units and clinical context before interpreting.' } : {}),
    }
  })
  for (const result of results) if (result.status === 'invalid' && result.reason && !errors.includes(result.reason)) errors.push(result.reason)
  if (months >= 60) notes.push('WHO 2007 is used from 60 months with interpolation between adjacent monthly LMS rows; no clamping at 61 months.')
  return { results, errors, notes, adjustedHeightCm, bmi }
}

export function calculateGrowth(input: GrowthInput): GrowthCalculation {
  let age: GrowthAge
  try { age = calculateAge(input.dateOfBirth, input.measurementDate) }
  catch (error) {
    const reason = error instanceof Error ? error.message : 'Enter valid dates.'
    return { age: null, results: METRICS.map(metric => ({ metric, label: labelFor(metric, 0), unit: UNITS[metric], status: 'unavailable', reason, steps: [] })), errors: [reason], notes: [] }
  }
  return { age, ...calculateGrowthAtAge({ ...input, ageDays: age.days }) }
}

/** One reference/measurement segment per chart, so source or posture jumps are never joined. */
export function getGrowthChart(input: {
  metric: GrowthMetric; sex: GrowthSex; ageDays: number; zScore?: number; measurement?: number; childX?: number
}): GrowthChart | null {
  const { metric, sex, ageDays, zScore, measurement, childX } = input
  const currentReference = getReference(metric, sex, ageDays, childX)
  if (!currentReference) return null
  const under5 = ageDays / WHO_DAYS_PER_MONTH < 60
  const isLength = Math.floor(ageDays + 0.5) < 731
  const byHeight = metric === 'weightForLengthHeight'
  let from: number
  let to: number
  const notes = ['Reference curves describe a population. The dotted line follows the same z-score for comparison; it does not predict this child’s growth.']
  if (byHeight) {
    from = isLength ? 45 : 65
    to = isLength ? 110 : 120
    notes.push('The horizontal axis is measured length/height, not time.')
  } else if (under5) {
    from = 0
    to = 1826
    if (metric === 'heightForAge' || metric === 'bmiForAge') {
      if (isLength) to = 730
      else from = 731
      notes.push('This chart stays within one measurement convention. WHO switches from length to height at 731 days.')
    }
  } else {
    from = 60
    to = (metric === 'weightForAge' ? 121 : 229) - 0.0001
  }
  const currentX = byHeight ? childX! : under5 ? ageDays : ageDays / WHO_DAYS_PER_MONTH
  const samples = new Set<number>([from, to, currentX])
  for (let i = 1; i < 120; i++) samples.add(under5 && !byHeight ? Math.round(from + (to - from) * i / 120) : from + (to - from) * i / 120)
  const sorted = [...samples].sort((a, b) => a - b)
  const pointsFor = (z: number): ChartPoint[] => sorted.flatMap(x => {
    const reference = getReference(metric, sex, byHeight ? ageDays : under5 ? x : x * WHO_DAYS_PER_MONTH, byHeight ? x : undefined)
    if (!reference) return []
    const y = whoReferenceValue(z, reference.lms, reference.adjustExtreme)
    if (y === null || !Number.isFinite(y) || y <= 0) return []
    return [{ x: !byHeight && under5 ? x / WHO_DAYS_PER_MONTH : x, y }]
  })
  const displayX = !byHeight && under5 ? currentX / WHO_DAYS_PER_MONTH : currentX
  const trackingAllowed = zScore !== undefined && Number.isFinite(zScore) && !isFlagged(metric, zScore)
  if (zScore !== undefined && !trackingAllowed) notes.push('A same-z comparison is not drawn for measurements outside WHO data-quality flag limits.')
  return {
    xLabel: byHeight ? isLength ? 'Length (cm)' : 'Height (cm)' : 'Age (WHO months)',
    yLabel: `${labelFor(metric, ageDays)} (${UNITS[metric]})`, source: currentReference.source,
    curves: [-3, -2, -1, 0, 1, 2, 3].map(z => ({ zScore: z, points: pointsFor(z) })),
    ...(measurement !== undefined && Number.isFinite(measurement) && measurement > 0 ? { childPoint: { x: displayX, y: measurement } } : {}),
    trackingCurve: trackingAllowed ? pointsFor(zScore).filter(point => point.x >= displayX) : [],
    notes,
  }
}
