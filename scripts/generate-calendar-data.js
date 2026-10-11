#!/usr/bin/env node
/**
 * Generate static JSON calendar data files from existing tithi-data.js
 * and calendar-events.js. Output goes to public/data/bs-calendar/.
 *
 * Usage: node scripts/generate-calendar-data.js
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Dynamic imports for ES modules (use file:// URLs for Windows)
const { TITHI_DATA, MAJOR_TITHIS } = await import(pathToFileURL(join(ROOT, 'src/data/nepal/tithi-data.js')).href);
const { getEventsForBsMonth } = await import(pathToFileURL(join(ROOT, 'src/data/nepal/calendar-events.js')).href);
const { getDaysInBsMonth } = await import(pathToFileURL(join(ROOT, 'src/lib/nepal/calendar.js')).href);

const YEARS = [2082, 2083, 2084];
const OUT_DIR = join(ROOT, 'public/data/bs-calendar');
mkdirSync(OUT_DIR, { recursive: true });

for (const year of YEARS) {
  const yearData = {};

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = getDaysInBsMonth(year, month);
    if (!daysInMonth) continue;

    // Get tithi data for this month
    const tithiKey = `${year}-${month}`;
    const tithiMap = TITHI_DATA[tithiKey] || {};

    // Get events for this month
    const monthEvents = getEventsForBsMonth(year, month);

    // Build day-by-day data
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const entry = { d: day };

      // Tithi
      const tithi = tithiMap[day];
      if (tithi) {
        entry.t = tithi;
        entry.tm = MAJOR_TITHIS.has(tithi); // tithi major flag
      }

      // Events/festivals for this day
      const dayEvents = monthEvents.filter(e => e.bs.day === day);
      if (dayEvents.length > 0) {
        entry.f = dayEvents.map(e => ({
          n: e.event.name,
          np: e.event.np,
          o: e.event.official,
        }));
      }

      // Holiday flag - true if any official event exists
      entry.h = dayEvents.some(e => e.event.official);

      days.push(entry);
    }

    yearData[month] = days;
  }

  // Write the JSON file
  const outPath = join(OUT_DIR, `${year}.json`);
  writeFileSync(outPath, JSON.stringify(yearData));
  console.log(`✓ Generated ${outPath} (${Object.keys(yearData).length} months)`);
}

console.log('\nDone! Calendar data files generated in public/data/bs-calendar/');
