/**
 * Nepal House Rent Tax Rules Engine
 * ====================================
 * Central data layer for house rent tax calculations.
 *
 * This file provides:
 * - Fiscal year rules lookup
 * - Property types
 * - Taxpayer types
 * - Location/municipality data
 * - Tax scenario determination
 *
 * CRITICAL: Nepal has TWO SEPARATE tax systems for rental income:
 * 1. Municipal House Rent Tax (individual → individual)
 * 2. Federal TDS on Rent (company → individual)
 *
 * The calculator determines which system applies based on:
 * - Taxpayer type (individual vs business)
 * - Tenant type (individual vs company)
 * - Property type (for VAT purposes)
 *
 * SOURCES: Income Tax Act 2058, Finance Act 2083, Local Government Operation Act 2074
 * LAST VERIFIED: 2026-08-19
 */

import { FY_2083_84 } from './fy-2083-84.js';

export const FISCAL_YEARS = {
  '2083/84': FY_2083_84,
};

export function getFiscalYearRules(fyId) {
  return FISCAL_YEARS[fyId] || null;
}

export function getCurrentFiscalYear() {
  return FISCAL_YEARS['2083/84'];
}

/**
 * Property types for classification.
 * Note: Property type does NOT change the house rent tax calculation itself,
 * but it may affect VAT applicability.
 */
export const PROPERTY_TYPES = {
  residential: {
    id: 'residential',
    label: 'House / Room',
    description: 'Residential house, room, apartment',
    icon: '\u{1f3e0}',
    vatExempt: true,
  },
  commercial: {
    id: 'commercial',
    label: 'Shop / Commercial',
    description: 'Shop, office, commercial space',
    icon: '\u{1f3ea}',
    vatExempt: false,
    vatThreshold: 3000000,
  },
  other: {
    id: 'other',
    label: 'Other Rental Property',
    description: 'Other rental property',
    icon: '\u{1f3e2}',
    vatExempt: true,
  },
};

/**
 * Taxpayer types.
 */
export const TAXPAYER_TYPES = {
  individual: {
    id: 'individual',
    label: 'Individual',
    description: 'Individual taxpayer (natural person)',
    taxTreatment: 'municipal-or-tds',
    note: 'Currently supports individual rental income estimates.',
  },
  business: {
    id: 'business',
    label: 'Business / Company',
    description: 'Business or company taxpayer',
    taxTreatment: 'corporate',
    note: 'Corporate tax treatment differs. Rental income is part of business income.',
  },
};

/**
 * Tenant types — who is paying the rent.
 * This determines whether TDS applies or municipal tax applies.
 */
export const TENANT_TYPES = {
  individual: {
    id: 'individual',
    label: 'Individual Tenant',
    description: 'Rent paid by another individual',
    tdsApplicable: false,
    municipalTaxApplicable: true,
    notes: 'Individual-to-individual: no federal TDS required. Municipal house rent tax applies.',
  },
  company: {
    id: 'company',
    label: 'Company / Business Tenant',
    description: 'Rent paid by a company, NGO, or government body',
    tdsApplicable: true,
    municipalTaxApplicable: false,
    notes: 'Company tenant deducts 10% TDS before paying rent. This is final tax for individual landlords.',
  },
};

/**
 * Available fiscal years
 */
export const AVAILABLE_FISCAL_YEARS = [
  { value: '2083/84', label: '2083/84 (2026/27)' },
];

/**
 * Scenario types for tax determination
 */
export const SCENARIOS = {
  MUNICIPAL: 'municipal',
  FEDERAL_TDS: 'federal_tds',
  BUSINESS_INCOME: 'business_income',
  NOT_APPLICABLE: 'not_applicable',
};

/**
 * Determine the tax scenario based on inputs
 */
export function determineScenario(taxpayerType, tenantType, propertyType) {
  // Business/Company landlords: rental income is business income
  if (taxpayerType === 'business') {
    return {
      scenario: SCENARIOS.BUSINESS_INCOME,
      description: 'Rental income is treated as business income for corporate landlords.',
      taxLabel: 'Corporate Income Tax',
    };
  }

  // Individual landlord
  if (tenantType === 'company') {
    // Company tenant deducts TDS
    return {
      scenario: SCENARIOS.FEDERAL_TDS,
      description: 'Company tenant deducts 10% TDS before paying rent.',
      taxLabel: 'Federal TDS on Rent',
    };
  }

  // Individual → Individual (default most common case)
  return {
    scenario: SCENARIOS.MUNICIPAL,
    description: 'Municipal house rent tax applies. No federal TDS required.',
    taxLabel: 'Municipal House Rent Tax',
  };
}

/**
 * Location data for municipalities
 * Note: Only verified rates are included
 */
export const PROVINCES = [
  { value: 'bagmati', label: 'Bagmati Province' },
  { value: 'gandaki', label: 'Gandaki Province' },
  { value: 'lumbini', label: 'Lumbini Province' },
  { value: 'koshi', label: 'Koshi Province' },
  { value: 'madhesh', label: 'Madhesh Province' },
  { value: 'karnali', label: 'Karnali Province' },
  { value: 'sudurpashchim', label: 'Sudurpashchim Province' },
];

