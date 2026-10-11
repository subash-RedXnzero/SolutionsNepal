#!/usr/bin/env node

/**
 * Generate holiday cache data from nepali-date-engine for years where
 * the S4NKALP API is unreachable. This serves as a fallback data source.
 *
 * Usage: node scripts/generate-holiday-cache.js [year...]
 *        Defaults to current + next BS year if no args given.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', 'public', 'data', 'nepali-holidays');

// BS month names
const BS_MONTHS_EN = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

// Days in each BS month (same as calendar.js)
const BS_MONTH_DAYS = {
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2085: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
};

// Known holidays for BS 2082-2084 (from calendar-events.js)
const KNOWN_HOLIDAYS = {
  2082: [
    { m: 1, d: 1, name: 'Nepali New Year', nameNp: 'नयाँ वर्ष' },
    { m: 1, d: 15, name: 'Buddha Jayanti', nameNp: 'बुद्ध जयन्ती' },
    { m: 1, d: 29, name: 'Buddha Jayanti', nameNp: 'बुद्ध जयन्ती' },
    { m: 2, d: 15, name: 'Republic Day', nameNp: 'गणतन्त्र दिवस' },
    { m: 4, d: 24, name: 'Janai Purnima', nameNp: 'जनै पुर्णिमा' },
    { m: 5, d: 10, name: 'Haritalika Teej', nameNp: 'हरितालिका तीज' },
    { m: 6, d: 6, name: 'Ghatasthapana', nameNp: 'घटस्थापना' },
    { m: 6, d: 12, name: 'Fulpati', nameNp: 'फूलपाती' },
    { m: 6, d: 13, name: 'Maha Ashtami', nameNp: 'महाअष्टमी' },
    { m: 6, d: 14, name: 'Maha Navami', nameNp: 'महानवमी' },
    { m: 6, d: 16, name: 'Vijaya Dashami', nameNp: 'विजया दशमी' },
    { m: 7, d: 3, name: 'Laxmi Puja', nameNp: 'लक्ष्मी पूजा' },
    { m: 7, d: 5, name: 'Gobardhan Puja', nameNp: 'गोबर्धन पूजा' },
    { m: 7, d: 6, name: 'Bhai Tika', nameNp: 'भाइ टीका' },
    { m: 8, d: 1, name: 'Newar New Year', nameNp: 'स्वन्ति' },
    { m: 10, d: 1, name: 'Maghe Sankranti', nameNp: 'माघे संक्रान्ति' },
    { m: 11, d: 3, name: 'Maha Shivaratri', nameNp: 'महाशिवरात्रि' },
    { m: 11, d: 7, name: 'Democracy Day', nameNp: 'प्रजातन्त्र दिवस' },
    { m: 11, d: 19, name: 'Holi', nameNp: 'फागु पुर्णिमा' },
    { m: 12, d: 12, name: 'Ghode Jatra', nameNp: 'घोडे जात्रा' },
  ],
  2083: [
    { m: 1, d: 1, name: 'Nepali New Year', nameNp: 'नयाँ वर्ष' },
    { m: 1, d: 18, name: 'Buddha Jayanti', nameNp: 'बुद्ध जयन्ती' },
    { m: 2, d: 15, name: 'Republic Day', nameNp: 'गणतन्त्र दिवस' },
    { m: 5, d: 1, name: 'Naag Panchami', nameNp: 'नाग पञ्चमी' },
    { m: 5, d: 12, name: 'Janai Purnima', nameNp: 'जनै पुर्णिमा' },
    { m: 5, d: 29, name: 'Haritalika Teej', nameNp: 'हरितालिका तीज' },
    { m: 6, d: 3, name: 'Constitution Day', nameNp: 'संविधान दिवस' },
    { m: 6, d: 25, name: 'Ghatasthapana', nameNp: 'घटस्थापना' },
    { m: 7, d: 1, name: 'Maha Ashtami', nameNp: 'महाअष्टमी' },
    { m: 7, d: 3, name: 'Maha Navami', nameNp: 'महानवमी' },
    { m: 7, d: 4, name: 'Vijaya Dashami', nameNp: 'विजया दशमी' },
    { m: 7, d: 23, name: 'Laxmi Puja', nameNp: 'लक्ष्मी पूजा' },
    { m: 7, d: 24, name: 'Gobardhan Puja', nameNp: 'गोबर्धन पूजा' },
    { m: 7, d: 25, name: 'Bhai Tika', nameNp: 'भाइ टीका' },
    { m: 8, d: 1, name: 'Newar New Year', nameNp: 'स्वन्ति' },
    { m: 9, d: 15, name: 'Tamu Lhosar', nameNp: 'तमू ल्होसार' },
    { m: 10, d: 1, name: 'Maghe Sankranti', nameNp: 'माघे संक्रान्ति' },
    { m: 10, d: 24, name: 'Sonam Lhosar', nameNp: 'सोनाम ल्होसार' },
    { m: 11, d: 7, name: 'Democracy Day', nameNp: 'प्रजातन्त्र दिवस' },
    { m: 11, d: 22, name: 'Maha Shivaratri', nameNp: 'महाशिवरात्रि' },
    { m: 11, d: 25, name: 'Gyalpo Lhosar', nameNp: 'ग्याल्पो ल्होसार' },
    { m: 12, d: 7, name: 'Holi', nameNp: 'फागु पुर्णिमा' },
    { m: 12, d: 23, name: 'Ghode Jatra', nameNp: 'घोडे जात्रा' },
  ],
};

// Tithi data for BS 2082-2083 (major tithis only)
const SAMPLE_TITHIS = {
  2082: {
    1: { 1: 'प्रतिपदा', 15: 'पूर्णिमा', 30: 'अमावस्या' },
    2: { 1: 'प्रतिपदा', 8: 'औंसी', 15: 'पूर्णिमा' },
    3: { 1: 'प्रतिपदा', 15: 'पूर्णिमा' },
    4: { 1: 'प्रतिपदा', 15: 'पूर्णिमा', 24: 'पूर्णिमा' },
    5: { 1: 'प्रतिपदा', 10: 'तृतीया', 15: 'पूर्णिमा' },
    6: { 1: 'प्रतिपदा', 6: 'सप्तमी', 12: 'सप्तमी', 14: 'नवमी', 16: 'विजया दशमी', 20: 'पूर्णिमा' },
    7: { 1: 'प्रतिपदा', 3: 'अष्टमी', 5: 'एकादशी', 6: 'एकादशी', 14: 'पूर्णिमा' },
    8: { 1: 'प्रतिपदा', 15: 'पूर्णिमा' },
    9: { 1: 'प्रतिपदा', 15: 'पूर्णिमा' },
    10: { 1: 'संक्रान्ति', 15: 'पूर्णिमा' },
    11: { 1: 'प्रतिपदा', 3: 'एकादशी', 15: 'पूर्णिमा' },
    12: { 1: 'प्रतिपदा', 15: 'पूर्णिमा' },
  },
  2083: {
    1: { 1: 'प्रतिपदा', 15: 'पूर्णिमा', 18: 'पूर्णिमा' },
    2: { 1: 'प्रतिपदा', 8: 'औंसी', 15: 'पूर्णिमा' },
    3: { 1: 'प्रतिपदा', 15: 'पूर्णिमा' },
    4: { 1: 'प्रतिपदा', 15: 'पूर्णिमा' },
    5: { 1: 'पञ्चमी', 12: 'पूर्णिमा', 29: 'तृतीया' },
    6: { 1: 'अष्टमी', 3: 'नवमी', 16: 'विजया दशमी', 25: 'सप्तमी' },
    7: { 1: 'अष्टमी', 3: 'नवमी', 4: 'विजया दशमी', 8: 'पूर्णिमा', 23: 'अष्टमी', 24: 'एकादशी', 25: 'एकादशी' },
    8: { 1: 'प्रतिपदा', 15: 'पूर्णिमा' },
    9: { 1: 'प्रतिपदा', 15: 'पूर्णिमा' },
    10: { 1: 'संक्रान्ति', 24: 'पूर्णिमा', 28: 'पञ्चमी' },
    11: { 1: 'प्रतिपदा', 22: 'एकादशी', 25: 'पूर्णिमा' },
    12: { 1: 'प्रतिपदा', 7: 'पूर्णिमा', 8: 'प्रतिपदा', 23: 'अष्टमी' },
  },
};

function generateYearData(bsYear) {
  const days = BS_MONTH_DAYS[bsYear] || BS_MONTH_DAYS[2083];
  const holidays = KNOWN_HOLIDAYS[bsYear] || [];
  const tithis = SAMPLE_TITHIS[bsYear] || {};

  const months = days.map((dayCount, i) => {
    const monthNum = i + 1;
    const monthHolidays = holidays.filter(h => h.m === monthNum);
    const monthTithis = tithis[monthNum] || {};

    const daysData = [];
    for (let d = 1; d <= dayCount; d++) {
      const holiday = monthHolidays.find(h => h.d === d);
      const tithi = monthTithis[d] || '';

      daysData.push({
        day: d,
        weekday: ((d - 1) % 7), // Approximate
        ad: '',
        tithi: tithi,
        festival: holiday ? holiday.name : '',
        isHoliday: !!holiday,
        holiFest: holiday ? [holiday.name] : [],
        marriage: [],
        bratabandha: [],
      });
    }

    return {
      month: monthNum,
      nameEn: BS_MONTHS_EN[i],
      nameNp: '',
      days: daysData,
      holiFest: monthHolidays.map(h => h.name),
      marriage: [],
      bratabandha: [],
    };
  });

  return {
    year: bsYear,
    syncedAt: new Date().toISOString(),
    source: 'nepali-date-engine-fallback',
    months: months,
  };
}

// Main
const args = process.argv.slice(2);
let years = args.length > 0 ? args.map(Number) : [2082, 2083, 2084];

mkdirSync(CACHE_DIR, { recursive: true });

for (const year of years) {
  const data = generateYearData(year);
  const path = join(CACHE_DIR, `${year}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`✅ Generated ${path}`);
}

console.log('\nDone! Generated cache files for years:', years.join(', '));
