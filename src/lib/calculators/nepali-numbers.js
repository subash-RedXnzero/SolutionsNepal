/**
 * Nepali Number ⇄ Words Engine
 * ============================
 * Deterministic, offline number conversion for the Nepal/Indian numbering
 * system (Thousand · Lakh · Crore · Arab · Kharab · Neel).
 *
 * No external APIs — every output comes from the centralized mappings
 * below, which are the single place to maintain vocabulary.
 *
 * @module nepali-numbers
 */

// ── Centralized vocabulary ───────────────────────────────────────────────

/** Devanagari digits ०–९ */
export const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

/**
 * Nepali words for 0–99 (index = value). Standard contemporary spellings.
 * Maintained as one flat array so tests can validate any entry directly.
 */
export const NEPALI_UNITS = [
  /* 0 */ 'शून्य', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ',
  /* 10 */ 'दस', 'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस',
  /* 20 */ 'बीस', 'एक्काइस', 'बाइस', 'तेइस', 'चौबिस', 'पच्चीस', 'छब्बिस', 'सत्ताइस', 'अट्ठाइस', 'उनन्तीस',
  /* 30 */ 'तीस', 'एकतिस', 'बत्तिस', 'तेत्तिस', 'चौंतिस', 'पैंतिस', 'छत्तिस', 'सैंतिस', 'अड्तिस', 'उनन्चालिस',
  /* 40 */ 'चालीस', 'एकचालीस', 'बयालीस', 'त्रिचालीस', 'चवालीस', 'पैंतालीस', 'छयालीस', 'सच्चालीस', 'अड्चालीस', 'उनन्चास',
  /* 50 */ 'पचास', 'एकाउन्न', 'बाउन्न', 'त्रिपन्न', 'चौपन्न', 'पच्पन्न', 'छप्पन्न', 'सत्ताउन्न', 'अन्ठाउन्न', 'उनसट्ठी',
  /* 60 */ 'साठी', 'एकसट्ठी', 'बैसट्ठी', 'त्रिसट्ठी', 'चौंसट्ठी', 'पैंसट्ठी', 'छैसट्ठी', 'सत्सट्ठी', 'अड्सट्ठी', 'उनन्सत्तरी',
  /* 70 */ 'सत्तरी', 'एकहत्तर', 'बहत्तर', 'त्रिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी',
  /* 80 */ 'असी', 'एकासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छयासी', 'सतासी', 'अठासी', 'उनान्नब्बे',
  /* 90 */ 'नब्बे', 'एकान्नब्बे', 'बयान्नब्बे', 'त्रियान्नब्बे', 'चौरान्नब्बे', 'पचान्नब्बे', 'छियान्नब्बे', 'सन्तान्नब्बे', 'अन्ठान्नब्बे', 'उनान्सय',
];

export const EN_UNITS = [
  /* 0 */ 'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  /* 10 */ 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  /* 20 */ 'Twenty', 'Twenty-One', 'Twenty-Two', 'Twenty-Three', 'Twenty-Four', 'Twenty-Five', 'Twenty-Six', 'Twenty-Seven', 'Twenty-Eight', 'Twenty-Nine',
  /* 30 */ 'Thirty', 'Thirty-One', 'Thirty-Two', 'Thirty-Three', 'Thirty-Four', 'Thirty-Five', 'Thirty-Six', 'Thirty-Seven', 'Thirty-Eight', 'Thirty-Nine',
  /* 40 */ 'Forty', 'Forty-One', 'Forty-Two', 'Forty-Three', 'Forty-Four', 'Forty-Five', 'Forty-Six', 'Forty-Seven', 'Forty-Eight', 'Forty-Nine',
  /* 50 */ 'Fifty', 'Fifty-One', 'Fifty-Two', 'Fifty-Three', 'Fifty-Four', 'Fifty-Five', 'Fifty-Six', 'Fifty-Seven', 'Fifty-Eight', 'Fifty-Nine',
  /* 60 */ 'Sixty', 'Sixty-One', 'Sixty-Two', 'Sixty-Three', 'Sixty-Four', 'Sixty-Five', 'Sixty-Six', 'Sixty-Seven', 'Sixty-Eight', 'Sixty-Nine',
  /* 70 */ 'Seventy', 'Seventy-One', 'Seventy-Two', 'Seventy-Three', 'Seventy-Four', 'Seventy-Five', 'Seventy-Six', 'Seventy-Seven', 'Seventy-Eight', 'Seventy-Nine',
  /* 80 */ 'Eighty', 'Eighty-One', 'Eighty-Two', 'Eighty-Three', 'Eighty-Four', 'Eighty-Five', 'Eighty-Six', 'Eighty-Seven', 'Eighty-Eight', 'Eighty-Nine',
  /* 90 */ 'Ninety', 'Ninety-One', 'Ninety-Two', 'Ninety-Three', 'Ninety-Four', 'Ninety-Five', 'Ninety-Six', 'Ninety-Seven', 'Ninety-Eight', 'Ninety-Nine',
];

