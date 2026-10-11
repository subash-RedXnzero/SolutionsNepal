/**
 * Wedding Budget — Data
 * =====================
 * Static lists and example-only defaults for the Nepal wedding budget tool.
 *
 * TRUST RULE (no fake pricing):
 * Wedding costs in Nepal vary by city, venue, guests, menu, season,
 * jewellery, decoration, provider, event count and personal preference.
 * This file therefore contains NO "average Nepal prices".
 * `examplePerGuest` / `exampleBudget` values are illustrative starting
 * points only — the UI must label them "Example estimate" and every
 * amount field must be user-overwritable (blank = not included).
 *
 * To add verified local cost data later: attach
 * { amount, source, sourceUrl, lastChecked } per city/event and surface
 * it as a labelled default. Never silently hard-code it.
 */

export const LAST_CHECKED = 'September 2026';

/** Nepal's seven provinces (location is informational — no price lookup). */
export const PROVINCES = [
  { id: 'koshi', name: 'Koshi' },
  { id: 'madhesh', name: 'Madhesh' },
  { id: 'bagmati', name: 'Bagmati' },
  { id: 'gandaki', name: 'Gandaki' },
  { id: 'lumbini', name: 'Lumbini' },
  { id: 'karnali', name: 'Karnali' },
  { id: 'sudurpashchim', name: 'Sudurpashchim' },
];

/** Common wedding cities/districts. Prices are NOT assumed per city. */
export const CITIES = [
  'Kathmandu',
  'Lalitpur',
  'Bhaktapur',
  'Pokhara',
  'Biratnagar',
  'Bharatpur',
  'Butwal',
  'Dharan',
  'Nepalgunj',
  'Other',
];

/** Selectable wedding events. Each selected event can carry its own guest count. */
export const WEDDING_EVENTS = [
  { id: 'engagement', label: 'Engagement', icon: 'Heart' },
  { id: 'mehendi', label: 'Mehendi', icon: 'Hand' },
  { id: 'sangeet', label: 'Sangeet', icon: 'Music' },
  { id: 'wedding', label: 'Wedding ceremony', icon: 'Sparkles' },
  { id: 'reception', label: 'Reception', icon: 'PartyPopper' },
  { id: 'other', label: 'Other', icon: 'Plus' },
];

export const WEDDING_EVENT_IDS = WEDDING_EVENTS.map((e) => e.id);

/**
 * Meal styles. `examplePerGuest` is an EXAMPLE starting point only
 * (labelled "Example estimate" in the UI) — never an official price.
 * `null` means "no example, user enters their quoted price".
 */
export const MEAL_STYLES = [
  { id: 'basic', label: 'Basic', examplePerGuest: 1200 },
  { id: 'standard', label: 'Standard', examplePerGuest: 2000 },
  { id: 'premium', label: 'Premium', examplePerGuest: 3500 },
  { id: 'custom', label: 'Custom', examplePerGuest: null },
];

/**
 * Top-level categories for the result breakdown.
 * (id must match the calculator's breakdown ids.)
 */
