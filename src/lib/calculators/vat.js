/**
 * VAT Calculator Engine (Nepal)
 * =============================
 * Pure, precise functions for adding and removing VAT.
 *
 * The standard Nepali VAT rate lives in DEFAULT_VAT_RATE — a single
 * configuration point. Update it there if the official rate changes;
 * nothing else needs to change.
 *
 * @module vat
 */

/**
 * Nepal's standard VAT rate (%). Single source of truth for this feature.
 * To update after an official change: edit this value and note the source
 * date below. Verify against the Inland Revenue Department (ird.gov.np).
 */
export const DEFAULT_VAT_RATE = 13;

export const LIMITS = { maxAmount: 1e12, maxRate: 100 };

// ── Formatting ───────────────────────────────────────────────────────────

/**
 * Format NPR with Nepali/Indian grouping. Shows two decimals ONLY when
 * the amount actually has paise: 11300 → "Rs. 11,300" · 11300.5 → "Rs. 11,300.50"
 */
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

/** Group a plain number Indian-style (for quick buttons etc.). */
export function formatNumberIN(num) {
  return new Intl.NumberFormat('en-IN').format(num);
}

// ── Validation ───────────────────────────────────────────────────────────

function checkNumeric(raw) {
  const v = typeof raw === 'string' ? raw.trim() : raw;
  if (v === '' || v === null || v === undefined) {
    return { ok: false, error: 'Enter a valid amount.' };
  }
  const num = Number(v);
  if (!Number.isFinite(num)) {
    return { ok: false, error: 'Enter a valid amount.' };
  }
  return { ok: true, value: num };
}

export function validateAmount(raw) {
  const res = checkNumeric(raw);
  if (!res.ok) return res;
  if (res.value < 0) return { ok: false, error: 'Amount cannot be negative.' };
  if (res.value > LIMITS.maxAmount) return { ok: false, error: 'Amount is too large.' };
  return res;
}

export function validateRate(raw) {
  const v = typeof raw === 'string' ? raw.trim() : raw;
  if (v === '' || v === null || v === undefined || !Number.isFinite(Number(v))) {
    return { ok: false, error: 'Enter a valid VAT rate.' };
  }
  const num = Number(v);
  if (num < 0) return { ok: false, error: 'VAT rate cannot be negative.' };
  if (num > LIMITS.maxRate) return { ok: false, error: 'VAT rate cannot exceed 100%.' };
  return { ok: true, value: num };
}

// ── Core math ────────────────────────────────────────────────────────────

/**
 * Add VAT to a VAT-exclusive amount.
 *   VAT   = Amount × rate / 100
 *   Total = Amount + VAT
 */
export function addVat(amount, ratePct) {
  const vat = (amount * ratePct) / 100;
  const total = amount + vat;
  return { amount, vat, total, ratePct };
}

/**
 * Remove VAT from a VAT-inclusive price using the correct reverse formula:
 *   Exclusive = Inclusive / (1 + rate / 100)
 *   VAT       = Inclusive − Exclusive
 * (NOT "inclusive × rate%" — that is a common mistake.)
 */
export function removeVat(inclusivePrice, ratePct) {
  const exclusive = inclusivePrice / (1 + ratePct / 100);
  const vat = inclusivePrice - exclusive;
  return { amount: exclusive, vat, total: inclusivePrice, ratePct };
}
