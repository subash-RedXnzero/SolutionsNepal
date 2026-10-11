/**
 * Business Registration Cost Engine (Nepal)
 * =========================================
 * Pure functions for the Business Registration Cost Estimator.
 * No DOM, no Astro — fully unit-testable via `npm test`.
 *
 * OCR fee lookup is bracket-based: the first bracket whose inclusive `max`
 * is >= the authorized capital wins. Amounts above the top bracket use the
 * official per-unit rule declared in `src/data/business-registration.js`.
 *
 * @module business-registration
 */

import {
  LIMITS,
  PRIVATE_LIMITED_BRACKETS,
  PRIVATE_TOP_FEE,
  PRIVATE_TOP_MAX,
  PRIVATE_OVER_TOP,
  PUBLIC_LIMITED_BRACKETS,
  PUBLIC_TOP_FEE,
  PUBLIC_TOP_MAX,
  PUBLIC_OVER_TOP,
} from '../../data/business-registration.js';

// ── Formatting (Nepal/Indian grouping) ─────────────────────────────

/** Format NPR with Indian grouping: 500000 → "Rs. 5,00,000". */
export function formatNPR(amount) {
  if (!Number.isFinite(amount)) return 'Rs. 0';
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const hasFraction = Math.round(abs * 100) % 100 !== 0;
  const grouped = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs);
  return (negative ? '-Rs. ' : 'Rs. ') + grouped;
}

/** Plain number with Indian grouping: 10000000 → "1,00,00,000". */
export function formatNumberIN(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(
    Math.trunc(n),
  );
}

/**
 * Parse user-typed capital: strips "Rs.", commas, spaces. Returns NaN for
 * non-numeric input (never silently coerces to 0).
 */
export function parseCapitalInput(raw) {
  if (raw === null || raw === undefined) return NaN;
  const s = String(raw).trim();
  if (s === '') return NaN;
  const cleaned = s.replace(/rs\.?|npr|,/gi, '').trim().replace(/\s+/g, '');
  if (cleaned === '' || !/^-?\d+(\.\d+)?$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

// ── Validation ──────────────────────────────────────────────────────

/** Validate authorized capital. Returns { ok, value?, error? }. */
export function validateCapital(raw) {
  const num = typeof raw === 'number' ? raw : parseCapitalInput(raw);
  if (!Number.isFinite(num)) {
    return { ok: false, error: 'Enter the authorized capital, e.g. 5,00,000.' };
  }
  if (!Number.isInteger(Math.round(num)) || num <= 0) {
    return { ok: false, error: 'Capital must be more than Rs. 0.' };
  }
  if (num < LIMITS.minCapital) {
    return { ok: false, error: 'Capital must be more than Rs. 0.' };
  }
  if (num > LIMITS.maxCapital) {
    return {
      ok: false,
      error: `That amount is too large to estimate (over ${formatNPR(LIMITS.maxCapital)}).`,
    };
  }
  if (num !== Math.floor(num)) {
    return { ok: false, error: 'Capital must be a whole rupee amount.' };
  }
  return { ok: true, value: Math.floor(num) };
}

/** Validate shareholder count for a private company (1–101). */
export function validateShareholders(raw) {
  const num = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { ok: false, error: 'Enter the number of shareholders.' };
  }
  if (num < LIMITS.minShareholdersPrivate || num > LIMITS.maxShareholdersPrivate) {
    return {
      ok: false,
      error: `A private company needs ${LIMITS.minShareholdersPrivate}–${LIMITS.maxShareholdersPrivate} shareholders.`,
    };
  }
  return { ok: true, value: num };
}

/** Validate founder/promoter count for a public company (minimum 7). */
export function validateFounders(raw) {
  const num = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { ok: false, error: 'Enter the number of founders.' };
  }
  if (num < LIMITS.minFoundersPublic) {
    return {
      ok: false,
      error: `A public company needs at least ${LIMITS.minFoundersPublic} founders.`,
    };
  }
  if (num > 100000) {
    return { ok: false, error: 'That founder count looks too large.' };
  }
  return { ok: true, value: num };
}

/** Validate partner count (minimum 2). */
export function validatePartners(raw) {
  const num = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { ok: false, error: 'Enter the number of partners.' };
  }
  if (num < 2) {
    return { ok: false, error: 'A partnership needs at least 2 partners.' };
  }
  if (num > 1000) {
    return { ok: false, error: 'That partner count looks too large.' };
  }
  return { ok: true, value: num };
}

