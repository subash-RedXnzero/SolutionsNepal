/**
 * Government Service Cost + Document Checklist — Data
 * ===================================================
 * Single source of truth for every service on
 * /nepal/government-service-cost and its detail pages.
 *
 * TRUST RULES (no fake pricing):
 * - A fee row is marked verified:true ONLY when it is backed by an official
 *   source or a corroborated 2025–2026 report. Everything else is an
 *   unverified placeholder and the UI must badge it as such.
 * - amount:null means "varies / confirm at the office" — never invent one.
 * - amount:0 means confirmed free.
 * - officialSource is set ONLY to real government URLs. When in doubt it is
 *   null and the UI hides the section instead of linking somewhere wrong.
 *
 * ADDING A SERVICE: append one object to SERVICES with a unique id/slug.
 * The hub, detail pages, sitemap, search index and tests pick it up
 * automatically — no other file needs to change.
 */

export const DATA_LAST_REVIEWED = 'September 2026';

export const SERVICE_CATEGORIES = [
  { id: 'citizenship', name: 'Citizenship', icon: 'IdCard' },
  { id: 'passport', name: 'Passport', icon: 'BookOpen' },
  { id: 'driving-license', name: 'Driving License', icon: 'Car' },
  { id: 'national-id', name: 'National ID', icon: 'Fingerprint' },
  { id: 'tax', name: 'Tax', icon: 'ReceiptText' },
  { id: 'vehicles', name: 'Vehicles', icon: 'Truck' },
  { id: 'business', name: 'Business', icon: 'Briefcase' },
  { id: 'land', name: 'Land', icon: 'Landmark' },
  { id: 'foreign-employment', name: 'Foreign Employment', icon: 'Plane' },
];

/** Compact popular-service shortcuts shown on the hub. */
export const POPULAR_SERVICES = [
  { slug: 'ordinary-passport', label: 'Passport' },
  { slug: 'new-driving-license', label: 'Driving License' },
  { slug: 'new-citizenship', label: 'Citizenship' },
  { slug: 'nid-registration', label: 'National ID' },
  { slug: 'individual-pan', label: 'PAN Card' },
  { slug: 'bluebook-renewal', label: 'Vehicle Renewal' },
  { slug: 'company-registration', label: 'Company Registration' },
  { slug: 'land-registration', label: 'Land Registration' },
];

