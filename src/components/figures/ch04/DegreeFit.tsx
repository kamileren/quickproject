import { useMemo, useState } from 'react';
import { sampleSleepStudents, sleepTest, sleepTrain, SLEEP_X, SLEEP_Y, trueSleepCurve } from '@/data/sleep-scores';
import { pointsMse } from '@/lib/poly';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, FnLine, Plot } from '../core/Plot';
import { describeDegree, fitSleep, formatError, MAX_DEGREE } from './shared';

interface DegreeFitProps {
  /**
   * Bias and variance mode: a button draws a fresh class of students each
   * time, and earlier fits stay on screen so the reader can see how much the
   * curve changes from class to class.
   */
  resample?: boolean;
  initialDegree?: number;
}

const FIRST_SEED = 48;

/** Fit a polynomial of a chosen flexibility to the sleep data and compare seen with unseen students. */
export default function DegreeFit({ resample = false, initialDegree = 1 }: DegreeFitProps) {
  const [degree, setDegree] = useState(initialDegree);
  const [showTest, setShowTest] = useState(false);
  const [seeds, setSeeds] = useState<number[]>([FIRST_SEED]);

  const seed = seeds[seeds.length - 1];
  const train = useMemo(() => (seed === FIRST_SEED ? sleepTrain : sampleSleepStudents(12, seed)), [seed]);
  const model = useMemo(() => fitSleep(train, degree), [train, degree]);
  const earlier = useMemo(
    () => seeds.slice(0, -1).slice(-9).map((s) => fitSleep(s === FIRST_SEED ? sleepTrain : sampleSleepStudents(12, s), degree)),
    [seeds, degree],
  );

  const trainError = pointsMse(train, model.predict);
  const testError = pointsMse(sleepTest, model.predict);

  return (
    <div className="space-y-3">
      <Plot
        xDomain={SLEEP_X}
        yDomain={SLEEP_Y}
        xLabel="Hours slept"
        yLabel="Exam score"
        label={`Exam score against hours slept, with a fitted curve of degree ${degree}.`}
      >
        {resample && <FnLine f={trueSleepCurve} stroke={COLORS.ink} strokeWidth={1.5} dashed />}
        {earlier.map((m, i) => (
          <FnLine key={i} f={m.predict} stroke={COLORS.accent} strokeWidth={1} opacity={0.3} />
        ))}
        <FnLine f={model.predict} />
        {showTest && <Dots points={sleepTest} fill={COLORS.cool} hollow r={4} title={(p) => `New student: ${p.x} h, score ${p.y}`} />}
        <Dots points={train} title={(p) => `${p.x} h, score ${p.y}`} />
      </Plot>

      <Legend
        items={[
          { label: 'Students used for fitting', color: COLORS.ink, shape: 'dot' },
          { label: 'Fitted curve', color: COLORS.accent, shape: 'line' },
          ...(showTest ? [{ label: 'New students (hollow)', color: COLORS.cool, shape: 'dot' as const }] : []),
          ...(resample ? [{ label: 'True pattern', color: COLORS.ink, shape: 'dash' as const }] : []),
        ]}
      />

      <Readout
        items={[
          { label: 'Flexibility', value: `degree ${degree}: ${describeDegree(degree)}` },
          { label: 'Error on fitted students', value: formatError(trainError) },
          { label: 'Error on new students', value: showTest || resample ? formatError(testError) : 'hidden', key: true },
        ]}
      />

      <ControlBar>
        <Slider label="Flexibility (degree)" value={degree} min={1} max={MAX_DEGREE} step={1} onChange={setDegree} />
        {resample ? (
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-small" onClick={() => setSeeds((s) => [...s, s[s.length - 1] + 101])}>
              New class of students
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setSeeds([FIRST_SEED])}>
              Reset
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-primary btn-small" aria-pressed={showTest} onClick={() => setShowTest((s) => !s)}>
            {showTest ? 'Hide new students' : 'Show new students'}
          </button>
        )}
      </ControlBar>
    </div>
  );
}
