/**
 * Shared data-fetching utilities for SolutionsNepal live data providers.
 *
 * Architecture:
 *   Provider → fetch() → { data, meta, error }
 *   Service  → tries provider, falls back to cache/mock, never silently shows stale data.
 *
 * All external API calls go through these utilities.
 * Server-side only — never expose API keys in client code.
 */

const DEFAULT_TIMEOUT_MS = 10_000;
const CACHE_DIR = '.solutionsnepal-cache';

/**
 * Fetch JSON from a URL with timeout and error handling.
 * Returns { ok: true, json } or { ok: false, error }.
 */
export async function fetchJSON(url, { timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = {}) {
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    });
    if (!resp.ok) {
      return { ok: false, error: `HTTP ${resp.status}` };
    }
    const json = await resp.json();
    return { ok: true, json };
  } catch (err) {
    return { ok: false, error: err?.message || 'Fetch failed' };
  }
}

/**
 * Format a Date as YYYY-MM-DD in Nepal Time (UTC+5:45).
 */
export function toNepalDate(date = new Date()) {
  const nepalOffset = 5 * 60 + 45; // minutes
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
  const nepal = new Date(utc + nepalOffset * 60_000);
  return nepal.toISOString().split('T')[0];
}

/**
 * Format a Date as "August 25, 2026 · 11:00 AM" in Nepal Time.
 */
export function toNepalDateTime(date = new Date()) {
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Build a standard service result.
 * @param {object|null} data - The fetched data, or null if unavailable.
 * @param {object} meta - Metadata about the source and update time.
 * @param {string|null} error - Error message if data couldn't be fetched.
 * @param {boolean} isLive - Whether this data came from a real API call (vs mock/cache).
 */
export function buildResult(data, meta, error = null, isLive = false) {
  return {
    data,
    meta: {
      ...meta,
      fetchedAt: new Date().toISOString(),
      isLive,
    },
    error,
  };
}

/**
 * Generate a date string for API queries, trying recent dates.
 * @param {Function} apiCall - Async function that takes a date string and returns data.
 * @param {number} maxDaysBack - How many days to look back.
 * @returns {Promise<{data: any, date: string}|null>}
 */
export async function tryRecentDates(apiCall, maxDaysBack = 7) {
  const today = new Date();
  for (let i = 0; i < maxDaysBack; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = toNepalDate(d);
    try {
      const result = await apiCall(dateStr);
      if (result) return { data: result, date: dateStr };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Simple in-memory cache with TTL.
 * Useful for server-side during a single build or dev server session.
 * Does NOT persist across restarts — use for dedup, not long-term storage.
 */
const memCache = new Map();

export function getCached(key) {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCache(key, value, ttlMs = 3_600_000) {
  memCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Round a number to the given decimal places.
 */
export function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}
