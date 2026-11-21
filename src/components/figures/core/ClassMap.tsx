import { useMemo } from 'react';
import { SERIES, usePlot } from './Plot';

interface ClassMapProps {
  /** Returns the predicted class for each [x, y] point it is given. Called once with the whole grid. */
  classify: (points: number[][]) => number[];
  /** Change this whenever the model changes, so the map is recomputed. */
  version: unknown;
  cols?: number;
  rows?: number;
  opacity?: number;
}

/**
 * Colours the plot by which of several classes a model predicts at each spot.
 * Class k uses the k-th colour of the book's series palette. Draw it before
 * the data points.
 */
export function ClassMap({ classify, version, cols = 44, rows = 44, opacity = 0.2 }: ClassMapProps) {
  const { sx, sy, xDomain, yDomain } = usePlot();
  const dx = (xDomain[1] - xDomain[0]) / cols;
  const dy = (yDomain[1] - yDomain[0]) / rows;

  const classes = useMemo(() => {
    const grid: number[][] = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) grid.push([xDomain[0] + (c + 0.5) * dx, yDomain[0] + (r + 0.5) * dy]);
    }
    return classify(grid);
    // `classify` is a new function on every render; `version` says when its answers actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, cols, rows, xDomain[0], xDomain[1], yDomain[0], yDomain[1]]);

  return (
    <g aria-hidden="true" shapeRendering="crispEdges" opacity={opacity}>
      {classes.map((k, i) => {
        const c = Math.floor(i / rows);
        const r = i % rows;
        const x = xDomain[0] + c * dx;
        const y = yDomain[0] + r * dy;
        return <rect key={i} x={sx(x)} y={sy(y + dy)} width={sx(x + dx) - sx(x)} height={sy(y) - sy(y + dy)} fill={SERIES[k % SERIES.length]} />;
      })}
    </g>
  );
}
