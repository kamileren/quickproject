import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { argmax, classProbabilities, confusionCounts, imageAt, parseModel, parseSamples, PIXELS, predictAll, scalePixel, type FashionLog } from './fashion';

const dir = path.resolve(__dirname, '../../public/data/fashion');
const read = (name: string) => {
  const b = fs.readFileSync(path.join(dir, name));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};
const log = JSON.parse(fs.readFileSync(path.join(dir, 'log.json'), 'utf8')) as FashionLog;
const model = parseModel(read('model.bin'), log.layers);
const samples = parseSamples(read('test.bin'), log.sampleCount);
const predictions = predictAll(model, samples);

describe('the shipped clothing classifier', () => {
  it('has the size the chapter states', () => {
    expect(log.layers).toEqual([784, 64, 64, 10]);
    expect(log.parameters).toBe(784 * 64 + 64 + 64 * 64 + 64 + 64 * 10 + 10);
    expect(log.parameters).toBe(55050);
    expect(samples.count).toBe(500);
    expect(imageAt(samples, 3)).toHaveLength(PIXELS);
  });

  it('gives the same accuracy in the browser as it did in Python', () => {
    const right = predictions.filter((p, i) => p === samples.labels[i]).length;
    expect(right / samples.count).toBeCloseTo(log.sampleAccuracy, 6);
    expect(log.sampleAccuracy).toBeGreaterThan(0.85);
  });

  it('outputs probabilities that sum to one', () => {
    const p = classProbabilities(model, imageAt(samples, 0));
    expect(p).toHaveLength(10);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    expect(argmax(p)).toBe(predictions[0]);
  });

  it('has fifty sample images of each class', () => {
    const counts = confusionCounts(samples.labels, samples.labels, 10);
    for (let k = 0; k < 10; k++) expect(counts[k][k]).toBe(50);
  });

  it('confuses shirts more than any other class', () => {
    const counts = confusionCounts(samples.labels, predictions, 10);
    const recall = counts.map((row, k) => row[k] / 50);
    const shirt = log.classes.indexOf('Shirt');
    expect(recall[shirt]).toBe(Math.min(...recall));
    expect(recall[log.classes.indexOf('Trouser')]).toBeGreaterThan(0.9);
  });

  it('scales pixels to the range the network was trained on', () => {
    expect(scalePixel(0)).toBe(-1);
    expect(scalePixel(255)).toBe(1);
  });

  it('logged a loss that fell during training', () => {
    expect(log.loss[0][1]).toBeGreaterThan(log.loss.at(-1)![1] * 2);
    expect(log.epochs).toHaveLength(5);
    expect(log.epochs.at(-1)!.testAccuracy).toBeCloseTo(0.8688, 4);
  });
});
