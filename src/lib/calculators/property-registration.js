/**
 * Nepal Property Registration Cost Calculator Engine
 * ====================================================
 * Calculates estimated property registration and transfer costs.
 *
 * Core user problem: "I am buying/transferring property. How much
 * will the registration and transfer cost?"
 *
 * The engine handles:
 * - Property value input
 * - Registration fee calculation
 * - Stamp duty calculation
 * - Transfer fee calculation
 * - Local/municipal fee estimation
 * - Total cost calculation
 *
 * SOURCES:
 * - Land Revenue Act 2034
 * - Stamp Act 2072
 * - Finance Act 2083
 *
 * LAST UPDATED: 2026-08-19
 */

import {
  getCurrentFiscalYear,
  getFiscalYearRules,
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
} from '../../data/nepal/property/fee-rules.js';

import { getProvince, getDistricts } from '../../data/nepal/property/locations.js';

/**
 * Calculate property registration costs
 *
 * @param {Object} input
 * @param {number} input.propertyValue - Property value in NPR
 * @param {string} input.propertyType - Property type ID
 * @param {string} input.transactionType - Transaction type ID
 * @param {string} input.province - Province ID
 * @param {string} input.district - District ID
 * @param {string} input.fiscalYear - Fiscal year ID (optional)
 * @param {number} input.governmentValuation - Government valuation (optional)
 * @returns {Object} Complete cost breakdown
 */
export function calculatePropertyRegistrationCost({
  propertyValue = 0,
  propertyType = 'land',
  transactionType = 'purchase',
  province = 'bagmati',
  district = 'kathmandu',
  fiscalYear = null,
  governmentValuation = 0,
}) {
  // === LOOKUP RULES ===
  const activeRules = fiscalYear ? getFiscalYearRules(fiscalYear) : getCurrentFiscalYear();
  if (!activeRules) {
    throw new Error(`Fiscal year ${fiscalYear} not found`);
  }

  // Get location info
  const provinceInfo = getProvince(province);
  const districtInfo = getDistricts(province).find(d => d.id === district);

  // Get transaction type info
  const transactionInfo = TRANSACTION_TYPES[transactionType];
  if (!transactionInfo) {
    throw new Error(`Unknown transaction type: ${transactionType}`);
  }

  // Get property type info
  const propertyInfo = PROPERTY_TYPES[propertyType];
  if (!propertyInfo) {
    throw new Error(`Unknown property type: ${propertyType}`);
  }

  // === DETERMINE VALUATION BASIS ===
  // Use the higher of property value and government valuation
  const valuationBasis = governmentValuation > 0
    ? Math.max(propertyValue, governmentValuation)
    : propertyValue;

  // === PROPERTY TYPE MULTIPLIER ===
  const multiplier = activeRules.propertyTypeMultipliers[propertyType] || 1.0;

  // === CALCULATE FEES ===
  const fees = {};
  let totalFees = 0;

  // Registration Fee
  const regFee = activeRules.fees.registrationFee;
  if (regFee.applicable) {
    const amount = Math.round(valuationBasis * regFee.rate * multiplier);
    fees.registrationFee = {
      ...regFee,
      amount,
      calculatedOn: valuationBasis,
      multiplier,
    };
    totalFees += amount;
  }

  // Stamp Duty (only for purchase/sale)
  const stampFee = activeRules.fees.stampDuty;
  if (stampFee.applicable && stampFee.transactionTypes?.includes(transactionType)) {
    const amount = Math.round(valuationBasis * stampFee.rate * multiplier);
    fees.stampDuty = {
      ...stampFee,
      amount,
      calculatedOn: valuationBasis,
      multiplier,
    };
    totalFees += amount;
  }

  // Transfer Fee
  const transferFee = activeRules.fees.transferFee;
  if (transferFee.applicable) {
    const amount = Math.round(valuationBasis * transferFee.rate * multiplier);
    fees.transferFee = {
      ...transferFee,
      amount,
      calculatedOn: valuationBasis,
      multiplier,
    };
    totalFees += amount;
  }

  // Local/Municipal Fee (if available)
  const localFee = activeRules.fees.localFee;
  if (localFee.applicable && localFee.rate > 0) {
    const amount = Math.round(valuationBasis * localFee.rate);
    fees.localFee = {
      ...localFee,
      amount,
      calculatedOn: valuationBasis,
    };
    totalFees += amount;
  }

  // Service Fee (fixed amount)
  const serviceFee = activeRules.fees.serviceFee;
  if (serviceFee.applicable) {
    fees.serviceFee = {
      ...serviceFee,
      amount: serviceFee.amount,
    };
    totalFees += serviceFee.amount;
  }

  // === TOTAL AMOUNT REQUIRED ===
  const totalAmount = propertyValue + totalFees;

  return {
    // Input echo
    input: {
      propertyValue,
      propertyType,
      propertyLabel: propertyInfo.label,
      transactionType,
      transactionLabel: transactionInfo.label,
      province,
      provinceLabel: provinceInfo?.label || province,
      district,
      districtLabel: districtInfo?.label || district,
      governmentValuation,
      valuationBasis,
      fiscalYear: activeRules.id,
      fiscalYearLabel: activeRules.label,
    },

    // Fees breakdown
    fees: {
      registrationFee: fees.registrationFee || null,
      stampDuty: fees.stampDuty || null,
      transferFee: fees.transferFee || null,
      localFee: fees.localFee || null,
      serviceFee: fees.serviceFee || null,
      total: totalFees,
    },

    // Totals
    totalFees,
    totalAmount,

    // Property type
    propertyType: propertyInfo,

    // Transaction type
    transactionType: transactionInfo,

    // Metadata
    fiscalYear: activeRules.id,
    fiscalYearLabel: activeRules.label,
    lastUpdated: activeRules.lastVerified,
    needsVerification: activeRules.needsVerification,
    verificationNotes: activeRules.verificationNotes,
    source: activeRules.source,
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
