/**
 * A network being trained on the three-arm spiral, one step at a time.
 * The figures in the neural network chapters share this so that "press Run"
 * means the same thing everywhere.
 */
import { spiralLabels, spiralRows, spiralTest, spiralTrain, type SpiralPoint } from '@/data/spiral';
import { argmaxRows, classAccuracy, Dense, Dropout, lossFor, Network, ReLU, trainStep, type Layer, type Optimizer } from './nn';
import { mulberry32 } from './random';

export interface SpiralTrainerOptions {
  /** Neurons in the single hidden layer. */
  hidden?: number;
  seed?: number;
  /** Weight penalty on the hidden layer. */
  l2?: number;
  /** Share of hidden values dropped during training. */
  dropout?: number;
  /** Train on these points instead of the standard 300. */
  train?: readonly SpiralPoint[];
  test?: readonly SpiralPoint[];
}

export interface SpiralTrainer {
  network: Network;
  /** Runs `count` full-batch training steps and returns the loss before the last one. */
  run: (count: number) => number;
  /** Steps taken so far. */
  steps: () => number;
  /** Loss on the training points, without dropout. */
  loss: () => number;
  trainAccuracy: () => number;
  testAccuracy: () => number;
  /** Predicted class for each [x, y] point. */
  classify: (points: number[][]) => number[];
}

export function createSpiralTrainer(optimizer: Optimizer, options: SpiralTrainerOptions = {}): SpiralTrainer {
  const { hidden = 32, seed = 0, l2 = 0, dropout = 0, train = spiralTrain, test = spiralTest } = options;
  const rand = mulberry32(seed);
  const layers: Layer[] = [new Dense(2, hidden, rand, { l2 }), new ReLU()];
  if (dropout > 0) layers.push(new Dropout(dropout, mulberry32(seed + 99)));
  layers.push(new Dense(hidden, 3, rand));
  const network = new Network(layers);

  const X = spiralRows(train);
  const labels = spiralLabels(train);
  const testX = spiralRows(test);
  const testLabels = spiralLabels(test);
  let taken = 0;

  return {
    network,
    run(count) {
      let last = 0;
      for (let i = 0; i < count; i++) last = trainStep(network, X, { kind: 'classes', labels }, optimizer);
      taken += count;
      return last;
    },
    steps: () => taken,
    loss: () => lossFor(network.forward(X), { kind: 'classes', labels }).loss,
    trainAccuracy: () => classAccuracy(network, X, labels),
    testAccuracy: () => classAccuracy(network, testX, testLabels),
    classify: (points) => argmaxRows(network.forward(points)),
  };
}
