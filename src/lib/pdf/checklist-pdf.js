/**
 * Government Service Checklist — PDF builder (client-side).
 *
 * Dependency-free minimal PDF writer (no pdf-lib in the browser path).
 * A previous version lazy-loaded pdf-lib via dynamic import, but bundler
 * CJS-interop made the namespace shape unreliable in production while Node
 * tests kept passing — the worst kind of bug. This module uses only
 * strings, TextEncoder, Blob and anchor downloads, so what the unit tests
 * verify byte-for-byte is exactly what runs in the browser.
 *
 * Output: single-font (Helvetica base-14, no embedding needed) A4 PDF
 * with WinAnsi-safe ASCII text (see sanitizePdfText).
 */

const PAGE_W = 595.28; // A4 width (pt)
const PAGE_H = 841.89; // A4 height (pt)
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Strip anything Helvetica/WinAnsi cannot render. */
export function sanitizePdfText(value) {
  return String(value ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/→/g, '->')
    .replace(/✓/g, 'x')
    .replace(/☐☑✔✕×]/g, '')
    .replace(/[^\x20-\x7E\n]/g, '');
}

export function formatFeePdf(fee) {
  if (!fee) return '';
  if (fee.amount === null || fee.amount === undefined) return 'Varies';
  if (fee.amount === 0) return 'Free';
  return 'Rs. ' + Number(fee.amount).toLocaleString('en-IN');
}

