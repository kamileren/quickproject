import { useMemo, useRef, useState } from 'react';
import { examPoints, EXAM_X, EXAM_Y } from '@/data/exam-scores';
import type { Line } from '@/lib/linear';
import { mulberry32 } from '@/lib/random';
import { ControlBar, Legend, Readout } from '../core/Controls';
import { COLORS, Dots, FnLine, Plot } from '../core/Plot';
import { BEST_LOSS, B_RANGE, formatLoss, loss, predictHours, W_RANGE } from './shared';

interface Guess {
  line: Line;
  loss: number;
}

const randomLine = (rand: () => number): Line => ({
  w: W_RANGE[0] + rand() * (W_RANGE[1] - W_RANGE[0]),
  b: B_RANGE[0] + rand() * (B_RANGE[1] - B_RANGE[0]),
});

/**
 * Learning by pure luck: draw random lines and keep the best so far.
 * Early guesses help a lot, later ones almost never do.
 */
export default function RandomSearch() {
  const rand = useRef(mulberry32(7));
  const [guesses, setGuesses] = useState<Guess[]>([]);

  const best = useMemo(
    () => guesses.reduce<Guess | null>((b, g) => (!b || g.loss < b.loss ? g : b), null),
    [guesses],
  );
  const last = guesses[guesses.length - 1];

  const add = (count: number) =>
    setGuesses((prev) => {
      const next = [...prev];
      for (let i = 0; i < count; i++) {
        const line = randomLine(rand.current);
        next.push({ line, loss: loss(line) });
      }
      return next;
    });

  // How many guesses ago the best one was found.
  const stale = best ? guesses.length - 1 - guesses.indexOf(best) : 0;

  return (
    <div className="space-y-3">
      <Plot
        xDomain={EXAM_X}
        yDomain={EXAM_Y}
        xLabel="Hours studied"
        yLabel="Exam score"
        label="Exam data with randomly guessed lines. The best guess so far is highlighted."
      >
        {guesses.slice(-12).map((g, i) => (
          <FnLine key={guesses.length - i} f={(x) => predictHours(g.line, x)} stroke={COLORS.faint} strokeWidth={1} opacity={0.5} />
        ))}
        {last && last !== best && <FnLine f={(x) => predictHours(last.line, x)} stroke={COLORS.cool} dashed />}
        {best && <FnLine f={(x) => predictHours(best.line, x)} />}
        <Dots points={examPoints} />
      </Plot>

      <Legend
        items={[
          { label: 'Best guess so far', color: COLORS.accent, shape: 'line' },
          { label: 'Latest guess', color: COLORS.cool, shape: 'dash' },
          { label: 'Earlier guesses', color: COLORS.faint, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Guesses made', value: String(guesses.length) },
          { label: 'Best error so far', value: best ? formatLoss(best.loss) : '–', key: true },
          { label: 'Guesses since it improved', value: best ? String(stale) : '–' },
          { label: 'Lowest possible', value: BEST_LOSS.toFixed(1) },
        ]}
      />

      <ControlBar>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary btn-small" onClick={() => add(1)}>
            Guess once
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => add(100)}>
            Guess 100 times
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              rand.current = mulberry32(7);
              setGuesses([]);
            }}
          >
            Reset
          </button>
        </div>
      </ControlBar>
    </div>
  );
}
