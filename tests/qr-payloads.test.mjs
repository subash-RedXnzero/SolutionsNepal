/**
 * Tests for QR payload builders.
 * Run: node --test tests/qr-payloads.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  escapeWifi,
  normalizePhone,
  normalizeUrl,
  buildUrlQr,
  buildTextQr,
  buildWifiQr,
  buildPhoneQr,
  buildEmailQr,
  buildWhatsappQr,
  buildVcardQr,
  buildSmsQr,
  buildLocationQr,
  buildUpiQr,
  buildPayload,
} from '../src/lib/qr/payloads.js';

// ── Helpers ─────────────────────────────────────────────────

test('escapeWifi escapes backslash, semicolon, comma, colon and quotes', () => {
  assert.equal(escapeWifi('a;b,c:d"e\\f'), 'a\\;b\\,c\\:d\\"e\\\\f');
});

test('normalizePhone strips formatting but keeps +', () => {
  assert.equal(normalizePhone('+977 98-12 (34) 5678'), '+9779812345678');
  assert.equal(normalizePhone('9812345678'), '9812345678');
  assert.equal(normalizePhone('   '), '');
});

test('normalizeUrl adds https:// only to bare domains', () => {
  assert.deepEqual(normalizeUrl('solutionsnepal.com'), { ok: true, value: 'https://solutionsnepal.com' });
  assert.deepEqual(normalizeUrl('www.solutionsnepal.com/page?id=1'), { ok: true, value: 'https://www.solutionsnepal.com/page?id=1' });
  // Never touch URLs that already have a scheme
  assert.equal(normalizeUrl('http://insecure.example').value, 'http://insecure.example');
  assert.equal(normalizeUrl('ftp://files.example').ok, true);
  assert.equal(normalizeUrl('').ok, false);
});

// ── URL ─────────────────────────────────────────────────────

test('URL QR passes full URLs through unchanged', () => {
  const r = buildUrlQr({ url: 'https://solutionsnepal.com/tools?s=a+b#top' });
  assert.deepEqual(r, { ok: true, payload: 'https://solutionsnepal.com/tools?s=a+b#top' });
  assert.equal(buildUrlQr({ url: 'not a url' }).ok, false);
});

// ── Text ────────────────────────────────────────────────────

test('Text QR preserves exact text incl. Nepali Unicode and newlines', () => {
  const r = buildTextQr({ text: 'नेपालकिटमा स्वागत छ।\nLine 2' });
  assert.equal(r.payload, 'नेपालकिटमा स्वागत छ।\nLine 2');
  assert.equal(buildTextQr({ text: '   ' }).ok, false);
});

test('Text QR rejects absurdly long text with a friendly error', () => {
  const r = buildTextQr({ text: 'x'.repeat(3000) });
  assert.equal(r.ok, false);
  assert.match(r.error, /too long/i);
});

// ── Wi-Fi ───────────────────────────────────────────────────

test('Wi-Fi QR builds standard payload with escaped special characters', () => {
  const r = buildWifiQr({ ssid: 'My;Net', password: 'p@ss:w,ord"', security: 'WPA' });
  // Only \ ; , : " need escaping — @ passes through untouched
  assert.equal(r.payload, 'WIFI:T:WPA;S:My\\;Net;P:p@ss\\:w\\,ord\\";;');
});

test('Wi-Fi QR nopass mode omits password and supports hidden flag', () => {
  const r = buildWifiQr({ ssid: 'Open Net', security: 'nopass', hidden: true });
  assert.equal(r.payload, 'WIFI:T:nopass;S:Open Net;H:true;;');
});

test('Wi-Fi QR requires SSID and password for secured networks', () => {
  assert.match(buildWifiQr({ ssid: '' }).error, /network name/i);
  const noPw = buildWifiQr({ ssid: 'net', password: '', security: 'WPA' });
  assert.match(noPw.error, /password/i);
});

// ── Phone / SMS ─────────────────────────────────────────────

test('Phone QR produces tel: URI', () => {
  assert.equal(buildPhoneQr({ phone: '+977 9812345678' }).payload, 'tel:+9779812345678');
  assert.equal(buildPhoneQr({ phone: 'abc' }).ok, false);
});

test('SMS QR uses SMSTO format with message', () => {
  assert.equal(
    buildSmsQr({ phone: '+9779800000000', message: 'Hello' }).payload,
    'SMSTO:+9779800000000:Hello',
  );
});

// ── Email ───────────────────────────────────────────────────

test('Email QR encodes mailto with subject and body', () => {
  const r = buildEmailQr({ email: 'hello@example.com', subject: 'Hi there', body: 'Line1\nLine2' });
  assert.ok(r.payload.startsWith('mailto:hello@example.com?'));
  assert.ok(r.payload.includes('subject=Hi%20there'));
  assert.ok(r.payload.includes('body=Line1%0ALine2'));
  assert.equal(buildEmailQr({ email: 'nope' }).ok, false);
});

// ── WhatsApp ────────────────────────────────────────────────

test('WhatsApp QR strips non-digits and URL-encodes the message', () => {
  const r = buildWhatsappQr({ phone: '+977 98-1234-5678', message: 'Namaste 🙏' });
  assert.equal(r.payload, 'https://wa.me/9779812345678?text=Namaste%20%F0%9F%99%8F');
  assert.ok(!/\s/.test(r.payload));
});

test('WhatsApp QR without message has no query string', () => {
  assert.equal(buildWhatsappQr({ phone: '9779812345678' }).payload, 'https://wa.me/9779812345678');
});

// ── vCard ───────────────────────────────────────────────────

test('vCard QR emits valid VCARD structure', () => {
  const r = buildVcardQr({
    firstName: 'Ram', lastName: 'Shrestha', org: 'SolutionsNepal', title: 'Dev',
    phone: '+9779812345678', email: 'ram@example.com',
    website: 'solutionsnepal.com', address: 'Kathmandu\nNepal',
  });
  const lines = r.payload.split('\n');
  assert.equal(lines[0], 'BEGIN:VCARD');
  assert.equal(lines[1], 'VERSION:3.0');
  assert.equal(lines[2], 'N:Shrestha;Ram;;;');
  assert.equal(lines[3], 'FN:Ram Shrestha');
  assert.ok(lines.some((l) => l === 'TEL;TYPE=CELL:+9779812345678'));
  assert.ok(lines.some((l) => l === 'EMAIL;TYPE=INTERNET:ram@example.com'));
  assert.ok(lines.some((l) => l === 'URL:https://solutionsnepal.com'));
  // newlines inside ADR must be flattened
  assert.ok(lines.every((l) => !l.includes('\n')));
  assert.equal(lines[lines.length - 1], 'END:VCARD');
});

test('vCard QR requires a name and validates email', () => {
  assert.match(buildVcardQr({}).error, /first or last name/i);
  assert.match(buildVcardQr({ firstName: 'A', email: 'bad' }).error, /valid email/i);
});

// ── Location ────────────────────────────────────────────────

test('Location QR builds geo: URI (Kathmandu)', () => {
  const r = buildLocationQr({ latitude: '27.7172', longitude: '85.3240' });
  assert.equal(r.payload, 'geo:27.7172,85.324');
});

test('Location QR rejects out-of-range coordinates', () => {
  assert.equal(buildLocationQr({ latitude: '200', longitude: '10' }).ok, false);
  assert.equal(buildLocationQr({ latitude: '', longitude: '10' }).ok, false);
  assert.equal(buildLocationQr({ latitude: '27.7', longitude: '-999' }).ok, false);
});

// ── Payment (UPI) ──────────────────────────────────────────

test('UPI payment QR builds standardized payload', () => {
  const r = buildUpiQr({ vpa: 'ram@nic', name: 'Ram', amount: '250.5', note: 'lunch' });
  assert.equal(r.payload, 'upi://pay?pa=ram%40nic&pn=Ram&am=250.50&cu=INR&tn=lunch');
});

test('UPI QR requires VPA and positive amount; never fabricates wallets', () => {
  assert.match(buildUpiQr({ vpa: 'nobank' }).error, /upi id/i);
  assert.match(buildUpiQr({ vpa: 'a@b', amount: '-5' }).error, /amount/i);
  const p = buildPayload('payment', { vpa: 'x@y' }).payload;
  assert.ok(p.startsWith('upi://pay?'));
});

// ── Registry ────────────────────────────────────────────────

test('buildPayload dispatches by type and rejects unknown types', () => {
  assert.equal(buildPayload('url', { url: 'solutionsnepal.com' }).payload, 'https://solutionsnepal.com');
  assert.equal(buildPayload('nonexistent', {}).ok, false);
});