/** Escape PDF literal-string characters. Input must already be sanitized. */
export function escapePdfString(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Greedy word-wrap by estimated character width.
 * Helvetica averages ~0.55em per glyph; the factor keeps every line
 * inside CONTENT_W for the given size without needing font metrics.
 */
export function wrapPdfText(text, size) {
  const maxChars = Math.max(20, Math.floor(CONTENT_W / (size * 0.55)));
  const out = [];
  for (const rawLine of String(text).split('\n')) {
    let line = '';
    for (const word of rawLine.split(' ')) {
      if (word.length > maxChars) {
        if (line) {
          out.push(line);
          line = '';
        }
        // Hard-split pathological long words (e.g. URLs)
        for (let i = 0; i < word.length; i += maxChars) {
          out.push(word.slice(i, i + maxChars));
        }
        continue;
      }
      const trial = line ? line + ' ' + word : word;
      if (trial.length > maxChars && line) {
        out.push(line);
        line = word;
      } else {
        line = trial;
      }
    }
    out.push(line);
  }
  return out;
}

/**
 * Assemble raw PDF bytes from an array of page content streams.
 * @param {string[]} pageStreams — PDF content-stream bodies, one per page
 * @returns {Uint8Array}
 */
export function assemblePdf(pageStreams) {
  const enc = new TextEncoder();
  const objects = []; // { num, body }
  let nextNum = 1;
  const catalogNum = nextNum++;
  const pagesNum = nextNum++;

  const pageNums = [];
  const fontRegNum = nextNum++;
  const fontBoldNum = nextNum++;
  const streamNums = [];

  for (const stream of pageStreams) {
    const pageNum = nextNum++;
    const streamNum = nextNum++;
    pageNums.push(pageNum);
    streamNums.push(streamNum);
    objects.push({
      num: pageNum,
      body:
        `<< /Type /Page /Parent ${pagesNum} 0 R ` +
        `/MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 ${fontRegNum} 0 R /F2 ${fontBoldNum} 0 R >> >> ` +
        `/Contents ${streamNum} 0 R >>`,
    });
    const bytes = enc.encode(stream).length;
    objects.push({
      num: streamNum,
      body: `<< /Length ${bytes} >>\nstream\n${stream}\nendstream`,
    });
  }

  objects.unshift(
    { num: catalogNum, body: `<< /Type /Catalog /Pages ${pagesNum} 0 R >>` },
    {
      num: pagesNum,
      body: `<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageNums.length} >>`,
    },
    { num: fontRegNum, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' },
    { num: fontBoldNum, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>' },
  );
  objects.sort((a, b) => a.num - b.num);

  // Byte offsets must be exact: accumulate encoded lengths.
  let cursor = 0;
  const chunks = ['%PDF-1.4\n'];
  cursor += enc.encode(chunks[0]).length;
  const realOffsets = [0];
  for (const obj of objects) {
    const body = `${obj.num} 0 obj\n${obj.body}\nendobj\n`;
    realOffsets[obj.num] = cursor;
    chunks.push(body);
    cursor += enc.encode(body).length;
  }
  const xrefPos = cursor;
  const total = nextNum; // size = highest num + 1
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let n = 1; n < total; n++) {
    xref += `${String(realOffsets[n]).padStart(10, '0')} 00000 n \n`;
  }
  chunks.push(xref);
  chunks.push(
    `trailer\n<< /Size ${total} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`,
  );
  return enc.encode(chunks.join(''));
}

/**
 * Build a checklist PDF for a service.
 * @param {object} service — service object from government-services.js
 * @param {number[]} checked — indices of checked documents
 * @returns {Promise<Uint8Array>} PDF bytes (async for API compatibility)
 */
export async function buildChecklistPdf(service, checked = []) {
  const pages = [];
  let lines = [];
  let y = PAGE_H - MARGIN;

  const text = (str, size, bold) => {
    for (const line of wrapPdfText(sanitizePdfText(str), size)) {
      const h = size + 6;
      if (y - h < MARGIN + 24) {
        pages.push(lines);
        lines = [];
        y = PAGE_H - MARGIN;
      }
      y -= h;
      lines.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${MARGIN} ${y.toFixed(2)} Td (${escapePdfString(line)}) Tj ET`);
    }
  };
  const gap = (n) => {
    y -= n;
  };
  const rule = () => {
    if (y - 16 < MARGIN + 24) {
      pages.push(lines);
      lines = [];
      y = PAGE_H - MARGIN;
    }
    y -= 8;
    lines.push(
      `${MARGIN} ${y.toFixed(2)} m ${PAGE_W - MARGIN} ${y.toFixed(2)} l S`,
    );
    y -= 8;
  };
  const section = (title) => {
    gap(6);
    text(title, 13, true);
    gap(2);
  };

  // ── Header ──
  text('SolutionsNepal - Government Service Checklist', 11, true);
  text(service.name, 20, true);
  text(
    `${service.categoryName || service.category}  |  Updated: ${service.lastUpdated || 'Not yet verified'}`,
    10,
    false,
  );
  if (service.eligibility) text(`Who can apply: ${service.eligibility}`, 11, false);
  rule();

  // ── Fees ──
  section('Government Fee');
  if (!service.fees || service.fees.length === 0) {
    text('No fixed fee published - confirm at the office.', 11, false);
  } else {
    for (const fee of service.fees) {
      const note = fee.note ? ` (${fee.note})` : '';
      const tag = fee.verified ? '' : ' [unverified]';
      text(`- ${fee.label}: ${formatFeePdf(fee)}${note}${tag}`, 11, false);
    }
  }
  rule();

  // ── Documents ──
  const total = service.documents.length;
  const done = service.documents.filter((_, i) => checked.includes(i)).length;
  section(`Required Documents (${done} of ${total} ready)`);
  service.documents.forEach((docItem, i) => {
    const box = checked.includes(i) ? '[x]' : '[ ]';
    const note = docItem.note ? ` (${docItem.note})` : '';
    text(`${box} ${docItem.label}${note}`, 11, false);
  });
  rule();

  // ── Steps ──
  section('Application Steps');
  service.steps.forEach((step, i) => {
    text(`${i + 1}. ${step.title}: ${step.text}`, 11, false);
  });
  rule();

  // ── Facts ──
  section('Processing Information');
  text(`Processing time: ${service.processingTime || '-'}`, 11, false);
  text(`Where to apply: ${service.office || '-'}`, 11, false);
  text(`How to apply: ${service.method || '-'}`, 11, false);
  text(`Validity: ${service.validity || '-'}`, 11, false);
  rule();

  // ── Notes ──
  if (service.notes && service.notes.length > 0) {
    section('Important Notes');
    for (const note of service.notes) {
      text(`* ${note}`, 11, false);
    }
    rule();
  }

  // ── Reminder + source ──
  text(
    'Reminder: Fees and requirements may change. Verify the latest information with the relevant government office before applying.',
    10,
    false,
  );
  if (service.officialSource && service.officialSource.url) {
    text(`Official source: ${service.officialSource.label} - ${service.officialSource.url}`, 10, false);
  }
  pages.push(lines);

  // ── Page numbers (appended per page) ──
  const numbered = pages.map((pageLines, i) => {
    const footerY = 30;
    return (
      pageLines.join('\n') +
      `\nBT /F1 9 Tf ${MARGIN} ${footerY} Td (Page ${i + 1} of ${pages.length} - generated by SolutionsNepal) Tj ET`
    );
  });

  return assemblePdf(numbered);
}
