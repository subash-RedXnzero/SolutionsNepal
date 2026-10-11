/**
 * Tests for the Nepali Unicode transliteration engine.
 * Run: node --test tests/nepali-unicode.test.mjs
 *
 * Expected strings are built from codepoints (not literals) so the
 * assertions stay exact regardless of editor encoding.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  romanToNepali,
  convertNepaliNumbers,
  countChars,
} from '../src/lib/calculators/nepali-unicode.js';

// Helper: build an expected Devanagari string from codepoints.
const D = (...cps) => String.fromCodePoint(...cps);

// Codepoint shortcuts for readability
const KA = 2325, KHA = 2326, GA = 2327, GHA = 2328;
const CA = 2330, CHA = 2331, JA = 2332, JHA = 2333;
const TTA = 2335, TTHA = 2336, DDA = 2337, NNA = 2339;
const TA = 2340, THA = 2341, DA = 2342, DHA = 2343, NA = 2344;
const PA = 2346, PHA = 2347, BA = 2348, BHA = 2349, MA = 2350;
const YA = 2351, RA = 2352, LA = 2354, VA = 2357;
const SHA = 2358, SSA = 2359, SA = 2360, HA = 2361;
const AA = 2366, I = 2367, II = 2368, U = 2369, UU = 2370, VOC_R = 2371;
const E = 2375, AI = 2376, O = 2379, AU = 2380, HAL = 2381;
const IND_A = 2309, IND_AA = 2310, IND_I = 2311, IND_II = 2312, IND_U = 2313;
const ANU = 2306, CHAN = 2305, VISARGA = 2307;

test('documented basics: namaste, ta, halant conjuncts', () => {
  assert.equal(romanToNepali('namaste'), D(NA, MA, SA, HAL, TA, E));
  assert.equal(romanToNepali('ta'), D(TA));
  // Lone T/D/N stay retroflex (documented scheme letters); longer
  // capitalized words read sentence-case, so retroflex applies mid-word.
  assert.equal(romanToNepali('T'), D(TTA));
  assert.equal(romanToNepali('kaTa'), D(KA, TTA));
  assert.equal(romanToNepali('sta'), D(SA, HAL, TA));
  assert.equal(romanToNepali('kta'), D(KA, HAL, TA));
});

test('conjunct shortcuts: ksh, gya, tra, shri', () => {
  assert.equal(romanToNepali('ksh'), D(KA, HAL, SSA));
  assert.equal(romanToNepali('gya'), D(JA, HAL, 2334));
  assert.equal(romanToNepali('tra'), D(TA, HAL, RA));
  assert.equal(romanToNepali('shri'), D(SHA, HAL, RA, I));
});

test('long vowels and x/chandrabindu/visarga markers', () => {
  assert.equal(romanToNepali('nepaal'), D(NA, E, PA, AA, LA));
  assert.equal(romanToNepali('hM'), D(HA, CHAN));
  assert.equal(romanToNepali('namaste!'), D(NA, MA, SA, HAL, TA, E) + '!');
});

test('n before velar becomes anusvara (sankalp, bank)', () => {
  assert.equal(romanToNepali('sankalp'), D(SA, ANU, KA, LA, HAL, PA));
  assert.equal(romanToNepali('bank'), D(BA, AI, ANU, KA));
});

test('n before non-velars keeps explicit conjunct', () => {
  assert.equal(romanToNepali('sundar'), D(SA, U, NA, HAL, DA, RA));
  assert.equal(romanToNepali('hunuhunchha'), D(HA, U, NA, U, HA, U, NA, HAL, CHA));
  assert.equal(romanToNepali('janma'), D(JA, NA, HAL, MA));
  assert.equal(romanToNepali('kendra'), D(KA, E, NA, HAL, DA, HAL, RA));
});

test('high-frequency overrides: tapai family, kathmandu', () => {
  assert.equal(romanToNepali('tapai'), D(TA, AA, PA, AA, IND_II, ANU));
  assert.equal(romanToNepali('Tapai'), D(TA, AA, PA, AA, IND_II, ANU));
  assert.equal(romanToNepali('tapailai'), D(TA, AA, PA, AA, IND_II, ANU, LA, AA, IND_II));
  assert.equal(romanToNepali('tapaiko'), D(TA, AA, PA, AA, IND_II, ANU, KA, O));
  assert.equal(romanToNepali('kathmandu'), D(KA, AA, TTHA, MA, AA, DDA, AU, ANU));
});

test('high-frequency overrides: common words', () => {
  assert.equal(romanToNepali('swagat'), D(SA, HAL, VA, AA, GA, TA));
  assert.equal(romanToNepali('dhanyabad'), D(DHA, NA, HAL, YA, VA, AA, DA));
  assert.equal(romanToNepali('dhanyabaad'), D(DHA, NA, HAL, YA, VA, AA, DA));
  assert.equal(romanToNepali('pani'), D(PA, AA, NA, II));
  assert.equal(romanToNepali('bihani'), D(BA, I, HA, AA, NA, II));
  assert.equal(romanToNepali('didi'), D(DA, I, DA, II));
  assert.equal(romanToNepali('chhori'), D(CHA, O, RA, II));
  assert.equal(romanToNepali('bikas'), D(VA, I, KA, AA, SA));
  assert.equal(romanToNepali('barsha'), D(VA, RA, HAL, SSA, AA));
  assert.equal(romanToNepali('nagar'), D(NA, GA, RA));
  assert.equal(romanToNepali('kiran'), D(KA, I, RA, 2339));
  assert.equal(romanToNepali('sansaar'), D(SA, ANU, SA, AA, RA));
  assert.equal(romanToNepali('upahar'), D(IND_U, PA, HA, AA, RA));
  assert.equal(romanToNepali('ramro'), D(RA, AA, MA, HAL, RA, O));
  assert.equal(romanToNepali('khana'), D(KHA, AA, NA, AA));
  assert.equal(romanToNepali('shanti'), D(SHA, AA, NA, HAL, TA, I));
  assert.equal(romanToNepali('sundari'), D(SA, U, NA, HAL, DA, RA, II));
});

test('high-frequency overrides: lai family', () => {
  assert.equal(romanToNepali('lai'), D(LA, AA, IND_II));
  assert.equal(romanToNepali('malai'), D(MA, LA, AA, IND_II));
  assert.equal(romanToNepali('timilai'), D(TA, I, MA, II, LA, AA, IND_II));
  assert.equal(romanToNepali('uslai'), D(IND_U, SA, LA, AA, IND_II));
  assert.equal(romanToNepali('kaslai'), D(KA, SA, LA, AA, IND_II));
  assert.equal(romanToNepali('bank'), D(BA, AI, ANU, KA));
});

test('capitals: sentence case just works', () => {
  const namaste = D(NA, MA, SA, HAL, TA, E);
  assert.equal(romanToNepali('Namaste'), namaste);
  assert.equal(romanToNepali('NAMASTE'), namaste);
  assert.equal(romanToNepali('Hami'), D(HA, MA, I));
  assert.equal(romanToNepali('Hetauda'), D(HA, E, TA, DDA, AA));
  assert.equal(romanToNepali('Maya'), D(MA, AA, MA, AA));
  assert.equal(romanToNepali('Mero'), D(MA, E, RA, O));
  assert.equal(romanToNepali('Malai'), D(MA, LA, AA, IND_II));
  assert.equal(romanToNepali('Hijo'), D(HA, I, JA, O));
  assert.equal(romanToNepali('Nepal'), D(NA, E, PA, AA, LA));
  assert.equal(romanToNepali('NEPAL'), D(NA, E, PA, AA, LA));
  assert.equal(romanToNepali('Ma'), D(MA));
  assert.equal(romanToNepali('Hajur'), D(HA, JA, U, RA));
  assert.equal(romanToNepali('Aaja'), D(IND_AA, JA));
  assert.equal(romanToNepali('Santosh'), D(SA, NA, HAL, TA, O, SHA));
  assert.equal(romanToNepali('Bhai'), D(BHA, AA, IND_II));
  assert.equal(romanToNepali('Chhori'), D(CHA, O, RA, II));
  assert.equal(romanToNepali('Bahadur'), D(BA, HA, AA, DA, U, RA));
  assert.equal(romanToNepali('Mahendra'), D(MA, HA, E, NA, HAL, DA, HAL, RA));
});

test('capitals: deliberate mid-word capitals keep meaning', () => {
  assert.equal(romanToNepali('kaThmandu'), D(KA, AA, TTHA, MA, AA, DDA, AU, ANU));
  assert.equal(romanToNepali('hM'), D(HA, CHAN));
  assert.equal(romanToNepali('namaH'), D(NA, MA, VISARGA));
  assert.equal(romanToNepali('aaMa'), D(IND_AA, MA));
});

test('capitals: folded words hit the lexicon', () => {
  assert.equal(romanToNepali('Thulo'), D(TTHA, UU, LA, O));
  assert.equal(romanToNepali('Dhaka'), D(DDA, AA, KA, AA));
  assert.equal(romanToNepali('Dherai'), D(DHA, E, RA, AI));
  assert.equal(romanToNepali('Sita'), D(SA, II, TA, AA));
  assert.equal(romanToNepali('Krishna'), D(KA, VOC_R, SSA, HAL, NNA));
  assert.equal(romanToNepali('Shanti'), D(SHA, AA, NA, HAL, TA, I));
  assert.equal(romanToNepali('SHANTI'), D(SHA, AA, NA, HAL, TA, I));
  assert.equal(romanToNepali('Thaha'), D(THA, AA, HA, AA));
  assert.equal(romanToNepali('Thik'), D(TTHA, I, KA));
  assert.equal(romanToNepali('Thaun'), D(TTHA, AA, IND_U, CHAN));
  assert.equal(romanToNepali('Thakali'), D(THA, KA, AA, LA, II));
  assert.equal(romanToNepali('Thamel'), D(THA, AA, MA, E, LA));
  assert.equal(romanToNepali('Dharan'), D(DHA, RA, AA, NA));
  assert.equal(romanToNepali('Dhol'), D(DDA, O, LA));
  assert.equal(romanToNepali('Thali'), D(THA, AA, LA, II));
  assert.equal(romanToNepali('Gita'), D(GA, II, TA, AA));
  assert.equal(romanToNepali('Sitaram'), D(SA, II, TA, AA, RA, AA, MA));
  assert.equal(romanToNepali('Rita'), D(RA, II, TA, AA));
  assert.equal(romanToNepali('Mina'), D(MA, II, NA, AA));
  assert.equal(romanToNepali('Rina'), D(RA, II, NA, AA));
  assert.equal(romanToNepali('Sunita'), D(SA, U, NA, II, TA, AA));
  assert.equal(romanToNepali('Anita'), D(IND_A, NA, I, TA, AA));
  assert.equal(romanToNepali('Vishnu'), D(VA, I, SSA, HAL, NNA, U));
  assert.equal(romanToNepali('Laxmi'), D(LA, KA, HAL, SSA, II));
  assert.equal(romanToNepali('Parvati'), D(PA, AA, RA, HAL, TA, II));
  assert.equal(romanToNepali('Man'), D(MA, NA));
  assert.equal(romanToNepali('Jan'), D(JA, NA));
  assert.equal(romanToNepali('Milan'), D(MA, I, LA, NA));
  assert.equal(romanToNepali('Jiwan'), D(JA, II, VA, NA));
  assert.equal(romanToNepali('Saman'), D(SA, AA, MA, AA, NA));
  assert.equal(romanToNepali('Haami'), D(HA, AA, MA, II));
});

test('overrides do not leak into longer words', () => {
  // "sundari" has its own entry; a non-entry word containing an entry
  // as substring must still parse by rules.
  assert.equal(romanToNepali('ram'), D(RA, AA, MA));
  assert.equal(romanToNepali('mero naam'), D(MA, E, RA, O) + ' ' + D(NA, AA, MA));
});

test('page examples convert as documented', () => {
  assert.equal(romanToNepali('xaina ki chha'), D(CHA, AI, NA, 32, KA, I, 32, CHA));
  assert.equal(
    romanToNepali('tapai kasto hunuhunchha?'),
    D(TA, AA, PA, AA, IND_II, ANU) + ' ' + D(KA, SA, HAL, TA, O) + ' ' +
    D(HA, U, NA, U, HA, U, NA, HAL, CHA) + '?'
  );
  assert.equal(
    romanToNepali('shubha bihaanee'),
    D(SHA, U, BHA) + ' ' + D(BA, I, HA, AA, NA, II)
  );
});

test('digits option and passthrough', () => {
  // Bare 'c' is not a consonant in this scheme (only 'ch'/'chh'), so it
  // passes through untouched while digits are preserved as-is by default.
  assert.equal(romanToNepali('abc123'), D(IND_A, BA) + 'c123');
  assert.equal(romanToNepali('namaste2079'), D(NA, MA, SA, HAL, TA, E) + '2079');
  assert.equal(
    romanToNepali('namaste2079', { nepaliDigits: true }),
    D(NA, MA, SA, HAL, TA, E) + D(2408, 2406, 2413, 2415)
  );
  assert.equal(convertNepaliNumbers('2079'), D(2408, 2406, 2413, 2415));
  assert.deepEqual(countChars('namaste dunia'), { chars: 13, words: 2 });
});
