/**
 * A small neural network library, written to be read.
 *
 * It is built from the same pieces the neural network chapters introduce one
 * at a time: dense layers, activation functions, losses and optimizers. Every
 * figure in that part of the book runs on this file, so what the reader sees
 * is what the text describes.
 *
 * Data is a matrix with one row per example: `number[][]` of shape
 * (examples × features).
 */
import { gaussian } from './random';

export type Matrix = number[][];

export const zeros = (rows: number, cols: number): Matrix => Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

/** A set of numbers the network learns, with the gradient of the loss for each. */
export interface Param {
  values: Matrix;
  grads: Matrix;
}

export interface Layer {
  /** Computes the layer's output and remembers what it needs for the backward pass. */
  forward(input: Matrix, training?: boolean): Matrix;
  /** Takes the gradient of the loss with respect to the output; returns it with respect to the input. */
  backward(dOutput: Matrix): Matrix;
  params?(): Param[];
  /** Extra loss from weight penalties, if any. */
  penalty?(): number;
}

export interface DenseOptions {
  /** "he" suits ReLU layers; "small" starts every weight near zero, as the first chapters do. */
  init?: 'he' | 'small';
  /** Strength of the penalty on absolute weights. */
  l1?: number;
  /** Strength of the penalty on squared weights. */
  l2?: number;
}

/** A fully connected layer: every input feeds every neuron. output = input · weights + biases. */
export class Dense implements Layer {
  /** Shape (inputs × neurons): column j holds the weights of neuron j. */
  weights: Matrix;
  /** Shape (1 × neurons). */
  biases: Matrix;
  dWeights: Matrix;
  dBiases: Matrix;
  private input: Matrix = [];
  private readonly l1: number;
  private readonly l2: number;

  constructor(
    readonly inputs: number,
    readonly neurons: number,
    rand: () => number,
    options: DenseOptions = {},
  ) {
    const { init = 'he', l1 = 0, l2 = 0 } = options;
    const scale = init === 'he' ? Math.sqrt(2 / inputs) : 0.01;
    this.weights = Array.from({ length: inputs }, () => Array.from({ length: neurons }, () => scale * gaussian(rand)));
    this.biases = zeros(1, neurons);
    this.dWeights = zeros(inputs, neurons);
    this.dBiases = zeros(1, neurons);
    this.l1 = l1;
    this.l2 = l2;
  }

  forward(input: Matrix): Matrix {
    this.input = input;
    const { weights, biases, inputs, neurons } = this;
    return input.map((row) => {
      const out = biases[0].slice();
      for (let i = 0; i < inputs; i++) {
        const x = row[i];
        if (x === 0) continue;
        const w = weights[i];
        for (let j = 0; j < neurons; j++) out[j] += x * w[j];
      }
      return out;
    });
  }

  backward(dOutput: Matrix): Matrix {
    const { input, weights, inputs, neurons, l1, l2 } = this;
    const dW = zeros(inputs, neurons);
    const dB = new Array<number>(neurons).fill(0);
    const dInput = zeros(input.length, inputs);
    for (let n = 0; n < input.length; n++) {
      const x = input[n];
      const d = dOutput[n];
      const dIn = dInput[n];
      for (let j = 0; j < neurons; j++) dB[j] += d[j];
      for (let i = 0; i < inputs; i++) {
        const w = weights[i];
        const dw = dW[i];
        const xi = x[i];
        let back = 0;
        for (let j = 0; j < neurons; j++) {
          dw[j] += xi * d[j];
          back += w[j] * d[j];
        }
        dIn[i] = back;
      }
    }
    if (l1 > 0 || l2 > 0) {
      for (let i = 0; i < inputs; i++) {
        for (let j = 0; j < neurons; j++) dW[i][j] += 2 * l2 * weights[i][j] + l1 * Math.sign(weights[i][j]);
      }
    }
    this.dWeights = dW;
    this.dBiases = [dB];
    return dInput;
  }

  params(): Param[] {
    return [
      { values: this.weights, grads: this.dWeights },
      { values: this.biases, grads: this.dBiases },
    ];
  }

  penalty(): number {
    if (this.l1 === 0 && this.l2 === 0) return 0;
    let total = 0;
    for (const row of this.weights) for (const w of row) total += this.l2 * w * w + this.l1 * Math.abs(w);
    return total;
  }
}

