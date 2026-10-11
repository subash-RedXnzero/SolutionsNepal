/**
 * Tests for the Rent vs Buy calculator engine.
 * EMI golden values verified independently (10L @10% 10yr → EMI 13,215.07,
 * balance after 5yr 6,21,972.32). Comparison direction cases are
 * deliberately clear-cut so the expected winner is unambiguous.
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  calcEmi,
  loanBalance,
  compareRentVsBuy,
  breakevenYear,
  rentVsBuySeries,
} from '../src/lib/calculators/rent-vs-buy.js';

const approx = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 0.01, `${msg || 'mismatch'}: ${a} != ${b}`);

const BASE = {
  monthlyRent: 25000,
  rentGrowthPct: 5,
  homePrice: 15000000,
  downPct: 20,
  ratePct: 10,
  tenureYears: 20,
  horizonYears: 10,
  appreciationPct: 4,
  maintenancePct: 1,
  buyingCostPct: 5,
};

test('EMI golden: 10L @10% for 10yr → 13,215.07/mo', () => {
  approx(calcEmi(1000000, 10, 120), 13215.07, 'emi');
});

test('EMI zero rate splits principal evenly', () => {
  approx(calcEmi(1200000, 0, 120), 10000, 'zero-rate emi');
});

test('balance golden: 10L @10% → 6,21,972.32 after 5yr, ~0 at tenure end', () => {
  approx(loanBalance(1000000, 10, 120, 60), 621972.32, 'mid balance');
  assert.ok(Math.abs(loanBalance(1000000, 10, 120, 120)) < 0.01, 'terminal balance ~0');
  approx(loanBalance(1000000, 10, 120, 0), 1000000, 'initial balance = loan');
});

test('cheap rent vs pricey flat → renting wins', () => {
  const r = compareRentVsBuy({ ...BASE, monthlyRent: 15000, homePrice: 25000000 });
  assert.equal(r.winner, 'rent');
  assert.ok(r.rentTotal < r.buyNet, 'rent total below buying net');
});

test('expensive rent vs modest flat → buying wins', () => {
  const r = compareRentVsBuy({ ...BASE, monthlyRent: 80000, homePrice: 8000000 });
  assert.equal(r.winner, 'buy');
  assert.ok(r.buyNet < r.rentTotal, 'buying net below rent total');
});

test('rent total matches hand calc: 25k/mo, 0% growth, 10yr → 30L', () => {
  const r = compareRentVsBuy({ ...BASE, monthlyRent: 25000, rentGrowthPct: 0 });
  approx(r.rentTotal, 3000000, 'flat rent total');
});

test('cash buyer, no growth, no costs: net ≈ maintenance only', () => {
  const r = compareRentVsBuy({
    ...BASE,
    downPct: 100,
    ratePct: 0,
    appreciationPct: 0,
    maintenancePct: 0,
    buyingCostPct: 0,
    horizonYears: 5,
  });
  approx(r.buyNet, 0, 'fully-paid static flat costs nothing net');
  approx(r.equity, BASE.homePrice, 'equity equals price');
});

test('breakeven found when buying eventually wins, null otherwise', () => {
  const by = breakevenYear({ ...BASE, monthlyRent: 80000, homePrice: 8000000 });
  assert.ok(Number.isInteger(by) && by >= 1 && by <= 30, `breakeven year sane, got ${by}`);
  assert.equal(breakevenYear({ ...BASE, monthlyRent: 15000, homePrice: 25000000, appreciationPct: 0 }), null);
});

test('series has one row per year and ends at the totals', () => {
  const rows = rentVsBuySeries(BASE);
  assert.equal(rows.length, 10);
  const full = compareRentVsBuy(BASE);
  approx(rows[9].rent, full.rentTotal, 'final rent row = total');
  approx(rows[9].buy, full.buyNet, 'final buy row = net');
});
