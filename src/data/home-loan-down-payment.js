/**
 * Home Loan Down Payment — Centralized assumptions & options (Nepal)
 * ==================================================================
 * All editable options and defaults live here. Location is kept for
 * future bank/LTV rules — do NOT invent location-based requirements.
 */

export const LAST_CHECKED = 'September 2026';

export const PROPERTY_TYPES = [
  { id: 'house', label: 'House' },
  { id: 'apartment', label: 'Apartment' },
  { id: 'land-house', label: 'Land + House' },
  { id: 'residential', label: 'Residential Property' },
];

export const LOCATIONS = [
  { id: 'ktm', label: 'Kathmandu Valley' },
  { id: 'city', label: 'Other Major City' },
  { id: 'other', label: 'Other Area' },
];

/** Quick-select down payment percentages. */
export const DP_PRESETS = [10, 20, 25, 30, 40];

/** Scenario comparison percentages (auto table). */
export const SCENARIO_PCTS = [10, 20, 30, 40];

export const TENURE_YEARS = [5, 10, 15, 20, 25, 30];

export const DEFAULTS = {
  propertyPrice: 10000000,
  downPaymentPct: 20,
  interestRatePct: 9.5,
  tenureYears: 20,
  propertyTypeId: 'house',
  locationId: 'ktm',
};

export const LIMITS = {
  maxAmount: 1e11,
  maxRatePct: 50,
  maxTenureYears: 30,
};
