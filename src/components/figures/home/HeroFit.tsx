import { useMemo, useState } from 'react';
import { examPoints, EXAM_X, EXAM_Y } from '@/data/exam-scores';
import { fitLine, lineMse, predict, type Line } from '@/lib/linear';
import { COLORS, Dots, DragHandle, FnLine, Plot, Segments } from '../core/Plot';

const LEFT_X = 1;
const RIGHT_X = 9;
// The line starts out plainly wrong, so there is something to fix.
const START = { left: 78, right: 52 };

interface HeroFitProps {
  /** Where "see how a computer does it" leads. */
  chapterUrl: string;
}

/**
 * The cover's taste of the book: twelve students, one line, two handles.
 * Dragging the line through the dots is linear regression done by hand, and
 * the message says so once the reader gets close.
 */
export default function HeroFit({ chapterUrl }: HeroFitProps) {
  const [ends, setEnds] = useState(START);
  const [touched, setTouched] = useState(false);

  const line: Line = useMemo(() => {
    const w = (ends.right - ends.left) / (RIGHT_X - LEFT_X);
    return { w, b: ends.left - w * LEFT_X };
  }, [ends]);
  const best = useMemo(() => Math.sqrt(lineMse(examPoints, fitLine(examPoints))), []);
  const miss = Math.sqrt(lineMse(examPoints, line));
  const solved = miss <= best * 1.2;
  // How close the line is to the best one, as the fill of a small meter.
  const closeness = Math.max(0.04, Math.min(1, best / miss));

  const move = (side: 'left' | 'right') => (p: { y: number }) => {
    setTouched(true);
    setEnds((e) => ({ ...e, [side]: p.y }));
  };

  return (
    <div className="text-left">
      <Plot
        xDomain={EXAM_X}
        yDomain={EXAM_Y}
        xLabel="Hours studied"
        yLabel="Exam score"
        aspect={0.5}
        maxHeight={300}
        label="Twelve students: exam score against hours studied, with a line you can move by its two ends."
      >
        <Segments segments={examPoints.map((p) => ({ from: p, to: { x: p.x, y: predict(line, p.x) } }))} />
        <FnLine f={(x) => predict(line, x)} />
        <Dots points={examPoints} title={(p) => `${p.x} hours, score ${p.y}`} />
        <DragHandle x={LEFT_X} y={ends.left} label="Left end of the line" constrain={(p) => ({ x: LEFT_X, y: p.y })} onChange={move('left')} />
        <DragHandle x={RIGHT_X} y={ends.right} label="Right end of the line" constrain={(p) => ({ x: RIGHT_X, y: p.y })} onChange={move('right')} />
      </Plot>

      <div className="mt-3 flex items-center gap-3 font-sans">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
          <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${closeness * 100}%`, background: solved ? COLORS.ink : COLORS.accent }} />
        </div>
        <span className="font-mono text-[11px] text-stone-500 tabular-nums">off by {miss.toFixed(1)} points</span>
      </div>

      <p className="mt-3 min-h-12 font-serif text-[15px] leading-relaxed text-stone-700" aria-live="polite">
        {solved ? (
          <>
            <strong className="text-stone-900">That is about as good as a line can get.</strong> You just did linear regression by hand.{' '}
            <a href={chapterUrl} className="font-semibold text-orange-700 underline decoration-orange-300 decoration-2 underline-offset-4 hover:text-orange-900">
              See how a computer finds it
            </a>
            .
          </>
        ) : touched ? (
          <>Closer. Each red line is a miss for one student. Make them as short as you can.</>
        ) : (
          <>
            <strong className="text-stone-900">Drag the two orange dots</strong> until the line runs through the students. Every chapter has figures like this one.
          </>
        )}
      </p>
    </div>
  );
}
