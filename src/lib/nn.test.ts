import { describe, expect, it } from 'vitest';
import { examPoints } from '@/data/exam-scores';
import { outcomeX, outcomeY } from '@/data/pass-fail';
import { spiralLabels, spiralRows, spiralTest, spiralTrain } from '@/data/spiral';
import { fitLogistic } from './classify';
import { fitLine } from './linear';
import {
  AdaGrad,
  Adam,
  classAccuracy,
  Dense,
  Dropout,
  lossFor,
  meanSquaredError,
  Network,
  ReLU,
  RMSProp,
  SGD,
  Sigmoid,
  sigmoidCrossEntropy,
  softmax,
  softmaxCrossEntropy,
  Tanh,
  trainStep,
  type Matrix,
  type Task,
} from './nn';
import { mulberry32 } from './random';

describe('dense layer', () => {
  it('computes the hand-worked example from the single-neuron chapter', () => {
    const layer = new Dense(3, 1, mulberry32(1));
    layer.weights = [[5], [2], [0.5]];
    layer.biases = [[10]];
    // 5×4 + 2×7 + 0.5×60 + 10 = 74
    expect(layer.forward([[4, 7, 60]])).toEqual([[74]]);
  });

  it('handles a batch and several neurons at once', () => {
    const layer = new Dense(2, 3, mulberry32(1));
    layer.weights = [
      [1, 0, -1],
      [2, 1, 0],
    ];
    layer.biases = [[0, 10, 100]];
    expect(layer.forward([
      [1, 1],
      [2, 0],
    ])).toEqual([
      [3, 11, 99],
      [2, 10, 98],
    ]);
  });
});

