/**
 * Nepal Rental Income Tax Calculator Engine
 * ===========================================
 * Calculates rental income tax based on Nepal tax rules.
 *
 * Core user problem: "I receive rent from my property. How much tax
 * do I owe, and what is my net rental income?"
 *
 * The engine handles:
 * - Monthly/Annual rent conversion
 * - Deductions (standard or itemized)
 * - Taxable income calculation
 * - Progressive income tax calculation
 * - TDS estimation
 * - Net rental income
 *
 * SOURCES:
 * - Income Tax Act 2058 (2002)
 * - Finance Act 2083 (FY 2083/84)
 * - IRD Nepal (ird.gov.np)
 *
 * LAST UPDATED: 2026-08-19
 */

import {
  getCurrentFiscalYear,
  getFiscalYearRules,
  PROPERTY_TYPES,
  TAXPAYER_TYPES,
} from '../../data/nepal/rental/tax-rules.js';

/**
 * Calculate progressive income tax using tax slabs
 * @param {number} annualTaxableIncome - Annual taxable income in NPR
 * @param {Array} taxSlabs - Tax slabs array
 * @returns {Object} Tax breakdown
 */
function calculateProgressiveTax(annualTaxableIncome, taxSlabs) {
  if (annualTaxableIncome <= 0) {
    return { totalTax: 0, effectiveRate: 0, slabs: [] };
  }

  let remainingIncome = annualTaxableIncome;
  let totalTax = 0;
  const slabBreakdown = [];

  for (const slab of taxSlabs) {
    if (remainingIncome <= 0) break;

    const slabMin = slab.min;
    const slabMax = slab.max || Infinity;
    const slabRange = slabMax - slabMin + 1;

    if (annualTaxableIncome < slabMin) break;

    const taxableInSlab = Math.min(remainingIncome, slabRange);
    const taxInSlab = Math.round(taxableInSlab * slab.rate);

    slabBreakdown.push({
      min: slabMin,
      max: slab.max,
      rate: slab.rate,
      ratePercent: Math.round(slab.rate * 100),
      taxableAmount: taxableInSlab,
      tax: taxInSlab,
    });

    totalTax += taxInSlab;
    remainingIncome -= taxableInSlab;
  }

  return {
    totalTax: Math.round(totalTax),
    effectiveRate: annualTaxableIncome > 0
      ? Math.round((totalTax / annualTaxableIncome) * 10000) / 100
      : 0,
    slabs: slabBreakdown,
  };
}

/**
 * Calculate deductions from rental income
 * @param {number} annualRent - Annual gross rental income
 * @param {Object} deductionInputs - User-provided deduction amounts
 * @param {string} deductionMode - 'standard' or 'itemized'
 * @param {Object} rules - Fiscal year rules
 * @returns {Object} Deduction breakdown
 */
function calculateDeductions(annualRent, deductionInputs = {}, deductionMode = 'standard', rules) {
  const deductions = rules.deductions;
  let totalDeductions = 0;
  const breakdown = {};

  if (deductionMode === 'standard' && deductions.standardDeductionPercent > 0) {
    // Standard deduction
    const standardAmount = Math.round(annualRent * deductions.standardDeductionPercent);
    totalDeductions = standardAmount;
    breakdown.standard = standardAmount;
  } else {
    // Itemized deductions
    // Property tax
    if (deductions.itemized.propertyTax && deductionInputs.propertyTax) {
      const amount = Math.round(deductionInputs.propertyTax);
      breakdown.propertyTax = amount;
      totalDeductions += amount;
    }

    // Insurance
    if (deductions.itemized.insurance && deductionInputs.insurance) {
      const amount = Math.round(deductionInputs.insurance);
      breakdown.insurance = amount;
      totalDeductions += amount;
    }

    // Repair and maintenance (with optional cap)
    if (deductions.itemized.repairMaintenance.allowed && deductionInputs.repairMaintenance) {
      let amount = Math.round(deductionInputs.repairMaintenance);
      if (deductions.itemized.repairMaintenance.capApplied) {
        const cap = Math.round(annualRent * deductions.itemized.repairMaintenance.capPercent);
        amount = Math.min(amount, cap);
      }
      breakdown.repairMaintenance = amount;
      totalDeductions += amount;
    }

    // Other allowable deductions
    if (deductions.itemized.other && deductionInputs.other) {
      const amount = Math.round(deductionInputs.other);
      breakdown.other = amount;
      totalDeductions += amount;
    }
  }

  return {
    total: totalDeductions,
    breakdown,
    mode: deductionMode,
  };
}

/**
 * Calculate TDS on rent
 * @param {number} annualRent - Annual rental income
 * @param {Object} rules - Fiscal year rules
 * @returns {Object} TDS breakdown
 */
