import { useRef, useState } from 'react';
import { rollDie, twoDiceProbability } from '@/lib/prob';
import { mulberry32 } from '@/lib/random';
import { ControlBar, Legend, Readout } from '../core/Controls';
import { Bars, COLORS, Dots, Plot } from '../core/Plot';

const TOTALS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const EXPECTED = TOTALS.map((t) => ({ x: t, y: twoDiceProbability(t) * 100 }));
const EMPTY = () => new Array<number>(13).fill(0);

/**
 * Roll two dice many times and watch the share of each total settle toward
 * its probability. A few rolls are ragged; thousands are smooth.
 */
export default function DiceHistogram() {
  const rand = useRef(mulberry32(11));
  const [counts, setCounts] = useState<number[]>(EMPTY);
  const [last, setLast] = useState<[number, number] | null>(null);

  const rolls = counts.reduce((a, b) => a + b, 0);
  const share = (t: number) => (rolls === 0 ? 0 : (counts[t] / rolls) * 100);
  const averageTotal = rolls === 0 ? 0 : TOTALS.reduce((s, t) => s + t * counts[t], 0) / rolls;

  const roll = (times: number) => {
    const next = [...counts];
    let pair: [number, number] = [1, 1];
    for (let i = 0; i < times; i++) {
      pair = [rollDie(rand.current), rollDie(rand.current)];
      next[pair[0] + pair[1]]++;
    }
    setCounts(next);
    setLast(pair);
  };

  return (
    <div className="space-y-3">
      <Plot
        xDomain={[1.3, 12.7]}
        yDomain={[0, 32]}
        xLabel="Total of the two dice"
        yLabel="Share of rolls (%)"
        aspect={0.5}
        xTicks={11}
        label={`Share of ${rolls} rolls of two dice that gave each total, compared with the true probabilities. Sevens: ${share(7).toFixed(1)} percent.`}
      >
        <Bars bars={TOTALS.map((t) => ({ x: t, y: Math.min(share(t), 32) }))} title={(b) => `Total ${b.x}: ${share(b.x).toFixed(1)}% of rolls`} />
        <Dots points={EXPECTED} hollow fill={COLORS.accent} r={4.5} title={(p) => `True probability of ${p.x}: ${p.y.toFixed(1)}%`} />
      </Plot>

      <Legend
        items={[
          { label: 'Share of your rolls', color: COLORS.ink, shape: 'line' },
          { label: 'True probability', color: COLORS.accent, shape: 'dot' },
        ]}
      />

      <Readout
        items={[
          { label: 'Rolls so far', value: String(rolls) },
          { label: 'Last roll', value: last ? `${last[0]} + ${last[1]} = ${last[0] + last[1]}` : '–' },
          { label: 'Share of sevens (true: 16.7%)', value: rolls ? `${share(7).toFixed(1)}%` : '–', key: true },
          { label: 'Average total (true: 7)', value: rolls ? averageTotal.toFixed(2) : '–' },
        ]}
      />

      <ControlBar>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary btn-small" onClick={() => roll(1)}>
            Roll once
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => roll(10)}>
            Roll 10
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => roll(1000)}>
            Roll 1,000
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              rand.current = mulberry32(11);
              setCounts(EMPTY());
              setLast(null);
            }}
          >
            Reset
          </button>
        </div>
      </ControlBar>
    </div>
  );
}
