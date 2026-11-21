import { useState } from 'react';
import { ControlBar, Legend, Readout, Segmented, Slider } from '../core/Controls';
import { COLORS, Dots, FnLine, Plot } from '../core/Plot';

type Kind = 'relu' | 'sigmoid' | 'tanh' | 'step';

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const FUNCTIONS: Record<Kind, { name: string; f: (x: number) => number; slope: (x: number) => number; note: string }> = {
  relu: { name: 'ReLU', f: (x) => Math.max(0, x), slope: (x) => (x > 0 ? 1 : 0), note: 'The default for hidden layers.' },
  sigmoid: { name: 'Sigmoid', f: sigmoid, slope: (x) => sigmoid(x) * (1 - sigmoid(x)), note: 'Squashes to 0–1. Used for yes/no outputs.' },
  tanh: { name: 'Tanh', f: Math.tanh, slope: (x) => 1 - Math.tanh(x) ** 2, note: 'Squashes to −1–1, centred on zero.' },
  step: { name: 'Step', f: (x) => (x > 0 ? 1 : 0), slope: () => 0, note: 'On or off. Its slope is zero, so it cannot be trained by gradients.' },
};
const OPTIONS = (Object.keys(FUNCTIONS) as Kind[]).map((value) => ({ value, label: FUNCTIONS[value].name }));

/** The common activation functions side by side, each with its slope. */
export default function ActivationGallery() {
  const [kind, setKind] = useState<Kind>('relu');
  const [x, setX] = useState(1.5);
  const { f, slope, note, name } = FUNCTIONS[kind];

  return (
    <div className="space-y-3">
      <Plot xDomain={[-5, 5]} yDomain={[-1.5, 3]} xLabel="Input to the activation" yLabel="Output" aspect={0.5} label={`The ${name} activation function and its slope. At an input of ${x.toFixed(1)} it outputs ${f(x).toFixed(2)}.`}>
        <FnLine f={slope} stroke={COLORS.cool} dashed strokeWidth={1.5} samples={400} />
        <FnLine f={f} strokeWidth={2.5} samples={400} />
        <Dots points={[{ x, y: f(x) }]} fill={COLORS.ink} r={5.5} />
      </Plot>

      <Legend
        items={[
          { label: 'The function', color: COLORS.accent, shape: 'line' },
          { label: 'Its slope', color: COLORS.cool, shape: 'dash' },
        ]}
      />

      <Readout
        items={[
          { label: 'Input', value: x.toFixed(1) },
          { label: 'Output', value: f(x).toFixed(3), key: true },
          { label: 'Slope here', value: slope(x).toFixed(3) },
          { label: 'Note', value: note },
        ]}
      />

      <ControlBar>
        <Segmented label="Activation function" options={OPTIONS} value={kind} onChange={setKind} />
      </ControlBar>
      <ControlBar>
        <Slider label="Input" value={x} min={-5} max={5} step={0.1} onChange={setX} format={(v) => v.toFixed(1)} />
      </ControlBar>
    </div>
  );
}
