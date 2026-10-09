#!/usr/bin/env python3
"""One dependency-free validation entry point shared by local development and CI."""
import argparse
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--suite', choices=('core', 'browser', 'all'), default='core')
    args = parser.parse_args()
    commands = []
    if args.suite in ('core', 'all'):
        tests = sorted(str(path.relative_to(ROOT)) for path in (ROOT / 'tests').glob('*.cjs'))
        if not tests:
            parser.error('No JavaScript test files found')
        commands.extend([
            ['node', '--test', *tests],
            [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py', '-q'],
            [sys.executable, 'research/build_exam_notebook.py', '--check'],
            ['node', 'research/build_authored_scenarios.cjs', '--check'],
            [sys.executable, 'research/build_exam_evidence_index.py', '--check'],
            [sys.executable, 'research/build_wordnet_learning.py', '--check'],
            [sys.executable, 'tools/validate_site.py'],
        ])
    if args.suite in ('browser', 'all'):
        commands.extend([sys.executable, f'tests/browser_{suite}.py'] for suite in ('builtin', 'notebook', 'learning'))
    for command in commands:
        print('+ ' + ' '.join(command), flush=True)
        result = subprocess.run(command, cwd=ROOT, check=False)
        if result.returncode:
            return result.returncode if result.returncode > 0 else 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
