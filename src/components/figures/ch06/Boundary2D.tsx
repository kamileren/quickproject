import { useMemo, useState } from 'react';
import { SLEEP_RANGE, STUDY_RANGE, studySleep } from '@/data/pass-fail';
import { fitLogistic, predictProba } from '@/lib/classify';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Dots, FnLine, Plot, Regions } from '../core/Plot';

const X = studySleep.map((s) => [s.hours, s.sleep]);
const Y = studySleep.map((s) => s.passed);
const toPoint = (s: { hours: number; sleep: number }) => ({ x: s.hours, y: s.sleep });

/**
 * Logistic regression with two features. The model's probabilities shade the
 * plane, and the line where the probability equals the chosen threshold is
 * the decision boundary.
 */
export default function Boundary2D() {
  const [threshold, setThreshold] = useState(0.5);
  const [shade, setShade] = useState(true);
  const fit = useMemo(() => fitLogistic(X, Y), []);
  const [b, w1, w2] = fit.weights;

  // On the boundary, b + w1·hours + w2·sleep equals the log-odds of the threshold.
  const level = Math.log(threshold / (1 - threshold));
  const boundary = (hours: number) => (level - b - w1 * hours) / w2;

  const predicted = X.map((row) => (predictProba(fit.weights, row) >= threshold ? 1 : 0));
  const right = predicted.filter((p, i) => p === Y[i]).length;
  const wronglyPassed = predicted.filter((p, i) => p === 1 && Y[i] === 0).length;
  const wronglyFailed = predicted.filter((p, i) => p === 0 && Y[i] === 1).length;

  return (
    <div className="space-y-3">
      <Plot
        xDomain={STUDY_RANGE}
        yDomain={SLEEP_RANGE}
        xLabel="Hours studied"
        yLabel="Hours slept"
        label={`Forty students by hours studied and hours slept. The model predicts a pass above the line; ${right} of 40 are classified correctly.`}
      >
        {shade && <Regions opacity={(x, y) => 0.42 * predictProba(fit.weights, [x, y])} />}
        <FnLine f={boundary} stroke={COLORS.ink} strokeWidth={2} />
        <Dots points={studySleep.filter((s) => s.passed === 1).map(toPoint)} title={(p) => `${p.x} h study, ${p.y} h sleep, passed`} />
        <Dots points={studySleep.filter((s) => s.passed === 0).map(toPoint)} hollow title={(p) => `${p.x} h study, ${p.y} h sleep, failed`} />
      </Plot>

      <Legend
        items={[
          { label: 'Passed (filled)', color: COLORS.ink, shape: 'dot' },
          { label: 'Failed (hollow)', color: COLORS.faint, shape: 'dot' },
          { label: 'Decision boundary', color: COLORS.ink, shape: 'line' },
          ...(shade ? [{ label: 'Darker = higher predicted chance of a pass', color: COLORS.accent, shape: 'dot' as const }] : []),
        ]}
      />

      <Readout
        items={[
          { label: 'Predict a pass when chance ≥', value: `${(threshold * 100).toFixed(0)}%` },
          { label: 'Students right', value: `${right} of 40`, key: true },
          { label: 'Fails predicted to pass', value: String(wronglyPassed) },
          { label: 'Passes predicted to fail', value: String(wronglyFailed) },
        ]}
      />

      <ControlBar>
        <Slider label="Threshold" value={threshold} min={0.05} max={0.95} step={0.05} onChange={setThreshold} format={(v) => `${(v * 100).toFixed(0)}%`} />
        <button type="button" className="btn btn-secondary btn-small" aria-pressed={shade} onClick={() => setShade((s) => !s)}>
          {shade ? 'Hide shading' : 'Show shading'}
        </button>
      </ControlBar>
    </div>
  );
}
