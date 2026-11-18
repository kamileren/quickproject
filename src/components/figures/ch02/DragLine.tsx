import { useMemo, useState } from 'react';
import { examPoints, EXAM_X, EXAM_Y } from '@/data/exam-scores';
import { fitLine, lineMse, predict, type Line } from '@/lib/linear';
import { ControlBar, Legend, Readout } from '../core/Controls';
import { COLORS, Dots, DragHandle, FnLine, Plot, Segments } from '../core/Plot';

interface DragLineProps {
  /** Show residuals and the error readout. Off for the very first look at the data. */
  showError?: boolean;
}

const LEFT_X = 1;
const RIGHT_X = 9;
const START = { left: 64, right: 72 };

/**
 * The reader fits a line to the exam data by hand, by dragging its two ends.
 * With `showError`, each miss is drawn and the mean squared error updates live.
 */
export default function DragLine({ showError = true }: DragLineProps) {
  const [ends, setEnds] = useState(START);
  const [showBest, setShowBest] = useState(false);

  const line: Line = useMemo(() => {
    const w = (ends.right - ends.left) / (RIGHT_X - LEFT_X);
    return { w, b: ends.left - w * LEFT_X };
  }, [ends]);

  const best = useMemo(() => fitLine(examPoints), []);
  const loss = lineMse(examPoints, line);
  const bestLoss = lineMse(examPoints, best);

  return (
    <div className="space-y-3">
      <Plot
        xDomain={EXAM_X}
        yDomain={EXAM_Y}
        xLabel="Hours studied"
        yLabel="Exam score"
        label="Scatter plot of exam score against hours studied for twelve students, with a line you can move."
      >
        {showError && (
          <Segments segments={examPoints.map((p) => ({ from: p, to: { x: p.x, y: predict(line, p.x) } }))} />
        )}
        {showBest && <FnLine f={(x) => predict(best, x)} stroke={COLORS.ink} strokeWidth={1.5} dashed />}
        <FnLine f={(x) => predict(line, x)} />
        <Dots points={examPoints} title={(p) => `${p.x} hours, score ${p.y}`} />
        <DragHandle
          x={LEFT_X}
          y={ends.left}
          label="Left end of the line"
          constrain={(p) => ({ x: LEFT_X, y: p.y })}
          onChange={(p) => setEnds((e) => ({ ...e, left: p.y }))}
        />
        <DragHandle
          x={RIGHT_X}
          y={ends.right}
          label="Right end of the line"
          constrain={(p) => ({ x: RIGHT_X, y: p.y })}
          onChange={(p) => setEnds((e) => ({ ...e, right: p.y }))}
        />
      </Plot>

      {showError && (
        <Legend
          items={[
            { label: 'Student', color: COLORS.ink, shape: 'dot' },
            { label: 'Your line', color: COLORS.accent, shape: 'line' },
            { label: 'Miss (residual)', color: COLORS.error, shape: 'dash' },
            ...(showBest ? [{ label: 'Best possible line', color: COLORS.ink, shape: 'dash' as const }] : []),
          ]}
        />
      )}

      <Readout
        items={[
          { label: 'Slope w', value: line.w.toFixed(2) },
          { label: 'Bias b', value: line.b.toFixed(1) },
          ...(showError
            ? [
                { label: 'Your error (MSE)', value: loss.toFixed(1), key: true },
                { label: 'Best possible', value: showBest ? bestLoss.toFixed(1) : '?' },
              ]
            : []),
        ]}
      />

      <ControlBar>
        <div className="flex flex-wrap gap-2">
          {showError && (
            <button type="button" className="btn btn-primary btn-small" aria-pressed={showBest} onClick={() => setShowBest((s) => !s)}>
              {showBest ? 'Hide best line' : 'Reveal best line'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              setEnds(START);
              setShowBest(false);
            }}
          >
            Reset
          </button>
        </div>
        <span className="font-mono text-[10px] text-stone-500">Drag the two orange handles, or focus one and use the arrow keys.</span>
      </ControlBar>
    </div>
  );
}
