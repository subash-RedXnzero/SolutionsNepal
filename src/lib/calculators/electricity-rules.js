/**
 * Nepal Electricity Tariff Rules Engine
 * =======================================
 * NEA (Nepal Electricity Authority) domestic electricity tariff structure.
 *
 * SOURCES & VERIFICATION:
 * - Tariff rates based on NEA consumer tariff schedule.
 *   Official page: https://nea.org.np (Consumer Tariff section)
 * - NEA FAQ confirms: "NEA has a progressive tariff structure that varies
 *   for domestic, commercial, and industrial use. Domestic rates increase
 *   with higher consumption slabs."
 * - Electricity Distribution Regulations 2078 (with amendments)
 *   URL: https://nea.org.np
 *
 * NOTE: Rates below are based on commonly-cited NEA domestic tariff
 * structure. These should be verified against the official NEA consumer
 * tariff PDF/schedule from nea.org.np before production use.
 *
 * LAST UPDATED: 2026-08-19
 *
 * DISCLAIMER: This calculator provides estimates only. Tariff rates may
 * change. Always verify with official Nepal government sources
 * (NEA: nea.org.np) before making financial decisions.
 */

/**
 * @typedef {Object} EnergySlab
 * @property {number} min - Minimum units (kWh) in slab (inclusive)
 * @property {number} max - Maximum units (kWh) in slab (inclusive), null = no upper limit
 * @property {number} rate - Rate per unit in NPR
 * @property {string} label - Human-readable label for the slab
 */

/**
 * @typedef {Object} TariffRules
 * @property {string} id - Tariff period identifier
 * @property {string} label - Human-readable label
 * @property {string} consumerType - Consumer type (domestic, commercial, etc.)
 * @property {Object} fixedCharges - Monthly fixed charges
 * @property {EnergySlab[]} energySlabs - Progressive energy charge slabs
 * @property {number} vatRate - VAT rate as decimal (e.g., 0.13 = 13%)
 * @property {string} source - Source reference
 * @property {string} lastVerified - Date when rates were last verified
 * @property {boolean} needsVerification - Whether rates need verification
 */

export const TARIFF_RULES = {
  'domestic-single-phase': {
    id: 'domestic-single-phase',
    label: 'Domestic (Single Phase)',
    consumerType: 'domestic',
    phase: 'single',

    // Monthly fixed charges
    fixedCharges: {
      serviceCharge: 50,     // NPR per month - service/maintenance charge
      meterRent: 30,         // NPR per month - meter rental fee
    },

    // Progressive energy charge slabs (per kWh / per unit)
    // NEA domestic tariff - rates increase with consumption
    energySlabs: [
      { min: 0,   max: 50,   rate: 7.50,  label: '0 – 50 units' },
      { min: 51,  max: 100,  rate: 9.50,  label: '51 – 100 units' },
      { min: 101, max: 150,  rate: 11.50, label: '101 – 150 units' },
      { min: 151, max: 200,  rate: 13.50, label: '151 – 200 units' },
      { min: 201, max: 250,  rate: 15.50, label: '201 – 250 units' },
      { min: 251, max: null, rate: 17.50, label: 'Above 250 units' },
    ],

    // VAT on total bill (energy + fixed charges)
    vatRate: 0.13,  // 13% VAT

    source: 'NEA Consumer Tariff (nea.org.np), Electricity Distribution Regulations 2078',
    lastVerified: '2026-08-19',
    needsVerification: true,
  },

  'domestic-three-phase': {
    id: 'domestic-three-phase',
    label: 'Domestic (Three Phase)',
    consumerType: 'domestic',
    phase: 'three',

    fixedCharges: {
      serviceCharge: 100,    // NPR per month
      meterRent: 60,         // NPR per month
    },

    // Three-phase typically has slightly higher rates
    energySlabs: [
      { min: 0,   max: 50,   rate: 8.00,  label: '0 – 50 units' },
      { min: 51,  max: 100,  rate: 10.00, label: '51 – 100 units' },
      { min: 101, max: 150,  rate: 12.00, label: '101 – 150 units' },
      { min: 151, max: 200,  rate: 14.00, label: '151 – 200 units' },
      { min: 201, max: 250,  rate: 16.00, label: '201 – 250 units' },
      { min: 251, max: null, rate: 18.00, label: 'Above 250 units' },
    ],

    vatRate: 0.13,

    source: 'NEA Consumer Tariff (nea.org.np), Electricity Distribution Regulations 2078',
    lastVerified: '2026-08-19',
    needsVerification: true,
  },
};

/**
 * Get tariff rules by ID
 * @param {string} tariffId - e.g., "domestic-single-phase"
 * @returns {TariffRules|null}
 */
export function getTariffRules(tariffId) {
  return TARIFF_RULES[tariffId] || null;
}

/**
 * Get the default tariff (domestic single phase)
 * @returns {TariffRules}
 */
export function getDefaultTariff() {
  return TARIFF_RULES['domestic-single-phase'];
}

/**
 * Get all available tariff types
 * @returns {Array<{id: string, label: string}>}
 */
export function getAvailableTariffs() {
  return Object.values(TARIFF_RULES).map(t => ({
    id: t.id,
    label: t.label,
    consumerType: t.consumerType,
    phase: t.phase,
  }));
}
