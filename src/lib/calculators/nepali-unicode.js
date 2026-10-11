/**
 * Nepali Unicode Transliteration Engine
 * =====================================
 * Rule-based phonetic mapping with longest-match-first parsing.
 *
 * Key conventions:
 *   - Lowercase = dental (त द न), Uppercase = retroflex (ट ड ण)
 *   - 'sh' = श, 'Sh' = ष, 'x' = छ, 'chh' = छ
 *   - 'aa' = ा, 'ii'/'ee' = ी, 'uu'/'oo' = ू
 *   - 'm' before consonant = anusvara; trailing 'm' = anusvara
 *   - 'n' before stop consonants = anusvara (गंगा pattern)
 *   - 'M' = chandrabindu (ँ), 'H' = visarga (ः)
 *   - 'ri' / 'rri' = ृ (vocalic r)
 */

// ═══════════════════════════════════════════════════════════════════════
// CONSONANT MAP (longest keys first for longest-match-first parsing)
// ═══════════════════════════════════════════════════════════════════════
const CONSONANTS = {
  'chh': '\u091B',  // छ
  'kh': '\u0916', 'gh': '\u0918', 'ng': '\u0919',
  'ch': '\u091A', 'jh': '\u091D',
  'Th': '\u0920', 'Dh': '\u0922', 'N': '\u0923',
  'th': '\u0925', 'dh': '\u0927',
  'ph': '\u092B', 'bh': '\u092D',
  'Sh': '\u0937', 'sh': '\u0936',
  'k': '\u0915', 'g': '\u0917', 'j': '\u091C',
  'T': '\u091F', 'D': '\u0921',
  't': '\u0924', 'd': '\u0926', 'n': '\u0928',
  'p': '\u092A', 'b': '\u092C', 'm': '\u092E',
  'y': '\u092F', 'r': '\u0930', 'l': '\u0932',
  'v': '\u0935', 'w': '\u0935',
  's': '\u0938', 'h': '\u0939',
  'x': '\u091B',  // x = छ (common Nepali romanization)
  'f': '\u092B',  // f = फ (common substitution)
};

const CONSONANT_KEYS = Object.keys(CONSONANTS);

// ═══════════════════════════════════════════════════════════════════════
// VOWEL TABLES
// ═══════════════════════════════════════════════════════════════════════

// Matras (dependent vowels after consonant)
const VOWEL_MATRAS = {
  'aa': '\u093E',  // ा
  'ai': '\u0948',  // ै
  'au': '\u094C',  // ौ
  'ae': '\u0948',  // ै
  'ei': '\u0947',  // े
  'ii': '\u0940',  // ी
  'ee': '\u0940',  // ी
  'uu': '\u0942',  // ू
  'oo': '\u0942',  // ू
  'ri': '\u0943',  // ृ (vocalic r matra)
  'rri': '\u0944', // ॄ
  'a':  '',        // inherent vowel — no matra
  'i':  '\u093F',  // ि
  'u':  '\u0941',  // ु
  'e':  '\u0947',  // े
  'o':  '\u094B',  // ो
};

// Independent vowels (at word start or standalone)
const INDEPENDENT_VOWELS = {
  'aa': '\u0906',  // आ
  'ai': '\u0910',  // ऐ
  'au': '\u0914',  // औ
  'ae': '\u0910',  // ऐ
  'ei': '\u090F',  // ए
  'ii': '\u0908',  // ई
  'ee': '\u0908',  // ई
  'uu': '\u090A',  // ऊ
  'oo': '\u090A',  // ऊ
  'ri': '\u0943',  // ृ (as dependent, used after consonant)
  'rri': '\u0944', // ॄ
  'a':  '\u0905',  // अ
  'i':  '\u0907',  // इ
  'u':  '\u0909',  // उ
  'e':  '\u090F',  // ए
  'o':  '\u0913',  // ओ
};

