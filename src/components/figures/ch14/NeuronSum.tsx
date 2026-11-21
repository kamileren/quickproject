import { useState } from 'react';
import { dot } from '@/lib/vectors';
import { ControlBar, Readout, Slider } from '../core/Controls';

const INPUTS = [
  { name: 'Hours studied', value: 4 },
  { name: 'Hours slept', value: 7 },
  { name: 'Last test score', value: 60 },
];
const X = INPUTS.map((i) => i.value);
const START = { weights: [5, 2, 0.5], bias: 10 };
const BAR_SCALE = 60; // contribution that fills the bar

const th = 'border-0 px-2 pb-2 text-left font-mono text-[10px] tracking-widest text-stone-500 uppercase';
const td = 'border-0 border-t border-stone-200 px-2 py-2 font-mono text-sm tabular-nums text-stone-900';

/** A static sketch of one neuron: inputs on the left, a sum in the middle, one output on the right. */
function Sketch() {
  const ys = [28, 78, 128];
  return (
    <svg viewBox="0 0 400 156" className="mx-auto block w-full max-w-[400px]" role="img" aria-label="Three inputs, each multiplied by a weight, flow into one neuron that adds them up with a bias and produces a single output.">
      {ys.map((y, i) => (
        <g key={y}>
          <line x1="58" y1={y} x2="196" y2="78" stroke="#a8a29e" strokeWidth="1.5" />
          <circle cx="40" cy={y} r="18" fill="#fff" stroke="#1c1917" strokeWidth="1.5" />
          <text x="40" y={y + 5} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="15" fill="#1c1917">
            x{'₁₂₃'[i]}
          </text>
          <text x="118" y={y + (i === 0 ? 8 : i === 1 ? -6 : -2)} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="#c2410c">
            × w{'₁₂₃'[i]}
          </text>
        </g>
      ))}
      <line x1="252" y1="78" x2="336" y2="78" stroke="#1c1917" strokeWidth="1.5" />
      <polygon points="346,78 334,72 334,84" fill="#1c1917" />
      <circle cx="224" cy="78" r="30" fill="#1c1917" />
      <text x="224" y="74" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700" fill="#fff">
        add up
      </text>
      <text x="224" y="90" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="#fdba74">
        + b
      </text>
      <text x="372" y="83" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700" fill="#1c1917">
        output
      </text>
    </svg>
  );
}

/**
 * One neuron with three fixed inputs. The reader sets the weights and the
 * bias and watches each input's contribution, and the total, respond.
 */
export default function NeuronSum() {
  const [weights, setWeights] = useState(START.weights);
  const [bias, setBias] = useState(START.bias);
  const output = dot(X, weights) + bias;
  const setWeight = (i: number) => (v: number) => setWeights((w) => w.map((old, j) => (j === i ? v : old)));

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 sm:p-4">
        <Sketch />
        <div className="overflow-x-auto">
          <table className="m-0 mt-2 table w-full border-collapse whitespace-normal" aria-label="Each input times its weight, and the total">
            <thead>
              <tr>
                <th className={th}>Input</th>
                <th className={`${th} text-right`}>Value</th>
                <th className={`${th} text-right`}>× Weight</th>
                <th className={`${th} text-right`}>= Adds</th>
                <th className={`${th} hidden w-1/3 sm:table-cell`} />
              </tr>
            </thead>
            <tbody>
              {INPUTS.map((input, i) => {
                const part = input.value * weights[i];
                return (
                  <tr key={input.name}>
                    <td className={`${td} font-sans text-[13px]`}>{input.name}</td>
                    <td className={`${td} text-right`}>{input.value}</td>
                    <td className={`${td} text-right text-orange-700`}>{weights[i].toFixed(i === 2 ? 2 : 1)}</td>
                    <td className={`${td} text-right font-bold`}>{part.toFixed(1)}</td>
                    <td className={`${td} hidden sm:table-cell`}>
                      <div className="h-2 rounded-sm bg-stone-900" style={{ width: `${Math.min(100, (Math.abs(part) / BAR_SCALE) * 100)}%` }} />
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td className={`${td} font-sans text-[13px]`}>Bias</td>
                <td className={td} />
                <td className={td} />
                <td className={`${td} text-right font-bold`}>{bias.toFixed(1)}</td>
                <td className={`${td} hidden sm:table-cell`}>
                  <div className="h-2 rounded-sm bg-stone-400" style={{ width: `${Math.min(100, (Math.abs(bias) / BAR_SCALE) * 100)}%` }} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <Readout
        items={[
          { label: 'Sum of the three products', value: (output - bias).toFixed(1) },
          { label: 'Plus the bias', value: bias.toFixed(1) },
          { label: 'Output of the neuron', value: output.toFixed(1), key: true },
        ]}
      />

      <ControlBar>
        <Slider label="Weight on study" value={weights[0]} min={-4} max={8} step={0.5} onChange={setWeight(0)} format={(v) => v.toFixed(1)} />
        <Slider label="Weight on sleep" value={weights[1]} min={-4} max={8} step={0.5} onChange={setWeight(1)} format={(v) => v.toFixed(1)} />
      </ControlBar>
      <ControlBar>
        <Slider label="Weight on last score" value={weights[2]} min={-1} max={1} step={0.05} onChange={setWeight(2)} format={(v) => v.toFixed(2)} />
        <Slider label="Bias" value={bias} min={-30} max={30} step={1} onChange={setBias} />
      </ControlBar>
    </div>
  );
}
