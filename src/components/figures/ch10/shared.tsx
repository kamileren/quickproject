import { TOY_RANGE, type Labelled } from '@/data/toy2d';
import { COLORS, Dots, Segments, type Point } from '../core/Plot';

/**
 * Two endpoints of the line w·x + b = level, long enough to cross the whole
 * plot whatever its direction. The plot clips the excess.
 */
export function levelLine(w: readonly number[], b: number, level: number): { from: Point; to: Point } {
  const [lo, hi] = [TOY_RANGE[0] - 30, TOY_RANGE[1] + 30];
  if (Math.abs(w[1]) >= Math.abs(w[0])) {
    const y = (x: number) => (level - b - w[0] * x) / w[1];
    return { from: { x: lo, y: y(lo) }, to: { x: hi, y: y(hi) } };
  }
  const x = (y: number) => (level - b - w[1] * y) / w[0];
  return { from: { x: x(lo), y: lo }, to: { x: x(hi), y: hi } };
}

interface StreetProps {
  w: readonly number[];
  b: number;
  /** Half the width of the street, in units of w·x + b. 1 for an SVM. */
  halfWidth?: number;
  stroke?: string;
  faint?: boolean;
}

/** A boundary line with the two dashed edges of its margin. */
export function Street({ w, b, halfWidth = 1, stroke = COLORS.accent, faint = false }: StreetProps) {
  return (
    <g opacity={faint ? 0.55 : 1}>
      <Segments segments={[levelLine(w, b, halfWidth), levelLine(w, b, -halfWidth)]} stroke={stroke} strokeWidth={1.5} dashed />
      <Segments segments={[levelLine(w, b, 0)]} stroke={stroke} strokeWidth={2.5} dashed={false} />
    </g>
  );
}

/** The two classes drawn the same way as everywhere else in the book: class 1 filled, class 0 hollow. */
export function ClassDots({ points, r = 4.5 }: { points: readonly Labelled[]; r?: number }) {
  return (
    <>
      <Dots points={points.filter((p) => p.label === 1)} r={r} title={(p) => `Filled kind at (${p.x}, ${p.y})`} />
      <Dots points={points.filter((p) => p.label === 0)} r={r} hollow title={(p) => `Hollow kind at (${p.x}, ${p.y})`} />
    </>
  );
}

/** Orange rings around the support vectors. */
export function SupportRings({ points, support }: { points: readonly Labelled[]; support: readonly number[] }) {
  return <Dots points={support.map((i) => points[i])} hollow fill={COLORS.accent} r={10} />;
}