export const SERVICES = [
  // ── Citizenship ────────────────────────────────────────────
  {
    id: 'new-citizenship',
    slug: 'new-citizenship',
    name: 'New Citizenship Certificate',
    category: 'citizenship',
    description: 'First-time Nepali citizenship certificate by descent.',
    eligibility: 'Nepali citizens by descent, generally from age 16',
    office: 'District Administration Office (DAO)',
    method: 'In-person application at the DAO',
    validity: 'Lifetime — update it after marriage or migration if details change',
    processingTime: 'Varies by district — often within the same week',
    fees: [
      { label: 'Application fee', amount: null, note: 'Nominal if any — confirm at your DAO', verified: false },
    ],
    documents: [
      { label: 'Birth registration certificate' },
      { label: "Parents' citizenship certificates" },
      { label: 'Ward recommendation letter (sifaris)' },
      { label: 'Passport-size photos' },
      { label: 'Marriage certificate', note: 'If married' },
    ],
    steps: [
      { title: 'Collect documents', text: 'Gather birth registration, parents’ citizenship and photos.' },
      { title: 'Ward recommendation', text: 'Get a sifaris letter from your ward office.' },
      { title: 'Submit at DAO', text: 'File the application at your District Administration Office.' },
      { title: 'Verification', text: 'Officials verify your documents and record your details.' },
      { title: 'Collect certificate', text: 'Collect your citizenship certificate once issued.' },
    ],
    notes: [
      'Original documents may be required.',
      'Requirements can vary slightly by district.',
      'Confirm the current document list at your DAO before applying.',
    ],
    links: [],
    officialSource: { label: 'Ministry of Home Affairs', url: 'https://www.moha.gov.np' },
    lastUpdated: null,
    popular: true,
  },
  {
    id: 'citizenship-copy',
    slug: 'citizenship-copy',
    name: 'Citizenship Copy (Pratilipi)',
    category: 'citizenship',
    description: 'Replacement copy for a lost, damaged or worn-out citizenship certificate.',
    eligibility: 'Holders of a Nepali citizenship certificate',
    office: 'District Administration Office (DAO)',
    method: 'In-person application at the DAO',
    validity: 'Same standing as the original certificate',
    processingTime: 'Varies by district',
    fees: [
      { label: 'Copy fee', amount: null, note: 'Nominal fee — confirm at your DAO', verified: false },
    ],
    documents: [
      { label: 'Written application for a copy' },
      { label: 'Police report', note: 'If the original was lost' },
      { label: 'Ward recommendation letter (sifaris)' },
      { label: 'Passport-size photos' },
      { label: 'Copy of old citizenship', note: 'If available' },
    ],
    steps: [
      { title: 'File a report', text: 'If lost, report it at your local police station first.' },
      { title: 'Ward recommendation', text: 'Get a sifaris letter from your ward office.' },
      { title: 'Apply at DAO', text: 'Submit the application with supporting documents.' },
      { title: 'Verification', text: 'Officials match your record in the citizenship register.' },
      { title: 'Collect copy', text: 'Collect the replacement copy (pratilipi).' },
    ],
    notes: [
      'Original documents may be required.',
      'Confirm the current fee and document list at your DAO.',
    ],
    links: [],
    officialSource: { label: 'Ministry of Home Affairs', url: 'https://www.moha.gov.np' },
    lastUpdated: null,
    popular: false,
  },
  {
    id: 'citizenship-correction',
    slug: 'citizenship-correction',
    name: 'Citizenship Correction',
    category: 'citizenship',
    description: 'Correct name, date of birth or other details on a citizenship certificate.',
    eligibility: 'Holders with an error on their certificate',
    office: 'District Administration Office (DAO)',
    method: 'In-person application at the DAO',
    validity: 'Corrected certificate replaces the old record',
    processingTime: 'Varies by district and case complexity',
    fees: [
      { label: 'Correction fee', amount: null, note: 'Confirm at your DAO', verified: false },
    ],
    documents: [
      { label: 'Written correction application' },
      { label: 'Original citizenship certificate' },
      { label: 'Supporting proof', note: 'Birth registration, academic certificates or other records showing the correct detail' },
      { label: 'Ward recommendation letter (sifaris)' },
    ],
    steps: [
      { title: 'Gather proof', text: 'Collect documents that prove the correct name, date or detail.' },
      { title: 'Ward recommendation', text: 'Get a sifaris letter from your ward office.' },
      { title: 'Apply at DAO', text: 'Submit the correction request with evidence.' },
      { title: 'Review', text: 'Officials review the case — complex cases can take longer.' },
      { title: 'Collect corrected copy', text: 'Collect the corrected certificate once approved.' },
    ],
    notes: [
      'Strong supporting evidence speeds up approval.',
      'Confirm the process at your DAO, as complex cases vary.',
    ],
    links: [],
    officialSource: { label: 'Ministry of Home Affairs', url: 'https://www.moha.gov.np' },
    lastUpdated: null,
    popular: false,
  },

  // ── Passport ───────────────────────────────────────────────
  {
    id: 'ordinary-passport',
    slug: 'ordinary-passport',
    name: 'Ordinary Passport (34 pages)',
    category: 'passport',
    description: 'Apply for a new 34-page ordinary Nepali e-passport.',
    eligibility: 'Nepali citizens',
    office: 'Department of Passports, Tripureshwar / District Administration Office',
    method: 'Online pre-enrollment + in-person biometrics',
    validity: '10 years for adults',
    processingTime: '11–15 working days (regular)',
    fees: [
      { label: '34-page ordinary (regular)', amount: 5000, note: '11–15 working days', verified: true },
      { label: '66-page frequent-traveller (regular)', amount: 10000, note: '11–15 working days', verified: true },
    ],
    documents: [
      { label: 'Nepali citizenship certificate' },
      { label: 'National ID number/card', note: 'If available' },
      { label: 'Online pre-enrollment confirmation' },
      { label: 'Payment receipt', note: 'eSewa, Khalti, Connect IPS or bank deposit' },
    ],
    steps: [
      { title: 'Pre-enroll online', text: 'Fill the pre-enrollment form on the Department of Passports website.' },
      { title: 'Pay the fee', text: 'Pay online via eSewa, Khalti, Connect IPS or a bank deposit.' },
      { title: 'Book appointment', text: 'Select your date and office for biometric capture.' },
      { title: 'Visit office', text: 'Bring original documents for photo, fingerprints and verification.' },
      { title: 'Collect passport', text: 'Collect it after processing — track status on the department portal.' },
    ],
    notes: [
      'No extra payment is taken at the counter beyond the official fee.',
      'Province DAO applications take a few extra transit days.',
      'Government fees can change — verify on the department site before paying.',
    ],
    links: [{ label: 'Passport-size photo tool', href: '/tools/passport-photo-resizer' }],
    officialSource: { label: 'Department of Passports', url: 'https://nepalpassport.gov.np' },
    lastUpdated: '2026-05',
    popular: true,
  },
  {
    id: 'passport-renewal',
    slug: 'passport-renewal',
    name: 'Passport Renewal',
    category: 'passport',
    description: 'Renew an expired or expiring Nepali e-passport.',
    eligibility: 'Holders of an expired or expiring Nepali passport',
    office: 'Department of Passports, Tripureshwar / District Administration Office',
    method: 'Online pre-enrollment + in-person biometrics',
    validity: '10 years for adults from reissue',
    processingTime: '11–15 working days (regular)',
    fees: [
      { label: '34-page renewal (regular)', amount: 5000, verified: true },
      { label: '66-page renewal (regular)', amount: 10000, verified: true },
      { label: 'Minor below 18 (34-page)', amount: 2500, note: '5-year validity for minors', verified: true },
    ],
    documents: [
      { label: 'Old passport' },
      { label: 'Nepali citizenship certificate' },
      { label: 'National ID number/card', note: 'If available' },
      { label: 'Online pre-enrollment confirmation' },
      { label: 'Payment receipt' },
    ],
    steps: [
      { title: 'Pre-enroll online', text: 'Fill the renewal pre-enrollment form.' },
      { title: 'Pay the fee', text: 'Pay online or at a designated bank.' },
      { title: 'Book appointment', text: 'Choose your date and office.' },
      { title: 'Visit office', text: 'Carry your old passport plus originals for verification.' },
      { title: 'Collect new passport', text: 'Collect it once processing completes.' },
    ],
    notes: [
      'Renew up to a year before expiry to avoid travel disruption.',
      'Carry both passports when travelling if the old one holds valid visas.',
      'Government fees can change — verify before paying.',
    ],
    links: [{ label: 'Passport-size photo tool', href: '/tools/passport-photo-resizer' }],
    officialSource: { label: 'Department of Passports', url: 'https://nepalpassport.gov.np' },
    lastUpdated: '2026-05',
    popular: false,
  },
  {
    id: 'urgent-passport',
    slug: 'urgent-passport',
    name: 'Urgent / Fast-Track Passport',
    category: 'passport',
    description: 'Faster passport issuance and replacement for lost passports.',
    eligibility: 'Citizens needing fast issuance or replacing a lost passport',
    office: 'Department of Passports, Tripureshwar',
    method: 'Online pre-enrollment + in-person biometrics (fast-track queue)',
    validity: '10 years for adults from issue',
    processingTime: 'Around 3 working days (fast-track)',
    fees: [
      { label: '34-page fast-track', amount: 10000, note: 'Around 3 working days', verified: true },
      { label: '66-page fast-track', amount: 20000, note: 'Around 3 working days', verified: true },
      { label: 'Lost passport, first replacement', amount: 10000, verified: true },
      { label: 'Lost passport, repeat replacement', amount: 15000, verified: true },
    ],
    documents: [
      { label: 'Nepali citizenship certificate' },
      { label: 'Police report', note: 'For lost passports' },
      { label: 'Online pre-enrollment confirmation' },
      { label: 'Payment receipt' },
    ],
    steps: [
      { title: 'Pre-enroll online', text: 'Select the fast-track service in the form.' },
      { title: 'Pay the fast-track fee', text: 'Pay online or at a designated bank.' },
      { title: 'Book early appointment', text: 'Fast-track slots are limited — book ahead.' },
      { title: 'Visit office', text: 'Complete biometrics and verification in person.' },
      { title: 'Collect passport', text: 'Collect it once fast-track processing completes.' },
    ],
    notes: [
      'Same-day counters have existed at DoP Kathmandu in the past — confirm current availability.',
      'Online payment applies to expedited service; regular DAO applicants should not prepay online.',
      'Government fees can change — verify before paying.',
    ],
    links: [],
    officialSource: { label: 'Department of Passports', url: 'https://nepalpassport.gov.np' },
    lastUpdated: '2026-05',
    popular: false,
  },

  // ── Driving License ────────────────────────────────────────
  {
    id: 'new-driving-license',
    slug: 'new-driving-license',
    name: 'New Driving License',
    category: 'driving-license',
    description: 'Apply for a new smart-card driving license (written + trial).',
    eligibility: 'Age 16+ for bikes, 18+ for cars and above',
    office: 'Provincial Transport Management Office (DoTM)',
    method: 'Online application + written exam + trial test + biometrics',
    validity: '10 years on new smart cards',
    processingTime: 'Written and trial scheduling plus card printing (weeks)',
    fees: [
      { label: 'Application fee', amount: null, note: 'Rs 500–1,000 depending on province', verified: true },
      { label: 'Bike / scooter (A, K) issuance', amount: 3000, verified: true },
      { label: 'Car / jeep / van (B, E, F)', amount: 4000, note: 'Rs 5,000 in Madhesh Province', verified: true },
      { label: 'Tempo / power tiller (C, D)', amount: 4000, verified: true },
      { label: 'Heavy vehicles (G and above)', amount: 6000, note: 'Rs 7,000 in Madhesh Province', verified: true },
    ],
    documents: [
      { label: 'Nepali citizenship certificate' },
      { label: 'National ID', note: 'Required for licence services' },
      { label: 'Mobile number in your own name', note: 'For OTP login' },
      { label: 'Medical fitness certificate' },
      { label: 'Passport-size photos' },
    ],
    steps: [
      { title: 'Apply online', text: 'Submit the new-license application on your provincial portal.' },
      { title: 'Written exam', text: 'Appear for the traffic-rules written test.' },
      { title: 'Trial test', text: 'Pass the practical riding/driving trial.' },
      { title: 'Biometrics', text: 'Photo and fingerprint capture at the transport office.' },
      { title: 'Collect smart card', text: 'Collect the card once printed.' },
    ],
    notes: [
      'Fees are set per province since FY 2026/27 — the portal fee screen is binding.',
      'Minimum age is generally 16 for bikes and 18 for cars and above.',
      'Requirements can vary by province and office.',
    ],
    links: [],
    officialSource: { label: 'Dept. of Transport Management', url: 'https://www.dotm.gov.np' },
    lastUpdated: '2026-07',
    popular: true,
  },
  {
    id: 'license-renewal',
    slug: 'license-renewal',
    name: 'Driving License Renewal',
    category: 'driving-license',
    description: 'Renew an expiring or expired smart-card driving license.',
    eligibility: 'Holders of an existing Nepali driving license',
    office: 'Provincial Transport Management Office (DoTM)',
    method: 'Online renewal application + in-person biometrics and medical',
    validity: '10 years from renewal on new cards',
    processingTime: 'Application plus card printing (weeks)',
    fees: [
      { label: 'Bike / scooter (A, K) renewal', amount: 3000, verified: true },
      { label: 'Car / jeep / van (B, E, F)', amount: 4000, note: 'Rs 5,000 in Madhesh Province', verified: true },
      { label: 'Heavy vehicles (G and above)', amount: 6000, note: 'Rs 7,000 in Madhesh Province', verified: true },
      { label: 'Late penalty', amount: null, note: '90-day grace, then 100–500% of fee by delay year; cancelled after 5 years', verified: true },
      { label: 'Duplicate (lost) license', amount: 500, verified: true },
    ],
    documents: [
      { label: 'Expiring/expired license (original)' },
      { label: 'Nepali citizenship certificate' },
      { label: 'National ID' },
      { label: 'Medical fitness certificate' },
    ],
    steps: [
      { title: 'Apply online', text: 'Choose Renew License Application on your provincial portal.' },
      { title: 'Pay the fee', text: 'Pay online via eSewa/Khalti or at the counter.' },
      { title: 'Medical + biometrics', text: 'Eye test and photo/fingerprint capture in person.' },
      { title: 'Verification', text: 'Office verifies documents and payment.' },
      { title: 'Collect renewed card', text: 'Use the receipt as temporary proof until the card arrives.' },
    ],
    notes: [
      'Renew within 90 days of expiry to avoid percentage penalties.',
      'The fee is based on the highest-fee category on your license.',
      'Check the expiry printed on your card — some old pages still show 5-year language.',
    ],
    links: [],
    officialSource: { label: 'Dept. of Transport Management', url: 'https://www.dotm.gov.np' },
    lastUpdated: '2026-07',
    popular: false,
  },
  {
    id: 'license-category-add',
    slug: 'license-category-add',
    name: 'License Category Add (Endorsement)',
    category: 'driving-license',
    description: 'Add a new vehicle category to an existing driving license.',
    eligibility: 'Holders of a valid driving license',
    office: 'Provincial Transport Management Office (DoTM)',
    method: 'Online application + trial for the new category',
    validity: 'Follows your existing license validity',
    processingTime: 'Trial scheduling plus card reprint (weeks)',
    fees: [
      { label: 'Endorsement (categories A–F)', amount: 1000, verified: true },
      { label: 'Endorsement (categories G–J)', amount: 2000, verified: true },
    ],
    documents: [
      { label: 'Existing driving license (original)' },
      { label: 'Nepali citizenship certificate' },
      { label: 'Medical fitness certificate' },
    ],
    steps: [
      { title: 'Apply online', text: 'Choose category endorsement on your provincial portal.' },
      { title: 'Pay the fee', text: 'Pay the endorsement fee for the category group.' },
      { title: 'Trial test', text: 'Pass the practical trial for the new category.' },
      { title: 'Biometrics', text: 'Updated capture if the office requires it.' },
      { title: 'Collect updated card', text: 'Collect the reprinted smart card.' },
    ],
    notes: [
      'Fees follow provincial schedules — confirm on the portal.',
      'You may need to pass a fresh trial for the added category.',
    ],
    links: [],
    officialSource: { label: 'Dept. of Transport Management', url: 'https://www.dotm.gov.np' },
    lastUpdated: '2026-07',
    popular: false,
  },

  // ── National ID ────────────────────────────────────────────
  {
    id: 'nid-registration',
    slug: 'nid-registration',
    name: 'National ID Registration',
    category: 'national-id',
    description: 'Enroll for the Rastriya Parichaya Patra (National ID card).',
    eligibility: 'Nepali citizens',
    office: 'District Administration Office / DoNIDCR enrollment center',
    method: 'Online pre-enrollment + biometric capture in person',
    validity: 'As printed on the card — renewals not yet billed to the public',
    processingTime: 'Enrollment plus card printing (weeks to months)',
    fees: [
      { label: 'First-time card', amount: 0, note: 'Free of charge', verified: true },
      { label: 'Duplicate (lost/damaged)', amount: 500, note: 'Police report required', verified: true },
      { label: 'Correction (applicant-side error)', amount: 300, verified: true },
      { label: 'Correction (department error)', amount: 0, note: 'Free of charge', verified: true },
    ],
    documents: [
      { label: 'Nepali citizenship certificate' },
      { label: 'Passport-size photo' },
      { label: "Parents' citizenship", note: 'If asked' },
      { label: 'Marriage certificate', note: 'If married' },
      { label: 'Migration certificate (Basai-Sarai)', note: 'If permanently migrated' },
      { label: 'Police report', note: 'For duplicate cards only' },
    ],
    steps: [
      { title: 'Pre-enroll online', text: 'Fill demographic details on the NID pre-enrollment portal.' },
      { title: 'Book appointment', text: 'Choose a date for biometric capture.' },
      { title: 'Visit center', text: 'Photo, fingerprints, signature and document check in person.' },
      { title: 'Track by SMS', text: 'Follow status updates sent to your mobile.' },
      { title: 'Collect card', text: 'Collect the printed card from the designated office.' },
    ],
    notes: [
      'NID is increasingly required for banking, SIM, PAN, licence and passport services.',
      'Carry originals — photocopies alone are not enough for verification.',
    ],
    links: [],
    officialSource: { label: 'NID pre-enrollment portal', url: 'https://enrollment.donidcr.gov.np' },
    lastUpdated: '2025-03',
    popular: true,
  },
  {
    id: 'nid-collection',
    slug: 'nid-collection',
    name: 'National ID Card Collection',
    category: 'national-id',
    description: 'Collect your printed National ID card after enrollment.',
    eligibility: 'Applicants whose NID card is printed',
    office: 'Designated DAO / DoNIDCR distribution point',
    method: 'In-person collection with token',
    validity: 'As printed on the card',
    processingTime: 'Same-day queue at the counter',
    fees: [
      { label: 'Card collection', amount: 0, note: 'No separate collection fee is published — carry your token', verified: false },
    ],
    documents: [
      { label: 'Enrollment token / slip' },
      { label: 'Nepali citizenship certificate' },
    ],
    steps: [
      { title: 'Confirm readiness', text: 'Wait for the SMS or notice that your card is printed.' },
      { title: 'Visit counter', text: 'Go to the designated distribution point.' },
      { title: 'Verify identity', text: 'Show your token slip and citizenship.' },
      { title: 'Collect card', text: 'Sign the register and collect your card.' },
    ],
    notes: [
      'Go to the office named in your enrollment receipt, not just any DAO.',
      'Confirm current pickup hours before visiting.',
    ],
    links: [],
    officialSource: { label: 'NID pre-enrollment portal', url: 'https://enrollment.donidcr.gov.np' },
    lastUpdated: null,
    popular: false,
  },

  // ── Tax ────────────────────────────────────────────────────
  {
    id: 'individual-pan',
    slug: 'individual-pan',
    name: 'Individual PAN',
    category: 'tax',
    description: 'Get a 9-digit Permanent Account Number as an individual.',
    eligibility: 'Resident individuals with taxable income or formal transactions',
    office: 'Inland Revenue Office / taxpayer portal',
    method: 'Online application + in-person biometrics',
    validity: 'Lifetime number',
    processingTime: '1–3 working days',
    fees: [
      { label: 'PAN registration', amount: 0, note: 'No government fee — photocopy/notary costs only', verified: true },
    ],
    documents: [
      { label: 'Nepali citizenship certificate' },
      { label: 'Passport-size photo' },
      { label: 'Printed online application' },
    ],
    steps: [
      { title: 'Register online', text: 'Fill the PAN form on the taxpayer portal.' },
      { title: 'Print application', text: 'Take a printout with supporting documents.' },
      { title: 'Visit IRO', text: 'Submit documents and complete biometrics.' },
      { title: 'Receive PAN', text: 'Collect your 9-digit PAN once issued.' },
    ],
    notes: [
      'There is no expedite route — beware anyone charging a premium for speed.',
      'PAN is required for salary, banking and many official transactions.',
    ],
    links: [],
    officialSource: { label: 'Inland Revenue Department', url: 'https://ird.gov.np' },
    lastUpdated: '2025-04',
    popular: true,
  },
  {
    id: 'business-pan',
    slug: 'business-pan',
    name: 'Business PAN',
    category: 'tax',
    description: 'Get a PAN for a firm, company or other legal entity.',
    eligibility: 'Registered firms, companies and entities',
    office: 'Inland Revenue Office / taxpayer portal',
    method: 'Online application + document submission at IRO',
    validity: 'Lifetime number for the entity',
    processingTime: 'A few working days after complete submission',
    fees: [
      { label: 'Business PAN registration', amount: 0, note: 'No government fee — notary/agent costs possible', verified: true },
    ],
    documents: [
      { label: 'Firm/company registration certificate' },
      { label: 'Memorandum and articles (for companies)' },
      { label: 'Proprietor/director citizenship copies' },
      { label: 'Office rental agreement' },
      { label: 'Passport-size photos' },
    ],
    steps: [
      { title: 'Register online', text: 'Fill the business PAN e-form.' },
      { title: 'Prepare file', text: 'Attach registration, MOA/AOA and ID copies.' },
      { title: 'Submit at IRO', text: 'File the set at the relevant Inland Revenue Office.' },
      { title: 'Receive PAN', text: 'Collect the entity PAN once issued.' },
    ],
    notes: [
      'Complex ownership (foreign promoters, partners) can slow verification.',
      'Keep business documents notarized where the office asks for it.',
    ],
    links: [{ label: 'Company registration costs', href: '/business-registration-cost-nepal' }],
    officialSource: { label: 'Inland Revenue Department', url: 'https://ird.gov.np' },
    lastUpdated: '2025-04',
    popular: false,
  },
  {
    id: 'vat-registration',
    slug: 'vat-registration',
    name: 'VAT Registration',
    category: 'tax',
    description: 'Register a business for Value Added Tax with the IRD.',
    eligibility: 'Businesses crossing the VAT threshold',
    office: 'Inland Revenue Office',
    method: 'Application at IRO (confirm current channel)',
    validity: 'Valid while the business files VAT returns',
    processingTime: 'Varies — confirm at your IRO',
    fees: [
      { label: 'VAT registration', amount: null, note: 'No registration fee is published — confirm at IRD', verified: false },
    ],
    documents: [
      { label: 'Business PAN certificate' },
      { label: 'Firm/company registration certificate' },
      { label: 'Office rental agreement' },
      { label: 'Proprietor/director citizenship copies' },
    ],
    steps: [
      { title: 'Check threshold', text: 'Confirm your turnover crosses the VAT registration threshold.' },
      { title: 'Prepare file', text: 'Collect PAN, registration and premises documents.' },
      { title: 'Apply at IRO', text: 'File the VAT application at the relevant office.' },
      { title: 'Receive certificate', text: 'Collect VAT registration once approved.' },
    ],
    notes: [
      'Registration thresholds and documents can change — confirm at IRD first.',
      'Once registered, VAT returns must be filed on schedule.',
    ],
    links: [],
    officialSource: { label: 'Inland Revenue Department', url: 'https://ird.gov.np' },
    lastUpdated: null,
    popular: false,
  },

  // ── Vehicles ───────────────────────────────────────────────
  {
    id: 'bluebook-renewal',
    slug: 'bluebook-renewal',
    name: 'Bluebook Renewal (Vehicle Tax)',
    category: 'vehicles',
    description: 'Renew your vehicle bluebook with annual tax payment.',
    eligibility: 'Registered vehicle owners',
    office: 'Transport Management Office / provincial portals',
    method: 'Online payment where supported + bluebook update',
    validity: 'One fiscal year per renewal',
    processingTime: 'Same day when tax is paid and documents are clear',
    fees: [
      { label: 'Annual vehicle tax', amount: null, note: 'Varies by vehicle type, engine and province — calculate it first', verified: false },
    ],
    documents: [
      { label: 'Bluebook (original)' },
      { label: 'Citizenship copy' },
      { label: 'Previous tax receipt' },
      { label: 'Valid third-party insurance', note: 'Commonly required' },
    ],
    steps: [
      { title: 'Check tax due', text: 'Calculate the exact annual tax for your vehicle and province.' },
      { title: 'Pay the tax', text: 'Pay online on the provincial portal or at the counter.' },
      { title: 'Update bluebook', text: 'Get the renewal stamp/entry recorded.' },
      { title: 'Keep receipts', text: 'Carry the tax receipt with the bluebook.' },
    ],
    notes: [
      'Late renewal attracts fines that grow with delay.',
      'Tax slabs differ by province and fiscal year.',
    ],
    links: [{ label: 'Vehicle tax calculator', href: '/nepal/transport/vehicle-tax' }],
    officialSource: { label: 'Dept. of Transport Management', url: 'https://www.dotm.gov.np' },
    lastUpdated: null,
    popular: true,
  },
  {
    id: 'ownership-transfer',
    slug: 'ownership-transfer',
    name: 'Vehicle Ownership Transfer (Namsari)',
    category: 'vehicles',
    description: 'Transfer a vehicle bluebook to the new owner after a sale.',
    eligibility: 'Vehicle buyers and sellers',
    office: 'Transport Management Office',
    method: 'Joint application by buyer and seller, in person',
    validity: 'Updated bluebook in the buyer’s name',
    processingTime: 'Varies by office workload',
    fees: [
      { label: 'Transfer fee + tax clearance', amount: null, note: 'Varies by vehicle and province — confirm at the office', verified: false },
    ],
    documents: [
      { label: 'Bluebook (original)' },
      { label: 'Seller citizenship copy' },
      { label: 'Buyer citizenship copy' },
      { label: 'Sale agreement (likhat)' },
      { label: 'Tax clearance / recent tax receipt' },
    ],
    steps: [
      { title: 'Clear dues', text: 'Settle any pending tax or fines first.' },
      { title: 'Prepare agreement', text: 'Sign a sale agreement with both citizenship copies.' },
      { title: 'Apply jointly', text: 'Buyer and seller apply together at the office.' },
      { title: 'Pay fees', text: 'Pay transfer fee and any clearance dues.' },
      { title: 'Collect bluebook', text: 'Collect the bluebook updated in the buyer’s name.' },
    ],
    notes: [
      'Both parties are usually required to appear in person.',
      'Never buy without checking tax dues and the bluebook record.',
    ],
    links: [{ label: 'Vehicle tax calculator', href: '/nepal/transport/vehicle-tax' }],
    officialSource: { label: 'Dept. of Transport Management', url: 'https://www.dotm.gov.np' },
    lastUpdated: null,
    popular: false,
  },
  {
    id: 'route-permit',
    slug: 'route-permit',
    name: 'Route Permit (Public Vehicles)',
    category: 'vehicles',
    description: 'Route permit for operating public passenger or goods vehicles.',
    eligibility: 'Public vehicle operators',
    office: 'Transport Management Office / provincial authority',
    method: 'Application at the issuing office',
    validity: 'As printed on the permit — renew before expiry',
    processingTime: 'Varies by office',
    fees: [
      { label: 'Route permit fee', amount: null, note: 'Varies by vehicle class and route — confirm at the office', verified: false },
    ],
    documents: [
      { label: 'Bluebook (original)' },
      { label: 'Fitness certificate', note: 'If applicable to the vehicle class' },
      { label: 'Valid insurance' },
      { label: 'Operator/owner citizenship copy' },
    ],
    steps: [
      { title: 'Check requirements', text: 'Confirm the permit class for your route and vehicle.' },
      { title: 'Prepare file', text: 'Collect bluebook, fitness and insurance papers.' },
      { title: 'Apply', text: 'File the application at the issuing office.' },
      { title: 'Collect permit', text: 'Collect and display the permit as required.' },
    ],
    notes: [
      'Operating without a valid permit attracts fines.',
      'Renew before expiry to avoid gaps in operation.',
    ],
    links: [],
    officialSource: { label: 'Dept. of Transport Management', url: 'https://www.dotm.gov.np' },
    lastUpdated: null,
    popular: false,
  },

  // ── Business ───────────────────────────────────────────────
  {
    id: 'company-registration',
    slug: 'company-registration',
    name: 'Company Registration (Pvt. Ltd.)',
    category: 'business',
    description: 'Register a private limited company with the Company Registrar.',
    eligibility: 'Promoters starting a private limited company',
    office: 'Office of the Company Registrar (OCR)',
    method: 'Online name reservation + document filing',
    validity: 'Lifetime, with annual returns and renewals',
    processingTime: 'Days to weeks depending on name approval and file completeness',
    fees: [
      { label: 'Registration fee', amount: null, note: 'Slabbed by authorized capital — estimate it first', verified: false },
    ],
    documents: [
      { label: 'Proposed company names (3 options)' },
      { label: 'Memorandum and Articles of Association' },
      { label: 'Promoter citizenship copies' },
      { label: 'Office rental agreement' },
      { label: 'Passport-size photos of promoters' },
    ],
    steps: [
      { title: 'Reserve a name', text: 'Check and reserve one of your proposed names.' },
      { title: 'Prepare MOA/AOA', text: 'Draft memorandum and articles with objectives and capital.' },
      { title: 'File at OCR', text: 'Submit the full set online or at the counter.' },
      { title: 'Pay the fee', text: 'Pay the capital-slab fee and collect the certificate.' },
      { title: 'Next steps', text: 'Get PAN, and register for VAT if applicable.' },
    ],
    notes: [
      'Fees rise steeply with authorized capital — estimate before filing.',
      'Keep promoter IDs and office papers ready to avoid rework.',
    ],
    links: [{ label: 'Business registration cost estimator', href: '/business-registration-cost-nepal' }],
    officialSource: { label: 'Office of the Company Registrar', url: 'https://www.ocr.gov.np' },
    lastUpdated: null,
    popular: true,
  },
  {
    id: 'firm-registration',
    slug: 'firm-registration',
    name: 'Firm Registration (Sole Proprietorship)',
    category: 'business',
    description: 'Register a sole-proprietorship firm for small business.',
    eligibility: 'Individuals starting a small business',
    office: 'Department of Cottage & Small Industries / local level',
    method: 'Application at the registering office',
    validity: 'Renew yearly as required',
    processingTime: 'Days in most cases',
    fees: [
      { label: 'Registration fee', amount: null, note: 'Modest fee varying by office — confirm locally', verified: false },
    ],
    documents: [
      { label: 'Citizenship copy' },
      { label: 'Passport-size photos' },
      { label: 'Office rental agreement' },
      { label: 'Proposed firm name and objectives' },
    ],
    steps: [
      { title: 'Choose name', text: 'Pick a firm name and check availability.' },
      { title: 'Prepare file', text: 'Collect ID, photos and premises proof.' },
      { title: 'Apply', text: 'File at the cottage/small-industry or local office.' },
      { title: 'Collect certificate', text: 'Collect the firm registration certificate.' },
    ],
    notes: [
      'The correct office depends on business size and location.',
      'Get PAN right after registration to stay compliant.',
    ],
    links: [{ label: 'Individual PAN', href: '/nepal/government-service-cost/individual-pan' }],
    officialSource: null,
    lastUpdated: null,
    popular: false,
  },
  {
    id: 'business-renewal',
    slug: 'business-renewal',
    name: 'Business Renewal',
    category: 'business',
    description: 'Renew firm or company registration for the new fiscal year.',
    eligibility: 'Registered firms and companies',
    office: 'Original registering office',
    method: 'Renewal application with tax clearance',
    validity: 'One fiscal year per renewal',
    processingTime: 'Same day to a few days',
    fees: [
      { label: 'Renewal fee', amount: null, note: 'Varies by entity and capital — confirm at the office', verified: false },
    ],
    documents: [
      { label: 'Registration certificate (original)' },
      { label: 'Tax clearance certificate' },
      { label: 'Renewal application' },
    ],
    steps: [
      { title: 'Clear taxes', text: 'Obtain tax clearance first — renewals need it.' },
      { title: 'Apply', text: 'File the renewal form with the certificate.' },
      { title: 'Pay the fee', text: 'Pay renewal plus any late fines.' },
      { title: 'Collect stamp', text: 'Get the renewal recorded for the fiscal year.' },
    ],
    notes: [
      'Late renewal attracts fines — renew before the deadline.',
      'Keep prior-year receipts together for faster processing.',
    ],
    links: [],
    officialSource: null,
    lastUpdated: null,
    popular: false,
  },

  // ── Land ───────────────────────────────────────────────────
  {
    id: 'land-registration',
    slug: 'land-registration',
    name: 'Land Registration (Rajaswa)',
    category: 'land',
    description: 'Register land ownership and pay registration fees at Malpot.',
    eligibility: 'Land buyers (and sellers at registration)',
    office: 'Land Revenue Office (Malpot)',
    method: 'Deed preparation + in-person registration',
    validity: 'Lifetime ownership with Lalpurja issued',
    processingTime: 'Same day to a few days depending on queue',
    fees: [
      { label: 'Registration fee + surcharges', amount: null, note: 'Percent of declared value, varies by location — estimate it first', verified: false },
    ],
    documents: [
      { label: 'Lalpurja (for transfers) / citizenship' },
      { label: 'Sale deed (likhat) prepared by a writer' },
      { label: 'Citizenship copies of both parties' },
      { label: 'Land tax receipts' },
      { label: 'Passport-size photos' },
      { label: 'Ward recommendation', note: 'Where required' },
    ],
    steps: [
      { title: 'Agree the deed', text: 'Fix price and terms; get the likhat written.' },
      { title: 'Collect papers', text: 'Lalpurja, tax receipts, IDs and photos.' },
      { title: 'Visit Malpot', text: 'Both parties appear with the deed.' },
      { title: 'Pay fees', text: 'Pay registration fee and surcharges.' },
      { title: 'Collect Lalpurja', text: 'Collect the ownership certificate in the buyer’s name.' },
    ],
    notes: [
      'Fees depend on declared value, location and relationship — estimate first.',
      'Verify the parcel record (kitta, area, mohi/tenancy) before paying anything.',
    ],
    links: [{ label: 'Land registration fee estimator', href: '/nepal/property/land-registration' }],
    officialSource: { label: 'Dept. of Land Management and Archive', url: 'https://www.dolma.gov.np' },
    lastUpdated: null,
    popular: true,
  },
  {
    id: 'property-transfer',
    slug: 'property-transfer',
    name: 'Property Transfer (Bakaspati / Sale)',
    category: 'land',
    description: 'Transfer house-and-land ownership between parties.',
    eligibility: 'Parties transferring house and land',
    office: 'Land Revenue Office (Malpot)',
    method: 'Deed + in-person registration',
    validity: 'Lifetime ownership with updated Lalpurja',
    processingTime: 'Same day to a few days',
    fees: [
      { label: 'Transfer + registration charges', amount: null, note: 'Percent of declared value — varies by case', verified: false },
    ],
    documents: [
      { label: 'Lalpurja (original)' },
      { label: 'Sale/gift deed (likhat)' },
      { label: 'Citizenship copies of both parties' },
      { label: 'Land and house tax receipts' },
      { label: 'Approval letters', note: 'For gift/inheritance cases where required' },
    ],
    steps: [
      { title: 'Prepare deed', text: 'Draft the transfer deed with a writer.' },
      { title: 'Clear dues', text: 'Settle land and house taxes first.' },
      { title: 'Appear at Malpot', text: 'Both parties register the deed.' },
      { title: 'Pay charges', text: 'Pay transfer and registration charges.' },
      { title: 'Collect Lalpurja', text: 'Collect the updated ownership certificate.' },
    ],
    notes: [
      'Gift and inheritance transfers follow different charge rules — ask at Malpot.',
      'Confirm the exact charge head-wise on the office notice board.',
    ],
    links: [{ label: 'Property registration cost estimator', href: '/nepal/property/property-registration-cost' }],
    officialSource: { label: 'Dept. of Land Management and Archive', url: 'https://www.dolma.gov.np' },
    lastUpdated: null,
    popular: false,
  },
  {
    id: 'lalpurja-copy',
    slug: 'lalpurja-copy',
    name: 'Lalpurja Copy',
    category: 'land',
    description: 'Get a certified copy of a lost or damaged land ownership certificate.',
    eligibility: 'Registered landowners',
    office: 'Land Revenue Office (Malpot)',
    method: 'Application at the issuing Malpot',
    validity: 'Same standing as the original for transactions',
    processingTime: 'Varies by record search time',
    fees: [
      { label: 'Copy fee', amount: null, note: 'Nominal fee — confirm at Malpot', verified: false },
    ],
    documents: [
      { label: 'Written application' },
      { label: 'Citizenship copy' },
      { label: 'Parcel details', note: 'Kitta number, area, location' },
      { label: 'Police report', note: 'If the original was lost' },
    ],
    steps: [
      { title: 'File report', text: 'Report the loss at police if applicable.' },
      { title: 'Apply', text: 'Submit the copy application with parcel details.' },
      { title: 'Record search', text: 'Office traces the original register entry.' },
      { title: 'Collect copy', text: 'Collect the certified copy.' },
    ],
    notes: [
      'Knowing the exact kitta number speeds up the record search.',
      'Confirm the fee at the counter before paying.',
    ],
    links: [],
    officialSource: { label: 'Dept. of Land Management and Archive', url: 'https://www.dolma.gov.np' },
    lastUpdated: null,
    popular: false,
  },

  // ── Foreign Employment ─────────────────────────────────────
  {
    id: 'labor-permit',
    slug: 'labor-permit',
    name: 'Labor Permit (Re-entry)',
    category: 'foreign-employment',
    description: 'Work permit for Nepali migrant workers going abroad.',
    eligibility: 'Nepali workers with foreign employment',
    office: 'Department of Foreign Employment (DoFE)',
    method: 'Online application + document verification',
    validity: 'Tied to the employment contract period',
    processingTime: 'Varies — check current DoFE timelines',
    fees: [
      { label: 'Permit fee', amount: null, note: 'Confirm the current DoFE schedule before paying', verified: false },
    ],
    documents: [
      { label: 'Passport (valid)' },
      { label: 'Visa / work permit of destination' },
      { label: 'Employment contract / demand documents' },
      { label: 'Medical report from approved center' },
      { label: 'Insurance policy' },
      { label: 'Orientation training certificate' },
    ],
    steps: [
      { title: 'Medical + insurance', text: 'Complete the approved medical and get insured.' },
      { title: 'Orientation', text: 'Attend the pre-departure orientation.' },
      { title: 'Apply online', text: 'Submit the permit application with documents.' },
      { title: 'Verification', text: 'DoFE verifies contract and demand papers.' },
      { title: 'Collect permit', text: 'Collect the labor permit/sticker.' },
    ],
    notes: [
      'Requirements differ for new vs re-entry permits.',
      'Use only licensed manpower companies and official counters.',
    ],
    links: [{ label: 'Foreign employment cost estimator', href: '/nepal/foreign-employment-cost-calculator' }],
    officialSource: { label: 'Dept. of Foreign Employment', url: 'https://www.dofe.gov.np' },
    lastUpdated: null,
    popular: false,
  },
  {
    id: 'migrant-insurance',
    slug: 'migrant-insurance',
    name: 'Migrant Worker Insurance',
    category: 'foreign-employment',
    description: 'Mandatory insurance for Nepali workers going abroad.',
    eligibility: 'Migrant workers before departure',
    office: 'Licensed insurers / Foreign Employment Board',
    method: 'Purchase from licensed insurer, submit proof with permit file',
    validity: 'Covers the contract period as per policy',
    processingTime: 'Same day in most cases',
    fees: [
      { label: 'Insurance premium', amount: null, note: 'Varies by destination and coverage period', verified: false },
    ],
    documents: [
      { label: 'Passport copy' },
      { label: 'Visa / demand documents' },
      { label: 'Passport-size photos' },
    ],
    steps: [
      { title: 'Choose insurer', text: 'Pick a licensed insurer with an approved migrant policy.' },
      { title: 'Share documents', text: 'Provide passport and destination papers.' },
      { title: 'Pay premium', text: 'Pay as per destination and period slab.' },
      { title: 'Collect policy', text: 'Attach the policy to your permit file.' },
    ],
    notes: [
      'Keep the policy document safe for the whole contract period.',
      'Confirm approved insurers with DoFE or the Board.',
    ],
    links: [{ label: 'Foreign employment cost estimator', href: '/nepal/foreign-employment-cost-calculator' }],
    officialSource: { label: 'Dept. of Foreign Employment', url: 'https://www.dofe.gov.np' },
    lastUpdated: null,
    popular: false,
  },
  {
    id: 'foreign-medical',
    slug: 'foreign-medical',
    name: 'Foreign Employment Medical Examination',
    category: 'foreign-employment',
    description: 'Mandatory health checkup from an approved medical center.',
    eligibility: 'Workers heading abroad for employment',
    office: 'DoFE-approved medical centers',
    method: 'In-person examination, report uploaded/issued',
    validity: 'Typically 3 months — confirm for your destination',
    processingTime: 'Same day to a few days for the report',
    fees: [
      { label: 'Medical examination', amount: null, note: 'Varies by medical center — confirm when booking', verified: false },
    ],
    documents: [
      { label: 'Passport (original + copy)' },
      { label: 'Passport-size photos' },
      { label: 'Appointment/referral slip', note: 'Where the center requires one' },
    ],
    steps: [
      { title: 'Choose approved center', text: 'Use only a DoFE-approved medical center.' },
      { title: 'Book and attend', text: 'Complete blood, X-ray and physical tests.' },
      { title: 'Collect report', text: 'Collect the fit/unfit medical report.' },
      { title: 'Attach to file', text: 'Add the report to your permit application.' },
    ],
    notes: [
      'Unfit reports must be re-done — ask the center about retest rules.',
      'Only approved-center reports are accepted.',
    ],
    links: [{ label: 'Foreign employment cost estimator', href: '/nepal/foreign-employment-cost-calculator' }],
    officialSource: { label: 'Dept. of Foreign Employment', url: 'https://www.dofe.gov.np' },
    lastUpdated: null,
    popular: false,
  },
];

