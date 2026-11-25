/**
 * Plain-text versions of the book for AI assistants and other tools:
 * one Markdown file per chapter, an index (llms.txt) and everything in one
 * file (llms-full.txt). Build time only.
 */
import { getCollection } from 'astro:content';
import { chapterName, chapterUrl, getParts, getReadyLectures, REPO_BRANCH, REPO_SLUG, SITE_NAME, type Lecture } from './book';
import { mdxToMarkdown } from './markdown-export';

export const SITE = 'https://thebookofml.com';
export const BOOK_SUMMARY =
  'A free, interactive online textbook that teaches machine learning from first principles: regression, classification, neural networks and more, one idea at a time.';

export const markdownUrl = (lecture: Lecture) => `/${lecture.id}.md`;

let symbols: Promise<Map<string, string>> | undefined;

/** One chapter as Markdown, with a short header saying where it comes from. */
export async function chapterMarkdown(lecture: Lecture): Promise<string> {
  symbols ??= getCollection('notation').then((all) => new Map(all.map((e) => [e.id, e.data.symbol])));
  const url = `${SITE}${chapterUrl(lecture)}`;
  const body = mdxToMarkdown(lecture.body ?? '', {
    site: SITE,
    chapterUrl: url,
    symbols: await symbols,
    codeBase: `https://github.com/${REPO_SLUG}/blob/${REPO_BRANCH}/code`,
  });
  const header = [
    `# ${chapterName(lecture)}`,
    '',
    `> ${lecture.data.summary}${lecture.data.question ? ` Opening question: ${lecture.data.question}` : ''}`,
    '',
    `From *${SITE_NAME}*, a free interactive machine learning textbook. Interactive version, with figures to use: ${url}`,
  ].join('\n');
  return `${header}\n\n${body}`;
}

/** The llms.txt index: what the book is and where each chapter is. */
export async function llmsIndex(): Promise<string> {
  const parts = await getParts();
  const lectures = await getReadyLectures();
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${BOOK_SUMMARY}`,
    '',
    'Each chapter starts from a concrete question, builds the idea with worked examples and interactive figures, then gives the mathematics, a common mistake, key takeaways and exercises with worked solutions. The neural network chapters build a network from scratch in Python with NumPy. Free to read, no sign-up. The links below are plain Markdown versions of each chapter; the same address without `.md` (ending in `/`) is the interactive page.',
    '',
  ];
  for (const part of parts) {
    const own = lectures.filter((l) => l.data.part === part.id);
    if (own.length === 0) continue;
    lines.push(`## ${part.data.label}: ${part.data.title}`, '', part.data.description ?? part.data.intro, '');
    for (const l of own) lines.push(`- [${chapterName(l)}](${SITE}${markdownUrl(l)}): ${l.data.summary}`);
    lines.push('');
  }
  lines.push(
    '## Reference',
    '',
    `- [Glossary](${SITE}/glossary/): every term the book defines, in a sentence or two, with the chapter that introduces it`,
    `- [Notation](${SITE}/notation/): every symbol the book uses and what it means`,
    `- [Exercises](${SITE}/exercises/): all exercises, chapter by chapter`,
    `- [Playground](${SITE}/playground/): the interactive figures, grouped by topic`,
    `- [How to learn machine learning](${SITE}/learn-machine-learning/): the order to read the book in, and what you need first`,
    '',
    '## Optional',
    '',
    `- [The whole book in one file](${SITE}/llms-full.txt): every published chapter as Markdown`,
    '',
  );
  return lines.join('\n');
}

/** Every published chapter in book order, in one file. */
export async function llmsFull(): Promise<string> {
  const lectures = await getReadyLectures();
  const chapters = await Promise.all(lectures.map(chapterMarkdown));
  return [`# ${SITE_NAME}\n\n> ${BOOK_SUMMARY}\n\nInteractive version: ${SITE}/`, ...chapters].join('\n\n---\n\n');
}
