/**
 * SolutionsNepal — Live snapshot hydration.
 *
 * `scripts/fetch-live-data.mjs` (run via predev/prebuild) writes a snapshot of
 * REAL data from NRB, FENEGOSIDA, NOC and Open-Meteo. Services import from
 * here instead of mock-data.js, so every page shows the same real values.
 *
 * isLive reflects whether the *original fetch* succeeded. `freshness` tells
 * the UI how to label it: 'live' | 'stale' (fetched >12h ago) | 'mock'.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SNAPSHOT_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'data', 'live-snapshot.json');
// Bundled SSR builds (astro build prerender) run this module from dist/,
// so import.meta.url no longer points under src/. In that case the snapshot
// written by prebuild lives at <project-root>/src/data/live-snapshot.json.
const SNAPSHOT_FALLBACK = join(process.cwd(), 'src', 'data', 'live-snapshot.json');

function loadSnapshot() {
  for (const p of [SNAPSHOT_PATH, SNAPSHOT_FALLBACK]) {
    try {
      return JSON.parse(readFileSync(p, 'utf8'));
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

const snapshot = loadSnapshot();

/** How fresh is this section of the snapshot? */
export function freshness(section) {
  if (!snapshot || !snapshot[section] || snapshot[section].error) return 'mock';
  const fetchedAt = snapshot?.meta?.fetchedAt ? new Date(snapshot.meta.fetchedAt).getTime() : 0;
  const ageH = fetchedAt ? (Date.now() - fetchedAt) / 3600000 : Infinity;
  if (!snapshot[section].isLive) return 'stale';
  return ageH > 12 ? 'stale' : 'live';
}

/** True if the snapshot has any usable forex data. */
export function hasForex() {
  return Array.isArray(snapshot?.forex?.currencies) && snapshot.forex.currencies.length > 0;
}

/** NRB currencies from the snapshot (raw shape: {iso3, name, unit, buy, sell}). */
export function snapshotForex() {
  if (!hasForex()) return null;
  return {
    currencies: snapshot.forex.currencies,
    date: snapshot.forex.date,
    publishedOn: snapshot.forex.publishedOn,
    fetchedAt: snapshot.meta?.fetchedAt,
    fetchedAtNPT: snapshot.meta?.fetchedAtNPT,
    isLive: snapshot.forex.isLive !== false,
  };
}

/**
 * FENEGOSIDA gold/silver from the snapshot.
 * Returns { gold: {pricePerTola, yesterdayPricePerTola}, silver: {...}, fetchedAtNPT, isLive } or null.
 * isLive is false for carried-forward sections so callers never present
 * stale values as live.
 */
export function snapshotMetals() {
  const g = snapshot?.gold;
  if (!g || (!g.gold && !g.silver)) return null;
  return {
    gold: g.gold || null,
    silver: g.silver || null,
    fetchedAt: snapshot.meta?.fetchedAt,
    fetchedAtNPT: snapshot.meta?.fetchedAtNPT,
    isLive: g.isLive !== false,
  };
}

/**
 * NOC fuel from the snapshot.
 * Returns { byCity: {kathmandu: {petrol, diesel, kerosene}, ...}, lpg, cities, history } or null.
 */
export function snapshotFuel() {
  const f = snapshot?.fuel;
  if (!f || !f.byCity?.kathmandu) return null;
  return {
    byCity: f.byCity,
    cities: f.cities || [],
    lpg: f.lpg,
    history: Array.isArray(f.history) ? f.history : [],
    fetchedAt: snapshot.meta?.fetchedAt,
    fetchedAtNPT: snapshot.meta?.fetchedAtNPT,
    isLive: f.isLive !== false,
  };
}

/** Weather bundle from the snapshot: {cities: {id: {current, hourly, daily}}, aqi} */
export function snapshotWeather() {
  const w = snapshot?.weather;
  if (!w || !w.cities || !Object.keys(w.cities).length) return null;
  return {
    cities: w.cities,
    aqi: w.aqi || null,
    fetchedAt: snapshot.meta?.fetchedAt,
    fetchedAtNPT: snapshot.meta?.fetchedAtNPT,
  };
}

/** Snapshot metadata for footer/source display. */
export function snapshotMeta() {
  if (!snapshot) return null;
  return {
    fetchedAt: snapshot.meta?.fetchedAt,
    fetchedAtNPT: snapshot.meta?.fetchedAtNPT,
    sources: snapshot.meta?.sources || {},
  };
}

/** Global "Updated <time> NPT" label for the homepage board. */
export function boardUpdatedLabel() {
  const t = snapshot?.meta?.fetchedAtNPT;
  return t ? `Updated ${t} NPT` : 'Updated recently';
}