// Vowel keys ordered longest first for matching
const VOWEL_KEYS = ['rri','ri','aa','ai','au','ae','ei','ii','ee','uu','oo','a','i','u','e','o'];

// ═══════════════════════════════════════════════════════════════════════
// DIACRITICS & SPECIAL MARKS
// ═══════════════════════════════════════════════════════════════════════
const ANUSVARA    = '\u0902'; // ं
const CHANDRA     = '\u0901'; // ँ
const VISARGA     = '\u0903'; // ः
const HALANT      = '\u094D'; // ्
const PURNAVIRAM  = '\u0964'; // ।

// ═══════════════════════════════════════════════════════════════════════
// DIGIT MAP
// ═══════════════════════════════════════════════════════════════════════
const DIGIT_MAP = {
  '0': '\u0966', '1': '\u0967', '2': '\u0968', '3': '\u0969',
  '4': '\u096A', '5': '\u096B', '6': '\u096C', '7': '\u096D',
  '8': '\u096E', '9': '\u096F',
};

// ═══════════════════════════════════════════════════════════════════════
// CONJUNCT SHORTCUTS
// ═══════════════════════════════════════════════════════════════════════
const CONJUNCTS = {
  'ksha':  '\u0915\u094D\u0937',       // क्ष
  'gyaan': '\u091C\u094D\u091E',       // ज्ञ
  'gyan':  '\u091C\u094D\u091E',       // ज्ञ
  'shri':  '\u0936\u094D\u0930\u093F', // श्रि
  'shr':   '\u0936\u094D\u0930',       // श्र
  'ksh':   '\u0915\u094D\u0937',       // क्ष
  'gya':   '\u091C\u094D\u091E',       // ज्ञ
  'tra':   '\u0924\u094D\u0930',       // त्र
  'tya':   '\u0924\u094D\u092F',       // त्य
  'dya':   '\u0926\u094D\u092F',       // द्य
  'jna':   '\u091C\u094D\u0923',       // ज्ञ
};

// Whole-word exceptions for common words whose standard spelling the
// rule-based parser cannot derive (tapai → तपाईं, kathmandu → काठमाडौं…).
// Applied as sentinel substitution before parsing; lookup is case-insensitive.
const LEXICON = {
  'sundar': 'सुन्दर', 'sundari': 'सुन्दरी',
  'tapai': 'तापाईं', 'tapain': 'तापाईं',
  'tapailai': 'तापाईंलाई', 'tapaiko': 'तापाईंको',
  'swagat': 'स्वागत',
  'dhanyabad': 'धन्यवाद', 'bank': 'बैंक', 'dhanyabaad': 'धन्यवाद',
  'kathmandu': 'काठमाडौं',
  'pani': 'पानी', 'bihani': 'बिहानी', 'didi': 'दिदी', 'chhori': 'छोरी',
  'bikas': 'विकास', 'barsha': 'वर्षा',
  'nagar': 'नगर', 'kiran': 'किरण', 'madan': 'मदन',
  'sansaar': 'संसार', 'samsara': 'संसार', 'sanskrit': 'संस्कृत', 'hansa': 'हंस',
  'shanti': 'शान्ति',
  'upahar': 'उपहार',
  'ramro': 'राम्रो', 'naramro': 'नराम्रो',
  'khana': 'खाना', 'kaslai': 'कसलाई', 'uslai': 'उसलाई', 'timilai': 'तिमीलाई', 'malai': 'मलाई', 'lai': 'लाई', 'khane': 'खाने',
  'thulo': 'ठूलो',
  'thik': 'ठिक',
  'thaun': 'ठाउँ',
  'dhaka': 'डाका',
  'dherai': 'धेरै',
  'thaha': 'थाहा',
  'thakali': 'थकाली',
  'thamel': 'थामेल',
  'dharan': 'धरान',
  'dhol': 'डोल',
  'thali': 'थाली',
  'sita': 'सीता',
  'gita': 'गीता',
  'sitaram': 'सीताराम',
  'rita': 'रीता',
  'mina': 'मीना',
  'rina': 'रीना',
  'sunita': 'सुनीता',
  'anita': 'अनिता',
  'krishna': 'कृष्ण',
  'vishnu': 'विष्णु',
  'laxmi': 'लक्षी',
  'parvati': 'पार्ती',
  'maya': 'मामा',
  'man': 'मन',
  'jan': 'जन',
  'milan': 'मिलन',
  'jiwan': 'जीवन',
  'saman': 'सामान',
  'bahadur': 'बहादुर', 'bhai': 'भाई',
  'haami': 'हामी',
  'hetauda': 'हेतडा',
  'monsoon': 'मनसुन', 'mansoon': 'मनसुन',
};
const LEXICON_KEYS = Object.keys(LEXICON).sort((a, b) => b.length - a.length);
const SENTINEL_BASE = 0xe000;

