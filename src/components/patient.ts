import { calculateAge } from '../clinical/growth'

export type Patient = {
  weight: string
  height: string
  sex: '' | 'male' | 'female'
  years: string
  months: string
  dateOfBirth: string
  measurementDate: string
  ageMode: 'manual' | 'dates'
  measurementType: '' | 'length' | 'height'
}

export function localToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function blankPatient(): Patient {
  return { weight: '', height: '', sex: '', years: '', months: '', dateOfBirth: '', measurementDate: localToday(), ageMode: 'manual', measurementType: '' }
}

export function readNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const result = Number(value)
  return Number.isFinite(result) ? result : undefined
}

export function patientAge(patient: Patient): { months?: number; label?: string; error?: string } {
  if (patient.ageMode === 'dates') {
    if (!patient.dateOfBirth || !patient.measurementDate) return {}
    try {
      const age = calculateAge(patient.dateOfBirth, patient.measurementDate)
      const completedMonths = age.completedYears * 12 + age.completedMonths
      const [birthYear, birthMonth, birthDay] = patient.dateOfBirth.split('-').map(Number)
      const monthAnniversary = (offset: number) => {
        const lastDay = new Date(Date.UTC(birthYear, birthMonth - 1 + offset + 1, 0)).getUTCDate()
        return Date.UTC(birthYear, birthMonth - 1 + offset, Math.min(birthDay, lastDay))
      }
      const currentAnniversary = monthAnniversary(completedMonths)
      const nextAnniversary = monthAnniversary(completedMonths + 1)
      const measured = Date.parse(`${patient.measurementDate}T00:00:00Z`)
      // Nutrition and DRI age bands follow attained calendar birthdays.
      // WHO growth still independently uses elapsed days / 30.4375.
      const months = completedMonths + (measured - currentAnniversary) / (nextAnniversary - currentAnniversary)
      return { months, label: `${age.completedYears} yr ${age.completedMonths} mo (${formatAgeDays(age.days)})` }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Check the dates.' }
    }
  }
  if (patient.years === '' && patient.months === '') return {}
  if ((patient.years !== '' && !/^\d+$/.test(patient.years)) || (patient.months !== '' && !/^\d+$/.test(patient.months))) return { error: 'Enter whole years and 0 to 11 additional months.' }
  const years = readNumber(patient.years === '' ? '0' : patient.years)
  const months = readNumber(patient.months === '' ? '0' : patient.months)
  if (years === undefined || months === undefined || !Number.isInteger(years) || !Number.isInteger(months) || years < 0 || months < 0 || months > 11) return { error: 'Enter whole years and 0 to 11 additional months.' }
  return { months: years * 12 + months, label: `${years} yr ${months} mo` }
}

function formatAgeDays(days: number) { return `${new Intl.NumberFormat('en-CA').format(days)} days` }
