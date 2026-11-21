import { useMemo, useState } from 'react';
import { ringed } from '@/data/svm-points';
import { toLabels, toRows, TOY_RANGE } from '@/data/toy2d';
import { svmAccuracy, trainSvm, type Kernel } from '@/lib/svm';
import { ControlBar, Legend, Readout, Segmented, Slider } from '../core/Controls';
import { COLORS, Plot, Regions } from '../core/Plot';
import { ClassDots, SupportRings } from './shared';

const X = toRows(ringed);
const Y = toLabels(ringed);
const KERNEL_OPTIONS = [
  { value: 'linear', label: 'Straight (linear)' },
  { value: 'rbf', label: 'Similarity (RBF)' },
];
const formatGamma = (g: number) => (g >= 1 ? g.toFixed(1) : g.toFixed(2));

/** One group inside the other: a straight boundary fails, a kernel bends it into a loop. */
export default function KernelRegions() {
  const [kind, setKind] = useState('linear');
  const [exponent, setExponent] = useState(-0.5);
  const gamma = 10 ** exponent;

  const model = useMemo(() => {
    const kernel: Kernel = kind === 'linear' ? { kind: 'linear' } : { kind: 'rbf', gamma };
    return trainSvm(X, Y, { C: 1, kernel });
  }, [kind, gamma]);
  const accuracy = svmAccuracy(model, X, Y);

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
          label={`One group of points surrounded by a ring of the other. The ${kind === 'linear' ? 'straight' : 'kernel'} boundary gets ${(accuracy * 100).toFixed(0)} percent right.`}
        >
          <Regions cols={50} rows={50} opacity={(x, y) => (model.decision([x, y]) >= 0 ? 0.2 : 0)} />
          <SupportRings points={ringed} support={model.support} />
          <ClassDots points={ringed} r={4} />
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'Shaded: would be called filled', color: COLORS.accent, shape: 'dot' },
          { label: 'Ringed: support vector', color: COLORS.accent, shape: 'dot' },
        ]}
      />

      <Readout
        items={[
          { label: 'Boundary', value: kind === 'linear' ? 'straight line' : `RBF, γ = ${formatGamma(gamma)}` },
          { label: 'Points classified correctly', value: `${(accuracy * 100).toFixed(0)}%`, key: true },
          { label: 'Support vectors', value: `${model.support.length} of ${X.length}` },
        ]}
      />

      <ControlBar>
        <Segmented label="Kind of boundary" options={KERNEL_OPTIONS} value={kind} onChange={setKind} />
        <Slider
          label="Reach γ"
          ariaLabel="Kernel width gamma"
          value={exponent}
          min={-2}
          max={1.5}
          step={0.25}
          disabled={kind === 'linear'}
          onChange={setExponent}
          format={(e) => formatGamma(10 ** e)}
        />
      </ControlBar>
    </div>
  );
}
