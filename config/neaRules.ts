/**
 * NEA Domestic Electricity Tariff — FY 2083/84
 * =============================================
 * Single-source tariff configuration for the Nepal Electricity Bill
 * Calculator. All rates, slab boundaries, minimum charges, and VAT rules
 * live here, versioned by fiscal year, with source and verification notes.
 *
 * SOURCES & VERIFICATION (cross-checked, not yet confirmed against the
 * official ERC/NEA PDF — verify before production use):
 * - merokalam.com/blog/nea-tariff-rates-nepal (FY 2083/84 table, with
 *   worked examples for 15A meters that reconcile exactly)
 * - bhismarajpun.com.np/p/electricity-bill-calculator.html (5A/15A/30A/60A
 *   tables with minimum charges and rates)
 * - ev-nepal.com/news/new-nea-tax-increase (5A/15A/30A tables)
 * - nepalenergyforum.com/nea-electricity-tariff-rates (ERC reference)
 *
 * KEY FY 2083/84 RULES:
 * - Progressive slab energy charges. The slab that contains TOTAL
 *   consumption also selects ONE monthly minimum charge.
 * - 5A lifeline: the first 20 units are FREE only when total use stays at
 *   20 units or below; if total exceeds 20, the first 20 units are charged
 *   at Rs 3.00/unit before higher slabs apply.
 * - VAT: concessional 5% on domestic electricity, applied ONLY to the
 *   energy charge of units above 50. The first 50 units are VAT-exempt;
 *   the minimum charge is not part of the VAT basis.
 *
 * LAST UPDATED: 2026-08-19
 */

export interface NeaSlab {
  /** Inclusive lower bound (units). First slab uses min: 1. */
  min: number;
  /** Inclusive upper bound (units); null = no upper limit (top slab). */
  max: number | null;
  /** Energy rate per unit (Rs/kWh). */
  rate: number;
  /** Monthly minimum charge applied when TOTAL consumption is in this band. */
  minCharge: number;
}

export interface NeaTariff {
  id: string;
  label: string;
  slabs: NeaSlab[];
  /** 5A lifeline: first N units are free only when total <= N. */
  lifelineFreeUnits?: number;
  vatRate: number;
  vatExemptionUnits: number;
  source: string;
  lastVerified: string;
  needsVerification: boolean;
}

export const NEA_DOMESTIC_TARIFF: Record<string, NeaTariff> = {
  '5A': {
    id: '5A',
    label: '5 Amp (Single Phase)',
    slabs: [
      { min: 1, max: 20, rate: 3.0, minCharge: 30 },
      { min: 21, max: 30, rate: 6.5, minCharge: 50 },
      { min: 31, max: 50, rate: 8.0, minCharge: 50 },
      { min: 51, max: 100, rate: 9.5, minCharge: 75 },
      { min: 101, max: 250, rate: 9.5, minCharge: 100 },
      { min: 251, max: null, rate: 11.0, minCharge: 150 },
    ],
    lifelineFreeUnits: 20,
    vatRate: 0.05,
    vatExemptionUnits: 50,
    source: 'NEA domestic tariff FY 2083/84 (cross-checked: merokalam.com, bhismarajpun.com, ev-nepal.com, nepalenergyforum.com)',
    lastVerified: '2026-08-19',
    needsVerification: true,
  },
  '15A': {
    id: '15A',
    label: '15 Amp (Single Phase)',
    slabs: [
      { min: 1, max: 20, rate: 4.0, minCharge: 50 },
      { min: 21, max: 30, rate: 6.5, minCharge: 75 },
      { min: 31, max: 50, rate: 8.0, minCharge: 75 },
      { min: 51, max: 100, rate: 9.5, minCharge: 100 },
      { min: 101, max: 250, rate: 9.5, minCharge: 125 },
      { min: 251, max: null, rate: 11.0, minCharge: 175 },
    ],
    vatRate: 0.05,
    vatExemptionUnits: 50,
    source: 'NEA domestic tariff FY 2083/84 (cross-checked: merokalam.com, bhismarajpun.com, ev-nepal.com, nepalenergyforum.com)',
    lastVerified: '2026-08-19',
    needsVerification: true,
  },
  '30A': {
    id: '30A',
    label: '30 Amp (Single Phase)',
    slabs: [
      { min: 1, max: 20, rate: 5.0, minCharge: 75 },
      { min: 21, max: 30, rate: 6.5, minCharge: 100 },
      { min: 31, max: 50, rate: 8.0, minCharge: 100 },
      { min: 51, max: 100, rate: 9.5, minCharge: 125 },
      { min: 101, max: 250, rate: 9.5, minCharge: 150 },
      { min: 251, max: null, rate: 11.0, minCharge: 200 },
    ],
    vatRate: 0.05,
    vatExemptionUnits: 50,
    source: 'NEA domestic tariff FY 2083/84 (cross-checked: merokalam.com, bhismarajpun.com, ev-nepal.com, nepalenergyforum.com)',
    lastVerified: '2026-08-19',
    needsVerification: true,
  },
  '60A': {
    id: '60A',
    label: '60 Amp (Single Phase)',
    slabs: [
      { min: 1, max: 20, rate: 6.0, minCharge: 125 },
      { min: 21, max: 30, rate: 6.5, minCharge: 125 },
      { min: 31, max: 50, rate: 8.0, minCharge: 125 },
      { min: 51, max: 100, rate: 9.5, minCharge: 150 },
      { min: 101, max: 250, rate: 9.5, minCharge: 200 },
      { min: 251, max: null, rate: 11.0, minCharge: 250 },
    ],
    vatRate: 0.05,
    vatExemptionUnits: 50,
    source: 'NEA domestic tariff FY 2083/84 (cross-checked: merokalam.com, bhismarajpun.com, ev-nepal.com, nepalenergyforum.com)',
    lastVerified: '2026-08-19',
    needsVerification: true,
  },
};

export const NEA_AMPERE_OPTIONS = ['5A', '15A', '30A', '60A'] as const;

export const CURRENT_FISCAL_YEAR = '2083/84';

export function getNeaTariff(ampere: string): NeaTariff | null {
  return NEA_DOMESTIC_TARIFF[ampere] || null;
}