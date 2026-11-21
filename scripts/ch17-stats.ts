// Prints the numbers chapters 17 and 18 quote about training on the spiral.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose ch17`.
import { it } from 'vitest';
import { AdaGrad, Adam, RMSProp, SGD, type Optimizer } from '@/lib/nn';
import { createSpiralTrainer } from '@/lib/spiral-trainer';

it('prints spiral training stats', () => {
  const runs: [string, () => Optimizer][] = [
    ['sgd lr=1', () => new SGD({ learningRate: 1 })],
    ['sgd lr=0.3', () => new SGD({ learningRate: 0.3 })],
    ['sgd lr=1 decay=1e-3', () => new SGD({ learningRate: 1, decay: 1e-3 })],
    ['sgd lr=1 decay=1e-3 momentum=0.9', () => new SGD({ learningRate: 1, decay: 1e-3, momentum: 0.9 })],
    ['adagrad lr=1 decay=1e-4', () => new AdaGrad({ learningRate: 1, decay: 1e-4 })],
    ['rmsprop lr=0.02 decay=1e-5', () => new RMSProp({ learningRate: 0.02, decay: 1e-5 })],
    ['adam lr=0.05 decay=5e-7', () => new Adam({ learningRate: 0.05, decay: 5e-7 })],
  ];
  for (const [name, make] of runs) {
    const t = createSpiralTrainer(make(), { hidden: 32 });
    const marks: string[] = [`start loss ${t.loss().toFixed(3)} acc ${(t.trainAccuracy() * 100).toFixed(0)}`];
    const t0 = performance.now();
    for (const at of [10, 100, 300, 1000, 2000]) {
      t.run(at - t.steps());
      marks.push(`${at}: ${t.loss().toFixed(3)}/${(t.trainAccuracy() * 100).toFixed(0)}/${(t.testAccuracy() * 100).toFixed(0)}`);
    }
    console.log(`${name} | ${marks.join(' | ')} | ${(performance.now() - t0).toFixed(0)}ms`);
  }
});
