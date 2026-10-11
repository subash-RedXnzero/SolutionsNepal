/**
 * Foreign Employment Cost — Data
 * ===============================
 * Country list, job categories, recruitment methods and expense fields.
 *
 * TRUST RULE: officialFees holds ONLY amounts backed by an official source
 * (each with source + lastChecked). SolutionsNepal currently has no verified
 * fixed fee for these routes because charges vary by employer, agency,
 * visa type and fiscal year — so every officialFees map is intentionally
 * empty and every calculator field starts blank for the user to fill.
 *
 * To add a verified fee later: put { amount, source, sourceUrl, lastChecked }
 * under the country + key, and the UI will surface it as a default.
 */

export const LAST_CHECKED = 'September 2026';

export const foreignEmploymentData = {
  'saudi-arabia': {
    name: 'Saudi Arabia',
    currency: 'SAR',
    officialFees: {},
    notes: ['Workers are usually paid in Saudi Riyal (SAR).'],
    sources: [],
  },
  qatar: {
    name: 'Qatar',
    currency: 'QAR',
    officialFees: {},
    notes: ['Workers are usually paid in Qatari Riyal (QAR).'],
    sources: [],
  },
  uae: {
    name: 'United Arab Emirates',
    currency: 'AED',
    officialFees: {},
    notes: ['Workers are usually paid in UAE Dirham (AED).'],
    sources: [],
  },
  kuwait: {
    name: 'Kuwait',
    currency: 'KWD',
    officialFees: {},
    notes: ['Workers are usually paid in Kuwaiti Dinar (KWD).'],
    sources: [],
  },
  malaysia: {
    name: 'Malaysia',
    currency: 'MYR',
    officialFees: {},
    notes: ['Workers are usually paid in Malaysian Ringgit (MYR).'],
    sources: [],
  },
  bahrain: {
    name: 'Bahrain',
    currency: 'BHD',
    officialFees: {},
    notes: ['Workers are usually paid in Bahraini Dinar (BHD).'],
    sources: [],
  },
  oman: {
    name: 'Oman',
    currency: 'OMR',
    officialFees: {},
    notes: ['Workers are usually paid in Omani Rial (OMR).'],
    sources: [],
  },
  'south-korea': {
    name: 'South Korea',
    currency: 'KRW',
    officialFees: {},
    notes: ['Workers are usually paid in South Korean Won (KRW).', 'Korea-bound workers often go through official government (EPS) channels.'],
    sources: [],
  },
  japan: {
    name: 'Japan',
    currency: 'JPY',
    officialFees: {},
    notes: ['Workers are usually paid in Japanese Yen (JPY).'],
    sources: [],
  },
  romania: {
    name: 'Romania',
    currency: 'RON',
    officialFees: {},
    notes: ['Workers are usually paid in Romanian Leu (RON).'],
    sources: [],
  },
  croatia: {
    name: 'Croatia',
    currency: 'EUR',
    officialFees: {},
    notes: ['Workers are usually paid in Euro (EUR).'],
    sources: [],
  },
  other: {
    name: 'Other country',
    currency: '',
    officialFees: {},
    notes: ['Costs vary widely — rely on your written offer and receipts.'],
    sources: [],
  },
};

export const DESTINATIONS = Object.entries(foreignEmploymentData).map(([id, c]) => ({
  id,
  name: c.name,
  currency: c.currency,
}));

export const QUICK_DESTINATIONS = ['saudi-arabia', 'qatar', 'uae', 'malaysia', 'japan', 'south-korea'];

export const JOB_CATEGORIES = [
  { id: 'construction', label: 'Construction' },
  { id: 'factory', label: 'Factory' },
  { id: 'hotel', label: 'Hotel / Restaurant' },
  { id: 'security', label: 'Security' },
  { id: 'driver', label: 'Driver' },
  { id: 'domestic', label: 'Domestic work' },
  { id: 'caregiver', label: 'Caregiver' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'skilled', label: 'Skilled work' },
  { id: 'other', label: 'Other' },
];

export const RECRUITMENT_METHODS = [
  {
    id: 'manpower',
    title: 'Manpower / Recruitment Agency',
    desc: 'Going through a licensed agency',
  },
  {
    id: 'direct',
    title: 'Direct Employment',
    desc: 'Hired directly by the employer',
  },
  {
    id: 'government',
    title: 'Government / Official Recruitment',
    desc: 'EPS and other official channels',
  },
  {
    id: 'unsure',
    title: 'Not sure',
    desc: 'Show all possible expenses',
  },
];

/**
 * Expense fields with plain-language explanations (no amounts — amounts
 * are user-entered unless a verified official fee exists in the data).
 */
export const EXPENSE_FIELDS = [
  { key: 'visa', label: 'Visa / work permit', hint: 'Visa stamping, work permit and related government charges.' },
  { key: 'medical', label: 'Medical', hint: 'Mandatory health checkup at an approved medical center.' },
  { key: 'insurance', label: 'Insurance', hint: 'Migrant worker insurance and welfare fund coverage.' },
  { key: 'orientation', label: 'Orientation', hint: 'Pre-departure orientation training before you fly.' },
  { key: 'recruitment', label: 'Recruitment / service fee', hint: 'Service charge taken by a manpower or recruitment agency, if any.' },
  { key: 'airTicket', label: 'Air ticket', hint: 'One-way airfare to the destination — sometimes the employer covers it.' },
  { key: 'documentation', label: 'Documentation', hint: 'Passport, photos, attestation, police report and other paperwork.' },
  { key: 'other', label: 'Other expenses', hint: 'Anything else you expect to pay for.' },
];

export const EXPENSE_KEYS = EXPENSE_FIELDS.map((f) => f.key);

/**
 * Expense fields hidden per recruitment method (no agency involved, so no
 * agency fee). Hidden fields are excluded from the estimate entirely.
 */
export const HIDDEN_BY_METHOD = {
  manpower: [],
  direct: ['recruitment'],
  government: ['recruitment'],
  unsure: [],
};

export const METHOD_NOTES = {
  direct: 'No agency is involved, so no recruitment/service fee is included. Add one yourself if your case is different.',
  government: 'Official channels normally involve no agency commission, so no recruitment/service fee is included. Confirm airfare with your offer letter — it is sometimes covered.',
};

export const OFFICIAL_SOURCES = [
  { name: 'Department of Foreign Employment (DoFE)', url: 'https://dofe.gov.np' },
  { name: 'Ministry of Labour, Employment and Social Security', url: 'https://moless.gov.np' },
  { name: 'Foreign Employment Board', url: 'https://feb.gov.np' },
];

/** Salary currencies offered for the optional foreign-currency salary. */
export const SALARY_CURRENCIES = [
  'SAR', 'QAR', 'AED', 'KWD', 'BHD', 'OMR', 'MYR', 'KRW', 'JPY', 'USD', 'EUR', 'RON',
];
