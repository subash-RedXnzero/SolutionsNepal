/**
 * Wedding Budget — Calculation Engine
 * ===================================
 * Pure functions (no DOM). Adds up user-entered wedding expenses only —
 * there are no hidden market prices. Blank/invalid fields are "not
 * included", never zero-filled guesses.
 *
 * Main entry:
 *   calculateWeddingBudget({
 *     guests, events, cateringPerGuest, venue,
 *     expenses, excluded, emergencyBuffer, targetBudget,
 *   })
 *
 * Returns:
 *   { subtotal, emergencyBuffer, total, costPerGuest,
 *     categoryBreakdown, topExpenses, budgetDifference,
 *     cateringCost, venueCost, warnings }
 *
 * @module wedding-budget
 */

import {
  BUDGET_ALLOCATION,
  WEDDING_EXPENSE_KEYS,
  WEDDING_LABELS,
} from '../../data/wedding-budget.js';

export const MAX_AMOUNT = 1e10; // Rs. 1,000 crore safety ceiling
export const MAX_GUESTS = 100000;

// ── Formatting (Nepal/Indian grouping) ──────────────────────────

/** 2250000 -> "Rs. 22,50,000" (decimals only when actually fractional). */
export function formatNPR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'Rs. 0';
  const negative = n < 0;
  const abs = Math.abs(n);
  const hasFraction = Math.round(abs * 100) % 100 !== 0;
  const grouped = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs);
  return (negative ? '-Rs. ' : 'Rs. ') + grouped;
}

/** Plain grouped number: 2250000 -> "22,50,000". */
export function formatNumberIN(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
}

// ── Parsing / sanitising ────────────────────────────────────────

/**
 * Parse one amount input. '' -> { value: null } (not included).
 * Returns { value } or { error } — never throws, never guesses.
 */
export function parseAmount(raw) {
  const s = String(raw ?? '').trim().replace(/,/g, '');
  if (s === '') return { value: null };
  if (!/^-?\d+(\.\d+)?$/.test(s)) return { error: 'Enter a valid number.' };
  const v = Number(s);
  if (v < 0) return { error: 'Amount cannot be negative.' };
  if (v > MAX_AMOUNT) return { error: 'That amount is too large to estimate.' };
  return { value: v };
}

/** Coerce anything to a safe non-negative amount (invalid -> 0). */
export function sanitizeAmount(raw) {
  const n = typeof raw === 'string' ? Number(raw.trim().replace(/,/g, '')) : Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > MAX_AMOUNT) return 0;
  return Math.round(n * 100) / 100;
}

/** Coerce guest counts to a safe integer (invalid/negative -> 0). */
export function sanitizeGuests(raw) {
  const n = typeof raw === 'string' ? Number(raw.trim().replace(/,/g, '')) : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.floor(n), MAX_GUESTS);
}

// ── Building blocks ─────────────────────────────────────────────

/**
 * Catering cost.
 * - With per-event guest counts: sum(eventGuests) × perGuest.
 * - Without events: guests × perGuest.
 * Returns { cost, guestNights, perGuest }.
 */
export function calcCateringCost(guests, cateringPerGuest, events = []) {
  const perGuest = sanitizeAmount(cateringPerGuest);
  const eventGuests = (Array.isArray(events) ? events : [])
    .map((e) => sanitizeGuests(e && e.guests))
    .filter((g) => g > 0);
  const guestNights =
    eventGuests.length > 0 ? eventGuests.reduce((s, g) => s + g, 0) : sanitizeGuests(guests);
  return { cost: Math.round(guestNights * perGuest * 100) / 100, guestNights, perGuest };
}

/**
 * Venue cost.
 * - mode 'total': the total amount as entered.
 * - mode 'per-event': perEvent × max(selectedEvents, 1 when an amount is set).
 */
export function calcVenueCost(venue = {}, eventCount = 0) {
  const mode = venue.mode === 'per-event' ? 'per-event' : 'total';
  if (mode === 'per-event') {
    const perEvent = sanitizeAmount(venue.perEvent);
    const count = Math.max(1, Math.floor(Number(eventCount)) || 0);
    return { cost: perEvent === 0 ? 0 : Math.round(perEvent * count * 100) / 100, mode, eventCount: count };
  }
  return { cost: sanitizeAmount(venue.total), mode, eventCount: Math.floor(Number(eventCount)) || 0 };
}

/**
 * Suggested allocation for budget-first mode.
 * Splits `budget` by BUDGET_ALLOCATION percents (sums back to budget;
 * rounding drift is folded into the last row).
 * Returns [{ id, label, percent, amount }].
 */
export function suggestBudgetAllocation(budget) {
  const total = sanitizeAmount(budget);
  if (total <= 0) throw new Error('Enter your total budget — a number above zero.');
  let assigned = 0;
  const rows = BUDGET_ALLOCATION.map((row, i) => {
    const isLast = i === BUDGET_ALLOCATION.length - 1;
    const amount = isLast
      ? Math.round((total - assigned) * 100) / 100
      : Math.round(((total * row.percent) / 100) * 100) / 100;
    assigned = Math.round((assigned + amount) * 100) / 100;
    return { id: row.id, label: row.label, percent: row.percent, amount };
  });
  return rows;
}

