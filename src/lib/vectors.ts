/** The handful of vector and matrix operations the book relies on. */

export type Vector = readonly number[];
export type Matrix = readonly (readonly number[])[];

const sameLength = (a: Vector, b: Vector, name: string): void => {
  if (a.length !== b.length) throw new Error(`${name}: vectors have lengths ${a.length} and ${b.length}`);
};

/** Adds two vectors entry by entry. */
export function add(a: Vector, b: Vector): number[] {
  sameLength(a, b, 'add');
  return a.map((v, i) => v + b[i]);
}

/** Multiplies every entry by the same number. */
export const scale = (a: Vector, c: number): number[] => a.map((v) => v * c);

/** The dot product: multiply matching entries and add up the results. */
export function dot(a: Vector, b: Vector): number {
  sameLength(a, b, 'dot');
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

/** Length of a vector. */
export const norm = (a: Vector): number => Math.sqrt(dot(a, a));

/** The part of `a` that lies along `b`: the shadow `a` casts on the line through `b`. */
export function project(a: Vector, b: Vector): number[] {
  const bb = dot(b, b);
  return bb === 0 ? b.map(() => 0) : scale(b, dot(a, b) / bb);
}

/** Angle between two vectors, in degrees. */
export function angleBetween(a: Vector, b: Vector): number {
  const d = norm(a) * norm(b);
  if (d === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot(a, b) / d))) * 180) / Math.PI;
}

/** A matrix times a vector: one dot product per row. */
export function matVec(M: Matrix, v: Vector): number[] {
  return M.map((row, i) => {
    if (row.length !== v.length) throw new Error(`matVec: row ${i} has ${row.length} entries but the vector has ${v.length}`);
    return dot(row, v);
  });
}

/** The shape of a matrix as [rows, columns]. */
export const shape = (M: Matrix): [number, number] => [M.length, M[0]?.length ?? 0];