// ── Core fee lookup ─────────────────────────────────────────────────

function lookupBracket(brackets, capital) {
  for (let i = 0; i < brackets.length; i++) {
    if (capital <= brackets[i].max) {
      return { fee: brackets[i].fee, bracketIndex: i, overTop: false };
    }
  }
  return null;
}

/**
 * Private Limited OCR fee for an authorized capital.
 * Returns { fee, bracketLabel, overTop, extraUnits? }.
 * Throws on invalid / out-of-range input — never guesses.
 */
export function privateLimitedFee(capital) {
  const v = validateCapital(capital);
  if (!v.ok) throw new Error(v.error);
  const c = v.value;

  const hit = lookupBracket(PRIVATE_LIMITED_BRACKETS, c);
  if (hit) {
    return {
      fee: hit.fee,
      bracketIndex: hit.bracketIndex,
      overTop: false,
      bracketLabel: describePrivateBracket(hit.bracketIndex),
    };
  }

  // Official over-top rule: 43,000 + Rs. 30 per extra Rs. 1 lakh (round up).
  const extra = c - PRIVATE_TOP_MAX;
  const units = Math.ceil(extra / PRIVATE_OVER_TOP.unitAmount);
  const fee = PRIVATE_TOP_FEE + units * PRIVATE_OVER_TOP.unitFee;
  return {
    fee,
    bracketIndex: PRIVATE_LIMITED_BRACKETS.length,
    overTop: true,
    extraUnits: units,
    bracketLabel: `Above ${formatNPR(PRIVATE_TOP_MAX)}`,
  };
}

/**
 * Public Limited OCR fee for an authorized capital.
 * Returns { fee, bracketLabel, overTop, extraUnits? }. Throws on invalid input.
 */
export function publicLimitedFee(capital) {
  const v = validateCapital(capital);
  if (!v.ok) throw new Error(v.error);
  const c = v.value;

  const hit = lookupBracket(PUBLIC_LIMITED_BRACKETS, c);
  if (hit) {
    return {
      fee: hit.fee,
      bracketIndex: hit.bracketIndex,
      overTop: false,
      bracketLabel: describePublicBracket(hit.bracketIndex),
    };
  }

  // Official over-top rule: 1,60,000 + Rs. 3,000 per extra Rs. 1 crore (round up).
  const extra = c - PUBLIC_TOP_MAX;
  const units = Math.ceil(extra / PUBLIC_OVER_TOP.unitAmount);
  const fee = PUBLIC_TOP_FEE + units * PUBLIC_OVER_TOP.unitFee;
  return {
    fee,
    bracketIndex: PUBLIC_LIMITED_BRACKETS.length,
    overTop: true,
    extraUnits: units,
    bracketLabel: `Above ${formatNPR(PUBLIC_TOP_MAX)}`,
  };
}

function bracketRangeLabel(brackets, index) {
  const prevMax = index === 0 ? 0 : brackets[index - 1].max;
  const curMax = brackets[index].max;
  if (prevMax === 0) return `Up to ${formatNPR(curMax)}`;
  return `${formatNPR(prevMax + 1)} – ${formatNPR(curMax)}`;
}

export function describePrivateBracket(index) {
  return bracketRangeLabel(PRIVATE_LIMITED_BRACKETS, index);
}

export function describePublicBracket(index) {
  return bracketRangeLabel(PUBLIC_LIMITED_BRACKETS, index);
}

// ── High-level estimate builders (used by the page + tests) ────────

/** Full private-limited estimate: { capital, fee, total, bracketLabel, overTop }. */
export function estimatePrivateLimited(capital) {
  const v = validateCapital(capital);
  if (!v.ok) throw new Error(v.error);
  const r = privateLimitedFee(v.value);
  return {
    capital: v.value,
    fee: r.fee,
    total: r.fee,
    bracketLabel: r.bracketLabel,
    overTop: r.overTop,
    extraUnits: r.extraUnits ?? 0,
  };
}

/** Full public-limited estimate. */
export function estimatePublicLimited(capital) {
  const v = validateCapital(capital);
  if (!v.ok) throw new Error(v.error);
  const r = publicLimitedFee(v.value);
  return {
    capital: v.value,
    fee: r.fee,
    total: r.fee,
    bracketLabel: r.bracketLabel,
    overTop: r.overTop,
    extraUnits: r.extraUnits ?? 0,
  };
}
