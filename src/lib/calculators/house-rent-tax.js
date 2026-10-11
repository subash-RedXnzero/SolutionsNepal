/**
 * Nepal House Rent Tax Calculator Engine
 * =======================================
 * Calculates house rent tax, TDS, and net rental income.
 *
 * CRITICAL DISTINCTION:
 * - Municipal House Rent Tax (individual → individual): flat % on gross rent
 * - Federal TDS on Rent (company → individual): 10% withholding, final tax
 * - Business Income (company landlords): progressive tax slabs
 *
 * The engine determines which scenario applies and calculates accordingly.
 *
 * SOURCES: Income Tax Act 2058, Finance Act 2083, Local Government Operation Act 2074
 * LAST VERIFIED: 2026-08-19
 */

import {
  getCurrentFiscalYear,
  getFiscalYearRules,
  PROPERTY_TYPES,
  TAXPAYER_TYPES,
  TENANT_TYPES,
  determineScenario,
  getMunicipalityRate,
  SCENARIOS,
} from '../../data/nepal/house-rent/rules.js';

/**
 * Format a number as NPR currency
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
 * Format a number with commas
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(Math.round(num));
}

/**
 * Validate input parameters
 * @param {Object} input
 * @returns {Object} { valid: boolean, error: string }
 */
function validateInput(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid input.' };
  }

  const { monthlyRent, annualRent, isAnnual } = input;
  const rent = isAnnual ? annualRent : monthlyRent;

  if (rent === undefined || rent === null || rent === '') {
    return { valid: false, error: 'Please enter your rental amount.' };
  }

  const rentNum = Number(rent);
  if (isNaN(rentNum)) {
    return { valid: false, error: 'Please enter a valid rental amount.' };
  }

  if (rentNum < 0) {
    return { valid: false, error: 'Rent cannot be negative.' };
  }

  if (rentNum === 0) {
    return { valid: false, error: 'Please enter a rental amount greater than zero.' };
  }

  return { valid: true, error: null };
}

/**
 * Calculate progressive income tax using tax slabs
 * (Only used for business/corporate landlords)
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
      label: slab.label,
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
 * Main calculation function
 *
 * @param {Object} input
 * @param {number} input.monthlyRent - Monthly rent amount (NPR)
 * @param {number} input.annualRent - Annual rent amount (NPR)
 * @param {boolean} input.isAnnual - Whether input is annual
 * @param {string} input.propertyType - 'residential' | 'commercial' | 'other'
 * @param {string} input.taxpayerType - 'individual' | 'business'
 * @param {string} input.tenantType - 'individual' | 'company'
 * @param {string} input.fiscalYear - e.g., '2083/84'
 * @param {string} input.province - Province ID
 * @param {string} input.district - District ID
 * @param {string} input.municipality - Municipality ID
 * @returns {Object} Complete calculation result
 */
