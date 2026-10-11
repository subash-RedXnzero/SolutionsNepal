/**
 * Loan Eligibility — Centralized assumptions & options (Nepal)
 * ============================================================
 * All editable assumptions live here. The calculator engine and UI
 * read from this file — update values here, never inside components.
 *
 * NOTE: FOIR (repayment-capacity) ratios below are common planning
 * assumptions, NOT official bank policy. Lenders apply their own rules.
 */

export const LAST_CHECKED = 'September 2026';

/** Repayment-capacity ratio applied to total monthly income, by employment type. */
export const EMPLOYMENT_TYPES = [
  { id: 'salaried', label: 'Salaried', foir: 0.5 },
  { id: 'self-employed', label: 'Self-employed', foir: 0.45 },
  { id: 'business', label: 'Business owner', foir: 0.45 },
  { id: 'other', label: 'Other', foir: 0.45 },
];

export const LOAN_TYPES = [
  { id: 'home', label: 'Home Loan' },
  { id: 'vehicle', label: 'Vehicle Loan' },
  { id: 'personal', label: 'Personal Loan' },
  { id: 'education', label: 'Education Loan' },
  { id: 'business', label: 'Business Loan' },
];

/** Tenure options in years. */
export const TENURE_YEARS = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30];

/** Comfortable loan = this fraction of the maximum affordable principal. */
export const COMFORT_FACTOR = 0.8;

/** Form defaults. */
export const DEFAULTS = {
  employmentId: 'salaried',
  loanTypeId: 'home',
  livingExpenses: 25000,
  interestRatePct: 9.5,
  tenureYears: 20,
};

export const LIMITS = {
  maxAmount: 1e10,
  maxRatePct: 50,
  maxTenureYears: 30,
};

export function getEmployment(id) {
  return EMPLOYMENT_TYPES.find((e) => e.id === id) || EMPLOYMENT_TYPES[0];
}

export function getLoanType(id) {
  return LOAN_TYPES.find((t) => t.id === id) || LOAN_TYPES[0];
}
