/**
 * Tests for the Image Compression engine utility functions.
 *
 * Note: Full compression tests require a browser environment (Canvas API).
 * These tests validate the pure utility functions.
 *
 * Run: node --test tests/image-compress.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatBytes, getExtFromMime, isSupported } from '../src/lib/converters/image-compress.js';

// ────────────────────────────────────────────────────────────────────────
// formatBytes
// ────────────────────────────────────────────────────────────────────────

test('formatBytes: 0 bytes', () => {
  assert.equal(formatBytes(0), '0 B');
});

test('formatBytes: bytes', () => {
  assert.equal(formatBytes(500), '500 B');
});

test('formatBytes: kilobytes', () => {
  assert.equal(formatBytes(1024), '1.0 KB');
});

test('formatBytes: megabytes', () => {
  assert.equal(formatBytes(1048576), '1.0 MB');
});

test('formatBytes: gigabytes', () => {
  assert.equal(formatBytes(1073741824), '1.0 GB');
});

test('formatBytes: partial KB', () => {
  assert.equal(formatBytes(850000), '830.1 KB');
});

test('formatBytes: partial MB', () => {
  assert.equal(formatBytes(2500000), '2.4 MB');
});

test('formatBytes: exactly 1 KB', () => {
  assert.equal(formatBytes(1024), '1.0 KB');
});

// ────────────────────────────────────────────────────────────────────────
// getExtFromMime
// ────────────────────────────────────────────────────────────────────────

test('getExtFromMime: jpeg', () => {
  assert.equal(getExtFromMime('image/jpeg'), 'jpg');
});

test('getExtFromMime: png', () => {
  assert.equal(getExtFromMime('image/png'), 'png');
});

test('getExtFromMime: webp', () => {
  assert.equal(getExtFromMime('image/webp'), 'webp');
});

test('getExtFromMime: unknown defaults to jpg', () => {
  assert.equal(getExtFromMime('image/gif'), 'jpg');
});

// ────────────────────────────────────────────────────────────────────────
// isSupported
// ────────────────────────────────────────────────────────────────────────

test('isSupported: JPEG file', () => {
  const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
  assert.equal(isSupported(file), true);
});

test('isSupported: PNG file', () => {
  const file = new File([''], 'test.png', { type: 'image/png' });
  assert.equal(isSupported(file), true);
});

test('isSupported: WebP file', () => {
  const file = new File([''], 'test.webp', { type: 'image/webp' });
  assert.equal(isSupported(file), true);
});

test('isSupported: GIF file (unsupported)', () => {
  const file = new File([''], 'test.gif', { type: 'image/gif' });
  assert.equal(isSupported(file), false);
});

test('isSupported: SVG file (unsupported)', () => {
  const file = new File([''], 'test.svg', { type: 'image/svg+xml' });
  assert.equal(isSupported(file), false);
});

test('isSupported: BMP file (unsupported)', () => {
  const file = new File([''], 'test.bmp', { type: 'image/bmp' });
  assert.equal(isSupported(file), false);
});

// ────────────────────────────────────────────────────────────────────────
// Edge cases
// ────────────────────────────────────────────────────────────────────────

test('formatBytes: large values', () => {
  assert.equal(formatBytes(10737418240), '10.0 GB');
});

test('formatBytes: small values', () => {
  assert.equal(formatBytes(1), '1 B');
});

test('getExtFromMime: empty string', () => {
  assert.equal(getExtFromMime(''), 'jpg');
});

test('isSupported: file with no type', () => {
  const file = new File([''], 'test');
  assert.equal(isSupported(file), false);
});
