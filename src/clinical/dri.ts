import referenceData from './data/dri-values.json';
import { validateAge, validateSex, type ClinicalSource, type Sex } from './nutrition';

export interface DriRow {
  id: string;
  name: string;
  category: 'Vitamin' | 'Mineral';
  /** Intake unit. Upper limits may use a different chemical basis; read ulUnit. */
  unit: string;
  intake: number | null;
  intakeType: 'RDA' | 'AI' | 'ND';
  /** Null means not established, never zero or unlimited. */
  ul: number | null;
  ulUnit: string;
  ulNote: string;
  ageGroupLabel: string;
  notes: string[];
  source: ClinicalSource;
}
export interface DriResult {
  ageGroupLabel: string;
  rows: DriRow[];
  notes: string[];
}

interface NutrientDefinition {
  id: keyof typeof referenceData;
  name: string;
  category: DriRow['category'];
  unit: string;
  ulUnit?: string;
  ulScope?: string;
  notes?: string[];
}

const DEFINITIONS: NutrientDefinition[] = [
  { id: 'vitamin-a', name: 'Vitamin A', category: 'Vitamin', unit: 'µg RAE/day', ulUnit: 'µg/day preformed vitamin A', ulScope: 'Preformed vitamin A only; does not include beta-carotene.', notes: ['RAE means retinol activity equivalents.'] },
  { id: 'vitamin-c', name: 'Vitamin C', category: 'Vitamin', unit: 'mg/day', notes: ['The reference requirement is 35 mg/day higher for smokers; that adjustment is not included here.'] },
  { id: 'vitamin-d', name: 'Vitamin D', category: 'Vitamin', unit: 'µg/day', notes: ['Assumes minimal sun exposure. 1 µg vitamin D = 40 IU.'] },
  { id: 'vitamin-e', name: 'Vitamin E', category: 'Vitamin', unit: 'mg/day', ulScope: 'Synthetic vitamin E from supplements and fortified foods only.', notes: ['Intake reference is alpha-tocopherol (2R forms); the UL includes all synthetic isomeric forms.'] },
  { id: 'vitamin-k', name: 'Vitamin K', category: 'Vitamin', unit: 'µg/day' },
  { id: 'thiamin', name: 'Thiamin (B1)', category: 'Vitamin', unit: 'mg/day' },
  { id: 'riboflavin', name: 'Riboflavin (B2)', category: 'Vitamin', unit: 'mg/day' },
  { id: 'niacin', name: 'Niacin (B3)', category: 'Vitamin', unit: 'mg NE/day', ulUnit: 'mg/day synthetic niacin', ulScope: 'Synthetic niacin from supplements and fortified foods only.', notes: ['NE means niacin equivalents.'] },
  { id: 'vitamin-b6', name: 'Vitamin B6', category: 'Vitamin', unit: 'mg/day' },
  { id: 'folate', name: 'Folate', category: 'Vitamin', unit: 'µg DFE/day', ulUnit: 'µg folic acid/day', ulScope: 'Folic acid from supplements and fortified foods only, measured as µg folic acid, not µg DFE.', notes: ['DFE means dietary folate equivalents.'] },
  { id: 'vitamin-b12', name: 'Vitamin B12', category: 'Vitamin', unit: 'µg/day' },
  { id: 'pantothenic-acid', name: 'Pantothenic acid', category: 'Vitamin', unit: 'mg/day' },
  { id: 'biotin', name: 'Biotin', category: 'Vitamin', unit: 'µg/day' },
  { id: 'choline', name: 'Choline', category: 'Vitamin', unit: 'mg/day' },
  { id: 'calcium', name: 'Calcium', category: 'Mineral', unit: 'mg/day' },
  { id: 'iron', name: 'Iron', category: 'Mineral', unit: 'mg/day', notes: ['The reference requirement is 1.8 times higher for vegetarians because of lower iron bioavailability; that adjustment is not included here.'] },
  { id: 'zinc', name: 'Zinc', category: 'Mineral', unit: 'mg/day', notes: ['Zinc needs can be up to 50% higher with vegetarian diets, particularly when grains and legumes are staple foods; that adjustment is not included here.'] },
  { id: 'phosphorus', name: 'Phosphorus', category: 'Mineral', unit: 'mg/day' },
  { id: 'magnesium', name: 'Magnesium', category: 'Mineral', unit: 'mg/day', ulScope: 'Supplemental or pharmacological magnesium only; excludes magnesium in food and water.' },
  { id: 'iodine', name: 'Iodine', category: 'Mineral', unit: 'µg/day' },
  { id: 'selenium', name: 'Selenium', category: 'Mineral', unit: 'µg/day' },
  { id: 'copper', name: 'Copper', category: 'Mineral', unit: 'µg/day' },
  { id: 'manganese', name: 'Manganese', category: 'Mineral', unit: 'mg/day' },
  { id: 'chromium', name: 'Chromium', category: 'Mineral', unit: 'µg/day' },
  { id: 'molybdenum', name: 'Molybdenum', category: 'Mineral', unit: 'µg/day' },
  { id: 'fluoride', name: 'Fluoride', category: 'Mineral', unit: 'mg/day' },
];

