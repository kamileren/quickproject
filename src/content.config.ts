import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';

/** Chapters. File names are `NN-slug.mdx`; the URL is `/slug/`. */
const lectures = defineCollection({
  loader: glob({
    pattern: '*.mdx',
    base: './src/content/lectures',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, '').replace(/^[\d.]+-/, ''),
  }),
  schema: z.object({
    title: z.string(),
    /** Shown chapter number, e.g. "2" or "0.1". */
    number: z.string(),
    part: z.string(),
    /** Position in the whole book. */
    order: z.number(),
    summary: z.string(),
    status: z.enum(['draft', 'ready']).default('draft'),
    /** The question the chapter opens with. */
    question: z.string().optional(),
    dataset: z.string().optional(),
    minutes: z.number().optional(),
    /** Chapter ids the reader should have seen first. */
    prerequisites: z.array(z.string()).default([]),
  }),
});

const parts = defineCollection({
  loader: file('src/content/parts.yaml'),
  schema: z.object({
    label: z.string(),
    title: z.string(),
    order: z.number(),
    /** One or two sentences on what the part is for. */
    intro: z.string(),
    /** What a reader should already have read. */
    needs: z.string().optional(),
  }),
});

const glossary = defineCollection({
  loader: file('src/content/glossary.yaml'),
  schema: z.object({
    term: z.string(),
    definition: z.string(),
    /** Ids of related terms, shown as links in the pop-in and the glossary. */
    seeAlso: z.array(z.string()).default([]),
  }),
});

const notation = defineCollection({
  loader: file('src/content/notation.yaml'),
  schema: z.object({ symbol: z.string(), meaning: z.string() }),
});

const datasets = defineCollection({
  loader: file('src/content/datasets.yaml'),
  schema: z.object({ name: z.string(), about: z.string() }),
});

export const collections = { lectures, parts, glossary, notation, datasets };
