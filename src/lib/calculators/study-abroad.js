/**
 * Study Abroad Total Cost — Pure calculation engine (Nepal)
 * =========================================================
 * Deterministic, no DOM. Every expense carries amount + currency +
 * frequency, normalized to NPR, then scaled by study duration.
 *
 * Frequency math (years may be fractional, e.g. 1.5):
 *   monthly → amount × months   (months = years × 12)
 *   annual  → amount × years
 *   semester → amount × semesters (semesters = years × 2)
 *   onetime → amount (counted once, never scaled)
 *
 * @module study-abroad
 */

import { LIMITS } from '../../data/study-abroad.js';

export function sanitizeAmount(v) {
  if (v == null || String(v).trim() === '') return 0;
  const n = Number(String(v).replace(/,/g, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, LIMITS.maxAmount);
}

export function formatNPR(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'Rs 0';
  const sign = v < 0 ? '-' : '';
  return `${sign}Rs ${new Intl.NumberFormat('en-IN').format(Math.abs(Math.round(v)))}`;
}

/** Foreign amount with code grouping (en-US): AUD 35,000 */
export function formatForeign(n, code) {
  const v = Number(n) || 0;
  const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(v));
  return code && code !== 'NPR' ? `${code} ${grouped}` : `Rs ${new Intl.NumberFormat('en-IN').format(Math.round(v))}`;
}

export const FREQ_LABEL = { monthly: 'mo', annual: 'yr', semester: 'sem', onetime: 'one-time' };
export const FREQ_COUNT_UNIT = { monthly: 'mo', annual: 'yrs', semester: 'sem', onetime: '×' };

