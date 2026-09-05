import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { BookOpenIcon, ChartLineIcon, DownloadSimpleIcon, ForkKnifeIcon, MoonIcon, ShieldCheckIcon, SunIcon } from '@phosphor-icons/react'
import { calculateNutrition, type ActivityLevel } from './clinical/nutrition'
import { getDri } from './clinical/dri'
import { calculateGrowth } from './clinical/growth'
import { PatientCard } from './components/PatientCard'
import { NutritionPanel } from './components/NutritionPanel'
import { GrowthPanel } from './components/GrowthPanel'
import { DriPanel } from './components/DriPanel'
import { SoftwareNotices } from './SoftwareNotices'
import { blankPatient, localToday, patientAge, readNumber, type Patient } from './components/patient'

type Tab = 'nutrition' | 'growth' | 'dri'
const tabs = [
  { id: 'nutrition', label: 'Nutrition', icon: ForkKnifeIcon },
  { id: 'growth', label: 'Z-score', icon: ChartLineIcon },
  { id: 'dri', label: 'DRI / RDA', icon: BookOpenIcon },
] as const

function getInputErrors(patient: Patient, tab: Tab, activity: ActivityLevel | '', head: string) {
  const fields: Record<string, string> = {}
  const errors: string[] = []
  const age = patientAge(patient)
  if (!patient.sex) fields.sex = 'Choose the sex used by the reference.'
  if (tab === 'growth') {
    if (patient.ageMode !== 'dates' || !patient.dateOfBirth || !patient.measurementDate) fields.age = 'Enter date of birth and date of measurement for growth.'
    else if (age.error) fields.age = age.error
    if (!patient.weight && !patient.height && !head) errors.push('Enter at least one measurement: weight, length / height, or head circumference.')
  } else {
    if (age.error) fields.age = age.error
    else if (age.months === undefined) fields.age = 'Enter age in years and months, or use exact dates.'
    else if (age.months >= 228) fields.age = 'Nutrition and DRI references cover birth to under 19 years.'
  }
  if (patient.ageMode === 'dates' && patient.measurementDate > localToday()) fields.age = 'The date of measurement cannot be in the future.'
  if (tab === 'nutrition') {
    if ((readNumber(patient.weight) ?? 0) <= 0) fields.weight = 'Enter a weight greater than zero.'
    if ((readNumber(patient.height) ?? 0) <= 0) fields.height = 'Enter a length or height greater than zero.'
    if (age.months !== undefined && age.months >= 36 && !activity) errors.push('Choose a physical activity level for children aged 3 years and older.')
  }
  return { fields, errors: [...Object.values(fields), ...errors] }
}

