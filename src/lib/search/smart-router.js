/**
 * SolutionsNepal — Smart Search Router
 *
 * Turns natural-language queries (English + Nepali Devanagari) into the right
 * tool URL. Used by the homepage hero search and the Cmd+K search modal.
 *
 * Examples handled:
 *   "मेरो salary 80 हजार छ, tax पछि कति आउँछ?"  → /nepal/finance/salary-checker?basic=80000
 *   "2 ropani कति आना?"                          → /nepal/land/ropani-to-aana?value=2
 *   "10 लाख loan को EMI?"                        → /nepal/finance/emi-calculator?amount=1000000
 */

// Ordered: first match wins. Keep most specific intents near the top.
export const SMART_ROUTES = [
  { re: /(salary\s*tax|कर\s*कटौती|income\s*tax|tds)/i, href: '/nepal/finance/salary-tax', label: 'Salary Tax Calculator', why: 'Tax slabs & TDS by fiscal year', param: null },
  { re: /(dashain|दशैं|दशै|bonus|बोनस|festival\s*(allowance|bonus|expense)|chadparva|चाडपर्व)/i, href: '/nepal/finance/dashain-bonus-calculator', label: 'Dashain Bonus Calculator', why: 'Festival bonus estimate from salary', param: null },
  { re: /(salary|तलब|पारिश्रमिक|tax\s*पछि|tax\s*pachhi|take\s*home|net\s*pay|हजार)/i, href: '/nepal/finance/salary-checker', label: 'Nepal Salary Calculator', why: 'Take-home salary, SSF & income tax', param: 'basic' },
  { re: /(ropani|aana|आना|रोपनी|रोपैनी|paisa|पैसा|daam|दाम|biswansi|बिस्वंसी|dhur|धुर|kattha|कठ्ठा|bigha|बिघा|jagga|जग्गा)/i, href: '/nepal/land/ropani-to-aana', label: 'Land Converter (Ropani ↔ Aana)', why: 'Ropani, Aana, Paisa, Daam & more', param: 'value' },
  { re: /(emi|किस्ता|loan|ऋण|karja|कर्जा)/i, href: '/nepal/finance/emi-calculator', label: 'EMI Calculator', why: 'Monthly EMI & total interest', param: 'amount' },
  { re: /(gold\s*price|sun\s*ko\s*rate|सुनको\s*भाव|सुन\s*भाव|सुन\s*रेट)/i, href: '/nepal/gold-price-nepal', label: 'Gold Price Nepal', why: "Today's gold price per tola", param: null },
  { re: /(gold|सुन|tola|तोला|chandi|चाँदी|silver)/i, href: '/nepal/gold/tola-to-gram', label: 'Gold Weight Converter', why: 'Tola ↔ Gram for gold & silver', param: null },
  { re: /(unicode|प्रीति|preeti|type\s*nepali|नेपाली\s*टाइप|nepali\s*typing)/i, href: '/nepal/tools/nepali-unicode', label: 'Nepali Unicode', why: 'Type Nepali from Roman / Preeti', param: null },
  { re: /(translate|अनुवाद|अनुबाद)/i, href: '/nepal/tools/english-to-nepali-translator', label: 'English → Nepali Translator', why: 'Translate sentences instantly', param: null },
  { re: /(forex|exchange\s*rate|विनिमय|dollar|डलर|usd|remit|रेमिट)/i, href: '/nepal/finance/remittance-calculator', label: 'Remittance / Forex Calculator', why: 'NRB rates for foreign currency', param: null },
  { re: /(fuel|petrol|diesel|पेट्रोल|डिजेल)/i, href: '/nepal/fuel-price-nepal', label: 'Fuel Price Nepal', why: "Today's petrol & diesel prices", param: null },
  { re: /(vehicle\s*tax|गाडी\s*कर|gadi\s*kar|bike\s*tax|renewal)/i, href: '/nepal/transport/vehicle-tax', label: 'Vehicle Tax Calculator', why: 'Tax, fines & renewal costs', param: null },
  { re: /(bijuli|बिजुली|electricity|light\s*bill|nea)/i, href: '/nepal/utilities/electricity-bill', label: 'NEA Electricity Bill', why: 'Estimate your NEA bill', param: null },
  { re: /(water\s*bill|पानी\s*बिल|kukl)/i, href: '/nepal/utilities/kukl-water-bill', label: 'KUKL Water Bill', why: 'Estimate your water bill', param: null },
  { re: /(vat|भ्याट|मूल्य\s*अभिवृद्धि)/i, href: '/nepal/finance/vat-calculator', label: 'VAT Calculator', why: 'Add or remove 13% VAT', param: null },
  { re: /(sip|investment|लगानी)/i, href: '/nepal/finance/sip-calculator', label: 'SIP Calculator', why: 'Monthly investment returns', param: null },
  { re: /(nepse|share|शेयर|stock)/i, href: '/nepal/nepse/profit-loss', label: 'NEPSE Profit/Loss', why: 'Stock trade profit & CGT', param: null },
  { re: /(land\s*registration|जग्गा\s*दर्ता|jagga\s*darta|registration\s*fee)/i, href: '/nepal/property/land-registration', label: 'Land Registration Fee', why: 'Registration & transfer costs', param: null },
  { re: /(bmi|मोटोपना)/i, href: '/tools/bmi-calculator', label: 'BMI Calculator', why: 'Body Mass Index from height & weight', param: null },
  { re: /(pdf)/i, href: '/tools/merge-pdf', label: 'PDF Tools', why: 'Merge, compress, convert & split', param: null },
  { re: /(qr|क्यूआर)/i, href: '/tools/qr-code-generator', label: 'QR Code Generator', why: 'URL, WiFi, WhatsApp & more', param: null },
  { re: /(passport\s*photo|फोटो\s*साइज|photo\s*resize|photo\s*compress)/i, href: '/tools/passport-photo-resizer', label: 'Passport Size Photo', why: '2×2 inch crop & compress', param: null },
  { re: /(age|उमेर|umer)/i, href: '/nepal/age-calculator', label: 'Nepali Age Calculator', why: 'Exact age in BS or AD', param: null },
  { re: /(date|मिति|miti|calendar|पात्रो|patro)/i, href: '/nepal/calendar', label: 'Nepali Calendar', why: 'BS calendar, tithi & festivals', param: null },
];

