import { useState } from 'react';
import { add, scale } from '@/lib/vectors';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { Arrow, COLORS, DragHandle, Plot, PlotLabel, type Point } from '../core/Plot';

const RANGE: [number, number] = [-6, 6];
const O: Point = { x: 0, y: 0 };
const fmt = (v: number[]) => `[${v.map((n) => n.toFixed(1)).join(', ')}]`;

/** Two draggable vectors, their sum drawn tip to tail, and a slider that stretches one of them. */
export default function VectorAdd() {
  const [a, setA] = useState<Point>({ x: 3, y: 1 });
  const [b, setB] = useState<Point>({ x: 1, y: 3 });
  const [c, setC] = useState(1);

  const scaled = scale([a.x, a.y], c);
  const sum = add(scaled, [b.x, b.y]);
  const scaledTip = { x: scaled[0], y: scaled[1] };
  const sumTip = { x: sum[0], y: sum[1] };

  return (
    <div className="space-y-3">
      <div className="mx-auto max-w-[460px]">
        <Plot
          xDomain={RANGE}
          yDomain={RANGE}
          aspect={1}
          maxHeight={460}
          xTicks={6}
          yTicks={6}
          label={`Vector a scaled by ${c.toFixed(1)} is ${fmt(scaled)}. Adding b, ${fmt([b.x, b.y])}, gives ${fmt(sum)}.`}
        >
          <Arrow from={scaledTip} to={sumTip} stroke={COLORS.cool} dashed opacity={0.7} />
          <Arrow from={O} to={sumTip} stroke={COLORS.accent} strokeWidth={3} />
          <Arrow from={O} to={scaledTip} stroke={COLORS.ink} />
          <Arrow from={O} to={b} stroke={COLORS.cool} />
          <PlotLabel x={scaledTip.x} y={scaledTip.y} dx={8} dy={-8}>{c === 1 ? 'a' : `${c.toFixed(1)} × a`}</PlotLabel>
          <PlotLabel x={b.x} y={b.y} dx={8} dy={-8}>
            b
          </PlotLabel>
          <PlotLabel x={sumTip.x} y={sumTip.y} dx={8} dy={14}>
            sum
          </PlotLabel>
          <DragHandle x={a.x} y={a.y} label="Tip of vector a" fill={COLORS.ink} onChange={setA} />
          <DragHandle x={b.x} y={b.y} label="Tip of vector b" fill={COLORS.cool} onChange={setB} />
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'a, stretched by the slider', color: COLORS.ink, shape: 'line' },
          { label: 'b', color: COLORS.cool, shape: 'line' },
          { label: 'b again, starting where a ends', color: COLORS.cool, shape: 'dash' },
          { label: 'the sum', color: COLORS.accent, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: `${c.toFixed(1)} × a`, value: fmt(scaled) },
          { label: 'b', value: fmt([b.x, b.y]) },
          { label: 'Sum, entry by entry', value: fmt(sum), key: true },
        ]}
      />

      <ControlBar>
        <Slider label="Stretch a by" value={c} min={-2} max={2} step={0.1} onChange={setC} format={(v) => v.toFixed(1)} />
        <span className="font-mono text-[10px] text-stone-500">Drag the two round handles.</span>
      </ControlBar>
    </div>
  );
}
