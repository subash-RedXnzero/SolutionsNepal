/**
 * Panchang data for BS 2082-2084.
 *
 * Contains Nakshatra, Yoga, Karana cycles, and approximate sun/moon
 * rise/set times for Kathmandu (27.7°N, 85.3°E, UTC+5:45).
 *
 * Nakshatra: 27 nakshatras cycle through tithis
 * Yoga: 27 yogas cycle through solar-lunar longitude difference
 * Karana: 11 karanas in a fixed cycle per paksha
 *
 * Sunrise/Sunset: Approximate for Kathmandu, varies by month.
 * These are reasonable estimates for UI display.
 */

// 27 Nakshatras
export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
  'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
  'Vishakha', 'Anuradha', 'Jyeshta', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

export const NAKSHATRAS_NP = [
  'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा',
  'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'अश्लेषा', 'मघा',
  'पूर्व फाल्गुनी', 'उत्तर फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति',
  'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढा',
  'उत्तराषाढा', 'श्रवण', 'धनिष्ठा', 'शतभिषा',
  'पूर्व भाद्रपद', 'उत्तर भाद्रपद', 'रेवती',
];

// 27 Yogas
export const YOGAS = [
  'Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarman', 'Dhriti', 'Shula', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti',
];

export const YOGAS_NP = [
  'विष्कुम्भ', 'प्रीति', 'आयुष्मान', 'सौभाग्य', 'शोभन',
  'अतिगण्ड', 'सुकर्मन', 'धृति', 'शूल', 'गण्ड',
  'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र',
  'सिद्धि', 'व्यातिपात', 'वरियन', 'परिघ', 'शिव',
  'सिद्ध', 'साध्य', 'शुभ', 'शुक्ल', 'ब्रह्मा',
  'इन्द्र', 'वैधृति',
];

// 11 Karanas (repeat in fixed pattern within each paksha)
export const KARANAS = [
  'Kimstughna', 'Shakuni', 'Chatushpada', 'Nagava', 'Kintughna',
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija',
];

export const KARANAS_NP = [
  'किम्स्तुघ्न', 'शकुनि', 'चतुष्पाद', 'नागव', 'किन्तुघ्न',
  'बव', 'बालव', 'कौलव', 'तैतिल', 'गर', 'वणिज',
];

// Approximate sunrise/sunset for Kathmandu by BS month (approximate AD months)
// Format: [sunrise_h, sunrise_m, sunset_h, sunset_m, moonrise_h, moonrise_m, moonset_h, moonset_m]
// These are seasonal averages
const SUN_MOON_BY_MONTH = {
  1:  { sr: [5, 25], ss: [18, 10], mr: [16, 0], ms: [4, 0] },   // Baisakh (Apr/May)
  2:  { sr: [5, 18], ss: [18, 22], mr: [17, 0], ms: [5, 0] },   // Jestha (May/Jun)
  3:  { sr: [5, 16], ss: [18, 30], mr: [18, 0], ms: [6, 0] },   // Ashadh (Jun/Jul)
  4:  { sr: [5, 20], ss: [18, 25], mr: [19, 0], ms: [7, 0] },   // Shrawan (Jul/Aug)
  5:  { sr: [5, 28], ss: [18, 10], mr: [19, 30], ms: [7, 30] }, // Bhadra (Aug/Sep)
  6:  { sr: [5, 35], ss: [17, 50], mr: [19, 0], ms: [7, 0] },   // Ashwin (Sep/Oct)
  7:  { sr: [5, 42], ss: [17, 28], mr: [18, 0], ms: [6, 0] },   // Kartik (Oct/Nov)
  8:  { sr: [6, 5], ss: [17, 10], mr: [17, 0], ms: [5, 0] },    // Mangsir (Nov/Dec)
  9:  { sr: [6, 25], ss: [17, 10], mr: [16, 30], ms: [5, 0] },  // Poush (Dec/Jan)
  10: { sr: [6, 35], ss: [17, 25], mr: [16, 0], ms: [4, 30] },  // Magh (Jan/Feb)
  11: { sr: [6, 20], ss: [17, 45], mr: [15, 30], ms: [4, 0] },  // Falgun (Feb/Mar)
  12: { sr: [5, 55], ss: [18, 5], mr: [15, 30], ms: [4, 0] },   // Chaitra (Mar/Apr)
};

// Approximate tithi-to-nakshatra mapping for BS 2083
// This is simplified — in reality, nakshatra shifts with tithi
// For BS 2083, the starting nakshatra of Baisakh 1 is approximately Krittika
const BS2083_START_NAKSHATRA = 2; // Krittika (0-indexed)
const BS2082_START_NAKSHATRA = 19; // Purva Ashadha (0-indexed)
const BS2084_START_NAKSHATRA = 6; // Punarvasu (0-indexed)

// Approximate starting yoga for each year
const BS2083_START_YOGA = 14; // Vajra
const BS2082_START_YOGA = 5; // Shobhana
const BS2084_START_YOGA = 24; // Brahma

// Approximate starting karana for each year (index into KARANAS)
const BS2083_START_KARANA = 5; // Bava
const BS2082_START_KARANA = 2; // Chatushpada
const BS2084_START_KARANA = 8; // Taitila

// Rahu Kaal approximate times by weekday (1=Sunday through 6=Saturday)
// These are the standard Rahu Kaal times for Kathmandu
export const RahuKaal = {
  0: { start: [16, 30], end: [18, 0] },    // Sunday
  1: { start: [7, 30], end: [9, 0] },      // Monday
  2: { start: [15, 0], end: [16, 30] },    // Tuesday
  3: { start: [12, 0], end: [13, 30] },    // Wednesday
  4: { start: [13, 30], end: [15, 0] },    // Thursday
  5: { start: [10, 30], end: [12, 0] },    // Friday
  6: { start: [9, 0], end: [10, 30] },     // Saturday
};

