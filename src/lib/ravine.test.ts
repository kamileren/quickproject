import { describe, expect, it } from 'vitest';
import { Adam, RMSProp, SGD } from './nn';
import { descendRavine, RAVINE_START, ravineContour, ravineGradient, ravineHeight, stepsToReach } from './ravine';

const finalHeight = (path: ReturnType<typeof descendRavine>) => ravineHeight(path[path.length - 1]);

describe('the ravine surface', () => {
  it('is twenty times steeper across than along', () => {
    expect(ravineHeight({ x: 1, y: 0 })).toBeCloseTo(0.05);
    expect(ravineHeight({ x: 0, y: 1 })).toBeCloseTo(1);
    expect(ravineGradient({ x: 2, y: 3 })).toEqual({ x: 0.2, y: 6 });
    expect(ravineHeight(RAVINE_START)).toBeCloseTo(13.05);
  });

  it('draws contours at the requested height', () => {
    for (const p of ravineContour(5)) expect(ravineHeight(p)).toBeCloseTo(5, 8);
  });
});

describe('plain gradient descent on the ravine', () => {
  it('is slow with a cautious learning rate', () => {
    const path = descendRavine(new SGD({ learningRate: 0.1 }), 100);
    expect(stepsToReach(path, 0.05)).toBeNull();
    expect(finalHeight(path)).toBeCloseTo(0.543, 2);
  });

  it('is fast just below the limit and diverges just above it', () => {
    expect(stepsToReach(descendRavine(new SGD({ learningRate: 0.9 }), 100), 0.05)).toBe(24);
    const tooBig = descendRavine(new SGD({ learningRate: 1.02 }), 100);
    expect(finalHeight(tooBig)).toBeGreaterThan(1000);
  });

  it('settles sooner when a too-large rate decays, and stalls when it decays too fast', () => {
    const steps = (decay: number) => stepsToReach(descendRavine(new SGD({ learningRate: 0.98, decay }), 100), 0.05);
    expect(steps(0)).toBe(64);
    expect(steps(0.02)).toBe(27);
    expect(steps(0.2)).toBeNull();
  });
});

describe('momentum and adaptive methods', () => {
  it('momentum makes the cautious rate fast, and too much overshoots', () => {
    const steps = (momentum: number) => stepsToReach(descendRavine(new SGD({ learningRate: 0.1, momentum }), 100), 0.05);
    expect(steps(0)).toBeNull();
    expect(steps(0.9)).toBe(24);
    const heavy = descendRavine(new SGD({ learningRate: 0.1, momentum: 0.95 }), 100);
    expect(ravineHeight(heavy[60])).toBeGreaterThan(ravineHeight(descendRavine(new SGD({ learningRate: 0.1, momentum: 0.9 }), 100)[60]));
  });

  it('RMSProp and Adam reach the bottom with their usual settings', () => {
    expect(stepsToReach(descendRavine(new RMSProp({ learningRate: 0.3 }), 100), 0.05)).toBe(29);
    expect(stepsToReach(descendRavine(new Adam({ learningRate: 0.5 }), 100), 0.05)).toBe(20);
  });
});
