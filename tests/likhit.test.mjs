/**
 * Integrity tests for the Likhit mock-test question bank.
 * Guarantees every question is well-formed so the quiz can never
 * render a broken item (missing options, no correct answer, …).
 * Run: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LIKHIT_QUESTIONS, TEST_QUESTIONS, TEST_SECONDS } from '../src/data/likhit-questions.js';

test('bank is bigger than one test paper', () => {
  assert.ok(LIKHIT_QUESTIONS.length > TEST_QUESTIONS, 'need spare questions for shuffling');
  assert.equal(TEST_QUESTIONS, 20);
  assert.equal(TEST_SECONDS, 20 * 60);
});

test('ids are unique and non-empty', () => {
  const ids = LIKHIT_QUESTIONS.map((q) => q.id);
  assert.ok(ids.every((id) => typeof id === 'string' && id.length > 0), 'every id non-empty');
  assert.equal(new Set(ids).size, ids.length, 'ids unique');
});

test('every question has category, text, 4 distinct options, one answer, explanation', () => {
  for (const q of LIKHIT_QUESTIONS) {
    assert.ok(q.cat && q.cat.length > 0, `${q.id}: missing category`);
    assert.ok(q.q && q.q.length > 10, `${q.id}: question text too short`);
    assert.ok(Array.isArray(q.options) && q.options.length === 4, `${q.id}: needs exactly 4 options`);
    assert.ok(q.options.every((o) => typeof o === 'string' && o.trim().length > 0), `${q.id}: empty option`);
    assert.equal(new Set(q.options.map((o) => o.trim())).size, 4, `${q.id}: duplicate options`);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, `${q.id}: answer must be 0-3`);
    assert.ok(q.why && q.why.length > 5, `${q.id}: missing explanation`);
  }
});

test('correct answers are spread across positions (no lazy all-A key)', () => {
  const counts = [0, 0, 0, 0];
  for (const q of LIKHIT_QUESTIONS) counts[q.answer]++;
  assert.ok(counts.every((c) => c > 0), `every position used at least once: ${counts}`);
});

test('covers all three topic groups', () => {
  const cats = new Set(LIKHIT_QUESTIONS.map((q) => q.cat));
  assert.ok(cats.has('Traffic signs'), 'signs covered');
  assert.ok(cats.has('Driving rules'), 'rules covered');
  assert.ok(cats.has('Licence & documents'), 'documents covered');
});

test('every question has a complete Nepali translation', () => {
  for (const q of LIKHIT_QUESTIONS) {
    assert.ok(q.cat_ne && q.cat_ne.length > 0, `${q.id}: missing cat_ne`);
    assert.ok(q.q_ne && q.q_ne.length > 10, `${q.id}: q_ne too short`);
    assert.ok(Array.isArray(q.options_ne) && q.options_ne.length === 4, `${q.id}: options_ne needs exactly 4`);
    assert.ok(q.options_ne.every((o) => typeof o === 'string' && o.trim().length > 0), `${q.id}: empty options_ne`);
    assert.equal(new Set(q.options_ne.map((o) => o.trim())).size, 4, `${q.id}: duplicate options_ne`);
    assert.ok(q.why_ne && q.why_ne.length > 5, `${q.id}: missing why_ne`);
  }
});

test('covers all three topic groups in Nepali', () => {
  const cats = new Set(LIKHIT_QUESTIONS.map((q) => q.cat_ne));
  assert.ok(cats.has('ट्राफिक संकेत'), 'signs covered (ne)');
  assert.ok(cats.has('सवारी नियम'), 'rules covered (ne)');
  assert.ok(cats.has('लाइसेन्स तथा कागजात'), 'documents covered (ne)');
});
