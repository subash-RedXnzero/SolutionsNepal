/**
 * Bike & Car Ownership Cost — Nepal Data
 * ======================================
 * Nepal-specific reference values for the ownership cost calculator.
 *
 * TRUST RULES (no fake pricing):
 * - Every value here is an EXAMPLE starting point, never an official rate.
 * - The UI must label examples as examples and let users override them.
 * - Blank fields mean "not included", never zero-filled guesses.
 * - Fuel reference prices are refreshed from SolutionsNepal's NOC fuel-price
 *   service at build time; this file only holds the fallback shape.
 *
 * UPDATING FOR A NEW FISCAL YEAR:
 * - Bump FISCAL_YEAR + LAST_CHECKED below.
 * - Review EXAMPLE values against current market reality.
 * - Vehicle tax / insurance rules live in src/data/nepal/vehicle/ and
 *   src/lib/calculators/vehicle-tax.js — link users there, don't copy
 *   rates here.
 */

export const OWNERSHIP_DATA_META = {
  fiscalYear: 'FY 2083/84',
  lastChecked: 'September 2026',
  sources: [
    { name: 'Nepal Oil Corporation (NOC)', note: 'Fuel reference prices (via SolutionsNepal fuel-price service)' },
    { name: 'Department of Transport Management', note: 'Vehicle tax & renewal rules (see Vehicle Tax calculator)' },
  ],
};

/** Vehicle types with example-only starting values (UI labels them as examples). */
export const VEHICLE_TYPES = [
  {
    id: 'bike',
    label: 'Motorcycle / Scooter',
    icon: 'Bike',
    examples: {
      purchasePrice: 300000,
      mileage: 45, // km per litre
      monthlyKm: 600,
    },
    mileageHint: 'Example: 45 km/l',
  },
  {
    id: 'car',
    label: 'Car / Jeep',
    icon: 'Car',
    examples: {
      purchasePrice: 3500000,
      mileage: 14, // km per litre
      monthlyKm: 1000,
    },
    mileageHint: 'Example: 14 km/l',
  },
];

export const FUEL_TYPES = [
  { id: 'petrol', label: 'Petrol', efficiencyUnit: 'km/l', priceUnit: 'Rs./litre', priceLabel: 'Fuel price per litre' },
  { id: 'diesel', label: 'Diesel', efficiencyUnit: 'km/l', priceUnit: 'Rs./litre', priceLabel: 'Fuel price per litre' },
  { id: 'electric', label: 'Electric', efficiencyUnit: 'km/kWh', priceUnit: 'Rs./kWh', priceLabel: 'Electricity price per kWh' },
];

/** EV example efficiency (km per kWh) — example only, user-overridable. */
export const EV_EFFICIENCY_EXAMPLE = 6;

/** Ownership period options (years). */
export const PERIOD_OPTIONS = [1, 3, 5, 10];
export const DEFAULT_PERIOD_YEARS = 5;

/** Annual cost fields (amounts entered by user; converted to monthly in results). */
export const ANNUAL_COST_FIELDS = [
  { key: 'tax', label: 'Tax + renewal' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'otherAnnual', label: 'Other' },
];

/** Monthly recurring cost fields (all optional). */
export const MONTHLY_COST_FIELDS = [
  { key: 'parking', label: 'Parking' },
  { key: 'tolls', label: 'Tolls' },
  { key: 'otherMonthly', label: 'Other' },
];

/** Detailed maintenance fields (annual amounts; Simple mode uses one total instead). */
export const MAINTENANCE_FIELDS = [
  { key: 'servicing', label: 'Regular servicing' },
  { key: 'engineOil', label: 'Engine oil' },
  { key: 'tyres', label: 'Tyres' },
  { key: 'battery', label: 'Battery' },
  { key: 'brakes', label: 'Brake components' },
  { key: 'repairs', label: 'Repairs' },
  { key: 'otherMaint', label: 'Other maintenance' },
];

/** Result breakdown categories (id must match the engine's breakdown ids). */
export const OWNERSHIP_CATEGORIES = [
  { id: 'fuel', name: 'Fuel', icon: 'Fuel' },
  { id: 'loan', name: 'Loan / EMI', icon: 'Landmark' },
  { id: 'maintenance', name: 'Maintenance', icon: 'Wrench' },
  { id: 'insurance', name: 'Insurance', icon: 'ShieldCheck' },
  { id: 'taxRenewal', name: 'Tax & Renewal', icon: 'Receipt' },
  { id: 'parking', name: 'Parking', icon: 'SquareParking' },
  { id: 'other', name: 'Other', icon: 'Wallet' },
];

export const OWNERSHIP_LABELS = {
  fuel: 'Fuel',
  loan: 'Loan / EMI',
  maintenance: 'Maintenance',
  insurance: 'Insurance',
  taxRenewal: 'Tax & Renewal',
  parking: 'Parking',
  other: 'Other',
};

export const STORAGE_KEY = 'nk-ownership-cost-v1';
