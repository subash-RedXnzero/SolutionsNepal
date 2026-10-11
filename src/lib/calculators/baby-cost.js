/**
 * New Baby Cost — Pure calculation engine (Nepal)
 * ==============================================
 * Financial planning only. Deterministic, no DOM.
 *
 * Anti-double-count rules (each rupee counted exactly once):
 * - Diapers/feeding flow ONLY from their dedicated sections into the
 *   monthly total — the monthly section holds only incremental items.
 * - Healthcare monthly-equivalent folds annual (÷12) and one-time (÷12).
 * - Baby food is excluded from the monthly total; it joins the
 *   first-year total for months >= start month only.
 * - Childcare uses its own months-per-year, not ×12.
 *
 * @module baby-cost
 */

import { LIMITS } from '../../data/baby-cost.js';

export function sanitizeAmount(v) {
  if (v == null || String(v).trim() === '') return 0;
  const n = Number(String(v).replace(/,/g, '').replace(/^Rs\.?\s*/i, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, LIMITS.maxAmount);
}

export function formatNPR(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'Rs 0';
  const sign = v < 0 ? '-' : '';
  return `${sign}Rs ${new Intl.NumberFormat('en-IN').format(Math.abs(Math.round(v)))}`;
}

const sum = (arr) => arr.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);

/**
 * @param {object} p
 * @param {number} p.babies  1 | 2
 * @param {object} p.delivery  {checkups, tests, hospital, doctor, medicines, other}
 * @param {object} p.essentials  flat record of one-time item amounts
 * @param {object} p.bf  one-time breastfeeding supplies {pump, bottles, accessories, other}
 * @param {number} p.diapersPerDay, p.diaperCost
 * @param {number} p.formulaMonthly, p.formulaSuppliesMonthly
 * @param {object} p.health  [{amount, freq:'monthly'|'annual'}...] + emergency one-time
 * @param {number} p.childcareMonthly, p.childcareMonths
 * @param {number} p.babyFoodMonthly, p.babyFoodStart (1-12)
 * @param {object} p.monthly  {toiletries, clothing, transport, other}
 * @param {number} p.contingencyPct
 */
export function calcBaby({
  babies = 1,
  delivery = {},
  essentials = {},
  bf = {},
  diapersPerDay = 0,
  diaperCost = 0,
  formulaMonthly = 0,
  formulaSuppliesMonthly = 0,
  health = [],
  emergencyHealth = 0,
  childcareMonthly = 0,
  childcareMonths = 12,
  babyFoodMonthly = 0,
  babyFoodStart = 6,
  monthly = {},
  contingencyPct = 0,
} = {}) {
  const N = Math.max(1, Math.min(4, Math.floor(Number(babies) || 1)));

  // ── One-time: delivery + setup ──
  const deliveryVals = ['checkups', 'tests', 'hospital', 'doctor', 'medicines', 'other'].map((k) => sanitizeAmount(delivery[k]));
  const deliveryTotal = sum(deliveryVals);
  const essentialsTotal = sum(Object.values(essentials).map(sanitizeAmount));
  const bfTotal = sum(Object.values(bf).map(sanitizeAmount));
  const oneTime = deliveryTotal + essentialsTotal + bfTotal;

  // ── Monthly recurring ──
  const diaperDaily = Math.max(0, Number(diapersPerDay) || 0) * sanitizeAmount(diaperCost);
  const diapersM = diaperDaily * 30 * N;
  const feedingM = (sanitizeAmount(formulaMonthly) + sanitizeAmount(formulaSuppliesMonthly)) * N;

  let healthMonthlyEquiv = 0;
  let healthFirstYear = 0;
  for (const h of health) {
    const a = sanitizeAmount(h.amount);
    if (h.freq === 'annual') { healthMonthlyEquiv += a / 12; healthFirstYear += a; }
    else { healthMonthlyEquiv += a; healthFirstYear += a * 12; }
  }
  const emergency = sanitizeAmount(emergencyHealth);
  healthMonthlyEquiv += emergency / 12;
  healthFirstYear += emergency;

  const ccM = sanitizeAmount(childcareMonthly);
  const ccMonths = Math.max(0, Math.min(12, Math.floor(Number(childcareMonths) || 0)));
  const childcareFirstYear = ccM * ccMonths;

  const bfM = sanitizeAmount(babyFoodMonthly);
  const bfStart = Math.max(1, Math.min(12, Math.floor(Number(babyFoodStart) || 6)));
  const bfActiveMonths = bfM > 0 ? 13 - bfStart : 0;
  const babyFoodFirstYear = bfM * N * bfActiveMonths;

  const toiletries = sanitizeAmount(monthly.toiletries);
  const clothingM = sanitizeAmount(monthly.clothing) * N;
  const transport = sanitizeAmount(monthly.transport);
  const otherM = sanitizeAmount(monthly.other);

  const monthlyTotal =
    diapersM + feedingM + healthMonthlyEquiv + ccM + toiletries + clothingM + transport + otherM;

  // ── First year ──
  const baseMonthlyForYear = monthlyTotal - ccM; // childcare has its own month count
  const firstYearRecurring = baseMonthlyForYear * 12 + childcareFirstYear + babyFoodFirstYear;
  const firstMonth = oneTime + monthlyTotal - (bfStart > 1 && bfM > 0 ? bfM * N : 0);
  const preContingency = oneTime + firstYearRecurring;
  const contPct = Math.max(0, Math.min(100, Number(contingencyPct) || 0));
  const contingency = (preContingency * contPct) / 100;
  const firstYearTotal = preContingency + contingency;

  // ── Annual equivalents for breakdown ──
  const diapersAnnual = diaperDaily * 365 * N;
  const feedingAnnual = feedingM * 12;
  const childcareAnnual = childcareFirstYear;

  return {
    inputs: { babies: N, contPct, ccMonths, bfStart, bfActiveMonths },
    oneTime, deliveryTotal, essentialsTotal, bfTotal,
    monthlyTotal,
    lines: {
      diapersM, feedingM, healthM: healthMonthlyEquiv, childcareM: ccM,
      babyfoodM: bfM * N, toiletries, clothingM, transport, otherM,
    },
    firstMonth, firstYearRecurring, babyFoodFirstYear, childcareFirstYear,
    contingency, firstYearTotal,
    beforeBirth: oneTime,
    avgMonthly: firstYearRecurring / 12,
    annual: {
      diapers: diapersAnnual, feeding: feedingAnnual,
      healthcare: healthFirstYear, childcare: childcareAnnual,
    },
    warnings: [],
  };
}
