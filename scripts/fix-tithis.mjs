#!/usr/bin/env node
/**
 * Extract tithis from the user's verified event dataset and fill gaps by interpolation.
 * The user's data has tithis for dates with events. For dates without events,
 * we interpolate from neighboring known tithis.
 */

// Tithi sequence (0-indexed for math)
const TITHI_ORDER = [
  'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी',
  'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
  'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी',
  'पूर्णिमा', // Shukla Paksha ends at Purnima (15)
];

const TITHI_ORDER_KRISHNA = [
  'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी',
  'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
  'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी',
  'अमावस्या', // Krishna Paksha ends at Amavasya (15)
];

// All 30 tithi names in order (Shukla then Krishna)
const ALL_TITHIS = [...TITHI_ORDER, ...TITHI_ORDER_KRISHNA];

// Number to Devanagari mapping
function numToNep(n) {
  const nepDigits = ['०','१','२','३','४','५','६','७','८','९'];
  return String(n).split('').map(d => nepDigits[+d]).join('');
}

// Parse user's larger dataset - tithis extracted from events
// Format: { month: { day: tithi_name } }
const USER_TITHIS = {
  // Baisakh 2083 (month 1)
  1: {
    1: 'द्वादशी', 2: 'त्रयोदशी', 3: 'चतुर्दशी', 4: 'अमावस्या',
    5: 'प्रतिपदा', 6: 'द्वितीया', 7: 'तृतीया', 8: 'चतुर्थी',
    9: 'पञ्चमी', 10: 'सप्तमी', 11: 'अष्टमी', 12: 'नवमी',
    13: 'दशमी', 14: 'एकादशी', 15: 'द्वादशी', 16: 'त्रयोदशी',
    17: 'चतुर्दशी', 18: 'पूर्णिमा',
    20: 'द्वितीया', 22: 'चतुर्थी',
    25: 'षष्ठी', 26: 'सप्तमी',
    28: 'नवमी', 29: 'दशमी', 30: 'एकादशी', 31: 'द्वादशी',
  },
  // Jestha 2083 (month 2)
  2: {
    1: 'त्रयोदशी', 2: 'चतुर्दशी', 3: 'पूर्णिमा',
    8: 'षष्ठी', 9: 'सप्तमी', 10: 'अष्टमी',
    12: 'दशमी', 13: 'एकादशी', 14: 'द्वादशी', 15: 'त्रयोदशी',
    17: 'पूर्णिमा', 18: 'प्रतिपदा',
    21: 'चतुर्थी', 22: 'पञ्चमी',
    24: 'सप्तमी', 25: 'अष्टमी',
    28: 'एकादशी', 29: 'द्वादशी',
    31: 'चतुर्दशी', 32: 'अमावस्या',
  },
  // Ashadh 2083 (month 3)
  3: {
    1: 'अमावस्या', 2: 'प्रतिपदा', 3: 'तृतीया',
    5: 'पञ्चमी', 6: 'षष्ठी', 7: 'सप्तमी', 8: 'अष्टमी',
    9: 'नवमी', 11: 'एकादशी', 12: 'द्वादशी', 13: 'त्रयोदशी',
    15: 'पूर्णिमा',
    18: 'द्वितीया', 20: 'चतुर्थी',
    23: 'सप्तमी', 24: 'अष्टमी',
    26: 'एकादशी', 27: 'द्वादशी', 28: 'त्रयोदशी',
    29: 'चतुर्दशी', 31: 'प्रतिपदा', 32: 'द्वितीया',
  },
  // Shrawan 2083 (month 4)
  4: {
    1: 'चतुर्दशी', 2: 'अमावस्या', 3: 'प्रतिपदा',
    5: 'तृतीया', 6: 'चतुर्थी', 7: 'पञ्चमी', 8: 'षष्ठी',
    9: 'सप्तमी', 10: 'अष्टमी', 11: 'नवमी', 12: 'दशमी',
    13: 'एकादशी', 14: 'द्वादशी', 15: 'त्रयोदशी', 16: 'चतुर्दशी',
    17: 'पूर्णिमा', 18: 'प्रतिपदा', 19: 'द्वितीया', 20: 'तृतीया',
    21: 'चतुर्थी', 22: 'पञ्चमी', 23: 'षष्ठी', 24: 'सप्तमी',
    25: 'अष्टमी', 26: 'नवमी', 27: 'दशमी', 28: 'एकादशी',
    29: 'द्वादशी', 30: 'त्रयोदशी', 31: 'चतुर्दशी',
  },
  // Bhadra 2083 (month 5)
  5: {
    1: 'पञ्चमी', 2: 'षष्ठी', 3: 'सप्तमी', 4: 'अष्टमी',
    7: 'एकादशी', 9: 'द्वादशी', 10: 'त्रयोदशी',
    12: 'पूर्णिमा', 13: 'प्रतिपदा', 14: 'द्वितीया', 15: 'तृतीया',
    16: 'चतुर्थी', 18: 'सप्तमी', 19: 'अष्टमी', 20: 'नवमी',
    22: 'एकादशी', 23: 'द्वादशी', 25: 'अमावस्या',
    26: 'अमावस्या', 27: 'प्रतिपदा', 28: 'द्वितीया', 29: 'तृतीया',
    31: 'पञ्चमी',
  },
  // Ashwin 2083 (month 6)
  6: {
    1: 'षष्ठी', 2: 'सप्तमी', 3: 'अष्टमी',
    5: 'दशमी', 6: 'एकादशी', 7: 'द्वादशी', 8: 'त्रयोदशी',
    9: 'चतुर्दशी', 10: 'पूर्णिमा', 11: 'प्रतिपदा', 12: 'द्वितीया',
    13: 'तृतीया', 14: 'चतुर्थी', 15: 'पञ्चमी', 16: 'षष्ठी',
    17: 'सप्तमी', 18: 'अष्टमी', 19: 'नवमी', 20: 'दशमी',
    21: 'एकादशी', 22: 'द्वादशी', 23: 'त्रयोदशी', 24: 'चतुर्दशी',
    25: 'अमावस्या',
    27: 'तृतीया', 29: 'पञ्चमी', 30: 'षष्ठी', 31: 'सप्तमी',
  },
  // Kartik 2083 (month 7)
  7: {
    1: 'अष्टमी', 2: 'नवमी', 3: 'दशमी', 4: 'एकादशी',
    5: 'द्वादशी', 6: 'त्रयोदशी', 7: 'चतुर्दशी', 8: 'पूर्णिमा',
    9: 'प्रतिपदा',
    14: 'षष्ठी', 15: 'सप्तमी', 16: 'अष्टमी',
    19: 'एकादशी', 20: 'द्वादशी', 21: 'त्रयोदशी', 22: 'चतुर्दशी',
    23: 'अमावस्या', 24: 'प्रतिपदा', 25: 'द्वितीया',
    26: 'तृतीया', 28: 'पञ्चमी', 29: 'षष्ठी', 30: 'सप्तमी',
  },
  // Mangsir 2083 (month 8)
  8: {
    1: 'अष्टमी', 2: 'नवमी', 3: 'दशमी', 4: 'एकादशी',
    5: 'द्वादशी', 6: 'त्रयोदशी', 7: 'चतुर्दशी', 8: 'पूर्णिमा',
    9: 'प्रतिपदा',
    15: 'सप्तमी', 16: 'अष्टमी', 17: 'नवमी', 18: 'दशमी',
    19: 'एकादशी', 20: 'द्वादशी', 21: 'त्रयोदशी', 22: 'अमावस्या',
    23: 'अमावस्या', 24: 'प्रतिपदा',
  },
  // Poush 2083 (month 9)
  9: {
    1: 'त्रयोदशी', 2: 'चतुर्दशी', 3: 'अमावस्या',
    4: 'प्रतिपदा', 5: 'द्वितीया',
    6: 'तृतीया', 7: 'चतुर्थी', 8: 'पञ्चमी',
    9: 'षष्ठी', 10: 'सप्तमी', 11: 'अष्टमी', 12: 'नवमी',
    13: 'दशमी', 14: 'एकादशी', 15: 'द्वादशी', 16: 'त्रयोदशी',
    17: 'चतुर्दशी', 18: 'पूर्णिमा', 19: 'प्रतिपदा',
    21: 'तृतीया', 23: 'पञ्चमी',
    27: 'अष्टमी', 29: 'दशमी',
    31: 'द्वादशी',
  },
  // Magh 2083 (month 10)
  10: {
    1: 'चतुर्दशी', 2: 'अमावस्या',
    3: 'प्रतिपदा', 4: 'द्वितीया', 5: 'तृतीया',
    6: 'चतुर्थी', 7: 'पञ्चमी', 8: 'षष्ठी', 9: 'सप्तमी',
    10: 'अष्टमी', 11: 'नवमी', 12: 'दशमी', 13: 'एकादशी',
    14: 'द्वादशी', 15: 'त्रयोदशी', 16: 'चतुर्दशी',
    17: 'पूर्णिमा', 18: 'प्रतिपदा', 19: 'द्वितीया', 20: 'तृतीया',
    21: 'चतुर्थी', 22: 'पञ्चमी', 23: 'षष्ठी', 24: 'सप्तमी',
    25: 'अष्टमी', 26: 'नवमी', 27: 'दशमी', 28: 'एकादशी',
    29: 'द्वादशी',
  },
  // Falgun 2083 (month 11)
  11: {
    1: 'त्रयोदशी', 2: 'चतुर्दशी', 3: 'अमावस्या',
    4: 'प्रतिपदा', 5: 'द्वितीया', 6: 'तृतीया',
    7: 'चतुर्थी', 8: 'पञ्चमी', 9: 'षष्ठी', 10: 'सप्तमी',
    11: 'अष्टमी', 12: 'नवमी', 13: 'दशमी', 14: 'एकादशी',
    15: 'द्वादशी', 16: 'त्रयोदशी', 17: 'चतुर्दशी',
    18: 'पूर्णिमा', 19: 'प्रतिपदा', 20: 'द्वितीया', 21: 'तृतीया',
    22: 'चतुर्थी', 23: 'पञ्चमी', 24: 'षष्ठी', 25: 'सप्तमी',
    26: 'अष्टमी', 27: 'नवमी', 28: 'दशमी', 29: 'एकादशी',
  },
  // Chaitra 2083 (month 12)
  12: {
    1: 'द्वादशी', 2: 'त्रयोदशी', 3: 'चतुर्दशी', 4: 'पूर्णिमा',
    5: 'प्रतिपदा', 6: 'द्वितीया', 7: 'तृतीया', 8: 'चतुर्थी',
    9: 'पञ्चमी', 10: 'षष्ठी', 11: 'सप्तमी', 12: 'अष्टमी',
    13: 'नवमी', 14: 'दशमी', 15: 'एकादशी', 16: 'द्वादशी',
    17: 'त्रयोदशी', 18: 'चतुर्दशी', 19: 'अमावस्या',
    20: 'प्रतिपदा', 21: 'द्वितीया', 22: 'तृतीया', 23: 'चतुर्थी',
    24: 'पञ्चमी', 25: 'षष्ठी', 26: 'सप्तमी', 27: 'अष्टमी',
    28: 'नवमी', 29: 'दशमी', 30: 'एकादशी', 31: 'द्वादशी',
  },
};