export const weddingCategories = [
  { id: 'catering', name: 'Food & catering', icon: 'Utensils' },
  { id: 'venue', name: 'Venue', icon: 'Building2' },
  { id: 'jewellery', name: 'Jewellery', icon: 'Gem' },
  { id: 'decoration', name: 'Decoration', icon: 'Sparkles' },
  { id: 'brideClothing', name: "Bride's clothing", icon: 'Shirt' },
  { id: 'groomClothing', name: "Groom's clothing", icon: 'User' },
  { id: 'photography', name: 'Photography', icon: 'Camera' },
  { id: 'makeup', name: 'Makeup', icon: 'Star' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Music' },
  { id: 'transport', name: 'Transport', icon: 'Car' },
  { id: 'other', name: 'Other', icon: 'Wallet' },
];

/**
 * Expense input fields, grouped for the expandable UI.
 * Every field starts blank ("Enter your expected cost").
 */
export const WEDDING_EXPENSE_GROUPS = [
  {
    id: 'bride',
    name: 'Bride',
    icon: 'Shirt',
    fields: [
      { key: 'bridalClothing', label: 'Bridal clothing' },
      { key: 'makeup', label: 'Makeup' },
      { key: 'brideAccessories', label: 'Accessories' },
    ],
  },
  {
    id: 'groom',
    name: 'Groom',
    icon: 'User',
    fields: [
      { key: 'groomClothing', label: 'Clothing' },
      { key: 'groomShoes', label: 'Shoes / accessories' },
      { key: 'groomStyling', label: 'Groom styling' },
    ],
  },
  {
    id: 'ceremony',
    name: 'Ceremony',
    icon: 'Sparkles',
    fields: [
      { key: 'decoration', label: 'Decoration' },
      { key: 'flowers', label: 'Flowers' },
      { key: 'mandap', label: 'Mandap / stage' },
      { key: 'priest', label: 'Priest / ritual expenses' },
      { key: 'religious', label: 'Religious items' },
    ],
  },
  {
    id: 'photography',
    name: 'Photography',
    icon: 'Camera',
    fields: [
      { key: 'photography', label: 'Photography' },
      { key: 'videography', label: 'Videography' },
      { key: 'prewedding', label: 'Pre-wedding shoot' },
      { key: 'album', label: 'Album' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'Music',
    fields: [
      { key: 'dj', label: 'DJ' },
      { key: 'band', label: 'Music / band' },
      { key: 'sound', label: 'Dance / sound system' },
    ],
  },
  {
    id: 'invitations',
    name: 'Invitations',
    icon: 'Mail',
    fields: [
      { key: 'printedCards', label: 'Printed cards' },
      { key: 'digitalInvites', label: 'Digital invitations' },
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: 'Car',
    fields: [
      { key: 'coupleTransport', label: 'Bride / groom transportation' },
      { key: 'guestTransport', label: 'Guest transportation' },
      { key: 'otherTransport', label: 'Other transport' },
    ],
  },
  {
    id: 'accommodation',
    name: 'Accommodation',
    icon: 'BedDouble',
    fields: [
      { key: 'hotel', label: 'Hotel' },
      { key: 'guestRooms', label: 'Guest rooms' },
      { key: 'otherStay', label: 'Other accommodation' },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'Wallet',
    fields: [
      { key: 'tips', label: 'Tips' },
      { key: 'miscellaneous', label: 'Miscellaneous' },
    ],
  },
];

/** Flat list of expense keys (excludes catering/venue/buffer, includes jewellery). */
export const WEDDING_EXPENSE_KEYS = [
  'jewellery',
  ...WEDDING_EXPENSE_GROUPS.flatMap((g) => g.fields.map((f) => f.key)),
];

/** Human labels for every breakdown id (catering/venue/jewellery + expense keys). */
export const WEDDING_LABELS = {
  catering: 'Food & catering',
  venue: 'Venue',
  jewellery: 'Jewellery',
  bridalClothing: "Bride's clothing",
  makeup: 'Makeup',
  brideAccessories: 'Bridal accessories',
  groomClothing: "Groom's clothing",
  groomShoes: 'Groom shoes / accessories',
  groomStyling: 'Groom styling',
  decoration: 'Decoration',
  flowers: 'Flowers',
  mandap: 'Mandap / stage',
  priest: 'Priest / ritual expenses',
  religious: 'Religious items',
  photography: 'Photography',
  videography: 'Videography',
  prewedding: 'Pre-wedding shoot',
  album: 'Album',
  dj: 'DJ',
  band: 'Music / band',
  sound: 'Dance / sound system',
  printedCards: 'Printed cards',
  digitalInvites: 'Digital invitations',
  coupleTransport: 'Bride / groom transportation',
  guestTransport: 'Guest transportation',
  otherTransport: 'Other transport',
  hotel: 'Hotel',
  guestRooms: 'Guest rooms',
  otherStay: 'Other accommodation',
  tips: 'Tips',
  miscellaneous: 'Miscellaneous',
};

/**
 * Suggested allocation for budget-first mode.
 * Plain starting split (percent of total) — labelled
 * "Suggested budget allocation", never an official recommendation.
 * Percents sum to 100.
 */
export const BUDGET_ALLOCATION = [
  { id: 'catering', label: 'Food & catering', percent: 30 },
  { id: 'venue', label: 'Venue', percent: 10 },
  { id: 'decoration', label: 'Decoration', percent: 7 },
  { id: 'jewellery', label: 'Jewellery', percent: 17 },
  { id: 'clothing', label: 'Clothing', percent: 7 },
  { id: 'photography', label: 'Photography', percent: 5 },
  { id: 'makeup', label: 'Makeup', percent: 3 },
  { id: 'transport', label: 'Transport', percent: 3 },
  { id: 'other', label: 'Other', percent: 18 },
];

/** Example-only starting values (UI labels them "Example estimate"). */
export const WEDDING_DEFAULTS = {
  guests: 300,
  cateringPerGuest: 2000,
  totalBudget: 1500000,
  bufferPercent: 5,
};

/** Quick guest-count chips. */
export const GUEST_PRESETS = [100, 200, 300, 500, 750, 1000];

/** Emergency buffer choices. */
export const BUFFER_PRESETS = [3, 5, 10];

export const STORAGE_KEY = 'nk-wedding-budget-v1';
