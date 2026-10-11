/**
 * Nepal Vehicle Tax & Bluebook Calculator Engine
 * ================================================
 * Calculates estimated vehicle renewal cost with a per-year breakdown.
 *
 * Core user problem: "My vehicle has not been renewed for several years.
 * How much will I have to pay to renew it now?"
 *
 * MODEL:
 *   - Annual vehicle tax is looked up from VEHICLE_TAX_DATA
 *     (province → fiscal year → category → CC/kW/W slabs).
 *   - ARREARS are computed PER YEAR, not as current-rate × years. Each
 *     outstanding fiscal year (from lastPaidFY+1 through currentFY) is
 *     itemized with its own tax and its own late fine.
 *   - Late fine (Bagmati Vehicle & Transport Management Act 2075 §176):
 *       • current FY: 5% (first 30 days), 10% (days 31–75), 20% (76+ days),
 *         or 0% if on time by Ashadh end.
 *       • fully elapsed FYs: 32% per overdue year, up to maxFineYears (5).
 *   - Renewal fee (Rs 300 two-wheeler / Rs 500 four-wheeler) and third-party
 *     insurance are separate line items. Insurance is never fined.
 *
 * SOURCES: see src/data/nepal/vehicle/vehicle-tax-data.js
 *
 * LAST UPDATED: 2026-08-19
 */

import { getProvince, getDefaultProvince } from '../../data/nepal/vehicle/provinces.js';
import {
  getProvinceTaxData,
  resolveSlabTable,
  findSlab,
  CURRENT_FY,
  CURRENT_FISCAL_YEAR,
} from '../../data/nepal/vehicle/vehicle-tax-data.js';
import { POLLUTION_CHARGES, getThirdPartyInsuranceEstimate } from '../../data/nepal/vehicle/fees.js';

/**
 * Late-status → fine percent applied to the CURRENT fiscal year's tax.
 * Key: UI value. Percent: fine on the current FY tax.
 */
export const LATE_STATUS_OPTIONS = {
  ontime: { percent: 0, label: 'On time — no fine' },
  '1-30': { percent: 0.05, label: '1–30 days late · 5%' },
  '31-45': { percent: 0.1, label: '31–45 days late · 10%' },
  '46-plus': { percent: 0.2, label: 'Same fiscal year · 20%' },
  '1-year-late': { percent: 0.32, label: '1 year late · 32%' },
  '2-years-late': { percent: 0.64, label: '2 years late · 64%' },
  '3-years-late': { percent: 0.96, label: '3 years late · 96%' },
};

/**
 * Calculate complete vehicle renewal cost with a per-year breakdown.
 *
 * @param {Object} input
 * @param {string} input.provinceId - Province ID (e.g. "bagmati")
 * @param {string} input.category - Vehicle category ("motorcycle", "car")
 * @param {string} input.fuelType - Fuel type ("petrol", "diesel", "electric", "hybrid")
 * @param {number} input.value - Engine cc (combustion) / watts (EV bike) / kW (EV car)
 * @param {number} [input.cc] - Alias for value (kept for callers using cc)
 * @param {number} input.lastPaidFY - Fiscal year for which tax was LAST paid
 *        (e.g. 2082 = FY 2082/83 already paid → only FY 2083/84 is due)
 * @param {number} [input.currentFY] - Defaults to 2083
 * @param {string} [input.lateStatus] - 'ontime' | '1-30' | '31-45' | '46-plus'
 * @param {boolean} [input.includeInsurance]
 * @param {number} [input.insuranceAmount] - Manual insurance override
 * @param {boolean} [input.includeOtherCharges] - Pollution/service charges
 * @returns {Object} Complete cost breakdown
 */
