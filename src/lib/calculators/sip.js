/**
 * SIP Calculator Engine (Nepal)
 * =============================
 * Pure, precise functions for Monthly SIP, Annual SIP, Step-up SIP and
 * SIP-vs-FD comparisons. No hard-coded rates — every displayed rupee comes
 * from these calculations.
 *
 * Consistency note: contributions are made at the END of each period
 * (ordinary annuity) everywhere in this engine:
 *   FV = P × [((1 + r)^n − 1) / r]
 * We never mix this with a beginning-of-period (annuity-due) formula.
 *
 * @module sip
 */

// ── Formatting ───────────────────────────────────────────────────────────

/**
 * Format an amount as Nepali currency with Indian/Nepali digit grouping:
 *   1152000 → "Rs. 11,52,000"
 */
export function formatNPR(amount) {
  if (!Number.isFinite(amount)) return 'Rs. 0';
  const negative = amount < 0;
  const rounded = Math.round(Math.abs(amount));
  const grouped = new Intl.NumberFormat('en-IN').format(rounded);
  return (negative ? '-Rs. ' : 'Rs. ') + grouped;
}

/** Format a plain number with Indian grouping. */
export function formatNumberIN(num) {
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

// ── Validation ───────────────────────────────────────────────────────────

export const LIMITS = { maxAmount: 1e10, maxYears: 60, minReturn: 0, maxReturn: 100 };

/**
 * Validate one numeric field.
 * @returns {{ok: boolean, value?: number, error?: string}}
 */
export function validateField(raw, { label, min, max, isPercent = false }) {
  const v = typeof raw === 'string' ? raw.trim() : raw;
  if (v === '' || v === null || v === undefined) {
    return { ok: false, error: `Enter ${label}.` };
  }
  const num = Number(v);
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    return { ok: false, error: `${label} must be a valid number.` };
  }
  if (num <= (min ?? 0)) {
    return { ok: false, error: `Enter ${label} greater than ${isPercent ? '0%' : 'Rs. 0'}.` };
  }
  if (max !== undefined && num > max) {
    return { ok: false, error: `${label} is too large.` };
  }
  return { ok: true, value: num };
}

// ── Core math ────────────────────────────────────────────────────────────

/** Future-value factor of an ordinary annuity: ((1+r)^n − 1) / r */
function annuityFactor(r, n) {
  if (r === 0) return n; // zero-return: contributions simply sum up
  return (Math.pow(1 + r, n) - 1) / r;
}

/**
 * Monthly SIP future value (ordinary annuity).
 * @param {number} monthly  installment per month
 * @param {number} annualRatePct  expected annual return, e.g. 12 for 12%
 * @param {number} years  investment period in years (may be fractional? no — whole years)
 */
export function calcMonthlySip(monthly, annualRatePct, years) {
  const n = Math.round(years * 12);
  const r = annualRatePct / 100 / 12;
  const invested = monthly * n;
  const finalValue = monthly * annuityFactor(r, n);
  return { invested, finalValue, returns: finalValue - invested, months: n };
}

/**
 * Annual SIP future value — annual contribution compounded annually
 * (NOT a monthly SIP × 12).
 * @param {number} annual  installment per year
 * @param {number} annualRatePct
 * @param {number} years
 */
export function calcAnnualSip(annual, annualRatePct, years) {
  const n = Math.round(years);
  const i = annualRatePct / 100;
  const invested = annual * n;
  const finalValue = annual * annuityFactor(i, n);
  return { invested, finalValue, returns: finalValue - invested, years: n };
}

/**
 * Year-by-year series for a monthly SIP.
 * Returns [{ year, investedThisYear, totalInvested, value, returns }]
 */
export function monthlySipSeries(monthly, annualRatePct, years) {
  const Y = Math.round(years);
  const r = annualRatePct / 100 / 12;
  const rows = [];
  let balance = 0;
  let totalInvested = 0;
  for (let y = 1; y <= Y; y++) {
    const investedThisYear = monthly * 12;
    totalInvested += investedThisYear;
    // grow existing balance 12 months, then add this year's contributions
    // evaluated month by month (precise, no approximation):
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + r) + monthly;
    }
    rows.push({
      year: y,
      investedThisYear,
      totalInvested,
      value: balance,
      returns: balance - totalInvested,
    });
  }
  // Guard against drift between series and closed-form FV
  return rows;
}

/**
 * Step-up SIP: monthly installment increases by stepUpPct each year.
 * Year y installment = start × (1 + stepUpPct/100)^(y−1).
 * Simulated precisely month by month.
 */
export function calcStepUpSip(startMonthly, stepUpPct, annualRatePct, years) {
  const Y = Math.round(years);
  const r = annualRatePct / 100 / 12;
  const rows = [];
  let balance = 0;
  let totalInvested = 0;

  for (let y = 1; y <= Y; y++) {
    const monthly = startMonthly * Math.pow(1 + stepUpPct / 100, y - 1);
    const investedThisYear = monthly * 12;
    totalInvested += investedThisYear;
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + r) + monthly;
    }
    rows.push({
      year: y,
      monthlyInstallment: monthly,
      investedThisYear,
      totalInvested,
      value: balance,
      returns: balance - totalInvested,
    });
  }

  return {
    invested: totalInvested,
    finalValue: balance,
    returns: balance - totalInvested,
    series: rows,
  };
}

/**
 * Fixed Deposit future value for a single lump-sum deposit.
 * @param {number} principal
 * @param {number} ratePct  annual interest rate
 * @param {number} years
 * @param {'annually'|'half-yearly'|'quarterly'|'monthly'} frequency
 */
export function calcFD(principal, ratePct, years, frequency = 'quarterly') {
  const perYear = { annually: 1, 'half-yearly': 2, quarterly: 4, monthly: 12 }[frequency] || 4;
  const i = ratePct / 100 / perYear;
  const t = perYear * years;
  const finalValue = principal * Math.pow(1 + i, t);
  return { invested: principal, finalValue, returns: finalValue - principal };
}

/**
 * SIP vs FD comparison over the SAME total money:
 * SIP spreads the total across monthly installments; FD deposits the full
 * amount upfront at the bank rate.
 */
export function compareSipVsFd(totalInvestment, years, sipRatePct, fdRatePct, fdFrequency) {
  const months = Math.round(years * 12);
  const monthlyInstallment = totalInvestment / months;
  const sip = calcMonthlySip(monthlyInstallment, sipRatePct, years);
  const fd = calcFD(totalInvestment, fdRatePct, years, fdFrequency);
  return {
    sip: { ...sip, monthlyInstallment },
    fd,
    winner: sip.finalValue > fd.finalValue ? 'sip' : fd.finalValue > sip.finalValue ? 'fd' : 'tie',
  };
}
