/**
 * The clothing classifier from the "A Real Dataset" chapter, in the browser.
 *
 * The weights were trained by `code/ch21_fashion.py` on Fashion-MNIST and
 * saved as plain 32-bit numbers. This file reads them back and runs the same
 * forward pass, so the figures show the real network's answers.
 */

export const IMAGE_SIDE = 28;
export const PIXELS = IMAGE_SIDE * IMAGE_SIDE;

export interface FashionLog {
  classes: string[];
  /** Layer sizes, input first. */
  layers: number[];
  parameters: number;
  batchSize: number;
  stepsPerEpoch: number;
  /** [step, loss] recorded every tenth training step. */
  loss: [number, number][];
  epochs: { epoch: number; step: number; meanLoss: number; trainAccuracy: number; testAccuracy: number }[];
  sampleCount: number;
  sampleAccuracy: number;
}

export interface FashionModel {
  layers: number[];
  /** One array per layer, laid out input by input: weights[l][i * neurons + j]. */
  weights: Float32Array[];
  biases: Float32Array[];
}

export interface FashionSamples {
  /** Raw pixels of every image, 784 bytes each, 0 (background) to 255. */
  pixels: Uint8Array;
  labels: number[];
  count: number;
}

/** Reads the weight file: for each layer, its weights then its biases. */
export function parseModel(buffer: ArrayBuffer, layers: number[]): FashionModel {
  const all = new Float32Array(buffer);
  const weights: Float32Array[] = [];
  const biases: Float32Array[] = [];
  let at = 0;
  for (let l = 0; l < layers.length - 1; l++) {
    const w = layers[l] * layers[l + 1];
    weights.push(all.subarray(at, at + w));
    at += w;
    biases.push(all.subarray(at, at + layers[l + 1]));
    at += layers[l + 1];
  }
  if (at !== all.length) throw new Error(`parseModel: expected ${at} numbers, file has ${all.length}`);
  return { layers, weights, biases };
}

/** Reads the sample file: all images, then one label byte per image. */
export function parseSamples(buffer: ArrayBuffer, count: number): FashionSamples {
  const bytes = new Uint8Array(buffer);
  if (bytes.length !== count * (PIXELS + 1)) throw new Error('parseSamples: unexpected file size');
  return { pixels: bytes.subarray(0, count * PIXELS), labels: Array.from(bytes.subarray(count * PIXELS)), count };
}

/** The pixels of one sample image. */
export const imageAt = (samples: FashionSamples, index: number): Uint8Array => samples.pixels.subarray(index * PIXELS, (index + 1) * PIXELS);

/** Pixels arrive as 0 to 255; the network was trained on values from −1 to 1. */
export const scalePixel = (value: number): number => (value - 127.5) / 127.5;

/** A forward pass for one image: the probability of each class. */
export function classProbabilities(model: FashionModel, pixels: Uint8Array): number[] {
  let activation: Float32Array | number[] = Array.from(pixels, scalePixel);
  const last = model.layers.length - 2;
  for (let l = 0; l <= last; l++) {
    const inputs = model.layers[l];
    const neurons = model.layers[l + 1];
    const w = model.weights[l];
    const out = Float32Array.from(model.biases[l]);
    for (let i = 0; i < inputs; i++) {
      const x = activation[i];
      if (x === 0) continue;
      const row = i * neurons;
      for (let j = 0; j < neurons; j++) out[j] += x * w[row + j];
    }
    if (l < last) for (let j = 0; j < neurons; j++) if (out[j] < 0) out[j] = 0; // ReLU on hidden layers
    activation = out;
  }
  const scores = Array.from(activation);
  const top = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - top));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / total);
}

export const argmax = (values: readonly number[]): number => values.indexOf(Math.max(...values));

/** The network's answer for every sample image. */
export const predictAll = (model: FashionModel, samples: FashionSamples): number[] =>
  Array.from({ length: samples.count }, (_, i) => argmax(classProbabilities(model, imageAt(samples, i))));

/** counts[true class][predicted class] over the sample images. */
export function confusionCounts(labels: readonly number[], predictions: readonly number[], classes: number): number[][] {
  const counts = Array.from({ length: classes }, () => new Array<number>(classes).fill(0));
  labels.forEach((y, i) => counts[y][predictions[i]]++);
  return counts;
}

export interface Fashion {
  log: FashionLog;
  model: FashionModel;
  samples: FashionSamples;
  predictions: number[];
}

let cached: Promise<Fashion> | null = null;

/** Downloads the weights, the sample images and the training log, once per page. */
export function loadFashion(base = '/data/fashion'): Promise<Fashion> {
  cached ??= (async () => {
    const [log, modelBytes, sampleBytes] = await Promise.all([
      fetch(`${base}/log.json`).then((r) => r.json() as Promise<FashionLog>),
      fetch(`${base}/model.bin`).then((r) => r.arrayBuffer()),
      fetch(`${base}/test.bin`).then((r) => r.arrayBuffer()),
    ]);
    const model = parseModel(modelBytes, log.layers);
    const samples = parseSamples(sampleBytes, log.sampleCount);
    return { log, model, samples, predictions: predictAll(model, samples) };
  })();
  return cached;
}
