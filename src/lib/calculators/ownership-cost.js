/**
 * Bike & Car Ownership Cost — Calculation Engine
 * =============================================
 * Pure functions (no DOM). All amounts are user-entered; there are no
 * hidden market prices. Blank/invalid optional fields are "not included",
 * never zero-filled guesses.
 *
 * Cash vs value loss are kept separate:
 * - monthlyCost / annualCost / totalCost are CASH spending only.
 * - depreciation is reported separately and only added in
 *   totalCostIncludingDepreciation (never in the monthly figure).
 *
 * Main entry:
 *   calculateOwnershipCost(input, years)
 *
 * Returns:
 *   { valid, errors, monthlyCost, annualCost, totalCost, fuelCost,
 *     maintenanceCost, insuranceCost, taxCost, renewalCost, parkingCost,
 *     loanCost, depreciation, costPerKm, runningCostPerKm, emi, loan,
 *     period, breakdown, warnings }
 *
 * @module ownership-cost
 */

import { OWNERSHIP_LABELS } from '../../data/vehicle/ownership-cost.js';

export const MAX_AMOUNT = 1e10; // Rs. 1,000 crore safety ceiling
export const MAX_LOAN_MONTHS = 360;
export const MAX_KM = 1000000;

// ── Formatting (Nepal/Indian grouping) ──────────────────────────

/** 221400 -> "Rs. 2,21,400" (decimals only when actually fractional). */
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

/** Plain grouped number: 221400 -> "2,21,400". */
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

const round2 = (n) => Math.round(Number(n) * 100) / 100;

// ── Building blocks ─────────────────────────────────────────────

/**
 * EMI = P × r × (1+r)^n / ((1+r)^n − 1), r = monthly rate.
 * Zero interest → straight P ÷ n. Returns rounded rupees.
 */
export function calculateEMI(principal, annualRatePct, months) {
  const P = sanitizeAmount(principal);
  const n = Math.floor(Number(months)) || 0;
  const rate = Number(annualRatePct);
  if (P <= 0 || n <= 0) return { emi: 0, totalPayment: 0, totalInterest: 0, principal: P, months: n };
  if (!Number.isFinite(rate) || rate <= 0) {
    const emi = round2(P / n);
    return { emi, totalPayment: round2(emi * n), totalInterest: 0, principal: P, months: n };
  }
  const r = rate / 12 / 100;
  const factor = Math.pow(1 + r, n);
  const emi = round2((P * r * factor) / (factor - 1));
  const totalPayment = round2(emi * n);
  return { emi, totalPayment, totalInterest: round2(totalPayment - P), principal: P, months: n };
}

/** Total interest over the full loan term. */
export function calculateLoanInterest(principal, annualRatePct, months) {
  return calculateEMI(principal, annualRatePct, months).totalInterest;
}

/**
 * Monthly fuel cost (petrol/diesel):
 *   monthlyKm ÷ mileage(km/L) × fuelPrice
 */
export function calculateFuelCost({ monthlyKm = 0, mileage = 0, fuelPrice = 0 } = {}) {
  const km = Number(monthlyKm);
  const eff = Number(mileage);
  const price = sanitizeAmount(fuelPrice);
  if (!Number.isFinite(km) || km < 0 || !Number.isFinite(eff) || eff <= 0) return 0;
  return round2(((km / eff) * price));
}

/**
 * Monthly charging cost (electric):
 *   monthlyKm ÷ efficiency(km/kWh) × pricePerKwh
 */
export function calculateChargingCost({ monthlyKm = 0, kmPerKwh = 0, pricePerKwh = 0 } = {}) {
  const km = Number(monthlyKm);
  const eff = Number(kmPerKwh);
  const price = sanitizeAmount(pricePerKwh);
  if (!Number.isFinite(km) || km < 0 || !Number.isFinite(eff) || eff <= 0) return 0;
  return round2(((km / eff) * price));
}

/** Estimated loss in value: purchase − resale (never negative). */
export function calculateDepreciation(purchasePrice, resaleValue) {
  const buy = sanitizeAmount(purchasePrice);
  const sell = sanitizeAmount(resaleValue);
  return round2(Math.max(0, buy - sell));
}

/** Annual maintenance from Simple (one total) or Detailed (sum of parts). */
export function maintenanceAnnual(maintenance = {}) {
  if (maintenance.mode === 'detailed') {
    const d = maintenance.detailed || {};
    return round2(
      ['servicing', 'engineOil', 'tyres', 'battery', 'brakes', 'repairs', 'otherMaint']
        .reduce((s, k) => s + sanitizeAmount(d[k]), 0),
    );
  }
  return sanitizeAmount(maintenance.simpleAnnual);
}

// ── Validation (inline messages, never alert()) ─────────────────