/** How many billing periods of this frequency fit the duration. */
export function freqCount(freq, years) {
  const y = Math.max(0, Number(years) || 0);
  if (freq === 'monthly') return y * 12;
  if (freq === 'annual') return y;
  if (freq === 'semester') return y * 2;
  return 1; // onetime
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * @param {object} p
 * @param {number} p.rate  NPR per 1 foreign unit
 * @param {string} p.currency  foreign currency code
 * @param {number} p.durationYears  may be fractional (e.g. 1.5)
 */
export function calcStudyAbroad({
  rate = 0,
  currency = 'USD',
  tuitionF = 0,
  tuitionFreq = 'annual',
  scholarshipMode = 'none', // none | pct | fixed
  scholarshipVal = 0,
  durationYears = 0,
  applications = 0,
  appFeeF = 0,
  testCostF = 0,
  depositF = 0,
  depositInTuition = false,
  visaFeeF = 0,
  biometricNPR = 0,
  immigrationNPR = 0,
  otherMandatoryNPR = 0,
  medicalNPR = 0,
  docsNPR = 0,
  flightInitialNPR = 0,
  flightReturnNPR = 0,
  localTransportNPR = 0,
  localTransportFreq = 'onetime',
  insuranceAmt = 0,
  insuranceUnit = 'annual', // monthly | annual | onetime
  insuranceForeign = true,
  living = {}, // key -> {amountF, freq}
  setupAmt = 0,
  setupForeign = true,
  otherCostsNPR = 0,
  funding = {}, // {savings, loan, scholarship, sponsor} NPR
} = {}) {
  const r = Number(rate) || 0;
  const code = currency || 'USD';
  const yrs = Math.max(0, Math.min(LIMITS.maxYears, Number(durationYears) || 0));
  const months = round2(yrs * 12);
  const semesters = round2(yrs * 2);
  const fx = (f) => sanitizeAmount(f) * r;
  const np = (v) => sanitizeAmount(v);
  const scale = (freq) => {
    if (freq === 'monthly') return months;
    if (freq === 'annual') return yrs;
    if (freq === 'semester') return semesters;
    return 1;
  };
  const LIVING_LABELS = {
    rent: 'Accommodation', food: 'Food', transport: 'Transportation',
    phone: 'Phone & internet', utilities: 'Utilities',
    personal: 'Personal', other: 'Other living',
  };

  // ── Tuition ──
  const tuitionPerF = sanitizeAmount(tuitionF);
  const tuitionTotal = tuitionPerF * r * scale(tuitionFreq);
  let discount = 0;
  if (scholarshipMode === 'pct') {
    const pct = Math.max(0, Math.min(100, Number(scholarshipVal) || 0));
    discount = (tuitionTotal * pct) / 100;
  } else if (scholarshipMode === 'fixed') {
    discount = Math.min(tuitionTotal, fx(scholarshipVal));
  }

  // ── Living (per-category frequency) ──
  const livingLines = Object.entries(LIVING_LABELS).map(([key, label]) => {
    const e = living[key] || { amount: 0, freq: 'monthly' };
    const freq = ['monthly', 'annual'].includes(e.freq) ? e.freq : 'monthly';
    const perF = sanitizeAmount(e.amount);
    const per = perF * r;
    return { key, label, freq, perF, per, count: scale(freq), total: per * scale(freq) };
  });
  const livingTotal = livingLines.reduce((s, l) => s + l.total, 0);

  // ── Visa & immigration (all one-time) ──
  const visaLines = [
    { label: 'Visa fee', perF: sanitizeAmount(visaFeeF), per: fx(visaFeeF) },
    { label: 'Biometrics', perF: 0, per: np(biometricNPR) },
    { label: 'Immigration / permit', perF: 0, per: np(immigrationNPR) },
    { label: 'Other mandatory fees', perF: 0, per: np(otherMandatoryNPR) },
  ].map((x) => ({ ...x, freq: 'onetime', count: 1, total: x.per }));
  const visaTotal = visaLines.reduce((s, l) => s + l.total, 0);

  // ── Travel ──
  const localPer = np(localTransportNPR);
  const travelLines = [
    { label: 'Initial flight', freq: 'onetime', perF: 0, per: np(flightInitialNPR), count: 1, total: np(flightInitialNPR) },
    { label: 'Return flight', freq: 'onetime', perF: 0, per: np(flightReturnNPR), count: 1, total: np(flightReturnNPR) },
    { label: 'Local transport', freq: localTransportFreq === 'monthly' ? 'monthly' : 'onetime', perF: 0, per: localPer, count: scale(localTransportFreq === 'monthly' ? 'monthly' : 'onetime'), total: localPer * scale(localTransportFreq === 'monthly' ? 'monthly' : 'onetime') },
  ];
  const travelTotal = travelLines.reduce((s, l) => s + l.total, 0);

  // ── Other one-time ──
  const appN = Math.max(0, Math.floor(Number(applications) || 0));
  const depositCounted = depositInTuition ? 0 : fx(depositF);
  const setupPer = setupForeign ? fx(setupAmt) : np(setupAmt);
  const otherLines = [
    { label: 'Application fees', freq: 'onetime', perF: sanitizeAmount(appFeeF), per: 0, count: 1, total: appN * fx(appFeeF), appCount: appN },
    { label: 'English test', freq: 'onetime', perF: sanitizeAmount(testCostF), per: fx(testCostF), count: 1, total: fx(testCostF) },
    { label: 'University deposit', freq: 'onetime', perF: 0, per: depositCounted, count: 1, total: depositCounted, skipped: depositInTuition && fx(depositF) > 0 },
    { label: 'Documents', freq: 'onetime', perF: 0, per: np(docsNPR), count: 1, total: np(docsNPR) },
    { label: 'Medical', freq: 'onetime', perF: 0, per: np(medicalNPR), count: 1, total: np(medicalNPR) },
    { label: 'Initial setup', freq: 'onetime', perF: 0, per: setupPer, count: 1, total: setupPer },
    { label: 'Other costs', freq: 'onetime', perF: 0, per: np(otherCostsNPR), count: 1, total: np(otherCostsNPR) },
  ];
  const otherTotal = otherLines.reduce((s, l) => s + l.total, 0);

  // ── Insurance ──
  const insRaw = sanitizeAmount(insuranceAmt);
  const insPer = insuranceForeign ? insRaw * r : insRaw;
  const insFreq = ['monthly', 'annual', 'onetime'].includes(insuranceUnit) ? insuranceUnit : 'annual';
  const insTotal = insPer * scale(insFreq);
  const insFirstYear = insFreq === 'monthly' ? insPer * 12 : insPer;

  // ── Grand total ──
  const netTuition = Math.max(0, tuitionTotal - discount);
  const total = netTuition + livingTotal + visaTotal + travelTotal + otherTotal + insTotal;

  // ── Before flying: cash needed prior to departure ──
  const beforeFlyingTotal =
    depositCounted + visaLines.reduce((s, l) => s + l.total, 0) +
    np(medicalNPR) + np(docsNPR) + appN * fx(appFeeF) + fx(testCostF) +
    np(flightInitialNPR) + setupPer + insFirstYear;

  // ── Funding ──
  const fund = {
    savings: np(funding.savings), loan: np(funding.loan),
    scholarship: np(funding.scholarship), sponsor: np(funding.sponsor),
  };
  const fundingTotal = fund.savings + fund.loan + fund.scholarship + fund.sponsor;
  const gap = total - fundingTotal;

  // ── One-time vs recurring split ──
  const oneTimeList = [
    ...visaLines.map((l) => ({ label: l.label, amount: l.total })),
    { label: 'Application', amount: appN * fx(appFeeF) },
    { label: 'English test', amount: fx(testCostF) },
    { label: 'Flight (initial)', amount: np(flightInitialNPR) },
    { label: 'Flight (return)', amount: np(flightReturnNPR) },
    { label: 'Initial setup', amount: setupPer },
    { label: 'University deposit', amount: depositCounted },
    { label: 'Documents', amount: np(docsNPR) },
    { label: 'Medical', amount: np(medicalNPR) },
    { label: 'Other costs', amount: np(otherCostsNPR) },
    ...(insFreq === 'onetime' ? [{ label: 'Insurance', amount: insTotal }] : []),
    ...(travelLines[2].freq === 'onetime' ? [{ label: 'Local transport', amount: travelLines[2].total }] : []),
  ].filter((x) => x.amount > 0);
  const recurringList = [
    { label: `Tuition (${tuitionFreq})`, amount: tuitionTotal },
    ...livingLines.filter((l) => l.total > 0).map((l) => ({ label: `${l.label} (${l.freq})`, amount: l.total })),
    ...(insFreq !== 'onetime' && insTotal > 0 ? [{ label: `Insurance (${insFreq})`, amount: insTotal }] : []),
    ...(travelLines[2].freq === 'monthly' && travelLines[2].total > 0 ? [{ label: 'Local transport (monthly)', amount: travelLines[2].total }] : []),
  ];

  const tuitionCount = scale(tuitionFreq);
  const tlines = [
    { label: 'Tuition', freq: tuitionFreq, perF: tuitionPerF, per: tuitionPerF * r, count: tuitionCount, total: tuitionTotal },
    ...livingLines,
    ...visaLines,
    ...travelLines.map((l) => ({ ...l, perF: 0 })),
    { label: 'Insurance', freq: insFreq, perF: insuranceForeign ? insRaw : 0, per: insPer, count: scale(insFreq), total: insTotal },
    ...otherLines.map((l) => ({ ...l, perF: l.perF || 0 })),
  ];

  return {
    inputs: { rate: r, currency: code, months, years: yrs, semesters, tuitionFreq },
    tuition: { perF: tuitionPerF, per: tuitionPerF * r, freq: tuitionFreq, count: scale(tuitionFreq), total: tuitionTotal, discount, net: netTuition },
    livingLines, livingTotal,
    monthlyLiving: months > 0 ? livingTotal / months : 0,
    visaLines, visaTotal,
    travelLines, travelTotal,
    otherLines, otherTotal,
    insurance: { per: insPer, perF: insuranceForeign ? insRaw : 0, freq: insFreq, count: scale(insFreq), total: insTotal },
    setupTotal: setupPer,
    netTuition, total,
    beforeFlying: beforeFlyingTotal,
    fundingTotal, fund, gap,
    oneTimeList, recurringList, tlines,
    perYear: yrs > 0 ? total / yrs : 0,
    warnings: [],
  };
}
