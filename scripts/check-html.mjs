// Looks through the built pages for words that have run into a link or button
// with no space between them ("orload a saved file"). That happens when a line
// break between text and a tag is dropped, and it is easy to miss by eye.
// Run after a build: `node scripts/check-html.mjs`. Part of `npm run check`.
import fs from 'node:fs';
import path from 'node:path';

const problems = [];
let pages = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['_astro', 'pagefind'].includes(entry.name)) walk(full);
    } else if (entry.name.endsWith('.html')) {
      pages++;
      // Code, scripts and drawings are full of tags hard against text on purpose.
      const html = fs
        .readFileSync(full, 'utf8')
        .replace(/<(script|style|pre|svg|code)\b[\s\S]*?<\/\1>/g, '')
        .replace(/<span class="katex[\s\S]*?<\/span><\/span><\/span>/g, '');
      const found = [
        ...html.matchAll(/[A-Za-z][.,;:]?<(?:a|button)\b[^>]*>\s*[A-Za-z]/g),
        ...html.matchAll(/[a-z]<\/(?:a|button)>[A-Za-z]/g),
      ];
      for (const m of found) {
        const at = Math.max(0, m.index - 30);
        problems.push(`${path.relative('dist', full)}: …${html.slice(at, m.index + 50).replace(/<[^>]+>/g, '|').replace(/\s+/g, ' ')}…`);
      }
    }
  }
}

if (!fs.existsSync('dist')) {
  console.error('No dist folder. Run the build first.');
  process.exit(1);
}
walk('dist');
if (problems.length > 0) {
  console.error(`Text running into a link or button (add {' '} or a space):\n  ${[...new Set(problems)].slice(0, 30).join('\n  ')}`);
  process.exit(1);
}
console.log(`No run-together text in ${pages} pages.`);
