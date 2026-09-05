"""Independent standard-normal probabilities from the Python C library erfc."""
import json
import math
from pathlib import Path

points = {i / 20 for i in range(-200, 201)}
points.update([-38, -20, -10, -8, -1e-9, 1e-9, 8, 10, 20, 38])
points.update(sign * (math.sqrt(3) + delta) for sign in (-1, 1) for delta in (-1e-10, 0, 1e-10))
rows = [[z, 0.5 * math.erfc(-z / math.sqrt(2))] for z in sorted(points)]
out = Path(__file__).resolve().parents[1] / 'src/clinical/data/growth/normal-cdf-fixtures.json'
out.write_text(json.dumps({'source': 'Python standard-library math.erfc, C-library implementation; independent of application gamma series/continued fraction', 'values': rows}, separators=(',', ':')) + '\n')
print(f'Wrote {len(rows)} normal probabilities.')
