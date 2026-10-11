/**
 * QR Payload Builders
 * ===================
 * Pure functions that turn user input into standards-compliant QR payload
 * strings. Rendering (canvas/SVG) lives in the component; this layer is
 * testable in Node with zero DOM dependencies.
 *
 * Architecture:  User Input → Payload Builder → QR Encoder → Renderer → PNG/SVG
 *
 * Honesty note: the only "payment" format implemented here is the publicly
 * standardized Indian UPI URI. No fabricated eSewa/Khalti payloads — those
 * can be added later against their official specifications.
 *
 * @module qr-payloads
 */

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Escape characters with special meaning inside WIFI: payloads.
 * Per the Wi-Fi QR convention: \ ; , : " must be backslash-escaped.
 */
export function escapeWifi(str) {
  return String(str ?? '').replace(/([\\;,:"'])/g, '\\$1');
}

/** Keep only digits and a leading + (for tel / wa.me numbers). */
export function normalizePhone(raw) {
  const s = String(raw ?? '').replace(/[\s\-().]/g, '').trim();
  if (!s) return '';
  const plus = s.startsWith('+');
  const digits = s.replace(/\D/g, '');
  if (!digits) return '';
  return (plus ? '+' : '') + digits;
}

export function isValidEmail(raw) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(raw ?? '').trim());
}

/**
 * Normalize a URL without changing its destination:
 * - trims whitespace
 * - adds https:// when the input looks like a bare domain or www.*
 * - passes anything already carrying a scheme through untouched
 */
export function normalizeUrl(raw) {
  let s = String(raw ?? '').trim();
  if (!s) return { ok: false, error: 'Enter a website URL.' };
  // Any explicit scheme passes through untouched — never rewrite destinations
  if (/^[a-z][a-z0-9+.\-]*:\/\//i.test(s)) return { ok: true, value: s };
  // Bare domain heuristic: something.tld[/path] with no scheme and no spaces
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}([/?#].*)?$/i.test(s) || /^www\./i.test(s)) {
    return { ok: true, value: 'https://' + s };
  }
  return { ok: false, error: 'Enter a valid URL.' };
}

const ok = (payload) => ({ ok: true, payload });
const bad = (error) => ({ ok: false, error });

// ── Payload builders ─────────────────────────────────────────────────────

export function buildUrlQr(input = {}) {
  const u = normalizeUrl(input.url);
  if (!u.ok) return u;
  return ok(u.value);
}

export function buildTextQr(input = {}) {
  const text = String(input.text ?? '');
  if (!text.trim()) return bad('Enter some text.');
  if (text.length > 2000) return bad('Text is too long for a single QR code (max ~2000 characters).');
  return ok(text);
}

export function buildWifiQr(input = {}) {
  const ssid = String(input.ssid ?? '').trim();
  if (!ssid) return bad('Enter the Wi-Fi network name (SSID).');
  const security = ['WPA', 'WEP', 'nopass'].includes(input.security) ? input.security : 'WPA';
  const password = String(input.password ?? '');
  if (security !== 'nopass' && !password) {
    return bad('Enter the Wi-Fi password (or set security to None).');
  }
  let payload =
    `WIFI:T:${security};S:${escapeWifi(ssid)};` +
    (security === 'nopass' ? '' : `P:${escapeWifi(password)};`) +
    (input.hidden ? 'H:true;' : '') +
    ';';
  return ok(payload);
}

export function buildPhoneQr(input = {}) {
  const phone = normalizePhone(input.phone);
  if (!phone || phone.replace(/\D/g, '').length < 5) {
    return bad('Enter a valid phone number.');
  }
  return ok(`tel:${phone}`);
}

export function buildEmailQr(input = {}) {
  const to = String(input.email ?? '').trim();
  if (!isValidEmail(to)) return bad('Enter a valid email address.');
  const params = [];
  if ((input.subject ?? '').trim()) params.push('subject=' + encodeURIComponent(input.subject.trim()));
  if ((input.body ?? '').trim()) params.push('body=' + encodeURIComponent(input.body));
  return ok(`mailto:${to}${params.length ? '?' + params.join('&') : ''}`);
}

export function buildWhatsappQr(input = {}) {
  const phone = normalizePhone(input.phone).replace(/^\+/, '');
  if (phone.length < 8) return bad('Enter a valid WhatsApp number (with country code).');
  const msg = String(input.message ?? '').trim();
  return ok(`https://wa.me/${phone}${msg ? '?text=' + encodeURIComponent(msg) : ''}`);
}

/**
 * vCard 3.0 contact card. Requires at least first or last name.
 */
export function buildVcardQr(input = {}) {
  const first = String(input.firstName ?? '').trim();
  const last = String(input.lastName ?? '').trim();
  if (!first && !last) return bad('Enter at least a first or last name.');

  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push(`N:${last};${first};;;`);
  lines.push(`FN:${[first, last].filter(Boolean).join(' ')}`);
  const org = String(input.org ?? '').trim();
  if (org) lines.push(`ORG:${org}`);
  const title = String(input.title ?? '').trim();
  if (title) lines.push(`TITLE:${title}`);
  const phone = normalizePhone(input.phone);
  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
  const email = String(input.email ?? '').trim();
  if (email) {
    if (!isValidEmail(email)) return bad('Enter a valid email address.');
    lines.push(`EMAIL;TYPE=INTERNET:${email}`);
  }
  const website = String(input.website ?? '').trim();
  if (website) {
    const w = normalizeUrl(website);
    if (!w.ok) return bad(w.error);
    lines.push(`URL:${w.value}`);
  }
  const address = String(input.address ?? '').trim();
  if (address) lines.push(`ADR;TYPE=WORK:;;${address.replace(/\n/g, ' ')};;;;`);
  lines.push('END:VCARD');
  return ok(lines.join('\n'));
}

export function buildSmsQr(input = {}) {
  const phone = normalizePhone(input.phone);
  if (!phone || phone.replace(/\D/g, '').length < 5) {
    return bad('Enter a valid phone number.');
  }
  const msg = String(input.message ?? '');
  // SMSTO: renders best across Android/iOS scanner apps
  return ok(`SMSTO:${phone}:${msg}`);
}

export function buildLocationQr(input = {}) {
  const lat = Number(input.latitude);
  const lng = Number(input.longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || input.latitude?.trim?.() === '') {
    return bad('Enter a valid latitude between -90 and 90.');
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180 || input.longitude?.trim?.() === '') {
    return bad('Enter a valid longitude between -180 and 180.');
  }
  return ok(`geo:${lat},${lng}`);
}

/**
 * UPI payment URI — the one publicly standardized payment QR format this
 * tool supports. Requires a VPA (virtual payment address like name@bank).
 * Nepal-specific wallets can be added here later using their official specs.
 */
export function buildUpiQr(input = {}) {
  const vpa = String(input.vpa ?? '').trim();
  if (!vpa || !vpa.includes('@')) return bad('Enter a valid UPI ID (e.g. name@bank).');
  const params = [`pa=${encodeURIComponent(vpa)}`];
  const name = String(input.name ?? '').trim();
  if (name) params.push(`pn=${encodeURIComponent(name)}`);
  const amount = Number(input.amount);
  if (input.amount !== undefined && String(input.amount).trim() !== '') {
    if (!Number.isFinite(amount) || amount <= 0) return bad('Enter a valid amount greater than 0.');
    params.push(`am=${amount.toFixed(2)}`);
  }
  params.push('cu=INR');
  const note = String(input.note ?? '').trim();
  if (note) params.push(`tn=${encodeURIComponent(note)}`);
  return ok(`upi://pay?${params.join('&')}`);
}

/** Registry used by the UI. Order = display order. */
export const QR_TYPES = [
  { id: 'url', label: 'URL' },
  { id: 'text', label: 'Text' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'phone', label: 'Phone' },
  { id: 'email', label: 'Email' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'vcard', label: 'vCard' },
  { id: 'sms', label: 'SMS' },
  { id: 'location', label: 'Location' },
  { id: 'payment', label: 'Payment' },
];

export const PAYLOAD_BUILDERS = {
  url: buildUrlQr,
  text: buildTextQr,
  wifi: buildWifiQr,
  phone: buildPhoneQr,
  email: buildEmailQr,
  whatsapp: buildWhatsappQr,
  vcard: buildVcardQr,
  sms: buildSmsQr,
  location: buildLocationQr,
  payment: buildUpiQr,
};

/** Build a payload for any registered type. */
export function buildPayload(type, input) {
  const builder = PAYLOAD_BUILDERS[type];
  if (!builder) return bad(`Unknown QR type "${type}".`);
  try {
    return builder(input);
  } catch (e) {
    return bad('Something went wrong building this QR payload.');
  }
}