/** Scales of the Nepal/Indian system, largest first. */
const NP_SCALES = [
  { value: 1e13, np: 'नील', en: 'Neel' },
  { value: 1e11, np: 'खर्ब', en: 'Kharab' },
  { value: 1e9, np: 'अर्ब', en: 'Arab' },
  { value: 1e7, np: 'करोड', en: 'Crore' },
  { value: 1e5, np: 'लाख', en: 'Lakh' },
  { value: 1e3, np: 'हजार', en: 'Thousand' },
];
const NP_HUNDRED = 'सय';
const EN_HUNDRED = 'Hundred';

/** Largest supported integer: 999 नील (10^15 − 1). Beyond this we refuse. */
export const MAX_SUPPORTED = 999999999999999;
export const TOO_LARGE_MESSAGE = 'Number is too large to convert.';

// ── Digits & grouping ────────────────────────────────────────────────────

export function toNepaliDigits(str) {
  return String(str).replace(/[0-9]/g, (d) => NEPALI_DIGITS[Number(d)]);
}

export function toEnglishDigits(str) {
  return String(str)
    .replace(/[०-९]/g, (d) => String(NEPALI_DIGITS.indexOf(d)))
    .replace(/[।]/g, '.');
}

/**
 * Group an integer string using the Nepal/Indian system:
 * "1250000" → "12,50,000" · "100000000" → "10,00,00,000"
 */
export function formatIndianGrouping(intStr) {
  const digits = intStr.replace(/^0+(?=\d)/, '');
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const groups = [];
  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) groups.unshift(rest);
  return groups.join(',') + ',' + last3;
}

/** Full formatted number (ASCII digits), e.g. "12,50,000.50". */
export function formatNumber(numStr) {
  const [intPart, decPart] = String(numStr).split('.');
  const grouped = formatIndianGrouping(intPart || '0');
  return decPart !== undefined ? grouped + '.' + decPart : grouped;
}

/** Formatted with Devanagari digits, e.g. "१२,५०,०००". */
export function formatNumberNepali(numStr) {
  return toNepaliDigits(formatNumber(numStr));
}

// ── Input normalization ──────────────────────────────────────────────────

/**
 * Normalize user input into a plain numeric string.
 * Accepts commas, spaces, Devanagari digits, and Rs./रु./NPR prefixes.
 * @returns {{ok:true, value:string}|{ok:false, error:string}}
 */
export function parseInput(raw) {
  let s = toEnglishDigits(String(raw ?? '')).trim();
  if (s === '') return { ok: false, error: 'Enter a number.' };

  // strip currency prefixes / labels
  s = s.replace(/^(rs\.?|npr\.?|inr\.?|rupees?|रु\.?|रू\.?|रुपैयाँ)\s*/i, '').trim();
  // remove separators
  s = s.replace(/[, ]/g, '');

  if (/^-/.test(s)) {
    return { ok: false, error: 'Negative numbers are not supported here.' };
  }
  if (!/^\d*\.?\d*$/.test(s) || s === '' || s === '.') {
    return { ok: false, error: 'Enter a valid number (digits only).' };
  }

  const intPart = s.split('.')[0] || '0';
  const numeric = Number(s);
  if (!Number.isFinite(numeric)) {
    return { ok: false, error: 'Enter a valid number.' };
  }
  if (numeric > MAX_SUPPORTED) {
    return { ok: false, error: TOO_LARGE_MESSAGE };
  }

  // normalize leading zeros but preserve decimals exactly
  const normalized = String(numeric) === s ? s : normalizeNumericString(s);
  return { ok: true, value: normalized };
}

