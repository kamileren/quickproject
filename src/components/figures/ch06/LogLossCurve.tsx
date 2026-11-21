import { useState } from 'react';
import { logLossOne } from '@/lib/classify';
import { ControlBar, Readout, Segmented } from '../core/Controls';
import { COLORS, DragHandle, FnLine, Plot } from '../core/Plot';

const OPTIONS = [
  { value: '1', label: 'The student passed' },
  { value: '0', label: 'The student failed' },
];
const clampP = (p: number) => Math.max(0.01, Math.min(0.99, p));

/** The log loss for one student, as a function of the probability the model gave to a pass. */
export default function LogLossCurve() {
  const [truth, setTruth] = useState('1');
  const [p, setP] = useState(0.7);
  const label = Number(truth);
  const loss = logLossOne(label, p);
  const given = label === 1 ? p : 1 - p;

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[0, 1]}
        yDomain={[0, 5]}
        xLabel="Model's predicted chance of a pass"
        yLabel="Loss for this student"
        aspect={0.5}
        label={`Log loss for a student who ${label ? 'passed' : 'failed'}. At a predicted chance of ${(p * 100).toFixed(0)} percent the loss is ${loss.toFixed(2)}.`}
      >
        <FnLine f={(x) => logLossOne(label, clampP(x))} stroke={COLORS.ink} samples={200} />
        <DragHandle
          x={p}
          y={Math.min(loss, 5)}
          label="The model's predicted chance of a pass"
          constrain={(pt) => ({ x: clampP(pt.x), y: Math.min(logLossOne(label, clampP(pt.x)), 5) })}
          onChange={(pt) => setP(clampP(pt.x))}
        />
      </Plot>

      <Readout
        items={[
          { label: 'Model said: chance of a pass', value: `${(p * 100).toFixed(0)}%` },
          { label: 'Chance it gave to what happened', value: `${(given * 100).toFixed(0)}%` },
          { label: 'Loss = −log of that', value: loss.toFixed(2), key: true },
        ]}
      />

      <ControlBar>
        <Segmented label="What actually happened" options={OPTIONS} value={truth} onChange={setTruth} />
        <span className="font-mono text-[10px] text-stone-500">Drag the orange dot along the curve.</span>
      </ControlBar>
    </div>
  );
}
