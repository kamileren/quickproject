import { useState } from 'react';
import { angleBetween, dot, project } from '@/lib/vectors';
import { ControlBar, Legend, Readout } from '../core/Controls';
import { Arrow, COLORS, DragHandle, Plot, PlotLabel, Segments, type Point } from '../core/Plot';

const RANGE: [number, number] = [-6, 6];
const O: Point = { x: 0, y: 0 };
const n = (v: number) => (Object.is(+v.toFixed(1), -0) ? '0.0' : v.toFixed(1));

/** Two draggable vectors with their dot product, the angle between them, and the shadow one casts on the other. */
export default function DotProduct() {
  const [a, setA] = useState<Point>({ x: 4, y: 2 });
  const [b, setB] = useState<Point>({ x: 2, y: 4 });

  const va = [a.x, a.y];
  const vb = [b.x, b.y];
  const product = dot(va, vb);
  const angle = angleBetween(va, vb);
  const shadow = project(vb, va);
  const shadowTip = { x: shadow[0], y: shadow[1] };
  const reading = Math.abs(product) < 0.3 ? 'at right angles: unrelated' : product > 0 ? 'pointing the same way' : 'pointing opposite ways';

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
          label={`Vectors a and b with a dot product of ${n(product)} and ${angle.toFixed(0)} degrees between them.`}
        >
          <Segments segments={[{ from: b, to: shadowTip }]} stroke={COLORS.faint} />
          <Arrow from={O} to={shadowTip} stroke={COLORS.accent} strokeWidth={5} opacity={0.45} />
          <Arrow from={O} to={a} stroke={COLORS.ink} />
          <Arrow from={O} to={b} stroke={COLORS.cool} />
          <PlotLabel x={a.x} y={a.y} dx={8} dy={-8}>
            a
          </PlotLabel>
          <PlotLabel x={b.x} y={b.y} dx={8} dy={-8}>
            b
          </PlotLabel>
          <DragHandle x={a.x} y={a.y} label="Tip of vector a" fill={COLORS.ink} onChange={setA} />
          <DragHandle x={b.x} y={b.y} label="Tip of vector b" fill={COLORS.cool} onChange={setB} />
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'a', color: COLORS.ink, shape: 'line' },
          { label: 'b', color: COLORS.cool, shape: 'line' },
          { label: 'shadow of b on a', color: COLORS.accent, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'a₁b₁ + a₂b₂', value: `${n(a.x)}×${n(b.x)} + ${n(a.y)}×${n(b.y)}` },
          { label: 'Dot product', value: n(product), key: true },
          { label: 'Angle between them', value: `${angle.toFixed(0)}°` },
          { label: 'Meaning', value: reading },
        ]}
      />

      <ControlBar>
        <span className="font-mono text-[10px] text-stone-500">Drag the two round handles. Try to make the dot product exactly zero, then negative.</span>
      </ControlBar>
    </div>
  );
}
