/**
 * Nepal Land Registration Fee Calculator Engine
 * ===============================================
 * Calculates estimated land/property registration fees.
 *
 * BASE RATE (Land/House):
 *   Metropolitan: 5.0% | Sub-Metropolitan: 4.5%
 *   Municipality: 4.0%  | Rural Municipality: 2.0%
 *
 * SPECIAL TYPES: Apartment 1.0%, High-Rise 0.5%, Group Housing 2.0%
 * FAMILY TRANSFER: 1.5% flat
 * FEMALE CONCESSION: 25% off urban, 30% off rural
 * BAGMATI SURCHARGE: 5% of registration fee (Kathmandu Valley)
 * SERVICE CHARGE: NPR 500 flat
 *
 * LAST UPDATED: 2026-08-20
 */

import {
  LOCAL_BODY_RATES,
  PROPERTY_TYPE_RATES,
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPES,
  PROVINCES,
  getDistricts,
  getMunicipalities,
  hasBagmatiSurcharge,
} from '../../data/nepal/property/land-reg-locations.js';

/**
 * Calculate land registration fees
 */
export function calculateLandRegistration({
  declaredValue = 0,
  governmentValue = 0,
  propertyType = 'land',
  transactionType = 'purchase',
  provinceId = 'bagmati',
  districtId = 'kathmandu',
  municipalityType = 'Metropolitan',
  buyerCategory = 'general',
}) {
  // 1. Valuation basis
  const valuation = governmentValue > 0 ? Math.max(declaredValue, governmentValue) : declaredValue;
  if (valuation <= 0) return null;

  // 2. Determine base rate
  let baseRate;
  let rateSource;
  const specialRate = PROPERTY_TYPE_RATES[propertyType];

  if (transactionType === 'family') {
    baseRate = 0.015;
    rateSource = 'Family Transfer flat rate (1.5%)';
  } else if (specialRate !== null) {
    baseRate = specialRate;
    rateSource = PROPERTY_TYPE_LABELS[propertyType] + ' fixed rate (' + (specialRate * 100) + '%)';
  } else {
    baseRate = LOCAL_BODY_RATES[municipalityType] || 0.04;
    rateSource = municipalityType + ' rate (' + (baseRate * 100) + '%)';
  }

  // 3. Calculate raw registration fee
  let regFee = Math.round(valuation * baseRate);

  // 4. Female concession
  let concessionAmount = 0;
  let concessionLabel = '';
  if (buyerCategory === 'female') {
    const isRural = municipalityType === 'Rural Municipality';
    const discount = isRural ? 0.30 : 0.25;
    concessionAmount = Math.round(regFee * discount);
    regFee -= concessionAmount;
    concessionLabel = 'Female concession: -' + (discount * 100) + '% (-Rs ' + concessionAmount.toLocaleString('en-IN') + ')';
  }

  // 5. Bagmati Savyata Kosh surcharge (5% of registration fee)
  const hasSurcharge = hasBagmatiSurcharge(provinceId, districtId);
  const surcharge = hasSurcharge ? Math.round(regFee * 0.05) : 0;
  const surchargeLabel = hasSurcharge ? 'Bagmati Savyata Kosh (5% of registration fee)' : '';

  // 6. Service charge
  const serviceCharge = 500;

  // 7. Total
  const total = regFee + surcharge + serviceCharge;

  // Location info
  const province = PROVINCES.find(p => p.id === provinceId);
  const district = getDistricts(provinceId).find(d => d.id === districtId);
  const propertyLabel = PROPERTY_TYPE_LABELS[propertyType] || 'Land / House';
  const transactionLabel = TRANSACTION_TYPES[transactionType]?.label || 'Sale / Purchase';
  const buyerLabel = buyerCategory === 'female' ? 'Female Owner' : buyerCategory === 'joint' ? 'Joint (Spouses)' : 'Male / General';

  return {
    input: {
      declaredValue,
      governmentValue,
      valuation,
      propertyType,
      propertyLabel,
      transactionType,
      transactionLabel,
      provinceId,
      provinceLabel: province?.name || provinceId,
      districtId,
      districtLabel: district?.name || districtId,
      municipalityType,
      buyerCategory,
      buyerLabel,
    },
    baseRate,
    rateSource,
    regFeeBeforeConcession: Math.round(valuation * baseRate),
    registrationFee: regFee,
    concessionAmount,
    concessionLabel,
    surcharge,
    surchargeLabel,
    hasSurcharge,
    serviceCharge,
    total,
    meta: {
      lastUpdated: '2026-08-20',
      fiscalYear: '2083/84',
      source: 'Land Revenue Act 2034, Finance Act 2083',
      needsVerification: true,
    },
  };
}

export function formatNPR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'NPR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}
