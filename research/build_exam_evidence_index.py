#!/usr/bin/env python3
"""Index verified citation headwords and years without loading their quotations."""
import argparse
import hashlib
import json
from pathlib import Path
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets' / 'data' / 'exam-evidence.json'
OUTPUT = ROOT / 'assets' / 'data' / 'exam-evidence-index.js'


def build_index(data, source_hash):
    years = {}
    records = data['records']
    for record in records:
        year = str(record['year'])
        if year not in {'111', '112', '113', '114', '115'}:
            raise ValueError(f'Unsupported citation year: {year}')
        for headword in record.get('headwords') or [record['headword']]:
            key = ' '.join(unicodedata.normalize('NFKC', headword).lower().replace('’', "'").split())
            if not key:
                raise ValueError('Citation headword cannot be empty')
            years.setdefault(key, set()).add(year)
    return {
        'schemaVersion': 1,
        'sourceFile': 'exam-evidence.json',
        'sourceSha256': source_hash,
        'recordCount': len(records),
        'yearsByHeadword': {word: sorted(values, key=int) for word, values in sorted(years.items())},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='check the generated index without writing')
    args = parser.parse_args()
    source = SOURCE.read_bytes()
    index = build_index(json.loads(source), hashlib.sha256(source).hexdigest())
    generated = ('"use strict";\n'
                 '// Citation years only; quotation text stays in the lazily loaded exam-evidence.json.\n'
                 'const GSAT_EXAM_EVIDENCE_INDEX = '
                 + json.dumps(index, ensure_ascii=False, separators=(',', ':')) + ';\n')
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != generated:
            raise SystemExit('Citation year index differs from its source. Run research/build_exam_evidence_index.py.')
    else:
        OUTPUT.write_text(generated)
    print(f"Indexed {index['recordCount']} verified records for {len(index['yearsByHeadword'])} headwords; quotation text remains lazy.")


if __name__ == '__main__':
    main()
