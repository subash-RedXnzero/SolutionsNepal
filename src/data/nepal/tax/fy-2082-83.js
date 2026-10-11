/**
 * Nepal Personal Income Tax Rules — FY 2082/83 (2025/26)
 * ======================================================
 * Previous fiscal year. Retained for versioned comparison and prior-year
 * reconciliation. Rates per Finance Act 2082 / Income Tax Act 2058.
 *
 * VERIFIED 2026-08-19
 * --------------------
 * Separate schedules existed for single individuals (first band NPR 500,000)
 * and couples (first band NPR 600,000). The 1% first-band SST was waived for
 * SSF contributors. Top rate 39% above NPR 5,000,000.
 *
 * SOURCES:
 *   - Finance Act 2082 (First Schedule, Part 1)
 *   - IRD Nepal — "आ.व. २०८२।८३ लागि करको दर प्राकृतिक व्यक्तिको लागि"
 *
 * NOTE: This file exists to demonstrate fiscal-year versioning. The calculator
 * defaults to FY 2083/84. Do not mix rates across fiscal years.
 */

export const FY_2082_83 = {
  id: '2082/83',
  label: 'FY 2082/83 (2025/26)',
  bs: 'आ.व. २०८२/८३',
  effective: '1 Shrawan 2082 (≈ 17 July 2025)',
  lastVerified: '2026-08-19',
  needsVerification: false,

  source: {
    name: 'Inland Revenue Department Nepal',
    url: 'https://ird.gov.np',
    act: 'Finance Act 2082, Income Tax Act 2058 (as amended)',
  },

  // Separate schedules for single and married-couple filers
  unified: false,

  slabs: {
    single: [
      { min: 0, max: 500000, rate: 0.01, type: 'sst', label: 'Social Security Tax' },
      { min: 500001, max: 700000, rate: 0.10, label: '10%' },
      { min: 700001, max: 1000000, rate: 0.20, label: '20%' },
      { min: 1000001, max: 2000000, rate: 0.30, label: '30%' },
      { min: 2000001, max: 5000000, rate: 0.36, label: '36%' },
      { min: 5000001, max: null, rate: 0.39, label: '39%' },
    ],
    couple: [
      { min: 0, max: 600000, rate: 0.01, type: 'sst', label: 'Social Security Tax' },
      { min: 600001, max: 800000, rate: 0.10, label: '10%' },
      { min: 800001, max: 1100000, rate: 0.20, label: '20%' },
      { min: 1100001, max: 2000000, rate: 0.30, label: '30%' },
      { min: 2000001, max: 5000000, rate: 0.36, label: '36%' },
      { min: 5000001, max: null, rate: 0.39, label: '39%' },
    ],
  },

  sst: {
    rate: 0.01,
    waivedForSSF: true,
  },

  rebates: {
    female: { rate: 0.10, condition: 'Resident female earning ONLY from employment in Nepal' },
  },

  deductions: {
    retirement: {
      label: 'Retirement fund contributions (SSF + PF + CIT)',
      combinedPool: true,
      includesEmployerShare: true,
      capAbsolute: 500000,
      capThirdOfIncome: 1 / 3,
    },
    lifeInsurance: { max: 40000 },
    healthInsurance: { max: 20000 },
  },

  tds: {
    mode: 'annual-tax-divided-by-12',
    note: 'Monthly TDS = computed annual income tax ÷ 12.',
  },
};

/**
 * Compute income tax for FY 2082/83 (single or couple schedule).
 * @param {number} annualTaxableIncome
 * @param {object} opts
 * @param {'single'|'couple'} opts.filingStatus
 * @param {boolean} opts.ssfEnrolled
 * @param {boolean} opts.female
 * @param {object} rules
 * @returns {object}
 */
export function calculateTax2082_83(annualTaxableIncome, { filingStatus = 'single', ssfEnrolled = false, female = false, rules = FY_2082_83 } = {}) {
  const income = Math.max(0, Number(annualTaxableIncome) || 0);
  if (income <= 0) {
    return { taxableIncome: 0, totalTax: 0, monthlyTax: 0, slabs: [], rebate: 0, sstWaiver: 0 };
  }

  const schedule = rules.slabs[filingStatus] || rules.slabs.single;
  let prev = 0;
  let totalTax = 0;
  const slabDetail = [];
  let sstWaiver = 0;

  for (const slab of schedule) {
    const cap = slab.max == null ? Infinity : slab.max;
    if (income <= prev || prev >= cap) break;

    const bandAmount = Math.min(income, cap) - prev;
    let rate = slab.rate;

    if (slab.type === 'sst' && ssfEnrolled && rules.sst.waivedForSSF) {
      sstWaiver += bandAmount * slab.rate;
      rate = 0;
    }

    const tax = bandAmount * rate;
    slabDetail.push({
      min: prev,
      max: slab.max,
      rate,
      ratePercent: Math.round(rate * 100 * 100) / 100,
      label: slab.label,
      taxableAmount: bandAmount,
      tax: Math.round(tax * 100) / 100,
    });
    totalTax += tax;
    prev = cap;
  }

  totalTax = Math.round(totalTax * 100) / 100;

  let rebate = 0;
  if (female && rules.rebates && rules.rebates.female) {
    rebate = Math.round(totalTax * rules.rebates.female.rate * 100) / 100;
    totalTax = Math.round((totalTax - rebate) * 100) / 100;
  }

  return {
    taxableIncome: income,
    totalTax,
    monthlyTax: Math.round((totalTax / 12) * 100) / 100,
    slabs: slabDetail,
    rebate,
    sstWaiver: Math.round(sstWaiver * 100) / 100,
  };
}