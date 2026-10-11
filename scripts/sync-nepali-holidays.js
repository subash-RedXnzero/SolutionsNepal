#!/usr/bin/env node

/**
 * Sync Nepali holiday data from the S4NKALP Nepali Calendar API.
 *
 * Usage:
 *   node scripts/sync-nepali-holidays.js [year]     # fetch specific BS year
 *   node scripts/sync-nepali-holidays.js             # fetch current + next BS year
 *
 * The script:
 *   1. Fetches monthly data from https://api-nepalicalendar.leapcell.app
 *   2. Aggregates into a yearly JSON file
 *   3. Saves to public/data/nepali-holidays/{year}.json
 *   4. Includes metadata about sync time for staleness detection
 *
 * Data is cached locally and only needs to run once on deploy or daily via cron.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', 'public', 'data', 'nepali-holidays');

const API_BASE = 'https://api-nepalicalendar.leapcell.app';

// BS month names (1-indexed for API)
const BS_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

/**
 * Convert Devanagari digits to Arabic numerals.
 */
function devanagariToArabic(str) {
  if (!str) return str;
  const map = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
  return String(str).replace(/[०-९]/g, d => map[d] || d);
}

/**
 * Parse Devanagari day number to integer.
 */
function parseDay(dayStr) {
  return parseInt(devanagariToArabic(dayStr), 10);
}

/**
 * Fetch one month of data from the API.
 */
async function fetchMonth(bsYear, bsMonth) {
  const url = `${API_BASE}/api/calendar/${bsYear}/${bsMonth}`;
  console.log(`  Fetching ${url} ...`);

  const resp = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${url}`);
  }

  return resp.json();
}

/**
 * Fetch all 12 months for a BS year and aggregate into a single object.
 */
async function fetchYear(bsYear) {
  console.log(`\nSyncing BS ${bsYear}...`);

  const months = [];
  for (let m = 1; m <= 12; m++) {
    try {
      const data = await fetchMonth(bsYear, m);
      months.push(data);
    } catch (err) {
      console.error(`  ⚠ Failed to fetch month ${m}: ${err.message}`);
      months.push(null);
    }
  }

  return aggregateYear(bsYear, months);
}

/**
 * Aggregate monthly API responses into a single yearly data structure.
 *
 * Output format:
 * {
 *   "year": 2083,
 *   "syncedAt": "2026-08-31T...",
 *   "source": "S4NKALP/nepali-calendar-api",
 *   "months": [
 *     {
 *       "month": 1,
 *       "nameEn": "Baisakh",
 *       "nameNp": "बैशाख",
 *       "days": [
 *         {
 *           "day": 1,          // BS day (integer)
 *           "weekday": 2,      // 0=Sun, 1=Mon, ..., 6=Sat
 *           "ad": "2026-04-14", // Gregorian date string
 *           "tithi": "प्रतिपदा",  // Tithi name
 *           "festival": "navavarsha 2083", // Festival name (if any)
 *           "isHoliday": true,  // Official public holiday
 *           "holiFest": [],     // Holi/festival list
 *           "marriage": [],     // Auspicious marriage dates
 *           "bratabandha": []   // Auspicious bratabandha dates
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
function aggregateYear(bsYear, months) {
  const result = {
    year: bsYear,
    syncedAt: new Date().toISOString(),
    source: 'S4NKALP/nepali-calendar-api',
    months: [],
  };

  for (let i = 0; i < 12; i++) {
    const m = i + 1;
    const data = months[i];

    if (!data || !data.days) {
      // Add empty month placeholder
      result.months.push({
        month: m,
        nameEn: BS_MONTHS[i],
        nameNp: '',
        days: [],
        holiFest: [],
        marriage: [],
        bratabandha: [],
      });
      continue;
    }

    const monthData = {
      month: m,
      nameEn: BS_MONTHS[i],
      nameNp: data.metadata?.np || '',
      days: (data.days || []).map(d => ({
        day: parseDay(d.n),
        weekday: d.d,       // 0=Sun, 1=Mon, etc.
        ad: d.e || '',       // AD date string like "14"
        tithi: d.t || '',    // Tithi name
        festival: d.f || '', // Festival/event name
        isHoliday: d.h === true,
        holiFest: [],
        marriage: [],
        bratabandha: [],
      })),
      holiFest: data.holiFest || [],
      marriage: data.marriage || [],
      bratabandha: data.bratabandha || [],
    };

    result.months.push(monthData);
  }

  return result;
}

/**
 * Check if we already have fresh data for this year.
 */
function hasFreshData(bsYear, maxAgeHours = 24) {
  const path = join(CACHE_DIR, `${bsYear}.json`);
  if (!existsSync(path)) return false;

  try {
    const existing = JSON.parse(readFileSync(path, 'utf-8'));
    if (!existing.syncedAt) return false;
    const age = Date.now() - new Date(existing.syncedAt).getTime();
    return age < maxAgeHours * 3600 * 1000;
  } catch {
    return false;
  }
}

/**
 * Save the aggregated data to a JSON file.
 */
function saveYear(bsYear, data) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const path = join(CACHE_DIR, `${bsYear}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Saved ${path}`);
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2);

  // Determine which years to fetch
  let years = [];
  if (args.length > 0) {
    years = args.map(Number).filter(y => y >= 1992 && y <= 2090);
  } else {
    // Default: fetch current and next BS year
    // Approximate: BS year = AD year + 57 (adjust for mid-April boundary)
    const now = new Date();
    const adYear = now.getFullYear();
    const bsApprox = adYear + 56; // Conservative estimate
    years = [bsApprox, bsApprox + 1];
  }

  console.log('═'.repeat(50));
  console.log('Nepali Holiday Data Sync');
  console.log(`API: ${API_BASE}`);
  console.log(`Cache: ${CACHE_DIR}`);
  console.log(`Years: ${years.join(', ')}`);
  console.log('═'.repeat(50));

  let successCount = 0;
  let failCount = 0;

  for (const year of years) {
    if (hasFreshData(year)) {
      console.log(`\n⏭ BS ${year}: fresh data exists, skipping (use --force to override)`);
      continue;
    }

    try {
      const data = await fetchYear(year);
      saveYear(year, data);
      successCount++;
    } catch (err) {
      console.error(`\n❌ Failed to sync BS ${year}: ${err.message}`);
      failCount++;
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`Done. ${successCount} synced, ${failCount} failed.`);
  console.log('═'.repeat(50));

  if (failCount > 0 && successCount === 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