/**
 * validateOwnershipInput(input) -> errors object keyed by input key.
 * Empty object means valid. Only user-facing problems are reported;
 * optional cost fields accept blank (= not included).
 */
export function validateOwnershipInput(input = {}) {
  const errors = {};
  const needPositive = (raw, key, message) => {
    const { value, error } = parseAmount(raw);
    if (error || value == null || value <= 0) errors[key] = error || message;
  };

  const km = parseAmount(input.monthlyKm);
  if (km.error || km.value == null || km.value <= 0) {
    errors.monthlyKm = km.error || 'Enter how far you drive in a month.';
  } else if (km.value > MAX_KM) {
    errors.monthlyKm = 'That distance looks too large.';
  }

  if (input.fuelType === 'electric') {
    needPositive(input.efficiency, 'efficiency', 'Enter electricity consumption greater than 0.');
    const p = parseAmount(input.energyPrice);
    if (p.error || (p.value != null && p.value < 0)) errors.energyPrice = p.error || 'Enter a valid electricity price.';
    if (p.value == null) errors.energyPrice = 'Enter your electricity price per kWh.';
  } else {
    needPositive(input.efficiency, 'efficiency', 'Enter a mileage greater than 0.');
    const p = parseAmount(input.energyPrice);
    if (p.error || (p.value != null && p.value < 0)) errors.energyPrice = p.error || 'Enter a valid fuel price.';
    if (p.value == null) errors.energyPrice = 'Enter your fuel price per litre.';
  }

  const loan = input.loan || {};
  if (loan.enabled) {
    needPositive(loan.amount, 'loanAmount', 'Enter the loan amount.');
    const rate = String(loan.annualRatePct ?? '').trim().replace(/,/g, '');
    if (rate === '' || !Number.isFinite(Number(rate))) {
      errors.loanRate = 'Enter the interest rate (0 if interest-free).';
    } else if (Number(rate) < 0 || Number(rate) > 100) {
      errors.loanRate = 'Enter an interest rate between 0 and 100.';
    }
    const months = Math.floor(Number(loan.months));
    if (!Number.isFinite(months) || months < 1) {
      errors.loanMonths = 'Enter a loan duration of at least 1 month.';
    } else if (months > MAX_LOAN_MONTHS) {
      errors.loanMonths = 'Loan duration looks too long (max 360 months).';
    }
  }

  const dep = input.depreciation || {};
  if (dep.enabled) {
    needPositive(dep.purchasePrice, 'purchasePrice', 'Enter the vehicle purchase price.');
    const re = parseAmount(dep.resaleValue);
    if (re.error) {
      errors.resaleValue = re.error;
    } else if (re.value == null) {
      errors.resaleValue = 'Enter the estimated resale value.';
    }
    const buy = sanitizeAmount(dep.purchasePrice);
    if (re.value != null && buy > 0 && re.value > buy) {
      errors.resaleValue = 'Resale value cannot exceed the purchase price.';
    }
  }

  // Optional cost fields: blank is fine, negatives are not.
  const checkNonNegative = (obj, key, label) => {
    if (obj == null) return;
    const { error } = parseAmount(obj[key]);
    if (error) errors[key] = label ? `${label} cannot be negative.` : 'Amount cannot be negative.';
  };
  const annual = input.annual || {};
  checkNonNegative(annual, 'tax', 'Vehicle tax');
  checkNonNegative(annual, 'insurance', 'Insurance');
  checkNonNegative(annual, 'renewal', 'Registration / renewal');
  checkNonNegative(annual, 'otherAnnual', 'Other annual costs');
  const rec = input.recurring || {};
  checkNonNegative(rec, 'parking', 'Parking');
  checkNonNegative(rec, 'tolls', 'Tolls');
  checkNonNegative(rec, 'washing', 'Washing');
  checkNonNegative(rec, 'accessories', 'Accessories');
  checkNonNegative(rec, 'otherMonthly', 'Other monthly costs');
  const maint = input.maintenance || {};
  if (maint.mode === 'detailed') {
    const d = maint.detailed || {};
    for (const k of ['servicing', 'engineOil', 'tyres', 'battery', 'brakes', 'repairs', 'otherMaint']) {
      checkNonNegative(d, k, 'Maintenance');
    }
  } else {
    checkNonNegative(maint, 'simpleAnnual', 'Maintenance');
  }

  return errors;
}

// ── Period totals ───────────────────────────────────────────────

/**
 * Total cash ownership cost over `years` years.
 * The loan is only counted while it is actually being paid
 * (min(loanMonths, periodMonths)) — never beyond its duration.
 */
