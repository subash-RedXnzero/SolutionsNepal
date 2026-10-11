/**
 * Nepal Rental Income Tax Rules Engine
 * ======================================
 * Tax rules for rental income from house/property in Nepal.
 *
 * LEGAL BASIS:
 * - Income Tax Act 2058 (2002), Section 14: Income from House/Property
 * - Finance Act 2083 (FY 2083/84)
 * - Nepal Rastra Bank guidelines where applicable
 *
 * KEY PRINCIPLES:
 * 1. Rental income is classified as "Income from House/Property"
 * 2. For individuals, rental income is included in total taxable income
 * 3. Tax is calculated using progressive income tax slabs
 * 4. TDS on rent applies at 5% for certain payment categories
 * 5. Allowable deductions may apply (needs verification)
 *
 * SOURCES & VERIFICATION:
 * - Inland Revenue Department Nepal (ird.gov.np)
 * - Income Tax Act 2058
 * - Finance Act 2083
 *
 * LAST UPDATED: 2026-08-19
 *
 * DISCLAIMER: This data is based on commonly-cited Nepal tax rules.
 *             Rates and rules MUST be verified against official IRD
 *             documents before production use.
 */

/**
 * @typedef {Object} TaxSlab
 * @property {number} min - Minimum income (annual, NPR)
 * @property {number} max - Maximum income (annual, NPR), null = no upper limit
 * @property {number} rate - Tax rate as decimal (e.g., 0.10 = 10%)
 */

/**
 * @typedef {Object} FiscalYearRentalRules
 * @property {string} id - e.g., "2083/84"
 * @property {string} label - e.g., "FY 2083/84 (2026/27)"
 * @property {TaxSlab[]} taxSlabs - Income tax slabs (same as salary)
 * @property {Object} deductions - Allowable deductions from rental income
 * @property {Object} tds - TDS on rent rules
 * @property {string} source - Source reference
 * @property {string} lastVerified - Date when rates were last verified
 */

export const FISCAL_YEARS = {
  '2083/84': {
    id: '2083/84',
    label: 'FY 2083/84 (2026/27)',

    // Income Tax Slabs for Individual Resident Taxpayers
    // Based on Finance Act 2083 (FY 2083/84)
    // Source: IRD Nepal (ird.gov.np)
    // NOTE: Rental income is taxed at the same progressive rates as salary
    taxSlabs: [
      { min: 0,          max: 500000,   rate: 0.01 },  // 1%
      { min: 500001,     max: 700000,   rate: 0.10 },  // 10%
      { min: 700001,     max: 1000000,  rate: 0.20 },  // 20%
      { min: 1000001,    max: 2000000,  rate: 0.30 },  // 30%
      { min: 2000001,    max: null,     rate: 0.36 },  // 36%
    ],

    // Allowable Deductions from Rental Income
    // Based on Income Tax Act 2058, Section 14
    // NOTE: These deductions need verification against official IRD guidance
    deductions: {
      // Standard deduction (if available)
      // Some jurisdictions allow a flat 20-30% standard deduction
      // in lieu of itemized expenses. Needs verification for Nepal.
      standardDeductionPercent: 0, // Set to 0 if not available

      // Itemized deductions (if standard deduction not used)
      // Allowable expenses under Income Tax Act 2058
      itemized: {
        // Property tax paid to municipality
        // Fully deductible
        propertyTax: true,

        // Insurance premium for the property
        // Fully deductible
        insurance: true,

        // Repair and maintenance expenses
        // May be subject to caps (e.g., 10% of rent)
        // Needs verification
        repairMaintenance: {
          allowed: true,
          capPercent: 0.10, // 10% of annual rent (if cap applies)
          capApplied: false, // Set to true if cap is confirmed
        },

        // Depreciation on building (not land)
        // Typically 10% per year on building value
        // Only for buildings, not land
        depreciation: {
          allowed: false, // Needs verification for rental income
          rate: 0.10, // 10% per year
        },

        // Other allowable expenses
        // Needs verification
        other: false,
      },
    },

    // TDS on Rent
    // Based on Income Tax Act 2058, Section 91
    // TDS applies when rent is paid by certain entities
    tds: {
      // TDS rate on rent payments
      rate: 0.05, // 5%

      // Who must deduct TDS?
      // - Government bodies
      // - Bodies corporate (companies)
      // - Certain other entities
      // Individual landlords receiving rent from individuals
      // may not be subject to TDS

      // TDS applicability needs verification
      applicable: true,
      notes: 'TDS on rent applies when rent is paid by government, bodies corporate, or other specified entities. Individual-to-individual rent may not require TDS.',
    },

    // Source information
    source: 'Income Tax Act 2058, Finance Act 2083, IRD Nepal',
    lastVerified: '2026-08-19',
    needsVerification: true,
    verificationNotes: [
      'Rental income tax treatment needs verification against official IRD guidance',
      'Allowable deductions and their caps need verification',
      'TDS applicability for individual landlords needs verification',
      'Standard deduction availability needs verification',
    ],
  },
};

/**
 * Get rules for a fiscal year
 * @param {string} fyId - e.g., "2083/84"
 * @returns {FiscalYearRentalRules|null}
 */
export function getFiscalYearRules(fyId) {
  return FISCAL_YEARS[fyId] || null;
}

/**
 * Get the default (current) fiscal year
 * @returns {FiscalYearRentalRules}
 */
export function getCurrentFiscalYear() {
  return FISCAL_YEARS['2083/84'];
}

/**
 * Property types that may affect tax treatment
 * Based on common Nepal classifications
 */
export const PROPERTY_TYPES = {
  residential: {
    id: 'residential',
    label: 'Residential',
    description: 'Home, apartment, room',
    icon: '🏠',
    taxTreatment: 'standard', // Standard income tax treatment
  },
  commercial: {
    id: 'commercial',
    label: 'Commercial',
    description: 'Shop, office, business property',
    icon: '🏪',
    taxTreatment: 'standard', // Same tax treatment (needs verification)
  },
  other: {
    id: 'other',
    label: 'Other',
    description: 'Other rental property',
    icon: '🏢',
    taxTreatment: 'standard',
  },
};

/**
 * Taxpayer types
 */
export const TAXPAYER_TYPES = {
  individual: {
    id: 'individual',
    label: 'Individual',
    description: 'Individual taxpayer',
    taxTreatment: 'progressive', // Progressive tax slabs
  },
  couple: {
    id: 'couple',
    label: 'Couple (Joint)',
    description: 'Couple filing jointly',
    taxTreatment: 'progressive', // Same progressive slabs (needs verification for joint filing)
  },
  business: {
    id: 'business',
    label: 'Business / Company',
    description: 'Business or company taxpayer',
    taxTreatment: 'corporate', // Corporate tax rates (not implemented yet)
    note: 'Corporate tax treatment differs from individual. This calculator currently estimates rental income for individuals.',
  },
};

/**
 * Available fiscal years
 */
export const AVAILABLE_FISCAL_YEARS = [
  { value: '2083/84', label: '2083/84 (2026/27)' },
  { value: '2082/83', label: '2082/83 (2025/26)' },
];