/** Blank calculator state (used by Reset + tests). */
export function defaultWeddingState() {
  return {
    mode: 'estimate',
    province: '',
    city: '',
    guests: '',
    events: [],
    cateringPerGuest: '',
    mealStyle: 'custom',
    venueMode: 'total',
    venueTotal: '',
    venuePerEvent: '',
    expenses: {},
    excluded: [],
    bufferEnabled: true,
    bufferPercent: 5,
    targetBudget: '',
  };
}

// ── Main calculation ────────────────────────────────────────────

/**
 * calculateWeddingBudget({
 *   guests?: number|string,            // main guest count
 *   events?: Array<{ id, guests }>,    // selected events w/ per-event guests
 *   cateringPerGuest?: number|string,
 *   venue?: { mode: 'total'|'per-event', total?, perEvent? },
 *   expenses?: Record<string, number|string>,  // key -> amount (blank = not included)
 *   excluded?: string[],               // keys to leave out ("already arranged")
 *   emergencyBuffer?: { enabled?: boolean, percent?: number|string },
 *   targetBudget?: number|string|null, // optional budget to compare against
 * })
 */
export function calculateWeddingBudget(input = {}) {
  const {
    guests = 0,
    events = [],
    cateringPerGuest = 0,
    venue = {},
    expenses = {},
    excluded = [],
    emergencyBuffer = {},
    targetBudget = null,
  } = input;

  const warnings = [];
  const excludedSet = new Set(Array.isArray(excluded) ? excluded : []);

  const mainGuests = sanitizeGuests(guests);
  const selectedEvents = (Array.isArray(events) ? events : [])
    .filter((e) => e && typeof e.id === 'string')
    .map((e) => ({ id: e.id, guests: sanitizeGuests(e.guests) }));

  // Catering + venue
  const catering = calcCateringCost(mainGuests, cateringPerGuest, selectedEvents);
  const venueCalc = calcVenueCost(venue, selectedEvents.length);

  // Category expenses (only included + positive amounts appear in the breakdown)
  const categoryBreakdown = [];
  let expensesTotal = 0;
  let excludedCount = 0;
  for (const key of WEDDING_EXPENSE_KEYS) {
    if (excludedSet.has(key)) {
      if (sanitizeAmount(expenses[key]) > 0) excludedCount += 1;
      continue;
    }
    const amount = sanitizeAmount(expenses[key]);
    if (amount > 0) {
      categoryBreakdown.push({ id: key, name: WEDDING_LABELS[key] || key, amount });
      expensesTotal = Math.round((expensesTotal + amount) * 100) / 100;
    }
  }

  if (catering.cost > 0) {
    categoryBreakdown.push({ id: 'catering', name: WEDDING_LABELS.catering, amount: catering.cost });
  }
  if (venueCalc.cost > 0) {
    categoryBreakdown.push({ id: 'venue', name: WEDDING_LABELS.venue, amount: venueCalc.cost });
  }
  categoryBreakdown.sort((a, b) => b.amount - a.amount);

  const round2 = (n) => Math.round(n * 100) / 100;
  const subtotal = round2(catering.cost + venueCalc.cost + expensesTotal);

  // Emergency / miscellaneous buffer (fully transparent, can be disabled)
  const bufferOn = emergencyBuffer.enabled !== false;
  let bufferPct = Number(emergencyBuffer.percent);
  if (!Number.isFinite(bufferPct) || bufferPct < 0) bufferPct = 0;
  if (bufferPct > 100) bufferPct = 100;
  const bufferAmount = bufferOn ? round2((subtotal * bufferPct) / 100) : 0;

  const total = round2(subtotal + bufferAmount);

  // Cost per guest (main count; fall back to largest event when main is 0)
  const divisor =
    mainGuests > 0
      ? mainGuests
      : selectedEvents.reduce((m, e) => Math.max(m, e.guests), 0);
  const costPerGuest = divisor > 0 ? round2(total / divisor) : 0;

  // Top 3 expenses
  const topExpenses = categoryBreakdown.slice(0, 3);

  // Budget comparison
  let budgetDifference = null;
  const budgetRaw = targetBudget === '' || targetBudget == null ? null : Number(targetBudget);
  if (budgetRaw != null && Number.isFinite(budgetRaw) && budgetRaw > 0) {
    const budget = round2(Math.min(budgetRaw, MAX_AMOUNT));
    const difference = round2(total - budget);
    budgetDifference = {
      budget,
      estimated: total,
      difference,
      status: difference > 0 ? 'over' : difference < 0 ? 'under' : 'exact',
    };
  }

  if (excludedCount > 0) {
    warnings.push(
      `${excludedCount} expense${excludedCount === 1 ? ' is' : 's are'} marked “Already arranged” and not included in the total.`,
    );
  }
  if (mainGuests === 0 && selectedEvents.length === 0) {
    warnings.push('No guest count entered — catering is counted as Rs. 0.');
  }

  return {
    subtotal,
    emergencyBuffer: bufferAmount,
    bufferPercent: bufferOn ? bufferPct : 0,
    total,
    costPerGuest,
    guestDivisor: divisor,
    cateringCost: catering.cost,
    cateringGuests: catering.guestNights,
    venueCost: venueCalc.cost,
    categoryBreakdown,
    topExpenses,
    budgetDifference,
    excludedCount,
    warnings,
  };
}
