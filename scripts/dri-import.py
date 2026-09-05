"""Rebuild pediatric DRI data from Health Canada's published HTML tables.

Requires Python 3 and beautifulsoup4. Downloads public reference data only.
Run from the repository root: python3 scripts/dri-import.py
The explicit column map is audited against each source table's multilevel header.
No patient data is accepted or transmitted.
"""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

from bs4 import BeautifulSoup

BASE = 'https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/'
# table index, intake cell, UL cell, nutrient identifier. Cell 0 is the age label.
MAP = {
    'vitamins': [
        (0, 2, 3, 'vitamin-a'), (1, 2, 3, 'vitamin-c'),
        (0, 8, 9, 'vitamin-d'), (0, 14, 15, 'vitamin-e'),
        (0, 16, 17, 'vitamin-k'), (1, 5, 6, 'thiamin'),
        (1, 8, 9, 'riboflavin'), (1, 11, 12, 'niacin'),
        (1, 14, 15, 'vitamin-b6'), (2, 2, 3, 'folate'),
        (2, 5, 6, 'vitamin-b12'), (2, 7, 8, 'pantothenic-acid'),
        (2, 9, 10, 'biotin'), (2, 11, 12, 'choline'),
    ],
    'elements': [
        (0, 6, 7, 'calcium'), (1, 2, 3, 'iron'),
        (2, 9, 10, 'zinc'), (1, 15, 16, 'phosphorus'),
        (1, 5, 6, 'magnesium'), (0, 16, 17, 'iodine'),
        (2, 2, 3, 'selenium'), (0, 11, 12, 'copper'),
        (1, 7, 8, 'manganese'), (0, 8, 9, 'chromium'),
        (1, 10, 11, 'molybdenum'), (0, 13, 14, 'fluoride'),
    ],
}
GROUPS = ['infant-young', 'infant-older', 'child-1-3', 'child-4-8',
          'male-9-13', 'male-14-18', 'female-9-13', 'female-14-18']


def group_key(section, age):
    age = age.replace('–', '-').replace('\xa0', ' ')
    if section == 'Infants':
        return 'infant-young' if age.startswith('0-6') else 'infant-older'
    if section == 'Children':
        return 'child-1-3' if age.startswith('1-3') else 'child-4-8'
    if section in ('Males', 'Females') and age.startswith(('9-13', '14-18')):
        return ('male-' if section == 'Males' else 'female-') + age.split()[0]
    return None


def main():
    output = {}
    evidence = {'retrievedAt': datetime.now(timezone.utc).isoformat(), 'groupOrder': GROUPS, 'sources': []}
    for family, mapping in MAP.items():
        url = BASE + 'reference-values-' + family + '.html'
        raw = urlopen(url, timeout=30).read()
        soup = BeautifulSoup(raw, 'html.parser')
        source = {'url': url, 'sha256': hashlib.sha256(raw).hexdigest(), 'tables': []}
        tables = []
        for table in soup.select('table'):
            rows = {}
            section = ''
            for tr in table.select('tbody tr'):
                cells = tr.find_all(['td', 'th'], recursive=False)
                if len(cells) == 1:
                    section = cells[0].get_text(' ', strip=True)
                    continue
                if not cells:
                    continue
                key = group_key(section, cells[0].get_text(' ', strip=True))
                if key is None:
                    continue
                row = []
                for i, cell in enumerate(cells):
                    refs = [sup.get_text(' ', strip=True) for sup in cell.select('sup')]
                    for sup in cell.select('sup'):
                        sup.decompose()
                    text = cell.get_text(' ', strip=True)
                    row.append({'text': text, 'ai': any('*' in ref for ref in refs)})
                assert key not in rows, (url, table.get('id'), key)
                rows[key] = row
            assert set(rows) == set(GROUPS), (url, table.get('id'), rows.keys())
            tables.append(rows)
            source['tables'].append({'id': table.get('id'), 'rows': rows})
        evidence['sources'].append(source)
        for table, intake_col, ul_col, nutrient in mapping:
            values = []
            for key in GROUPS:
                row = tables[table][key]
                intake, ul = row[intake_col], row[ul_col]
                parse = lambda cell: None if cell['text'] == 'ND' else float(cell['text'].replace(',', ''))
                values.append([parse(intake), 'AI' if intake['ai'] else 'RDA', parse(ul)])
            output[nutrient] = {'source': url + '#tbl' + str(table + 1), 'values': values}
    path = Path('src/clinical/data')
    path.mkdir(parents=True, exist_ok=True)
    (path / 'dri-provenance.json').write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + '\n')
    (path / 'dri-values.json').write_text(json.dumps(output, indent=2, ensure_ascii=False) + '\n')
    print(f'Imported {len(output)} nutrients across {len(GROUPS)} pediatric age/sex groups from Health Canada.')


if __name__ == '__main__':
    main()
