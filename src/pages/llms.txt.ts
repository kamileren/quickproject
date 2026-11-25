/** The llms.txt index (https://llmstxt.org): what the book is and where each chapter is. */
import type { APIRoute } from 'astro';
import { llmsIndex } from '@/lib/llms';

export const GET: APIRoute = async () => new Response(await llmsIndex(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