/** Applies the same function to every number, and its slope on the way back. */
abstract class Elementwise implements Layer {
  protected output: Matrix = [];
  protected input: Matrix = [];
  protected abstract f(x: number): number;
  /** Slope of f, given the input x and the output y = f(x). */
  protected abstract slope(x: number, y: number): number;

  forward(input: Matrix): Matrix {
    this.input = input;
    this.output = input.map((row) => row.map((x) => this.f(x)));
    return this.output;
  }

  backward(dOutput: Matrix): Matrix {
    return dOutput.map((row, n) => row.map((d, j) => d * this.slope(this.input[n][j], this.output[n][j])));
  }
}

/** Rectified linear unit: negative values become zero, positive values pass through. */
export class ReLU extends Elementwise {
  protected f(x: number): number {
    return x > 0 ? x : 0;
  }
  protected slope(x: number): number {
    return x > 0 ? 1 : 0;
  }
}

export class Sigmoid extends Elementwise {
  protected f(x: number): number {
    return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
  }
  protected slope(_x: number, y: number): number {
    return y * (1 - y);
  }
}

export class Tanh extends Elementwise {
  protected f(x: number): number {
    return Math.tanh(x);
  }
  protected slope(_x: number, y: number): number {
    return 1 - y * y;
  }
}

/**
 * Dropout: during training, switches each value off with probability `rate`
 * and scales the survivors up so the expected total is unchanged. At
 * prediction time it does nothing.
 */
export class Dropout implements Layer {
  private mask: Matrix = [];
  constructor(
    readonly rate: number,
    private readonly rand: () => number,
  ) {
    if (rate < 0 || rate >= 1) throw new Error('Dropout: rate must be at least 0 and below 1');
  }

  forward(input: Matrix, training = false): Matrix {
    if (!training || this.rate === 0) {
      this.mask = [];
      return input;
    }
    const keep = 1 - this.rate;
    this.mask = input.map((row) => row.map(() => (this.rand() < keep ? 1 / keep : 0)));
    return input.map((row, n) => row.map((x, j) => x * this.mask[n][j]));
  }

  backward(dOutput: Matrix): Matrix {
    if (this.mask.length === 0) return dOutput;
    return dOutput.map((row, n) => row.map((d, j) => d * this.mask[n][j]));
  }
}

/** Turns each row of scores into probabilities that are positive and sum to 1. */
export function softmax(scores: Matrix): Matrix {
  return scores.map((row) => {
    const top = Math.max(...row);
    const exps = row.map((s) => Math.exp(s - top)); // subtracting the largest avoids overflow
    const total = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / total);
  });
}

const TINY = 1e-12;

export interface LossResult {
  /** Mean loss over the batch. */
  loss: number;
  /** The network's final answer: probabilities, or predicted values for regression. */
  output: Matrix;
  /** Gradient of the mean loss with respect to the last layer's raw output. */
  gradient: Matrix;
}

/**
 * Softmax followed by cross-entropy, for choosing one class out of several.
 * `labels` holds the index of the correct class for each example. Combining
 * the two gives the simple gradient (probabilities − one-hot truth) / batch.
 */
export function softmaxCrossEntropy(scores: Matrix, labels: readonly number[]): LossResult {
  const output = softmax(scores);
  const n = scores.length;
  let loss = 0;
  const gradient = output.map((row, i) => {
    loss -= Math.log(Math.max(row[labels[i]], TINY));
    return row.map((p, j) => (p - (j === labels[i] ? 1 : 0)) / n);
  });
  return { loss: loss / n, output, gradient };
}

/** Sigmoid followed by binary cross-entropy, for yes/no outputs. `labels` are 0 or 1, one per output. */
export function sigmoidCrossEntropy(scores: Matrix, labels: Matrix): LossResult {
  const n = scores.length;
  const outputs = scores[0].length;
  let loss = 0;
  const output: Matrix = [];
  const gradient = scores.map((row, i) => {
    const probs = row.map((s) => (s >= 0 ? 1 / (1 + Math.exp(-s)) : Math.exp(s) / (1 + Math.exp(s))));
    output.push(probs);
    return probs.map((p, j) => {
      const y = labels[i][j];
      loss -= y * Math.log(Math.max(p, TINY)) + (1 - y) * Math.log(Math.max(1 - p, TINY));
      return (p - y) / (n * outputs);
    });
  });
  return { loss: loss / (n * outputs), output, gradient };
}

