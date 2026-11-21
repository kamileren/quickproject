import { useMemo, useState } from 'react';
import { ControlBar, Legend, Readout } from '../core/Controls';
import { Arrow, COLORS, DragHandle, Plot, PlotLabel, Polyline, type Point } from '../core/Plot';

/** A bowl that is steeper in the y direction than in the x direction. */
const f = (x: number, y: number) => x * x + 3 * y * y;
const RANGE: [number, number] = [-4, 4];
const LEVELS = [1, 3, 6, 10, 16, 24, 34, 46];
const ARROW_SCALE = 0.12;

const ring = (level: number): Point[] =>
  Array.from({ length: 73 }, (_, i) => {
    const t = (2 * Math.PI * i) / 72;
    return { x: Math.sqrt(level) * Math.cos(t), y: Math.sqrt(level / 3) * Math.sin(t) };
  });

/**
 * A function of two inputs seen from above. At the draggable point, the two
 * partial derivatives combine into the gradient arrow, which points uphill.
 */
export default function GradientMap() {
  const [p, setP] = useState<Point>({ x: 2.4, y: 1.2 });
  const rings = useMemo(() => LEVELS.map(ring), []);

  const dx = 2 * p.x;
  const dy = 6 * p.y;
  const uphill = { x: p.x + ARROW_SCALE * dx, y: p.y + ARROW_SCALE * dy };
  const downhill = { x: p.x - ARROW_SCALE * dx, y: p.y - ARROW_SCALE * dy };

  return (
    <div className="space-y-3">
      <div className="mx-auto max-w-[460px]">
        <Plot
          xDomain={RANGE}
          yDomain={RANGE}
          xLabel="Input x"
          yLabel="Input y"
          aspect={1}
          maxHeight={460}
          label={`A bowl-shaped function seen from above. At (${p.x.toFixed(1)}, ${p.y.toFixed(1)}) it rises ${dx.toFixed(1)} per unit of x and ${dy.toFixed(1)} per unit of y.`}
        >
          {rings.map((r, i) => (
            <Polyline key={LEVELS[i]} points={r} stroke={COLORS.faint} strokeWidth={1} opacity={0.9 - i * 0.07} />
          ))}
          <PlotLabel x={0} y={0} dx={0} dy={4} anchor="middle" fill={COLORS.muted}>
            lowest
          </PlotLabel>
          <Arrow from={p} to={uphill} stroke={COLORS.ink} />
          <Arrow from={p} to={downhill} stroke={COLORS.accent} />
          <DragHandle x={p.x} y={p.y} label="The point where the gradient is measured" onChange={setP} />
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'Gradient: steepest way up', color: COLORS.ink, shape: 'line' },
          { label: 'Minus the gradient: steepest way down', color: COLORS.accent, shape: 'line' },
          { label: 'Rings of equal height', color: COLORS.faint, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Height here', value: f(p.x, p.y).toFixed(1) },
          { label: 'Slope in the x direction', value: dx.toFixed(1) },
          { label: 'Slope in the y direction', value: dy.toFixed(1) },
          { label: 'Gradient', value: `[${dx.toFixed(1)}, ${dy.toFixed(1)}]`, key: true },
        ]}
      />

      <ControlBar>
        <span className="font-mono text-[10px] text-stone-500">Drag the orange point around the bowl. The arrows are drawn shorter than the true gradient so they fit.</span>
      </ControlBar>
    </div>
  );
}