export function calculateHouseRentTax({
  monthlyRent = 0,
  annualRent = 0,
  isAnnual = false,
  propertyType = 'residential',
  taxpayerType = 'individual',
  tenantType = 'individual',
  fiscalYear = '2083/84',
  province = '',
  district = '',
  municipality = '',
} = {}) {
  // === VALIDATE ===
  const validation = validateInput({ monthlyRent, annualRent, isAnnual });
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // === LOOKUP RULES ===
  const activeRules = fiscalYear ? getFiscalYearRules(fiscalYear) : getCurrentFiscalYear();
  if (!activeRules) {
    throw new Error(`Fiscal year ${fiscalYear} not found.`);
  }

  // === DETERMINE SCENARIO ===
  const scenarioInfo = determineScenario(taxpayerType, tenantType, propertyType);

  // === NORMALIZE RENT ===
  const monthlyRentAmount = isAnnual ? Math.round(annualRent / 12) : Math.round(monthlyRent);
  const annualRentAmount = monthlyRentAmount * 12;

  // === CALCULATE BASED ON SCENARIO ===
  let result = {
    input: {
      monthlyRent: monthlyRentAmount,
      annualRent: annualRentAmount,
      isAnnual,
      propertyType,
      propertyLabel: PROPERTY_TYPES[propertyType]?.label || propertyType,
      taxpayerType,
      taxpayerLabel: TAXPAYER_TYPES[taxpayerType]?.label || taxpayerType,
      tenantType,
      tenantLabel: TENANT_TYPES[tenantType]?.label || tenantType,
      fiscalYear: activeRules.id,
      fiscalYearLabel: activeRules.label,
    },
    scenario: scenarioInfo,
    taxRate: 0,
    taxRatePercent: 0,
    taxableAmount: 0,
    estimatedTax: 0,
    localTax: 0,
    localTaxRate: 0,
    localTaxVerified: false,
    otherCharges: 0,
    totalTax: 0,
    netAnnualIncome: 0,
    netMonthlyIncome: 0,
    monthly: { gross: 0, tax: 0, localTax: 0, otherCharges: 0, net: 0 },
    annual: { gross: 0, deductions: 0, taxableIncome: 0, tax: 0, localTax: 0, otherCharges: 0, net: 0 },
    breakdown: [],
    notes: [],
    warnings: [],
  };

  switch (scenarioInfo.scenario) {
    case SCENARIOS.MUNICIPAL: {
      // === MUNICIPAL HOUSE RENT TAX ===
      // Flat % on gross rental income, no deductions
      const municipalTaxInfo = activeRules.municipalTax;
      let taxRate = municipalTaxInfo.defaultRate;
      let municipalityName = '';
      let rateVerified = false;

      // Try to get location-specific rate
      if (province && district && municipality) {
        const muniRate = getMunicipalityRate(province, district, municipality);
        if (muniRate) {
          taxRate = muniRate.rate;
          municipalityName = muniRate.name;
          rateVerified = muniRate.verified;
        }
      }

      const estimatedTax = Math.round(annualRentAmount * taxRate);

      result.taxRate = taxRate;
      result.taxRatePercent = Math.round(taxRate * 100);
      result.taxableAmount = annualRentAmount;
      result.estimatedTax = estimatedTax;
      result.localTax = 0;
      result.totalTax = estimatedTax;
      result.netAnnualIncome = Math.max(0, annualRentAmount - estimatedTax);
      result.netMonthlyIncome = Math.round(result.netAnnualIncome / 12);
      result.taxLabel = 'Municipal House Rent Tax';
      result.taxDescription = 'Ghar Bhada Kar — collected by ward office / municipality';

      result.monthly = {
        gross: monthlyRentAmount,
        tax: Math.round(estimatedTax / 12),
        localTax: 0,
        otherCharges: 0,
        net: Math.round(result.netAnnualIncome / 12),
      };

      result.annual = {
        gross: annualRentAmount,
        deductions: 0,
        taxableIncome: annualRentAmount,
        tax: estimatedTax,
        localTax: 0,
        otherCharges: 0,
        net: result.netAnnualIncome,
      };

      result.breakdown = [
        { label: 'Annual Gross Rent', amount: annualRentAmount, type: 'info' },
        { label: `Municipal House Rent Tax (${Math.round(taxRate * 100)}%)`, amount: estimatedTax, type: 'tax' },
      ];

      result.notes.push(
        'Municipal house rent tax is a flat percentage on gross rental income.',
        'No deductions are allowed under the flat municipal rate.',
        'This is a final tax — rental income does NOT enter your income tax slab.',
        'Pay at your ward office via self-declaration.',
      );

      if (municipalityName) {
        result.notes.push(`Rate applied: ${municipalityName} at ${Math.round(taxRate * 100)}%.`);
      } else {
        result.notes.push(`Default rate applied: ${Math.round(taxRate * 100)}%. Verify your municipality's actual rate.`);
      }
      break;
    }

    case SCENARIOS.FEDERAL_TDS: {
      // === FEDERAL TDS ON RENT ===
      // Company tenant deducts 10% before paying rent
      const tdsInfo = activeRules.federalTDS;
      const isResident = true; // Default assumption for this calculator
      const tdsRate = isResident ? tdsInfo.rates.resident.rate : tdsInfo.rates.nonResident.rate;
      const estimatedTax = Math.round(annualRentAmount * tdsRate);

      result.taxRate = tdsRate;
      result.taxRatePercent = Math.round(tdsRate * 100);
      result.taxableAmount = annualRentAmount;
      result.estimatedTax = estimatedTax;
      result.totalTax = estimatedTax;
      result.netAnnualIncome = Math.max(0, annualRentAmount - estimatedTax);
      result.netMonthlyIncome = Math.round(result.netAnnualIncome / 12);
      result.taxLabel = 'Federal TDS on Rent';
      result.taxDescription = 'Withholding deducted by company tenant (Section 88)';

      result.monthly = {
        gross: monthlyRentAmount,
        tax: Math.round(estimatedTax / 12),
        localTax: 0,
        otherCharges: 0,
        net: Math.round(result.netAnnualIncome / 12),
      };

      result.annual = {
        gross: annualRentAmount,
        deductions: 0,
        taxableIncome: annualRentAmount,
        tax: estimatedTax,
        localTax: 0,
        otherCharges: 0,
        net: result.netAnnualIncome,
      };

      result.breakdown = [
        { label: 'Annual Gross Rent', amount: annualRentAmount, type: 'info' },
        { label: `Federal TDS (${Math.round(tdsRate * 100)}%)`, amount: estimatedTax, type: 'tax' },
      ];

      result.notes.push(
        'Company tenant deducts TDS before paying rent.',
        'Under Section 92, this is the FINAL tax for individual landlords.',
        'No further income tax filing needed on this rent.',
        'You should receive a TDS certificate (Form-TDS-S) from the tenant.',
      );
      break;
    }

    case SCENARIOS.BUSINESS_INCOME: {
      // === CORPORATE / BUSINESS INCOME ===
      // Rental income is part of business income, taxed at corporate rate
      const corporateRate = activeRules.corporateTax.rate;
      const estimatedTax = Math.round(annualRentAmount * corporateRate);

      result.taxRate = corporateRate;
      result.taxRatePercent = Math.round(corporateRate * 100);
      result.taxableAmount = annualRentAmount;
      result.estimatedTax = estimatedTax;
      result.totalTax = estimatedTax;
      result.netAnnualIncome = Math.max(0, annualRentAmount - estimatedTax);
      result.netMonthlyIncome = Math.round(result.netAnnualIncome / 12);
      result.taxLabel = 'Corporate Income Tax';
      result.taxDescription = 'Rental income is part of business income (25% corporate rate)';

      result.monthly = {
        gross: monthlyRentAmount,
        tax: Math.round(estimatedTax / 12),
        localTax: 0,
        otherCharges: 0,
        net: Math.round(result.netAnnualIncome / 12),
      };

      result.annual = {
        gross: annualRentAmount,
        deductions: 0,
        taxableIncome: annualRentAmount,
        tax: estimatedTax,
        localTax: 0,
        otherCharges: 0,
        net: result.netAnnualIncome,
      };

      result.breakdown = [
        { label: 'Annual Gross Rent', amount: annualRentAmount, type: 'info' },
        { label: `Corporate Income Tax (${Math.round(corporateRate * 100)}%)`, amount: estimatedTax, type: 'tax' },
      ];

      result.notes.push(
        'For corporate landlords, rental income is treated as business income.',
        'Standard corporate tax rate is 25% (30% for banks/insurance/telecom).',
        'This is a simplified estimate. Actual tax depends on total business income and deductions.',
        'Consult a tax professional for accurate corporate tax calculation.',
      );
      result.warnings.push(
        'This is a simplified corporate tax estimate. Corporate tax involves depreciation, allowable expenses, and other complex rules.',
      );
      break;
    }

    default:
      break;
  }

  // === ADD MUNICIPAL TAX INFO IF APPLICABLE (for other scenarios) ===
  if (scenarioInfo.scenario !== SCENARIOS.MUNICIPAL) {
    result.localTaxRate = activeRules.municipalTax.defaultRate;
    result.localTaxNotes = activeRules.municipalTax.notes;
  }

  // === EFFECTIVE TAX RATE ===
  result.effectiveTaxRate = annualRentAmount > 0
    ? Math.round((result.totalTax / annualRentAmount) * 10000) / 100
    : 0;

  // === METADATA ===
  result.lastUpdated = activeRules.lastVerified;
  result.sources = activeRules.sources;
  result.needsVerification = activeRules.needsVerification;

  return result;
}
