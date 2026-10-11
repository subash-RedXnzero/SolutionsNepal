/**
 * Tests for the Nepali number ⇄ words engine.
 * Run: node --test tests/nepali-numbers.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  NEPALI_UNITS,
  toNepaliDigits,
  toEnglishDigits,
  formatIndianGrouping,
  formatNumber,
  formatNumberNepali,
  parseInput,
  toWords,
  convertAll,
  wordsToNumber,
  MAX_SUPPORTED,
} from '../src/lib/calculators/nepali-numbers.js';

// ── Vocabulary integrity ────────────────────────────────────

test('NEPALI_UNITS covers exactly 0–99 with spec spellings', () => {
  assert.equal(NEPALI_UNITS.length, 100);
  assert.equal(NEPALI_UNITS[1], 'एक');
  assert.equal(NEPALI_UNITS[10], 'दस');
  assert.equal(NEPALI_UNITS[11], 'एघार');
  assert.equal(NEPALI_UNITS[20], 'बीस');
  assert.equal(NEPALI_UNITS[21], 'एक्काइस');
  assert.equal(NEPALI_UNITS[50], 'पचास');
  assert.equal(NEPALI_UNITS[99], 'उनान्सय');
});

// ── Plain Nepali words ──────────────────────────────────────

test('Nepali words for the required examples', () => {
  assert.equal(toWords('1', 'np'), 'एक');
  assert.equal(toWords('10', 'np'), 'दस');
  assert.equal(toWords('11', 'np'), 'एघार');
  assert.equal(toWords('20', 'np'), 'बीस');
  assert.equal(toWords('21', 'np'), 'एक्काइस');
  assert.equal(toWords('50', 'np'), 'पचास');
  assert.equal(toWords('99', 'np'), 'उनान्सय');
  assert.equal(toWords('100', 'np'), 'एक सय');
  assert.equal(toWords('101', 'np'), 'एक सय एक');
});

test('Nepali words for scale numbers', () => {
  assert.equal(toWords('1000', 'np'), 'एक हजार');
  assert.equal(toWords('10000', 'np'), 'दस हजार');
  assert.equal(toWords('100000', 'np'), 'एक लाख');
  assert.equal(toWords('125000', 'np'), 'एक लाख पच्चीस हजार');
  assert.equal(toWords('1250000', 'np'), 'बाह्र लाख पचास हजार');
  assert.equal(toWords('10000000', 'np'), 'एक करोड');
  assert.equal(toWords('12500000', 'np'), 'एक करोड पच्चीस लाख');
  assert.equal(toWords('100000000', 'np'), 'दस करोड');
});

test('English words use Lakh/Crore, not million/billion', () => {
  assert.equal(toWords('1000', 'en'), 'One Thousand');
  assert.equal(toWords('100000', 'en'), 'One Lakh');
  assert.equal(toWords('12500000', 'en'), 'One Crore Twenty-Five Lakh');
  const w = toWords('1250000', 'en');
  assert.ok(w.includes('Lakh') && !w.toLowerCase().includes('million'));
});

test('zero and compound hundreds', () => {
  assert.equal(toWords('0', 'np'), 'शून्य');
  assert.equal(toWords('999', 'np'), 'नौ सय उनान्सय');
  assert.equal(toWords('1100', 'np'), 'एक हजार एक सय');
});

// ── Grouping & digits ───────────────────────────────────────

test('Indian grouping matches Nepal conventions', () => {
  assert.equal(formatIndianGrouping('1250000'), '12,50,000');
  assert.equal(formatIndianGrouping('12500000'), '1,25,00,000');
  assert.equal(formatIndianGrouping('100000000'), '10,00,00,000');
  assert.equal(formatIndianGrouping('1000'), '1,000');
  assert.equal(formatNumber('1250000.50'), '12,50,000.50');
});

test('Devanagari digit conversion round-trips', () => {
  assert.equal(toNepaliDigits('12,50,000'), '१२,५०,०००');
  assert.equal(formatNumberNepali('1250000'), '१२,५०,०००');
  assert.equal(toEnglishDigits('१२५००००'), '1250000');
});

// ── Input normalization ─────────────────────────────────────

test('parseInput accepts plain, comma and Devanagari forms of the same value', () => {
  const expected = { ok: true, value: '1250000' };
  assert.deepEqual(parseInput('1250000'), expected);
  assert.deepEqual(parseInput('12,50,000'), expected);
  assert.deepEqual(parseInput('१२५००००'), expected);
  assert.deepEqual(parseInput('रु. १२,५०,०००'), expected);
  assert.deepEqual(parseInput('Rs. 12,50,000'), expected);
  assert.deepEqual(parseInput('Rs 1250000'), expected);
});

test('parseInput handles decimals and rejects bad input', () => {
  assert.deepEqual(parseInput('1250000.50'), { ok: true, value: '1250000.50' });
  assert.equal(parseInput('').ok, false);
  assert.equal(parseInput('abc').ok, false);
  const neg = parseInput('-500');
  assert.equal(neg.ok, false);
  assert.match(neg.error, /negative/i);
  assert.match(parseInput('12x5').error, /valid number/i);
});

test('very large values are refused, not mis-converted', () => {
  const r = parseInput(String(MAX_SUPPORTED));
  assert.equal(r.ok, true);
  const tooBig = parseInput(String(MAX_SUPPORTED) + '0');
  assert.equal(tooBig.ok, false);
  assert.match(tooBig.error, /too large/i);
});

// ── Currency mode ───────────────────────────────────────────

test('currency wording with मात्र (cheque) contains NO currency prefix', () => {
  assert.equal(
    toWords('1250000', 'np', { mode: 'currency', cheque: true }),
    'बाह्र लाख पचास हजार मात्र',
  );
  assert.equal(
    toWords('1250000', 'en', { mode: 'currency', cheque: true }),
    'Twelve Lakh Fifty Thousand Only',
  );

  // The UI renders the currency label itself — the words must never embed one.
  for (const lang of ['np', 'en']) {
    const w = toWords('2500', lang, { mode: 'currency', cheque: true });
    assert.ok(!/रुपैयाँ|रु\.|Rs|Rupees/i.test(w), `unexpected currency token in: ${w}`);
  }
});

test('paisa support in currency mode', () => {
  assert.equal(
    toWords('1250000.50', 'np', { mode: 'currency', cheque: true }),
    'बाह्र लाख पचास हजार र पचास पैसा मात्र',
  );
  // ".5" means 50 paisa, not 5
  assert.equal(
    toWords('100.5', 'np', { mode: 'currency' }),
    'एक सय र पचास पैसा',
  );
});

test('decimal-as-digits option reads out fractional digits', () => {
  assert.equal(
    toWords('12.34', 'np', { decimalsAs: 'decimal' }),
    'बाह्र दशमलव तीन चार',
  );
});

// ── convertAll convenience ──────────────────────────────────

test('convertAll produces every display variant at once', () => {
  const r = convertAll('1250000', { mode: 'currency', cheque: false });
  assert.equal(r.ok, true);
  assert.equal(r.formattedAscii, '12,50,000');
  assert.equal(r.currencyAscii, 'Rs. 12,50,000');
  assert.equal(r.currencyNepali, 'रु. १२,५०,०००');
  assert.equal(r.nepaliWords, 'बाह्र लाख पचास हजार');
  assert.equal(r.chequeNepali, 'बाह्र लाख पचास हजार मात्र');
  assert.equal(r.chequeEnglish, 'Twelve Lakh Fifty Thousand Only');
  // No currency prefix anywhere in the word outputs
  for (const key of ['nepaliWords', 'englishWords', 'chequeNepali', 'chequeEnglish']) {
    assert.ok(!/रुपैयाँ|रु\.|Rs|Rupees/i.test(String(r[key])), `${key} must not contain a currency label`);
  }

  const bad = convertAll('hello');
  assert.equal(bad.ok, false);
});

// ── Reverse conversion ──────────────────────────────────────

test('wordsToNumber converts Nepali words back to digits', () => {
  assert.deepEqual(wordsToNumber('बाह्र लाख पचास हजार'), { ok: true, value: '1250000' });
  assert.deepEqual(wordsToNumber('एक करोड पच्चीस लाख'), { ok: true, value: '12500000' });
  assert.deepEqual(wordsToNumber('एक हजार'), { ok: true, value: '1000' });
  assert.deepEqual(wordsToNumber('एक सय एक'), { ok: true, value: '101' });
});

test('wordsToNumber accepts English words too', () => {
  assert.deepEqual(wordsToNumber('Twelve Lakh Fifty Thousand'), { ok: true, value: '1250000' });
});

test('wordsToNumber rejects unknown words gracefully', () => {
  const r = wordsToNumber('बाह्र xyz हजार');
  assert.equal(r.ok, false);
  assert.match(r.error, /xyz/);
});