const GROUP_LABELS = ['0 to <7 months', '7 to <12 months', '1 to <4 years', '4 to <9 years',
  '9 to <14 years, male', '14 to <19 years, male', '9 to <14 years, female', '14 to <19 years, female'];

function groupIndex(ageMonths: number, sex: Sex): number {
  if (ageMonths < 7) return 0;
  if (ageMonths < 12) return 1;
  if (ageMonths < 48) return 2;
  if (ageMonths < 108) return 3;
  return (sex === 'male' ? 4 : 6) + (ageMonths >= 168 ? 1 : 0);
}

/** All 26 legacy nutrients, rebuilt from Health Canada's current published tables. */
export function getDri(ageMonths: number, sex: Sex): DriResult {
  validateAge(ageMonths);
  validateSex(sex);
  const generalGroup = groupIndex(ageMonths, sex);
  const notes = ['RDA = recommended dietary allowance. AI = adequate intake. UL = tolerable upper intake level. These are daily reference intakes for healthy people; pregnancy, lactation and clinical conditions need separate assessment.',
    'No UL established means evidence is insufficient to set a limit; it does not mean unlimited intake is safe.'];
  if (ageMonths >= 6 && ageMonths < 7) {
    notes.push('At 6 to <7 months, the current Health Canada calculator uses the younger-infant group. Calcium and vitamin D use the older-infant values here because their published table footnotes explicitly switch at 6 months.');
  }
  const rows = DEFINITIONS.map((definition): DriRow => {
    const specialInfantBand = ageMonths < 12 && (definition.id === 'calcium' || definition.id === 'vitamin-d');
    const index = specialInfantBand ? (ageMonths < 6 ? 0 : 1) : generalGroup;
    const row = referenceData[definition.id];
    const [intake, intakeType, ul] = row.values[index]! as [number | null, 'RDA' | 'AI', number | null];
    const rowNotes = [...(definition.notes ?? [])];
    let unit = definition.unit;
    if (definition.id === 'niacin' && index === 0) {
      unit = 'mg/day preformed niacin';
      rowNotes.push('The younger-infant AI is preformed niacin, not niacin equivalents.');
    }
    if (definition.id === 'vitamin-c' && index === 0) rowNotes.push('Health Canada specifies food as the source of intake for this infant group.');
    if (definition.id === 'iron' && sex === 'female' && ageMonths >= 108) rowNotes.push(ageMonths < 168
      ? 'This reference assumes girls younger than 14 years do not menstruate.'
      : 'This reference assumes girls 14 years and older menstruate.');
    if (specialInfantBand) rowNotes.push('The calcium and vitamin D table footnotes define the infant groups as 0 to <6 and 6 to <12 months.');
    return {
      id: definition.id, name: definition.name, category: definition.category, unit,
      intake, intakeType: intake === null ? 'ND' : intakeType, ul, ulUnit: definition.ulUnit ?? definition.unit,
      ulNote: ul === null ? 'No UL established; this is not a statement that high intakes are safe.'
        : definition.ulScope ?? 'Upper limit for total daily intake.',
      ageGroupLabel: specialInfantBand ? (ageMonths < 6 ? '0 to <6 months' : '6 to <12 months') : GROUP_LABELS[index]!,
      notes: rowNotes,
      source: { title: `Health Canada: ${definition.category === 'Vitamin' ? 'vitamin' : 'element'} reference values`, url: row.source },
    };
  });
  return { ageGroupLabel: GROUP_LABELS[generalGroup]!, rows, notes };
}