/** Mean squared error, for predicting numbers. */
export function meanSquaredError(predictions: Matrix, targets: Matrix): LossResult {
  const n = predictions.length;
  const outputs = predictions[0].length;
  let loss = 0;
  const gradient = predictions.map((row, i) =>
    row.map((p, j) => {
      const miss = p - targets[i][j];
      loss += miss * miss;
      return (2 * miss) / (n * outputs);
    }),
  );
  return { loss: loss / (n * outputs), output: predictions, gradient };
}

/** A stack of layers applied one after another. */
export class Network {
  constructor(readonly layers: Layer[]) {}

  forward(input: Matrix, training = false): Matrix {
    return this.layers.reduce((x, layer) => layer.forward(x, training), input);
  }

  /** Sends the loss gradient back through every layer, last to first. */
  backward(gradient: Matrix): Matrix {
    return this.layers.reduceRight((d, layer) => layer.backward(d), gradient);
  }

  params(): Param[] {
    return this.layers.flatMap((layer) => layer.params?.() ?? []);
  }

  /** Total penalty from every layer that has one. */
  penalty(): number {
    return this.layers.reduce((s, layer) => s + (layer.penalty?.() ?? 0), 0);
  }

  /** Number of learnable numbers in the network. */
  size(): number {
    return this.params().reduce((s, p) => s + p.values.length * p.values[0].length, 0);
  }
}

export interface Optimizer {
  /** Adjusts every parameter using its current gradient. Call once per training step. */
  step(params: Param[]): void;
  /** The learning rate in use on the most recent step, after any decay. */
  currentRate: number;
}

export interface SgdOptions {
  learningRate?: number;
  /** Shrinks the learning rate over time: rate = start / (1 + decay × step). */
  decay?: number;
  /** Fraction of the previous update carried into the next one. 0 is plain gradient descent. */
  momentum?: number;
}

/** Gradient descent, optionally with learning-rate decay and momentum. */
export class SGD implements Optimizer {
  currentRate: number;
  private iteration = 0;
  private velocity = new Map<Matrix, Matrix>();
  private readonly learningRate: number;
  private readonly decay: number;
  private readonly momentum: number;

  constructor({ learningRate = 1, decay = 0, momentum = 0 }: SgdOptions = {}) {
    this.learningRate = learningRate;
    this.decay = decay;
    this.momentum = momentum;
    this.currentRate = learningRate;
  }

  step(params: Param[]): void {
    this.currentRate = this.learningRate / (1 + this.decay * this.iteration);
    for (const { values, grads } of params) {
      let v = this.velocity.get(values);
      if (!v) this.velocity.set(values, (v = zeros(values.length, values[0].length)));
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
          v[i][j] = this.momentum * v[i][j] - this.currentRate * grads[i][j];
          values[i][j] += v[i][j];
        }
      }
    }
    this.iteration++;
  }
}

export interface AdaptiveOptions {
  learningRate?: number;
  decay?: number;
  /** Small number that prevents division by zero. */
  epsilon?: number;
}

/** AdaGrad: each weight's step shrinks according to how much it has moved in total. */
export class AdaGrad implements Optimizer {
  currentRate: number;
  private iteration = 0;
  private cache = new Map<Matrix, Matrix>();
  private readonly learningRate: number;
  private readonly decay: number;
  private readonly epsilon: number;

  constructor({ learningRate = 1, decay = 0, epsilon = 1e-7 }: AdaptiveOptions = {}) {
    this.learningRate = learningRate;
    this.decay = decay;
    this.epsilon = epsilon;
    this.currentRate = learningRate;
  }

  step(params: Param[]): void {
    this.currentRate = this.learningRate / (1 + this.decay * this.iteration);
    for (const { values, grads } of params) {
      let c = this.cache.get(values);
      if (!c) this.cache.set(values, (c = zeros(values.length, values[0].length)));
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
          c[i][j] += grads[i][j] ** 2;
          values[i][j] -= (this.currentRate * grads[i][j]) / (Math.sqrt(c[i][j]) + this.epsilon);
        }
      }
    }
    this.iteration++;
  }
}

