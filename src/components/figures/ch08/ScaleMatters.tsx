import { useMemo, useState } from 'react';
import { SLEEP_RANGE, STUDY_RANGE, studySleep } from '@/data/pass-fail';
import { nearest, standardizer } from '@/lib/knn';
import { ControlBar, Legend, Readout, Segmented } from '../core/Controls';
import { COLORS, Dots, DragHandle, Plot, Segments, type Point } from '../core/Plot';

/** The same forty students as before, but sleep is now recorded in minutes instead of hours. */
const ROWS = studySleep.map((s) => [s.hours, s.sleep * 60]);
const LABELS = studySleep.map((s) => s.passed);
const POINTS = ROWS.map(([x, y]) => ({ x, y }));
const MINUTES: [number, number] = [SLEEP_RANGE[0] * 60, SLEEP_RANGE[1] * 60];
const SCALER = standardizer(ROWS);
const SCALED = ROWS.map(SCALER.transform);
const K = 5;

type Mode = 'raw' | 'scaled';
const OPTIONS: { value: Mode; label: string }[] = [
  { value: 'raw', label: 'Raw numbers' },
  { value: 'scaled', label: 'Rescaled first' },
];

/**
 * Nearest neighbours when one feature is in hours and the other in minutes.
 * With raw numbers the minutes swamp the hours and the neighbours are wrong.
 */
export default function ScaleMatters() {
  const [mode, setMode] = useState<Mode>('raw');
  const [query, setQuery] = useState<Point>({ x: 7, y: 330 });

  const idx = useMemo(() => {
    const q = [query.x, query.y];
    return mode === 'raw' ? nearest(ROWS, q, K) : nearest(SCALED, SCALER.transform(q), K);
  }, [mode, query]);

  const passes = idx.filter((i) => LABELS[i] === 1).length;
  const hourGap = Math.max(...idx.map((i) => Math.abs(ROWS[i][0] - query.x)));
  const minuteGap = Math.max(...idx.map((i) => Math.abs(ROWS[i][1] - query.y)));

  return (
    <div className="space-y-3">
      <Plot
        xDomain={STUDY_RANGE}
        yDomain={MINUTES}
        xLabel="Hours studied"
        yLabel="Minutes slept"
        yTicks={6}
        label={`Forty students by hours studied and minutes slept. The new student's five nearest neighbours, using ${mode === 'raw' ? 'raw numbers' : 'rescaled features'}, include ${passes} passes.`}
      >
        <Segments segments={idx.map((i) => ({ from: query, to: POINTS[i] }))} stroke={COLORS.accent} dashed={false} strokeWidth={1.5} />
        <Dots points={POINTS.filter((_, i) => LABELS[i] === 1)} title={(p) => `${p.x} h study, ${p.y} min sleep, passed`} />
        <Dots points={POINTS.filter((_, i) => LABELS[i] === 0)} hollow title={(p) => `${p.x} h study, ${p.y} min sleep, failed`} />
        <DragHandle x={query.x} y={query.y} label="The new student" onChange={setQuery} />
      </Plot>

      <Legend
        items={[
          { label: 'Passed (filled)', color: COLORS.ink, shape: 'dot' },
          { label: 'Failed (hollow)', color: COLORS.faint, shape: 'dot' },
          { label: 'New student and the 5 "nearest"', color: COLORS.accent, shape: 'line' },
        ]}
      />

      <Readout
        items={[
          { label: 'Farthest neighbour, in study hours', value: `${hourGap.toFixed(1)} h`, key: true },
          { label: 'Farthest neighbour, in sleep', value: `${minuteGap.toFixed(0)} min` },
          { label: 'Neighbours who passed', value: `${passes} of ${K}` },
          { label: 'Prediction', value: passes > K / 2 ? 'pass' : 'fail' },
        ]}
      />

      <ControlBar>
        <Segmented label="How distance is measured" options={OPTIONS} value={mode} onChange={setMode} />
        <span className="font-mono text-[10px] text-stone-500">Drag the orange point.</span>
      </ControlBar>
    </div>
  );
}
