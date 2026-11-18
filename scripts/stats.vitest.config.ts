import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Lets the one-off stats scripts in this folder import from src with the `@` alias.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  test: { include: ['scripts/*-stats.ts'] },
});
