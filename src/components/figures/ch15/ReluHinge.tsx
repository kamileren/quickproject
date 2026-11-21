import { useState } from 'react';
import { relu } from '@/lib/hinges';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, FnLine, Plot, PlotLabel } from '../core/Plot';

const X: [number, number] = [-5, 5];
const Y: [number, number] = [-6, 6];

/**
 * One hidden neuron with a ReLU, feeding one output weight. The result is a
 * hinge: flat on one side of a kink and sloped on the other. The three
 * numbers move the kink, set the slope, and flip the hinge.
 */
export default function ReluHinge() {
  const [w, setW] = useState(1);
  const [b, setB] = useState(1);
  const [v, setV] = useState(1);

  const out = (x: number) => v * relu(w * x + b);
  const kink = w === 0 ? null : -b / w;
  const slopeAfter = v * w;

  return (
    <div className="space-y-3">
      <Plot
        xDomain={X}
        yDomain={Y}
        xLabel="Input x"
        yLabel="Output"
        aspect={0.5}
        label={kink === null ? 'With a weight of zero the output is flat.' : `A hinge with its kink at x = ${kink.toFixed(2)}.`}
      >
        <FnLine f={(x) => w * x + b} stroke={COLORS.faint} dashed strokeWidth={1.5} />
        <FnLine f={out} strokeWidth={2.5} samples={400} />
        {kink !== null && kink > X[0] && kink < X[1] && (
          <>
            <Dots points={[{ x: kink, y: 0 }]} fill={COLORS.ink} r={5} />
            <PlotLabel x={kink} y={0} dx={0} dy={18} anchor="middle">
              kink
            </PlotLabel>
          </>
        )}
      </Plot>

      <Legend
        items={[
          { label: 'Before the ReLU: w·x + b', color: COLORS.faint, shape: 'dash' },
          { label: 'After the ReLU, times the output weight', color: COLORS.accent, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Kink at x = −b / w', value: kink === null ? 'none' : kink.toFixed(2), key: true },
          { label: 'Flat side', value: w === 0 ? 'everywhere' : w > 0 ? 'left of the kink' : 'right of the kink' },
          { label: 'Slope on the other side', value: Math.abs(slopeAfter).toFixed(2) + (v < 0 ? ', pointing down' : '') },
        ]}
      />

      <ControlBar>
        <Slider label="Weight w" value={w} min={-3} max={3} step={0.1} onChange={setW} format={(x) => x.toFixed(1)} />
        <Slider label="Bias b" value={b} min={-4} max={4} step={0.1} onChange={setB} format={(x) => x.toFixed(1)} />
      </ControlBar>
      <ControlBar>
        <Slider label="Output weight" value={v} min={-3} max={3} step={0.1} onChange={setV} format={(x) => x.toFixed(1)} />
      </ControlBar>
    </div>
  );
}
