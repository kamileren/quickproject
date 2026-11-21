/** Derivatives by nudging: the numerical versions of the ideas in the calculus toolkit chapter. */

/** Slope of the straight line joining the curve at x and at x + h: rise over run. */
export const secantSlope = (f: (x: number) => number, x: number, h: number): number => (f(x + h) - f(x)) / h;

/**
 * A close estimate of the derivative of f at x, from a tiny nudge on both
 * sides. Nudging both ways is much more accurate than nudging one way.
 */
export const numericalDerivative = (f: (x: number) => number, x: number, h = 1e-5): number =>
  (f(x + h) - f(x - h)) / (2 * h);

/** The gradient of a function of several inputs: one partial derivative per input. */
export function numericalGradient(f: (point: number[]) => number, point: readonly number[], h = 1e-5): number[] {
  return point.map((_, i) => {
    const up = [...point];
    const down = [...point];
    up[i] += h;
    down[i] -= h;
    return (f(up) - f(down)) / (2 * h);
  });
}
