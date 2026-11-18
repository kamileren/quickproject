// Checks every published chapter against the book's rules, so chapters stay
// consistent and never overwhelm. Run with `npm run check:content`.
//
// Per section (text under one `##` heading):
//   - at most 1 <Figure>, 1 <Checkpoint>, 3 <Term>
// Per chapter:
//   - 4 to 8 sections, a <KeyTakeaways> block and a <References> block
//   - every <Term id> exists in the glossary, every <Symbol id> in the notation file
//   - a term is introduced with <Term> only once
//   - every figure has a `try` prompt
import fs from 'node:fs';
import path from 'node:path';

const LIMITS = { Figure: 1, Checkpoint: 1, Term: 3 };
const dir = 'src/content/lectures';

const idsIn = (file) => new Set([...fs.readFileSync(file, 'utf8').matchAll(/^- id:\s*(\S+)/gm)].map((m) => m[1]));
const glossary = idsIn('src/content/glossary.yaml');
const notation = idsIn('src/content/notation.yaml');

const problems = [];
let checked = 0;

for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).sort()) {
  const text = fs.readFileSync(path.join(dir, name), 'utf8');
  const [, frontmatter = '', body = ''] = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/) ?? [];
  if (!/^status:\s*ready/m.test(frontmatter)) continue;
  checked++;
  const fail = (msg) => problems.push(`${name}: ${msg}`);

  // Ignore fenced code so `##` comments inside code are not read as headings.
  const prose = body.replace(/```[\s\S]*?```/g, '');
  const sections = prose.split(/^## +/m).slice(1);
  if (sections.length < 4 || sections.length > 8) fail(`has ${sections.length} sections; expected 4 to 8`);

  for (const section of sections) {
    const title = section.split('\n')[0].trim();
    // Stop at the chapter-level blocks that follow the last section.
    const content = section.split(/<KeyTakeaways>|<GoingFurther>|<References>/)[0];
    for (const [tag, max] of Object.entries(LIMITS)) {
      const count = (content.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length;
      if (count > max) fail(`section "${title}" has ${count} <${tag}>; the limit is ${max}`);
    }
  }

  for (const block of ['KeyTakeaways', 'References']) {
    if (!prose.includes(`<${block}>`)) fail(`missing <${block}>`);
  }

  const seen = new Set();
  for (const [, id] of prose.matchAll(/<Term\s+id="([^"]+)"/g)) {
    if (!glossary.has(id)) fail(`<Term id="${id}"> is not in glossary.yaml`);
    if (seen.has(id)) fail(`<Term id="${id}"> is used more than once; define a term on first use only`);
    seen.add(id);
  }
  for (const [, id] of prose.matchAll(/<Symbol\s+id="([^"]+)"/g)) {
    if (!notation.has(id)) fail(`<Symbol id="${id}"> is not in notation.yaml`);
  }
  for (const [tag] of prose.matchAll(/<Figure\b[^>]*>/g)) {
    if (!/\btry=/.test(tag)) fail(`a <Figure> has no "try" prompt: ${tag.slice(0, 60).replace(/\s+/g, ' ')}...`);
  }
}

if (problems.length) {
  console.error(`Content check failed:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
console.log(`Content check passed (${checked} published chapter${checked === 1 ? '' : 's'}).`);
