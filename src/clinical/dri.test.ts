import { describe, expect, it } from 'vitest';
import { getDri } from './dri';
import type { Sex } from './nutrition';

// Independently transcribed expected RDA/AI and UL cells from Health Canada's
// three vitamin + three element tables, verified 2026-09-05. These expected
// matrices do not import production data or the importer. Order: younger infant,
// older infant, 1-3y, 4-8y, male9-13y, male14-18y, female9-13y, female14-18y.
// Run scripts/dri-import.py to refresh the separate machine-extracted values.
const EXPECTED: [string, number[], (number | null)[]][] = [
  ['vitamin-a', [400,500,300,400,600,900,600,700], [600,600,600,900,1700,2800,1700,2800]],
  ['vitamin-c', [40,50,15,25,45,75,45,65], [null,null,400,650,1200,1800,1200,1800]],
  ['vitamin-d', [10,10,15,15,15,15,15,15], [25,38,63,75,100,100,100,100]],
  ['vitamin-e', [4,5,6,7,11,15,11,15], [null,null,200,300,600,800,600,800]],
  ['vitamin-k', [2,2.5,30,55,60,75,60,75], [null,null,null,null,null,null,null,null]],
  ['thiamin', [0.2,0.3,0.5,0.6,0.9,1.2,0.9,1], [null,null,null,null,null,null,null,null]],
  ['riboflavin', [0.3,0.4,0.5,0.6,0.9,1.3,0.9,1], [null,null,null,null,null,null,null,null]],
  ['niacin', [2,4,6,8,12,16,12,14], [null,null,10,15,20,30,20,30]],
  ['vitamin-b6', [0.1,0.3,0.5,0.6,1,1.3,1,1.2], [null,null,30,40,60,80,60,80]],
  ['folate', [65,80,150,200,300,400,300,400], [null,null,300,400,600,800,600,800]],
  ['vitamin-b12', [0.4,0.5,0.9,1.2,1.8,2.4,1.8,2.4], [null,null,null,null,null,null,null,null]],
  ['pantothenic-acid', [1.7,1.8,2,3,4,5,4,5], [null,null,null,null,null,null,null,null]],
  ['biotin', [5,6,8,12,20,25,20,25], [null,null,null,null,null,null,null,null]],
  ['choline', [125,150,200,250,375,550,375,400], [null,null,1000,1000,2000,3000,2000,3000]],
  ['calcium', [200,260,700,1000,1300,1300,1300,1300], [1000,1500,2500,2500,3000,3000,3000,3000]],
  ['iron', [0.27,11,7,10,8,11,8,15], [40,40,40,40,40,45,40,45]],
  ['zinc', [2,3,3,5,8,11,8,9], [4,5,7,12,23,34,23,34]],
  ['phosphorus', [100,275,460,500,1250,1250,1250,1250], [null,null,3000,3000,4000,4000,4000,4000]],
  ['magnesium', [30,75,80,130,240,410,240,360], [null,null,65,110,350,350,350,350]],
  ['iodine', [110,130,90,90,120,150,120,150], [null,null,200,300,600,900,600,900]],
  ['selenium', [15,20,20,30,40,55,40,55], [45,60,90,150,280,400,280,400]],
  ['copper', [200,220,340,440,700,890,700,890], [null,null,1000,3000,5000,8000,5000,8000]],
  ['manganese', [0.003,0.6,1.2,1.5,1.9,2.2,1.6,1.6], [null,null,2,3,6,9,6,9]],
  ['chromium', [0.2,5.5,11,15,25,35,21,24], [null,null,null,null,null,null,null,null]],
  ['molybdenum', [2,3,17,22,34,43,34,43], [null,null,300,600,1100,1700,1100,1700]],
  ['fluoride', [0.01,0.5,0.7,1,2,3,2,3], [0.7,0.9,1.3,2.2,10,10,10,10]],
];
const GROUPS: [number, Sex][] = [[3,'male'],[8,'female'],[24,'male'],[60,'female'],[120,'male'],[180,'male'],[120,'female'],[180,'female']];
const ALWAYS_AI = new Set(['vitamin-k','pantothenic-acid','biotin','choline','manganese','chromium','fluoride']);
const row = (id: string, months = 24, sex: Sex = 'female') => getDri(months, sex).rows.find((r) => r.id === id)!;

