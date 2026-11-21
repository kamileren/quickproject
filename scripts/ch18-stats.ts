// Prints the numbers chapter 18 quotes about optimizers on the ravine.
// Run with `npx vitest run --config scripts/stats.vitest.config.ts --silent=false --reporter=verbose ch18`.
import { it } from 'vitest';
import { AdaGrad, Adam, RMSProp, SGD, type Optimizer } from '@/lib/nn';
import { descendRavine, RAVINE_START, ravineHeight, stepsToReach } from '@/lib/ravine';

it('prints ravine stats', () => {
  console.log('start height', ravineHeight(RAVINE_START).toFixed(2));
  const runs: [string, () => Optimizer][] = [
    ['sgd 0.1', () => new SGD({ learningRate: 0.1 })],
    ['sgd 0.5', () => new SGD({ learningRate: 0.5 })],
    ['sgd 0.9', () => new SGD({ learningRate: 0.9 })],
    ['sgd 0.98', () => new SGD({ learningRate: 0.98 })],
    ['sgd 1.02', () => new SGD({ learningRate: 1.02 })],
    ['sgd 0.98 decay 0.02', () => new SGD({ learningRate: 0.98, decay: 0.02 })],
    ['sgd 0.98 decay 0.05', () => new SGD({ learningRate: 0.98, decay: 0.05 })],
    ['sgd 0.98 decay 0.2', () => new SGD({ learningRate: 0.98, decay: 0.2 })],
    ['momentum 0.1/0.5', () => new SGD({ learningRate: 0.1, momentum: 0.5 })],
    ['momentum 0.1/0.8', () => new SGD({ learningRate: 0.1, momentum: 0.8 })],
    ['momentum 0.1/0.9', () => new SGD({ learningRate: 0.1, momentum: 0.9 })],
    ['momentum 0.1/0.95', () => new SGD({ learningRate: 0.1, momentum: 0.95 })],
    ['adagrad 1.5', () => new AdaGrad({ learningRate: 1.5 })],
    ['rmsprop 0.3', () => new RMSProp({ learningRate: 0.3 })],
    ['adam 0.5', () => new Adam({ learningRate: 0.5 })],
    ['adam 1', () => new Adam({ learningRate: 1 })],
  ];
  for (const [name, make] of runs) {
    const path = descendRavine(make(), 100);
    const at = (n: number) => (path[n] ? ravineHeight(path[n]).toFixed(3) : 'blown up');
    console.log(`${name}: h@10 ${at(10)} h@30 ${at(30)} h@60 ${at(60)} h@100 ${at(100)} | below 0.05 at step ${stepsToReach(path, 0.05)} | below 0.5 at ${stepsToReach(path, 0.5)}`);
  }
});
