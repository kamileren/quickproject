// Turns each companion Python file into a notebook, so chapters can offer
// "open in Colab". Run `node scripts/make-notebooks.mjs` after editing a file
// in code/. With `--check` it changes nothing and fails if a notebook is stale.
import fs from 'node:fs';
import path from 'node:path';

const dir = 'code';
const out = path.join(dir, 'notebooks');
const check = process.argv.includes('--check');

// Files that need something a fresh notebook does not have (a dataset on disk).
const SKIP = new Set(['ch21_fashion.py']);

/** The file's opening docstring becomes the notebook's introduction. */
function split(source) {
  const match = source.match(/^\s*"""([\s\S]*?)"""\s*\n/);
  return match ? { intro: match[1].trim(), code: source.slice(match[0].length) } : { intro: '', code: source };
}

const lines = (text) => text.split('\n').map((line, i, all) => (i < all.length - 1 ? line + '\n' : line));

function notebook(file, source) {
  const { intro, code } = split(source.replace(/\r\n/g, '\n'));
  const heading = [
    `# \`${file}\``,
    '',
    intro,
    '',
    'Companion code for [The Book of Machine Learning](https://thebookofml.com/). Run the cell below, then change the numbers and run it again.',
  ].join('\n');
  return {
    cells: [
      { cell_type: 'markdown', metadata: {}, source: lines(heading) },
      { cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: lines(code.trim()) },
    ],
    metadata: {
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
      language_info: { name: 'python' },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };
}

const stale = [];
if (!check) fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(dir).filter((f) => /^ch\d+_\w+\.py$/.test(f) && !SKIP.has(f));
for (const file of files) {
  const target = path.join(out, file.replace(/\.py$/, '.ipynb'));
  const wanted = JSON.stringify(notebook(file, fs.readFileSync(path.join(dir, file), 'utf8')), null, 1) + '\n';
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : '';
  if (current === wanted) continue;
  if (check) stale.push(target);
  else fs.writeFileSync(target, wanted);
}

if (stale.length > 0) {
  console.error(`Notebooks out of date (run node scripts/make-notebooks.mjs):\n  ${stale.join('\n  ')}`);
  process.exit(1);
}
console.log(`${files.length} notebooks ${check ? 'are up to date' : 'written'}.`);
