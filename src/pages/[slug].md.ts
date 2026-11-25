/** A plain Markdown copy of each chapter, for AI assistants and other tools. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getReadyLectures, type Lecture } from '@/lib/book';
import { chapterMarkdown } from '@/lib/llms';

export const getStaticPaths = (async () => (await getReadyLectures()).map((lecture) => ({ params: { slug: lecture.id }, props: { lecture } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ lecture: Lecture }> = async ({ props }) =>
  new Response(await chapterMarkdown(props.lecture), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
