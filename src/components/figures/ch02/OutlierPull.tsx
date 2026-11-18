import { useMemo, useState } from 'react';
import { examPoints, EXAM_X, EXAM_Y } from '@/data/exam-scores';
import { fitLine, fitLineAbsolute, predict, type Point } from '@/lib/linear';
import { ControlBar, Legend, Readout } from '../core/Controls';
import { COLORS, Dots, DragHandle, FnLine, Plot } from '../core/Plot';

const FIXED = examPoints.slice(0, -1);
const START: Point = examPoints[examPoints.length - 1];

/**
 * One student can be dragged anywhere. Two lines refit live: least squares,
 * which chases the stray point, and least absolute error, which mostly ignores it.
 */
export default function OutlierPull() {
  const [stray, setStray] = useState<Point>(START);
  const points = useMemo(() => [...FIXED, stray], [stray]);
  const squares = useMemo(() => fitLine(points), [points]);
  const absolute = useMemo(() => fitLineAbsolute(points), [points]);
  const original = useMemo(() => fitLine(examPoints), []);

  return (
    <div className="space-y-3">
      <Plot
        xDomain={EXAM_X}
        yDomain={EXAM_Y}
        xLabel="Hours studied"
        yLabel="Exam score"
        label="Exam data with one movable student and two fitted lines, least squares and least absolute error."
      >
        <FnLine f={(x) => predict(absolute, x)} stroke={COLORS.cool} dashed />
        <FnLine f={(x) => predict(squares, x)} />
        <Dots points={FIXED} title={(p) => `${p.x} hours, score ${p.y}`} />
        <DragHandle x={stray.x} y={stray.y} label="The movable student" fill={COLORS.ink} onChange={setStray} />
      </Plot>

      <Legend
        items={[
          { label: 'Least squares', color: COLORS.accent, shape: 'line' },
          { label: 'Least absolute error', color: COLORS.cool, shape: 'dash' },
          { label: 'Movable student', color: COLORS.ink, shape: 'dot' },
        ]}
      />

      <Readout
        items={[
          { label: 'Slope before', value: original.w.toFixed(2) },
          { label: 'Least squares slope', value: squares.w.toFixed(2), key: true },
          { label: 'Least absolute slope', value: absolute.w.toFixed(2) },
        ]}
      />

      <ControlBar>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary btn-small" onClick={() => setStray({ x: 9, y: 35 })}>
            Make them fail badly
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => setStray(START)}>
            Reset
          </button>
        </div>
        <span className="font-mono text-[10px] text-stone-500">Drag the large dark dot anywhere.</span>
      </ControlBar>
    </div>
  );
}
