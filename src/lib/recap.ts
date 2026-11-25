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

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

const plain = (text: string): string => text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const escapeAttribute = (text: string): string => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Turns bold words that name a glossary term into links to that entry, with
 * the definition as the hover text. Matches the term or its simple plural.
 */
export function linkTerms(html: string, terms: readonly GlossaryTerm[]): string {
  const byName = new Map<string, GlossaryTerm>();
  for (const t of terms) {
    byName.set(plain(t.term), t);
    byName.set(plain(t.term) + 's', t);
  }
  return html.replace(/<strong>([^<]+)<\/strong>/g, (whole, inner: string) => {
    const found = byName.get(plain(inner));
    return found ? `<a class="recap-term" href="/glossary/#${found.id}" title="${escapeAttribute(found.definition)}">${whole}</a>` : whole;
  });
}

export interface ExerciseSource {
  kind: string;
  /** The question in markdown, without its hint and solution. */
  question: string;
}

/** Every <Exercise> in a chapter's source, in order, with the hint and solution left out. */
export function exercises(source: string): ExerciseSource[] {
  return [...source.matchAll(/<Exercise\b([^>]*)>([\s\S]*?)<\/Exercise>/g)].map(([, attributes, inner]) => ({
    kind: attributes.match(/kind="([^"]+)"/)?.[1] ?? 'think',
    question: inner
      .replace(/<Hint>[\s\S]*?<\/Hint>/g, '')
      .replace(/<Solution>[\s\S]*?<\/Solution>/g, '')
      .trim(),
  }));
}
