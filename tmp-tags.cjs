const fs = require('fs');
const src = fs.readFileSync('src/pages/tools/photo/logo-size-resizer.astro', 'utf8');
const body = src.split('<style>')[0].split('</BaseLayout>')[0];
const noComments = body.replace(/<!--[\s\S]*?-->/g, '');
const re = /<div\b[^>]*>|<\/div>/g;
let m; const stack = [];
while ((m = re.exec(noComments)) !== null) {
  const line = noComments.slice(0, m.index).split('\n').length;
  if (m[0].startsWith('</')) {
    const top = stack.pop();
    if (!top) console.log(`line ${line}: EXTRA </div>`);
  } else stack.push({ line, tag: m[0].slice(0, 60) });
}
console.log('LEFT OPEN:');
for (const s of stack) console.log(`  line ${s.line}: ${s.tag}`);
