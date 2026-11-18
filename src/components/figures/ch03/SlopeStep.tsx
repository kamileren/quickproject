import { useState } from 'react';
import { lineGradient } from '@/lib/optimize';
import { ControlBar, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, DragHandle, FnLine, Plot, PlotLabel } from '../core/Plot';
import { BEST, loss, POINTS } from './shared';

const W_DOMAIN: [number, number] = [-1, 12];
const L_DOMAIN: [number, number] = [0, 280];
const START_W = 1;

/**
 * The loss as a curve over a single parameter, the slope w (the bias is held
 * at its best value). The reader moves along the curve, sees the tangent, and
 * takes steps of w ← w − η · slope.
 */
export default function SlopeStep() {
  const [w, setW] = useState(START_W);
  const [eta, setEta] = useState(0.02);
  const [steps, setSteps] = useState(0);

  const at = (weight: number) => loss({ w: weight, b: BEST.b });
  const slope = lineGradient(POINTS, { w, b: BEST.b }).w;
  const height = at(w);
  const flat = Math.abs(slope) < 0.05;
  const direction = flat ? 'stay here' : slope > 0 ? 'move left (w down)' : 'move right (w up)';

  return (
    <div className="space-y-3">
      <Plot
        xDomain={W_DOMAIN}
        yDomain={L_DOMAIN}
        xLabel="Slope w"
        yLabel="Error (MSE)"
        aspect={0.5}
        label={`The error as a bowl-shaped curve over the slope w. At w = ${w.toFixed(2)} the curve has slope ${slope.toFixed(1)}.`}
      >
        <FnLine f={at} stroke={COLORS.ink} strokeWidth={2} />
        {/* Tangent at the current point. */}
        <FnLine f={(x) => height + slope * (x - w)} stroke={COLORS.accent} strokeWidth={1.5} dashed />
        <Dots points={[{ x: BEST.w, y: at(BEST.w) }]} hollow fill={COLORS.ink} r={4} />
        <PlotLabel x={BEST.w} y={at(BEST.w)} dx={0} dy={-10} anchor="middle">
          lowest point
        </PlotLabel>
        <DragHandle
          x={w}
          y={height}
          label="Current value of w on the error curve"
          constrain={(p) => ({ x: p.x, y: at(p.x) })}
          onChange={(p) => {
            setW(p.x);
            setSteps(0);
          }}
        />
      </Plot>

      <Readout
        items={[
          { label: 'Slope w', value: w.toFixed(2) },
          { label: 'Steepness of the curve', value: slope.toFixed(1), key: true },
          { label: 'So to go downhill', value: direction },
          { label: 'Error', value: height.toFixed(1) },
        ]}
      />

      <ControlBar>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => {
              setW((cur) => Math.max(W_DOMAIN[0], Math.min(W_DOMAIN[1], cur - eta * lineGradient(POINTS, { w: cur, b: BEST.b }).w)));
              setSteps((s) => s + 1);
            }}
          >
            Take a step{steps > 0 ? ` (${steps})` : ''}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              setW(START_W);
              setSteps(0);
            }}
          >
            Reset
          </button>
        </div>
        <Slider label="Step size η" ariaLabel="Step size eta" value={eta} min={0.005} max={0.17} step={0.005} onChange={setEta} format={(v) => v.toFixed(3)} />
      </ControlBar>
    </div>
  );
}