describe('26 nutrient reference rows, both sexes and every pediatric age group', () => {
  for (const [id, intakes, limits] of EXPECTED) {
    it(`${id}: all 8 source groups match intake, type and UL`, () => {
      GROUPS.forEach(([months, sex], index) => {
        const result = row(id, months, sex);
        expect(result.intake, `${id}, ${months} months, ${sex}`).toBe(intakes[index]);
        expect(result.ul, `${id} UL, ${months} months, ${sex}`).toBe(limits[index]);
        const ai = ALWAYS_AI.has(id) || index === 0 || (index === 1 && id !== 'iron' && id !== 'zinc');
        expect(result.intakeType).toBe(ai ? 'AI' : 'RDA');
        expect(result.source.url).toMatch(/^https:\/\/www\.canada\.ca\/.*#tbl[123]$/);
      });
    });
  }

  it('keeps 14 vitamins and 12 minerals, with no duplicate rows or missing numbers', () => {
    for (const [months, sex] of GROUPS) {
      const rows = getDri(months, sex).rows;
      expect(rows.filter((r) => r.category === 'Vitamin')).toHaveLength(14);
      expect(rows.filter((r) => r.category === 'Mineral')).toHaveLength(12);
      expect(new Set(rows.map((r) => r.id)).size).toBe(26);
      for (const r of rows) {
        expect(r.intake).toBeGreaterThan(0);
        if (r.ul !== null) expect(r.ul).toBeGreaterThan(0);
        expect(r.unit).toContain('/day');
      }
    }
  });
});

describe('age boundaries and explicit nutrient-specific infant exceptions', () => {
  it.each([
    [5.999,40,200,25], [6,40,260,38], [6.999,40,260,38],
    [7,50,260,38], [11.999,50,260,38], [12,15,700,63],
  ])('at %d months: C %d, calcium %d, vitamin D UL %d', (months, c, calcium, vitaminDul) => {
    expect(row('vitamin-c', months).intake).toBe(c);
    expect(row('calcium', months).intake).toBe(calcium);
    expect(row('vitamin-d', months).ul).toBe(vitaminDul);
  });
  it.each([[47.999,300],[48,400],[107.999,400],[108,600],[167.999,600],[168,700],[227.999,700]])(
    'female vitamin A at %d months is %d µg RAE/day', (months, expected) => {
      expect(row('vitamin-a', months).intake).toBe(expected);
    });
  it('identifies each age group correctly where a single group label would be misleading', () => {
    const result = getDri(6.5, 'male');
    expect(result.ageGroupLabel).toBe('0 to <7 months');
    expect(row('calcium', 6.5).ageGroupLabel).toBe('6 to <12 months');
    expect(row('vitamin-a', 6.5).ageGroupLabel).toBe('0 to <7 months');
    expect(result.notes.join(' ')).toContain('footnotes explicitly switch at 6 months');
  });
  it.each([-1,NaN,Infinity,228])('rejects out-of-scope age %s', (age) => expect(() => getDri(age, 'male')).toThrow(RangeError));
  it('rejects unsupported sex instead of assigning the wrong reference', () => expect(() => getDri(12, 'unknown' as Sex)).toThrow(RangeError));
});

describe('chemical units, UL scope and source qualifications', () => {
  it('does not label folic acid UL as dietary folate equivalents', () => {
    const folate = row('folate');
    expect(folate.unit).toBe('µg DFE/day');
    expect(folate.ulUnit).toBe('µg folic acid/day');
    expect(folate.ulNote).toContain('not µg DFE');
  });
  it('limits magnesium UL to non-food intake even when UL is less than RDA', () => {
    const magnesium = row('magnesium');
    expect(magnesium.intake).toBe(80);
    expect(magnesium.ul).toBe(65);
    expect(magnesium.ulNote).toContain('excludes magnesium in food and water');
  });
  it('preserves preformed/synthetic vitamin UL scopes and infant niacin basis', () => {
    expect(row('vitamin-a').ulNote).toContain('Preformed');
    expect(row('vitamin-e').ulNote).toContain('Synthetic');
    expect(row('niacin').ulNote).toContain('Synthetic');
    expect(row('niacin', 3).unit).toBe('mg/day preformed niacin');
    expect(row('niacin', 8).unit).toBe('mg NE/day');
  });
  it('distinguishes no UL from zero and warns it does not guarantee safety', () => {
    expect(row('vitamin-k').ul).toBeNull();
    expect(row('vitamin-k').ulNote).toContain('not a statement');
    expect(getDri(24, 'male').notes.join(' ')).toContain('does not mean unlimited');
  });
  it('preserves iron menstruation assumptions and diet modifiers without silent adjustment', () => {
    expect(row('iron', 120, 'female').notes.join(' ')).toContain('do not menstruate');
    expect(row('iron', 180, 'female').notes.join(' ')).toContain('older menstruate');
    expect(row('iron').notes.join(' ')).toContain('1.8 times');
    expect(row('zinc').notes.join(' ')).toContain('50%');
  });
  it('returns independent arrays so UI edits cannot mutate the reference table', () => {
    const before = getDri(24, 'female');
    before.rows[0]!.intake = 999;
    before.rows[0]!.notes.push('changed');
    expect(row('vitamin-a').intake).toBe(300);
    expect(row('vitamin-a').notes).not.toContain('changed');
  });
});
