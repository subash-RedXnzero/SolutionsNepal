import { readFileSync } from 'node:fs';

const page = readFileSync('src/pages/nepal/index.astro', 'utf8');
const css = readFileSync('src/styles/global.css', 'utf8');

const used = [...new Set([...page.matchAll(/var\((--[a-z0-9-]+)/gi)].map((m) => m[1]))];

const darkIdx = css.indexOf('data-theme="dark"');
const lightCss = darkIdx > -1 ? css.slice(0, darkIdx) : css;
const darkCss = darkIdx > -1 ? css.slice(darkIdx) : '';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const missingLight = [];
const missingDark = [];

for (const t of used) {
  const re = new RegExp(escapeRe(t) + '\\s*:');
  if (!re.test(lightCss)) missingLight.push(t);
  if (darkCss && !re.test(darkCss)) missingDark.push(t);
}

console.log('tokens used:', used.length);
console.log('MISSING in light root:', missingLight.length ? missingLight : 'none');
console.log('MISSING in dark block:', missingDark.length ? missingDark : 'none');
