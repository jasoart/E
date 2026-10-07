#!/usr/bin/env python3
"""Convert pinned CMUdict American phonemes to a documented KK display layer."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CMU_COMMIT = '74790861f652b15e4ac49015a90074ad62a27690'
# ARPAbet vowel inventory mapped to American KK symbols, not British IPA.
VOWELS = {'AA': 'ɑ', 'AE': 'æ', 'AH': 'ʌ', 'AO': 'ɔ', 'AW': 'aʊ',
          'AY': 'aɪ', 'EH': 'ɛ', 'ER': 'ɝ', 'EY': 'e', 'IH': 'ɪ',
          'IY': 'i', 'OW': 'o', 'OY': 'ɔɪ', 'UH': 'ʊ', 'UW': 'u'}
CONSONANTS = dict(zip(
    'B CH D DH F G HH JH K L M N NG P R S SH T TH V W Y Z ZH'.split(),
    'b tʃ d ð f g h dʒ k l m n ŋ p r s ʃ t θ v w j z ʒ'.split()))
# CMUdict has no syllable boundaries. Stress placement uses the longest
# permissible consonant onset; this is an explicitly labelled conversion.
ONSETS = {tuple(value.split()) for value in (
    'P R', 'B R', 'T R', 'D R', 'K R', 'G R', 'F R', 'TH R', 'SH R',
    'P L', 'B L', 'K L', 'G L', 'F L', 'S L', 'S M', 'S N', 'S P',
    'S T', 'S K', 'S W', 'T W', 'K W', 'D W', 'G W', 'S P L',
    'S P R', 'S T R', 'S K R', 'S K W')}
ONSETS.update((name,) for name in CONSONANTS if name != 'NG')


def to_kk(phones):
    vowel_positions = [i for i, token in enumerate(phones) if token[:-1] in VOWELS and token[-1:] in '012']
    stress_at = {}
    previous = -1
    for position in vowel_positions:
        stress = phones[position][-1]
        onset = previous + 1
        if previous >= 0:
            onset = position
            for start in range(previous + 1, position):
                if tuple(phones[start:position]) in ONSETS:
                    onset = start
                    break
        if stress in '12':
            stress_at[onset] = 'ˋ' if stress == '1' else 'ˏ'
        previous = position
    symbols = []
    for position, token in enumerate(phones):
        base, stress = (token[:-1], token[-1]) if token[-1:].isdigit() else (token, '')
        if base in VOWELS:
            symbol = 'ə' if base == 'AH' and stress == '0' else 'ɚ' if base == 'ER' and stress == '0' else VOWELS[base]
        else:
            symbol = CONSONANTS[base]
        symbols.append(stress_at.get(position, '') + symbol)
    return '[' + ''.join(symbols) + ']'


def aliases(word):
    result = []
    for variant in word.split('/'):
        variant = variant.strip().lower().replace('’', "'")
        match = re.fullmatch(r'([^()]+)\(([^()]+)\)', variant)
        if match:
            stem, body = match.groups()
            result += [stem, 'argument' if variant == 'argue(argument)' else stem + body]
        elif re.fullmatch(r"[a-z]+(?:[-'][a-z]+)*", variant):
            result.append(variant)
    if word == 'neither adj./adv./pron./':
        result = ['neither']
    if word == 'sportsman/sportswoma n':
        result = ['sportsman', 'sportswoman']
    return list(dict.fromkeys(result))


def build(dictionary, words):
    entries = {}
    for word in words:
        variants = []
        for alias in aliases(word):
            for phones in dictionary.get(alias, []):
                value = to_kk(phones)
                if not any(item['value'] == value for item in variants):
                    variants.append({'word': alias, 'value': value, 'phones': phones})
        if variants:
            entries[word] = variants
    return {'source': 'CMU Pronouncing Dictionary', 'sourceUrl': 'https://github.com/cmusphinx/cmudict',
            'commit': CMU_COMMIT, 'notation': 'KK 美式音段轉寫（CMUdict 自動轉換，重音位置依音節規則推估）',
            'method': 'CMUdict ARPAbet American phonemes mapped to KK; not relabelled ECDICT IPA. Alternate pronunciations are retained without invented part-of-speech assignment.',
            'entries': entries, 'coveredWords': len(entries), 'requestedWords': len(words)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dictionary', type=Path, required=True)
    parser.add_argument('--sha256', required=True, help='Expected hash of the pinned CMUdict artifact')
    parser.add_argument('--notebook', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'assets/data/kk-pronunciation.js')
    args = parser.parse_args()
    payload = args.dictionary.read_bytes()
    if hashlib.sha256(payload).hexdigest() != args.sha256:
        raise SystemExit('CMUdict checksum mismatch; refusing to generate pronunciation data.')
    dictionary = {}
    for line in payload.decode().splitlines():
        if not line.strip() or line.startswith(';;;'):
            continue
        parts = line.split('#', 1)[0].split()
        word = re.sub(r'\(\d+\)$', '', parts[0])
        dictionary.setdefault(word, []).append(parts[1:])
    script = "const fs=require('fs'),vm=require('vm'),c={};vm.createContext(c);vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),c);console.log(vm.runInContext('JSON.stringify(VOCABULARY.map(x=>x.word))',c));"
    result = subprocess.run(['node', '-e', script, str(ROOT / 'assets/data/vocabulary.js')], check=True, capture_output=True, text=True)
    words = json.loads(result.stdout)
    if args.notebook:
        extra = json.loads(args.notebook.read_text())
        words += [row['word'] for row in extra.get('supplemental', [])]
    data = build(dictionary, list(dict.fromkeys(words)))
    data['dictionarySha256'] = args.sha256
    args.output.write_text('"use strict";\n// Derived from CMUdict; copyright and redistribution terms: cmudict.LICENSE.txt\nconst GSAT_KK_PRONUNCIATION = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f"KK converted from pinned CMUdict: {data['coveredWords']}/{data['requestedWords']} word IDs; alternate pronunciations retained.")


if __name__ == '__main__':
    main()
