"""Compare all bundled DRI cells with the separate Health Canada calculator CSV.

Read-only network request, synthetic reference data only. Uses Python standard
library; no additional packages required. This checks the numeric table cells;
age-boundary and chemical-scope differences are verified by tests and documented.
"""
import csv
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

url = 'https://health-infobase.canada.ca/src/data/nutrition/dietary-reference-intakes-calculator/Micronutrients_table-en.csv'
raw = urlopen(url, timeout=30).read()
rows = list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
lookup = {(r['Nutrient'].strip().lower().replace(' ', '-'), r['Sex'], r['Age']): r for r in rows}
groups = [('Both', '0-6 months'), ('Both', '7-12 months'), ('Both', '1-3 years'), ('Both', '4-8 years'),
          ('Male', '9-13 years'), ('Male', '14-18 years'), ('Female', '9-13 years'), ('Female', '14-18 years')]
data = json.loads(Path('src/clinical/data/dri-values.json').read_text())
differences = []
checked = 0
for nutrient, table in data.items():
    for index, (sex, age) in enumerate(groups):
        source = lookup[(nutrient, sex, age)]
        intake = source['AI'] or source['RDA']
        expected = [float(intake), 'AI' if source['AI'] else 'RDA', float(source['UL']) if source['UL'] else None]
        actual = table['values'][index]
        checked += 3
        if actual != expected:
            differences.append({'nutrient': nutrient, 'sex': sex, 'age': age, 'table': actual, 'calculatorCsv': expected})
report = {'verifiedAt': datetime.now(timezone.utc).isoformat(), 'source': url,
          'sha256': hashlib.sha256(raw).hexdigest(), 'nutrientGroups': len(data) * len(groups),
          'checkedFields': checked, 'differences': differences}
Path('src/clinical/data/dri-verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'Checked {checked} fields in {report["nutrientGroups"]} nutrient/age/sex rows; {len(differences)} differences.')
raise SystemExit(1 if differences else 0)
