/**
 * Nepal Remittance Calculator Engine
 * Rate normalization, currency conversion, and formatting utilities.
 * Uses NRB official reference rates.
 * LAST UPDATED: 2026-08-21
 */

const NRB_API_BASE = "https://www.nrb.org.np/api/forex/v1/rates";

/** Currency metadata: symbols and display names */
export const CURRENCY_META = {
  AUD: { symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
  BHD: { symbol: "BD", name: "Bahraini Dinar", flag: "🇧🇭" },
  CAD: { symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
  CHF: { symbol: "Fr", name: "Swiss Franc", flag: "🇨🇭" },
  CNY: { symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳" },
  DKK: { symbol: "kr", name: "Danish Krone", flag: "🇩🇰" },
  EUR: { symbol: "€", name: "Euro", flag: "🇪🇺" },
  GBP: { symbol: "£", name: "British Pound", flag: "🇬🇧" },
  HKD: { symbol: "HK$", name: "Hong Kong Dollar", flag: "🇭🇰" },
  INR: { symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  JPY: { symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  KRW: { symbol: "₩", name: "South Korean Won", flag: "🇰🇷" },
  KWD: { symbol: "KD", name: "Kuwaiti Dinar", flag: "🇰🇼" },
  MYR: { symbol: "RM", name: "Malaysian Ringgit", flag: "🇲🇾" },
  OMR: { symbol: "﷼", name: "Omani Rial", flag: "🇴🇲" },
  QAR: { symbol: "﷼", name: "Qatari Riyal", flag: "🇶🇦" },
  SAR: { symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦" },
  SEK: { symbol: "kr", name: "Swedish Krona", flag: "🇸🇪" },
  SGD: { symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" },
  THB: { symbol: "฿", name: "Thai Baht", flag: "🇹🇭" },
  USD: { symbol: "$", name: "U.S. Dollar", flag: "🇺🇸" },
  AED: { symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
};

/**
 * Normalize an NRB rate using the unit field.
 * NRB quotes rates per `unit` of foreign currency.
 * e.g., unit=100, buy=160 means 100 INR = 160 NPR
 * Therefore 1 INR = 160/100 = 1.60 NPR
 */
export function normalizeRate(rate, unit) {
  var u = parseFloat(unit) || 1;
  if (u <= 0) u = 1;
  var r = parseFloat(rate);
  if (isNaN(r)) return null;
  return r / u;
}

/**
 * Convert foreign currency amount to NPR.
 * Uses normalized buy rate.
 */
export function convertToNPR(amount, normalizedBuyRate) {
  var a = parseFloat(amount);
  var r = parseFloat(normalizedBuyRate);
  if (isNaN(a) || isNaN(r) || a < 0) return null;
  return Math.round(a * r * 100) / 100;
}

/**
 * Apply optional fee to the conversion.
 * feeType: "foreign" | "npr"
 * If feeType is "foreign", fee is deducted from the foreign amount before conversion.
 * If feeType is "npr", fee is deducted from the NPR result.
 */
export function applyFee(nprAmount, foreignAmount, fee, feeType, normalizedBuyRate) {
  var f = parseFloat(fee) || 0;
  if (f <= 0) return { netNPR: nprAmount, netForeign: foreignAmount, feeNPR: 0 };
  if (feeType === "foreign") {
    var netForeign = Math.max(0, foreignAmount - f);
    var feeNPR = Math.round(f * normalizedBuyRate * 100) / 100;
    var netNPR = convertToNPR(netForeign, normalizedBuyRate);
    return { netNPR: netNPR, netForeign: netForeign, feeNPR: feeNPR };
  } else {
    var feeNPR2 = f;
    var netNPR2 = Math.max(0, nprAmount - feeNPR2);
    return { netNPR: netNPR2, netForeign: foreignAmount, feeNPR: feeNPR2 };
  }
}

/**
 * Fetch NRB rates from the API.
 * Tries today first, then falls back to previous days.
 * Returns { rates: [...], date: "YYYY-MM-DD", publishedOn: "..." }
 */
export async function fetchNRBRates() {
  var today = new Date();
  // Try up to7 days back
  for (var i = 0; i < 7; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var dateStr = formatDate(d);
    try {
      var url = NRB_API_BASE + "?from=" + dateStr + "&to=" + dateStr + "&page=1&per_page=100";
      var resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) continue;
      var json = await resp.json();
      var payload = json && json.data && json.data.payload;
      if (!payload || payload.length === 0) continue;

      var record = payload[0];
      var rates = record.rates;
      if (!rates || rates.length === 0) continue;

      var parsed = [];
      for (var j = 0; j < rates.length; j++) {
        var rate = rates[j];
        var iso = rate.currency && rate.currency.iso3;
        var name = rate.currency && rate.currency.name;
        var unit = parseFloat(rate.currency && rate.currency.unit) || 1;
        var buy = parseFloat(rate.buy);
        var sell = parseFloat(rate.sell);
        if (!iso || isNaN(buy)) continue;
        var normalizedBuy = normalizeRate(buy, unit);
        var normalizedSell = isNaN(sell) ? null : normalizeRate(sell, unit);
        if (normalizedBuy === null) continue;
        parsed.push({
          iso3: iso,
          name: name || iso,
          unit: unit,
          buy: buy,
          sell: isNaN(sell) ? null : sell,
          normalizedBuy: normalizedBuy,
          normalizedSell: normalizedSell,
        });
      }

      if (parsed.length > 0) {
        return {
          rates: parsed,
          date: record.date || dateStr,
          publishedOn: record.published_on || "",
        };
      }
    } catch (e) {
      // Try next date
      continue;
    }
  }
  return null;
}

/** Format a Date object to YYYY-MM-DD */
function formatDate(d) {
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

/** Format a date string like "21 Aug 2026" */
export function formatDateLong(dateStr) {
  if (!dateStr) return "";
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  var d = parseInt(parts[2], 10);
  var m = parseInt(parts[1], 10) - 1;
  var y = parts[0];
  return d + " " + (months[m] || "") + " " + y;
}

/** Format NPR amount with comma separators */
export function formatNPR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return "रु " + Number(amount).toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format foreign amount with comma separators */
export function formatForeign(amount, decimals) {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  var d = decimals !== undefined ? decimals : 2;
  return Number(amount).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Get the symbol for a currency code */
export function getCurrencySymbol(iso3) {
  var meta = CURRENCY_META[iso3];
  return meta ? meta.symbol : iso3;
}

/** Get display name for a currency code */
export function getCurrencyName(iso3) {
  var meta = CURRENCY_META[iso3];
  return meta ? meta.name : iso3;
}

/** Get flag emoji for a currency code */
export function getCurrencyFlag(iso3) {
  var meta = CURRENCY_META[iso3];
  return meta ? meta.flag : "";
}
