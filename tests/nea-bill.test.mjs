/**
 * Tests for the NEA electricity bill engine (FY 2083/84).
 * Expected values verified against the FY 2083/84 tariff tables and
 * worked examples from merokalam.com (15A: 50u → 380, 51u → 414.98,
 * 60u → 504.75).
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculateNeaBill, formatNPR, formatNumber } from '../src/lib/calculators/nea-bill.js';
import { NEA_DOMESTIC_TARIFF, NEA_AMPERE_OPTIONS, getNeaTariff } from '../config/neaRules.ts';

const assertMoney = (a, b, msg) =>
  assert.ok(Math.abs(Number(a) - Number(b)) < 0.001, `${msg || 'money mismatch'}: ${a} != ${b}`);

test('config: has all four ampere options and each tariff', () => {
  assert.deepEqual(NEA_AMPERE_OPTIONS, ['5A', '15A', '30A', '60A']);
  for (const amp of NEA_AMPERE_OPTIONS) {
    assert.ok(getNeaTariff(amp), `missing tariff for ${amp}`);
    assert.ok(NEA_DOMESTIC_TARIFF[amp].slabs.length > 0, `${amp} has no slabs`);
    assert.equal(NEA_DOMESTIC_TARIFF[amp].vatRate, 0.05);
    assert.equal(NEA_DOMESTIC_TARIFF[amp].vatExemptionUnits, 50);
  }
});

test('15A: 50 units → energy 305, min 75, VAT 0, total 380 (merokalam example)', () => {
  const r = calculateNeaBill({ ampere: '15A', units: 50 });
  assertMoney(r.energyCharge, 305);
  assertMoney(r.minCharge, 75);
  assertMoney(r.vatAmount, 0);
  assertMoney(r.totalBill, 380);
  assert.equal(r.input.units, 50);
});

test('15A: 51 units → energy 314.50, min 100, VAT 0.48, total 414.98 (merokalam example)', () => {
  const r = calculateNeaBill({ ampere: '15A', units: 51 });
  assertMoney(r.energyCharge, 314.5);
  assertMoney(r.minCharge, 100);
  assertMoney(r.vatAmount, 0.48);
  assertMoney(r.totalBill, 414.98);
});

test('15A: 60 units → energy 400, min 100, VAT 4.75, total 504.75 (merokalam example)', () => {
  const r = calculateNeaBill({ ampere: '15A', units: 60 });
  assertMoney(r.energyCharge, 400);
  assertMoney(r.minCharge, 100);
  assertMoney(r.vatAmount, 4.75);
  assertMoney(r.totalBill, 504.75);
});

test('15A: 250 units → energy 2205, min 125, VAT 95, total 2425', () => {
  const r = calculateNeaBill({ ampere: '15A', units: 250 });
  assertMoney(r.energyCharge, 2205);
  assertMoney(r.minCharge, 125);
  assertMoney(r.vatAmount, 95);
  assertMoney(r.totalBill, 2425);
});

test('5A: 20 units → energy 0 (lifeline free), min 30, total 30', () => {
  const r = calculateNeaBill({ ampere: '5A', units: 20 });
  assertMoney(r.energyCharge, 0);
  assertMoney(r.minCharge, 30);
  assertMoney(r.totalBill, 30);
});

test('5A: 50 units → energy 285 (first 20 @3), min 50, VAT 0, total 335', () => {
  const r = calculateNeaBill({ ampere: '5A', units: 50 });
  assertMoney(r.energyCharge, 285);
  assertMoney(r.minCharge, 50);
  assertMoney(r.vatAmount, 0);
  assertMoney(r.totalBill, 335);
});

test('5A: 100 units → energy 760, min 75, VAT 23.75, total 858.75', () => {
  const r = calculateNeaBill({ ampere: '5A', units: 100 });
  assertMoney(r.energyCharge, 760);
  assertMoney(r.minCharge, 75);
  assertMoney(r.vatAmount, 23.75);
  assertMoney(r.totalBill, 858.75);
});

test('30A: 100 units → min 125 (band 51-100)', () => {
  const r = calculateNeaBill({ ampere: '30A', units: 100 });
  assertMoney(r.minCharge, 125);
  assert.ok(r.totalBill > 0);
});

test('60A: 20 units → energy 120 (20×6.0), min 125, total 245', () => {
  const r = calculateNeaBill({ ampere: '60A', units: 20 });
  assertMoney(r.minCharge, 125);
  assertMoney(r.energyCharge, 120);
  assertMoney(r.totalBill, 245);
});

test('zero units: still applies minimum charge', () => {
  const r = calculateNeaBill({ ampere: '5A', units: 0 });
  assertMoney(r.energyCharge, 0);
  assertMoney(r.minCharge, 30);
  assertMoney(r.totalBill, 30);
});

test('negative units are clamped to zero', () => {
  const r = calculateNeaBill({ ampere: '5A', units: -5 });
  assert.equal(r.input.units, 0);
  assertMoney(r.totalBill, 30);
});

test('default ampere is 5A', () => {
  const r = calculateNeaBill({ units: 20 });
  assert.equal(r.input.ampere, '5A');
});

test('unknown ampere throws', () => {
  assert.throws(() => calculateNeaBill({ ampere: '999A', units: 50 }), /Unknown NEA tariff/);
});

test('slab breakdown is progressive and totals energy charge', () => {
  const r = calculateNeaBill({ ampere: '15A', units: 60 });
  const sum = r.slabs.reduce((acc, s) => acc + s.charge, 0);
  assertMoney(sum, r.energyCharge);
  assert.equal(r.slabs.length, 4);
  assert.equal(r.slabs[0].rate, 4);
  assert.equal(r.slabs[3].label, '51–100 units');
});

test('formatNPR uses en-IN grouping with Rs prefix', () => {
  assert.equal(formatNPR(1234567), 'Rs. 12,34,567');
  assert.equal(formatNPR(380), 'Rs. 380');
  assert.equal(formatNPR(504.75), 'Rs. 505');
});

test('formatNumber uses en-IN grouping', () => {
  assert.equal(formatNumber(1234567), '12,34,567');
  assert.equal(formatNumber(414.98), '415');
});