import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('kk_builder', ROOT / 'tools/build_kk_pronunciation.py')
KK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(KK)


class KKPronunciationTests(unittest.TestCase):
    def test_american_vowels_are_transcribed_not_relabelled_ipa(self):
        self.assertEqual(KK.to_kk('T AY1 T'.split()), '[ˋtaɪt]')
        self.assertEqual(KK.to_kk('IH0 G Z AE1 S ER0 B EY2 T'.split()), '[ɪgˋzæsɚˏbet]')
        self.assertEqual(KK.to_kk('R IH0 S P AA1 N S IH0 V'.split()), '[rɪˋspɑnsɪv]')
        self.assertEqual(KK.to_kk('EH1 L B OW2'.split()), '[ˋɛlˏbo]')

    def test_stress_and_schwa_follow_cmu_phonemes(self):
        self.assertEqual(KK.to_kk('AH0 B AW1 T'.split()), '[əˋbaʊt]')
        self.assertEqual(KK.to_kk('W ER1 K ER0'.split()), '[ˋwɝkɚ]')

    def test_aliases_keep_explicit_words_and_do_not_guess_derivatives(self):
        self.assertEqual(KK.aliases('argue(argument)'), ['argue', 'argument'])
        self.assertEqual(KK.aliases('actor/actress'), ['actor', 'actress'])
        self.assertEqual(KK.aliases('neither adj./adv./pron./'), ['neither'])
        self.assertEqual(KK.aliases('abandon'), ['abandon'])

    def test_alternatives_and_missing_words_are_honest(self):
        dictionary = {'read': ['R IY1 D'.split(), 'R EH1 D'.split()]}
        data = KK.build(dictionary, ['read', 'nonexistent'])
        self.assertEqual([x['value'] for x in data['entries']['read']], ['[ˋrid]', '[ˋrɛd]'])
        self.assertNotIn('nonexistent', data['entries'])
        self.assertEqual(data['coveredWords'], 1)
        self.assertIn('推估', data['notation'])


if __name__ == '__main__':
    unittest.main()
