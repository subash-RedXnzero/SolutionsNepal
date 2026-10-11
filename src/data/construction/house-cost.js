/**
 * House Construction Cost — Nepal Data
 * =====================================
 * All numbers here are planning estimates, not official market prices.
 * Every value is configurable so SolutionsNepal can refresh estimates without
 * rewriting the UI. Percentages sum to 1.0.
 */

export const LOCATION_OPTIONS = [
  {
    id: 'kathmandu-valley',
    label: 'Kathmandu Valley',
    multiplier: 1.0,
    note: 'Kathmandu, Lalitpur, Bhaktapur',
    children: [
      { id: 'kathmandu', label: 'Kathmandu' },
      { id: 'lalitpur', label: 'Lalitpur' },
      { id: 'bhaktapur', label: 'Bhaktapur' },
    ],
  },
  {
    id: 'major-cities',
    label: 'Other Major Cities',
    multiplier: 0.97,
    note: 'Pokhara, Bharatpur, Biratnagar, Butwal, Dharan, Nepalgunj',
    children: [
      { id: 'pokhara', label: 'Pokhara' },
      { id: 'bharatpur', label: 'Bharatpur' },
      { id: 'biratnagar', label: 'Biratnagar' },
      { id: 'butwal', label: 'Butwal' },
      { id: 'dharan', label: 'Dharan' },
      { id: 'nepalgunj', label: 'Nepalgunj' },
      { id: 'other-city', label: 'Other' },
    ],
  },
  { id: 'terai', label: 'Terai', multiplier: 0.94 },
  { id: 'hills', label: 'Hills', multiplier: 0.96 },
  { id: 'custom', label: 'Custom Location', multiplier: 1.0 },
];

export const FLOOR_OPTIONS = [
  { value: 1, label: '1' },
  { value: 1.5, label: '1.5' },
  { value: 2, label: '2' },
  { value: 2.5, label: '2.5' },
  { value: 3, label: '3' },
  { value: 3.5, label: '3.5' },
  { value: 4, label: '4+' },
];

export const PARKING_OPTIONS = [
  { id: 'none', label: 'None', costFactor: 0 },
  { id: 'open', label: 'Open Parking', costFactor: 0.015 },
  { id: 'covered', label: 'Covered Parking', costFactor: 0.03 },
  { id: 'basement', label: 'Basement Parking', costFactor: 0.07 },
];

export const ROOF_OPTIONS = [
  { id: 'flat', label: 'RCC Flat Roof', multiplier: 1.0 },
  { id: 'sloped', label: 'Sloped Roof', multiplier: 1.03 },
  { id: 'mixed', label: 'Mixed', multiplier: 1.02 },
];

export const QUALITY_OPTIONS = [
  {
    id: 'basic',
    label: 'Basic',
    desc: 'Budget conscious construction',
    baseRate: 2850,
  },
  {
    id: 'standard',
    label: 'Standard',
    desc: 'Balanced materials, durability and finish',
    baseRate: 3625,
    recommended: true,
  },
  {
    id: 'premium',
    label: 'Premium',
    desc: 'Higher quality materials and finishes',
    baseRate: 4850,
  },
  { id: 'custom', label: 'Custom', desc: 'Enter your own rate per sq.ft.', baseRate: null },
];

export const CONTINGENCY_OPTIONS = [5, 10, 15];

export const COST_RANGE_PCT = { low: 0.95, high: 1.05 };

export const BREAKDOWN = [
  { key: 'structure', label: 'Structure', pct: 0.18 },
  { key: 'steel', label: 'Steel', pct: 0.16 },
  { key: 'cement', label: 'Cement', pct: 0.08 },
  { key: 'sandAggregate', label: 'Sand & Aggregate', pct: 0.08 },
  { key: 'brickBlock', label: 'Brick / Block', pct: 0.06 },
  { key: 'electrical', label: 'Electrical', pct: 0.05 },
  { key: 'plumbing', label: 'Plumbing', pct: 0.04 },
  { key: 'doorsWindows', label: 'Doors & Windows', pct: 0.07 },
  { key: 'flooring', label: 'Flooring', pct: 0.06 },
  { key: 'painting', label: 'Painting', pct: 0.04 },
  { key: 'kitchen', label: 'Kitchen', pct: 0.05 },
  { key: 'bathroom', label: 'Bathroom', pct: 0.04 },
  { key: 'labour', label: 'Labour', pct: 0.07 },
  { key: 'other', label: 'Other', pct: 0.02 },
];

export const BUDGET_PRESETS = [
  2000000, 3000000, 4000000, 5000000, 7500000, 10000000,
];

export const MONTH_OPTIONS = [24, 36, 48, 60, 72];

export const ADDITIONAL_COST_DEFS = [
  { key: 'architect', label: 'Architect / design fee' },
  { key: 'structural', label: 'Structural engineer' },
  { key: 'municipality', label: 'Municipality approval' },
  { key: 'soilTest', label: 'Soil test' },
  { key: 'boundaryWall', label: 'Boundary wall' },
  { key: 'gate', label: 'Gate' },
  { key: 'waterConnection', label: 'Water connection' },
  { key: 'electricityConnection', label: 'Electricity connection' },
  { key: 'septicTank', label: 'Septic tank' },
  { key: 'landscaping', label: 'Landscaping' },
  { key: 'interior', label: 'Interior' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'appliances', label: 'Appliances' },
  { key: 'solar', label: 'Solar system' },
];

export const INCLUDED_ITEMS = [
  'Structural construction',
  'Basic material costs',
  'Labour',
  'Electrical work',
  'Plumbing',
  'Doors and windows',
  'Flooring',
  'Painting',
  'Kitchen and bathroom allowance',
];

export const NOT_INCLUDED_ITEMS = [
  'Land purchase',
  'Architect fees',
  'Structural engineer fees',
  'Municipality approval fees',
  'Soil testing',
  'Boundary wall',
  'Compound work',
  'Landscaping',
  'Major excavation',
  'Furniture',
  'Appliances',
  'Solar system',
  'Interior decoration',
  'Utility connection charges',
  'Financing and loan costs',
];

export function getLocationMeta(id) {
  for (const loc of LOCATION_OPTIONS) {
    if (loc.id === id) return loc;
    if (loc.children) {
      const child = loc.children.find((c) => c.id === id);
      if (child) return { ...child, multiplier: loc.multiplier, parentLabel: loc.label };
    }
  }
  return null;
}

export function getQualityMeta(id) {
  return QUALITY_OPTIONS.find((q) => q.id === id) || null;
}

export function getRoofMeta(id) {
  return ROOF_OPTIONS.find((r) => r.id === id) || null;
}
