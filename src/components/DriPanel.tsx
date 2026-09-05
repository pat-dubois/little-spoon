import { ArrowRightIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import type { DriResult, DriRow } from '../clinical/dri'
import { EmptyState, Errors, formatNumber, SourceLinks } from './ui'

type Props = { result?: DriResult; errors: string[] }

function NutrientNotes({ row }: { row: DriRow }) {
  return <details className="nutrient-details">
    <summary><span className="sr-only">{row.name} </span>Notes</summary>
    <div>
      <p>Reference group: {row.ageGroupLabel}.</p>
      {row.ulNote && <p>{row.ulNote}</p>}
      {row.notes.map((note, index) => <p key={index}>{note}</p>)}
      <SourceLinks sources={[row.source, ...(row.unitSource ? [row.unitSource] : [])]} />
    </div>
  </details>
}

function IntakeTag({ type }: { type: DriRow['intakeType'] }) {
  return <span className={`intake-tag${type === 'AI' ? ' intake-ai' : ''}`}>{type}</span>
}

function DualUnitAmount({ row, kind, showType = false }: { row: DriRow; kind: 'intake' | 'ul'; showType?: boolean }) {
  const value = row[kind]
  if (value === null) return <span className="not-established">Not established</span>
  const canonical = { value, unit: kind === 'intake' ? row.unit : row.ulUnit }
  const international = row.internationalUnits
  const internationalValue = international?.[kind]
  const alternative = international && internationalValue !== null && internationalValue !== undefined
    ? { value: internationalValue, unit: kind === 'intake' ? international.unit : international.ulUnit }
    : undefined
  const primary = alternative && international?.preferred ? alternative : canonical
  const secondary = alternative ? international?.preferred ? canonical : alternative : undefined
  const secondaryRounded = kind === 'ul' && international?.preferred && international.ulMicrogramsRounded
  return <div className="dri-dual-amount">
    <div className="dri-amount-primary">
      <div className="dri-amount-topline"><strong className="dri-number">{formatNumber(primary.value, 3)}</strong>{showType && <IntakeTag type={row.intakeType} />}</div>
      <span className="dri-unit-label">{primary.unit}</span>
    </div>
    {secondary && <div className="dri-amount-secondary"><span className="dri-number">{formatNumber(secondary.value, 3)}</span><span className="dri-unit-label">{secondary.unit}{secondaryRounded ? ' (rounded)' : ''}</span></div>}
  </div>
}

export function DriPanel({ result, errors }: Props) {
  const [filter, setFilter] = useState('')
  const [category, setCategory] = useState<'all' | 'Vitamin' | 'Mineral'>('all')
  const rows = result?.rows.filter((row) => (category === 'all' || row.category === category) && row.name.toLowerCase().includes(filter.trim().toLowerCase())) ?? []
  return <div className="dri-panel">
    <div className="dri-title-row"><div className="section-heading"><h2>Daily nutrient reference</h2><p>Age- and sex-based Dietary Reference Intakes from Health Canada.</p></div><button className="primary-button" type="submit">View reference<span className="button-icon"><ArrowRightIcon size={18} aria-hidden="true" /></span></button></div>
    <Errors errors={errors} />
    {result ? <>
      <div className="dri-context"><span>Reference group</span><strong>{result.ageGroupLabel}</strong></div>
      <div className="dri-key"><p><strong>RDA</strong> Recommended Dietary Allowance</p><p><strong>AI</strong> Adequate Intake, used when no RDA is set</p><p><strong>UL</strong> Tolerable Upper Intake Level</p></div>
      <div className="dri-reference-notes">{result.notes.map((note, index) => <p key={index}>{note}</p>)}</div>
      <div className="table-tools"><div className="search-field"><MagnifyingGlassIcon size={18} aria-hidden="true" /><input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Find a nutrient" placeholder="Find a nutrient" /></div><div className="field category-filter"><label className="sr-only" htmlFor="nutrient-category">Nutrient group</label><select id="nutrient-category" value={category} onChange={(event) => setCategory(event.target.value as 'all' | 'Vitamin' | 'Mineral')}><option value="all">All nutrients</option><option value="Vitamin">Vitamins</option><option value="Mineral">Minerals</option></select></div></div>
      <div className="dri-table-wrap" role="region" aria-label="Nutrient reference table" tabIndex={0}>
        <table className="dri-table">
          <caption className="sr-only">Daily vitamin and mineral references for {result.ageGroupLabel}</caption>
          <thead><tr><th scope="col">Nutrient</th><th scope="col">Daily reference</th><th scope="col">Upper limit</th><th scope="col">Details</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id}>
            <th scope="row"><span>{row.name}</span>{!row.internationalUnits && <small>{row.unit}</small>}</th>
            <td>{row.internationalUnits ? <DualUnitAmount row={row} kind="intake" showType /> : row.intake === null ? <span className="not-established">Not established</span> : <><strong>{formatNumber(row.intake, 3)}</strong><IntakeTag type={row.intakeType} /></>}</td>
            <td>{row.internationalUnits ? <DualUnitAmount row={row} kind="ul" /> : row.ul === null ? <span className="not-established">Not established</span> : <><strong>{formatNumber(row.ul, 3)}</strong>{row.ulUnit !== row.unit && <small className="ul-unit">{row.ulUnit}</small>}</>}</td>
            <td><NutrientNotes row={row} /></td>
          </tr>)}</tbody>
        </table>
      </div>
      <ul className="dri-cards" role="list" aria-label="Nutrient references">
        {rows.map((row) => <li key={row.id}>
          <article className="dri-nutrient-card" aria-labelledby={`nutrient-${row.id}`} data-nutrient-id={row.id}>
            <h3 id={`nutrient-${row.id}`}>{row.name}</h3>
            <dl className="dri-card-values">
              <div><dt>Daily reference {row.intake !== null && <IntakeTag type={row.intakeType} />}</dt><dd>{row.internationalUnits ? <DualUnitAmount row={row} kind="intake" /> : row.intake === null ? <span className="not-established">Not established</span> : <><strong>{formatNumber(row.intake, 3)}</strong><span className="dri-card-unit">{row.unit}</span></>}</dd></div>
              <div><dt>Upper limit (UL)</dt><dd>{row.internationalUnits ? <DualUnitAmount row={row} kind="ul" /> : row.ul === null ? <span className="not-established">Not established</span> : <><strong>{formatNumber(row.ul, 3)}</strong><span className="dri-card-unit">{row.ulUnit}</span></>}</dd></div>
            </dl>
            <NutrientNotes row={row} />
          </article>
        </li>)}
      </ul>
      {!rows.length && <p className="no-matches">No nutrients match “{filter}”. Try a different name or group.</p>}
      <p className="dri-caution">An upper limit is not a target. “Not established” does not mean unlimited intake is safe. Read nutrient notes for which forms and sources count toward the limit.</p>
      <SourceLinks sources={result.rows.map((row) => ({ ...row.source, url: row.source.url.split('#')[0] }))} />
    </> : <EmptyState title="The right reference for this age">Enter age and sex in Patient details, then view the reference. Weight and height are not needed for this table.</EmptyState>}
  </div>
}