export default function App() {
  const [patient, setPatient] = useState<Patient>(blankPatient)
  const [activeTab, setActiveTab] = useState<Tab>('nutrition')
  const [activity, setActivity] = useState<ActivityLevel | ''>('')
  const [head, setHead] = useState('')
  const [oedema, setOedema] = useState(false)
  const [attempted, setAttempted] = useState<Record<Tab, boolean>>({ nutrition: false, growth: false, dri: false })
  const [resetCount, setResetCount] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const age = patientAge(patient)

  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme }, [theme])

  const changePatient = (change: Partial<Patient>) => { setPatient((current) => ({ ...current, ...change })); setAnnouncement('') }
  const selectTab = (tab: Tab) => { setActiveTab(tab); if (tab === 'growth') changePatient({ ageMode: 'dates' }) }
  const validation = attempted[activeTab] ? getInputErrors(patient, activeTab, activity, head) : { fields: {}, errors: [] }

  const nutrition = useMemo(() => {
    if (!attempted.nutrition) return {}
    const inputErrors = getInputErrors(patient, 'nutrition', activity, head)
    if (inputErrors.errors.length) return { errors: inputErrors.errors }
    try {
      return { result: calculateNutrition({ ageMonths: patientAge(patient).months!, sex: patient.sex as 'female' | 'male', weightKg: readNumber(patient.weight)!, heightCm: readNumber(patient.height)!, ...(activity ? { activity } : {}) }) }
    } catch (error) { return { errors: [error instanceof Error ? error.message : 'Check the patient details.'] } }
  }, [patient, activity, head, attempted.nutrition])

  const growth = useMemo(() => {
    if (!attempted.growth) return {}
    const inputErrors = getInputErrors(patient, 'growth', activity, head)
    if (inputErrors.errors.length) return { errors: inputErrors.errors }
    try {
      return { result: calculateGrowth({ sex: patient.sex as 'female' | 'male', dateOfBirth: patient.dateOfBirth, measurementDate: patient.measurementDate, weightKg: readNumber(patient.weight), heightCm: readNumber(patient.height), measurementType: patient.measurementType || undefined, headCircumferenceCm: readNumber(head), oedema }) }
    } catch (error) { return { errors: [error instanceof Error ? error.message : 'Check the patient details.'] } }
  }, [patient, head, oedema, attempted.growth, activity])

  const dri = useMemo(() => {
    if (!attempted.dri) return {}
    const inputErrors = getInputErrors(patient, 'dri', activity, head)
    if (inputErrors.errors.length) return { errors: inputErrors.errors }
    try { return { result: getDri(patientAge(patient).months!, patient.sex as 'female' | 'male') } }
    catch (error) { return { errors: [error instanceof Error ? error.message : 'Check age and sex.'] } }
  }, [patient, attempted.dri, activity, head])

  function submit(event: FormEvent) {
    event.preventDefault()
    setAttempted((current) => ({ ...current, [activeTab]: true }))
    const errors = getInputErrors(patient, activeTab, activity, head)
    if (errors.errors.length) {
      setAnnouncement('Please check the highlighted details.')
      window.requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
    } else setAnnouncement(`${tabs.find((tab) => tab.id === activeTab)?.label} results updated.`)
  }

  function reset() {
    setPatient(blankPatient())
    setActivity('')
    setHead('')
    setOedema(false)
    setAttempted({ nutrition: false, growth: false, dri: false })
    setActiveTab('nutrition')
    setResetCount((count) => count + 1)
    setAnnouncement('All patient details and results cleared.')
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let target: number | undefined
    if (event.key === 'ArrowRight') target = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length
    if (event.key === 'Home') target = 0
    if (event.key === 'End') target = tabs.length - 1
    if (target !== undefined) { event.preventDefault(); selectTab(tabs[target].id); tabRefs.current[target]?.focus() }
  }

  return <div className="app-shell">
    <a className="skip-link" href="#patient-heading">Skip to calculator</a>
    <header className="app-header"><div className="brand"><span className="brand-mark"><ForkKnifeIcon size={24} weight="light" aria-hidden="true" /></span><div><h1>little spoon</h1><p>Pediatric nutrition & growth</p></div></div><button className="theme-button" type="button" onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>{theme === 'light' ? <MoonIcon size={20} aria-hidden="true" /> : <SunIcon size={20} aria-hidden="true" />}<span>{theme === 'light' ? 'Dark' : 'Light'}</span></button></header>
    <main>
      <form noValidate autoComplete="off" ref={formRef} onSubmit={submit}>
        <PatientCard patient={patient} onChange={changePatient} onReset={reset} errors={validation.fields} />
        <div className="tools-header"><div className="tool-tabs" role="tablist" aria-label="Calculator tools">{tabs.map((tab, index) => <button id={`tab-${tab.id}`} role="tab" type="button" key={tab.id} aria-selected={activeTab === tab.id} aria-controls={`panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} ref={(element) => { tabRefs.current[index] = element }} onKeyDown={(event) => onTabKey(event, index)} onClick={() => selectTab(tab.id)}><tab.icon size={18} weight={activeTab === tab.id ? 'regular' : 'light'} aria-hidden="true" />{tab.label}</button>)}</div>{age.label && <p className="shared-age"><span>Using age</span> {age.label}</p>}</div>
        <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} tabIndex={0} className="tool-panel" key={`${activeTab}-${resetCount}`}>
          {activeTab === 'nutrition' && <NutritionPanel ageMonths={age.months} activity={activity} onActivity={setActivity} result={nutrition.result} errors={nutrition.errors ?? []} />}
          {activeTab === 'growth' && <GrowthPanel patient={patient} onPatientChange={changePatient} head={head} onHead={setHead} oedema={oedema} onOedema={setOedema} result={growth.result} errors={growth.errors ?? []} />}
          {activeTab === 'dri' && <DriPanel result={dri.result} errors={dri.errors ?? []} />}
        </div>
      </form>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    </main>
    <footer className="app-footer"><div className="privacy-note"><ShieldCheckIcon size={17} weight="light" aria-hidden="true" /><span>Patient details stay on this device and clear when the page closes.</span></div><div className="footer-actions">{window.location.protocol !== 'file:' && <a href="./little-spoon.html" download><DownloadSimpleIcon size={16} aria-hidden="true" />Offline copy</a>}<span className="labs-credit">Labs</span></div></footer>
    <SoftwareNotices />
  </div>
}