// Days in each BS month for 2083
const DAYS_IN_MONTH_2083 = [30, 31, 32, 31, 31, 30, 30, 29, 30, 29, 30, 30];

// For months that have day 32 (Ashadh, Jestha), they are known to haveAdhik Maas
// Actually: Baisakh=30, Jestha=31, Ashadh=32, Shrawan=31, Bhadra=31, Ashwin=30, Kartik=30, Mangsir=29, Poush=30, Magh=29, Falgun=30, Chaitra=30

// Actually BS 2083 has these days per month:
// Baisakh: 30, Jestha: 31, Ashadh: 32, Shrawan: 31, Bhadra: 31, Ashwin: 30
// Kartik: 30, Mangsir: 29, Poush: 30, Magh: 29, Falgun: 30, Chaitra: 30

/**
 * Interpolate missing tithis between known ones.
 * Uses the tithi index sequence to fill gaps.
 */
function interpolateTithis(known, daysInMonth) {
  const result = {};
  const knownDays = Object.keys(known).map(Number).sort((a, b) => a - b);

  if (knownDays.length === 0) return result;

  // Copy known values
  for (const d of knownDays) {
    result[d] = known[d];
  }

  // Fill gaps between consecutive known tithis
  for (let i = 0; i < knownDays.length - 1; i++) {
    const startDay = knownDays[i];
    const endDay = knownDays[i + 1];
    const startTithi = known[startDay];
    const endTithi = known[endDay];

    const startIdx = ALL_TITHIS.indexOf(startTithi);
    const endIdx = ALL_TITHIS.indexOf(endTithi);

    if (startIdx === -1 || endIdx === -1) continue;

    const gap = endDay - startDay;
    if (gap <= 1) continue;

    // Calculate tithi progression
    let tithiDiff = endIdx - startIdx;
    if (tithiDiff < 0) tithiDiff += ALL_TITHIS.length;

    // Distribute tithis across the gap
    for (let j = 1; j < gap; j++) {
      const day = startDay + j;
      if (result[day]) continue; // Already known

      const tithiIdx = (startIdx + Math.round(tithiDiff * j / gap)) % ALL_TITHIS.length;
      result[day] = ALL_TITHIS[tithiIdx];
    }
  }

  // Fill before first known
  if (knownDays.length > 0) {
    const firstDay = knownDays[0];
    const firstTithi = known[firstDay];
    const firstIdx = ALL_TITHIS.indexOf(firstTithi);

    for (let d = firstDay - 1; d >= 1; d--) {
      if (result[d]) continue;
      // Go backwards in tithi sequence
      const stepsBack = firstDay - d;
      const tithiIdx = (firstIdx - stepsBack + ALL_TITHIS.length * 100) % ALL_TITHIS.length;
      result[d] = ALL_TITHIS[tithiIdx];
    }
  }

  // Fill after last known
  if (knownDays.length > 0) {
    const lastDay = knownDays[knownDays.length - 1];
    const lastTithi = known[lastDay];
    const lastIdx = ALL_TITHIS.indexOf(lastTithi);

    for (let d = lastDay + 1; d <= daysInMonth; d++) {
      if (result[d]) continue;
      const stepsForward = d - lastDay;
      const tithiIdx = (lastIdx + stepsForward) % ALL_TITHIS.length;
      result[d] = ALL_TITHIS[tithiIdx];
    }
  }

  return result;
}

