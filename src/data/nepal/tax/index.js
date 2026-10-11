/**
 * Nepal Personal Income Tax Rules — Fiscal Year Registry
 * =======================================================
 * Every fiscal year's rules live in its own versioned file. This registry is
 * the only entry point for the rest of the app. Adding a future fiscal year
 * means adding a file and registering it here — no UI/engine changes needed.
 *
 * Current default: FY 2083/84 (2026/27).
 */

import { FY_2083_84, calculateTax2083_84 } from './fy-2083-84.js';
import { FY_2082_83, calculateTax2082_83 } from './fy-2082-83.js';

export const FISCAL_YEARS = {
  '2083/84': FY_2083_84,
  '2082/83': FY_2082_83,
};

export const FISCAL_YEAR_ORDER = ['2083/84', '2082/83'];

/**
 * Get rules for a fiscal year id.
 * @param {string} fyId e.g. '2083/84'
 * @returns {object|null}
 */
export function getFiscalYearRules(fyId) {
  return FISCAL_YEARS[fyId] || null;
}

/**
 * Get the default (current) fiscal year.
 * @returns {object}
 */
export function getCurrentFiscalYear() {
  return FISCAL_YEARS['2083/84'];
}

/**
 * Compute annual income tax for a fiscal year with the correct engine.
 * @param {string} fyId
 * @param {number} annualTaxableIncome
 * @param {object} opts - { filingStatus, ssfEnrolled, female, sstWaived }
 * @returns {object} { totalTax, monthlyTax, slabs, rebate, sstWaiver }
 */
export function calculateIncomeTaxForFiscalYear(fyId, annualTaxableIncome, opts = {}) {
  const rules = getFiscalYearRules(fyId);
  if (!rules) {
    throw new Error(`Unknown fiscal year: ${fyId}`);
  }

  if (rules.unified) {
    return calculateTax2083_84(annualTaxableIncome, { ...opts, rules });
  }
  return calculateTax2082_83(annualTaxableIncome, { ...opts, rules });
}