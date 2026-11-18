import { useState } from 'react';
import { EXAM_X, EXAM_Y, newStudents, passed, PASS_MARK, students, type Student } from '@/data/exam-scores';
import { accuracy } from '@/lib/metrics';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { Band, COLORS, Dots, HRule, Plot, PlotLabel, VRule } from '../core/Plot';

const toPoint = (s: Student) => ({ x: s.hours, y: s.score });

/** The rule the reader is tuning: predict a pass when hours reach the threshold. */
const predictPass = (threshold: number) => (s: Student) => s.hours >= threshold;

const score = (group: Student[], threshold: number) =>
  accuracy(group.map(passed), group.map(predictPass(threshold)));

/**
 * The reader learns a one-number rule ("pass if hours ≥ t") from twelve
 * labelled students, then checks it on six students the rule has never seen.
 */
export default function RuleFromExamples() {
  const [threshold, setThreshold] = useState(6.5);
  const [revealed, setRevealed] = useState(false);

  const known = score(students, threshold);
  const fresh = score(newStudents, threshold);
  const split = (group: Student[], didPass: boolean) => group.filter((s) => passed(s) === didPass).map(toPoint);

  return (
    <div className="space-y-3">
      <Plot
        xDomain={EXAM_X}
        yDomain={EXAM_Y}
        xLabel="Hours studied"
        yLabel="Exam score"
        label={`Students plotted by hours and score. The rule predicts a pass at ${threshold.toFixed(2)} hours or more.`}
      >
        <Band from={threshold} to={EXAM_X[1]} />
        <HRule at={PASS_MARK} stroke={COLORS.faint} dashed strokeWidth={1} />
        <PlotLabel x={EXAM_X[0]} y={PASS_MARK} dx={6} dy={-6} fill={COLORS.muted}>
          pass mark 65
        </PlotLabel>
        <VRule at={threshold} stroke={COLORS.accent} strokeWidth={2} />
        <PlotLabel x={threshold} y={EXAM_Y[1]} dx={6} dy={14}>
          predict pass →
        </PlotLabel>
        <Dots points={split(students, true)} title={(p) => `${p.x} hours, score ${p.y}, passed`} />
        <Dots points={split(students, false)} hollow title={(p) => `${p.x} hours, score ${p.y}, failed`} />
        {revealed && (
          <>
            <Dots points={split(newStudents, true)} fill={COLORS.cool} r={5.5} title={(p) => `New student: ${p.x} hours, score ${p.y}, passed`} />
            <Dots points={split(newStudents, false)} fill={COLORS.cool} r={5.5} hollow title={(p) => `New student: ${p.x} hours, score ${p.y}, failed`} />
          </>
        )}
      </Plot>

      <Legend
        items={[
          { label: 'Passed (filled)', color: COLORS.ink, shape: 'dot' },
          { label: 'Failed (hollow, below the pass mark)', color: COLORS.faint, shape: 'dot' },
          { label: 'Your rule', color: COLORS.accent, shape: 'line' },
          ...(revealed ? [{ label: 'New students', color: COLORS.cool, shape: 'dot' as const }] : []),
        ]}
      />

      <Readout
        items={[
          { label: 'Your rule', value: `pass if hours ≥ ${threshold.toFixed(2)}` },
          { label: 'Right on the 12 known', value: `${Math.round(known * 12)} of 12`, key: true },
          { label: 'Right on 6 new', value: revealed ? `${Math.round(fresh * 6)} of 6` : 'hidden' },
        ]}
      />

      <ControlBar>
        <Slider label="Threshold (hours)" value={threshold} min={0} max={10} step={0.25} onChange={setThreshold} format={(v) => v.toFixed(2)} />
        <button type="button" className="btn btn-primary btn-small" aria-pressed={revealed} onClick={() => setRevealed((r) => !r)}>
          {revealed ? 'Hide new students' : 'Test on new students'}
        </button>
      </ControlBar>
    </div>
  );
}