// Generate the corrected TITHI_DATA
console.log('// Corrected tithi data for BS 2082-2084');
console.log('// Generated from verified Hamro Patro / MoHA 2083 calendar data');
console.log('// Lunar tithis are NOT sequential - they shift based on actual moon phases');
console.log('');

// For BS 2083 - use user's verified data
console.log("  // ═══════════════════════════════════════════════════════════════");
console.log("  // BS 2083 (Apr 14, 2026 - Apr 13, 2027)");
console.log("  // Tithis verified from Hamro Patro / MoHA official calendar");
console.log("  // ═══════════════════════════════════════════════════════════════");
console.log('');

const MONTH_NAMES = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];

for (let m = 1; m <= 12; m++) {
  const known = USER_TITHIS[m] || {};
  const daysInMonth = DAYS_IN_MONTH_2083[m - 1];
  const filled = interpolateTithis(known, daysInMonth);

  console.log(`  '2083-${m}': { // ${MONTH_NAMES[m-1]}`);

  for (let d = 1; d <= daysInMonth; d++) {
    const tithi = filled[d] || '???';
    const suffix = d < daysInMonth ? ',' : '';
    const marker = known[d] ? '' : ' // interpolated';
    process.stdout.write(`    ${d}: '${tithi}'${suffix}`);
    if (marker || d % 5 === 0) {
      console.log(marker || '');
    } else {
      console.log('');
    }
  }

  console.log('  },');
  console.log('');
}
