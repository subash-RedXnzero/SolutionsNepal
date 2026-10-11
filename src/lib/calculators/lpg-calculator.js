/**
 * LPG Gas Cost & Duration — Pure calculation engine (Nepal)
 * =========================================================
 * Deterministic, no DOM. Assumptions from src/data/lpg-calculator.js
 *
 * @module lpg-calculator
 */

import { KG_PER_PERSON_MEAL, LIMITS } from '../../data/lpg-calculator.js';

export function sanitizeAmount(v) {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/,/g, '').replace(/^Rs\.?\s*/i, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, LIMITS.maxAmount);
}

export function sanitizeKg(v) {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/,/g, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, LIMITS.maxKg);
}

export function formatNPR(n, decimals = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'Rs 0';
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  const rounded = decimals > 0 ? Math.round(abs * 100) / 100 : Math.round(abs);
  return `${sign}Rs ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals > 0 ? 2 : 0,
    maximumFractionDigits: decimals > 0 ? 2 : 0,
  }).format(rounded)}`;
}

export function formatInt(n) {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(Math.round(n * 10) / 10);
}

/**
 * Single consistent time base: one average month = 365/12 days.
 * monthly × 12 = annual exactly; cylinders/mo × 12 = cylinders/yr exactly.
 * Displayed annual = displayed monthly × 12 (chained), so hand-checks agree.
 */
export const DAYS_PER_YEAR = 365;
export const DAYS_PER_MONTH = 365 / 12;

/** Estimated daily use (kg/day) from the household model. */
export function estimateDailyUse(people, meals, styleId) {
  const p = Math.max(0, Math.min(LIMITS.maxPeople, Math.floor(Number(people) || 0)));
  const m = Math.max(0, Math.min(LIMITS.maxMeals, Number(meals) || 0));
  const per = KG_PER_PERSON_MEAL[styleId] ?? KG_PER_PERSON_MEAL.moderate;
  return p * m * per;
}

/**
 * @param {object} p
 * @param {number} p.cylinderKg, p.price, p.people, p.meals
 * @param {string} p.styleId
 * @param {boolean} p.useCustom  advanced mode
 * @param {number} p.customKgPerDay
 */
export function calcLpg({
  cylinderKg = 14.2,
  price = 2060,
  people = 4,
  meals = 3,
  styleId = 'moderate',
  useCustom = false,
  customKgPerDay = 0,
} = {}) {
  const cyl = sanitizeKg(cylinderKg);
  const pr = sanitizeAmount(price);
  const estimated = estimateDailyUse(people, meals, styleId);
  const custom = sanitizeKg(customKgPerDay);
  const daily = useCustom ? custom : estimated;

  const warnings = [];
  if (cyl <= 0) warnings.push('Enter a cylinder weight greater than 0 kg.');
  if (pr <= 0) warnings.push('Enter the LPG cylinder price you pay.');
  if (daily <= 0) warnings.push('Daily consumption is 0 — check household inputs or custom usage.');

  if (cyl <= 0 || pr <= 0 || daily <= 0) {
    return {
      valid: false, cyl, pr, daily, estimated, warnings,
      duration: 0, dailyCost: 0, monthlyCost: 0, cylindersPerMonth: 0,
      annualCost: 0, cylindersPerYear: 0,
    };
  }

  const duration = cyl / daily; // days
  const dailyCost = pr / duration;
  const monthlyCost = dailyCost * DAYS_PER_MONTH;
  const cylindersPerMonth = DAYS_PER_MONTH / duration;
  const annualCost = monthlyCost * 12;
  const cylindersPerYear = DAYS_PER_YEAR / duration;

  return {
    valid: true, cyl, pr, daily, estimated, warnings,
    duration, dailyCost, monthlyCost, cylindersPerMonth, annualCost, cylindersPerYear,
  };
}

/** Historical cylinder: filled/finished ISO dates + weight → usage stats. */
export function calcHistory(filledIso, finishedIso, cylinderKg) {
  const cyl = sanitizeKg(cylinderKg);
  if (!filledIso || !finishedIso || cyl <= 0) return null;
  const a = new Date(filledIso + 'T00:00:00');
  const b = new Date(finishedIso + 'T00:00:00');
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const days = Math.round((b - a) / 86400000);
  if (days <= 0) return { error: 'Finished date must be after the filled date.' };
  return { days, dailyKg: cyl / days, perMonth: DAYS_PER_MONTH / days };
}

/** Refill projection from a start date + duration. */
export function calcRefill(startIso, durationDays) {
  if (!startIso || !(durationDays > 0)) return null;
  const start = new Date(startIso + 'T00:00:00');
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + Math.round(durationDays) * 86400000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const remaining = Math.max(0, Math.round((end - today) / 86400000));
  const label = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return { date: end, label, remaining };
}
