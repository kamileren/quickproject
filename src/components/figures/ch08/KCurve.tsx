import { useMemo, useState } from 'react';
import { moonsTest, moonsTrain, toLabels, toRows } from '@/data/toy2d';
import { knnAccuracy } from '@/lib/knn';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, Plot, PlotLabel, Polyline, VRule } from '../core/Plot';

const X = toRows(moonsTrain);
const Y = toLabels(moonsTrain);
const TEST_X = toRows(moonsTest);
const TEST_Y = toLabels(moonsTest);
const KS = Array.from({ length: 21 }, (_, i) => 2 * i + 1);

/** Error rate against k, on the known points and on new ones. */
export default function KCurve() {
  const [k, setK] = useState(1);
  const rows = useMemo(
    () => KS.map((kk) => ({ k: kk, own: (1 - knnAccuracy(X, Y, X, Y, kk)) * 100, fresh: (1 - knnAccuracy(X, Y, TEST_X, TEST_Y, kk)) * 100 })),
    [],
  );
  const row = rows[(k - 1) / 2];
  const best = rows.reduce((a, b) => (b.fresh < a.fresh ? b : a));

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[1, 41]}
        yDomain={[0, 20]}
        xLabel="Neighbours asked (k)"
        yLabel="Mistakes (%)"
        aspect={0.5}
        xTicks={8}
        label={`Share of mistakes for each k. On new points it is lowest at k = ${best.k}, at ${best.fresh.toFixed(1)} percent.`}
      >
        <VRule at={k} stroke={COLORS.faint} dashed strokeWidth={1} />
        <Polyline points={rows.map((r) => ({ x: r.k, y: r.own }))} stroke={COLORS.ink} />
        <Polyline points={rows.map((r) => ({ x: r.k, y: r.fresh }))} stroke={COLORS.accent} strokeWidth={2.5} />
        <Dots points={[{ x: k, y: row.own }]} fill={COLORS.ink} r={4.5} />
        <Dots points={[{ x: k, y: row.fresh }]} fill={COLORS.accent} r={5.5} />
        <PlotLabel x={30} y={rows[15].fresh} dx={0} dy={-10} anchor="middle">
          new points
        </PlotLabel>
        <PlotLabel x={30} y={rows[15].own} dx={0} dy={16} anchor="middle">
          known points
        </PlotLabel>
      </Plot>

      <Legend
        items={[
          { label: 'Mistakes on the 60 known points', color: COLORS.ink, shape: 'line' },
          { label: 'Mistakes on 300 new points', color: COLORS.accent, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'k', value: String(k) },
          { label: 'Mistakes on known points', value: `${row.own.toFixed(1)}%` },
          { label: 'Mistakes on new points', value: `${row.fresh.toFixed(1)}%`, key: true },
        ]}
      />

      <ControlBar>
        <Slider label="Neighbours k" value={k} min={1} max={41} step={2} onChange={setK} />
      </ControlBar>
    </div>
  );
}
