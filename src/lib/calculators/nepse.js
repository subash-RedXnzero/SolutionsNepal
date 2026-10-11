/**
 * NEPSE Profit/Loss Calculator
 * Calculates profit or loss from NEPSE stock trades
 * 
 * NEPSE charges:
 * - Broker commission: 0.36% (varies, using standard rate)
 * - SEBON fee: 0.015%
 * - DP charge: Rs 25 per transaction
 * - Capital gains tax: 5% on profits (for shares held < 1 year)
 * - Capital gains tax: Exempt for first Rs 100,000 profit (for shares held >= 1 year)
 */

export function calculateNEPSETrade({
  buyPrice,
  sellPrice,
  quantity,
  brokerCommissionRate = 0.36,
  sebonFeeRate = 0.015,
  dpCharge = 25,
  holdingPeriodDays = 0,
}) {
  const buyTotal = buyPrice * quantity;
  const sellTotal = sellPrice * quantity;

  // Buy-side charges
  const buyBrokerCommission = Math.max(buyTotal * (brokerCommissionRate / 100), 10);
  const buySebonFee = buyTotal * (sebonFeeRate / 100);
  const buyCharges = buyBrokerCommission + buySebonFee + dpCharge;

  // Sell-side charges
  const sellBrokerCommission = Math.max(sellTotal * (brokerCommissionRate / 100), 10);
  const sellSebonFee = sellTotal * (sebonFeeRate / 100);
  const sellCharges = sellBrokerCommission + sellSebonFee + dpCharge;

  const totalCharges = buyCharges + sellCharges;

  // Profit/Loss before tax
  const grossProfit = sellTotal - buyTotal;
  const netProfit = grossProfit - totalCharges;

  // Capital gains tax
  let capitalGainsTax = 0;
  if (netProfit > 0) {
    if (holdingPeriodDays < 365) {
      // Short-term: 5% tax on entire profit
      capitalGainsTax = netProfit * 0.05;
    } else {
      // Long-term: first Rs 100,000 profit is exempt
      const taxableProfit = Math.max(0, netProfit - 100000);
      capitalGainsTax = taxableProfit * 0.05;
    }
  }

  const finalProfit = netProfit - capitalGainsTax;

  return {
    buyTotal: Math.round(buyTotal),
    sellTotal: Math.round(sellTotal),
    buyBrokerCommission: Math.round(buyBrokerCommission),
    buySebonFee: Math.round(buySebonFee),
    sellBrokerCommission: Math.round(sellBrokerCommission),
    sellSebonFee: Math.round(sellSebonFee),
    totalCharges: Math.round(totalCharges),
    grossProfit: Math.round(grossProfit),
    netProfit: Math.round(netProfit),
    capitalGainsTax: Math.round(capitalGainsTax),
    finalProfit: Math.round(finalProfit),
    isProfit: finalProfit >= 0,
    returnPercent: buyTotal > 0 ? ((finalProfit / buyTotal) * 100).toFixed(2) : 0,
  };
}
