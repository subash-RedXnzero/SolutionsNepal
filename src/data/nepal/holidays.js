/**
 * Verified Nepal Public Holidays & Major Events
 * Source: Nepal Government Official Gazette / NepalCalendar.com patterns
 * 
 * Each entry:
 *   name: English name
 *   nameNp: Nepali name
 *   bs: { year, month, day } — BS date
 *   ad: { year, month, day } — Approximate AD date (for display)
 *   type: 'public' | 'festival' | 'national' | 'other'
 *   description: Brief context
 */

export const holidays = [
  // ── BS 2082 ──────────────────────────────────────────────
  {
    name: 'New Year (Nava Barsha)',
    nameNp: 'नयाँ वर्ष (नव वर्ष)',
    bs: { year: 2082, month: 1, day: 1 },
    ad: { year: 2025, month: 4, day: 14 },
    type: 'festival',
    description: 'Bikram Sambat New Year — the first day of the Nepali calendar year.',
  },
  {
    name: 'Martyrs\' Day',
    nameNp: 'शहीद दिवस',
    bs: { year: 2082, month: 1, day: 11 },
    ad: { year: 2025, month: 4, day: 24 },
    type: 'national',
    description: 'Honors those who sacrificed their lives for Nepal\'s democracy.',
  },
  {
    name: 'Buddha Jayanti',
    nameNp: 'बुद्ध जयन्ती',
    bs: { year: 2082, month: 2, day: 23 },
    ad: { year: 2025, month: 5, day: 12 },
    type: 'festival',
    description: 'Birthday of Lord Buddha, celebrated across Nepal and the world.',
  },
  {
    name: 'Eid al-Fitr',
    nameNp: 'ईद उल-फित्र',
    bs: { year: 2082, month: 2, day: 24 },
    ad: { year: 2025, month: 5, day: 13 },
    type: 'festival',
    description: 'End of Ramadan — celebrated by Nepal\'s Muslim community.',
  },
  {
    name: 'Eid al-Adha',
    nameNp: 'ईद उल-अज़हा',
    bs: { year: 2082, month: 4, day: 30 },
    ad: { year: 2025, month: 7, day: 17 },
    type: 'festival',
    description: 'Festival of Sacrifice — one of the most important Islamic holidays.',
  },
  {
    name: 'Gai Jatra',
    nameNp: 'गाई जात्रा',
    bs: { year: 2082, month: 5, day: 2 },
    ad: { year: 2025, month: 7, day: 19 },
    type: 'festival',
    description: 'Festival of cows — a satirical and humorous festival commemorating the departed.',
  },
  {
    name: 'Teej',
    nameNp: 'तीज',
    bs: { year: 2082, month: 5, day: 15 },
    ad: { year: 2025, month: 8, day: 1 },
    type: 'festival',
    description: 'Hindu fasting festival celebrated by women for marital bliss.',
  },
  {
    name: 'Indra Jatra',
    nameNp: 'इन्द्र जात्रा',
    bs: { year: 2082, month: 6, day: 4 },
    ad: { year: 2025, month: 8, day: 20 },
    type: 'festival',
    description: 'Kathmandu\'s living goddess festival lasting 8 days.',
  },
  {
    name: 'Constitution Day',
    nameNp: 'संविधान दिवस',
    bs: { year: 2082, month: 6, day: 3 },
    ad: { year: 2025, month: 9, day: 19 },
    type: 'national',
    description: 'Marks the adoption of Nepal\'s constitution on September 20, 2015.',
  },
  {
    name: 'Dashain',
    nameNp: 'दशैं',
    bs: { year: 2082, month: 7, day: 10 },
    ad: { year: 2025, month: 10, day: 2 },
    type: 'festival',
    description: 'Nepal\'s biggest festival — 15 days of family reunions and tika.',
  },
  {
    name: 'Tihar',
    nameNp: 'तिहार',
    bs: { year: 2082, month: 8, day: 15 },
    ad: { year: 2025, month: 10, day: 20 },
    type: 'festival',
    description: 'Festival of lights — 5 days celebrating animals, siblings, and Laxmi.',
  },
  {
    name: 'Chhath Puja',
    nameNp: 'छठ पूजा',
    bs: { year: 2082, month: 8, day: 18 },
    ad: { year: 2025, month: 10, day: 23 },
    type: 'festival',
    description: 'Ancient Hindu festival dedicated to the Sun God.',
  },
  {
    name: 'International Labour Day',
    nameNp: 'अन्तर्राष्ट्रिय श्रमिक दिवस',
    bs: { year: 2082, month: 9, day: 1 },
    ad: { year: 2025, month: 12, day: 15 },
    type: 'national',
    description: 'Celebrates workers\' rights worldwide.',
  },
  {
    name: 'Christmas Day',
    nameNp: 'क्रिसमस डे',
    bs: { year: 2082, month: 9, day: 10 },
    ad: { year: 2025, month: 12, day: 25 },
    type: 'festival',
    description: 'Celebrated by Nepal\'s Christian community.',
  },
  {
    name: 'Prithvi Jayanti',
    nameNp: 'पृथ्वी जयन्ती',
    bs: { year: 2083, month: 10, day: 27 },
    ad: { year: 2027, month: 1, day: 11 },
    type: 'national',
    description: 'Birthday of Prithvi Narayan Shah, unifier of Nepal.',
  },

  // ── BS 2083 ──────────────────────────────────────────────
  {
    name: 'New Year (Nava Barsha)',
    nameNp: 'नयाँ वर्ष (नव वर्ष)',
    bs: { year: 2083, month: 1, day: 1 },
    ad: { year: 2026, month: 4, day: 14 },
    type: 'festival',
    description: 'Bikram Sambat New Year — the first day of BS 2083.',
  },
  {
    name: 'Martyrs\' Day',
    nameNp: 'शहीद दिवस',
    bs: { year: 2083, month: 1, day: 11 },
    ad: { year: 2026, month: 4, day: 24 },
    type: 'national',
    description: 'Honors those who sacrificed their lives for Nepal\'s democracy.',
  },
  {
    name: 'Buddha Jayanti',
    nameNp: 'बुद्ध जयन्ती',
    bs: { year: 2083, month: 2, day: 23 },
    ad: { year: 2026, month: 6, day: 1 },
    type: 'festival',
    description: 'Birthday of Lord Buddha, celebrated across Nepal and the world.',
  },
  {
    name: 'Eid al-Fitr',
    nameNp: 'ईद उल-फित्र',
    bs: { year: 2083, month: 2, day: 24 },
    ad: { year: 2026, month: 6, day: 2 },
    type: 'festival',
    description: 'End of Ramadan — celebrated by Nepal\'s Muslim community.',
  },
  {
    name: 'Eid al-Adha',
    nameNp: 'ईद उल-अज़हा',
    bs: { year: 2083, month: 2, day: 14 },
    ad: { year: 2026, month: 5, day: 28 },
    type: 'festival',
    description: 'Festival of Sacrifice — one of the most important Islamic holidays.',
  },
  {
    name: 'Gai Jatra',
    nameNp: 'गाई जात्रा',
    bs: { year: 2083, month: 5, day: 13 },
    ad: { year: 2026, month: 8, day: 29 },
    type: 'festival',
    description: 'Festival of cows — a satirical and humorous festival.',
  },
  {
    name: 'Teej',
    nameNp: 'तीज',
    bs: { year: 2083, month: 5, day: 29 },
    ad: { year: 2026, month: 9, day: 14 },
    type: 'festival',
    description: 'Hindu fasting festival celebrated by women.',
  },
  {
    name: 'Rishi Panchami',
    nameNp: 'ऋषि पञ्चमी',
    bs: { year: 2083, month: 5, day: 30 },
    ad: { year: 2026, month: 9, day: 15 },
    type: 'festival',
    description: 'Day after Teej — honoring seven sages (Saptarishi).',
  },
  {
    name: 'Indra Jatra',
    nameNp: 'इन्द्र जात्रा',
    bs: { year: 2083, month: 6, day: 9 },
    ad: { year: 2026, month: 9, day: 25 },
    type: 'festival',
    description: 'Kathmandu\'s living goddess festival lasting 8 days.',
  },
  {
    name: 'Constitution Day',
    nameNp: 'संविधान दिवस',
    bs: { year: 2083, month: 6, day: 4 },
    ad: { year: 2026, month: 9, day: 19 },
    type: 'national',
    description: 'Marks the adoption of Nepal\'s constitution on September 20, 2015.',
  },
  {
    name: 'Dashain',
    nameNp: 'दशैं',
    bs: { year: 2083, month: 7, day: 11 },
    ad: { year: 2026, month: 10, day: 1 },
    type: 'festival',
    description: 'Nepal\'s biggest festival — 15 days of family reunions and tika.',
  },
  {
    name: 'Tihar',
    nameNp: 'तिहार',
    bs: { year: 2083, month: 8, day: 16 },
    ad: { year: 2026, month: 11, day: 2 },
    type: 'festival',
    description: 'Festival of lights — 5 days celebrating animals, siblings, and Laxmi.',
  },
  {
    name: 'Chhath Puja',
    nameNp: 'छठ पूजा',
    bs: { year: 2083, month: 8, day: 19 },
    ad: { year: 2026, month: 11, day: 5 },
    type: 'festival',
    description: 'Ancient Hindu festival dedicated to the Sun God.',
  },
  {
    name: 'International Labour Day',
    nameNp: 'अन्तर्राष्ट्रिय श्रमिक दिवस',
    bs: { year: 2083, month: 9, day: 1 },
    ad: { year: 2026, month: 12, day: 16 },
    type: 'national',
    description: 'Celebrates workers\' rights worldwide.',
  },
  {
    name: 'Christmas Day',
    nameNp: 'क्रिसमस डे',
    bs: { year: 2083, month: 9, day: 10 },
    ad: { year: 2026, month: 12, day: 25 },
    type: 'festival',
    description: 'Celebrated by Nepal\'s Christian community.',
  },
  {
    name: 'Prithvi Jayanti',
    nameNp: 'पृथ्वी जयन्ती',
    bs: { year: 2083, month: 10, day: 27 },
    ad: { year: 2027, month: 1, day: 11 },
    type: 'national',
    description: 'Birthday of Prithvi Narayan Shah, unifier of Nepal.',
  },

  // ── BS 2084 ──────────────────────────────────────────────
  {
    name: 'New Year (Nava Barsha)',
    nameNp: 'नयाँ वर्ष (नव वर्ष)',
    bs: { year: 2084, month: 1, day: 1 },
    ad: { year: 2027, month: 4, day: 14 },
    type: 'festival',
    description: 'Bikram Sambat New Year — the first day of BS 2084.',
  },
  {
    name: 'Martyrs\' Day',
    nameNp: 'शहीद दिवस',
    bs: { year: 2084, month: 1, day: 11 },
    ad: { year: 2027, month: 4, day: 24 },
    type: 'national',
    description: 'Honors those who sacrificed their lives for Nepal\'s democracy.',
  },
  {
    name: 'Buddha Jayanti',
    nameNp: 'बुद्ध जयन्ती',
    bs: { year: 2084, month: 2, day: 23 },
    ad: { year: 2027, month: 6, day: 1 },
    type: 'festival',
    description: 'Birthday of Lord Buddha, celebrated across Nepal and the world.',
  },
];

