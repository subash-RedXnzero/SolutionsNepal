/**
 * NEA Electricity Bill Calculator Engine (FY 2083/84)
 * ===================================================
 * Dead-simple domestic bill estimator. The user enters ONLY the units
 * consumed and their connection ampere; the engine applies the verified
 * NEA domestic tariff from config/neaRules.ts (progressive slabs, a single
 * monthly minimum charge selected by the consumption band, and the 5%
 * concessional VAT on energy above 50 units).
 *
 * SOURCES:
 * - config/neaRules.ts (single source of truth, FY 2083/84)
 *
 * LAST UPDATED: 2026-08-19
 */

import { getNeaTariff } from '../../../config/neaRules.ts';

function round2(value) {
  return Math.round(value * 100) / 100;
}

function slabLabel(slab) {
  return slab.max === null ? `${slab.min}+ units` : `${slab.min}–${slab.max} units`;
}

/**
 * Energy charge for the first `n` units of `totalUnits`, using the same
 * progressive slabs and (for 5A) the lifeline first-slab rule.
 */
function energyForFirst(tariff, totalUnits, n) {
  let remaining = Math.min(totalUnits, n);
  let energy = 0;
  for (let i = 0; i < tariff.slabs.length && remaining > 0; i++) {
    const slab = tariff.slabs[i];
    if (totalUnits < slab.min) break;
    const slabMax = slab.max ?? Infinity;
    const slabRange = slabMax - slab.min + 1;
    const unitsInSlab = Math.min(remaining, slabRange);
    let rate = slab.rate;
    if (i === 0 && tariff.lifelineFreeUnits && totalUnits <= tariff.lifelineFreeUnits) {
      rate = 0;
    }
    energy += unitsInSlab * rate;
    remaining -= unitsInSlab;
  }
  return energy;
}

/**
 * Calculate an NEA domestic electricity bill.
 * @param {Object} input
 * @param {string} input.ampere - '5A' | '15A' | '30A' | '60A'
 * @param {number} input.units - Total units (kWh) consumed in the month
 * @returns {Object} Complete bill breakdown
 */
export function calculateNeaBill({ ampere = '5A', units = 0 } = {}) {
  const tariff = getNeaTariff(ampere);
  if (!tariff) {
    throw new Error(`Unknown NEA tariff: ${ampere}`);
  }

  const totalUnits = Math.max(0, Math.round(Number(units) || 0));

  // === ENERGY CHARGE (progressive slabs) ===
  let remaining = totalUnits;
  let energyCharge = 0;
  const slabBreakdown = [];

  for (let i = 0; i < tariff.slabs.length; i++) {
    const slab = tariff.slabs[i];
    if (remaining <= 0) break;
    if (totalUnits < slab.min) break;

    const slabMax = slab.max ?? Infinity;
    const slabRange = slabMax - slab.min + 1;
    const unitsInSlab = Math.min(remaining, slabRange);

    let rate = slab.rate;
    if (i === 0 && tariff.lifelineFreeUnits && totalUnits <= tariff.lifelineFreeUnits) {
      rate = 0;
    }

    const charge = round2(unitsInSlab * rate);
    slabBreakdown.push({
      label: slabLabel(slab),
      min: slab.min,
      max: slab.max,
      rate,
      unitsInSlab,
      charge,
    });

    energyCharge += charge;
    remaining -= unitsInSlab;
  }

  energyCharge = round2(energyCharge);

  // === MINIMUM CHARGE (single monthly amount from the band containing total) ===
  const band = tariff.slabs.find((s) => totalUnits <= (s.max ?? Infinity));
  const minCharge = band ? band.minCharge : tariff.slabs[tariff.slabs.length - 1].minCharge;

  // === VAT (5% concessional, on energy of units above 50 only) ===
  let vatAmount = 0;
  let vatBasis = 0;
  if (totalUnits > tariff.vatExemptionUnits) {
    const exemptEnergy = energyForFirst(tariff, totalUnits, tariff.vatExemptionUnits);
    vatBasis = round2(energyCharge - exemptEnergy);
    vatAmount = round2(vatBasis * tariff.vatRate);
  }

  const totalBill = round2(energyCharge + minCharge + vatAmount);

  return {
    input: {
      ampere,
      units: totalUnits,
    },
    tariffLabel: tariff.label,
    energyCharge,
    minCharge,
    vatRate: tariff.vatRate,
    vatRatePercent: Math.round(tariff.vatRate * 100),
    vatExemptionUnits: tariff.vatExemptionUnits,
    vatBasis,
    vatAmount,
    totalBill,
    slabs: slabBreakdown,
    effectiveRate: totalUnits > 0 ? round2(totalBill / totalUnits) : 0,
    source: tariff.source,
    lastVerified: tariff.lastVerified,
    needsVerification: tariff.needsVerification,
    fiscalYear: '2083/84',
  };
}

/**
 * Format NPR in South-Asian grouping: "Rs. 1,00,000"
 * @param {number} amount
 * @returns {string}
 */
export function formatNPR(amount) {
  return `Rs. ${new Intl.NumberFormat('en-IN').format(Math.round(amount))}`;
}

/**
 * Format a number with commas (Indian numbering system)
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(Math.round(num));
}