describe('softmax and losses', () => {
  it('softmax gives positive rows that sum to one and survives huge scores', () => {
    const p = softmax([
      [2, 1, 0.1],
      [1000, 1000, 1000],
    ]);
    expect(p[0].reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(p[0][0]).toBeCloseTo(0.659, 3);
    expect(p[0][1]).toBeCloseTo(0.2424, 3);
    expect(p[1][0]).toBeCloseTo(1 / 3);
  });

  it('cross-entropy is minus the log of the probability given to the right class', () => {
    const { loss, gradient, output } = softmaxCrossEntropy([[2, 1, 0.1]], [0]);
    expect(loss).toBeCloseTo(-Math.log(0.659), 3);
    // Gradient is probabilities minus the one-hot truth.
    expect(gradient[0][0]).toBeCloseTo(output[0][0] - 1);
    expect(gradient[0][1]).toBeCloseTo(output[0][1]);
  });

  it('binary cross-entropy and mean squared error match hand values', () => {
    expect(sigmoidCrossEntropy([[0]], [[1]]).loss).toBeCloseTo(Math.log(2));
    const mse = meanSquaredError([[3], [5]], [[1], [5]]);
    expect(mse.loss).toBeCloseTo(2);
    expect(mse.gradient).toEqual([[2], [0]]);
  });
});

/** Compares backpropagation with nudging every single parameter. */
function gradientCheck(build: () => Network, X: Matrix, task: Task): number {
  const net = build();
  const total = () => lossFor(net.forward(X, false), task).loss + net.penalty();
  const { gradient } = lossFor(net.forward(X, false), task);
  net.backward(gradient);
  const analytic = net.params().map((p) => p.grads.map((r) => r.slice()));
  let worst = 0;
  const h = 1e-5;
  net.params().forEach((p, k) => {
    for (let i = 0; i < p.values.length; i++) {
      for (let j = 0; j < p.values[i].length; j++) {
        const keep = p.values[i][j];
        p.values[i][j] = keep + h;
        const up = total();
        p.values[i][j] = keep - h;
        const down = total();
        p.values[i][j] = keep;
        worst = Math.max(worst, Math.abs((up - down) / (2 * h) - analytic[k][i][j]));
      }
    }
  });
  return worst;
}

describe('backpropagation agrees with nudging', () => {
  const X = [
    [0.5, -1.2],
    [1.5, 0.3],
    [-0.7, 0.8],
    [0.1, 0.1],
  ];

  it('for a ReLU classifier with weight penalties', () => {
    const build = () => {
      const r = mulberry32(3);
      return new Network([new Dense(2, 5, r, { l2: 0.01, l1: 0.002 }), new ReLU(), new Dense(5, 3, r, { l2: 0.01 })]);
    };
    expect(gradientCheck(build, X, { kind: 'classes', labels: [0, 2, 1, 0] })).toBeLessThan(1e-6);
  });

  it('for sigmoid and tanh hidden layers with a yes/no output', () => {
    const build = () => {
      const r = mulberry32(5);
      return new Network([new Dense(2, 4, r), new Tanh(), new Dense(4, 3, r), new Sigmoid(), new Dense(3, 1, r)]);
    };
    expect(gradientCheck(build, X, { kind: 'yesNo', labels: [[1], [0], [1], [0]] })).toBeLessThan(1e-6);
  });

  it('for a regression network', () => {
    const build = () => {
      const r = mulberry32(8);
      return new Network([new Dense(2, 6, r), new ReLU(), new Dense(6, 2, r)]);
    };
    expect(gradientCheck(build, X, { kind: 'numbers', targets: [[1, 0], [0.5, 2], [-1, 1], [0, 0]] })).toBeLessThan(1e-6);
  });
});

describe('optimizers', () => {
  // One parameter with a known gradient, so each update rule can be checked by hand.
  const one = (value: number, grad: number) => ({ values: [[value]], grads: [[grad]] });

  it('plain SGD moves against the gradient', () => {
    const p = one(1, 0.5);
    new SGD({ learningRate: 0.1 }).step([p]);
    expect(p.values[0][0]).toBeCloseTo(0.95);
  });

  it('learning-rate decay shrinks the step over time', () => {
    const opt = new SGD({ learningRate: 1, decay: 0.1 });
    const p = one(0, 1);
    opt.step([p]);
    expect(opt.currentRate).toBeCloseTo(1);
    for (let i = 0; i < 9; i++) opt.step([p]);
    expect(opt.currentRate).toBeCloseTo(1 / 1.9);
  });

  it('momentum carries part of the previous step forward', () => {
    const opt = new SGD({ learningRate: 0.1, momentum: 0.9 });
    const p = one(0, 1);
    opt.step([p]); // −0.1
    opt.step([p]); // 0.9×(−0.1) − 0.1 = −0.19
    expect(p.values[0][0]).toBeCloseTo(-0.29);
  });

  it('AdaGrad and RMSProp divide by the size of past gradients', () => {
    const a = one(0, 2);
    new AdaGrad({ learningRate: 1 }).step([a]);
    expect(a.values[0][0]).toBeCloseTo(-1, 5); // 2 / sqrt(4)
    const r = one(0, 2);
    new RMSProp({ learningRate: 1, rho: 0.9 }).step([r]);
    expect(r.values[0][0]).toBeCloseTo(-2 / Math.sqrt(0.4), 4);
  });

  it('Adam takes a first step of exactly the learning rate, whatever the gradient size', () => {
    for (const g of [0.001, 1, 500]) {
      const p = one(0, g);
      new Adam({ learningRate: 0.05 }).step([p]);
      expect(p.values[0][0]).toBeCloseTo(-0.05, 4);
    }
  });

  it('all of them get down a simple bowl', () => {
    const makers = [
      () => new SGD({ learningRate: 0.1 }),
      () => new SGD({ learningRate: 0.1, momentum: 0.9 }),
      () => new AdaGrad({ learningRate: 0.5 }),
      () => new RMSProp({ learningRate: 0.05 }),
      () => new Adam({ learningRate: 0.1 }),
    ];
    for (const make of makers) {
      const opt = make();
      const p = { values: [[3, -2]], grads: [[0, 0]] };
      for (let i = 0; i < 300; i++) {
        p.grads = [[2 * p.values[0][0], 6 * p.values[0][1]]]; // gradient of x² + 3y²
        opt.step([p]);
      }
      expect(Math.abs(p.values[0][0])).toBeLessThan(0.1);
      expect(Math.abs(p.values[0][1])).toBeLessThan(0.1);
    }
  });
});

describe('dropout', () => {
  it('does nothing at prediction time', () => {
    const layer = new Dropout(0.5, mulberry32(1));
    const x = [[1, 2, 3, 4]];
    expect(layer.forward(x, false)).toBe(x);
  });

  it('in training, zeroes about the right share and keeps the average unchanged', () => {
    const layer = new Dropout(0.3, mulberry32(2));
    const x = [new Array<number>(20000).fill(1)];
    const out = layer.forward(x, true)[0];
    const zerosShare = out.filter((v) => v === 0).length / out.length;
    expect(zerosShare).toBeCloseTo(0.3, 1);
    expect(out.reduce((a, b) => a + b, 0) / out.length).toBeCloseTo(1, 1);
    // Gradients are blocked for exactly the units that were dropped.
    const back = layer.backward([new Array<number>(20000).fill(1)])[0];
    expect(back.filter((v) => v === 0).length).toBe(out.filter((v) => v === 0).length);
  });
});

describe('one neuron is an old friend', () => {
  it('a single linear neuron trained on squared error is linear regression', () => {
    const net = new Network([new Dense(1, 1, mulberry32(1))]);
    const mean = examPoints.reduce((s, p) => s + p.x, 0) / examPoints.length;
    const X = examPoints.map((p) => [p.x - mean]);
    const task: Task = { kind: 'numbers', targets: examPoints.map((p) => [p.y]) };
    const opt = new SGD({ learningRate: 0.05 });
    for (let i = 0; i < 2000; i++) trainStep(net, X, task, opt);
    const best = fitLine(examPoints);
    const dense = net.layers[0] as Dense;
    expect(dense.weights[0][0]).toBeCloseTo(best.w, 3);
    expect(dense.biases[0][0] - dense.weights[0][0] * mean).toBeCloseTo(best.b, 2);
  });

  it('a single sigmoid neuron trained on cross-entropy is logistic regression', () => {
    const net = new Network([new Dense(1, 1, mulberry32(1))]);
    const X = outcomeX.map(([h]) => [h - 4.5]);
    const task: Task = { kind: 'yesNo', labels: outcomeY.map((y) => [y]) };
    const opt = new SGD({ learningRate: 0.5 });
    for (let i = 0; i < 20000; i++) trainStep(net, X, task, opt);
    const best = fitLogistic(outcomeX, outcomeY).weights;
    const dense = net.layers[0] as Dense;
    expect(dense.weights[0][0]).toBeCloseTo(best[1], 2);
    expect(dense.biases[0][0] - dense.weights[0][0] * 4.5).toBeCloseTo(best[0], 1);
  });
});

describe('training on the spiral', () => {
  it('learns three interleaved spirals that no straight line can separate', () => {
    const r = mulberry32(0);
    const net = new Network([new Dense(2, 64, r), new ReLU(), new Dense(64, 3, r)]);
    const X = spiralRows(spiralTrain);
    const labels = spiralLabels(spiralTrain);
    const task: Task = { kind: 'classes', labels };
    const opt = new Adam({ learningRate: 0.05, decay: 5e-7 });

    const before = classAccuracy(net, X, labels);
    let loss = Infinity;
    for (let epoch = 0; epoch < 1500; epoch++) loss = trainStep(net, X, task, opt);

    expect(before).toBeLessThan(0.5);
    expect(loss).toBeLessThan(0.35);
    expect(classAccuracy(net, X, labels)).toBeGreaterThan(0.88);
    expect(classAccuracy(net, spiralRows(spiralTest), spiralLabels(spiralTest))).toBeGreaterThan(0.75);
    expect(net.size()).toBe(2 * 64 + 64 + 64 * 3 + 3);
  });

  it('a network with no hidden layer cannot', () => {
    const net = new Network([new Dense(2, 3, mulberry32(0))]);
    const X = spiralRows(spiralTrain);
    const labels = spiralLabels(spiralTrain);
    const opt = new Adam({ learningRate: 0.05 });
    for (let epoch = 0; epoch < 800; epoch++) trainStep(net, X, { kind: 'classes', labels }, opt);
    expect(classAccuracy(net, X, labels)).toBeLessThan(0.6);
  });
});
