import { useMemo, useRef, useState } from 'react';
import { SPIRAL_RANGE, spiralSmall, spiralSmallTest } from '@/data/spiral';
import { Adam } from '@/lib/nn';
import { createSpiralTrainer } from '@/lib/spiral-trainer';
import { ClassMap } from '../core/ClassMap';
import { ControlBar, Legend, Readout, Slider, StepControls } from '../core/Controls';
import { COLORS, Dots, Plot, Polyline, SERIES, VRule } from '../core/Plot';
import { useTicker } from '../core/useTicker';

interface HonestSpiralProps {
  /** Which remedy the reader can adjust. */
  control?: 'none' | 'l2' | 'dropout';
  /** Mark the step at which the loss on new points was lowest. */
  markBest?: boolean;
}

const MAX_STEPS = 1500;
const STEPS_PER_TICK = 25;
const LOSS_TOP = 3.2;
const formatL2 = (v: number) => (v === 0 ? 'off' : v >= 0.01 ? v.toFixed(2) : v.toFixed(4));
/** Slider positions for the weight penalty: off, then powers of ten from 0.0001 to 0.1. */
const L2_VALUES = [0, 0.0001, 0.0003, 0.001, 0.003, 0.01, 0.03, 0.1];

const TRAIN_BY_CLASS = [0, 1, 2].map((k) => spiralSmall.filter((p) => p.label === k));
const TEST_BY_CLASS = [0, 1, 2].map((k) => spiralSmallTest.filter((p) => p.label === k));

/**
 * A network with 64 hidden neurons trained on only 45 points. Left to itself
 * it memorises them. A weight penalty or dropout makes it settle for a
 * simpler boundary that does better on points it has not seen.
 */
export default function HonestSpiral({ control = 'none', markBest = false }: HonestSpiralProps) {
  const [l2Index, setL2Index] = useState(0);
  const [dropout, setDropout] = useState(0);
  const [resets, setResets] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [, setTick] = useState(0);
  const history = useRef<{ step: number; train: number; test: number }[]>([]);
  const l2 = L2_VALUES[l2Index];

  const trainer = useMemo(() => {
    const t = createSpiralTrainer(new Adam({ learningRate: 0.03 }), { hidden: 64, l2, dropout, train: spiralSmall, test: spiralSmallTest });
    history.current = [{ step: 0, train: t.loss(), test: t.testLoss() }];
    return t;
    // `resets` is a deliberate dependency: Reset rebuilds the network from scratch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l2, dropout, resets]);

  const steps = trainer.steps();
  const done = steps >= MAX_STEPS;
  const advance = (count: number) => {
    if (done) {
      setPlaying(false);
      return;
    }
    trainer.run(Math.min(count, MAX_STEPS - steps));
    history.current.push({ step: trainer.steps(), train: trainer.loss(), test: trainer.testLoss() });
    setTick((t) => t + 1);
  };
  useTicker(playing, () => advance(STEPS_PER_TICK), 70);

  const now = history.current[history.current.length - 1];
  const best = history.current.reduce((a, b) => (b.test < a.test ? b : a));
  const restart = () => {
    setPlaying(false);
    setResets((r) => r + 1);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Plot xDomain={SPIRAL_RANGE} yDomain={SPIRAL_RANGE} aspect={1} maxHeight={340} xTicks={4} yTicks={4} label={`Forty-five training points in three classes and the regions the network assigns after ${steps} steps.`}>
          <ClassMap classify={trainer.classify} version={`${l2}-${dropout}-${resets}-${steps}`} cols={40} rows={40} />
          {showNew && TEST_BY_CLASS.map((points, k) => <Dots key={`t${k}`} points={points} fill={SERIES[k]} hollow r={2.5} />)}
          {TRAIN_BY_CLASS.map((points, k) => (
            <Dots key={k} points={points} fill={SERIES[k]} r={4.5} />
          ))}
        </Plot>
        <Plot xDomain={[0, MAX_STEPS]} yDomain={[0, LOSS_TOP]} xLabel="Training steps" yLabel="Loss" aspect={1} maxHeight={340} xTicks={4} label={`Loss on the training points and on new points. Now ${now.train.toFixed(2)} and ${now.test.toFixed(2)}.`}>
          {markBest && steps > 0 && <VRule at={best.step} stroke={COLORS.faint} dashed strokeWidth={1} />}
          <Polyline points={history.current.map((h) => ({ x: h.step, y: h.train }))} stroke={COLORS.ink} strokeWidth={2} />
          <Polyline points={history.current.map((h) => ({ x: h.step, y: Math.min(h.test, LOSS_TOP * 1.5) }))} stroke={COLORS.accent} strokeWidth={2.5} />
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'Loss on the 45 training points', color: COLORS.ink, shape: 'line' },
          { label: 'Loss on 450 new points', color: COLORS.accent, shape: 'line' },
          ...(markBest ? [{ label: 'Lowest loss on new points', color: COLORS.faint, shape: 'dash' as const }] : []),
        ]}
      />

      <Readout
        items={[
          { label: 'Right on training points', value: `${(trainer.trainAccuracy() * 100).toFixed(0)}%` },
          { label: 'Right on new points', value: `${(trainer.testAccuracy() * 100).toFixed(0)}%`, key: true },
          { label: 'Loss on new points', value: now.test.toFixed(2) },
          markBest ? { label: 'It was lowest at step', value: steps === 0 ? '–' : `${best.step} (${best.test.toFixed(2)})` } : { label: 'Steps', value: String(steps) },
        ]}
      />

      <ControlBar>
        <StepControls playing={playing} canAdvance={!done} onPlayPause={() => setPlaying((p) => !p)} onStep={() => advance(STEPS_PER_TICK)} onReset={restart} playLabel="Train" />
        <button type="button" className="btn btn-secondary btn-small" aria-pressed={showNew} onClick={() => setShowNew((s) => !s)}>
          {showNew ? 'Hide new points' : 'Show new points'}
        </button>
      </ControlBar>

      {control === 'l2' && (
        <ControlBar>
          <Slider
            label="Weight penalty λ"
            ariaLabel="Weight penalty lambda"
            value={l2Index}
            min={0}
            max={L2_VALUES.length - 1}
            step={1}
            onChange={(v) => {
              setPlaying(false);
              setL2Index(v);
            }}
            format={(i) => formatL2(L2_VALUES[i])}
          />
        </ControlBar>
      )}
      {control === 'dropout' && (
        <ControlBar>
          <Slider
            label="Dropout rate"
            value={dropout}
            min={0}
            max={0.6}
            step={0.1}
            onChange={(v) => {
              setPlaying(false);
              setDropout(+v.toFixed(1));
            }}
            format={(v) => (v === 0 ? 'off' : `${(v * 100).toFixed(0)}%`)}
          />
        </ControlBar>
      )}
    </div>
  );
}