function normalizeNumericString(s) {
  const [intPart, decPart] = s.split('.');
  const cleanInt = intPart.replace(/^0+(?=\d)/, '') || '0';
  return decPart !== undefined ? cleanInt + '.' + decPart : cleanInt;
}

// ── Integer → words ──────────────────────────────────────────────────────

function intToWordsNp(n) {
  if (n === 0n) return NEPALI_UNITS[0];
  n = BigInt(n);
  const parts = [];
  for (const scale of NP_SCALES) {
    const sv = BigInt(scale.value);
    if (n >= sv) {
      const count = n / sv;
      parts.push(`${intToWordsNp(count)} ${scale.np}`);
      n %= sv;
    }
  }
  if (n >= 100n) {
    const h = n / 100n;
    parts.push(`${NEPALI_UNITS[Number(h)]} ${NP_HUNDRED}`);
    n %= 100n;
  }
  if (n > 0n) parts.push(NEPALI_UNITS[Number(n)]);
  return parts.join(' ');
}

function intToWordsEn(n) {
  if (n === 0n) return EN_UNITS[0];
  n = BigInt(n);
  const parts = [];
  for (const scale of NP_SCALES) {
    const sv = BigInt(scale.value);
    if (n >= sv) {
      const count = n / sv;
      parts.push(`${intToWordsEn(count)} ${scale.en}`);
      n %= sv;
    }
  }
  if (n >= 100n) {
    const h = n / 100n;
    parts.push(`${EN_UNITS[Number(h)]} ${EN_HUNDRED}`);
    n %= 100n;
  }
  if (n > 0n) parts.push(EN_UNITS[Number(n)]);
  return parts.join(' ');
}

// ── Public conversion API ────────────────────────────────────────────────

/**
 * Convert a normalized numeric string to words.
 *
 * @param {string} numStr   normalized numeric string from parseInput()
 * @param {'np'|'en'} lang
 * @param {object} [opts]
 * @param {'number'|'currency'} [opts.mode]        currency adds रुपैयाँ/Rupees framing
 * @param {boolean} [opts.cheque]                  append मात्र / Only
 * @param {'paisa'|'decimal'} [opts.decimalsAs]    how to treat a fractional part
 * @returns {string}
 */
export function toWords(numStr, lang, opts = {}) {
  const { mode = 'number', cheque = false, decimalsAs = 'paisa' } = opts;
  const [intRaw, decRaw] = String(numStr).split('.');
  const intVal = BigInt(intRaw || '0');

  const isNp = lang === 'np';
  const zeroWord = isNp ? NEPALI_UNITS[0] : EN_UNITS[0];
  let out;

  if (mode === 'currency') {
    // NOTE: currency labels (Rs. / रु. / रुपैयाँ / Rupees) are intentionally
    // NOT part of the returned text — the UI displays them outside the result.
    // We return pure number words (+ optional paisa + मात्र/Only).
    out = intVal === 0n && !decRaw ? zeroWord : isNp ? intToWordsNp(intVal) : intToWordsEn(intVal);

    if (decRaw !== undefined && /^\d*[1-9]/.test(decRaw)) {
      if (decimalsAs === 'paisa') {
        // standard money practice: two decimal places = paisa
        const paisa = decRaw.length <= 2 ? decRaw.padEnd(2, '0') : decRaw.slice(0, 2);
        const paisaVal = Number(paisa);
        if (paisaVal > 0) {
          out += isNp
            ? ` र ${NEPALI_UNITS[paisaVal]} पैसा`
            : ` and ${paisaVal === 1 ? 'One Paisa' : `${EN_UNITS[paisaVal]} Paisa`}`;
        }
      } else {
        const fracWords = isNp
          ? decRaw.split('').map((d) => NEPALI_UNITS[Number(d)]).join(' ')
          : decRaw.split('').map((d) => EN_UNITS[Number(d)]).join(' ');
        out += isNp ? ` दशमलव ${fracWords}` : ` Point ${fracWords}`;
      }
    }

    if (cheque) out += isNp ? ' मात्र' : ' Only';
    return out;
  }

  // plain number mode
  out = intVal === 0n && !decRaw ? zeroWord : isNp ? intToWordsNp(intVal) : intToWordsEn(intVal);
  if (decRaw !== undefined && /^\d*[1-9]/.test(decRaw)) {
    const fracWords = isNp
      ? decRaw.split('').map((d) => NEPALI_UNITS[Number(d)]).join(' ')
      : decRaw.split('').map((d) => EN_UNITS[Number(d)]).join(' ');
    out += isNp ? ` दशमलव ${fracWords}` : ` Point ${fracWords}`;
  }
  return out;
}