export const RahuKaal_NP = {
  0: { label: 'राहु काल' },    // Sunday
  1: { label: 'राहु काल' },    // Monday
  2: { label: 'राहु काल' },    // Tuesday
  3: { label: 'राहु काल' },    // Wednesday
  4: { label: 'राहु काल' },    // Thursday
  5: { label: 'राहु काल' },    // Friday
  6: { label: 'राहु काल' },    // Saturday
};

// Approximate moon phase (0=new, 50=full, 99=new again)
// Based on tithi: Shukla 1-15 = 0→50, Krishna 1-15 = 50→0
function approxMoonPhase(tithiName) {
  if (!tithiName) return null;
  const tithiOrder = [
    'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी',
    'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
    'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा',
    'अमावस्या'
  ];

  if (tithiName === 'अमावस्या') return 0;
  if (tithiName === 'पूर्णिमा') return 50;

  const idx = tithiOrder.indexOf(tithiName);
  if (idx < 0) return null;
  if (idx <= 14) {
    // Shukla paksha: waxing
    return Math.round((idx / 14) * 50);
  }
  return null;
}

/**
 * Get panchang data for a given BS date.
 * @param {number} bsYear
 * @param {number} bsMonth
 * @param {number} bsDay
 * @param {string} tithiName - The tithi for this date
 * @param {number} weekday - 0=Sunday, 6=Saturday
 * @returns {Object} Panchang data
 */
export function getPanchang(bsYear, bsMonth, bsDay, tithiName, weekday) {
  // Calculate approximate day index from year start
  let dayIndex = bsDay;
  for (let m = 1; m < bsMonth; m++) {
    // Approximate days per month (30 average)
    dayIndex += 30;
  }

  // Add year offset
  const yearOffset = (bsYear - 2082) * 365;
  dayIndex += yearOffset;

  // Nakshatra cycles every 27 days
  const startNak = bsYear === 2083 ? BS2083_START_NAKSHATRA
    : bsYear === 2082 ? BS2082_START_NAKSHATRA
    : BS2084_START_NAKSHATRA;
  const nakIdx = (startNak + dayIndex) % 27;

  // Yoga cycles every 27 days
  const startYoga = bsYear === 2083 ? BS2083_START_YOGA
    : bsYear === 2082 ? BS2082_START_YOGA
    : BS2084_START_YOGA;
  const yogaIdx = (startYoga + dayIndex) % 27;

  // Karana cycles every 60 days (11 karanas, special repeat pattern)
  const startKar = bsYear === 2083 ? BS2083_START_KARANA
    : bsYear === 2082 ? BS2082_START_KARANA
    : BS2084_START_KARANA;
  const karIdx = (startKar + dayIndex) % 11;

  // Sun/moon times based on month
  const sunMoon = SUN_MOON_BY_MONTH[bsMonth] || SUN_MOON_BY_MONTH[1];

  // Rahu Kaal based on weekday
  const rahu = RahuKaal[weekday] || RahuKaal[0];

  // Moon phase
  const moonPhase = approxMoonPhase(tithiName);

  // Moon phase label
  let moonPhaseLabel = '';
  if (tithiName === 'पूर्णिमा') moonPhaseLabel = 'पूर्ण चन्द्र (Full Moon)';
  else if (tithiName === 'अमावस्या') moonPhaseLabel = 'अमावस्या (New Moon)';
  else if (tithiName === 'एकादशी' || tithiName === 'द्वादशी') moonPhaseLabel = 'शुक्ल पक्ष (Waxing)';
  else if (tithiName === 'त्रयोदशी' || tithiName === 'चतुर्दशी') moonPhaseLabel = 'कृष्ण पक्ष (Waning)';

  // Paksha
  let paksha = '';
  let pakshaNp = '';
  if (tithiName === 'पूर्णिमा') { paksha = 'Shukla'; pakshaNp = 'शुक्ल पक्ष'; }
  else if (tithiName === 'अमावस्या') { paksha = 'Krishna'; pakshaNp = 'कृष्ण पक्ष'; }
  else if (['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पञ्चमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी'].includes(tithiName)) {
    // Determine paksha by position in cycle
    // This is approximate — in reality it depends on the tithi boundary
    const tithiIdx = ['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पञ्चमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी'].indexOf(tithiName);
    // Simple heuristic: first half of month = shukla, second = krishna
    if (dayIndex % 30 < 15) { paksha = 'Shukla'; pakshaNp = 'शुक्ल पक्ष'; }
    else { paksha = 'Krishna'; pakshaNp = 'कृष्ण पक्ष'; }
  }

  const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return {
    nakshatra: NAKSHATRAS[nakIdx],
    nakshatraNp: NAKSHATRAS_NP[nakIdx],
    yoga: YOGAS[yogaIdx],
    yogaNp: YOGAS_NP[yogaIdx],
    karana: KARANAS[karIdx],
    karanaNp: KARANAS_NP[karIdx],
    paksha,
    pakshaNp,
    sunrise: fmt(sunMoon.sr[0], sunMoon.sr[1]),
    sunset: fmt(sunMoon.ss[0], sunMoon.ss[1]),
    moonrise: fmt(sunMoon.mr[0], sunMoon.mr[1]),
    moonset: fmt(sunMoon.ms[0], sunMoon.ms[1]),
    moonPhase,
    moonPhaseLabel,
    rahuStart: fmt(rahu.start[0], rahu.start[1]),
    rahuEnd: fmt(rahu.end[0], rahu.end[1]),
    rahuLabel: 'राहु काल',
  };
}
