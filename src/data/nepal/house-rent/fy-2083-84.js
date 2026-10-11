/**
 * Nepal House Rent Tax Rules — FY 2083/84 (2026/27)
 * ===================================================
 * Tax rules for rental income from house/property in Nepal.
 *
 * CRITICAL: Nepal has TWO SEPARATE tax systems for rental income:
 *
 * 1. MUNICIPAL HOUSE RENT TAX (Ghar Bhada Kar)
 *    - Collected by ward office / municipality
 *    - Applies to individual landlords renting to individual tenants
 *    - 10% in Kathmandu, 10-17% nationally
 *    - Final tax — rent does NOT enter income tax slab
 *
 * 2. FEDERAL TDS ON RENT (Section 88, Income Tax Act 2058)
 *    - When tenant is a business/company/NGO/government
 *    - 10% withholding on rent (resident landlord)
 *    - 15% for non-resident landlords
 *    - Final tax for individual landlords (Section 92)
 *
 * KEY: Individual paying rent to natural person = NO federal TDS required
 *      (Section 88 Proviso)
 *
 * SOURCES:
 * - Income Tax Act 2058 (Sections 88, 92, 95A)
 * - Local Government Operation Act 2074
 * - Finance Act 2083
 * - IRD Nepal (ird.gov.np)
 * - 2025 Supreme Court ruling on local vs federal collection
 *
 * LAST VERIFIED: 2026-08-19
 */

export const FY_2083_84 = {
  id: '2083/84',
  label: 'FY 2083/84 (2026/27)',
  yearStart: 2083,
  yearEnd: 2084,
  adRange: '2026/27',

  // Municipal House Rent Tax
  // Applies when individual landlord rents to individual tenant
  municipalTax: {
    name: 'Municipal House Rent Tax (Ghar Bhada Kar)',
    description: 'Collected by ward office / municipality. Final tax for individual landlords.',
    applicable: true,
    rates: {
      // Verified rates by major municipalities
      kathmandu: {
        name: 'Kathmandu Metropolitan City (KMC)',
        rate: 0.10, // 10%
        verified: true,
      },
      lalitpur: {
        name: 'Lalitpur Metropolitan City',
        rate: 0.10,
        verified: true,
      },
      bhaktapur: {
        name: 'Bhaktapur Metropolitan City',
        rate: 0.10,
        verified: true,
      },
      pokhara: {
        name: 'Pokhara Metropolitan City',
        rate: 0.10,
        verified: true,
      },
      chitwan: {
        name: 'Bharatpur Metropolitan City',
        rate: 0.10,
        verified: true,
      },
    },
    // National range if specific municipality not verified
    defaultRate: 0.10,
    nationalRange: { min: 0.10, max: 0.17 },
    notes: [
      'Rate varies by municipality (10% to 17%)',
      'No deductions allowed under flat municipal rate',
      'No tax-free threshold under flat rate',
      'Penalty for late payment: ~10% of unpaid + 15% p.a. interest',
      'Paid via self-declaration at ward office',
    ],
  },

  // Federal TDS on Rent (Section 88)
  // Applies when tenant is a company/business/NGO/government
  federalTDS: {
    name: 'Federal TDS on Rent',
    description: 'Withholding tax deducted by the tenant when rent is paid by a business entity.',
    applicable: true,
    rates: {
      resident: {
        rate: 0.10, // 10%
        description: 'Resident landlord',
        section: 'Section 88',
      },
      nonResident: {
        rate: 0.15, // 15%
        description: 'Non-resident landlord',
        section: 'Section 95A',
      },
    },
    isFinalForIndividual: true,
    section92Note: 'Under Section 92, the 10% TDS is the final tax for individual landlords — no further return filing needed on that rent.',
    section88Proviso: 'Individual paying rent to natural person is NOT required to withhold TDS.',
    notes: [
      'TDS is FINAL for individual landlords (Section 92)',
      'For corporate landlords, TDS is advance against corporate income tax (25%)',
      'Tenant must deposit TDS within 25 days of end of Nepali month',
      'Failure to deduct: IRD recovers from tenant + 15% p.a. interest',
    ],
  },

  // Corporate Tax Rate (for business/company landlords)
  corporateTax: {
    rate: 0.25,
    banksInsuranceTelecom: 0.30,
    notes: 'Corporate landlords: rental income is part of business income, taxed at corporate rates.',
  },

  // VAT on Rent
  vat: {
    residential: {
      applicable: false,
      rate: 0,
      notes: 'Residential rent is VAT-exempt',
    },
    commercial: {
      applicable: true,
      rate: 0.13, // 13%
      threshold: 3000000, // NPR 30 lakh turnover
      notes: 'Commercial rent is taxable at 13% if landlord\'s commercial-rent turnover exceeds NPR 30 lakh',
    },
  },

  // Income Tax Slabs (for business income / corporate landlords)
  incomeTaxSlabs: {
    individual: [
      { min: 0, max: 1000000, rate: 0.01, label: '1% social security tax' },
      { min: 1000001, max: 1500000, rate: 0.10, label: '10%' },
      { min: 1500001, max: 2500000, rate: 0.20, label: '20%' },
      { min: 2500001, max: 4000000, rate: 0.27, label: '27%' },
      { min: 4000001, max: null, rate: 0.29, label: '29%' },
    ],
  },

  // Source information
  sources: [
    { name: 'Inland Revenue Department', url: 'https://ird.gov.np', primary: true },
    { name: 'Ministry of Finance', url: 'https://mof.gov.np', primary: true },
    { name: 'Income Tax Act 2058', url: null },
    { name: 'Local Government Operation Act 2074', url: null },
    { name: 'Finance Act 2083', url: null },
  ],
  lastVerified: '2026-08-19',
  needsVerification: false,
  verificationNotes: [
    'Municipal rate for Kathmandu (10%) verified from multiple sources',
    'Federal TDS rate (10%) verified from multiple sources',
    'Section 92 final tax treatment verified from legal sources',
    'Income tax slabs for FY 2083/84 verified from Finance Act 2083',
    'Direct content from ird.gov.np was not accessible at time of verification',
  ],
};
