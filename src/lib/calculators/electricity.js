/**
 * Nepal Electricity Bill Calculator Engine
 * ==========================================
 * Calculates electricity bills based on NEA domestic tariff structure.
 *
 * Uses the modular tariff rules from electricity-rules.js for
 * tariff-period-aware calculations. The rules can be updated per
 * tariff period without changing this calculator logic.
 *
 * SOURCES:
 * - NEA Consumer Tariff (nea.org.np)
 * - Electricity Distribution Regulations 2078
 *
 * LAST UPDATED: 2026-08-19
 */

import { getDefaultTariff, getTariffRules } from './electricity-rules.js';

/**
 * Calculate electricity bill with slab-by-slab breakdown
 * @param {Object} input
 * @param {number} input.units - Number of units (kWh) consumed
 * @param {string} input.tariffId - Tariff type ID (optional, defaults to domestic single phase)
 * @returns {Object} Complete bill breakdown
 */
export function calculateElectricityBill({
  units = 0,
  tariffId = null,
}) {
  const rules = tariffId ? getTariffRules(tariffId) : getDefaultTariff();
  if (!rules) {
    throw new Error(`Unknown tariff ID: ${tariffId}`);
  }

  const consumption = Math.max(0, Math.round(units));

  // === ENERGY CHARGES (slab-by-slab) ===
  let remainingUnits = consumption;
  let totalEnergyCharge = 0;
  const slabBreakdown = [];

  for (const slab of rules.energySlabs) {
    if (remainingUnits <= 0) break;

    const slabMin = slab.min;
    const slabMax = slab.max || Infinity;
    const slabRange = slabMax - slabMin + 1;

    // Skip if consumption is below this slab
    if (consumption < slabMin) break;

    // Calculate units in this slab
    const unitsInSlab = Math.min(remainingUnits, slabRange);
    const chargeForSlab = Math.round(unitsInSlab * slab.rate * 100) / 100;

    slabBreakdown.push({
      label: slab.label,
      min: slabMin,
      max: slab.max,
      rate: slab.rate,
      unitsInSlab,
      charge: Math.round(chargeForSlab),
    });

    totalEnergyCharge += chargeForSlab;
    remainingUnits -= unitsInSlab;
  }

  totalEnergyCharge = Math.round(totalEnergyCharge);

  // === FIXED CHARGES ===
  const serviceCharge = rules.fixedCharges.serviceCharge;
  const meterRent = rules.fixedCharges.meterRent;
  const totalFixedCharges = serviceCharge + meterRent;

  // === SUBTOTAL (before VAT) ===
  const subtotal = totalEnergyCharge + totalFixedCharges;

  // === VAT ===
  const vatAmount = Math.round(subtotal * rules.vatRate);

  // === TOTAL BILL ===
  const totalBill = subtotal + vatAmount;

  // === EFFECTIVE RATE ===
  const effectiveRate = consumption > 0
    ? Math.round((totalBill / consumption) * 100) / 100
    : 0;

  // === AVERAGE RATE PER UNIT (energy only) ===
  const avgEnergyRate = consumption > 0
    ? Math.round((totalEnergyCharge / consumption) * 100) / 100
    : 0;

  return {
    // Input echo
    input: {
      units: consumption,
      tariffId: rules.id,
    },

    // Energy charge breakdown
    energyCharges: {
      slabs: slabBreakdown,
      total: totalEnergyCharge,
      averageRate: avgEnergyRate,
    },

    // Fixed charges
    fixedCharges: {
      serviceCharge,
      meterRent,
      total: totalFixedCharges,
    },

    // Tax
    vat: {
      rate: rules.vatRate,
      ratePercent: Math.round(rules.vatRate * 100),
      amount: vatAmount,
    },

    // Totals
    subtotal,
    totalBill,
    effectiveRate,

    // Metadata
    tariffId: rules.id,
    tariffLabel: rules.label,
    consumerType: rules.consumerType,
    phase: rules.phase,
    lastUpdated: rules.lastVerified,
    needsVerification: rules.needsVerification,
    source: rules.source,
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
