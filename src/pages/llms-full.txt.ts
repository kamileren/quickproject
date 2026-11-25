/** Every published chapter as Markdown, in one file. */
import type { APIRoute } from 'astro';
import { llmsFull } from '@/lib/llms';

export const GET: APIRoute = async () => new Response(await llmsFull(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
