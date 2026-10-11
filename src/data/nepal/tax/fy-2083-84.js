/**
 * Nepal Personal Income Tax Rules — FY 2083/84 (2026/27)
 * ======================================================
 * The ONLY source of truth for income-tax slabs/deductions in this calculator.
 * Never hard-code tax rates in UI or engine code.
 *
 * VERIFIED 2026-08-19
 * --------------------
 * Budget 2083/84 (presented 15 Jestha 2083 / 29 May 2026) restructured
 * personal income tax for FY 2083/84, effective 1 Shrawan 2083
 * (approx. 17 July 2026), given legal force by the Finance Act 2083.
 *
 * KEY CHANGES:
 *   1. Single & couple schedules merged into one unified table.
 *   2. The 1% band doubled from NPR 500,000 to NPR 1,000,000.
 *      The first band is a 1% Social Security Tax (SST) — WAIVED for
 *      SSF / approved retirement-fund contributors (0%).
 *   3. Top marginal rate cut from 39% to 29% (27% + 2% surcharge above 4M).
 *
 * SOURCES:
 *   - Budget 2083/84 speech (Ministry of Finance, 29 May 2026)
 *   - Finance Act 2083 (gazetted) — must be confirmed against ird.gov.np
 *   - Multiple 2026 payroll/tax references (June–Aug 2026)
 *
 * STATUS: The slab structure is consistently reported across sources.
 * Direct verification against the gazetted Finance Act 2083 on ird.gov.np
 * was not available at verification time → needsVerification: true.
 *
 * DEDUCTIONS (carried forward under Income Tax Act 2058):
 *   - Retirement contributions (SSF + PF + CIT, employee AND employer shares
 *     combined into one pool): deductible up to the LOWER of
 *     (actual total, NPR 500,000, 1/3 of assessable income).
 *   - Life insurance premium: up to NPR 40,000/year.
 *   - Health insurance premium: up to NPR 20,000/year.
 *   - Remote area allowance: category A–E (50k/40k/30k/20k/10k).
 *
 * REBATES:
 *   - Female rebate: 10% of computed tax for a resident female with
 *     employment income ONLY (carried forward; confirm in Finance Act 2083).
 */

export const FY_2083_84 = {
  id: '2083/84',
  label: 'FY 2083/84 (2026/27)',
  bs: 'आ.व. २०८३/८४',
  effective: '1 Shrawan 2083 (≈ 17 July 2026)',
  lastVerified: '2026-08-19',
  needsVerification: true,
  verificationNote:
    'Slabs follow Budget/Finance Act 2083 as widely reported. Confirm the gazetted rates on ird.gov.np before relying on this for filing.',

  source: {
    name: 'Inland Revenue Department Nepal',
    url: 'https://ird.gov.np',
    budget: 'Budget 2083/84 (15 Jestha 2083)',
    act: 'Finance Act 2083, Income Tax Act 2058 (as amended)',
  },

  // Unified schedule — applies to every resident individual (single or couple)
  unified: true,

  slabs: [
    { min: 0, max: 1000000, rate: 0.01, type: 'sst', label: 'Social Security Tax' },
    { min: 1000001, max: 1500000, rate: 0.10, label: '10%' },
    { min: 1500001, max: 2500000, rate: 0.20, label: '20%' },
    { min: 2500001, max: 4000000, rate: 0.27, label: '27%' },
    { min: 4000001, max: null, rate: 0.29, label: '29% (27% + 2% surcharge)' },
  ],

  // First-slab Social Security Tax is waived for SSF / approved retirement
  // fund contributors (0% on the first NPR 1,000,000).
  sst: {
    rate: 0.01,
    waivedForSSF: true,
    waiverNote:
      'The 1% on the first NPR 1,000,000 is a Social Security Tax. It is waived for taxpayers enrolled in the SSF or an approved retirement fund.',
  },

  rebates: {
    female: {
      rate: 0.10,
      condition: 'Resident female earning ONLY from employment in Nepal',
      note: 'Carried forward from FY 2082/83; confirm in the gazetted Finance Act 2083.',
    },
  },

  deductions: {
    retirement: {
      label: 'Retirement fund contributions (SSF + PF + CIT)',
      combinedPool: true,
      includesEmployerShare: true,
      capAbsolute: 500000, // NPR per year
      capThirdOfIncome: 1 / 3,
      note: 'SSF, PF and CIT contributions are ONE combined deduction pool, capped at the lower of (actual total, NPR 500,000, 1/3 of assessable income).',
    },
    lifeInsurance: { max: 40000 },
    healthInsurance: { max: 20000 },
    remoteArea: {
      note: 'Remote area allowance deduction by posting category.',
      categories: { A: 50000, B: 40000, C: 30000, D: 20000, E: 10000 },
    },
  },

  // TDS on salary: the employer withholds the computed annual tax divided by
  // 12 each month. TDS is NOT a separate charge on top of income tax.
  tds: {
    mode: 'annual-tax-divided-by-12',
    note: 'Monthly TDS = computed annual income tax ÷ 12. TDS is the same liability as income tax, withheld monthly at source — never add them together.',
  },
};

/**
 * Compute income tax for FY 2083/84.
 * @param {number} annualTaxableIncome - annual taxable income after deductions
 * @param {object} opts
 * @param {boolean} opts.ssfEnrolled - waives the 1% SST on the first slab
 * @param {boolean} opts.female - applies the 10% female rebate
 * @param {object} rules - the FY rules object
 * @returns {object} { taxableIncome, totalTax, monthlyTax, slabs, rebate }
 */
export function calculateTax2083_84(annualTaxableIncome, { ssfEnrolled = false, female = false, rules = FY_2083_84 } = {}) {
  const income = Math.max(0, Number(annualTaxableIncome) || 0);
  if (income <= 0) {
    return { taxableIncome: 0, totalTax: 0, monthlyTax: 0, slabs: [], rebate: 0, sstWaiver: 0 };
  }

  let prev = 0;
  let totalTax = 0;
  const slabDetail = [];
  let sstWaiver = 0;

  for (const slab of rules.slabs) {
    const cap = slab.max == null ? Infinity : slab.max;
    if (income <= prev || prev >= cap) break;

    const bandAmount = Math.min(income, cap) - prev;
    let rate = slab.rate;

    // 1% SST waiver for SSF/retirement-fund contributors
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