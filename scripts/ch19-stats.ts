// Prints the numbers chapter 19 quotes about overfitting, weight penalties and dropout.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose ch19`.
// Set SEARCH=1 to compare candidate training sets.
import { it } from 'vitest';
import { spiral, spiralSmall, spiralSmallTest, type SpiralPoint } from '@/data/spiral';
import { Adam } from '@/lib/nn';
import { createSpiralTrainer } from '@/lib/spiral-trainer';

function run(train: readonly SpiralPoint[], test: readonly SpiralPoint[], l2: number, dropout: number, steps = 1500, hidden = 64) {
  const t = createSpiralTrainer(new Adam({ learningRate: 0.03 }), { hidden, l2, dropout, train, test });
  let bestStep = 0;
  let bestLoss = Infinity;
  for (let step = 50; step <= steps; step += 50) {
    t.run(50);
    const tl = t.testLoss();
    if (tl < bestLoss) {
      bestLoss = tl;
      bestStep = step;
    }
  }
  return { trainAcc: t.trainAccuracy(), testAcc: t.testAccuracy(), trainLoss: t.loss(), testLoss: t.testLoss(), bestStep, bestLoss };
}

const show = (r: ReturnType<typeof run>) =>
  `train ${(r.trainAcc * 100).toFixed(0)}% (${r.trainLoss.toFixed(2)}) test ${(r.testAcc * 100).toFixed(0)}% (${r.testLoss.toFixed(2)}) best test loss ${r.bestLoss.toFixed(2)} @${r.bestStep}`;

it(
  'prints regularization stats',
  () => {
    if (process.env.SEARCH) {
      for (const perClass of [15, 20, 30]) {
        for (const noise of [0.25, 0.3, 0.35]) {
          for (const seed of [7, 11, 23]) {
            const train = spiral(perClass, 3, seed, noise);
            const test = spiral(150, 3, seed + 500, noise);
            const none = run(train, test, 0, 0);
            const l2 = run(train, test, 3e-3, 0);
            const drop = run(train, test, 0, 0.3);
            console.log(
              `n=${perClass} noise=${noise} seed=${seed}: none ${(none.testAcc * 100).toFixed(0)}/${none.testLoss.toFixed(2)}  l2 ${(l2.testAcc * 100).toFixed(0)}/${l2.testLoss.toFixed(2)}  drop ${(drop.testAcc * 100).toFixed(0)}/${drop.testLoss.toFixed(2)}  (train none ${(none.trainAcc * 100).toFixed(0)})`,
            );
          }
        }
      }
      return;
    }
    console.log('none          |', show(run(spiralSmall, spiralSmallTest, 0, 0)));
    for (const l2 of [1e-4, 1e-3, 3e-3, 1e-2, 3e-2, 1e-1]) console.log(`l2=${l2} |`, show(run(spiralSmall, spiralSmallTest, l2, 0)));
    for (const d of [0.1, 0.2, 0.3, 0.4, 0.5]) console.log(`dropout=${d} |`, show(run(spiralSmall, spiralSmallTest, 0, d)));
    console.log('both 3e-3,0.2 |', show(run(spiralSmall, spiralSmallTest, 3e-3, 0.2)));
    for (const steps of [100, 200, 300, 500, 1000]) console.log(`none after ${steps} steps |`, show(run(spiralSmall, spiralSmallTest, 0, 0, steps)));
  },
  300000,
);