// ── Helpers ──────────────────────────────────────────────────

export function getCategoryById(id) {
  return SERVICE_CATEGORIES.find((c) => c.id === id) || null;
}

export function getServiceBySlug(slug) {
  return SERVICES.find((s) => s.slug === slug) || null;
}

export function getServicesByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return SERVICES;
  return SERVICES.filter((s) => s.category === categoryId);
}

export function getPopularServices() {
  return POPULAR_SERVICES.map((p) => getServiceBySlug(p.slug))
    .filter(Boolean)
    .map((s) => ({
      ...s,
      label: (POPULAR_SERVICES.find((p) => p.slug === s.slug) || {}).label || s.name,
    }));
}

/** True only when every fee row is backed by a source. */
export function serviceIsVerified(service) {
  return (
    service &&
    Array.isArray(service.fees) &&
    service.fees.length > 0 &&
    service.fees.every((f) => f.verified === true)
  );
}

/** Lowest fixed fee, used for "Fee from …" metadata. Null when none fixed. */
export function serviceFeeFrom(service) {
  if (!service || !Array.isArray(service.fees)) return null;
  const fixed = service.fees
    .map((f) => f.amount)
    .filter((a) => typeof a === 'number' && a >= 0);
  if (fixed.length === 0) return null;
  return Math.min(...fixed);
}

export function formatNPR(amount) {
  if (amount === null || amount === undefined) return 'Varies';
  if (amount === 0) return 'Free';
  return 'Rs. ' + Number(amount).toLocaleString('en-IN');
}

export function searchServices(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return SERVICES;
  return SERVICES.filter((s) => {
    const hay = [
      s.name,
      s.description,
      (getCategoryById(s.category) || {}).name || '',
      s.office,
      ...s.documents.map((d) => `${d.label} ${d.note || ''}`),
      ...s.fees.map((f) => `${f.label} ${f.note || ''}`),
      ...s.steps.map((st) => `${st.title} ${st.text}`),
    ]
      .join(' ')
      .toLowerCase();
    return q.split(/\s+/).every((word) => hay.includes(word));
  });
}

export function getRelatedServices(slug, limit = 4) {
  const current = getServiceBySlug(slug);
  if (!current) return [];
  const same = SERVICES.filter((s) => s.slug !== slug && s.category === current.category);
  const rest = SERVICES.filter((s) => s.slug !== slug && s.category !== current.category);
  return [...same, ...rest].slice(0, limit);
}
