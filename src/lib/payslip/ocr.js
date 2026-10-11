/**
 * Client-side payslip extraction helpers.
 * =========================================
 * - OCR (tesseract.js) and PDF rendering (pdfjs-dist) are loaded LAZILY from
 *   CDN only when the user uploads a file. Nothing is bundled in the page.
 * - Extraction is heuristic and is NEVER trusted automatically. The UI always
 *   shows a "Review extracted information" step where every field is editable
 *   and each field carries a confidence marker.
 * - Files are processed in memory only. They are never uploaded to a server
 *   and are discarded when the user deletes them or leaves the page.
 */

const NUMBER_RE = /(?:rs\.?|रु|npr|nrs\.?|रू)?\s*([\d,]+(?:\.\d{1,2})?)/gi;

function parseNumber(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[^\d.-]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const FIELD_PATTERNS = [
  { key: 'gross', label: 'Gross Salary', pattern: /(gross|total\s*(salary|earnings|income)|gross\s*salary)/i },
  { key: 'basic', label: 'Basic Salary', pattern: /\b(basic|base)\s*(salary)?\b/i },
  { key: 'da', label: 'Dearness Allowance', pattern: /dearness/i },
  { key: 'other', label: 'Other Allowances', pattern: /(other\s*allowance|allowance)/i },
  { key: 'overtime', label: 'Overtime', pattern: /over\s*time|overtime/i },
  { key: 'bonus', label: 'Bonus', pattern: /bonus|festival|dashain/i },
  { key: 'ssf', label: 'SSF', pattern: /\b(ssf|social\s*security)\b/i },
  { key: 'pf', label: 'Provident Fund', pattern: /provident\s*fund/i },
  { key: 'tds', label: 'TDS', pattern: /\btds\b|tax\s*deducted/i },
  { key: 'tax', label: 'Income Tax', pattern: /(income\s*)?tax/i },
  { key: 'deductions', label: 'Other Deductions', pattern: /(deduction|loan|advance)/i },
  { key: 'net', label: 'Net Salary', pattern: /(net\s*(salary|pay|amount|received)?|take\s*home|paid\s*(in|to|this)?)/i },
];

/**
 * Heuristic parser for payslip text.
 * @param {string} text
 * @returns {object} fields keyed by field name with { value, confidence, matchedLabel, amountRaw }
 */
export function parsePayslipText(text = '') {
  const normalized = String(text).replace(/\r/g, '\n').replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n');

  const amounts = [];
  let m;
  const localNumberRe = /(?:rs\.?|रु|npr|nrs\.?|रू)?\s*([\d][\d,]*(?:\.\d{1,2})?)/gi;
  while ((m = localNumberRe.exec(normalized)) !== null) {
    amounts.push({ index: m.index, raw: m[1], value: parseNumber(m[1]) });
  }

  const result = {};
  for (const field of FIELD_PATTERNS) {
    const lineMatch = normalized.match(new RegExp(`^.*${field.pattern.source}.*$`, 'im'));
    const labelIndex = normalized.search(field.pattern);
    if (labelIndex === -1) {
      result[field.key] = { value: null, confidence: 'low', matchedLabel: false, amountRaw: null };
      continue;
    }

    // Find the amount nearest to the label (after it, within 100 chars)
    let best = null;
    for (const a of amounts) {
      const dist = a.index - labelIndex;
      if (dist >= 0 && dist <= 100) {
        if (!best || dist < best.dist) best = { ...a, dist };
      }
    }

    const labelContext = lineMatch ? lineMatch[0] : '';
    const labelHasNumber = /\d/.test(labelContext);

    if (best && best.value != null) {
      // If the label line itself already contains a number, prefer it.
      const inline = parseNumber(labelContext);
      const value = inline != null && Math.abs(inline - best.value) < 1 ? inline : best.value;
      result[field.key] = {
        value,
        confidence: labelHasNumber && inline != null ? 'high' : best.dist <= 40 ? 'high' : 'medium',
        matchedLabel: true,
        amountRaw: best.raw,
        line: labelContext.slice(0, 80),
      };
    } else {
      result[field.key] = { value: null, confidence: 'low', matchedLabel: true, amountRaw: null, line: labelContext.slice(0, 80) };
    }
  }

  return { fields: result, rawText: normalized };
}

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-lazy-src="${src}"]`);
    if (existing && existing.dataset.loaded) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.dataset.lazySrc = src;
    s.onload = () => { s.dataset.loaded = '1'; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * OCR an image file in the browser using tesseract.js (lazy, CDN).
 * @param {File} file
 * @returns {Promise<{fields: object, rawText: string}>}
 */
export async function extractFromImage(file) {
  const url = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  await loadScript(url);
  const Tesseract = window.Tesseract;
  const worker = await Tesseract.createWorker('eng+hin', 1, { logger: () => {} });
  const { data } = await worker.recognize(file);
  await worker.terminate();
  return parsePayslipText(data.text || '');
}

/**
 * Render the first page of a PDF to a canvas using pdfjs-dist (lazy, CDN),
 * then OCR it.
 * @param {File} file
 * @returns {Promise<{fields: object, rawText: string}>}
 */
export async function extractFromPdf(file) {
  await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
  const pdfjs = window.pdfjsLib;
  if (!pdfjs) throw new Error('PDF library failed to load');

  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const f = new File([blob], 'page.png', { type: 'image/png' });
  return extractFromImage(f);
}