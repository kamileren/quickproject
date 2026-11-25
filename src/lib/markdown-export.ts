/**
 * Turns a chapter's MDX source into plain Markdown that reads well without
 * the site: for AI assistants, search tools and anyone who wants the text.
 * Interactive figures become a short description and a link to the chapter.
 * Build time only.
 */

export interface ExportContext {
  /** The site's address, without a trailing slash. */
  site: string;
  /** The chapter's own address, for "open the chapter to use it" links. */
  chapterUrl: string;
  /** Symbol for each notation id, for <Symbol id="..." />. */
  symbols: ReadonlyMap<string, string>;
  /** Where the companion code files live, e.g. https://github.com/owner/repo/blob/master/code */
  codeBase: string;
}

/** A JSX attribute's string value: name="..." or name='...'. */
function attr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`))?.slice(1).find((v) => v !== undefined);
}

const sentence = (text: string) => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

/** A multiple-choice checkpoint as a question, its options, and which is right and why. */
function checkpoint(tag: string): string {
  const question = attr(tag, 'question') ?? '';
  const options = [...tag.matchAll(/\{\s*text:\s*(['"])((?:\\.|(?!\1).)*)\1\s*,([^}]*)\}/g)].map(([, , text, rest]) => {
    const why = rest.match(/why:\s*(['"])((?:\\.|(?!\1).)*)\1/)?.[2] ?? '';
    const correct = /correct:\s*true/.test(rest);
    return `- ${text.replace(/\\(.)/g, '$1')}${correct ? ' **(correct)**' : ''}${why ? ` — ${why.replace(/\\(.)/g, '$1')}` : ''}`;
  });
  return `**Check your understanding:** ${question}\n\n${options.join('\n')}`;
}

/** Applies fn to the parts of the source that are not fenced code blocks. */
function outsideCode(source: string, fn: (text: string) => string): string {
  return source
    .split(/(^```[\s\S]*?^```)/m)
    .map((piece, i) => (i % 2 === 1 ? piece : fn(piece)))
    .join('');
}

export function mdxToMarkdown(body: string, ctx: ExportContext): string {
  const text = outsideCode(body, (s) =>
    s
      // Imports of figure components.
      .replace(/^import .*$/gm, '')
      // An interactive figure: keep what it shows and what to try, drop the component.
      .replace(/<Figure\b([\s\S]*?)>[\s\S]*?<\/Figure>/g, (_, tag: string) => {
        const title = attr(tag, 'title') ?? 'Interactive figure';
        const caption = attr(tag, 'caption');
        const tryIt = attr(tag, 'try');
        return [
          `> **Interactive figure: ${title}.**${caption ? ` ${sentence(caption)}` : ''}`,
          tryIt ? `> Try it: ${sentence(tryIt)}` : '',
          `> (Use it at ${ctx.chapterUrl})`,
        ]
          .filter(Boolean)
          .join('\n');
      })
      .replace(/<Checkpoint\b[\s\S]*?\/>/g, (tag) => checkpoint(tag))
      .replace(/<Term\b[^>]*>([\s\S]*?)<\/Term>/g, '$1')
      .replace(/<Ref\s+to="([^"]+)"[^>]*>([\s\S]*?)<\/Ref>/g, (_, id: string, words: string) => `[${words}](${ctx.site}/${id}/)`)
      .replace(/<Symbol\s+id="([^"]+)"\s*\/>/g, (_, id: string) => ctx.symbols.get(id) ?? id)
      .replace(/<CodeFile\s+file="([^"]+)"\s*\/>/g, (_, file: string) => `[${file}](${ctx.codeBase}/${file})`)
      // Blocks that become headings or labels.
      .replace(/<KeyTakeaways>/g, '## Key takeaways')
      .replace(/<NowYouCan>/g, '## What you should now be able to do')
      .replace(/<Exercises>/g, '## Exercises')
      .replace(/<GoingFurther>/g, '## Going further')
      .replace(/<References>/g, '## References')
      .replace(/<NextUp>/g, '## Next')
      .replace(/<Exercise\b([^>]*)>/g, (_, tag: string) => `### Exercise (${attr(tag, 'kind') ?? 'think'})`)
      .replace(/<Hint>/g, '**Hint:**')
      .replace(/<Solution>/g, '**Solution:**')
      .replace(/<(Example|Pitfall|Derivation)\b([^>]*)>/g, (_, name: string, tag: string) => {
        const label = name === 'Pitfall' ? 'Common mistake' : name;
        const title = attr(tag, 'title');
        return `**${label}${title ? `: ${title}` : ''}**`;
      })
      .replace(/<MarginNote>\s*/g, '**Note:** ')
      .replace(/<Equation\b[^>]*>/g, '')
      // Whatever closing tags are left.
      .replace(/<\/[A-Z][A-Za-z]*>/g, '')
      // Collapse the blank lines the removed tags leave behind.
      .replace(/\n{3,}/g, '\n\n'),
  );
  return text.trim() + '\n';
}

/** Component tags the export did not handle, ignoring code blocks. For the tests. */
export function leftoverTags(markdown: string): string[] {
  const prose = markdown.split(/^```[\s\S]*?^```/m).join('');
  return [...new Set([...prose.matchAll(/<\/?[A-Z][A-Za-z]*/g)].map((m) => m[0]))];
}