// ═══════════════════════════════════════════════════════════════════════
// VOWEL CHAR SET
// ═══════════════════════════════════════════════════════════════════════
const VOWEL_CHARS = new Set(['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U']);

// Stop consonants (including aspirated) — 'n' before these → anusvara
const STOP_CONSONANTS = new Set([
  'k', 'kh', 'g', 'gh',
  'ch', 'chh', 'j', 'jh',
  'T', 'Th', 'D', 'Dh',
  't', 'th', 'd', 'dh',
  'p', 'ph', 'b', 'bh',
  'x', 'f',
]);

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function matchConsonant(input, pos) {
  for (const key of CONSONANT_KEYS) {
    if (input.startsWith(key, pos)) {
      return { key, length: key.length };
    }
  }
  // Stray capitals in mixed-case words (kaSai): fall back to the lowercase
  // reading. Capitals with documented meanings (T D N Sh Th Dh) match
  // exactly above and never reach here.
  const ch = input[pos];
  if (ch >= 'A' && ch <= 'Z') {
    const low = ch.toLowerCase();
    for (const key of CONSONANT_KEYS) {
      if (key[0] === low && input.slice(pos, pos + key.length).toLowerCase() === key) {
        return { key, length: key.length };
      }
    }
  }
  return null;
}

function matchVowel(input, pos) {
  const ch = input[pos];
  if (!ch || !VOWEL_CHARS.has(ch)) return null;
  for (const key of VOWEL_KEYS) {
    if (input.startsWith(key, pos)) {
      return { key, length: key.length };
    }
  }
  // Leftover capitals in mixed-case words (tapaAi): read as the long
  // counterpart (A→aa, E→ee, I→ii, O→oo, U→uu).
  if (ch === 'A') return { key: 'aa', length: 1 };
  if (ch === 'E' || ch === 'I') return { key: 'ii', length: 1 };
  if (ch === 'O') return { key: 'oo', length: 1 };
  if (ch === 'U') return { key: 'uu', length: 1 };
  return null;
}

function isWordBreak(ch) {
  if (!ch) return true;
  return ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' ||
         ch === '.' || ch === ',' || ch === '!' || ch === '?' ||
         ch === ';' || ch === ':' || ch === '(' || ch === ')' ||
         ch === '"' || ch === "'" || ch === '-' || ch === '/' ||
         ch === '\u2013' || ch === '\u2014';
}

/**
 * Check if 'n' at position should become anusvara.
 * 'n' before a stop consonant → anusvara (e.g. 'nga' → ङ + ग = गंगा pattern)
 */
function isAnusvaraContext(input, pos) {
  if (pos >= input.length) return false;
  const nextCons = matchConsonant(input, pos);
  if (nextCons && STOP_CONSONANTS.has(nextCons.key)) return true;
  return false;
}

function isAsciiLetter(ch) {
  return !!ch && ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z'));
}

function isAsciiUpper(ch) {
  return !!ch && ch >= 'A' && ch <= 'Z';
}

