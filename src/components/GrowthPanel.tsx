import { ArrowRightIcon, ChartLineIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { getGrowthChart, type calculateGrowth } from '../clinical/growth'
import { GrowthChart } from './GrowthChart'
import type { Patient } from './patient'
import { EmptyState, Errors, formatNumber, Notice, WorkDetails } from './ui'

type Result = ReturnType<typeof calculateGrowth>
type Metric = Result['results'][number]['metric']
type Props = { patient: Patient; onPatientChange: (change: Partial<Patient>) => void; head: string; onHead: (value: string) => void; oedema: boolean; onOedema: (value: boolean) => void; result?: Result; errors: string[] }

export function GrowthPanel({ patient, onPatientChange, head, onHead, oedema, onOedema, result, errors }: Props) {
  const [bodyMetric, setBodyMetric] = useState<'bmiForAge' | 'weightForLengthHeight'>('bmiForAge')
  const [selectedMetric, setSelectedMetric] = useState<Metric>('weightForAge')
  const shownResults = result?.results.filter((item) => (item.metric !== 'bmiForAge' && item.metric !== 'weightForLengthHeight' || item.metric === bodyMetric) && (item.metric !== 'headCircumferenceForAge' || head !== '')) ?? []
  const selected = shownResults.find((item) => item.metric === selectedMetric && item.status === 'ok') ?? shownResults.find((item) => item.status === 'ok')
  const chart = selected && result?.age && patient.sex ? getGrowthChart({ metric: selected.metric, sex: patient.sex, ageDays: result.age.days, zScore: selected.zScore, measurement: selected.value, childX: result.adjustedHeightCm }) : null
  return <div className="growth-panel">
    <div className="section-heading"><h2>Growth reference</h2><p>WHO z-scores and percentiles calculated from exact dates and measurement type.</p></div>
    {patient.ageMode === 'manual' && <Notice><p>Growth calculations need exact dates. <button className="inline-button" type="button" onClick={() => onPatientChange({ ageMode: 'dates' })}>Use date of birth and measurement date</button> in Patient details.</p></Notice>}
    <div className="growth-controls">
      <div className="field"><label htmlFor="measurement-type">How was length / height measured?</label><select id="measurement-type" value={patient.measurementType} onChange={(event) => onPatientChange({ measurementType: event.target.value as Patient['measurementType'] })}><option value="">Choose measurement type</option><option value="length">Lying down (recumbent length)</option><option value="height">Standing (height)</option></select></div>
      <div className="field"><label htmlFor="head-circumference">Head circumference <span className="optional">optional</span></label><div className="input-unit"><input id="head-circumference" name="headCircumference" type="number" min="0" step="any" inputMode="decimal" value={head} onChange={(event) => onHead(event.target.value)} /><span aria-hidden="true">cm</span></div></div>
      <button className="primary-button" type="submit">Calculate<span className="button-icon"><ArrowRightIcon size={18} aria-hidden="true" /></span></button>
    </div>
    <details className="advanced-inputs"><summary>Additional measurement information</summary><label className="checkbox-label"><input type="checkbox" checked={oedema} onChange={(event) => onOedema(event.target.checked)} />Bilateral pitting oedema is present</label><p>WHO weight-based results are withheld when oedema is present.</p></details>
    <Errors errors={errors} />
    {result && <Errors errors={result.errors} />}
    {result?.notes.map((note, index) => <Notice key={index}><p>{note}</p></Notice>)}
    {result && shownResults.length > 0 ? <>
      <div className="growth-results-top"><p className="results-hint">Select a measurement to view its chart.</p><fieldset className="body-metric-choice"><legend className="sr-only">Body proportion reference</legend><div className="segment-control">{([{ value: 'bmiForAge', label: 'BMI' }, { value: 'weightForLengthHeight', label: 'Weight / length or height' }] as const).map((choice) => <label key={choice.value} className={bodyMetric === choice.value ? 'selected' : ''}><input type="radio" name="bodyMetric" value={choice.value} checked={bodyMetric === choice.value} onChange={() => { setBodyMetric(choice.value); if (selectedMetric === 'bmiForAge' || selectedMetric === 'weightForLengthHeight') setSelectedMetric(choice.value) }} /><span>{choice.label}</span></label>)}</div></fieldset></div>
      <div className="growth-metrics">{shownResults.map((item) => <div className={`growth-metric${selected?.metric === item.metric ? ' growth-metric-selected' : ''}`} key={item.metric}>{item.status === 'ok' ? <button type="button" aria-pressed={selected?.metric === item.metric} onClick={() => setSelectedMetric(item.metric)}><span className="growth-metric-label">{item.label}</span><span className="growth-z">{item.zScore?.toFixed(2)}<span>z-score</span></span><span className="growth-percentile">{item.percentile !== undefined && (item.percentile < 0.1 ? '<0.1' : item.percentile > 99.9 ? '>99.9' : formatNumber(item.percentile, 1))}<span> percentile</span></span>{item.flagged && <span className="metric-flag">Check measurement</span>}</button> : <div className="metric-unavailable"><span className="growth-metric-label">{item.label}</span><strong>{item.status === 'invalid' ? 'Check input' : 'Unavailable'}</strong><p>{item.reason}</p></div>}</div>)}</div>
      {selected?.flagged && selected.reason && <Notice><p>{selected.reason}</p></Notice>}
      {selected && <div className="chart-shell">{chart ? <GrowthChart data={chart} label={selected.label} zScore={selected.zScore} /> : <EmptyState title="Chart unavailable">The reference does not provide a chart for this measurement.</EmptyState>}<WorkDetails steps={selected.steps} sources={selected.source ? [selected.source] : []} title="Show z-score calculation" /></div>}
    </> : <EmptyState title="See the measurement in context"><ChartLineIcon size={20} aria-hidden="true" /> Enter exact dates and at least one measurement, then calculate. Each supported result shows its z-score, percentile and reference chart.</EmptyState>}
    <p className="clinical-footnote">WHO references have different age and measurement ranges. The tool reports each metric separately and shows when a reference does not apply.</p>
  </div>
}
