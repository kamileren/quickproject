import { useState } from 'react';
import { matVec } from '@/lib/vectors';
import { ControlBar, Readout, Slider } from '../core/Controls';

/** Three neurons that all look at the same three inputs, each with its own weights and bias. */
const NEURONS = [
  { name: 'Neuron 1', weights: [5, 2, 0.5], bias: 10 },
  { name: 'Neuron 2', weights: [1, 6, 0], bias: -20 },
  { name: 'Neuron 3', weights: [-2, 0, 1], bias: 0 },
];
const W = NEURONS.map((n) => n.weights);
const BAR_SCALE = 120;

const th = 'border-0 px-2 pb-2 text-right font-mono text-[10px] tracking-widest text-stone-500 uppercase';
const td = 'border-0 border-t border-stone-200 px-2 py-2 text-right font-mono text-sm tabular-nums text-stone-900';

/**
 * A layer of three neurons. Changing the inputs changes all three outputs at
 * once, because each neuron takes its own dot product with the same inputs.
 */
export default function LayerOutputs() {
  const [inputs, setInputs] = useState([4, 7, 60]);
  const sums = matVec(W, inputs);
  const outputs = sums.map((s, i) => s + NEURONS[i].bias);
  const set = (i: number) => (v: number) => setInputs((x) => x.map((old, j) => (j === i ? v : old)));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-3 sm:p-4">
        <table className="m-0 table w-full border-collapse whitespace-normal" aria-label="Weights, bias and output of each neuron in the layer">
          <thead>
            <tr>
              <th className={`${th} text-left`} />
              <th className={th}>w on study</th>
              <th className={th}>w on sleep</th>
              <th className={th}>w on score</th>
              <th className={th}>bias</th>
              <th className={th}>output</th>
              <th className={`${th} hidden w-1/4 sm:table-cell`} />
            </tr>
          </thead>
          <tbody>
            {NEURONS.map((n, i) => (
              <tr key={n.name}>
                <td className={`${td} text-left font-sans text-[13px] font-bold`}>{n.name}</td>
                {n.weights.map((w, j) => (
                  <td key={j} className={`${td} text-orange-700`}>
                    {w}
                  </td>
                ))}
                <td className={td}>{n.bias}</td>
                <td className={`${td} font-bold`}>{outputs[i].toFixed(1)}</td>
                <td className={`${td} hidden sm:table-cell`}>
                  <div
                    className={`h-2 rounded-sm ${outputs[i] >= 0 ? 'bg-stone-900' : 'bg-stone-400'}`}
                    style={{ width: `${Math.min(100, (Math.abs(outputs[i]) / BAR_SCALE) * 100)}%` }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Readout
        items={[
          { label: 'Inputs (one student)', value: `[${inputs.join(', ')}]` },
          { label: 'Outputs (one per neuron)', value: `[${outputs.map((o) => o.toFixed(1)).join(', ')}]`, key: true },
          { label: 'Shapes', value: '3 inputs → 3 outputs' },
        ]}
      />

      <ControlBar>
        <Slider label="Hours studied" value={inputs[0]} min={0} max={10} step={0.5} onChange={set(0)} format={(v) => v.toFixed(1)} />
        <Slider label="Hours slept" value={inputs[1]} min={3} max={10} step={0.5} onChange={set(1)} format={(v) => v.toFixed(1)} />
      </ControlBar>
      <ControlBar>
        <Slider label="Last test score" value={inputs[2]} min={0} max={100} step={5} onChange={set(2)} />
      </ControlBar>
    </div>
  );
}
