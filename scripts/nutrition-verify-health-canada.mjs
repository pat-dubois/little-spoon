/** Independent comparison with Health Canada's calculator implementation.
 * Runs only synthetic fixtures. No patient data is accepted or transmitted.
 * Requires Node 22.13+ with built-in TypeScript stripping.
 * Downloaded official code is kept in a fresh OS temporary directory for audit.
 */
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const folder = await mkdtemp(join(tmpdir(), 'little-spoon-health-canada-'));
await writeFile(join(folder, 'package.json'), '{"type":"module"}\n');
const sources = [];
for (const name of ['constants.js', 'EER_Equations.js']) {
  const url = `https://health-infobase.canada.ca/src/js/nutrition/dietary-reference-intakes-calculator/${name}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Reference fetch failed: ${response.status} ${url}`);
  const source = await response.text();
  await writeFile(join(folder, name), source);
  sources.push({ url, sha256: createHash('sha256').update(source).digest('hex') });
}
const clinicalSource = await readFile(new URL('../src/clinical/nutrition.ts', import.meta.url), 'utf8');
const compiled = stripTypeScriptTypes(clinicalSource);
await writeFile(join(folder, 'little-spoon.js'), compiled);
const official = await import(pathToFileURL(join(folder, 'EER_Equations.js')).href);
const local = await import(pathToFileURL(join(folder, 'little-spoon.js')).href);
const activities = ['inactive', 'low-active', 'active', 'very-active'];
const ages = [0, 2.999, 3, 5.999, 6, 6.999, 7, 11.999, 12, 35.999, 36, 47.999, 48, 84, 96, 96.1, 102, 107.999, 108, 167.999, 168, 216, 227.999];
const matches = [];
const discrepancies = [];
for (const ageMonths of ages) {
  for (const sex of ['male', 'female']) {
    for (const activity of ageMonths < 36 ? [undefined] : activities) {
      for (const scale of [0.9, 1, 1.1]) {
        const weightKg = (ageMonths < 12 ? 6 : ageMonths < 36 ? 12 : ageMonths < 108 ? 25 : 50) * scale;
        const heightCm = (ageMonths < 12 ? 64 : ageMonths < 36 ? 86 : ageMonths < 108 ? 125 : 160) * scale;
        const input = { ageMonths, sex, weightKg, heightCm, activity };
        const value = local.calculateEnergy(input).value;
        const actual = Math.round(value);
        const person = { age: ageMonths / 12, sex: sex === 'male' ? 'Male' : 'Female', weight: weightKg, height: heightCm,
          activityLevel: activity ? local.ACTIVITY_LABELS[activity] : undefined, isPregnant: false, isBreastFeeding: false };
        const expected = official.CalculationTools.calculateEER(person);
        const record = { input, littleSpoonRounded: actual, healthCanadaRounded: expected };
        if (actual === expected) matches.push(record);
        else {
          // The official published table says 4 to <9 y. The current calculator
          // source changes deposition at age >8 y, up to one year too early.
          const known = ageMonths > 96 && ageMonths < 108 && expected - actual === (sex === 'male' ? 10 : 15);
          discrepancies.push({ ...record, explainedByPublishedTableBoundary: known,
            explanation: known ? 'Published table switches at age 9; official calculator source uses age >8.' : 'Unexplained discrepancy: investigate before release.' });
        }
      }
    }
  }
}
const report = { verifiedAt: new Date().toISOString(), sources,
  reference: 'https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html',
  totalCases: matches.length + discrepancies.length, matchingCases: matches.length,
  explainedDiscrepancies: discrepancies.filter((d) => d.explainedByPublishedTableBoundary).length,
  unexplainedDiscrepancies: discrepancies.filter((d) => !d.explainedByPublishedTableBoundary).length,
  discrepancies };
await writeFile(new URL('../src/clinical/data/nutrition-verification.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ total: report.totalCases, matching: report.matchingCases, explained: report.explainedDiscrepancies, unexplained: report.unexplainedDiscrepancies }));
if (report.unexplainedDiscrepancies > 0) process.exitCode = 1;
