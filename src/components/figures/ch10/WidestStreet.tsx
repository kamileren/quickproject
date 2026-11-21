import { useMemo, useState } from 'react';
import { apart } from '@/data/svm-points';
import { toLabels, toRows, TOY_RANGE } from '@/data/toy2d';
import { lineThrough, streetWidth, trainSvm } from '@/lib/svm';
import { ControlBar, Legend, Readout } from '../core/Controls';
import { COLORS, DragHandle, Plot, type Point } from '../core/Plot';
import { ClassDots, Street } from './shared';

const X = toRows(apart);
const Y = toLabels(apart);
const START = { a: { x: 1.2, y: 6.2 }, b: { x: 8.8, y: 4.6 } };

/**
 * The reader places a separating line by hand and tries to make the empty
 * "street" around it as wide as possible, then compares with the SVM's answer.
 */
export default function WidestStreet() {
  const [a, setA] = useState<Point>(START.a);
  const [b, setB] = useState<Point>(START.b);
  const [reveal, setReveal] = useState(false);

  const best = useMemo(() => trainSvm(X, Y, { C: 1e4 }), []);
  const width = streetWidth([a.x, a.y], [b.x, b.y], X, Y);

  // The hand-placed line in the form unit·x + offset = 0, so distances are in plot units.
  const { unit } = lineThrough([a.x, a.y], [b.x, b.y]);
  const offset = -(unit[0] * a.x + unit[1] * a.y);

  return (
    <div className="space-y-3">
      <div className="mx-auto max-w-[460px]">
        <Plot
          xDomain={TOY_RANGE}
          yDomain={TOY_RANGE}
          xLabel="Feature 1"
          yLabel="Feature 2"
          aspect={1}
          maxHeight={460}
          label={
            width === null
              ? 'Two groups of points and a hand-placed line that does not separate them.'
              : `Two groups of points separated by a hand-placed line with an empty street ${width.toFixed(2)} wide around it.`
          }
        >
          {reveal && <Street w={best.w!} b={best.b} stroke={COLORS.ink} faint />}
          <Street w={unit} b={offset} halfWidth={width === null ? 0 : width / 2} />
          <ClassDots points={apart} />
          <DragHandle x={a.x} y={a.y} label="One end of your line" onChange={setA} />
          <DragHandle x={b.x} y={b.y} label="The other end of your line" onChange={setB} />
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'Your line', color: COLORS.accent, shape: 'line' },
          { label: 'Edges of your street', color: COLORS.accent, shape: 'dash' },
          ...(reveal ? [{ label: 'Widest possible street', color: COLORS.ink, shape: 'dash' as const }] : []),
        ]}
      />

      <Readout
        items={[
          { label: 'Separates the two kinds?', value: width === null ? 'no' : 'yes' },
          { label: 'Width of your street', value: width === null ? '–' : width.toFixed(2), key: true },
          { label: 'Widest possible', value: reveal ? best.marginWidth!.toFixed(2) : '?' },
        ]}
      />

      <ControlBar>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary btn-small" aria-pressed={reveal} onClick={() => setReveal((r) => !r)}>
            {reveal ? 'Hide the widest street' : 'Reveal the widest street'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              setA(START.a);
              setB(START.b);
              setReveal(false);
            }}
          >
            Reset
          </button>
        </div>
        <span className="font-mono text-[10px] text-stone-500">Drag the two orange handles.</span>
      </ControlBar>
    </div>
  );
}
