import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * KaTeX lists three formats for every font. Every browser the book supports
 * reads the first (woff2), so the other two are dropped from the build.
 */
const katexWoff2Only = {
  name: 'katex-woff2-only',
  enforce: 'pre',
  transform(code, id) {
    if (!id.includes('katex.min.css')) return null;
    return code.replace(/,url\([^)]*\.woff\) format\("woff"\),url\([^)]*\.ttf\) format\("truetype"\)/g, '');
  },
};

export default defineConfig({
  site: 'https://thebookofml.com',
  trailingSlash: 'always',
  integrations: [
    react(),
    mdx(),
    sitemap({ filter: (page) => !page.includes('/kit/') && !page.includes('/search/') }),
  ],
  markdown: {
    // Maths needs remark/rehype plugins, so use the unified processor.
    processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }),
    shikiConfig: { theme: 'github-light' },
  },
  vite: { plugins: [tailwindcss(), katexWoff2Only] },
});
