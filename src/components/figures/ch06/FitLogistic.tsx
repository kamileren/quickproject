import { useState } from 'react';
import { outcomes, outcomeY } from '@/data/pass-fail';
import { logisticStep, predictProba } from '@/lib/classify';
import { ControlBar, Legend, Readout, Slider, StepControls } from '../core/Controls';
import { COLORS, Dots, FnLine, HRule, Plot, VRule } from '../core/Plot';
import { useTicker } from '../core/useTicker';
import { BEST, correctCount, dotTitle, FAILED, HOURS, lossOf, PASSED, PROB } from './shared';

/**
 * As in the gradient descent chapter, hours are measured from a central value
 * (4.5) while training, which makes the steps well behaved. The weights are
 * converted back to plain hours for display.
 */
const CENTRE = 4.5;
const X_CENTRED = outcomes.map((o) => [o.hours - CENTRE]);
const toPlain = ([b, w]: number[]): number[] => [b - w * CENTRE, w];

const MAX_STEPS = 600;
const STEPS_PER_TICK = 4;
const START = [0, 0];

/** Gradient descent on the log loss, fitting the S-curve to the eighteen students. */
export default function FitLogistic() {
  const [weights, setWeights] = useState(START);
  const [steps, setSteps] = useState(0);
  const [eta, setEta] = useState(0.5);
  const [playing, setPlaying] = useState(false);

  const plain = toPlain(weights);
  const loss = lossOf(plain);
  const done = steps >= MAX_STEPS;
  const cut = plain[1] > 1e-6 ? -plain[0] / plain[1] : NaN;
  const cutVisible = Number.isFinite(cut) && cut > HOURS[0] && cut < HOURS[1];

  const advance = (count: number) => {
    if (done) {
      setPlaying(false);
      return;
    }
    setWeights((w) => {
      let next = w;
      for (let i = 0; i < count; i++) next = logisticStep(X_CENTRED, outcomeY, next, eta);
      return next;
    });
    setSteps((s) => Math.min(MAX_STEPS, s + count));
  };
  useTicker(playing, () => advance(STEPS_PER_TICK), 70);

  return (
    <div className="space-y-3">
      <Plot xDomain={HOURS} yDomain={PROB} xLabel="Hours studied" yLabel="Chance of passing" yTicks={6} label="The S-curve being fitted to the eighteen students by gradient descent.">
        <HRule at={0} stroke={COLORS.axis} strokeWidth={1} />
        <HRule at={1} stroke={COLORS.axis} strokeWidth={1} />
        <FnLine f={(x) => predictProba(BEST.weights, [x])} stroke={COLORS.ink} strokeWidth={1} dashed opacity={0.5} />
        {cutVisible && <VRule at={cut} stroke={COLORS.faint} dashed strokeWidth={1} />}
        <FnLine f={(x) => predictProba(plain, [x])} />
        <Dots points={PASSED} title={dotTitle(true)} />
        <Dots points={FAILED} hollow title={dotTitle(false)} />
      </Plot>

      <Legend
        items={[
          { label: 'Current curve', color: COLORS.accent, shape: 'line' },
          { label: 'Best possible curve', color: COLORS.ink, shape: 'dash' },
        ]}
      />

      <Readout
        items={[
          { label: 'Step', value: String(steps) },
          { label: 'Log loss', value: loss.toFixed(3), key: true },
          { label: '50% point', value: cutVisible ? `${cut.toFixed(2)} h` : '–' },
          { label: 'Students right', value: `${correctCount(plain)} of ${outcomes.length}` },
        ]}
      />

      <ControlBar>
        <StepControls
          playing={playing}
          canAdvance={!done}
          onPlayPause={() => setPlaying((p) => !p)}
          onStep={() => advance(1)}
          onReset={() => {
            setPlaying(false);
            setWeights(START);
            setSteps(0);
          }}
        />
        <Slider label="Learning rate η" ariaLabel="Learning rate eta" value={eta} min={0.05} max={2} step={0.05} onChange={setEta} format={(v) => v.toFixed(2)} />
      </ControlBar>

      <p className="font-mono text-[10px] text-stone-500">Lowest possible log loss on these students is {BEST.loss.toFixed(3)}.</p>
    </div>
  );
}