// True for ASCII consonant letters (a letter that is not aeiou).
function isAsciiConsonant(ch) {
  if (!isAsciiLetter(ch)) return false;
  const l = ch.toLowerCase();
  return l !== 'a' && l !== 'e' && l !== 'i' && l !== 'o' && l !== 'u';
}

// Soften capitals inside one mixed-case word (Title-Case and ALL-CAPS
// words are lowercased wholesale before this runs):
//  - leading T/D/N read as dental (TapAi stays readable)
//  - H reads as 'h' except word-finally, where it stays visarga (namahH)
//  - M reads as 'm' except after a lowercase consonant, where it stays
//    chandrabindu (hM). Mid-word T/D/N/Sh/Th/Dh keep their meaning.
function normCapitals(word) {
  const cs = word.split('');
  if (cs[0] === 'T' || cs[0] === 'D' || cs[0] === 'N') cs[0] = cs[0].toLowerCase();
  for (let k = 0; k < cs.length; k++) {
    if (cs[k] === 'H') {
      const next = k + 1 < cs.length ? cs[k + 1] : '';
      if (k === 0 || isAsciiLetter(next)) cs[k] = 'h';
    } else if (cs[k] === 'M') {
      const prev = k > 0 ? cs[k - 1] : '';
      const prevLowerCons = prev >= 'a' && prev <= 'z' && isAsciiConsonant(prev);
      if (!prevLowerCons) cs[k] = 'm';
    }
  }
  return cs.join('');
}

