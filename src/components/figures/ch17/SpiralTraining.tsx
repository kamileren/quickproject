import { useMemo, useRef, useState } from 'react';
import { SPIRAL_RANGE, spiralTrain } from '@/data/spiral';
import { AdaGrad, Adam, RMSProp, SGD, type Optimizer } from '@/lib/nn';
import { createSpiralTrainer } from '@/lib/spiral-trainer';
import { ClassMap } from '../core/ClassMap';
import { ControlBar, Legend, Readout, Segmented, StepControls } from '../core/Controls';
import { Dots, Plot, Polyline, SERIES } from '../core/Plot';
import { useTicker } from '../core/useTicker';

export type OptimizerKind = 'sgd' | 'momentum' | 'adagrad' | 'rmsprop' | 'adam';

const MAKERS: Record<OptimizerKind, { label: string; make: () => Optimizer }> = {
  sgd: { label: 'Plain SGD', make: () => new SGD({ learningRate: 1 }) },
  momentum: { label: 'Momentum', make: () => new SGD({ learningRate: 1, decay: 1e-3, momentum: 0.9 }) },
  adagrad: { label: 'AdaGrad', make: () => new AdaGrad({ learningRate: 1, decay: 1e-4 }) },
  rmsprop: { label: 'RMSProp', make: () => new RMSProp({ learningRate: 0.02, decay: 1e-5 }) },
  adam: { label: 'Adam', make: () => new Adam({ learningRate: 0.05, decay: 5e-7 }) },
};

interface SpiralTrainingProps {
  /** Which optimizers the reader may choose from. One entry hides the chooser. */
  optimizers?: OptimizerKind[];
  maxSteps?: number;
  stepsPerTick?: number;
}

const BY_CLASS = [0, 1, 2].map((k) => spiralTrain.filter((p) => p.label === k));

/**
 * The full training loop on the three-arm spiral: forward pass, loss,
 * backward pass, update, repeated. The map shows what the network would
 * answer everywhere; the curve shows the loss falling.
 */
export default function SpiralTraining({ optimizers = ['sgd'], maxSteps = 2000, stepsPerTick = 20 }: SpiralTrainingProps) {
  const [kind, setKind] = useState<OptimizerKind>(optimizers[0]);
  const [resets, setResets] = useState(0);
  const [playing, setPlaying] = useState(false);
  // Bumped after every batch of steps so the display re-reads the trainer.
  const [, setTick] = useState(0);
  const history = useRef<{ x: number; y: number }[]>([]);

  const trainer = useMemo(() => {
    const t = createSpiralTrainer(MAKERS[kind].make(), { hidden: 32 });
    history.current = [{ x: 0, y: t.loss() }];
    return t;
    // `resets` is a deliberate dependency: pressing Reset rebuilds the network from scratch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, resets]);

  const steps = trainer.steps();
  const done = steps >= maxSteps;

  const advance = (count: number) => {
    if (done) {
      setPlaying(false);
      return;
    }
    trainer.run(Math.min(count, maxSteps - steps));
    history.current.push({ x: trainer.steps(), y: trainer.loss() });
    setTick((t) => t + 1);
  };
  useTicker(playing, () => advance(stepsPerTick), 80);

  const loss = history.current[history.current.length - 1].y;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Plot xDomain={SPIRAL_RANGE} yDomain={SPIRAL_RANGE} aspect={1} maxHeight={340} xTicks={4} yTicks={4} label={`Three spiral arms of points, and the regions the network assigns to each class after ${steps} training steps.`}>
          <ClassMap classify={trainer.classify} version={`${kind}-${resets}-${steps}`} cols={40} rows={40} />
          {BY_CLASS.map((points, k) => (
            <Dots key={k} points={points} fill={SERIES[k]} r={3} />
          ))}
        </Plot>
        <Plot xDomain={[0, maxSteps]} yDomain={[0, 1.25]} xLabel="Training steps" yLabel="Loss" aspect={1} maxHeight={340} xTicks={4} label={`Loss after each batch of training steps. Now ${loss.toFixed(3)}.`}>
          <Polyline points={history.current} strokeWidth={2} />
        </Plot>
      </div>

      <Legend items={[0, 1, 2].map((k) => ({ label: `Class ${k + 1}, and where the network predicts it`, color: SERIES[k], shape: 'dot' as const }))} />

      <Readout
        items={[
          { label: 'Steps', value: String(steps) },
          { label: 'Loss', value: loss.toFixed(3), key: true },
          { label: 'Right on the 300 shown', value: `${(trainer.trainAccuracy() * 100).toFixed(0)}%` },
          { label: 'Right on 300 new points', value: `${(trainer.testAccuracy() * 100).toFixed(0)}%` },
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
            setResets((r) => r + 1);
          }}
          playLabel="Train"
        />
        {optimizers.length > 1 && (
          <Segmented
            label="Optimizer"
            options={optimizers.map((value) => ({ value, label: MAKERS[value].label }))}
            value={kind}
            onChange={(v) => {
              setPlaying(false);
              setKind(v);
            }}
          />
        )}
      </ControlBar>
    </div>
  );
}
