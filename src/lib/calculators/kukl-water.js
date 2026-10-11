/**
 * KUKL Water Bill Calculator Engine
 * ====================================
 * Calculates estimated KUKL water bills based on metered tariff.
 *
 * Supports:
 * - Meter reading input (previous → current)
 * - Manual consumption input (direct m³)
 * - Multiple customer categories (household, business, institution, industry)
 * - Pipe size selection (if applicable to category)
 * - Slab-by-slab water charge breakdown
 * - Service/minimum charges
 * - Sewerage charges
 *
 * MEASUREMENT UNIT:
 * - KUKL meters use m³ (cubic meters)
 * - 1 m³ = 1,000 litres
 *
 * LAST UPDATED: 2026-08-19
 */

import {
  getDefaultTariff,
  CUSTOMER_CATEGORIES,
  PIPE_SIZES,
  isPipeSizeRequired,
  LITRES_PER_UNIT,
} from '../../data/nepal/water/kukl-tariffs.js';

/**
 * Calculate KUKL water bill with full breakdown
 *
 * @param {Object} input
 * @param {number} input.consumption - Water consumption in m³
 * @param {string} [input.customerCategory='household'] - Customer category ID
 * @param {string} [input.pipeSize='half'] - Pipe size ID
 * @param {string} [input.tariffId] - Tariff period ID (optional, defaults to current)
 * @returns {Object} Complete bill breakdown
 */
export function calculateWaterBill({
  consumption = 0,
  customerCategory = 'household',
  pipeSize = 'half',
  tariffId = null,
}) {
  const tariff = getDefaultTariff();
  if (!tariff) {
    throw new Error('Unable to load tariff data');
  }

  const categoryRules = tariff.categories[customerCategory];
  if (!categoryRules) {
    throw new Error(`Unknown customer category: ${customerCategory}`);
  }

  const consumed = Math.max(0, Math.round(consumption));

  // === WATER CHARGES (slab-by-slab) ===
  let remaining = consumed;
  let totalWaterCharge = 0;
  const slabBreakdown = [];

  for (const slab of categoryRules.slabs) {
    if (remaining <= 0) break;

    const slabMin = slab.min;
    const slabMax = slab.max || Infinity;
    const slabRange = slabMax - slabMin + 1;

    if (consumed < slabMin) break;

    const m3InSlab = Math.min(remaining, slabRange);
    const chargeForSlab = Math.round(m3InSlab * slab.rate);

    slabBreakdown.push({
      label: slab.label,
      min: slabMin,
      max: slab.max,
      rate: slab.rate,
      m3InSlab,
      charge: chargeForSlab,
    });

    totalWaterCharge += chargeForSlab;
    remaining -= m3InSlab;
  }

  totalWaterCharge = Math.round(totalWaterCharge);

  // === APPLICABLE CHARGES ===
  const minimumCharge = categoryRules.charges.minimumCharge;
  const serviceCharge = categoryRules.charges.serviceCharge;
  const sewerageRate = categoryRules.charges.sewerageRate;

  const effectiveWaterCharge = Math.max(totalWaterCharge, minimumCharge);
  const sewerageCharge = Math.round(effectiveWaterCharge * sewerageRate);
  const otherCharges = 0;

  // === TOTAL ===
  const totalBill = effectiveWaterCharge + serviceCharge + sewerageCharge + otherCharges;

  // === EFFECTIVE RATE ===
  const effectiveRate = consumed > 0
    ? Math.round((totalBill / consumed) * 100) / 100
    : 0;

  // === CATEGORY INFO ===
  const categoryInfo = CUSTOMER_CATEGORIES[customerCategory] || CUSTOMER_CATEGORIES.household;
  const pipeSizeInfo = PIPE_SIZES[pipeSize] || PIPE_SIZES.half;

  return {
    input: {
      consumption: consumed,
      customerCategory,
      customerCategoryLabel: categoryInfo.label,
      pipeSize,
      pipeSizeLabel: pipeSizeInfo.label,
      pipeSizeRequired: isPipeSizeRequired(customerCategory),
    },

    waterCharges: {
      slabs: slabBreakdown,
      total: totalWaterCharge,
      effectiveTotal: effectiveWaterCharge,
      minimumApplied: totalWaterCharge < minimumCharge,
      minimumCharge,
    },

    serviceCharge,
    sewerageRate,
    sewerageCharge,
    otherCharges,

    totalBill,
    effectiveRate,

    litresPerUnit: LITRES_PER_UNIT,

    tariffId: tariff.id,
    tariffLabel: tariff.label,
    lastUpdated: tariff.lastVerified,
    source: tariff.source,
    needsVerification: tariff.needsVerification,
    unitDefinition: tariff.unitDefinition,
  };
}

/**
 * Validate meter readings
 * @param {number} previous - Previous meter reading
 * @param {number} current - Current meter reading
 * @returns {{ valid: boolean, error: string|null, consumption: number }}
 */
export function validateMeterReadings(previous, current) {
  if (previous === null || current === null || isNaN(previous) || isNaN(current)) {
    return { valid: false, error: 'Please enter valid meter readings.', consumption: 0 };
  }
  if (previous < 0 || current < 0) {
    return { valid: false, error: 'Meter readings cannot be negative.', consumption: 0 };
  }
  if (current < previous) {
    return { valid: false, error: 'Current reading cannot be lower than the previous reading.', consumption: 0 };
  }
  const consumption = current - previous;
  return { valid: true, error: null, consumption };
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
