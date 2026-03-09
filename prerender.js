import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pages to pre-render: [url path, view name, output file, page title/description]
const pages = [
  {
    route: '/',
    view: 'welcome',
    outFile: 'index.html',
    title: 'The Book of Machine Learning — A Free Online ML Textbook',
    description:
      'A free, comprehensive online textbook covering the mathematical structures, statistical frameworks, and computational paradigms of modern machine learning. Topics include linear regression, optimization, probability, and more.',
  },
  {
    route: '/linear-regression',
    view: 'linear-regression',
    outFile: 'linear-regression/index.html',
    title: 'Linear Regression — The Book of Machine Learning',
    description:
      'Learn linear regression from first principles: the mathematics of least squares, gradient descent, cost functions, and model evaluation. Free online ML textbook.',
  },
];

async function prerender() {
  // Build SSR bundle first
  const { build } = await import('vite');
  await build({
    build: {
      ssr: 'src/entry-server.jsx',
      outDir: 'dist/server',
      rollupOptions: { input: 'src/entry-server.jsx' },
    },
    ssr: { noExternal: ['lucide-react'] },
  });

  // Load the SSR bundle
  const { render } = await import('./dist/server/entry-server.js');

  // Read the client-built index.html as template
  const template = fs.readFileSync(path.resolve(__dirname, 'dist/index.html'), 'utf-8');

  for (const page of pages) {
    const appHtml = render(page.view);

    // Inject rendered HTML and update title/description per page
    let html = template
      .replace(`<div id="root"></div>`, `<div id="root">${appHtml}</div>`)
      .replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`)
      .replace(
        /(<meta name="description" content=")[^"]*(")/,
        `$1${page.description}$2`
      )
      .replace(
        /(<meta property="og:title" content=")[^"]*(")/,
        `$1${page.title}$2`
      )
      .replace(
        /(<meta property="og:description" content=")[^"]*(")/,
        `$1${page.description}$2`
      )
      .replace(
        /(<meta name="twitter:title" content=")[^"]*(")/,
        `$1${page.title}$2`
      )
      .replace(
        /(<meta name="twitter:description" content=")[^"]*(")/,
        `$1${page.description}$2`
      );

    const outPath = path.resolve(__dirname, 'dist', page.outFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    console.log(`Pre-rendered: ${page.outFile}`);
  }

  // Clean up server bundle
  fs.rmSync(path.resolve(__dirname, 'dist/server'), { recursive: true });
  console.log('Pre-rendering complete.');
}

prerender().catch((e) => {
  console.error(e);
  process.exit(1);
});
