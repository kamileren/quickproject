import { useMemo, useState } from 'react';
import { outcomes } from '@/data/pass-fail';
import { predictProba } from '@/lib/classify';
import { fitLine, predict } from '@/lib/linear';
import { ControlBar, Legend, Readout, Segmented } from '../core/Controls';
import { COLORS, Dots, FnLine, HRule, Plot, PlotLabel } from '../core/Plot';
import { BEST, dotTitle, FAILED, HOURS, PASSED, PROB } from './shared';

type Shape = 'line' | 'curve';
const OPTIONS: { value: Shape; label: string }[] = [
  { value: 'line', label: 'Straight line' },
  { value: 'curve', label: 'S-shaped curve' },
];

/** Pass (1) or fail (0) against hours, fitted first with a straight line, then with an S-curve. */
export default function LineVsCurve() {
  const [shape, setShape] = useState<Shape>('line');
  const line = useMemo(() => fitLine(outcomes.map((o) => ({ x: o.hours, y: o.passed }))), []);
  const f = (x: number) => (shape === 'line' ? predict(line, x) : predictProba(BEST.weights, [x]));
  const show = (v: number) => `${(v * 100).toFixed(0)}%`;

  return (
    <div className="space-y-3">
      <Plot
        xDomain={HOURS}
        yDomain={PROB}
        xLabel="Hours studied"
        yLabel="Chance of passing"
        yTicks={6}
        tickFormat={(v) => String(+v.toFixed(2))}
        label={`Eighteen students plotted at 1 if they passed and 0 if they failed, with a fitted ${shape === 'line' ? 'straight line' : 'S-shaped curve'}.`}
      >
        <HRule at={0} stroke={COLORS.axis} strokeWidth={1} />
        <HRule at={1} stroke={COLORS.axis} strokeWidth={1} />
        <PlotLabel x={HOURS[0]} y={1} dx={6} dy={-6} fill={COLORS.muted}>
          passed = 1
        </PlotLabel>
        <PlotLabel x={HOURS[1]} y={0} dx={-6} dy={14} anchor="end" fill={COLORS.muted}>
          failed = 0
        </PlotLabel>
        <FnLine f={f} />
        <Dots points={PASSED} title={dotTitle(true)} />
        <Dots points={FAILED} hollow title={dotTitle(false)} />
      </Plot>

      <Legend
        items={[
          { label: 'Passed (filled)', color: COLORS.ink, shape: 'dot' },
          { label: 'Failed (hollow)', color: COLORS.faint, shape: 'dot' },
          { label: shape === 'line' ? 'Straight-line fit' : 'S-curve fit', color: COLORS.accent, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Prediction at 0 hours', value: show(f(0)), key: shape === 'line' },
          { label: 'Prediction at 4.5 hours', value: show(f(4.5)) },
          { label: 'Prediction at 9 hours', value: show(f(9)), key: shape === 'line' },
        ]}
      />

      <ControlBar>
        <Segmented label="Shape of the model" options={OPTIONS} value={shape} onChange={setShape} />
      </ControlBar>
    </div>
  );
}
