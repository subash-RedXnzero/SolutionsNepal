/**
 * Online Selling Profit — Pure calculation engine (Nepal)
 * Deterministic, no DOM. All amounts NPR unless noted.
 * @module online-selling-profit
 */

export function sanitizeAmount(v) {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/,/g, '').replace(/^Rs\.?\s*/i, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}
export function sanitizePct(v, fallback = 0) {
  const n = Number(String(v).replace(/,/g, '').trim());
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, 100);
}
export function formatNPR(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'Rs 0';
  const sign = v < 0 ? '-' : '';
  return `${sign}Rs ${new Intl.NumberFormat('en-IN').format(Math.abs(Math.round(v)))}`;
}
export function formatPct(n) {
  if (!Number.isFinite(n)) return '—';
  return `${(Math.round(n * 10) / 10).toFixed(1)}%`;
}
export function formatInt(n) {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

/**
 * @param {object} p (raw user strings allowed)
 */
export function calcOnlineProfit(p = {}) {
  const sellingPrice = sanitizeAmount(p.sellingPrice);
  const productCost = sanitizeAmount(p.productCost);

  // discount
  let discountAmt = 0;
  if (p.discountMode === 'pct') {
    const pct = sanitizePct(p.discountPct);
    discountAmt = (sellingPrice * pct) / 100;
  } else if (p.discountMode === 'fixed') {
    discountAmt = sanitizeAmount(p.discountAmount);
  }
  discountAmt = Math.min(discountAmt, sellingPrice);
  const netSellingPrice = Math.max(0, sellingPrice - discountAmt);

  const packaging = sanitizeAmount(p.packagingCost);
  const deliveryInput = sanitizeAmount(p.deliveryCost);
  let sellerDelivery = 0;
  if (p.deliveryPays === 'seller') sellerDelivery = deliveryInput;
  else if (p.deliveryPays === 'split') {
    const share = sanitizePct(p.splitShare, 50);
    sellerDelivery = (deliveryInput * share) / 100;
  }

  const platformFee = p.platformEnabled ? (netSellingPrice * sanitizePct(p.platformPct)) / 100 : 0;
  const paymentFeePct = p.paymentEnabled ? (netSellingPrice * sanitizePct(p.paymentPct)) / 100 : 0;
  const fixedPay = p.paymentEnabled ? sanitizeAmount(p.fixedPaymentFee) : 0;
  const paymentFee = paymentFeePct + fixedPay;

  // advertising per order
  let advPerOrder = sanitizeAmount(p.advertisingPerOrder);
  if (p.adMode === 'monthly') {
    const budget = sanitizeAmount(p.monthlyAdBudget);
    const orders = Math.max(0, Math.floor(Number(String(p.ordersPerMonth).replace(/,/g, '')) || 0));
    advPerOrder = orders > 0 ? budget / orders : 0;
  }

  const otherPerOrder = sanitizeAmount(p.otherCost);

  const totalVariableCost = productCost + packaging + sellerDelivery + platformFee + paymentFee + advPerOrder + otherPerOrder;
  const profitPerOrder = netSellingPrice - totalVariableCost;
  const profitMargin = netSellingPrice > 0 ? (profitPerOrder / netSellingPrice) * 100 : 0;

  // monthly
  const ordersPerMonth = Math.max(0, Math.floor(Number(String(p.ordersPerMonth).replace(/,/g, '')) || 0));
  const returnRate = sanitizePct(p.returnRate);
  const expectedReturned = (ordersPerMonth * returnRate) / 100;
  const expectedCompleted = Math.max(0, ordersPerMonth - expectedReturned);
  const grossMonthlySales = sellingPrice * ordersPerMonth;
  const netMonthlyRevenue = netSellingPrice * ordersPerMonth;
  const monthlyVariableProfit = profitPerOrder * expectedCompleted;
  const monthlyFixed = sanitizeAmount(p.rent) + sanitizeAmount(p.staff) + sanitizeAmount(p.internet) + sanitizeAmount(p.fixedOther);
  const estimatedMonthlyBusinessProfit = monthlyVariableProfit - monthlyFixed;

  // break-even solving: net*(1-(plat+pay)/100) = fixedPerOrderCosts
  const platPct = p.platformEnabled ? sanitizePct(p.platformPct) : 0;
  const payPct = p.paymentEnabled ? sanitizePct(p.paymentPct) : 0;
  const fixedPerOrder = productCost + packaging + sellerDelivery + fixedPay + advPerOrder + otherPerOrder;
  const denom = 1 - (platPct + payPct) / 100;
  let breakEvenNet = 0;
  if (denom > 1e-9) breakEvenNet = fixedPerOrder / denom;
  else breakEvenNet = Infinity;
  let breakEvenSelling = 0;
  if (p.discountMode === 'pct') {
    const d = sanitizePct(p.discountPct);
    const f = 1 - d / 100;
    breakEvenSelling = f > 1e-9 ? breakEvenNet / f : Infinity;
  } else if (p.discountMode === 'fixed') {
    breakEvenSelling = breakEvenNet + sanitizeAmount(p.discountAmount);
  } else {
    breakEvenSelling = breakEvenNet;
  }

  // pricing insights around current selling price
  const scenarios = [];
  if (sellingPrice > 0) {
    const deltas = [-500, -250, 0, 250, 500];
    for (const d of deltas) {
      const sp = sellingPrice + d;
      if (sp <= 0) continue;
      // recompute with same discount mode relative to new sp?
      // For scenario, keep discount logic proportional: if pct mode, net=sc* (1-d%), if fixed, net=sc - fixed
      let net = sp;
      if (p.discountMode === 'pct') net = sp * (1 - sanitizePct(p.discountPct) / 100);
      else if (p.discountMode === 'fixed') net = Math.max(0, sp - sanitizeAmount(p.discountAmount));
      const plat = p.platformEnabled ? (net * platPct) / 100 : 0;
      const pay = p.paymentEnabled ? (net * payPct) / 100 + fixedPay : 0;
      const tv = productCost + packaging + sellerDelivery + plat + pay + advPerOrder + otherPerOrder;
      const prof = net - tv;
      const marg = net > 0 ? (prof / net) * 100 : 0;
      scenarios.push({ sellingPrice: sp, net, profit: prof, margin: marg });
    }
  }

  return {
    inputs: { sellingPrice, productCost, ordersPerMonth, returnRate },
    netSellingPrice,
    discountAmt,
    platformFee,
    paymentFee,
    sellerDelivery,
    advPerOrder,
    totalVariableCost,
    profitPerOrder,
    profitMargin,
    grossMonthlySales,
    netMonthlyRevenue,
    expectedReturned,
    expectedCompleted,
    monthlyVariableProfit,
    monthlyFixed,
    estimatedMonthlyBusinessProfit,
    breakEvenNet,
    breakEvenSelling,
    scenarios,
    warnings: [],
  };
}