/**
 * One-call convenience used by the UI:
 * returns all display variants for a raw user input.
 */
export function convertAll(rawInput, opts = {}) {
  const parsed = parseInput(rawInput);
  if (!parsed.ok) return parsed;
  const v = parsed.value;
  const mode = opts.mode || 'currency';
  const chequeOpts = { ...opts, cheque: true };
  return {
    ok: true,
    value: v,
    formattedAscii: formatNumber(v),
    formattedNepali: formatNumberNepali(v),
    currencyAscii: 'Rs. ' + formatNumber(v),
    currencyNepali: 'रु. ' + formatNumberNepali(v),
    nepaliWords: toWords(v, 'np', opts),
    englishWords: toWords(v, 'en', opts),
    chequeNepali: toWords(v, 'np', chequeOpts),
    chequeEnglish: toWords(v, 'en', chequeOpts),
  };
}

// ── Reverse conversion (words → number) ──────────────────────────────────

/** Build token→value lookup covering both languages. */
const WORD_VALUES = new Map();
for (let i = 0; i < 100; i++) {
  WORD_VALUES.set(NEPALI_UNITS[i], i);
  WORD_VALUES.set(EN_UNITS[i].toLowerCase(), i);
}
WORD_VALUES.set(NP_HUNDRED, 100);
WORD_VALUES.set(EN_HUNDRED.toLowerCase(), 100);
for (const s of NP_SCALES) {
  WORD_VALUES.set(s.np, s.value);
  WORD_VALUES.set(s.en.toLowerCase(), s.value);
}
// common spelling variants users type
WORD_VALUES.set('एघारँ', 11);
WORD_VALUES.set('एक सय', 100);

/**
 * Convert Nepali or English number words back into a numeric string,
 * e.g. "बाह्र लाख पचास हजार" → "1250000".
 * @returns {{ok:true, value:string}|{ok:false, error:string}}
 */
export function wordsToNumber(words) {
  const tokens = toEnglishDigits(String(words ?? ''))
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: 'Enter number words.' };

  let result = 0n;
  let current = 0n;
  let matched = false;

  for (const t of tokens) {
    if (t === 'and' || t === 'र' || t === 'रु') continue;
    const val = WORD_VALUES.get(t);
    if (val === undefined) {
      return { ok: false, error: `"${t}" could not be recognised as a number word.` };
    }
    matched = true;
    const v = BigInt(val);
    if (v === 100n) {
      current = (current === 0n ? 1n : current) * 100n;
    } else if (v >= 1000n) {
      result += (current === 0n ? 1n : current) * v;
      current = 0n;
    } else {
      current += v;
    }
  }

  if (!matched) return { ok: false, error: 'Could not recognise any number words.' };
  const total = result + current;
  if (total > BigInt(MAX_SUPPORTED)) return { ok: false, error: TOO_LARGE_MESSAGE };
  return { ok: true, value: total.toString() };
}
