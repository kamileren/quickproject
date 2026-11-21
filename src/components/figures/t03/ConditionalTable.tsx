import { useState } from 'react';
import { messageLabels, messageTokens } from '@/data/messages';
import { conditional } from '@/lib/prob';
import { ControlBar, Readout, Segmented } from '../core/Controls';

const count = (spam: number, hasFree: boolean) =>
  messageTokens.filter((t, i) => messageLabels[i] === spam && t.includes('free') === hasFree).length;

const SPAM_FREE = count(1, true);
const SPAM_NOT = count(1, false);
const NORMAL_FREE = count(0, true);
const NORMAL_NOT = count(0, false);
const TOTAL = SPAM_FREE + SPAM_NOT + NORMAL_FREE + NORMAL_NOT;

type Given = 'none' | 'spam' | 'free';
const OPTIONS: { value: Given; label: string }[] = [
  { value: 'none', label: 'Nothing known' },
  { value: 'spam', label: 'Given: it is spam' },
  { value: 'free', label: 'Given: it contains "free"' },
];

const head = 'border-0 p-2 text-center font-mono text-[10px] tracking-widest text-stone-500 uppercase';

/**
 * The 34 messages sorted into a two-by-two table. Choosing what is "given"
 * narrows attention to one row or one column, which is all conditioning means.
 */
export default function ConditionalTable() {
  const [given, setGiven] = useState<Given>('none');

  const tone = (isSpam: boolean, hasFree: boolean) => {
    const inScope = given === 'none' || (given === 'spam' && isSpam) || (given === 'free' && hasFree);
    const isTarget = (given === 'spam' && isSpam && hasFree) || (given === 'free' && isSpam && hasFree) || (given === 'none' && isSpam && hasFree);
    if (!inScope) return 'bg-stone-50 text-stone-300';
    return isTarget ? 'bg-stone-900 text-white' : 'bg-white text-stone-900';
  };
  const cell = (n: number, isSpam: boolean, hasFree: boolean) => (
    <td className={`border border-stone-200 p-3 text-center font-mono text-lg font-bold tabular-nums transition-colors ${tone(isSpam, hasFree)}`}>{n}</td>
  );

  const result =
    given === 'spam'
      ? { ask: 'Chance it contains "free", given it is spam', top: SPAM_FREE, bottom: SPAM_FREE + SPAM_NOT }
      : given === 'free'
        ? { ask: 'Chance it is spam, given it contains "free"', top: SPAM_FREE, bottom: SPAM_FREE + NORMAL_FREE }
        : { ask: 'Chance a message is spam and contains "free"', top: SPAM_FREE, bottom: TOTAL };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-4">
        <table className="m-0 mx-auto table w-auto border-collapse whitespace-normal" aria-label="Messages counted by whether they are spam and whether they contain the word free">
          <thead>
            <tr>
              <td className="border-0" />
              <th scope="col" className={head}>contains "free"</th>
              <th scope="col" className={head}>does not</th>
              <th scope="col" className={head}>total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className={`${head} text-right`}>spam</th>
              {cell(SPAM_FREE, true, true)}
              {cell(SPAM_NOT, true, false)}
              <td className="border-0 p-3 text-center font-mono text-sm text-stone-500">{SPAM_FREE + SPAM_NOT}</td>
            </tr>
            <tr>
              <th scope="row" className={`${head} text-right`}>normal</th>
              {cell(NORMAL_FREE, false, true)}
              {cell(NORMAL_NOT, false, false)}
              <td className="border-0 p-3 text-center font-mono text-sm text-stone-500">{NORMAL_FREE + NORMAL_NOT}</td>
            </tr>
            <tr>
              <th scope="row" className={`${head} text-right`}>total</th>
              <td className="border-0 p-3 text-center font-mono text-sm text-stone-500">{SPAM_FREE + NORMAL_FREE}</td>
              <td className="border-0 p-3 text-center font-mono text-sm text-stone-500">{SPAM_NOT + NORMAL_NOT}</td>
              <td className="border-0 p-3 text-center font-mono text-sm text-stone-500">{TOTAL}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Readout
        items={[
          { label: result.ask, value: `${result.top} of ${result.bottom} = ${(conditional(result.top, result.bottom) * 100).toFixed(0)}%`, key: true },
        ]}
      />

      <ControlBar>
        <Segmented label="What is already known" options={OPTIONS} value={given} onChange={setGiven} />
      </ControlBar>
    </div>
  );
}
