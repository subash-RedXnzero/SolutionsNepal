export function unquote(v) {
  v = v.trim();
  if (v === "''") return '';
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return v;
}

export function splitFlow(inner) {
  const parts = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '"' && inner[i - 1] !== '\\') inQ = !inQ;
    if (c === ',' && !inQ) {
      parts.push(cur);
      cur = '';
    } else cur += c;
  }
  if (cur.trim() !== '') parts.push(cur);
  return parts.map((p) => unquote(p)).filter((p) => p !== '');
}

export function parseFrontmatter(text) {
  const data = { headings: [], faqs: [] };
  let mode = null;
  let cur = null;
  for (const line of String(text).replace(/\r\n?/g, '\n').split('\n')) {
    if (mode === 'headings') {
      let m = line.match(/^  - id: (.*)$/);
      if (m) {
        cur = { id: unquote(m[1]) };
        data.headings.push(cur);
        continue;
      }
      m = line.match(/^    text: (.*)$/);
      if (m && cur) {
        cur.text = unquote(m[1]);
        continue;
      }
      m = line.match(/^    level: (\d+)$/);
      if (m && cur) {
        cur.level = Number(m[1]);
        continue;
      }
    }
    if (mode === 'faqs') {
      let m = line.match(/^  - q: (.*)$/);
      if (m) {
        cur = { q: unquote(m[1]) };
        data.faqs.push(cur);
        continue;
      }
      m = line.match(/^    a: (.*)$/);
      if (m && cur) {
        cur.a = unquote(m[1]);
        continue;
      }
    }
    const kv = line.match(/^([A-Za-z]+):(.*)$/);
    if (!kv) continue;
    if ((kv[1] === 'headings' || kv[1] === 'faqs') && kv[2].trim() === '') {
      mode = kv[1];
      cur = null;
      continue;
    }
    mode = null;
    const val = kv[2].trim();
    if (val.startsWith('[')) data[kv[1]] = splitFlow(val.slice(1, -1));
    else data[kv[1]] = unquote(val);
  }
  return data;
}

export function unescapeHtml(s) {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function jsStr(s) {
  return (
    "'" +
    String(s ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '')
      .replace(/\n/g, '\\n') +
    "'"
  );
}

export function bodyToSections(body) {
  const sections = [];
  for (const raw of String(body).replace(/\r\n?/g, '\n').split(/\n{2,}/)) {
    const block = raw.trim();
    if (!block) continue;
    const lines = block.split('\n');
    const m = block.match(/^<h([23]) id="([^"]+)">(.*)<\/h[23]>$/s);
    if (m) {
      sections.push(`    { type: 'heading', level: ${m[1]}, id: ${jsStr(m[2])}, text: ${jsStr(unescapeHtml(m[3]))} },`);
      continue;
    }
    if (lines[0].startsWith('```') && lines[lines.length - 1].startsWith('```')) {
      sections.push(`    { type: 'formula', code: ${jsStr(lines.slice(1, -1).join('\n').trim())} },`);
      continue;
    }
    if (lines.every((l) => l.startsWith('>'))) {
      const text = lines.map((l) => l.replace(/^>\s?/, '')).join('\n').trim();
      const bm = text.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
      sections.push(`    { type: 'callout', style: 'accent', bold: ${jsStr(bm ? bm[1].trim() : '')}, content: ${jsStr(bm ? bm[2].trim() : text)} },`);
      continue;
    }
    if (lines.length >= 2 && lines.every((l) => l.trim().startsWith('|'))) {
      const cells = (l) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, '|').trim());
      const headers = cells(lines[0]);
      const rows = lines.slice(2).map((r) => `[${cells(r).map(jsStr).join(', ')}]`).join(', ');
      sections.push(`    { type: 'table', headers: [${headers.map(jsStr).join(', ')}], rows: [${rows}] },`);
      continue;
    }
    if (lines.every((l) => /^- /.test(l))) {
      const dt = lines.map((l) => l.match(/^- \*\*(.+?)\*\* — ([\s\S]*)$/));
      if (dt.every(Boolean)) {
        sections.push(`    { type: 'datatable', rows: [${dt.map((x) => `{ label: ${jsStr(x[1].trim())}, value: ${jsStr(x[2].trim())} }`).join(', ')}] },`);
      } else {
        sections.push(`    { type: 'list', style: 'ul', items: [${lines.map((l) => jsStr(l.replace(/^- /, '').trim())).join(', ')}] },`);
      }
      continue;
    }
    if (lines.every((l) => /^\d+\. /.test(l))) {
      sections.push(`    { type: 'list', style: 'ol', items: [${lines.map((l) => jsStr(l.replace(/^\d+\. /, '').trim())).join(', ')}] },`);
      continue;
    }
    sections.push(`    { type: 'paragraph', content: ${jsStr(block)} },`);
  }
  return sections;
}

export function toExportName(slug) {
  const camel = String(slug).split(/[^A-Za-z0-9]+/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  const name = (/^[A-Za-z]/.test(camel) ? camel : 'Post' + camel) + 'Post';
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) throw new Error(`Bad export name for ${slug}`);
  return name[0].toLowerCase() + name.slice(1);
}
export function headingsFromBody(body) {
  const out = [];
  const re = /<h([23])\s+id="([^"]+)">([\s\S]*?)<\/h\1>/g;
  let m;
  while ((m = re.exec(body))) {
    const text = unescapeHtml(m[3].replace(/<[^>]*>/g, '').trim());
    if (m[2] && text) out.push({ id: m[2], text, level: Number(m[1]) });
  }
  return out;
}
