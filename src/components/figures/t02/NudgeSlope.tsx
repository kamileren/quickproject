import { useState } from 'react';
import { secantSlope } from '@/lib/calculus';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, DragHandle, FnLine, Plot, Segments } from '../core/Plot';

const f = (x: number) => x * x;
const X: [number, number] = [-3, 3];
const Y: [number, number] = [-1.5, 9.5];
const formatNudge = (h: number) => (h >= 0.1 ? h.toFixed(2) : h.toFixed(3));

/**
 * The slope of a curve at a point, found by nudging. A line is drawn through
 * the point and a second point a little further along; as the nudge shrinks,
 * the line settles onto the tangent.
 */
export default function NudgeSlope() {
  const [x, setX] = useState(1);
  const [exponent, setExponent] = useState(0.3);
  const h = 10 ** exponent;
  const slope = secantSlope(f, x, h);
  const rise = f(x + h) - f(x);

  return (
    <div className="space-y-3">
      <Plot
        xDomain={X}
        yDomain={Y}
        xLabel="Input x"
        yLabel="Output x²"
        aspect={0.6}
        label={`The curve y equals x squared. A line through the points at x = ${x.toFixed(2)} and x = ${(x + h).toFixed(2)} has slope ${slope.toFixed(2)}.`}
      >
        <FnLine f={f} stroke={COLORS.ink} />
        <FnLine f={(t) => f(x) + slope * (t - x)} stroke={COLORS.accent} strokeWidth={1.5} />
        <Segments
          stroke={COLORS.cool}
          segments={[
            { from: { x, y: f(x) }, to: { x: x + h, y: f(x) } },
            { from: { x: x + h, y: f(x) }, to: { x: x + h, y: f(x + h) } },
          ]}
        />
        <Dots points={[{ x: x + h, y: f(x + h) }]} fill={COLORS.cool} r={5} />
        <DragHandle x={x} y={f(x)} label="The point where the slope is measured" constrain={(p) => ({ x: Math.max(-2.5, Math.min(2.5, p.x)), y: f(Math.max(-2.5, Math.min(2.5, p.x))) })} onChange={(p) => setX(p.x)} />
      </Plot>

      <Legend
        items={[
          { label: 'The curve', color: COLORS.ink, shape: 'line' },
          { label: 'Line through the two points', color: COLORS.accent, shape: 'line' },
          { label: 'Run across, rise up', color: COLORS.cool, shape: 'dash' },
        ]}
      />

      <Readout
        items={[
          { label: 'Nudge (run)', value: formatNudge(h) },
          { label: 'Change in output (rise)', value: rise.toFixed(3) },
          { label: 'Rise ÷ run', value: slope.toFixed(3), key: true },
          { label: 'Settles toward', value: (2 * x).toFixed(2) },
        ]}
      />

      <ControlBar>
        <Slider label="Size of the nudge" value={exponent} min={-2} max={0.3} step={0.05} onChange={setExponent} format={(e) => formatNudge(10 ** e)} />
        <span className="font-mono text-[10px] text-stone-500">Drag the orange point along the curve.</span>
      </ControlBar>
    </div>
  );
}
