/**
 * Nepal Public Holidays — centralized, maintainable dataset.
 *
 * Each holiday has:
 *   name      — English name
 *   bs        — { year, month, day } in Bikram Sambat
 *   ad        — { year, month, day } in Gregorian (AD)
 *   type      — 'public' | 'gazetted' | 'optional'
 *
 * BS dates are the authoritative source (Nepal government gazette).
 * AD equivalents are computed from the BS dates.
 *
 * To add/update holidays: edit the NEPAL_HOLIDAYS array below.
 * Keep holidays sorted by BS date within each year.
 */

export const NEPAL_HOLIDAYS = [
  // ── 2080 BS (Apr 2023 – Apr 2024) ──
  { name: 'New Year (Bisket)', bs: { year: 2080, month: 1, day: 1 }, ad: { year: 2023, month: 4, day: 14 }, type: 'public' },
  { name: 'Martyrs\' Day', bs: { year: 2080, month: 10, day: 16 }, ad: { year: 2024, month: 1, day: 30 }, type: 'public' },
  { name: 'Democracy Day', bs: { year: 2080, month: 11, day: 7 }, ad: { year: 2024, month: 2, day: 19 }, type: 'public' },
  { name: 'Shivaratri', bs: { year: 2080, month: 11, day: 26 }, ad: { year: 2024, month: 3, day: 8 }, type: 'public' },
  { name: 'Ghatasthapana (Dashain starts)', bs: { year: 2080, month: 7, day: 1 }, ad: { year: 2023, month: 10, day: 15 }, type: 'public' },
  { name: 'Fulpati', bs: { year: 2080, month: 7, day: 7 }, ad: { year: 2023, month: 10, day: 21 }, type: 'public' },
  { name: 'Maha Ashtami', bs: { year: 2080, month: 7, day: 8 }, ad: { year: 2023, month: 10, day: 22 }, type: 'public' },
  { name: 'Maha Navami', bs: { year: 2080, month: 7, day: 9 }, ad: { year: 2023, month: 10, day: 23 }, type: 'public' },
  { name: 'Vijaya Dashami', bs: { year: 2080, month: 7, day: 10 }, ad: { year: 2023, month: 10, day: 24 }, type: 'public' },
  { name: 'Laxmi Puja (Tihar)', bs: { year: 2080, month: 8, day: 2 }, ad: { year: 2023, month: 11, day: 12 }, type: 'public' },
  { name: 'Gai Tihar / Goru Tihar', bs: { year: 2080, month: 8, day: 3 }, ad: { year: 2023, month: 11, day: 13 }, type: 'public' },
  { name: 'Mha Puja / Tihar ends', bs: { year: 2080, month: 8, day: 4 }, ad: { year: 2023, month: 11, day: 14 }, type: 'public' },
  { name: 'Chhath Puja', bs: { year: 2080, month: 8, day: 6 }, ad: { year: 2023, month: 11, day: 16 }, type: 'public' },
  { name: 'Buddha Jayanti', bs: { year: 2080, month: 2, day: 4 }, ad: { year: 2023, month: 5, day: 23 }, type: 'public' },
  { name: 'Janai Purnima / Raksha Bandhan', bs: { year: 2080, month: 4, day: 5 }, ad: { year: 2023, month: 8, day: 1 }, type: 'public' },
  { name: 'Gai Jatra', bs: { year: 2080, month: 5, day: 1 }, ad: { year: 2023, month: 8, day: 18 }, type: 'public' },
  { name: 'Teej', bs: { year: 2080, month: 5, day: 3 }, ad: { year: 2023, month: 8, day: 20 }, type: 'public' },
  { name: 'Rishi Panchami', bs: { year: 2080, month: 5, day: 4 }, ad: { year: 2023, month: 8, day: 21 }, type: 'public' },
  { name: 'Indra Jatra', bs: { year: 2080, month: 6, day: 4 }, ad: { year: 2023, month: 9, day: 19 }, type: 'public' },
  { name: 'Constitution Day', bs: { year: 2080, month: 6, day: 3 }, ad: { year: 2023, month: 9, day: 19 }, type: 'public' },
  { name: 'Dashain (Full)', bs: { year: 2080, month: 7, day: 10 }, ad: { year: 2023, month: 10, day: 24 }, type: 'public' },
  { name: 'Maghe Sankranti', bs: { year: 2080, month: 10, day: 1 }, ad: { year: 2024, month: 1, day: 15 }, type: 'public' },
  { name: 'Ghatasthapana', bs: { year: 2080, month: 7, day: 1 }, ad: { year: 2023, month: 10, day: 15 }, type: 'public' },

  // ── 2081 BS (Apr 2024 – Apr 2025) ──
  { name: 'New Year (Bisket)', bs: { year: 2081, month: 1, day: 1 }, ad: { year: 2024, month: 4, day: 13 }, type: 'public' },
  { name: 'Buddha Jayanti', bs: { year: 2081, month: 2, day: 4 }, ad: { year: 2024, month: 5, day: 23 }, type: 'public' },
  { name: 'Janai Purnima', bs: { year: 2081, month: 4, day: 5 }, ad: { year: 2024, month: 8, day: 19 }, type: 'public' },
  { name: 'Gai Jatra', bs: { year: 2081, month: 5, day: 1 }, ad: { year: 2024, month: 9, day: 4 }, type: 'public' },
  { name: 'Teej', bs: { year: 2081, month: 5, day: 3 }, ad: { year: 2024, month: 9, day: 6 }, type: 'public' },
  { name: 'Rishi Panchami', bs: { year: 2081, month: 5, day: 4 }, ad: { year: 2024, month: 9, day: 7 }, type: 'public' },
  { name: 'Constitution Day', bs: { year: 2081, month: 6, day: 3 }, ad: { year: 2024, month: 9, day: 20 }, type: 'public' },
  { name: 'Indra Jatra', bs: { year: 2081, month: 6, day: 4 }, ad: { year: 2024, month: 9, day: 21 }, type: 'public' },
  { name: 'Ghatasthapana', bs: { year: 2081, month: 7, day: 1 }, ad: { year: 2024, month: 10, day: 2 }, type: 'public' },
  { name: 'Fulpati', bs: { year: 2081, month: 7, day: 7 }, ad: { year: 2024, month: 10, day: 8 }, type: 'public' },
  { name: 'Maha Ashtami', bs: { year: 2081, month: 7, day: 8 }, ad: { year: 2024, month: 10, day: 9 }, type: 'public' },
  { name: 'Maha Navami', bs: { year: 2081, month: 7, day: 9 }, ad: { year: 2024, month: 10, day: 10 }, type: 'public' },
  { name: 'Vijaya Dashami', bs: { year: 2081, month: 7, day: 10 }, ad: { year: 2024, month: 10, day: 11 }, type: 'public' },
  { name: 'Laxmi Puja', bs: { year: 2081, month: 8, day: 2 }, ad: { year: 2024, month: 10, day: 31 }, type: 'public' },
  { name: 'Gai Tihar / Goru Tihar', bs: { year: 2081, month: 8, day: 3 }, ad: { year: 2024, month: 11, day: 1 }, type: 'public' },
  { name: 'Mha Puja', bs: { year: 2081, month: 8, day: 4 }, ad: { year: 2024, month: 11, day: 2 }, type: 'public' },
  { name: 'Chhath Puja', bs: { year: 2081, month: 8, day: 6 }, ad: { year: 2024, month: 11, day: 4 }, type: 'public' },
  { name: 'Maghe Sankranti', bs: { year: 2081, month: 10, day: 1 }, ad: { year: 2025, month: 1, day: 14 }, type: 'public' },
  { name: 'Martyrs\' Day', bs: { year: 2081, month: 10, day: 16 }, ad: { year: 2025, month: 1, day: 29 }, type: 'public' },
  { name: 'Shivaratri', bs: { year: 2081, month: 11, day: 26 }, ad: { year: 2025, month: 2, day: 26 }, type: 'public' },
  { name: 'Democracy Day', bs: { year: 2081, month: 11, day: 7 }, ad: { year: 2025, month: 2, day: 18 }, type: 'public' },

  // ── 2082 BS (Apr 2025 – Apr 2026) ──
  { name: 'New Year (Bisket)', bs: { year: 2082, month: 1, day: 1 }, ad: { year: 2025, month: 4, day: 14 }, type: 'public' },
  { name: 'Buddha Jayanti', bs: { year: 2082, month: 2, day: 4 }, ad: { year: 2025, month: 5, day: 12 }, type: 'public' },
  { name: 'Janai Purnima', bs: { year: 2082, month: 4, day: 5 }, ad: { year: 2025, month: 8, day: 8 }, type: 'public' },
  { name: 'Gai Jatra', bs: { year: 2082, month: 5, day: 1 }, ad: { year: 2025, month: 8, day: 23 }, type: 'public' },
  { name: 'Teej', bs: { year: 2082, month: 5, day: 3 }, ad: { year: 2025, month: 8, day: 25 }, type: 'public' },
  { name: 'Rishi Panchami', bs: { year: 2082, month: 5, day: 4 }, ad: { year: 2025, month: 8, day: 26 }, type: 'public' },
  { name: 'Constitution Day', bs: { year: 2082, month: 6, day: 3 }, ad: { year: 2025, month: 9, day: 19 }, type: 'public' },
  { name: 'Indra Jatra', bs: { year: 2082, month: 6, day: 4 }, ad: { year: 2025, month: 9, day: 20 }, type: 'public' },
  { name: 'Ghatasthapana', bs: { year: 2082, month: 7, day: 1 }, ad: { year: 2025, month: 10, day: 2 }, type: 'public' },
  { name: 'Fulpati', bs: { year: 2082, month: 7, day: 7 }, ad: { year: 2025, month: 10, day: 8 }, type: 'public' },
  { name: 'Maha Ashtami', bs: { year: 2082, month: 7, day: 8 }, ad: { year: 2025, month: 10, day: 9 }, type: 'public' },
  { name: 'Maha Navami', bs: { year: 2082, month: 7, day: 9 }, ad: { year: 2025, month: 10, day: 10 }, type: 'public' },
  { name: 'Vijaya Dashami', bs: { year: 2082, month: 7, day: 10 }, ad: { year: 2025, month: 10, day: 11 }, type: 'public' },
  { name: 'Laxmi Puja', bs: { year: 2082, month: 8, day: 2 }, ad: { year: 2025, month: 10, day: 29 }, type: 'public' },
  { name: 'Gai Tihar / Goru Tihar', bs: { year: 2082, month: 8, day: 3 }, ad: { year: 2025, month: 10, day: 30 }, type: 'public' },
  { name: 'Mha Puja', bs: { year: 2082, month: 8, day: 4 }, ad: { year: 2025, month: 10, day: 31 }, type: 'public' },
  { name: 'Chhath Puja', bs: { year: 2082, month: 8, day: 6 }, ad: { year: 2025, month: 11, day: 2 }, type: 'public' },
  { name: 'Maghe Sankranti', bs: { year: 2082, month: 10, day: 1 }, ad: { year: 2026, month: 1, day: 15 }, type: 'public' },
  { name: 'Martyrs\' Day', bs: { year: 2082, month: 10, day: 16 }, ad: { year: 2026, month: 1, day: 30 }, type: 'public' },
  { name: 'Shivaratri', bs: { year: 2082, month: 11, day: 26 }, ad: { year: 2026, month: 2, day: 15 }, type: 'public' },
  { name: 'Democracy Day', bs: { year: 2082, month: 11, day: 7 }, ad: { year: 2026, month: 2, day: 19 }, type: 'public' },

  // ── 2083 BS (Apr 2026 – Apr 2027) ──
  { name: 'New Year (Bisket)', bs: { year: 2083, month: 1, day: 1 }, ad: { year: 2026, month: 4, day: 14 }, type: 'public' },
  { name: 'Buddha Jayanti', bs: { year: 2083, month: 2, day: 4 }, ad: { year: 2026, month: 5, day: 21 }, type: 'public' },
  { name: 'Janai Purnima', bs: { year: 2083, month: 4, day: 5 }, ad: { year: 2026, month: 8, day: 7 }, type: 'public' },
  { name: 'Gai Jatra', bs: { year: 2083, month: 5, day: 1 }, ad: { year: 2026, month: 8, day: 22 }, type: 'public' },
  { name: 'Teej', bs: { year: 2083, month: 5, day: 3 }, ad: { year: 2026, month: 8, day: 24 }, type: 'public' },
  { name: 'Rishi Panchami', bs: { year: 2083, month: 5, day: 4 }, ad: { year: 2026, month: 8, day: 25 }, type: 'public' },
  { name: 'Constitution Day', bs: { year: 2083, month: 6, day: 3 }, ad: { year: 2026, month: 9, day: 19 }, type: 'public' },
  { name: 'Indra Jatra', bs: { year: 2083, month: 6, day: 4 }, ad: { year: 2026, month: 9, day: 20 }, type: 'public' },
  { name: 'Ghatasthapana', bs: { year: 2083, month: 7, day: 1 }, ad: { year: 2026, month: 10, day: 2 }, type: 'public' },
  { name: 'Fulpati', bs: { year: 2083, month: 7, day: 7 }, ad: { year: 2026, month: 10, day: 8 }, type: 'public' },
  { name: 'Maha Ashtami', bs: { year: 2083, month: 7, day: 8 }, ad: { year: 2026, month: 10, day: 9 }, type: 'public' },
  { name: 'Maha Navami', bs: { year: 2083, month: 7, day: 9 }, ad: { year: 2026, month: 10, day: 10 }, type: 'public' },
  { name: 'Vijaya Dashami', bs: { year: 2083, month: 7, day: 10 }, ad: { year: 2026, month: 10, day: 11 }, type: 'public' },
  { name: 'Laxmi Puja', bs: { year: 2083, month: 8, day: 2 }, ad: { year: 2026, month: 10, day: 28 }, type: 'public' },
  { name: 'Gai Tihar / Goru Tihar', bs: { year: 2083, month: 8, day: 3 }, ad: { year: 2026, month: 10, day: 29 }, type: 'public' },
  { name: 'Mha Puja', bs: { year: 2083, month: 8, day: 4 }, ad: { year: 2026, month: 10, day: 30 }, type: 'public' },
  { name: 'Chhath Puja', bs: { year: 2083, month: 8, day: 6 }, ad: { year: 2026, month: 11, day: 1 }, type: 'public' },
  { name: 'Maghe Sankranti', bs: { year: 2083, month: 10, day: 1 }, ad: { year: 2027, month: 1, day: 15 }, type: 'public' },
  { name: 'Martyrs\' Day', bs: { year: 2083, month: 10, day: 16 }, ad: { year: 2027, month: 1, day: 30 }, type: 'public' },
  { name: 'Shivaratri', bs: { year: 2083, month: 11, day: 26 }, ad: { year: 2027, month: 2, day: 7 }, type: 'public' },
  { name: 'Democracy Day', bs: { year: 2083, month: 11, day: 7 }, ad: { year: 2027, month: 2, day: 18 }, type: 'public' },

  // ── 2084 BS (Apr 2027 – Apr 2028) ──
  { name: 'New Year (Bisket)', bs: { year: 2084, month: 1, day: 1 }, ad: { year: 2027, month: 4, day: 14 }, type: 'public' },
  { name: 'Buddha Jayanti', bs: { year: 2084, month: 2, day: 4 }, ad: { year: 2027, month: 5, day: 20 }, type: 'public' },
  { name: 'Janai Purnima', bs: { year: 2084, month: 4, day: 5 }, ad: { year: 2027, month: 8, day: 7 }, type: 'public' },
  { name: 'Gai Jatra', bs: { year: 2084, month: 5, day: 1 }, ad: { year: 2027, month: 8, day: 22 }, type: 'public' },
  { name: 'Teej', bs: { year: 2084, month: 5, day: 3 }, ad: { year: 2027, month: 8, day: 24 }, type: 'public' },
  { name: 'Rishi Panchami', bs: { year: 2084, month: 5, day: 4 }, ad: { year: 2027, month: 8, day: 25 }, type: 'public' },
  { name: 'Constitution Day', bs: { year: 2084, month: 6, day: 3 }, ad: { year: 2027, month: 9, day: 19 }, type: 'public' },
  { name: 'Indra Jatra', bs: { year: 2084, month: 6, day: 4 }, ad: { year: 2027, month: 9, day: 20 }, type: 'public' },
  { name: 'Ghatasthapana', bs: { year: 2084, month: 7, day: 1 }, ad: { year: 2027, month: 10, day: 2 }, type: 'public' },
  { name: 'Fulpati', bs: { year: 2084, month: 7, day: 7 }, ad: { year: 2027, month: 10, day: 8 }, type: 'public' },
  { name: 'Maha Ashtami', bs: { year: 2084, month: 7, day: 8 }, ad: { year: 2027, month: 10, day: 9 }, type: 'public' },
  { name: 'Maha Navami', bs: { year: 2084, month: 7, day: 9 }, ad: { year: 2027, month: 10, day: 10 }, type: 'public' },
  { name: 'Vijaya Dashami', bs: { year: 2084, month: 7, day: 10 }, ad: { year: 2027, month: 10, day: 11 }, type: 'public' },
  { name: 'Laxmi Puja', bs: { year: 2084, month: 8, day: 2 }, ad: { year: 2027, month: 10, day: 28 }, type: 'public' },
  { name: 'Gai Tihar / Goru Tihar', bs: { year: 2084, month: 8, day: 3 }, ad: { year: 2027, month: 10, day: 29 }, type: 'public' },
  { name: 'Mha Puja', bs: { year: 2084, month: 8, day: 4 }, ad: { year: 2027, month: 10, day: 30 }, type: 'public' },
  { name: 'Chhath Puja', bs: { year: 2084, month: 8, day: 6 }, ad: { year: 2027, month: 11, day: 1 }, type: 'public' },
  { name: 'Maghe Sankranti', bs: { year: 2084, month: 10, day: 1 }, ad: { year: 2028, month: 1, day: 15 }, type: 'public' },
  { name: 'Martyrs\' Day', bs: { year: 2084, month: 10, day: 16 }, ad: { year: 2028, month: 1, day: 30 }, type: 'public' },
  { name: 'Shivaratri', bs: { year: 2084, month: 11, day: 26 }, ad: { year: 2028, month: 2, day: 18 }, type: 'public' },
  { name: 'Democracy Day', bs: { year: 2084, month: 11, day: 7 }, ad: { year: 2028, month: 3, day: 1 }, type: 'public' },
];

/**
 * Get holidays for a given BS year range.
 * @param {number} bsYearStart - Start BS year (inclusive)
 * @param {number} bsYearEnd   - End BS year (inclusive)
 * @returns {Array} Holidays within the range
 */
export function getHolidaysInRange(bsYearStart, bsYearEnd) {
  return NEPAL_HOLIDAYS.filter(h => h.bs.year >= bsYearStart && h.bs.year <= bsYearEnd);
}

/**
 * Get all unique holiday AD dates as a Set of "YYYY-MM-DD" strings.
 * Used for efficient lookup during calculation.
 */
export function getHolidayAdDatesSet() {
  const set = new Set();
  for (const h of NEPAL_HOLIDAYS) {
    set.add(`${h.ad.year}-${String(h.ad.month).padStart(2, '0')}-${String(h.ad.day).padStart(2, '0')}`);
  }
  return set;
}
