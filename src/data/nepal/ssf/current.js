/**
 * Nepal Social Security Fund (SSF) — Current Rules
 * =================================================
 * The ONLY source of truth for SSF contribution rates in this calculator.
 * Never hard-code SSF rates in UI or engine code.
 *
 * VERIFIED 2026-09-11
 * --------------------
 * - Contribution Based Social Security Act 2074 (2017) & Social Security
 *   Regulations 2075 (2018). Operational for private-sector enrolment from
 *   late 2019. Governed by the Ministry of Labour, Employment and Social
 *   Security; administered by the Social Security Fund (ssf.gov.np).
 *
 * - Contribution BASE: contributions are computed on BASIC SALARY only.
 *   Allowances (dearness, house rent, transport, etc.) are excluded unless
 *   an employer's structure treats a component as basic remuneration.
 *   Labour Rules require basic to be at least 60% of gross.
 *   Sources: ssf.gov.np (2026), multiple 2026 payroll guides.
 *
 * - Rates (unchanged since inception):
 *     Employee  11%  = 10% pension fund + 1% social security tax
 *     Employer  20%  = 10% pension fund + 8.33% gratuity + 1.67% additional
 *     Total     31%  of basic salary
 *
 * - The employer contribution is paid BY the employer ON TOP of salary.
 *   It is NOT an employee salary deduction and must never be subtracted
 *   from an employee's net salary.
 *
 * - NOTE: A single 2026 payroll guide mentions an NPR 50,000 ceiling on the
 *   contribution base ("11% of basic salary capped at NPR 50,000"). This is
 *   NOT confirmed by official SSF sources and is treated as an optional,
 *   user-selectable assumption that needs verification.
 */

export const SSF_CURRENT = {
  id: 'current',
  label: 'SSF rules currently in effect',
  effectiveDate: 'Late 2019 onwards (Act 2074 / Rules 2075)',
  lastVerified: '2026-09-11',

  source: {
    name: 'Social Security Fund Nepal',
    url: 'https://ssf.gov.np',
    act: 'Contribution Based Social Security Act 2074 & Social Security Regulations 2075',
    note: 'Rates cross-verified 2026-09-11 against multiple 2026 legal and payroll sources citing the Act/Regulations (11% employee + 20% employer of basic salary, unchanged since inception).',
  },

  base: {
    default: 'basic', // contribution base default
    options: ['basic', 'basic+da', 'gross', 'custom'],
    definition:
      'SSF contributions are calculated on basic salary only. Allowances are excluded unless the employer/contract treats a component as basic remuneration. Labour Rules require basic salary to be at least 60% of gross.',
    verified: true,
  },

  // Optional ceiling on the contribution base. NOT officially confirmed.
  // Exposed in the UI as an opt-in assumption marked "needs verification".
  ceiling: {
    amount: 50000, // NPR per month
    verified: false,
    note: 'A single 2026 payroll guide mentions a NPR 50,000 monthly ceiling on the SSF base. Not confirmed by official SSF sources. Leave disabled unless your employer confirms it.',
  },

  employee: {
    rate: 0.11,
    breakdown: [
      { key: 'pensionFund', label: 'Pension fund', rate: 0.10 },
      { key: 'socialSecurityTax', label: 'Social security tax', rate: 0.01 },
    ],
  },

  employer: {
    rate: 0.20,
    breakdown: [
      { key: 'pensionFund', label: 'Pension fund', rate: 0.10 },
      { key: 'gratuity', label: 'Gratuity', rate: 0.0833 },
      { key: 'additional', label: 'Additional', rate: 0.0167 },
    ],
  },

  combinedRate: 0.31,

  // Allocation of the combined 31% across the four benefit schemes (reference).
  schemeAllocation: [
    { key: 'medical', label: 'Medical, health & maternity protection', rate: 0.01 },
    { key: 'accident', label: 'Accident & disability protection', rate: 0.014 },
    { key: 'dependent', label: 'Dependent family protection (life cover)', rate: 0.0027 },
    { key: 'pension', label: 'Old-age protection (pension)', rate: 0.2833 },
  ],

  notes: [
    'Employer SSF is an employer cost, not an employee deduction.',
    'SSF enrolment waives the 1% Social Security Tax on the first income slab for FY 2083/84.',
    'SSF-registered employees do not receive a separate gratuity; non-SSF employees may be entitled to gratuity under Labour Act 2074.',
  ],
};