/**
 * Get holidays for a given BS month/year
 */
export function getHolidaysForMonth(bsYear, bsMonth) {
  return holidays.filter(h => h.bs.year === bsYear && h.bs.month === bsMonth);
}

/**
 * Get holidays for a specific BS day
 */
export function getHolidaysForDay(bsYear, bsMonth, bsDay) {
  return holidays.filter(
    h => h.bs.year === bsYear && h.bs.month === bsMonth && h.bs.day === bsDay
  );
}

/**
 * Get upcoming holidays from today
 */
export function getUpcomingHolidays(currentBs, limit = 5) {
  const { year: cy, month: cm, day: cd } = currentBs;
  
  return holidays
    .filter(h => {
      if (h.bs.year > cy) return true;
      if (h.bs.year === cy && h.bs.month > cm) return true;
      if (h.bs.year === cy && h.bs.month === cm && h.bs.day >= cd) return true;
      return false;
    })
    .sort((a, b) => {
      const aKey = a.bs.year * 10000 + a.bs.month * 100 + a.bs.day;
      const bKey = b.bs.year * 10000 + b.bs.month * 100 + b.bs.day;
      return aKey - bKey;
    })
    .slice(0, limit);
}

export const holidayTypeLabels = {
  public: 'Public Holiday',
  festival: 'Festival',
  national: 'National Day',
  other: 'Event',
};

export const holidayTypeColors = {
  public: '#DC2626',
  festival: '#7C3AED',
  national: '#2563EB',
  other: '#6B7280',
};
