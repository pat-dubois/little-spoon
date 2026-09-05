import { ArrowsClockwiseIcon, CalendarBlankIcon } from '@phosphor-icons/react'
import { localToday, patientAge, type Patient } from './patient'

type Props = { patient: Patient; onChange: (change: Partial<Patient>) => void; onReset: () => void; errors: Record<string, string> }

export function PatientCard({ patient, onChange, onReset, errors }: Props) {
  const age = patientAge(patient)
  return <section className="patient-shell" aria-labelledby="patient-heading">
    <div className="patient-card">
      <div className="patient-header"><div><h2 id="patient-heading">Patient details</h2><p>Shared across all three tools.</p></div><button type="button" className="text-button reset-button" onClick={onReset}><ArrowsClockwiseIcon size={17} aria-hidden="true" />Reset all</button></div>
      <div className="patient-grid">
        <div className="field">
          <label htmlFor="weight">Weight</label>
          <div className={`input-unit${errors.weight ? ' input-invalid' : ''}`}><input id="weight" name="weight" type="number" min="0" step="any" inputMode="decimal" value={patient.weight} onChange={(event) => onChange({ weight: event.target.value })} aria-invalid={!!errors.weight} aria-describedby={`weight-unit${errors.weight ? ' weight-error' : ''}`} /><span aria-hidden="true">kg</span></div><span id="weight-unit" className="sr-only">kilograms</span>
          {errors.weight && <p className="field-error" id="weight-error">{errors.weight}</p>}
        </div>
        <div className="field">
          <label htmlFor="height">Length / height</label>
          <div className={`input-unit${errors.height ? ' input-invalid' : ''}`}><input id="height" name="height" type="number" min="0" step="any" inputMode="decimal" value={patient.height} onChange={(event) => onChange({ height: event.target.value })} aria-invalid={!!errors.height} aria-describedby={`height-unit${errors.height ? ' height-error' : ''}`} /><span aria-hidden="true">cm</span></div><span id="height-unit" className="sr-only">centimetres</span>
          {errors.height && <p className="field-error" id="height-error">{errors.height}</p>}
        </div>
        <fieldset className="field sex-field"><legend>Sex used by reference</legend><div className={`segment-control${errors.sex ? ' input-invalid' : ''}`}>
          {(['female', 'male'] as const).map((sex) => <label className={patient.sex === sex ? 'selected' : ''} key={sex}><input type="radio" name="sex" value={sex} checked={patient.sex === sex} onChange={() => onChange({ sex })} aria-describedby={errors.sex ? 'sex-error' : undefined} /><span>{sex === 'female' ? 'Female' : 'Male'}</span></label>)}
        </div>{errors.sex && <p className="field-error" id="sex-error">{errors.sex}</p>}</fieldset>
        <div className="field age-field"><div className="field-label-line"><label htmlFor={patient.ageMode === 'manual' ? 'age-years' : 'dob'}>Age</label><button type="button" className="field-link" onClick={() => onChange({ ageMode: patient.ageMode === 'manual' ? 'dates' : 'manual' })}>{patient.ageMode === 'manual' ? <><CalendarBlankIcon size={14} aria-hidden="true" />Use dates</> : 'Enter age'}</button></div>
          {patient.ageMode === 'manual' ? <div className="age-inputs"><div className={`input-unit${errors.age ? ' input-invalid' : ''}`}><input id="age-years" name="years" type="text" inputMode="numeric" pattern="[0-9]*" value={patient.years} onChange={(event) => onChange({ years: event.target.value })} aria-label="Age in years" aria-invalid={!!errors.age} aria-describedby={errors.age ? 'age-error' : undefined} /><span aria-hidden="true">yr</span></div><div className={`input-unit${errors.age ? ' input-invalid' : ''}`}><input id="age-months" name="months" type="text" inputMode="numeric" pattern="[0-9]*" value={patient.months} onChange={(event) => onChange({ months: event.target.value })} aria-label="Additional months" aria-invalid={!!errors.age} aria-describedby={errors.age ? 'age-error' : undefined} /><span aria-hidden="true">mo</span></div></div> : <div className="age-calculated">{age.label || 'Enter dates below'}</div>}
          {(errors.age || age.error) && <p className="field-error" id="age-error">{errors.age || age.error}</p>}
        </div>
      </div>
      {patient.ageMode === 'dates' && <div className="date-row"><div className="field"><label htmlFor="dob">Date of birth</label><input id="dob" name="dateOfBirth" type="date" max={localToday()} value={patient.dateOfBirth} onChange={(event) => onChange({ dateOfBirth: event.target.value })} aria-invalid={!!errors.age} aria-describedby="date-help" /></div><div className="field"><label htmlFor="measurement-date">Date of measurement</label><input id="measurement-date" name="measurementDate" type="date" max={localToday()} value={patient.measurementDate} onChange={(event) => onChange({ measurementDate: event.target.value })} aria-invalid={!!errors.age} aria-describedby="date-help" /></div><p id="date-help">Exact dates are used for WHO growth calculations. This age also carries into Nutrition and DRI / RDA.</p></div>}
    </div>
  </section>
}
