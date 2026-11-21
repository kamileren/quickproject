// Prints the numbers the nearest-neighbours chapter quotes.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose knn`.
import { it } from 'vitest';
import { moonsTest, moonsTrain, toLabels, toRows } from '@/data/toy2d';
import { knnAccuracy, nearFarRatio } from '@/lib/knn';

it('prints knn stats', () => {
  const X = toRows(moonsTrain);
  const y = toLabels(moonsTrain);
  const Xt = toRows(moonsTest);
  const yt = toLabels(moonsTest);
  for (const k of [1, 3, 5, 7, 9, 11, 13, 15, 19, 25, 31, 41, 51, 59]) {
    console.log(`k=${k} train=${(knnAccuracy(X, y, X, y, k) * 100).toFixed(1)} test=${(knnAccuracy(X, y, Xt, yt, k) * 100).toFixed(1)}`);
  }
  for (const d of [1, 2, 3, 5, 10, 20, 50, 100, 200]) {
    const avg = [1, 2, 3, 4, 5, 6, 7, 8].reduce((s, seed) => s + nearFarRatio(d, 200, seed), 0) / 8;
    console.log(`dims=${d} near/far=${avg.toFixed(3)}`);
  }
});
