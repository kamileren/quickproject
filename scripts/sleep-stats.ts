// Prints the numbers chapters 4 and 5 quote about the sleep dataset, so prose can be checked against them.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose`.
// Set SEARCH=1 to list alternative seeds that give a clear teaching example.
import { it } from 'vitest';
import { sampleSleepStudents, sleepTest, sleepTrain, SLEEP_X } from '@/data/sleep-scores';
import type { Point } from '@/lib/linear';
import { crossValidate, fitPolynomial, kFolds, pointsMse } from '@/lib/poly';
import { mulberry32 } from '@/lib/random';

const domain = SLEEP_X;
const avg = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;

function table(train: Point[], test: Point[]) {
  const folds = kFolds(train, 5, mulberry32(1));
  return Array.from({ length: 9 }, (_, i) => {
    const d = i + 1;
    const m = fitPolynomial(train, d, { domain });
    return {
      d,
      train: pointsMse(train, m.predict),
      test: pointsMse(test, m.predict),
      cv: avg(crossValidate(folds, (t) => fitPolynomial(t, d, { domain }).predict)),
      maxW: Math.max(...m.weights.map(Math.abs)),
    };
  });
}

it('prints stats', () => {
  if (process.env.SEARCH) {
    for (let a = 1; a <= 400; a++) {
      for (const b of [84, 5, 17]) {
        const rows = table(sampleSleepStudents(12, a), sampleSleepStudents(20, b));
        const t = (d: number) => rows[d - 1].test;
        const bestCv = rows.reduce((x, y) => (y.cv < x.cv ? y : x)).d;
        const bestTest = rows.reduce((x, y) => (y.test < x.test ? y : x)).d;
        if (t(2) < 36 && t(1) > 2.5 * t(2) && t(9) > 4 * t(2) && t(9) < 80 * t(2) && bestCv <= 3 && bestTest <= 3 && rows[1].train > 10) {
          console.log(`seeds ${a},${b}: ` + rows.map((r) => `${r.d}:${r.train.toFixed(0)}/${r.test.toFixed(0)}/${r.cv.toFixed(0)}`).join('  '));
        }
      }
    }
    return;
  }
  console.log('train', JSON.stringify(sleepTrain));
  console.log('test', JSON.stringify(sleepTest));
  for (const r of table(sleepTrain, sleepTest)) {
    console.log(`degree ${r.d}: train ${r.train.toFixed(1)}  test ${r.test.toFixed(1)}  cv ${r.cv.toFixed(1)}  maxW ${r.maxW.toFixed(1)}`);
  }
  const folds = kFolds(sleepTrain, 5, mulberry32(1));
  for (const d of [1, 2, 9]) {
    console.log(`folds degree ${d}:`, crossValidate(folds, (t) => fitPolynomial(t, d, { domain }).predict).map((v) => v.toFixed(1)).join(', '));
  }
  for (const penalty of ['ridge', 'lasso'] as const) {
    for (const lambda of [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30]) {
      const m = fitPolynomial(sleepTrain, 9, { domain, penalty, lambda });
      console.log(
        `${penalty} λ=${lambda}: train ${pointsMse(sleepTrain, m.predict).toFixed(1)}  test ${pointsMse(sleepTest, m.predict).toFixed(1)}  zeros ${m.weights.filter((w) => w === 0).length}  w ${m.weights.map((w) => w.toFixed(1)).join(' ')}`,
      );
    }
  }
});

it('prints the penalty chosen by cross-validation', () => {
  const folds = kFolds(sleepTrain, 5, mulberry32(1));
  for (const penalty of ['ridge', 'lasso'] as const) {
    const rows = Array.from({ length: 46 }, (_, i) => {
      const e = +(-3 + i * 0.1).toFixed(1);
      const lambda = 10 ** e;
      const fit = (t: Point[]) => fitPolynomial(t, 9, { domain, penalty, lambda }).predict;
      return { e, lambda, cv: avg(crossValidate(folds, fit)), test: pointsMse(sleepTest, fit(sleepTrain)), train: pointsMse(sleepTrain, fit(sleepTrain)) };
    });
    const byCv = rows.reduce((a, b) => (b.cv < a.cv ? b : a));
    const byTest = rows.reduce((a, b) => (b.test < a.test ? b : a));
    console.log(`${penalty} chosen by CV: λ=${byCv.lambda.toFixed(4)} cv=${byCv.cv.toFixed(1)} test=${byCv.test.toFixed(1)} train=${byCv.train.toFixed(1)}`);
    console.log(`${penalty} best for test: λ=${byTest.lambda.toFixed(4)} cv=${byTest.cv.toFixed(1)} test=${byTest.test.toFixed(1)}`);
    console.log(`${penalty} ends: λ=0.001 cv=${rows[0].cv.toFixed(1)} test=${rows[0].test.toFixed(1)}; λ=31.6 cv=${rows[45].cv.toFixed(1)} test=${rows[45].test.toFixed(1)}`);
  }
});