const DEV_DIGITS = { '०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9' };

/** Convert Devanagari digits to ASCII. */
export function normalizeDigits(str) {
  return String(str).replace(/[०-९]/g, d => DEV_DIGITS[d] || d);
}

/**
 * Extract a quantity from the query, expanding Nepali magnitude words:
 * "80 हजार" → "80000", "10 लाख" → "1000000", "2" → "2".
 */
const MULTIPLIERS = [
  { re: /^(करोड|karod|crores?|cores?)$/i, mult: 10000000 },
  { re: /^(लाख|lakh|lakhs?|lac|lacs?)$/i, mult: 100000 },
  { re: /^(हजार|hajar|thousands?)$/i, mult: 1000 },
];

export function extractAmount(raw) {
  const s = normalizeDigits(raw).replace(/[,،]/g, '');
  const m = s.match(/(?:rs\.?|npr|रु)?\s*(\d{1,9})\s*(करोड|karod|crores?|cores?|लाख|lakh|lakhs?|lac|lacs?|हजार|hajar|thousands?)?/i);
  if (!m) return null;
  if (!m[2]) return m[1];
  const hit = MULTIPLIERS.find(mp => mp.re.test(m[2]));
  return hit ? String(Number(m[1]) * hit.mult) : m[1];
}

/**
 * Route a raw query to a tool. Returns
 *   { href, label, why, amount }  |  null
 */
export function routeQuery(raw) {
  const q = normalizeDigits(String(raw || '').trim());
  if (!q) return null;
  for (const route of SMART_ROUTES) {
    if (route.re.test(q)) {
      const amount = route.param ? extractAmount(q) : null;
      return { href: buildRouteHref(route, amount), label: route.label, why: route.why, amount };
    }
  }
  return null;
}

/** Append the extracted amount as the route's deep-link query param. */
export function buildRouteHref(route, amount) {
  if (!route.param || !amount) return route.href;
  return `${route.href}?${route.param}=${encodeURIComponent(amount)}`;
}
