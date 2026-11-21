import { useMemo, useState } from 'react';
import { argmax, classProbabilities, imageAt } from '@/lib/fashion';
import { ControlBar, Readout } from '../core/Controls';
import { Thumb, useFashion, Waiting } from './shared';

/**
 * The trained network at work. The reader steps through test images it has
 * never seen and reads its ten class probabilities for each one.
 */
export default function Classifier() {
  const state = useFashion();
  const [index, setIndex] = useState(0);

  const ready = state.status === 'ready' ? state.data : null;
  const probabilities = useMemo(() => (ready ? classProbabilities(ready.model, imageAt(ready.samples, index)) : []), [ready, index]);

  if (!ready) return <Waiting status={state.status === 'error' ? 'error' : 'loading'} />;
  const { samples, log, predictions } = ready;
  const truth = samples.labels[index];
  const guess = argmax(probabilities);
  const right = guess === truth;

  const step = (delta: number) => setIndex((i) => (i + delta + samples.count) % samples.count);
  const nextMistake = () => {
    for (let k = 1; k <= samples.count; k++) {
      const i = (index + k) % samples.count;
      if (predictions[i] !== samples.labels[i]) return setIndex(i);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="shrink-0 text-center">
          <div className="border border-stone-300">
            <Thumb samples={samples} index={index} size={168} label={`Test image ${index + 1}, a ${log.classes[truth]}`} />
          </div>
          <div className="mt-2 font-mono text-[10px] text-stone-500">
            Test image {index + 1} of {samples.count}
          </div>
        </div>
        <table className="m-0 table w-full border-collapse whitespace-normal" aria-label="The network's probability for each class">
          <tbody>
            {log.classes.map((name, k) => {
              const p = probabilities[k];
              return (
                <tr key={name}>
                  <th scope="row" className={`border-0 py-[3px] pr-2 text-right font-sans text-[12px] tracking-normal whitespace-nowrap normal-case ${k === truth ? 'font-bold text-stone-900' : 'font-normal text-stone-500'}`}>
                    {name}
                    {k === truth && <span className="ml-1 font-mono text-[9px] text-orange-700 uppercase">true</span>}
                  </th>
                  <td className="w-full border-0 py-[3px]">
                    <div className="h-3 rounded-sm bg-stone-200">
                      <div className={`h-full rounded-sm ${k === guess ? 'bg-stone-900' : 'bg-stone-400'}`} style={{ width: `${Math.max(p * 100, 0.5)}%` }} />
                    </div>
                  </td>
                  <td className={`border-0 py-[3px] pl-2 text-right font-mono text-[11px] tabular-nums ${k === guess ? 'font-bold text-stone-900' : 'text-stone-500'}`}>
                    {(p * 100).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Readout
        items={[
          { label: 'It really is a', value: log.classes[truth] },
          { label: 'The network says', value: `${log.classes[guess]} (${(probabilities[guess] * 100).toFixed(0)}% sure)`, key: true },
          { label: 'Verdict', value: right ? 'right' : 'wrong' },
        ]}
      />

      <ControlBar>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary btn-small" onClick={() => step(-1)}>
            Previous
          </button>
          <button type="button" className="btn btn-primary btn-small" onClick={() => step(1)}>
            Next image
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={nextMistake}>
            Show me a mistake
          </button>
        </div>
        <span className="font-mono text-[10px] text-stone-500">
          Right on {predictions.filter((p, i) => p === samples.labels[i]).length} of these {samples.count}
        </span>
      </ControlBar>
    </div>
  );
}
