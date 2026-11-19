#!/usr/bin/env python3
"""Build the explicitly curated GSAT notebook; never modify the original vocabulary."""
import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'research' / 'exam_notebook.json'
FUNCTION_SOURCE = ROOT / 'research' / 'function_word_notes.json'
OUTPUT = ROOT / 'assets' / 'data' / 'exam-notebook.js'
POS = {'n.', 'v.', 'vt.', 'vi.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'interj.', 'art.', 'aux.'}

def valid_pos(value):
    return value == 'n. pl.' or bool(value) and all(atom in POS for atom in value.split('/'))
IRREGULAR = {'bear': ['bore','borne','born'], 'break': ['broke','broken'], 'draw': ['drew','drawn'], 'feed': ['fed'], 'fit': ['fitted'], 'mean': ['meant'], 'head': ['headed'], 'light':['lit','lighted'], 'strike':['struck','stricken'], 'last':['lasted'], 'rest':['rested'], 'shift':['shifted'], 'suit':['suited'], 'treat':['treated'], 'board':['boarding','boarded']}

def validate(data):
    entries = data['entries']
    errors = []
    examples = set()
    for word, entry in entries.items():
        if word != word.strip() or not word:
            errors.append(f'{word!r}: invalid headword')
        if not entry.get('senses'):
            errors.append(f'{word}: missing senses')
        for sense in entry.get('senses', []):
            if not sense.get('meaning') or not valid_pos(sense.get('pos', '')):
                errors.append(f'{word}: sense missing meaning or invalid POS')
        teaching_field = 'grammarPatterns' if entry.get('kind') == 'grammar' else 'collocations'
        if len(entry.get(teaching_field, [])) < 4:
            errors.append(f'{word}: fewer than four {teaching_field}')
        if entry.get('kind') == 'grammar' and entry.get('collocations'):
            errors.append(f'{word}: grammar patterns must not be counted as collocations')
        for collection in ('collocations', 'grammarPatterns', 'synonyms', 'idioms'):
            chunks = set()
            for phrase in entry.get(collection, []):
                if not phrase.get('en') or not phrase.get('zh'):
                    errors.append(f'{word}: {collection} missing bilingual text')
                if collection in ('collocations', 'grammarPatterns'):
                    normalized = phrase.get('en', '').casefold()
                    if normalized in chunks:
                        errors.append(f'{word}: duplicate chunk {normalized}')
                    chunks.add(normalized)
        for collection in ('family', 'forms'):
            for item in entry.get(collection, []):
                if not all(item.get(key) for key in ('word', 'pos', 'meaning')) or not valid_pos(item.get('pos', '')):
                    errors.append(f'{word}: incomplete {collection} item or invalid POS')
        for reference in entry.get('references', []):
            url = urlsplit(reference.get('url', ''))
            if not reference.get('label') or url.scheme != 'https' or not url.hostname or url.username or url.password:
                errors.append(f'{word}: invalid reference label or HTTPS URL')
        if len(entry.get('examples', [])) < 2:
            errors.append(f'{word}: fewer than two sentences')
        targets = {word, word+'s', word+'es', word+'d', word+'ed', word+'ing', word.rstrip('e')+'ing', word[:-1]+'ies' if word.endswith('y') else word, word[:-1]+'ied' if word.endswith('y') else word}
        if re.search(r'[aeiou][bcdfghjklmnpqrstvwxyz]$', word):
            targets.update({word + word[-1] + 'ing', word + word[-1] + 'ed'})
        targets.update(IRREGULAR.get(word, []))
        for example in entry.get('examples', []):
            text = example.get('text', '')
            tokens = re.findall(r"[A-Za-z]+(?:[-'][A-Za-z]+)*", text)
            if not 10 <= len(tokens) <= 26:
                errors.append(f'{word}: sentence has {len(tokens)} words: {text}')
            normalized = re.sub(r'\s+', ' ', text).strip().casefold()
            if normalized in examples:
                errors.append(f'{word}: duplicate sentence')
            examples.add(normalized)
            if not example.get('translationZh') or not re.search('[\u3400-\u9fff]', example['translationZh']):
                errors.append(f'{word}: missing Chinese translation')
            if example.get('source') != 'self-authored':
                errors.append(f'{word}: incorrect sentence provenance')
            if not targets.intersection(token.casefold() for token in tokens):
                errors.append(f'{word}: target/family absent from sentence: {text}')
            if not all(example.get(key) for key in ('grammar', 'writingTip', 'topic')):
                errors.append(f'{word}: missing sentence-specific contextual guidance')
    if errors:
        raise ValueError('\n'.join(errors))
    return {'headwords': len(entries), **{
        field: sum(len(e.get(field, [])) for e in entries.values())
        for field in ('collocations', 'grammarPatterns', 'examples', 'senses', 'synonyms', 'idioms', 'family', 'forms')
    }}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='check source and generated output without writing')
    args = parser.parse_args()
    data = json.loads(SOURCE.read_text())
    function_notes = json.loads(FUNCTION_SOURCE.read_text())
    duplicates = data['entries'].keys() & function_notes['entries'].keys()
    if duplicates:
        raise ValueError('Duplicate editorial headwords: ' + ', '.join(sorted(duplicates)))
    data['entries'].update(function_notes['entries'])
    data['sourceFiles'] = [str(path.relative_to(ROOT)) for path in (SOURCE, FUNCTION_SOURCE)]
    data['stats'] = validate(data)
    result = '"use strict";\n// Curated learning notes; examples are original practice, not quotations from exam papers.\nconst GSAT_EXAM_NOTEBOOK = ' + json.dumps(data, ensure_ascii=False, separators=(',',':')) + ';\n'
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != result:
            raise SystemExit('Generated notebook differs from source. Run research/build_exam_notebook.py.')
    else:
        OUTPUT.write_text(result)
    print(json.dumps(data['stats'], ensure_ascii=False))

if __name__ == '__main__':
    main()
