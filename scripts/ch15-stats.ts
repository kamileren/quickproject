// Prints the numbers chapter 15 quotes.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose ch15`.
import { it } from 'vitest';
import { trainMoons } from '@/components/figures/ch15/shared';
import { SLEEP_X, trueSleepCurve } from '@/data/sleep-scores';
import { fitHinges } from '@/lib/hinges';

it('prints ch15 stats', () => {
  for (const n of [1, 2, 3, 4, 5, 6, 8, 10, 12]) {
    const f = fitHinges(trueSleepCurve, SLEEP_X[0], SLEEP_X[1], n);
    console.log(`hinges ${n}: worst gap ${f.worstGap.toFixed(2)} slopes ${f.slopes.map((s) => s.toFixed(1)).join(' ')}`);
  }
  for (const bend of [false, true]) {
    for (const h of [1, 2, 3, 4, 5, 6, 8, 12, 16]) {
      const t0 = performance.now();
      const m = trainMoons(h, bend);
      console.log(`moons bend=${bend} h=${h}: train ${(m.trainAccuracy * 100).toFixed(0)} test ${(m.testAccuracy * 100).toFixed(1)} loss ${m.loss.toFixed(3)} ms ${(performance.now() - t0).toFixed(0)}`);
    }
  }
});
