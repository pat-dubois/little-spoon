"""Rebuild vendored WHO reference data from pinned, authoritative sources.

Python standard library only. Run from any directory. No patient data involved.
Each downloaded source is hashed in sources.json; no runtime network requests.
"""
import csv
import hashlib
import io
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'src/clinical/data/growth'
PINS = {
    'anthro': 'b776d8a12b1c97369c748b561159fd2ec4f4db58',
    'anthroplus': '7cfcdb39026e9a55de55732bc3cf14c82261bcf7',
}
TABLES = {
    'anthro': ['weianthro', 'lenanthro', 'bmianthro', 'hcanthro', 'wflanthro', 'wfhanthro'],
    'anthroplus': ['wfawho2007', 'hfawho2007', 'bfawho2007'],
}


def download(repo, path):
    url = f'https://raw.githubusercontent.com/WorldHealthOrganization/{repo}/{PINS[repo]}/{path}'
    with urllib.request.urlopen(url) as response:
        data = response.read()
    return data, {'url': url, 'sha256': hashlib.sha256(data).hexdigest()}


def write_json(name, data):
    (OUT / name).write_text(json.dumps(data, separators=(',', ':'), allow_nan=False) + '\n')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sources = {'retrieved': '2026-09-05', 'pins': PINS, 'files': {}}
    for repo, tables in TABLES.items():
        for name in tables:
            data, provenance = download(repo, f'data-raw/growthstandards/{name}.txt')
            table = {'male': [], 'female': []}
            for row in csv.DictReader(io.StringIO(data.decode()), delimiter='\t'):
                key = next(k for k in ('age', 'length', 'height') if k in row)
                table['male' if row['sex'] == '1' else 'female'].append(
                    [float(row[k]) for k in (key, 'l', 'm', 's')]
                )
            for rows in table.values():
                assert all(rows[i][0] < rows[i + 1][0] for i in range(len(rows) - 1))
                assert all(row[2] > 0 and row[3] > 0 for row in rows)
            provenance['rows'] = sum(len(rows) for rows in table.values())
            sources['files'][name] = provenance
            write_json(f'{name}.json', table)
    data, provenance = download('anthroplus', 'data-raw/survey_who2007_z.csv')
    fixture = []
    for row in csv.DictReader(io.StringIO(data.decode())):
        fixture.append({
            'id': int(row['id']), 'sex': 'male' if row['sex'] == '1' else 'female',
            'ageMonths': float(row['agemons']) if row['agemons'] else None,
            'weightKg': float(row['weight']) if row['weight'] else None,
            'heightCm': float(row['height']) if row['height'] else None, 'oedema': row['oedema'] == 'y',
            'expected': {key: float(row[col]) if row[col] else None for key, col in [
                ('weightForAge', 'zwfa'), ('heightForAge', 'zhfa'), ('bmiForAge', 'zbfa')
            ]},
        })
    provenance['rows'] = len(fixture)
    sources['files']['who2007-fixtures'] = provenance
    write_json('who2007-fixtures.json', fixture)
    data, provenance = download('anthro', 'LICENSE.md')
    (OUT / 'WHO-LICENSE.txt').write_bytes(data)
    sources['files']['license'] = provenance
    write_json('sources.json', sources)
    print(f'Imported {sum(v.get("rows", 0) for v in sources["files"].values())} reference and fixture rows.')


if __name__ == '__main__':
    main()