export function calculateVehicleRenewal({
  provinceId = 'bagmati',
  category = 'motorcycle',
  fuelType = 'petrol',
  value,
  cc,
  lastPaidFY = CURRENT_FY,
  currentFY = CURRENT_FY,
  lateStatus = 'ontime',
  includeInsurance = true,
  insuranceAmount = null,
  includeOtherCharges = true,
}) {
  const val = value ?? cc;
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    throw new Error('Vehicle tax calculator requires a numeric engine value (cc / W / kW).');
  }
  if (val < 0) {
    throw new Error(`Invalid engine value: ${val}. It must be a positive number.`);
  }

  const province = getProvince(provinceId) || getDefaultProvince();
  const fiscalYearKey = `${currentFY}/${String(currentFY + 1).slice(-2)}`;
  const record = getProvinceTaxData(province.id, fiscalYearKey);
  if (!record) {
    throw new Error(`No vehicle tax data for ${province.label} in FY ${fiscalYearKey}.`);
  }

  const resolved = resolveSlabTable(category, fuelType, record);
  if (!resolved) {
    throw new Error(`Unsupported combination: category "${category}" + fuel "${fuelType}".`);
  }

  const slab = findSlab(val, resolved.table.slabs);
  if (!slab) {
    throw new Error(`Engine value ${val}${resolved.unit} is below the lowest tax slab.`);
  }

  const annualTax = slab.annualTax;

  // === ARREARS: itemize every outstanding fiscal year ===
  const lastPaid = Number(lastPaidFY);
  if (!Number.isFinite(lastPaid)) {
    throw new Error('Invalid lastPaidFY value.');
  }
  if (lastPaid > currentFY) {
    throw new Error('lastPaidFY cannot be in the future.');
  }

  const status = LATE_STATUS_OPTIONS[lateStatus] || LATE_STATUS_OPTIONS.ontime;
  const lateConfig = record.lateFine;
  const perYearRate = lateConfig.perYearLate;
  const maxFineYears = lateConfig.maxFineYears;

  const yearBreakdown = [];
  let totalTax = 0;
  let totalPenalty = 0;
  let capApplied = false;

  for (let fy = lastPaid + 1; fy <= currentFY; fy++) {
    const isCurrentYear = fy === currentFY;
    const yearsLate = currentFY - fy;

    let penaltyRate = 0;
    let penaltyLabel = '';

    if (isCurrentYear) {
      penaltyRate = status.percent;
      penaltyLabel = status.label;
    } else {
      if (yearsLate <= maxFineYears) {
        penaltyRate = perYearRate;
        penaltyLabel = `${Math.round(perYearRate * 100)}% (FY overdue ${yearsLate} yr)`;
      } else {
        capApplied = true;
        penaltyLabel = `fine capped at ${maxFineYears} yrs`;
      }
    }

    const penaltyAmount = Math.round(annualTax * penaltyRate);
    const yearTotal = annualTax + penaltyAmount;
    totalTax += annualTax;
    totalPenalty += penaltyAmount;

    yearBreakdown.push({
      fiscalYear: fy,
      fiscalYearLabel: `${fy}/${fy + 1}`,
      isCurrentYear,
      yearsLate,
      annualTax,
      penaltyRate,
      penaltyPercent: Math.round(penaltyRate * 100),
      penaltyAmount,
      penaltyLabel,
      yearTotal,
    });
  }

  // === RENEWAL FEE (separate from tax) ===
  const renewalKey = resolved.key === 'evBike' || resolved.key === 'motorcycle' ? 'twoWheeler' : 'fourWheeler';
  const renewalFee = record.renewalFee[renewalKey];

  // === OTHER CHARGES (pollution/service — optional) ===
  const otherCharges = includeOtherCharges
    ? {
        serviceCharge: POLLUTION_CHARGES.serviceCharge,
        emissionTest: POLLUTION_CHARGES.emissionTest,
        pollutionSticker: POLLUTION_CHARGES.pollutionSticker,
        needsVerification: POLLUTION_CHARGES.needsVerification,
      }
    : { serviceCharge: 0, emissionTest: 0, pollutionSticker: 0, needsVerification: false };
  const otherChargesTotal = otherCharges.serviceCharge + otherCharges.emissionTest + otherCharges.pollutionSticker;

  // === INSURANCE (separate, never fined) ===
  const insuranceCat = resolved.key === 'evBike' ? 'motorcycle' : resolved.key === 'evCar' ? 'car' : category;
  let insuranceEstimate;
  let insuranceManual = false;
  if (typeof insuranceAmount === 'number' && Number.isFinite(insuranceAmount) && insuranceAmount > 0) {
    insuranceEstimate = insuranceAmount;
    insuranceManual = true;
  } else {
    insuranceEstimate = getThirdPartyInsuranceEstimate(insuranceCat, val, resolved.unit).amount;
  }

  // === TOTALS ===
  const subtotal = totalTax + totalPenalty + renewalFee + otherChargesTotal;
  const totalWithInsurance = subtotal + (includeInsurance ? insuranceEstimate : 0);

  return {
    input: {
      provinceId: province.id,
      provinceLabel: province.label,
      provinceDataStatus: province.dataStatus || 'estimate',
      fiscalYear: fiscalYearKey,
      category,
      categoryLabel: category === 'motorcycle' ? 'Motorcycle / Scooter' : 'Private Car / Jeep',
      fuelType,
      fuelLabel: resolved.label,
      value: val,
      unit: resolved.unit,
      slabLabel: slab.label,
      lastPaidFY: lastPaid,
      yearsDue: yearBreakdown.length,
      lateStatus: lateStatus in LATE_STATUS_OPTIONS ? lateStatus : 'ontime',
      includeInsurance,
      estimate: !record.verified || resolved.estimate,
    },

    yearBreakdown,

    annualTax,
    totalTax,
    totalPenalty,

    fees: {
      renewalFee,
      renewalFeeKey: renewalKey,
      otherCharges,
      otherChargesTotal,
      total: renewalFee + otherChargesTotal,
    },

    insurance: {
      thirdPartyEstimate: insuranceEstimate,
      included: includeInsurance,
      manual: insuranceManual,
      estimate: true, // premiums vary by insurer; exact amount is not a fixed rate
      note: 'Third-party liability insurance estimate (mandatory). Rates vary by insurer — enter your actual premium for a precise total.',
    },

    subtotal,
    totalWithInsurance,

    meta: {
      lastUpdated: '2026-08-19',
      source: record.source,
      dataStatus: record.dataStatus,
      verified: record.verified,
      needsVerification: !record.verified || resolved.estimate,
      notes: record.notes || [],
      capApplied,
    },
  };
}

/**
 * Format NPR currency
 * @param {number} amount
 * @returns {string}
 */
export function formatNPR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with commas
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(Math.round(num));
}