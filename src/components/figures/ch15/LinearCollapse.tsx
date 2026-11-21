import { useState } from 'react';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, FnLine, Plot } from '../core/Plot';

const X: [number, number] = [-5, 5];
const Y: [number, number] = [-10, 10];

/**
 * Two neurons in a row with nothing between them. Whatever the four numbers
 * are, the result is a straight line, identical to what one neuron could do.
 */
export default function LinearCollapse() {
  const [w1, setW1] = useState(1.5);
  const [b1, setB1] = useState(1);
  const [w2, setW2] = useState(-0.8);
  const [b2, setB2] = useState(2);

  const hidden = (x: number) => w1 * x + b1;
  const output = (x: number) => w2 * hidden(x) + b2;
  // The single neuron that does the same job.
  const w = w2 * w1;
  const b = w2 * b1 + b2;
  const f = (v: number) => (Object.is(+v.toFixed(2), -0) ? '0.00' : v.toFixed(2));

  return (
    <div className="space-y-3">
      <Plot xDomain={X} yDomain={Y} xLabel="Input x" yLabel="Output" aspect={0.5} label={`Output of two stacked neurons against the input. It is the straight line ${f(w)} times x plus ${f(b)}.`}>
        <FnLine f={hidden} stroke={COLORS.faint} dashed strokeWidth={1.5} />
        <FnLine f={output} strokeWidth={2.5} />
      </Plot>

      <Legend
        items={[
          { label: 'After the first neuron', color: COLORS.faint, shape: 'dash' },
          { label: 'After the second neuron', color: COLORS.accent, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Two neurons', value: `${f(w2)} × (${f(w1)}·x + ${f(b1)}) + ${f(b2)}` },
          { label: 'Same thing as one neuron', value: `${f(w)}·x + ${f(b)}`, key: true },
        ]}
      />

      <ControlBar>
        <Slider label="First weight" value={w1} min={-3} max={3} step={0.1} onChange={setW1} format={(v) => v.toFixed(1)} />
        <Slider label="First bias" value={b1} min={-4} max={4} step={0.1} onChange={setB1} format={(v) => v.toFixed(1)} />
      </ControlBar>
      <ControlBar>
        <Slider label="Second weight" value={w2} min={-3} max={3} step={0.1} onChange={setW2} format={(v) => v.toFixed(1)} />
        <Slider label="Second bias" value={b2} min={-4} max={4} step={0.1} onChange={setB2} format={(v) => v.toFixed(1)} />
      </ControlBar>
    </div>
  );
}