export const DISTRICTS = {
  bagmati: [
    { value: 'kathmandu', label: 'Kathmandu' },
    { value: 'lalitpur', label: 'Lalitpur' },
    { value: 'bhaktapur', label: 'Bhaktapur' },
    { value: 'chitwan', label: 'Chitwan' },
    { value: 'makwanpur', label: 'Makwanpur' },
    { value: 'dhading', label: 'Dhading' },
    { value: 'nuwakot', label: 'Nuwakot' },
    { value: 'rasuwa', label: 'Rasuwa' },
    { value: 'dolakha', label: 'Dolakha' },
    { value: 'sindhupalchok', label: 'Sindhupalchok' },
    { value: 'ramechhap', label: 'Ramechhap' },
    { value: 'sindhuli', label: 'Sindhuli' },
  ],
  gandaki: [
    { value: 'kaski', label: 'Kaski' },
    { value: 'tanahun', label: 'Tanahun' },
    { value: 'syangja', label: 'Syangja' },
    { value: 'gorkha', label: 'Gorkha' },
    { value: 'lamjung', label: 'Lamjung' },
    { value: 'manang', label: 'Manang' },
    { value: 'mustang', label: 'Mustang' },
    { value: 'myagdi', label: 'Myagdi' },
    { value: 'parbat', label: 'Parbat' },
    { value: 'baglung', label: 'Baglung' },
  ],
  lumbini: [
    { value: 'rupandehi', label: 'Rupandehi' },
    { value: 'kapilvastu', label: 'Kapilvastu' },
    { value: 'nawalparasi', label: 'Nawalparasi (East)' },
    { value: 'dang', label: 'Dang' },
    { value: 'rolpa', label: 'Rolpa' },
    { value: 'pyuthan', label: 'Pyuthan' },
    { value: 'bardiya', label: 'Bardiya' },
    { value: 'arghakhanchi', label: 'Arghakhanchi' },
    { value: 'gulmi', label: 'Gulmi' },
    { value: 'palpa', label: 'Palpa' },
  ],
  koshi: [
    { value: 'morang', label: 'Morang' },
    { value: 'sunsari', label: 'Sunsari' },
    { value: 'jhapa', label: 'Jhapa' },
    { value: 'illam', label: 'Illam' },
    { value: 'taplejung', label: 'Taplejung' },
    { value: 'panchthar', label: 'Panchthar' },
    { value: 'terhathum', label: 'Terhathum' },
    { value: 'dhankuta', label: 'Dhankuta' },
    { value: 'sankhuwasabha', label: 'Sankhuwasabha' },
    { value: 'solukhumbu', label: 'Solukhumbu' },
    { value: 'khotang', label: 'Khotang' },
    { value: 'okhaldhunga', label: 'Okhaldhunga' },
  ],
  madhesh: [
    { value: 'parsa', label: 'Parsa' },
    { value: 'bara', label: 'Bara' },
    { value: 'rautahat', label: 'Rautahat' },
    { value: 'sarlahi', label: 'Sarlahi' },
    { value: 'mahottari', label: 'Mahottari' },
    { value: 'dhanusha', label: 'Dhanusha' },
    { value: 'saptari', label: 'Saptari' },
    { value: 'siraha', label: 'Siraha' },
  ],
  karnali: [
    { value: 'surkhet', label: 'Surkhet' },
    { value: 'dailekh', label: 'Dailekh' },
    { value: 'jajarkot', label: 'Jajarkot' },
    { value: 'dolpa', label: 'Dolpa' },
    { value: 'humla', label: 'Humla' },
    { value: 'mugu', label: 'Mugu' },
    { value: 'jumla', label: 'Jumla' },
    { value: 'kalikot', label: 'Kalikot' },
    { value: 'salyan', label: 'Salyan' },
    { value: 'rustum', label: 'Rustum' },
  ],
  sudurpashchim: [
    { value: 'kanchanpur', label: 'Kanchanpur' },
    { value: 'kailali', label: 'Kailali' },
    { value: 'darchula', label: 'Darchula' },
    { value: 'baitadi', label: 'Baitadi' },
    { value: 'dadeldhura', label: 'Dadeldhura' },
    { value: 'bajhang', label: 'Bajhang' },
    { value: 'bajura', label: 'Bajura' },
    { value: 'achham', label: 'Achham' },
    { value: 'doti', label: 'Doti' },
    { value: 'dhangadhi', label: 'Dhangadhi (Sub-Metropolitan)' },
  ],
};

export const MUNICIPALITIES = {
  kathmandu: [
    { value: 'kmc', label: 'Kathmandu Metropolitan City', rate: 0.10, verified: true },
  ],
  lalitpur: [
    { value: 'lmc', label: 'Lalitpur Metropolitan City', rate: 0.10, verified: true },
  ],
  bhaktapur: [
    { value: 'bmc', label: 'Bhaktapur Metropolitan City', rate: 0.10, verified: true },
  ],
  chitwan: [
    { value: 'bharatpur', label: 'Bharatpur Metropolitan City', rate: 0.10, verified: true },
  ],
  kaski: [
    { value: 'pokhara', label: 'Pokhara Metropolitan City', rate: 0.10, verified: true },
  ],
};

export function getMunicipalityRate(province, district, municipality) {
  const municipalities = MUNICIPALITIES[district];
  if (!municipalities) return null;
  const m = municipalities.find(m => m.value === municipality);
  if (!m) return null;
  return { rate: m.rate, verified: m.verified, name: m.label };
}