export function calculateTotalOwnershipCost(parts, years = 5) {
  const Y = [1, 3, 5, 10].includes(Number(years)) ? Number(years) : 5;
  const M = Y * 12;
  const loanMonthsPaid = parts.loan.enabled ? Math.min(parts.loan.months, M) : 0;
  const loanPaid = round2(parts.emi * loanMonthsPaid);
  const fuelTotal = round2(parts.fuelMonthly * M);
  const recurringTotal = round2(parts.recurringMonthly * M);
  const annualTotal = round2(parts.annualCash * Y);
  const maintTotal = round2(parts.maintAnnual * Y);
  const totalCost = round2(loanPaid + fuelTotal + recurringTotal + annualTotal + maintTotal);
  const totalDistance = Math.round(parts.monthlyKm * M);
  return {
    years: Y,
    months: M,
    loanMonthsPaid,
    loanPaid,
    fuelTotal,
    recurringTotal,
    annualTotal,
    maintTotal,
    totalCost,
    monthlyAvg: M > 0 ? round2(totalCost / M) : 0,
    totalDistance,
    costPerKm: totalDistance > 0 ? round2(totalCost / totalDistance) : 0,
  };
}

// ── Main calculation ────────────────────────────────────────────

/**
 * calculateOwnershipCost(input, years = 5)
 *
 * input = {
 *   vehicleType?: 'bike'|'car',
 *   fuelType?: 'petrol'|'diesel'|'electric',
 *   monthlyKm, efficiency, energyPrice,
 *   loan?: { enabled, amount, annualRatePct, months },
 *   annual?: { tax, insurance, renewal, otherAnnual },
 *   maintenance?: { mode: 'simple'|'detailed', simpleAnnual, detailed: {...} },
 *   recurring?: { parking, tolls, washing, accessories, otherMonthly },
 *   depreciation?: { enabled, purchasePrice, resaleValue },
 * }
 */
export function calculateOwnershipCost(input = {}, years = 5) {
  const {
    vehicleType = 'bike',
    fuelType = 'petrol',
    monthlyKm = 0,
    efficiency = 0,
    energyPrice = 0,
    loan = {},
    annual = {},
    maintenance = {},
    recurring = {},
    depreciation = {},
  } = input;

  const errors = validateOwnershipInput(input);
  if (Object.keys(errors).length > 0) {
    return { valid: false, errors, warnings: [] };
  }

  const km = Number(String(monthlyKm).replace(/,/g, ''));
  const eff = Number(String(efficiency).replace(/,/g, ''));
  const price = sanitizeAmount(energyPrice);

  // Monthly energy cost
  const fuelMonthly = fuelType === 'electric'
    ? calculateChargingCost({ monthlyKm: km, kmPerKwh: eff, pricePerKwh: price })
    : calculateFuelCost({ monthlyKm: km, mileage: eff, fuelPrice: price });

  // Loan
  const loanOn = loan.enabled === true;
  const emiInfo = loanOn
    ? calculateEMI(loan.amount, loan.annualRatePct, loan.months)
    : { emi: 0, totalPayment: 0, totalInterest: 0, principal: 0, months: 0 };

  // Annual cash costs (excl. maintenance) + maintenance + monthly recurring
  const tax = sanitizeAmount(annual.tax);
  const insurance = sanitizeAmount(annual.insurance);
  const renewal = sanitizeAmount(annual.renewal);
  const otherAnnual = sanitizeAmount(annual.otherAnnual);
  const annualCash = round2(tax + insurance + renewal + otherAnnual);
  const maintAnnual = maintenanceAnnual(maintenance);

  const parking = sanitizeAmount(recurring.parking);
  const tolls = sanitizeAmount(recurring.tolls);
  const washing = sanitizeAmount(recurring.washing);
  const accessories = sanitizeAmount(recurring.accessories);
  const otherMonthly = sanitizeAmount(recurring.otherMonthly);
  const recurringMonthly = round2(parking + tolls + washing + accessories + otherMonthly);

  // Headline cash figures (depreciation NEVER included here)
  const monthlyCost = round2(emiInfo.emi + fuelMonthly + annualCash / 12 + maintAnnual / 12 + recurringMonthly);
  const annualCost = round2(monthlyCost * 12);
  const annualKm = Math.round(km * 12);
  const costPerKm = annualKm > 0 ? round2(annualCost / annualKm) : 0;
  const runningCostPerKm = km > 0 ? round2(fuelMonthly / km) : 0;

  // Period view (loan cut off at its real duration)
  const period = calculateTotalOwnershipCost(
    {
      loan: { enabled: loanOn, months: emiInfo.months },
      emi: emiInfo.emi,
      fuelMonthly,
      recurringMonthly,
      annualCash,
      maintAnnual,
      monthlyKm: km,
    },
    years,
  );

  // Depreciation (value loss, not cash)
  const depOn = depreciation.enabled === true;
  const depAmount = depOn ? calculateDepreciation(depreciation.purchasePrice, depreciation.resaleValue) : 0;

  // Monthly breakdown with annual + share of total
  const rows = [
    { id: 'fuel', amount: fuelMonthly },
    { id: 'loan', amount: emiInfo.emi },
    { id: 'maintenance', amount: round2(maintAnnual / 12) },
    { id: 'insurance', amount: round2(insurance / 12) },
    { id: 'taxRenewal', amount: round2((tax + renewal) / 12) },
    { id: 'parking', amount: parking },
    { id: 'other', amount: round2(tolls + washing + accessories + otherMonthly + otherAnnual / 12) },
  ];
  const breakdown = rows
    .filter((r) => r.amount > 0)
    .map((r) => ({
      id: r.id,
      name: OWNERSHIP_LABELS[r.id] || r.id,
      monthly: r.amount,
      annual: round2(r.amount * 12),
      pct: monthlyCost > 0 ? round2((r.amount / monthlyCost) * 100) : 0,
    }))
    .sort((a, b) => b.monthly - a.monthly);

  const warnings = [];
  if (price === 0) {
    warnings.push(
      fuelType === 'electric'
        ? 'Electricity price is Rs. 0 — charging is counted as free.'
        : 'Fuel price is Rs. 0 — fuel is counted as free.',
    );
  }

  return {
    valid: true,
    errors: {},
    vehicleType,
    fuelType,
    // Headline cash figures
    monthlyCost,
    annualCost,
    costPerKm,
    runningCostPerKm,
    // Spec-shaped aliases
    totalCost: period.totalCost,
    fuelCost: fuelMonthly,
    maintenanceCost: round2(maintAnnual / 12),
    insuranceCost: round2(insurance / 12),
    taxCost: round2(tax / 12),
    renewalCost: round2(renewal / 12),
    parkingCost: parking,
    loanCost: emiInfo.emi,
    depreciation: depAmount,
    totalCostIncludingDepreciation: round2(period.totalCost + depAmount),
    // Detail
    emi: emiInfo,
    loan: {
      enabled: loanOn,
      principal: emiInfo.principal,
      annualRatePct: loanOn ? Number(loan.annualRatePct) : 0,
      months: emiInfo.months,
      monthsPaidInPeriod: period.loanMonthsPaid,
      paidInPeriod: period.loanPaid,
    },
    period,
    annualKm,
    monthlyKm: km,
    breakdown,
    warnings,
  };
}

