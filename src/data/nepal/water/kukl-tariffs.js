/**
 * KUKL Water Tariff Data
 * =======================
 * Kathmandu Upatyaka Khanepani Limited (KUKL) water tariff structure.
 *
 * KUKL serves the Kathmandu Valley for drinking water supply.
 *
 * MEASUREMENT UNIT:
 * - KUKL meters and bills use m³ (cubic meters)
 * - 1 m³ = 1,000 litres
 * - Users enter the number they see directly on their meter
 *
 * SOURCES & VERIFICATION:
 * - Tariff rates are based on commonly-cited KUKL tariff structure.
 * - These MUST be verified against the official KUKL tariff notice
 *   from kukl.com.np or the Nepal government gazette before production.
 *
 * LAST UPDATED: 2026-08-19
 *
 * DISCLAIMER: This calculator provides estimates only. Tariff rates may
 * change. Always verify with official KUKL sources before making
 * financial decisions.
 */

// ============================================================
// CUSTOMER CATEGORIES
// ============================================================

export const CUSTOMER_CATEGORIES = {
  household: {
    id: 'household',
    label: 'Household',
    icon: '🏠',
    description: 'Residential households',
  },
  business: {
    id: 'business',
    label: 'Business',
    icon: '🏪',
    description: 'Businesses & shops',
  },
  institution: {
    id: 'institution',
    label: 'Institution',
    icon: '🏫',
    description: 'Government, schools & NGOs',
  },
  industry: {
    id: 'industry',
    label: 'Industry',
    icon: '🏭',
    description: 'Factories & industries',
  },
};

// ============================================================
// PIPE SIZES
// ============================================================

export const PIPE_SIZES = {
  half: {
    id: 'half',
    label: '0.5"',
    value: 0.5,
  },
  threeQuarter: {
    id: 'threeQuarter',
    label: '0.75"',
    value: 0.75,
  },
  one: {
    id: 'one',
    label: '1"',
    value: 1.0,
  },
};

// ============================================================
// TARIFF PERIODS
// ============================================================

export const TARIFF_PERIODS = {
  current: {
    id: 'current',
    label: 'Current Tariff',
    effectiveDate: '2024-07-16',
    expiryDate: null,

    // Whether pipe size affects the tariff for each category
    pipeSizeRequired: {
      household: true,
      business: true,
      institution: true,
      industry: true,
    },

    // Per-category tariff rules
    categories: {
      household: {
        // Metered domestic consumption slabs (per m³)
        // NOTE: These rates need verification against official KUKL tariff.
        slabs: [
          { min: 0,  max: 10,  rate: 15,  label: 'First 10 m³' },
          { min: 11, max: 20,  rate: 25,  label: '11 – 20 m³' },
          { min: 21, max: 30,  rate: 35,  label: '21 – 30 m³' },
          { min: 31, max: null, rate: 50,  label: 'Above 30 m³' },
        ],
        charges: {
          minimumCharge: 100,
          serviceCharge: 50,
          sewerageRate: 0.25,
        },
        pipeSizeMultiplier: {
          half: 1.0,
          threeQuarter: 1.0,
          one: 1.0,
        },
      },
      business: {
        slabs: [
          { min: 0,  max: 10,  rate: 25,  label: 'First 10 m³' },
          { min: 11, max: 30,  rate: 40,  label: '11 – 30 m³' },
          { min: 31, max: null, rate: 60,  label: 'Above 30 m³' },
        ],
        charges: {
          minimumCharge: 200,
          serviceCharge: 100,
          sewerageRate: 0.25,
        },
        pipeSizeMultiplier: {
          half: 1.0,
          threeQuarter: 1.0,
          one: 1.0,
        },
      },
      institution: {
        slabs: [
          { min: 0,  max: 15,  rate: 20,  label: 'First 15 m³' },
          { min: 16, max: 40,  rate: 35,  label: '16 – 40 m³' },
          { min: 41, max: null, rate: 55,  label: 'Above 40 m³' },
        ],
        charges: {
          minimumCharge: 150,
          serviceCharge: 75,
          sewerageRate: 0.25,
        },
        pipeSizeMultiplier: {
          half: 1.0,
          threeQuarter: 1.0,
          one: 1.0,
        },
      },
      industry: {
        slabs: [
          { min: 0,  max: 20,  rate: 30,  label: 'First 20 m³' },
          { min: 21, max: 50,  rate: 50,  label: '21 – 50 m³' },
          { min: 51, max: null, rate: 75,  label: 'Above 50 m³' },
        ],
        charges: {
          minimumCharge: 300,
          serviceCharge: 150,
          sewerageRate: 0.25,
        },
        pipeSizeMultiplier: {
          half: 1.0,
          threeQuarter: 1.0,
          one: 1.0,
        },
      },
    },

    // Unit definition
    unitDefinition: {
      meterUnit: 'm³',
      litresPerUnit: 1000,
      verified: false,
      note: '1 m³ = 1,000 litres (needs verification)',
    },

    source: 'KUKL commonly-cited tariff structure (needs verification against kukl.com.np)',
    lastVerified: '2026-08-19',
    needsVerification: true,
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getTariffById(tariffId) {
  return TARIFF_PERIODS[tariffId] || null;
}

export function getDefaultTariff() {
  return TARIFF_PERIODS.current;
}

export function getAvailableTariffs() {
  return Object.values(TARIFF_PERIODS).map(t => ({
    id: t.id,
    label: t.label,
    effectiveDate: t.effectiveDate,
    expiryDate: t.expiryDate,
  }));
}

export function getCustomerCategories() {
  return Object.values(CUSTOMER_CATEGORIES);
}

export function getPipeSizes() {
  return Object.values(PIPE_SIZES);
}

export function isPipeSizeRequired(categoryId) {
  const tariff = getDefaultTariff();
  return tariff.pipeSizeRequired[categoryId] || false;
}

export const LITRES_PER_UNIT = 1000;
