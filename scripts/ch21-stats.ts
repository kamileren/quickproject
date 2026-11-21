// Prints the numbers chapter 21 quotes about the shipped clothing classifier.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose ch21`.
import fs from 'node:fs';
import path from 'node:path';
import { it } from 'vitest';
import { confusionCounts, parseModel, parseSamples, predictAll, type FashionLog } from '@/lib/fashion';

it('prints fashion stats', () => {
  const dir = path.resolve(__dirname, '../public/data/fashion');
  const read = (name: string) => {
    const b = fs.readFileSync(path.join(dir, name));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  };
  const log = JSON.parse(fs.readFileSync(path.join(dir, 'log.json'), 'utf8')) as FashionLog;
  const model = parseModel(read('model.bin'), log.layers);
  const samples = parseSamples(read('test.bin'), log.sampleCount);
  const t0 = performance.now();
  const predictions = predictAll(model, samples);
  console.log(`predicting 500 images took ${(performance.now() - t0).toFixed(0)}ms`);
  const counts = confusionCounts(samples.labels, predictions, 10);
  counts.forEach((row, k) => console.log(`${log.classes[k].padEnd(12)} right ${row[k]}/50  row ${row.join(' ')}`));
  const pairs: [number, string][] = [];
  counts.forEach((row, t) => row.forEach((n, p) => t !== p && n > 0 && pairs.push([n, `${log.classes[t]} called ${log.classes[p]}`])));
  pairs.sort((a, b) => b[0] - a[0]);
  console.log('top confusions:', pairs.slice(0, 6).map(([n, s]) => `${s} ×${n}`).join('; '));
  console.log('first loss', log.loss[0], 'last loss', log.loss.at(-1), 'epochs', JSON.stringify(log.epochs));
});
