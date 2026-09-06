"""Read-only numerical audit of the supplied legacy snapshot versus pinned WHO data.

This diagnostic uses Python math.erfc independently of the TypeScript CDF.
The rebuilt engine is tested against official R separately; legacy output is
not an authority. This script never changes the historical files.
"""
import json
import math
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
LEGACY = (ROOT / 'legacy/littlespoon/index.html').read_text()
DATA = ROOT / 'src/clinical/data/growth'


def old_table(name):
    return json.loads(re.search(rf'{name}:\s*(\[\[.*?\]\])', LEGACY).group(1))


def interp(rows, value):
    if value <= rows[0][0]:
        return rows[0][1:]
    if value >= rows[-1][0]:
        return rows[-1][1:]
    for lower, upper in zip(rows, rows[1:]):
        if lower[0] <= value <= upper[0]:
            f = (value - lower[0]) / (upper[0] - lower[0])
            return [a + (b - a) * f for a, b in zip(lower[1:], upper[1:])]
    raise ValueError(value)


def zscore(value, lms, adjusted=False):
    l, m, s = lms
    raw = math.log(value / m) / s if l == 0 else math.expm1(l * math.log(value / m)) / (l * s)
    if not adjusted or abs(raw) <= 3:
        return raw
    sign = 1 if raw > 0 else -1
    at3 = m * (1 + l * s * sign * 3) ** (1 / l)
    at2 = m * (1 + l * s * sign * 2) ** (1 / l)
    return sign * 3 + (value - at3) / abs(at3 - at2)


def legacy_cdf(z):
    if z < -6:
        return 0
    if z > 6:
        return 1
    t = 1 / (1 + 0.3275911 * abs(z))
    tail = (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * math.exp(-z * z / 2)) / 2
    return tail if z < 0 else 1 - tail


def rows(name):
    return json.loads((DATA / f'{name}.json').read_text())['male']


def main():
    wfa = rows('weianthro')
    cases = [
        ('Inherited case, boy day 123 / 5 kg, WFA', 5, interp(old_table('wfa_boys'), 123 / 30.4375), wfa[123][1:], True),
        ('Boy day 1 / 3.3174 kg, WFA', 3.3174, interp(old_table('wfa_boys'), 1 / 30.4375), wfa[1][1:], True),
        ('Boy day 731 / BMI 16, BMI for age', 16, interp(old_table('bmi_boys'), 731 / 30.4375), rows('bmianthro')[731][1:], True),
        ('Boy day 1000 / 90 cm standing / 12 kg, WFH', 12, interp(old_table('wfl_boys'), 90), interp(rows('wfhanthro'), 90), True),
        ('Boy day 123 / 15 kg, extreme WFA', 15, interp(old_table('wfa_boys'), 123 / 30.4375), wfa[123][1:], True),
    ]
    for name, value, old_lms, new_lms, adjusted in cases:
        old_z = zscore(value, old_lms)
        new_z = zscore(value, new_lms, adjusted)
        print(json.dumps({'case': name, 'legacyZ': old_z, 'whoZ': new_z,
            'legacyPercentile': 100 * legacy_cdf(old_z),
            'correctPercentile': 50 * math.erfc(-new_z / math.sqrt(2))}))


if __name__ == '__main__':
    main()
