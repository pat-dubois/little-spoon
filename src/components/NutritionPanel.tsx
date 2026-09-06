import { ArrowRightIcon, FlameIcon, DropIcon, GrainsIcon } from '@phosphor-icons/react'
import { getActivityRanges, NUTRITION_SOURCES, type ActivityLevel, type NutritionResult } from '../clinical/nutrition'
import { EmptyState, Errors, formatNumber, WorkDetails } from './ui'

type Props = { ageMonths?: number; activity: ActivityLevel | ''; onActivity: (value: ActivityLevel | '') => void; result?: NutritionResult; errors: string[] }

const activities: { value: ActivityLevel; label: string }[] = [
  { value: 'inactive', label: 'Inactive' },
  { value: 'low-active', label: 'Low active' },
  { value: 'active', label: 'Active' },
  { value: 'very-active', label: 'Very active' },
]

export function NutritionPanel({ ageMonths, activity, onActivity, result, errors }: Props) {
  const activityRanges = ageMonths !== undefined && ageMonths >= 36 && ageMonths < 228 ? getActivityRanges(ageMonths) : null
  return <div className="nutrition-workspace">
    <div className="tool-setup"><div className="section-heading"><h2>Daily nutrition</h2><p>Energy, protein and maintenance fluid, with the calculation behind each result.</p></div>
      {(ageMonths === undefined || ageMonths >= 36) ? <div className="field activity-field"><label htmlFor="activity">Physical activity</label><select id="activity" value={activity} onChange={(event) => onActivity(event.target.value as ActivityLevel | '')} aria-describedby="activity-help"><option value="">Choose activity level</option>{activities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><p className="field-help" id="activity-help">Used by the energy equation from age 3 years. Choose the category that fits usual activity.</p></div> : <p className="setup-note">The energy equation for children under 3 does not use an activity category.</p>}
      {activityRanges && <div className="activity-reference"><WorkDetails title="Activity categories for this age" steps={activities.map(({ value, label }) => `${label}: physical activity level (PAL) ${activityRanges[value][0]} to <${activityRanges[value][1]}.`)} sources={[NUTRITION_SOURCES.energy]} /></div>}
      <button className="primary-button" type="submit">Calculate<span className="button-icon"><ArrowRightIcon size={18} aria-hidden="true" /></span></button>
      <p className="setup-footnote">Reference estimates for healthy children from birth to under 19 years. Review individual clinical needs.</p>
    </div>
    <div className="nutrition-output">
      <Errors errors={errors} />
      {result ? <div className="nutrition-results" aria-label="Nutrition results">
        {([
          { key: 'energy', title: 'Energy', icon: FlameIcon, tone: 'berry' },
          { key: 'protein', title: 'Protein', icon: GrainsIcon, tone: 'sage' },
          { key: 'fluid', title: 'Maintenance fluid', icon: DropIcon, tone: 'fawn' },
        ] as const).map(({ key, title, icon: Icon, tone }) => {
          const item = result[key]
          return <article className={`nutrition-result result-${tone}`} key={key}>
            <div className="result-title"><Icon size={21} weight="light" aria-hidden="true" /><h3>{title}</h3>{item.referenceType && <span className="small-tag">{item.referenceType}</span>}</div>
            <div className="result-value"><strong>{formatNumber(item.value, key === 'energy' || key === 'fluid' ? 0 : 1)}</strong><span>{item.unit}</span></div>
            <p className="per-kg">{formatNumber(item.perKg, 2)} <span>{item.perKgUnit}</span></p>
            <p className="method-name">{item.method}</p>
            {item.notes.map((note, index) => <p className="result-note" key={index}>{note}</p>)}
            <WorkDetails steps={item.steps} sources={item.sources} />
          </article>
        })}
      </div> : <div className="nutrition-empty"><div className="empty-preview" aria-hidden="true"><span><FlameIcon size={23} weight="light" />Energy</span><span><GrainsIcon size={23} weight="light" />Protein</span><span><DropIcon size={23} weight="light" />Fluid</span></div><EmptyState title="Start with the patient details">Enter weight, length or height, age and sex above, then calculate. Each result includes a daily total and a value per kilogram.</EmptyState><div className="reference-strip"><span>Health Canada DRIs</span><span>Holliday-Segar method</span></div></div>}
    </div>
  </div>
}
