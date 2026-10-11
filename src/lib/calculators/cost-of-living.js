/**
 * Cost of Living — Calculation Engine
 * ====================================
 * Pure functions, no DOM. All amounts are monthly NPR unless noted.
 *
 * @module cost-of-living
 */

import {
  EXPENSE_CATEGORIES,
  LIFESTYLE_THRESHOLDS,
} from '../../data/cost-of-living.js';

export const MAX_AMOUNT = 5e7; // Rs. 5 crore ceiling per category
export const MAX_HOUSEHOLD = 20;

/** Format: 52000 -> "Rs 52,000"  (no decimals — spec uses integer rupees) */
export function formatNPR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'Rs 0';
  const grouped = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(Math.abs(n)));
  return (n < 0 ? '-Rs ' : 'Rs ') + grouped;
}

/** Indian grouping for plain numbers. */
export function formatNumberIN(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
}

/**
 * Parse a rupee input. '' -> { value: null } (treated as 0 in sum).
 * Strips commas, "Rs", "Rs.", and spaces.
 */
export function parseAmount(raw) {
  let s = String(raw ?? '').trim();
  if (s === '') return { value: null };
  s = s.replace(/,/g, '').replace(/^rs\.?\s*/i, '').trim();
  if (s === '') return { value: null };
  if (!/^-?\d+(\.\d+)?$/.test(s)) return { error: 'Enter a valid number.' };
  const v = Number(s);
  if (v < 0) return { error: 'Amount cannot be negative.' };
  if (v > MAX_AMOUNT) return { error: 'That amount is too large.' };
  return { value: v };
}

/** Coerce to safe non-negative integer rupees (invalid -> 0). */
export function sanitizeAmount(raw) {
  if (raw == null || raw === '') return 0;
  let s = String(raw).trim().replace(/,/g, '').replace(/^rs\.?\s*/i, '').trim();
  if (s === '') return 0;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > MAX_AMOUNT) return 0;
  return Math.round(n);
}

/** Clamp household size to 1..MAX_HOUSEHOLD. */
export function sanitizeHousehold(raw) {
  const n = Number(String(raw ?? '').trim().replace(/,/g, ''));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), MAX_HOUSEHOLD);
}

function lifestyleFor(total) {
  for (const t of LIFESTYLE_THRESHOLDS) {
    if (total <= t.max) return { label: t.label, desc: t.desc, color: t.color };
  }
  return { label: 'Premium', desc: '', color: '#E62B1E' };
}

/**
 * Calculate cost of living totals + breakdown.
 * @param {object} input
 * @param {Record<string, number|string>} input.expenses  key -> monthly Rs.
 * @param {number|string} input.householdSize
 * @returns {{ monthly:number, yearly:number, perPerson:number, householdSize:number, breakdown:Array, lifestyle:{label,desc,color}, total:number }}
 */
export function calculateCostOfLiving({ expenses = {}, householdSize = 1 } = {}) {
  const size = sanitizeHousehold(householdSize);
  const breakdown = [];
  let monthly = 0;

  for (const cat of EXPENSE_CATEGORIES) {
    const amt = sanitizeAmount(expenses[cat.key]);
    monthly += amt;
    breakdown.push({ key: cat.key, label: cat.label, amount: amt, group: cat.group });
  }

  // Keep original order for expense table, plus sorted copy for largest slice
  const sorted = [...breakdown].sort((a, b) => b.amount - a.amount);

  const yearly = monthly * 12;
  const perPerson = size > 0 ? Math.round(monthly / size) : monthly;
  const lifestyle = lifestyleFor(monthly);

  return {
    monthly,
    yearly,
    perPerson,
    householdSize: size,
    breakdown,
    sorted,
    lifestyle,
    total: monthly,
  };
}

/** Breakdown grouped for the results card (for bar widths). */
export function breakdownPercents(breakdown, total) {
  if (total <= 0) return breakdown.map((b) => ({ ...b, percent: 0 }));
  return breakdown.map((b) => ({ ...b, percent: (b.amount / total) * 100 }));
}
