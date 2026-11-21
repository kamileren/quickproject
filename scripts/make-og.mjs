// Draws the picture shown when a page is shared (1200 × 630), one per
// published chapter plus one for the book: public/og/<chapter-id>.png.
//
// Run `npm run og` after adding a chapter or changing a title. The pictures
// are committed, because drawing them needs the Georgia font, which the build
// server does not have. With `--check` nothing is written and the script fails
// if a published chapter has no picture.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const check = process.argv.includes('--check');
const lecturesDir = 'src/content/lectures';
const outDir = 'public/og';

const field = (text, name) => text.match(new RegExp(`^${name}:\\s*"?(.*?)"?\\s*$`, 'm'))?.[1];
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const parts = Object.fromEntries(
  [...fs.readFileSync('src/content/parts.yaml', 'utf8').matchAll(/- id:\s*(\S+)\s+label:\s*(.+)\s+title:\s*(.+)/g)].map((m) => [
    m[1],
    `${m[2].trim()}: ${m[3].trim()}`,
  ]),
);

/** Breaks text into lines of at most `width` characters, on spaces. */
function wrap(text, width) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length > width) lines.push(word);
    else lines[lines.length - 1] = last ? `${last} ${word}` : word;
  }
  return lines;
}

function card({ kicker, title, subtitle }) {
  const titleLines = wrap(title, 20);
  const size = titleLines.length > 2 ? 84 : 104;
  const titleTop = 236;
  const subtitleLines = wrap(subtitle, 58).slice(0, titleLines.length > 2 ? 1 : 2);
  const subtitleTop = titleTop + (titleLines.length - 1) * size * 1.05 + 76;
  const serif = `font-family="Georgia, 'Times New Roman', serif"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect width="1200" height="14" fill="#1c1917"/>
  <rect x="80" y="108" width="72" height="4" fill="#1c1917"/>
  <text x="176" y="118" font-family="Consolas, 'Courier New', monospace" font-size="24" font-weight="700" letter-spacing="7" fill="#ea580c">${escape(kicker.toUpperCase())}</text>
  ${titleLines.map((line, i) => `<text x="76" y="${titleTop + i * size * 1.05}" ${serif} font-size="${size}" font-weight="700" fill="#1c1917">${escape(line)}${i === titleLines.length - 1 && !/[?!.]$/.test(line) ? '.' : ''}</text>`).join('\n  ')}
  ${subtitleLines.map((line, i) => `<text x="80" y="${subtitleTop + i * 44}" ${serif} font-size="34" font-style="italic" fill="#78716c">${escape(line)}</text>`).join('\n  ')}
  <text x="80" y="582" ${serif} font-size="28" font-weight="700" fill="#1c1917">The Book of Machine Learning</text>
  <text x="1120" y="582" text-anchor="end" font-family="Consolas, 'Courier New', monospace" font-size="22" fill="#78716c">thebookofml.com</text>
  <circle cx="1100" cy="110" r="14" fill="#ea580c"/>
</svg>`;
}

const cards = [
  {
    id: 'home',
    kicker: 'A free interactive textbook',
    title: 'The Book of Machine Learning',
    subtitle: 'Machine learning from first principles, one idea at a time.',
  },
];
for (const name of fs.readdirSync(lecturesDir).filter((f) => f.endsWith('.mdx')).sort()) {
  const text = fs.readFileSync(path.join(lecturesDir, name), 'utf8');
  if (field(text, 'status') !== 'ready') continue;
  const number = field(text, 'number');
  cards.push({
    id: name.replace(/\.mdx$/, '').replace(/^[\d.]+-/, ''),
    kicker: `${number.includes('.') ? 'Toolkit' : 'Chapter'} ${number} · ${parts[field(text, 'part')] ?? ''}`,
    title: field(text, 'title'),
    subtitle: field(text, 'question') ?? field(text, 'summary'),
  });
}

if (check) {
  const missing = cards.filter((c) => !fs.existsSync(path.join(outDir, `${c.id}.png`))).map((c) => c.id);
  if (missing.length > 0) {
    console.error(`No share picture for: ${missing.join(', ')}. Run npm run og.`);
    process.exit(1);
  }
  console.log(`${cards.length} share pictures present.`);
} else {
  fs.mkdirSync(outDir, { recursive: true });
  for (const c of cards) {
    await sharp(Buffer.from(card(c))).png({ palette: true, colours: 64 }).toFile(path.join(outDir, `${c.id}.png`));
  }
  console.log(`${cards.length} share pictures written to ${outDir}.`);
}
