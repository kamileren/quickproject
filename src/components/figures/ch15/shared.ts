import { moons, type Labelled } from '@/data/toy2d';
import { Adam, classAccuracy, Dense, Network, ReLU, softmax, trainStep, type Layer } from '@/lib/nn';
import { mulberry32 } from '@/lib/random';

/** Cleaner moons than the nearest-neighbours chapter used, so the shape of the boundary is the story. */
export const MOONS: Labelled[] = moons(100, 0.42, 3);
export const MOONS_TEST: Labelled[] = moons(300, 0.42, 1003);

/** The network sees each feature shifted and scaled to roughly −2 to 2. */
export const scaleInput = (x: number, y: number): number[] => [(x - 5) / 2.5, (y - 5) / 2.5];
const rows = (points: readonly Labelled[]) => points.map((p) => scaleInput(p.x, p.y));
const labels = (points: readonly Labelled[]) => points.map((p) => p.label);

export interface TrainedMoons {
  network: Network;
  /** Probability that a point of the plane is the filled kind. */
  probability: (x: number, y: number) => number;
  trainAccuracy: number;
  testAccuracy: number;
  loss: number;
}

/**
 * Trains a small network on the moons: 2 inputs → `hidden` neurons → 2 outputs.
 * With `bend` false the activation is left out, so the hidden layer is linear.
 */
export function trainMoons(hidden: number, bend: boolean, epochs = 700, seed = 4): TrainedMoons {
  const rand = mulberry32(seed);
  const layers: Layer[] = [new Dense(2, hidden, rand)];
  if (bend) layers.push(new ReLU());
  layers.push(new Dense(hidden, 2, rand));
  const network = new Network(layers);

  const X = rows(MOONS);
  const y = labels(MOONS);
  const optimizer = new Adam({ learningRate: 0.03 });
  let loss = 0;
  for (let epoch = 0; epoch < epochs; epoch++) loss = trainStep(network, X, { kind: 'classes', labels: y }, optimizer);

  return {
    network,
    probability: (x, yy) => softmax(network.forward([scaleInput(x, yy)]))[0][1],
    trainAccuracy: classAccuracy(network, X, y),
    testAccuracy: classAccuracy(network, rows(MOONS_TEST), labels(MOONS_TEST)),
    loss,
  };
}
