/**
 * Pulls the summary blocks out of a chapter's source so they can be shown
 * together on the recap page. Build time only.
 */
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

let processor: ReturnType<typeof createMarkdownProcessor> | undefined;

/** Markdown (with formulas) to HTML, the same way chapters are rendered. */
export async function renderMarkdown(markdown: string): Promise<string> {
  processor ??= createMarkdownProcessor({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] });
  return (await (await processor).render(markdown)).code;
}

/** The text between <Name> and </Name> in a chapter's source, or undefined. */
export function block(source: string, name: string): string | undefined {
  return source.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1].trim();
}