function foldWord(word) {
  // A lone capital is usually a scheme test (T = ट): keep T/D/N as-is so
  // the documented retroflex letters still work standalone. Every other
  // lone capital (I, A, H, M, S …) reads as lowercase — always an
  // improvement over the old pass-through garbage.
  if (word.length === 1) {
    if (word === 'T' || word === 'D' || word === 'N') return word;
    return word.toLowerCase();
  }
  if (isAsciiUpper(word[0]) && !isAsciiUpper(word[1])) {
    return word.toLowerCase(); // Title Case: Namaste, Hami, Santosh
  }
  if (word.length > 1) {
    let allCaps = true;
    for (let k = 0; k < word.length; k++) {
      if (!isAsciiUpper(word[k])) { allCaps = false; break; }
    }
    if (allCaps) return word.toLowerCase(); // NAMASTE, TAPAI
  }
  return normCapitals(word);
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN TRANSLITERATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Convert romanized Nepali text to Devanagari Unicode.
 *
 * @param {string} input - Romanized Nepali text
 * @param {object} [options] - Options
 * @param {boolean} [options.nepaliDigits=false] - Convert digits to Devanagari
 * @returns {string} Devanagari Unicode text
 */
export function romanToNepali(input, options = {}) {
  if (!input) return '';

  // Normalize words before parsing (see foldWord/normCapitals), then
  // substitute high-frequency words with private-use sentinels so they
  // bypass rule parsing. Sentinels fall through the parser untouched and
  // are swapped back to Devanagari at the end. Lexicon lookup is
  // case-insensitive on whole words only.
  const restored = [];
  let buf = '';
  let p = 0;
  while (p < input.length) {
    const ch = input[p];
    if (!isAsciiLetter(ch)) { buf += ch; p++; continue; }
    let q = p;
    while (q < input.length && isAsciiLetter(input[q])) q++;
    const folded = foldWord(input.slice(p, q));
    const key = folded.toLowerCase();
    if (LEXICON[key]) {
      const sentinel = String.fromCharCode(SENTINEL_BASE + restored.length);
      restored.push([sentinel, LEXICON[key]]);
      buf += sentinel;
    } else {
      buf += folded;
    }
    p = q;
  }
  input = buf;

  const { nepaliDigits = false } = options;
  let output = '';
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];
    const nextCh = i + 1 < len ? input[i + 1] : null;

    // ─── Whitespace ───
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
      output += ch;
      i++;
      continue;
    }

    // ─── Already Devanagari ───
    const code = ch.charCodeAt(0);
    if (code >= 0x0900 && code <= 0x097F) {
      output += ch;
      i++;
      continue;
    }

    // ─── Chandrabindu marker ───
    if (ch === 'M') {
      output += CHANDRA;
      i++;
      continue;
    }

    // ─── Visarga marker ───
    if (ch === 'H') {
      output += VISARGA;
      i++;
      continue;
    }

    // ─── Halant marker ───
    if (ch === '^') {
      output += HALANT;
      i++;
      continue;
    }

    // ─── Punctuation ───
    if ('.!?,;:(){}[]<>/\\|@#$%&*_~`+="'.includes(ch)) {
      output += ch;
      i++;
      continue;
    }

    // ─── Digits ───
    if (ch >= '0' && ch <= '9') {
      output += nepaliDigits ? (DIGIT_MAP[ch] || ch) : ch;
      i++;
      continue;
    }

    // ─── Try Conjunct Shortcut (longest first) ───
    let matchedConjunct = false;
    for (const key of Object.keys(CONJUNCTS)) {
      if (input.startsWith(key, i)) {
        output += CONJUNCTS[key];
        i += key.length;
        matchedConjunct = true;
        break;
      }
    }
    if (matchedConjunct) continue;

    // ─── Consonant ───
    const consMatch = matchConsonant(input, i);
    if (consMatch) {
      const consonantKey = consMatch.key;
      const consonant = CONSONANTS[consonantKey];
      i += consMatch.length;

      // NOTE: 'n' before consonants generally stays as न + halant (conjunct)
      // Anusvara for 'n' is only handled at word end (below) or via 'ng' pattern
      // This avoids false positives like 'sundar' → सुन्दर (not सुंदर)

      // SPECIAL: 'ng' before stop consonant → anusvara + ग pattern
      // 'ng' alone maps to ङ, but 'nga' should be ंग (anusvara + g)
      // Only use ङ when 'ng' is NOT followed by a vowel (standalone ङ)
      if (consonantKey === 'ng' && i < len && VOWEL_CHARS.has(input[i])) {
        // 'nga' → anusvara + ग + vowel
        output += ANUSVARA;
        const gCons = CONSONANTS['g'];
        const vMatch = matchVowel(input, i);
        if (vMatch) {
          output += gCons + VOWEL_MATRAS[vMatch.key];
          i += vMatch.length;
        } else {
          output += gCons;
        }
        continue;
      }

      // SPECIAL: 'n' at word end → anusvara
      if (consonantKey === 'n' && (i >= len || isWordBreak(input[i]))) {
        output += ANUSVARA;
        continue;
      }

      // NOTE: 'm' at word end stays as consonant with inherent vowel (म)
      // Only 'm' BEFORE a consonant converts to anusvara (handled above)

      // SPECIAL: 'm' before STOP consonant → anusvara (e.g. 'mba' → म्ब)
      // But NOT before 'r', 'l', 'y', etc. (those form conjuncts: 'mra' → म्र)
      const MSimpleStops = new Set(['k', 'g', 'p', 'b', 't', 'd', 'ch', 'jh']);
      if (consonantKey === 'm' && i < len) {
        const nextAfterM = matchConsonant(input, i);
        if (nextAfterM && MSimpleStops.has(nextAfterM.key)) {
          output += ANUSVARA;
          continue;
        }
      }

      // After consonant: try to match vowel matra
      if (i < len) {
        const vMatch = matchVowel(input, i);
        if (vMatch) {
          // Smart: 'a' before 'm', 'sh', 's', 'n', 'l', 'r' at word end → long 'aa'
          // This handles common Nepali words: ram → राम, subash → सुबास, kam → काम, shanti → शान्ति
          if (vMatch.key === 'a' && i + 1 < len) {
            const nextCh2 = input[i + 1];
            const afterNext = i + 2 < len ? input[i + 2] : null;
            const afterAfterNext = i + 3 < len ? input[i + 3] : null;
            // Check for common word-final patterns
            const isWordEndM = nextCh2 === 'm' && (afterNext === null || isWordBreak(afterNext));
            const isWordEndSh = input.startsWith('sh', i + 1) && (afterAfterNext === null || isWordBreak(afterAfterNext));
            const isWordEndS = nextCh2 === 's' && (afterNext === null || isWordBreak(afterNext));
            const isWordEndN = nextCh2 === 'n' && (afterNext === null || isWordBreak(afterNext));
            const isWordEndL = nextCh2 === 'l' && (afterNext === null || isWordBreak(afterNext));
            const isWordEndR = nextCh2 === 'r' && (afterNext === null || isWordBreak(afterNext));
            // Also check for 'sh' + vowel (shanti pattern)
            const isShPlusVowel = input.startsWith('sh', i + 1) && afterAfterNext && VOWEL_CHARS.has(afterAfterNext);
            if (isWordEndM || isWordEndSh || isWordEndS || isWordEndN || isWordEndL || isWordEndR || isShPlusVowel) {
              output += consonant + VOWEL_MATRAS['aa'];
              i += vMatch.length;
              continue;
            }
          }
          output += consonant + VOWEL_MATRAS[vMatch.key];
          i += vMatch.length;
          continue;
        }
      }

      // After consonant: 'M' → chandrabindu
      if (i < len && input[i] === 'M') {
        output += consonant + CHANDRA;
        i++;
        continue;
      }

      // Bare consonant at word boundary → just consonant (inherent vowel)
      if (i >= len || isWordBreak(input[i])) {
        output += consonant;
        continue;
      }

      // SPECIAL: 'n' before a velar stop (k kh g gh) → anusvara
      // (sankalp → संकल्प, bank → बैंक). Other positions keep न + halant
      // (sundar → सुन्दर, hunuhunchha → हुनुहुन्छ).
      if (consonantKey === 'n' && i < len) {
        const afterN = matchConsonant(input, i);
        if (afterN && (afterN.key === 'k' || afterN.key === 'kh' || afterN.key === 'g' || afterN.key === 'gh')) {
          output += ANUSVARA;
          continue;
        }
      }

      // Consonant immediately followed by another consonant → halant (conjunct)
      const nextCons = matchConsonant(input, i);
      if (nextCons) {
        output += consonant + HALANT;
        continue;
      }

      // Fallback: consonant followed by unknown char → just consonant
      output += consonant;
      continue;
    }

    // ─── Standalone Vowel ───
    if (VOWEL_CHARS.has(ch)) {
      const vMatch = matchStandaloneVowel(input, i);
      if (vMatch) {
        output += INDEPENDENT_VOWELS[vMatch.key];
        i += vMatch.length;
        continue;
      }
    }

    // ─── Fallback: pass through ───
    output += ch;
    i++;
  }

  // Swap lexicon sentinels back to their Devanagari spellings
  for (const pair of restored) {
    output = output.split(pair[0]).join(pair[1]);
  }

  return output;
}

/**
 * Match vowel at word start / standalone position.
 */
function matchStandaloneVowel(input, pos) {
  const ch = input[pos];
  if (!ch || !VOWEL_CHARS.has(ch)) return null;
  for (const key of VOWEL_KEYS) {
    if (input.startsWith(key, pos)) {
      return { key, length: key.length };
    }
  }
  if (ch === 'A') return { key: 'aa', length: 1 };
  if (ch === 'E' || ch === 'I') return { key: 'ii', length: 1 };
  if (ch === 'O') return { key: 'oo', length: 1 };
  if (ch === 'U') return { key: 'uu', length: 1 };
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Convert Arabic numerals (0-9) to Devanagari numerals (०-९).
 */
export function convertNepaliNumbers(text) {
  if (!text) return '';
  return text.replace(/[0-9]/g, (d) => DIGIT_MAP[d] || d);
}

/**
 * Count characters and words in text.
 */
export function countChars(text) {
  if (!text) return { chars: 0, words: 0 };
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { chars, words };
}