/** RMSProp: like AdaGrad, but the history fades, so steps do not shrink forever. */
export class RMSProp implements Optimizer {
  currentRate: number;
  private iteration = 0;
  private cache = new Map<Matrix, Matrix>();
  private readonly learningRate: number;
  private readonly decay: number;
  private readonly epsilon: number;
  private readonly rho: number;

  constructor({ learningRate = 0.001, decay = 0, epsilon = 1e-7, rho = 0.9 }: AdaptiveOptions & { rho?: number } = {}) {
    this.learningRate = learningRate;
    this.decay = decay;
    this.epsilon = epsilon;
    this.rho = rho;
    this.currentRate = learningRate;
  }

  step(params: Param[]): void {
    this.currentRate = this.learningRate / (1 + this.decay * this.iteration);
    for (const { values, grads } of params) {
      let c = this.cache.get(values);
      if (!c) this.cache.set(values, (c = zeros(values.length, values[0].length)));
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
          c[i][j] = this.rho * c[i][j] + (1 - this.rho) * grads[i][j] ** 2;
          values[i][j] -= (this.currentRate * grads[i][j]) / (Math.sqrt(c[i][j]) + this.epsilon);
        }
      }
    }
    this.iteration++;
  }
}

/** Adam: momentum and RMSProp together, with a correction for the first few steps. */
export class Adam implements Optimizer {
  currentRate: number;
  private iteration = 0;
  private momentums = new Map<Matrix, Matrix>();
  private cache = new Map<Matrix, Matrix>();
  private readonly learningRate: number;
  private readonly decay: number;
  private readonly epsilon: number;
  private readonly beta1: number;
  private readonly beta2: number;

  constructor({ learningRate = 0.001, decay = 0, epsilon = 1e-7, beta1 = 0.9, beta2 = 0.999 }: AdaptiveOptions & { beta1?: number; beta2?: number } = {}) {
    this.learningRate = learningRate;
    this.decay = decay;
    this.epsilon = epsilon;
    this.beta1 = beta1;
    this.beta2 = beta2;
    this.currentRate = learningRate;
  }

  step(params: Param[]): void {
    this.currentRate = this.learningRate / (1 + this.decay * this.iteration);
    const t = this.iteration + 1;
    const fix1 = 1 - this.beta1 ** t;
    const fix2 = 1 - this.beta2 ** t;
    for (const { values, grads } of params) {
      let m = this.momentums.get(values);
      let c = this.cache.get(values);
      if (!m) this.momentums.set(values, (m = zeros(values.length, values[0].length)));
      if (!c) this.cache.set(values, (c = zeros(values.length, values[0].length)));
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < values[i].length; j++) {
          const g = grads[i][j];
          m[i][j] = this.beta1 * m[i][j] + (1 - this.beta1) * g;
          c[i][j] = this.beta2 * c[i][j] + (1 - this.beta2) * g * g;
          values[i][j] -= (this.currentRate * (m[i][j] / fix1)) / (Math.sqrt(c[i][j] / fix2) + this.epsilon);
        }
      }
    }
    this.iteration++;
  }
}

export type Task =
  | { kind: 'classes'; labels: readonly number[] }
  | { kind: 'yesNo'; labels: Matrix }
  | { kind: 'numbers'; targets: Matrix };

/** Runs the right loss for the task on the network's raw output. */
export function lossFor(scores: Matrix, task: Task): LossResult {
  if (task.kind === 'classes') return softmaxCrossEntropy(scores, task.labels);
  if (task.kind === 'yesNo') return sigmoidCrossEntropy(scores, task.labels);
  return meanSquaredError(scores, task.targets);
}

/**
 * One full training step: forward pass, loss, backward pass, update.
 * Returns the data loss (without penalties) before the update.
 */
export function trainStep(network: Network, input: Matrix, task: Task, optimizer: Optimizer): number {
  const scores = network.forward(input, true);
  const { loss, gradient } = lossFor(scores, task);
  network.backward(gradient);
  optimizer.step(network.params());
  return loss;
}

/** Index of the largest value in each row: the predicted class. */
export const argmaxRows = (m: Matrix): number[] => m.map((row) => row.indexOf(Math.max(...row)));

/** Share of examples whose highest-scoring class is the correct one. */
export function classAccuracy(network: Network, input: Matrix, labels: readonly number[]): number {
  const predicted = argmaxRows(network.forward(input));
  return predicted.filter((p, i) => p === labels[i]).length / labels.length;
}
