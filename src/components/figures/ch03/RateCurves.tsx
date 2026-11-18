import { useMemo, useState } from 'react';
import { descend, maxStableLearningRate } from '@/lib/optimize';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Plot, PlotLabel, Polyline, type Point } from '../core/Plot';
import { BEST_LOSS, formatLoss, loss, POINTS, START } from './shared';

const STEPS = 40;
const Y_MAX = 700;
const LIMIT = maxStableLearningRate(POINTS);

/** Error after each step, capped so a diverging run leaves the top of the plot. */
const curve = (eta: number): Point[] =>
  descend(POINTS, START, eta, STEPS).map((line, step) => ({ x: step, y: Math.min(loss(line), Y_MAX * 3) }));

/**
 * Error against step number for a learning rate the reader chooses, with a
 * too-small and a well-chosen rate drawn for comparison.
 */
export default function RateCurves() {
  const [eta, setEta] = useState(0.05);
  const slow = useMemo(() => curve(0.005), []);
  const good = useMemo(() => curve(0.08), []);
  const yours = useMemo(() => curve(eta), [eta]);
  const final = loss(descend(POINTS, START, eta, STEPS).at(-1)!);

  const verdict =
    eta > LIMIT ? 'Diverges' : final < BEST_LOSS + 0.5 ? 'Reaches the bottom' : final < BEST_LOSS + 15 ? 'Nearly there' : 'Too slow';

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[0, STEPS]}
        yDomain={[0, Y_MAX]}
        xLabel="Step"
        yLabel="Error (MSE)"
        aspect={0.5}
        label={`Error over ${STEPS} steps of gradient descent for three learning rates. With your rate of ${eta.toFixed(3)} the run ${verdict.toLowerCase()}.`}
      >
        <Polyline points={slow} stroke={COLORS.teal} />
        <Polyline points={good} stroke={COLORS.cool} />
        <Polyline points={yours} stroke={COLORS.accent} strokeWidth={2.5} />
        <PlotLabel x={STEPS} y={slow[STEPS].y} anchor="end" dx={-4} dy={-7}>
          η = 0.005
        </PlotLabel>
        <PlotLabel x={12} y={good[12].y} dx={4} dy={-7}>
          η = 0.08
        </PlotLabel>
      </Plot>

      <Legend
        items={[
          { label: 'Your learning rate', color: COLORS.accent, shape: 'line' },
          { label: 'Small (0.005)', color: COLORS.teal, shape: 'line' },
          { label: 'Well chosen (0.08)', color: COLORS.cool, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Your η', value: eta.toFixed(3) },
          { label: `Error after ${STEPS} steps`, value: formatLoss(final), key: true },
          { label: 'Verdict', value: verdict },
          { label: 'Breaks above', value: LIMIT.toFixed(3) },
        ]}
      />

      <ControlBar>
        <Slider
          label="Learning rate η"
          ariaLabel="Learning rate eta"
          value={eta}
          min={0.005}
          max={0.2}
          step={0.005}
          onChange={setEta}
          format={(v) => v.toFixed(3)}
        />
      </ControlBar>
    </div>
  );
}