/**
 * Resolve the monthly SSF contribution base from a salary structure.
 * @param {object} income - { basicSalary, dearnessAllowance, otherAllowances, ... }
 * @param {string} baseMode - 'basic' | 'basic+da' | 'gross' | 'custom' | 'components'
 * @param {number} customBase - used when baseMode === 'custom'
 * @param {string[]} ssfKeys - component keys included in the base when baseMode === 'components'
 * @returns {{ amount: number, label: string, components: string[] }}
 */
export function resolveSSFBase(income, baseMode = 'basic', customBase = 0, ssfKeys = ['basicSalary']) {
  const basic = Math.max(0, Number(income.basicSalary) || 0);
  const da = Math.max(0, Number(income.dearnessAllowance) || 0);
  const other = Math.max(0, Number(income.otherAllowances) || 0);
  const overtime = Math.max(0, Number(income.overtimeAmount || income.overtime) || 0);
  const bonus = Math.max(0, Number(income.bonus) || 0);
  const commission = Math.max(0, Number(income.commission) || 0);
  const otherIncome = Math.max(0, Number(income.otherIncome) || 0);

  const all = { basicSalary: basic, dearnessAllowance: da, otherAllowances: other, overtimeAmount: overtime, bonus, commission, otherIncome };

  switch (baseMode) {
    case 'basic+da':
      return { amount: basic + da, label: 'Basic salary + dearness allowance', components: ['basic', 'da'] };
    case 'gross':
      return { amount: basic + da + other + overtime + bonus + commission + otherIncome, label: 'All gross earnings', components: ['all'] };
    case 'custom':
      return { amount: Math.max(0, Number(customBase) || 0), label: 'Custom amount entered by user', components: ['custom'] };
    case 'components':
      return {
        amount: ssfKeys.reduce((sum, k) => sum + (all[k] || 0), 0),
        label: 'Components selected as SSF-applicable in the Income section',
        components: ssfKeys,
      };
    case 'basic':
    default:
      return { amount: basic, label: 'Basic salary only (official default)', components: ['basic'] };
  }
}

/**
 * Apply an optional verified/unverified ceiling to a monthly SSF base.
 * @param {number} base
 * @param {{enabled: boolean, amount: number}} ceiling
 */
export function applySSFCeiling(base, ceiling = { enabled: false, amount: 50000 }) {
  if (ceiling && ceiling.enabled) {
    const cap = Math.max(0, Number(ceiling.amount) || 0);
    return { amount: Math.min(base, cap), capped: base > cap };
  }
  return { amount: base, capped: false };
}

/**
 * Calculate SSF contributions for a monthly base.
 * @param {number} monthlyBase - monthly SSF-applicable remuneration
 * @param {object} rules - the SSF rules object (defaults to SSF_CURRENT)
 * @returns {object} { base, employee: {...}, employer: {...}, combined }
 */
export function calculateSSFContributions(monthlyBase, rules = SSF_CURRENT) {
  const empRate = rules.employee.rate;
  const empBreakdown = rules.employee.breakdown.map(b => ({
    key: b.key,
    label: b.label,
    rate: b.rate,
    amount: round2(monthlyBase * b.rate),
  }));
  const empTotal = round2(monthlyBase * empRate);

  const emrRate = rules.employer.rate;
  const emrBreakdown = rules.employer.breakdown.map(b => ({
    key: b.key,
    label: b.label,
    rate: b.rate,
    amount: round2(monthlyBase * b.rate),
  }));
  const emrTotal = round2(monthlyBase * emrRate);

  return {
    base: monthlyBase,
    employee: { rate: empRate, breakdown: empBreakdown, total: empTotal },
    employer: { rate: emrRate, breakdown: emrBreakdown, total: emrTotal },
    combined: round2(empTotal + emrTotal),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}