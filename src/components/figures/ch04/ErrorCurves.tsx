import { useMemo, useState } from 'react';
import { sleepTest, sleepTrain } from '@/data/sleep-scores';
import { pointsMse } from '@/lib/poly';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, Plot, PlotLabel, Polyline, VRule } from '../core/Plot';
import { fitSleep, formatError, MAX_DEGREE } from './shared';

const Y_MAX = 120;

/** Training error and new-data error for every degree, side by side. */
export default function ErrorCurves() {
  const [degree, setDegree] = useState(2);

  const rows = useMemo(
    () =>
      Array.from({ length: MAX_DEGREE }, (_, i) => {
        const model = fitSleep(sleepTrain, i + 1);
        return { degree: i + 1, train: pointsMse(sleepTrain, model.predict), test: pointsMse(sleepTest, model.predict) };
      }),
    [],
  );
  const best = rows.reduce((a, b) => (b.test < a.test ? b : a));
  const row = rows[degree - 1];
  const verdict =
    degree < best.degree ? 'Too simple (underfitting)' : row.test <= best.test * 1.15 ? 'About right' : 'Too flexible (overfitting)';

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[1, MAX_DEGREE]}
        yDomain={[0, Y_MAX]}
        xLabel="Flexibility (degree)"
        yLabel="Error (MSE)"
        aspect={0.5}
        xTicks={9}
        label="Training error falls steadily as the degree rises, while error on new students falls, then rises steeply."
      >
        <VRule at={degree} stroke={COLORS.faint} dashed strokeWidth={1} />
        <Polyline points={rows.map((r) => ({ x: r.degree, y: r.train }))} stroke={COLORS.ink} />
        <Polyline points={rows.map((r) => ({ x: r.degree, y: r.test }))} stroke={COLORS.accent} strokeWidth={2.5} />
        <Dots points={[{ x: degree, y: row.train }]} fill={COLORS.ink} r={4.5} />
        <Dots points={[{ x: degree, y: Math.min(row.test, Y_MAX) }]} fill={COLORS.accent} r={5.5} />
        <PlotLabel x={5} y={rows[4].test} dx={0} dy={-10} anchor="middle">
          new students
        </PlotLabel>
        <PlotLabel x={5} y={rows[4].train} dx={0} dy={16} anchor="middle">
          fitted students
        </PlotLabel>
      </Plot>

      <Legend
        items={[
          { label: 'Error on fitted students', color: COLORS.ink, shape: 'line' },
          { label: 'Error on new students', color: COLORS.accent, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Degree', value: String(degree) },
          { label: 'Fitted students', value: formatError(row.train) },
          { label: 'New students', value: formatError(row.test), key: true },
          { label: 'Verdict', value: verdict },
        ]}
      />

      <ControlBar>
        <Slider label="Flexibility (degree)" value={degree} min={1} max={MAX_DEGREE} step={1} onChange={setDegree} />
      </ControlBar>
    </div>
  );
}
