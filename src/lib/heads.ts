/**
 * The same kind of network body with three different output layers ("heads"):
 * a yes/no answer, one class out of several, and a number. Used by the
 * chapter on output layers.
 */
import { sleepTrain, SLEEP_X } from '@/data/sleep-scores';
import { moons, type Labelled } from '@/data/toy2d';
import { Adam, Dense, lossFor, Network, ReLU, SGD, trainStep, type Task } from './nn';
import { mulberry32 } from './random';

/** Two crescents, used for the yes/no head. */
export const HEAD_MOONS: Labelled[] = moons(100, 0.42, 3);
const scaleMoon = (x: number, y: number): number[] => [(x - 5) / 2.5, (y - 5) / 2.5];

export interface YesNoModel {
  /** Probability that a point is the filled kind. */
  probability: (x: number, y: number) => number;
  accuracy: number;
  loss: number;
}

/** 2 inputs → 16 ReLU neurons → 1 output, trained with sigmoid cross-entropy. */
export function trainYesNoHead(epochs = 600, seed = 2): YesNoModel {
  const rand = mulberry32(seed);
  const network = new Network([new Dense(2, 16, rand), new ReLU(), new Dense(16, 1, rand)]);
  const X = HEAD_MOONS.map((p) => scaleMoon(p.x, p.y));
  const task: Task = { kind: 'yesNo', labels: HEAD_MOONS.map((p) => [p.label]) };
  const optimizer = new Adam({ learningRate: 0.03 });
  for (let i = 0; i < epochs; i++) trainStep(network, X, task, optimizer);

  const { loss, output } = lossFor(network.forward(X), task);
  const accuracy = output.filter((row, i) => (row[0] >= 0.5 ? 1 : 0) === HEAD_MOONS[i].label).length / X.length;
  return {
    probability: (x, y) => lossFor(network.forward([scaleMoon(x, y)]), { kind: 'yesNo', labels: [[0]] }).output[0][0],
    accuracy,
    loss,
  };
}

// The regression head works on rescaled values, as networks prefer: hours to about −1..1, scores to about −2..2.
const scaleHours = (h: number) => (h - (SLEEP_X[0] + SLEEP_X[1]) / 2) / ((SLEEP_X[1] - SLEEP_X[0]) / 2);
const SCORE_CENTRE = 65;
const SCORE_SPREAD = 12;

export interface NumberModel {
  /** Predicted exam score for a number of hours slept. */
  predict: (hours: number) => number;
  /** Mean squared error on the training students, in score points squared. */
  mse: number;
}

/** 1 input → 16 ReLU neurons → 1 output with no activation, trained with mean squared error. */
export function trainNumberHead(epochs = 1500, seed = 5): NumberModel {
  const rand = mulberry32(seed);
  const network = new Network([new Dense(1, 16, rand, { l2: 1e-3 }), new ReLU(), new Dense(16, 1, rand)]);
  const X = sleepTrain.map((p) => [scaleHours(p.x)]);
  const task: Task = { kind: 'numbers', targets: sleepTrain.map((p) => [(p.y - SCORE_CENTRE) / SCORE_SPREAD]) };
  const optimizer = new Adam({ learningRate: 0.02 });
  for (let i = 0; i < epochs; i++) trainStep(network, X, task, optimizer);

  const predict = (hours: number) => network.forward([[scaleHours(hours)]])[0][0] * SCORE_SPREAD + SCORE_CENTRE;
  const mse = sleepTrain.reduce((s, p) => s + (predict(p.x) - p.y) ** 2, 0) / sleepTrain.length;
  return { predict, mse };
}

export interface NeuronState {
  /** Weight and bias in the original units of the data. */
  w: number;
  b: number;
  loss: number;
}

/**
 * A single neuron trained by gradient descent, reporting its weight and bias
 * after every step. With no activation and squared error it is linear
 * regression; with a sigmoid and cross-entropy it is logistic regression.
 */
export function trainOneNeuron(
  xs: readonly number[],
  ys: readonly number[],
  kind: 'linear' | 'sigmoid',
  steps: number,
  learningRate: number,
): NeuronState[] {
  const centre = xs.reduce((a, b) => a + b, 0) / xs.length;
  const X = xs.map((x) => [x - centre]);
  const task: Task = kind === 'linear' ? { kind: 'numbers', targets: ys.map((y) => [y]) } : { kind: 'yesNo', labels: ys.map((y) => [y]) };
  const layer = new Dense(1, 1, mulberry32(1));
  layer.weights = [[0]];
  // A sensible starting bias: the average target for regression, zero for classification.
  layer.biases = [[kind === 'linear' ? ys.reduce((a, b) => a + b, 0) / ys.length - 15 : 0]];
  const network = new Network([layer]);
  const optimizer = new SGD({ learningRate });

  const read = (): NeuronState => {
    const w = layer.weights[0][0];
    return { w, b: layer.biases[0][0] - w * centre, loss: lossFor(network.forward(X), task).loss };
  };
  const states = [read()];
  for (let i = 0; i < steps; i++) {
    trainStep(network, X, task, optimizer);
    states.push(read());
  }
  return states;
}
