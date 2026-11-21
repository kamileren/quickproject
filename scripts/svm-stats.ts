// Prints the numbers the support vector machine chapter quotes.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose svm`.
import { it } from 'vitest';
import { apart, few, mixed, ringed } from '@/data/svm-points';
import { toLabels, toRows } from '@/data/toy2d';
import { svmAccuracy, trainSvm } from '@/lib/svm';

it('prints svm stats', () => {
  for (const [name, pts] of [['apart', apart], ['few', few]] as const) {
    const X = toRows(pts);
    const y = toLabels(pts);
    const t0 = performance.now();
    const m = trainSvm(X, y, { C: 1e4 });
    console.log(`${name}: n=${X.length} width=${m.marginWidth!.toFixed(3)} support=${m.support.length} w=${m.w!.map((v) => v.toFixed(3))} b=${m.b.toFixed(3)} converged=${m.converged} ms=${(performance.now() - t0).toFixed(1)}`);
  }
  const X = toRows(mixed);
  const y = toLabels(mixed);
  for (const C of [100, 10, 1, 0.1, 0.01, 0.001]) {
    const t0 = performance.now();
    const m = trainSvm(X, y, { C });
    const inside = X.filter((x) => Math.abs(m.decision(x)) < 1 - 1e-6).length;
    const wrong = Math.round((1 - svmAccuracy(m, X, y)) * X.length);
    console.log(`mixed C=${C}: width=${m.marginWidth!.toFixed(2)} support=${m.support.length} insideMargin=${inside} wrong=${wrong} converged=${m.converged} ms=${(performance.now() - t0).toFixed(1)}`);
  }
  const Xr = toRows(ringed);
  const yr = toLabels(ringed);
  console.log(`ringed linear: acc=${svmAccuracy(trainSvm(Xr, yr, { C: 1 }), Xr, yr).toFixed(3)}`);
  for (const gamma of [0.01, 0.05, 0.2, 0.5, 2, 10, 50]) {
    const t0 = performance.now();
    const m = trainSvm(Xr, yr, { C: 1, kernel: { kind: 'rbf', gamma } });
    console.log(`ringed rbf gamma=${gamma}: acc=${svmAccuracy(m, Xr, yr).toFixed(3)} support=${m.support.length} converged=${m.converged} ms=${(performance.now() - t0).toFixed(1)}`);
  }
});