/** Annual / monthly cash cost helpers (used by the UI + tests). */
export function calculateMonthlyOwnershipCost(input = {}) {
  const r = calculateOwnershipCost(input, 1);
  if (!r.valid) return r;
  return { valid: true, errors: {}, monthlyCost: r.monthlyCost, breakdown: r.breakdown };
}

export function calculateAnnualOwnershipCost(input = {}) {
  const r = calculateOwnershipCost(input, 1);
  if (!r.valid) return r;
  return { valid: true, errors: {}, annualCost: r.annualCost, annualKm: r.annualKm };
}

/** Total ownership cost per km for a period (cash only, excl. depreciation). */
export function calculateCostPerKm(input = {}, years = 5) {
  const r = calculateOwnershipCost(input, years);
  if (!r.valid) return r;
  return { valid: true, errors: {}, costPerKm: r.period.costPerKm, runningCostPerKm: r.runningCostPerKm };
}

/**
 * Compact summary for the A-vs-B comparison panel:
 * { monthly, annual, perKm, runningPerKm, fiveYear, fiveYearWithDep }
 */
export function summarizeOwnership(input = {}) {
  const r = calculateOwnershipCost(input, 5);
  if (!r.valid) return r;
  return {
    valid: true,
    errors: {},
    monthly: r.monthlyCost,
    annual: r.annualCost,
    perKm: r.costPerKm,
    runningPerKm: r.runningCostPerKm,
    fiveYear: r.period.totalCost,
    fiveYearWithDep: round2(r.period.totalCost + r.depreciation),
  };
}

/** Blank calculator state (used by Reset + tests). */
export function defaultOwnershipState() {
  return {
    vehicleType: 'bike',
    fuelType: 'petrol',
    monthlyKm: '',
    efficiency: '',
    energyPrice: '',
    loan: { enabled: false, amount: '', annualRatePct: '', months: '' },
    annual: { tax: '', insurance: '', renewal: '', otherAnnual: '' },
    maintenance: { mode: 'simple', simpleAnnual: '', detailed: {} },
    recurring: { parking: '', tolls: '', washing: '', accessories: '', otherMonthly: '' },
    depreciation: { enabled: false, purchasePrice: '', resaleValue: '' },
  };
}
