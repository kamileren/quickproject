import { useMemo, useState } from 'react';
import { Dense, lossFor, Network, ReLU, type Task } from '@/lib/nn';
import { mulberry32 } from '@/lib/random';
import { ControlBar, Readout, Slider } from '../core/Controls';

/** A fixed tiny problem: four examples, two features, three classes. */
const X = [
  [0.5, -1.2],
  [1.5, 0.3],
  [-0.7, 0.8],
  [0.1, 0.1],
];
const TASK: Task = { kind: 'classes', labels: [0, 2, 1, 0] };

function build(): Network {
  const rand = mulberry32(3);
  return new Network([new Dense(2, 3, rand), new ReLU(), new Dense(3, 3, rand)]);
}

interface Slot {
  group: string;
  label: string;
  param: number;
  i: number;
  j: number;
}

/** Every learnable number in the network, with a readable name. */
function slots(net: Network): Slot[] {
  const names = ['Layer 1 weights', 'Layer 1 biases', 'Layer 2 weights', 'Layer 2 biases'];
  return net.params().flatMap((p, k) =>
    p.values.flatMap((row, i) =>
      row.map((_, j) => ({ group: names[k], label: k % 2 === 0 ? `w${i + 1}${j + 1}` : `b${j + 1}`, param: k, i, j })),
    ),
  );
}

/**
 * Backpropagation checked against brute force. For any weight the reader
 * picks, the gradient from one backward pass is compared with the slope found
 * by nudging that weight and re-running the network.
 */
export default function GradCheck() {
  const [picked, setPicked] = useState(0);
  const [exponent, setExponent] = useState(-3);
  const h = 10 ** exponent;

  const { all, analytic, baseLoss } = useMemo(() => {
    const net = build();
    const { loss, gradient } = lossFor(net.forward(X), TASK);
    net.backward(gradient);
    return { all: slots(net), analytic: net.params().map((p) => p.grads.map((r) => r.slice())), baseLoss: loss };
  }, []);

  const slot = all[picked];
  const nudged = useMemo(() => {
    const net = build();
    const values = net.params()[slot.param].values;
    const keep = values[slot.i][slot.j];
    values[slot.i][slot.j] = keep + h;
    const up = lossFor(net.forward(X), TASK).loss;
    values[slot.i][slot.j] = keep - h;
    const down = lossFor(net.forward(X), TASK).loss;
    return (up - down) / (2 * h);
  }, [slot, h]);

  const exact = analytic[slot.param][slot.i][slot.j];
  const groups = [...new Set(all.map((s) => s.group))];

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3 sm:p-4">
        {groups.map((group) => (
          <div key={group}>
            <div className="mb-1.5 font-mono text-[10px] tracking-widest text-stone-500 uppercase">{group}</div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={group}>
              {all.map((s, index) =>
                s.group !== group ? null : (
                  <button
                    key={index}
                    type="button"
                    aria-pressed={index === picked}
                    onClick={() => setPicked(index)}
                    className={`btn btn-small normal-case ${index === picked ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {s.label}
                  </button>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <Readout
        items={[
          { label: 'From one backward pass', value: exact.toFixed(6), key: true },
          { label: `By nudging ${slot.label} by ${h >= 0.01 ? h.toFixed(2) : h.toExponential(0)}`, value: nudged.toFixed(6) },
          { label: 'They differ by', value: Math.abs(exact - nudged).toExponential(1) },
          { label: 'Loss of the network', value: baseLoss.toFixed(4) },
        ]}
      />

      <ControlBar>
        <Slider
          label="Size of the nudge"
          value={exponent}
          min={-5}
          max={0}
          step={0.5}
          onChange={setExponent}
          format={(e) => (10 ** e >= 0.01 ? (10 ** e).toFixed(2) : (10 ** e).toExponential(0))}
        />
        <span className="font-mono text-[10px] text-stone-500">{all.length} learnable numbers: one backward pass gives all {all.length} gradients.</span>
      </ControlBar>
    </div>
  );
}
