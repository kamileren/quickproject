import { useId, useState } from 'react';
import { softmax } from '@/lib/nn';
import { ControlBar, Readout, Segmented } from '../core/Controls';

interface ScoreBoardProps {
  /** Let the reader say which class is correct, and show the loss. */
  withTruth?: boolean;
  /** Also show probability minus truth for each class: the direction each score should move. */
  withGradient?: boolean;
  initialScores?: number[];
}

const CLASSES = ['T-shirt', 'Trouser', 'Sneaker'];
const TRUTH_OPTIONS = CLASSES.map((label, i) => ({ value: String(i), label: `It is a ${label.toLowerCase()}` }));

const th = 'border-0 px-1 pb-2 text-left font-mono text-[9px] tracking-wider text-stone-500 uppercase sm:px-2 sm:text-[10px] sm:tracking-widest';
const td = 'border-0 border-t border-stone-200 px-1 py-2.5 align-middle font-mono text-xs tabular-nums text-stone-900 sm:px-2 sm:text-sm';

/**
 * Three raw scores from a network, turned into probabilities by softmax.
 * Depending on the props it also shows the cross-entropy loss against a chosen
 * correct class, and the gradient with respect to each score.
 */
export default function ScoreBoard({ withTruth = false, withGradient = false, initialScores = [2, 1, 0.1] }: ScoreBoardProps) {
  const [scores, setScores] = useState(initialScores);
  const [truth, setTruth] = useState('0');
  const id = useId();

  const exps = scores.map((s) => Math.exp(s));
  const probs = softmax([scores])[0];
  const correct = Number(truth);
  const loss = -Math.log(Math.max(probs[correct], 1e-12));
  const picked = probs.indexOf(Math.max(...probs));
  const showTruth = withTruth || withGradient;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-2 sm:p-4">
        <table className="m-0 table w-full border-collapse whitespace-normal" aria-label="Scores and probabilities for each class">
          <thead>
            <tr>
              <th className={th}>Class</th>
              <th className={th}>Raw score</th>
              {!showTruth && <th className={`${th} hidden text-right sm:table-cell`}>e^score</th>}
              <th className={th}>Probability</th>
              {showTruth && <th className={`${th} hidden text-right sm:table-cell`}>Truth</th>}
              {withGradient && <th className={`${th} text-right`}>Prob − truth</th>}
            </tr>
          </thead>
          <tbody>
            {CLASSES.map((name, i) => {
              const y = i === correct ? 1 : 0;
              const diff = probs[i] - y;
              return (
                <tr key={name}>
                  <td className={`${td} font-sans text-[12px] font-bold sm:text-[13px]`}>
                    {name}
                    {showTruth && i === correct && <span className="ml-1 hidden font-mono text-[9px] font-normal text-orange-700 uppercase sm:inline">correct</span>}
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        className="book-range w-10 min-w-8 flex-1 sm:w-28"
                        min={-3}
                        max={6}
                        step={0.1}
                        value={scores[i]}
                        aria-label={`Raw score for ${name}`}
                        aria-describedby={`${id}-p${i}`}
                        onChange={(e) => setScores((s) => s.map((old, j) => (j === i ? parseFloat(e.target.value) : old)))}
                      />
                      <span className="w-7 text-right sm:w-9">{scores[i].toFixed(1)}</span>
                    </div>
                  </td>
                  {!showTruth && <td className={`${td} hidden text-right text-stone-500 sm:table-cell`}>{exps[i] >= 100 ? exps[i].toFixed(0) : exps[i].toFixed(2)}</td>}
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <div className="hidden h-2.5 min-w-8 flex-1 rounded-sm bg-stone-200 sm:block">
                        <div className={`h-full rounded-sm ${showTruth && i === correct ? 'bg-orange-600' : 'bg-stone-900'}`} style={{ width: `${probs[i] * 100}%` }} />
                      </div>
                      <span id={`${id}-p${i}`} className={`w-11 text-right font-bold sm:w-12 ${showTruth && i === correct ? 'text-orange-700' : ''}`}>
                        {(probs[i] * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  {showTruth && <td className={`${td} hidden text-right sm:table-cell`}>{y}</td>}
                  {withGradient && (
                    <td className={`${td} text-right font-bold`}>
                      {diff > 0 ? '+' : ''}
                      {diff.toFixed(3)}
                      <span className="ml-1 hidden font-sans text-[10px] font-normal text-stone-500 sm:inline">{diff > 0 ? 'lower it' : 'raise it'}</span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Readout
        items={
          showTruth
            ? [
                { label: 'Probability given to the correct class', value: `${(probs[correct] * 100).toFixed(1)}%` },
                { label: 'Loss = −log of that', value: loss.toFixed(3), key: true },
                { label: 'Network would answer', value: `${CLASSES[picked]} (${picked === correct ? 'right' : 'wrong'})` },
              ]
            : [
                { label: 'Sum of e^score', value: exps.reduce((a, b) => a + b, 0).toFixed(2) },
                { label: 'Probabilities add up to', value: `${(probs.reduce((a, b) => a + b, 0) * 100).toFixed(0)}%`, key: true },
                { label: 'Largest', value: CLASSES[picked] },
              ]
        }
      />

      {showTruth && (
        <ControlBar>
          <Segmented label="The correct class" options={TRUTH_OPTIONS} value={truth} onChange={setTruth} />
        </ControlBar>
      )}
    </div>
  );
}