function calculateTDS(annualRent, rules) {
  const tdsRules = rules.tds;

  if (!tdsRules.applicable) {
    return {
      applicable: false,
      amount: 0,
      rate: 0,
      monthlyAmount: 0,
    };
  }

  const annualTDS = Math.round(annualRent * tdsRules.rate);
  const monthlyTDS = Math.round(annualTDS / 12);

  return {
    applicable: true,
    rate: tdsRules.rate,
    ratePercent: Math.round(tdsRules.rate * 100),
    amount: annualTDS,
    monthlyAmount: monthlyTDS,
    notes: tdsRules.notes,
  };
}

/**
 * Calculate complete rental income tax
 *
 * @param {Object} input
 * @param {number} input.rentAmount - Rent amount (monthly or annual)
 * @param {boolean} input.isAnnual - Whether input is annual (true) or monthly (false)
 * @param {string} input.propertyType - Property type ID
 * @param {string} input.taxpayerType - Taxpayer type ID
 * @param {string} input.fiscalYear - Fiscal year ID (optional)
 * @param {string} input.deductionMode - 'standard' or 'itemized'
 * @param {Object} input.deductions - Deduction amounts (if itemized)
 * @param {number} input.deductions.propertyTax - Property tax paid
 * @param {number} input.deductions.insurance - Insurance premium
 * @param {number} input.deductions.repairMaintenance - Repair/maintenance expenses
 * @param {number} input.deductions.other - Other allowable deductions
 * @returns {Object} Complete rental income breakdown
 */
export function calculateRentalTax({
  rentAmount = 0,
  isAnnual = false,
  propertyType = 'residential',
  taxpayerType = 'individual',
  fiscalYear = null,
  deductionMode = 'standard',
  deductions = {},
}) {
  // === LOOKUP RULES ===
  const activeRules = fiscalYear ? getFiscalYearRules(fiscalYear) : getCurrentFiscalYear();
  if (!activeRules) {
    throw new Error(`Fiscal year ${fiscalYear} not found`);
  }

  // Check taxpayer type
  const taxpayer = TAXPAYER_TYPES[taxpayerType];
  if (!taxpayer) {
    throw new Error(`Unknown taxpayer type: ${taxpayerType}`);
  }

  // For business/company, show warning
  if (taxpayerType === 'business') {
    // Corporate tax treatment differs - still calculate but with warning
  }

  // === NORMALIZE RENT ===
  const monthlyRent = isAnnual ? Math.round(rentAmount / 12) : Math.round(rentAmount);
  const annualRent = monthlyRent * 12;

  // === CALCULATE DEDUCTIONS ===
  const deductionResult = calculateDeductions(
    annualRent,
    deductions,
    deductionMode,
    activeRules
  );

  // === TAXABLE RENTAL INCOME ===
  const taxableIncome = Math.max(0, annualRent - deductionResult.total);

  // === CALCULATE TAX ===
  const taxResult = calculateProgressiveTax(taxableIncome, activeRules.taxSlabs);

  // === TDS ===
  const tdsResult = calculateTDS(annualRent, activeRules);

  // === NET RENTAL INCOME ===
  // Net = Gross - Tax - TDS (if TDS is additional, not a withholding)
  // Note: TDS is typically a withholding against tax liability, not an additional tax
  // For simplicity, we show tax as the main liability
  const annualNet = annualRent - taxResult.totalTax - deductionResult.total;
  const monthlyNet = Math.round(annualNet / 12);

  // === EFFECTIVE TAX RATE ===
  const effectiveTaxRate = annualRent > 0
    ? Math.round((taxResult.totalTax / annualRent) * 10000) / 100
    : 0;

  return {
    // Input echo
    input: {
      rentAmount: monthlyRent,
      isAnnual,
      monthlyRent,
      annualRent,
      propertyType,
      propertyLabel: PROPERTY_TYPES[propertyType]?.label || propertyType,
      taxpayerType,
      taxpayerLabel: taxpayer.label,
      fiscalYear: activeRules.id,
      fiscalYearLabel: activeRules.label,
    },

    // Monthly breakdown
    monthly: {
      gross: monthlyRent,
      tax: Math.round(taxResult.totalTax / 12),
      tds: tdsResult.monthlyAmount,
      net: Math.max(0, monthlyNet),
    },

    // Annual breakdown
    annual: {
      gross: annualRent,
      deductions: deductionResult.total,
      deductionBreakdown: deductionResult.breakdown,
      deductionMode,
      taxableIncome,
      tax: taxResult.totalTax,
      effectiveTaxRate,
      tds: tdsResult.amount,
      net: Math.max(0, annualNet),
    },

    // Tax calculation details
    taxCalculation: {
      slabs: taxResult.slabs,
      totalTax: taxResult.totalTax,
      effectiveRate: taxResult.effectiveRate,
    },

    // TDS details
    tds: tdsResult,

    // Property type
    propertyType: PROPERTY_TYPES[propertyType] || PROPERTY_TYPES.residential,

    // Taxpayer info
    taxpayer: taxpayer,

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
