import { useMemo, useState } from 'react';
import { confusionCounts } from '@/lib/fashion';
import { Readout } from '../core/Controls';
import { SHORT, Thumb, useFashion, Waiting } from './shared';

/**
 * Where the network's mistakes go. Rows are the true class, columns are the
 * network's answer. Clicking a cell shows the images that landed in it.
 */
export default function ConfusionGrid() {
  const state = useFashion();
  const ready = state.status === 'ready' ? state.data : null;
  const counts = useMemo(() => (ready ? confusionCounts(ready.samples.labels, ready.predictions, ready.log.classes.length) : []), [ready]);
  const [cell, setCell] = useState<[number, number] | null>(null);

  if (!ready) return <Waiting status={state.status === 'error' ? 'error' : 'loading'} />;
  const { samples, predictions, log } = ready;

  // The largest off-diagonal count: the commonest single confusion.
  let worst: [number, number] = [0, 1];
  counts.forEach((row, t) => row.forEach((n, p) => t !== p && n > counts[worst[0]][worst[1]] && (worst = [t, p])));
  const [selTrue, selPred] = cell ?? worst;
  const members = samples.labels.map((y, i) => (y === selTrue && predictions[i] === selPred ? i : -1)).filter((i) => i >= 0);
  const right = counts.reduce((s, row, k) => s + row[k], 0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-2 sm:p-4">
        <table className="m-0 mx-auto table w-auto border-collapse whitespace-normal" aria-label="Confusion matrix: true class by row, the network's answer by column">
          <thead>
            <tr>
              <td className="border-0" />
              {SHORT.map((name) => (
                <th key={name} scope="col" className="border-0 p-0 align-bottom">
                  <div className="mx-auto h-14 w-5 sm:w-8">
                    <span className="block origin-bottom-left translate-x-3 translate-y-12 -rotate-60 font-mono text-[8px] sm:text-[9px] whitespace-nowrap text-stone-500 sm:translate-x-5">{name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {counts.map((row, t) => (
              <tr key={t}>
                <th scope="row" className="border-0 py-0 pr-1.5 text-right font-mono text-[8px] sm:pr-2 sm:text-[9px] font-normal whitespace-nowrap text-stone-500">
                  {SHORT[t]}
                </th>
                {row.map((n, p) => {
                  const selected = t === selTrue && p === selPred;
                  // One hue, darker for larger counts. Diagonal (correct) cells use ink, mistakes use the accent.
                  const strength = t === p ? n / 50 : Math.min(1, n / 8);
                  const background = n === 0 ? 'transparent' : t === p ? `rgba(28, 25, 23, ${0.12 + 0.75 * strength})` : `rgba(234, 88, 12, ${0.15 + 0.7 * strength})`;
                  const dark = n > 0 && strength > 0.55;
                  return (
                    <td key={p} className="border border-stone-200 p-0">
                      <button
                        type="button"
                        aria-pressed={selected}
                        aria-label={`${n} ${log.classes[t]} images called ${log.classes[p]}`}
                        onClick={() => setCell([t, p])}
                        className={`block h-5 w-5 cursor-pointer font-mono text-[9px] tabular-nums sm:h-8 sm:w-8 sm:text-[11px] ${dark ? 'text-white' : 'text-stone-700'} ${selected ? 'outline-2 outline-offset-[-2px] outline-stone-900' : ''}`}
                        style={{ background }}
                      >
                        {n || ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-center font-mono text-[10px] text-stone-500">Rows: what the image really is. Columns: what the network said.</p>
      </div>

      <div className="rounded border border-stone-200 bg-white p-3">
        <div className="mb-2 font-sans text-[12px] text-stone-700">
          <strong className="text-stone-900">{members.length}</strong> {members.length === 1 ? 'image' : 'images'} of a <strong className="text-stone-900">{log.classes[selTrue]}</strong>{' '}
          {selTrue === selPred ? 'correctly called' : 'that the network called'} <strong className="text-stone-900">{log.classes[selPred]}</strong>
          {members.length > 12 ? ' (first 12 shown)' : ''}
        </div>
        <div className="flex min-h-12 flex-wrap gap-1.5">
          {members.slice(0, 12).map((i) => (
            <Thumb key={i} samples={samples} index={i} size={44} label={`A ${log.classes[selTrue]} called ${log.classes[selPred]}`} />
          ))}
        </div>
      </div>

      <Readout
        items={[
          { label: 'Right overall', value: `${right} of ${samples.count}` },
          { label: 'Commonest confusion', value: `${SHORT[worst[0]]} called ${SHORT[worst[1]]} (${counts[worst[0]][worst[1]]}×)`, key: true },
          { label: 'Hardest class', value: SHORT[counts.map((row, k) => row[k]).indexOf(Math.min(...counts.map((row, k) => row[k])))] },
        ]}
      />
    </div>
  );
}
