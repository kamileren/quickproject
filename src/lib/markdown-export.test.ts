import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { leftoverTags, mdxToMarkdown } from './markdown-export';

const ctx = {
  site: 'https://example.com',
  chapterUrl: 'https://example.com/ch/',
  symbols: new Map([['eta', 'η']]),
  codeBase: 'https://github.com/o/r/blob/main/code',
};

describe('markdown export', () => {
  it('turns figures, checkpoints and links into plain Markdown', () => {
    const source = [
      "import Descent from '@/components/figures/ch03/Descent';",
      '',
      'The <Term id="gradient">gradient</Term> and <Ref to="linear-regression">the last chapter</Ref>, with <Symbol id="eta" />.',
      '',
      '<Figure title="Steps" caption="The path downhill" try="press Run">',
      '  <Descent client:visible />',
      '</Figure>',
      '',
      '<Checkpoint',
      '  question="Which?"',
      `  options={[{ text: 'A', why: 'No.' }, { text: "It's B", correct: true, why: "Yes." }]}`,
      '/>',
      '',
      '<Exercise kind="by hand">',
      '',
      'Add.',
      '',
      '<Solution>',
      '2',
      '</Solution>',
      '</Exercise>',
      '',
      '```python',
      'import numpy as np',
      '```',
    ].join('\n');
    const md = mdxToMarkdown(source, ctx);
    expect(md).toContain('The gradient and [the last chapter](https://example.com/linear-regression/), with η.');
    expect(md).toContain('> **Interactive figure: Steps.** The path downhill.\n> Try it: press Run.\n> (Use it at https://example.com/ch/)');
    expect(md).toContain("**Check your understanding:** Which?\n\n- A — No.\n- It's B **(correct)** — Yes.");
    expect(md).toContain('### Exercise (by hand)');
    expect(md).toContain('**Solution:**');
    expect(md).toContain('```python\nimport numpy as np\n```');
    expect(md).not.toContain('Descent');
    expect(leftoverTags(md)).toEqual([]);
  });

  it('leaves no component tags in any published chapter', () => {
    const dir = path.resolve('src/content/lectures');
    for (const file of fs.readdirSync(dir)) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      if (!/^status: ready$/m.test(source)) continue;
      const body = source.replace(/^---[\s\S]*?\n---\n/, '');
      const md = mdxToMarkdown(body, ctx);
      expect(leftoverTags(md), file).toEqual([]);
      expect(md, file).not.toMatch(/client:visible|options=\{/);
      // Every checkpoint keeps its options.
      expect((md.match(/\*\*Check your understanding:\*\*/g) ?? []).length, file).toBe((body.match(/<Checkpoint\b/g) ?? []).length);
      // And every option.
      expect((md.match(/^- .* — /gm) ?? []).length, file).toBeGreaterThanOrEqual((body.match(/\{\s*text:/g) ?? []).length);
      expect(md, file).not.toMatch(/\*\*Check your understanding:\*\*[^\n]*\n\n(?!- )/);
    }
  });
});
