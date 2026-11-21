import { useMemo, useState } from 'react';
import { nearFarRatio } from '@/lib/knn';
import { ControlBar, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, Plot, Polyline, VRule } from '../core/Plot';

const DIMENSIONS = [1, 2, 3, 5, 8, 12, 20, 30, 50, 75, 100];
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const COUNT = 200;

/**
 * For 200 random points: how far the nearest neighbour is, compared with the
 * farthest, as the number of features grows.
 */
export default function DimensionCurve() {
  const [index, setIndex] = useState(1);
  const rows = useMemo(
    () => DIMENSIONS.map((d) => ({ d, ratio: SEEDS.reduce((s, seed) => s + nearFarRatio(d, COUNT, seed), 0) / SEEDS.length })),
    [],
  );
  const row = rows[index];

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[0, 100]}
        yDomain={[0, 1]}
        xLabel="Number of features"
        yLabel="Nearest ÷ farthest"
        aspect={0.5}
        label={`With ${row.d} features, the nearest of 200 random points is ${(row.ratio * 100).toFixed(0)} percent as far away as the farthest.`}
      >
        <VRule at={row.d} stroke={COLORS.faint} dashed strokeWidth={1} />
        <Polyline points={rows.map((r) => ({ x: r.d, y: r.ratio }))} strokeWidth={2.5} />
        <Dots points={rows.map((r) => ({ x: r.d, y: r.ratio }))} fill={COLORS.accent} r={3} />
        <Dots points={[{ x: row.d, y: row.ratio }]} fill={COLORS.ink} r={6} />
      </Plot>

      <Readout
        items={[
          { label: 'Features', value: String(row.d) },
          { label: 'Nearest neighbour is', value: `${(row.ratio * 100).toFixed(0)}% as far as the farthest`, key: true },
        ]}
      />

      <ControlBar>
        <Slider
          label="Number of features"
          value={index}
          min={0}
          max={DIMENSIONS.length - 1}
          step={1}
          onChange={setIndex}
          format={(i) => String(DIMENSIONS[i])}
        />
      </ControlBar>
    </div>
  );
}
