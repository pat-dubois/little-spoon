import { ArrowUpRightIcon, CaretDownIcon, InfoIcon, WarningCircleIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

export type Source = { title: string; url: string }

export function SourceLinks({ sources }: { sources: Source[] }) {
  const unique = sources.filter((source, index) => sources.findIndex((item) => item.url === source.url) === index)
  return <div className="source-links">{unique.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRightIcon size={13} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>)}</div>
}

export function WorkDetails({ steps, sources, notes = [], title = 'Show calculation' }: { steps: string[]; sources: Source[]; notes?: string[]; title?: string }) {
  return <details className="work-details">
    <summary>{title}<CaretDownIcon size={16} aria-hidden="true" /></summary>
    <div className="work-content">
      {steps.length > 0 && <ol className="calculation-steps">{steps.map((step, index) => <li key={index}>{step}</li>)}</ol>}
      {notes.length > 0 && <div className="work-notes">{notes.map((note, index) => <p key={index}>{note}</p>)}</div>}
      <SourceLinks sources={sources} />
    </div>
  </details>
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={`notice${error ? ' notice-error' : ''}`} role={error ? 'alert' : undefined}>{error ? <WarningCircleIcon size={20} aria-hidden="true" /> : <InfoIcon size={20} aria-hidden="true" />}<div>{children}</div></div>
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state"><div className="empty-rule" aria-hidden="true" /><div><h3>{title}</h3><p>{children}</p></div></div>
}

export function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat('en-CA', { maximumFractionDigits: digits }).format(value)
}

export function Errors({ errors }: { errors: string[] }) {
  if (!errors.length) return null
  return <Notice error><p className="notice-title">A few details need attention</p>{errors.length === 1 ? <p>{errors[0]}</p> : <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>}</Notice>
}
