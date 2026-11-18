import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://thebookofml.com',
  trailingSlash: 'always',
  integrations: [
    react(),
    mdx(),
    sitemap({ filter: (page) => !page.includes('/kit/') }),
  ],
  markdown: {
    // Maths needs remark/rehype plugins, so use the unified processor.
    processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }),
    shikiConfig: { theme: 'github-light' },
  },
  vite: { plugins: [tailwindcss()] },
});
