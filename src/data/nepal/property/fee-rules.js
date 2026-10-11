/**
 * Nepal Property Registration Fee Rules
 * =======================================
 * Fee rules for property registration and land transfer in Nepal.
 *
 * LEGAL BASIS:
 * - Land Revenue Act 2034 (1977)
 * - Land Revenue Rules 2035 (1978)
 * - Finance Act 2083 (FY 2083/84)
 * - Local Government Operation Act 2074
 *
 * KEY FEES:
 * 1. Registration Fee — 2% of property value (land)
 * 2. Stamp Duty — 3% of property value (purchase/sale)
 * 3. Transfer Fee — 1% of property value
 * 4. Local/Municipal Fee — Varies by municipality
 *
 * SOURCES & VERIFICATION:
 * - Department of Land Management and Archives
 * - Ministry of Land Management
 * - Local government fee schedules
 *
 * LAST UPDATED: 2026-08-19
 *
 * DISCLAIMER: Rates below need verification against official
 *             government sources. Always verify with the relevant
 *             Land Revenue Office.
 */

/**
 * @typedef {Object} FeeRule
 * @property {string} id - Fee identifier
 * @property {string} name - Fee name
 * @property {number} rate - Rate as decimal (e.g., 0.02 = 2%)
 * @property {string} basis - What the fee is calculated on
 * @property {boolean} applicable - Whether this fee applies
 * @property {string} notes - Additional notes
 */

/**
 * @typedef {Object} FiscalYearFeeRules
 * @property {string} id - e.g., "2083/84"
 * @property {string} label - e.g., "FY 2083/84 (2026/27)"
 * @property {Object} fees - Fee rules
 * @property {string} source - Source reference
 * @property {string} lastVerified - Verification date
 */

export const FISCAL_YEARS = {
  '2083/84': {
    id: '2083/84',
    label: 'FY 2083/84 (2026/27)',

    // Fee rules for property registration
    fees: {
      // Registration Fee
      // Based on Land Revenue Act 2034
      // Rate: 2% of property value for land
      registrationFee: {
        id: 'registration',
        name: 'Registration Fee',
        rate: 0.02, // 2%
        basis: 'propertyValue',
        applicable: true,
        notes: 'Based on Land Revenue Act 2034. Rate needs verification.',
        needsVerification: true,
      },

      // Stamp Duty
      // Based on Stamp Act 2072
      // Rate: 3% of property value for purchase/sale
      stampDuty: {
        id: 'stampDuty',
        name: 'Stamp Duty',
        rate: 0.03, // 3%
        basis: 'propertyValue',
        applicable: true,
        notes: 'Based on Stamp Act 2072. Applies to purchase/sale transactions.',
        transactionTypes: ['purchase', 'sale'],
        needsVerification: true,
      },

      // Transfer Fee
      // Based on Land Revenue Act 2034
      // Rate: 1% of property value
      transferFee: {
        id: 'transfer',
        name: 'Transfer Fee',
        rate: 0.01, // 1%
        basis: 'propertyValue',
        applicable: true,
        notes: 'Based on Land Revenue Act 2034.',
        needsVerification: true,
      },

      // Local/Municipal Fee
      // Varies by municipality
      localFee: {
        id: 'local',
        name: 'Local / Municipal Fee',
        rate: 0, // Rate varies by municipality
        basis: 'propertyValue',
        applicable: false, // Not universally applicable
        notes: 'Local fees vary by municipality. Current rate not available.',
        needsVerification: true,
      },

      // Service Fee
      // Government service processing fee
      serviceFee: {
        id: 'service',
        name: 'Service Fee',
        amount: 500, // Flat fee in NPR
        basis: 'fixed',
        applicable: true,
        notes: 'Government service processing fee.',
        needsVerification: true,
      },
    },

    // Property type multipliers
    // Different rates may apply for different property types
    propertyTypeMultipliers: {
      land: 1.0,
      house: 1.0, // Same rate as land (needs verification)
      apartment: 1.0, // Same rate as land (needs verification)
      commercial: 1.0, // Same rate as land (needs verification)
    },

    // Transaction type applicability
    transactionTypes: {
      purchase: {
        id: 'purchase',
        label: 'Purchase / Sale',
        stampDutyApplicable: true,
        registrationApplicable: true,
        transferApplicable: true,
      },
      gift: {
        id: 'gift',
        label: 'Gift / Transfer',
        stampDutyApplicable: false, // Gift may have different rules
        registrationApplicable: true,
        transferApplicable: true,
        notes: 'Gift transfers may have different fee structure.',
      },
      partition: {
        id: 'partition',
        label: 'Partition',
        stampDutyApplicable: false,
        registrationApplicable: true,
        transferApplicable: false,
        notes: 'Partition of inherited property.',
      },
    },

    // Source information
    source: 'Land Revenue Act 2034, Stamp Act 2072, Finance Act 2083',
    lastVerified: '2026-08-19',
    needsVerification: true,
    verificationNotes: [
      'Registration fee rate needs verification against current Land Revenue Act',
      'Stamp duty rate needs verification against current Stamp Act',
      'Transfer fee rate needs verification',
      'Local/municipal fees need verification for specific locations',
      'Property type multipliers need verification',
    ],
  },
};

/**
 * Get rules for a fiscal year
 * @param {string} fyId - e.g., "2083/84"
 * @returns {FiscalYearFeeRules|null}
 */
export function getFiscalYearRules(fyId) {
  return FISCAL_YEARS[fyId] || null;
}

/**
 * Get the default (current) fiscal year
 * @returns {FiscalYearFeeRules}
 */
export function getCurrentFiscalYear() {
  return FISCAL_YEARS['2083/84'];
}

/**
 * Property types
 */
export const PROPERTY_TYPES = {
  land: {
    id: 'land',
    label: 'Land',
    description: 'Vacant land / plots',
    icon: '🏞️',
  },
  house: {
    id: 'house',
    label: 'House + Land',
    description: 'House with land',
    icon: '🏠',
  },
  apartment: {
    id: 'apartment',
    label: 'Apartment',
    description: 'Apartment / flat',
    icon: '🏢',
  },
  commercial: {
    id: 'commercial',
    label: 'Commercial Property',
    description: 'Shop, office, business property',
    icon: '🏪',
  },
};

/**
 * Transaction types
 */
export const TRANSACTION_TYPES = {
  purchase: {
    id: 'purchase',
    label: 'Purchase / Sale',
    description: 'Buying or selling property',
  },
  gift: {
    id: 'gift',
    label: 'Gift / Transfer',
    description: 'Gifting property to family members',
  },
  partition: {
    id: 'partition',
    label: 'Partition',
    description: 'Division of inherited property',
  },
};

/**
 * Available fiscal years
 */
export const AVAILABLE_FISCAL_YEARS = [
  { value: '2083/84', label: '2083/84 (2026/27)' },
  { value: '2082/83', label: '2082/83 (2025/26)' },
];
