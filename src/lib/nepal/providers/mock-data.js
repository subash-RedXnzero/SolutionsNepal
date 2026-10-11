/**
 * Consolidated mock data for SolutionsNepal services.
 *
 * These values are used ONLY when the real API provider fails.
 * They are clearly marked as mock and should NEVER be displayed
 * as "today's price" without disclosure.
 *
 * When a real provider is available and working, this module is not used.
 */

// ─── FOREX (NRB reference rates) ───────────────────────────

export const FOREX_MOCK = {
  currencies: [
    { iso3: 'USD', name: 'US Dollar', country: 'United States', unit: 1, buy: 134.50, sell: 135.10, flag: '🇺🇸' },
    { iso3: 'EUR', name: 'Euro', country: 'European Union', unit: 1, buy: 146.20, sell: 147.80, flag: '🇪🇺' },
    { iso3: 'GBP', name: 'British Pound', country: 'United Kingdom', unit: 1, buy: 172.10, sell: 174.50, flag: '🇬🇧' },
    { iso3: 'INR', name: 'Indian Rupee', country: 'India', unit: 100, buy: 160.00, sell: 161.50, flag: '🇮🇳' },
    { iso3: 'AUD', name: 'Australian Dollar', country: 'Australia', unit: 1, buy: 89.40, sell: 90.80, flag: '🇦🇺' },
    { iso3: 'CAD', name: 'Canadian Dollar', country: 'Canada', unit: 1, buy: 98.10, sell: 99.50, flag: '🇨🇦' },
    { iso3: 'CNY', name: 'Chinese Yuan', country: 'China', unit: 1, buy: 18.50, sell: 18.90, flag: '🇨🇳' },
    { iso3: 'JPY', name: 'Japanese Yen', country: 'Japan', unit: 100, buy: 90.20, sell: 91.50, flag: '🇯🇵' },
    { iso3: 'SAR', name: 'Saudi Riyal', country: 'Saudi Arabia', unit: 1, buy: 35.85, sell: 36.20, flag: '🇸🇦' },
    { iso3: 'QAR', name: 'Qatari Riyal', country: 'Qatar', unit: 1, buy: 36.90, sell: 37.30, flag: '🇶🇦' },
    { iso3: 'KWD', name: 'Kuwaiti Dinar', country: 'Kuwait', unit: 1, buy: 438.50, sell: 442.00, flag: '🇰🇼' },
    { iso3: 'BHD', name: 'Bahraini Dinar', country: 'Bahrain', unit: 1, buy: 357.20, sell: 360.00, flag: '🇧🇭' },
    { iso3: 'MYR', name: 'Malaysian Ringgit', country: 'Malaysia', unit: 1, buy: 30.10, sell: 30.50, flag: '🇲🇾' },
    { iso3: 'SGD', name: 'Singapore Dollar', country: 'Singapore', unit: 1, buy: 101.80, sell: 103.00, flag: '🇸🇬' },
    { iso3: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates', unit: 1, buy: 36.64, sell: 37.05, flag: '🇦🇪' },
    { iso3: 'KRW', name: 'South Korean Won', country: 'South Korea', unit: 1000, buy: 96.20, sell: 98.50, flag: '🇰🇷' },
  ],
  date: '2026-08-24',
  publishedOn: 'Mock data — not real NRB rates',
};

// ─── FUEL (NOC retail prices) ──────────────────────────────

export const FUEL_MOCK = {
  source: 'Nepal Oil Corporation (NOC)',
  sourceShort: 'NOC',
  rateType: 'Official retail selling price',
  effectiveDate: '2026-08-02',
  effectiveTime: '12:00 AM',
  lastUpdatedTime: '11:05 AM NPT',
  locations: [
    { id: 'kathmandu', name: 'Kathmandu', petrol: 199, diesel: 187, kerosene: 175 },
    { id: 'pokhara', name: 'Pokhara', petrol: 202, diesel: 190, kerosene: 178 },
    { id: 'biratnagar', name: 'Biratnagar', petrol: 197, diesel: 185, kerosene: 173 },
    { id: 'birgunj', name: 'Birgunj', petrol: 196, diesel: 184, kerosene: 172 },
    { id: 'nepalgunj', name: 'Nepalgunj', petrol: 201, diesel: 189, kerosene: 177 },
    { id: 'dhangadhi', name: 'Dhangadhi', petrol: 204, diesel: 192, kerosene: 180 },
    { id: 'surkhet', name: 'Surkhet', petrol: 203, diesel: 191, kerosene: 179 },
    { id: 'dang', name: 'Dang', petrol: 200, diesel: 188, kerosene: 176 },
  ],
  prevPrices: {
    kathmandu: { petrol: 196, diesel: 184, kerosene: 175 },
    pokhara: { petrol: 199, diesel: 187, kerosene: 178 },
    biratnagar: { petrol: 194, diesel: 182, kerosene: 173 },
    birgunj: { petrol: 193, diesel: 181, kerosene: 172 },
    nepalgunj: { petrol: 198, diesel: 186, kerosene: 177 },
    dhangadhi: { petrol: 201, diesel: 189, kerosene: 180 },
    surkhet: { petrol: 200, diesel: 188, kerosene: 179 },
    dang: { petrol: 197, diesel: 185, kerosene: 176 },
  },
  lpg: { price: 1800, prevPrice: 1800 },
  history: [
    { date: '2026-08-02', petrol: 199, diesel: 187, change: 3 },
    { date: '2026-07-15', petrol: 196, diesel: 184, change: 0 },
    { date: '2026-06-30', petrol: 196, diesel: 184, change: -2 },
    { date: '2026-06-15', petrol: 198, diesel: 186, change: 5 },
    { date: '2026-06-01', petrol: 193, diesel: 181, change: 0 },
    { date: '2026-05-15', petrol: 193, diesel: 181, change: -3 },
    { date: '2026-05-01', petrol: 196, diesel: 184, change: 4 },
    { date: '2026-04-15', petrol: 192, diesel: 180, change: 0 },
    { date: '2026-04-01', petrol: 192, diesel: 180, change: -1 },
    { date: '2026-03-15', petrol: 193, diesel: 181, change: 2 },
  ],
};

// ─── GOLD (FENEGOSIDA rates) ───────────────────────────────

export const GOLD_MOCK = {
  source: 'Federation of Nepal Gold and Silver Dealers Association (FENEGOSIDA)',
  sourceShort: 'FENEGOSIDA',
  rateType: 'Daily Nepal gold rate (Fine Gold 99.99%)',
  lastUpdatedTime: '11:00 AM NPT',
  fineGold: {
    pricePerTola: 297300,
    yesterdayPricePerTola: 296100,
  },
};

// ─── SILVER (FENEGOSIDA rates) ─────────────────────────────

export const SILVER_MOCK = {
  source: 'Federation of Nepal Gold and Silver Dealers Association (FENEGOSIDA)',
  sourceShort: 'FENEGOSIDA',
  rateType: 'Daily Nepal silver rate',
  lastUpdatedTime: '11:00 AM NPT',
  silver: {
    pricePerTola: 4765,
    yesterdayPricePerTola: 4700,
  },
};
