import { useMemo, useState } from 'react';
import { few } from '@/data/svm-points';
import { toLabels, toRows, TOY_RANGE, type Labelled } from '@/data/toy2d';
import { svmAccuracy, trainSvm } from '@/lib/svm';
import { ControlBar, Legend, Readout } from '../core/Controls';
import { COLORS, DragHandle, Plot } from '../core/Plot';
import { Street, SupportRings } from './shared';

/**
 * Every point can be dragged and the SVM refits instantly. Points away from
 * the street can move freely without changing anything; the ringed support
 * vectors hold the boundary in place.
 */
export default function SupportVectors() {
  const [points, setPoints] = useState<Labelled[]>(few);
  const X = useMemo(() => toRows(points), [points]);
  const Y = useMemo(() => toLabels(points), [points]);
  const model = useMemo(() => trainSvm(X, Y, { C: 1e4 }), [X, Y]);
  const separable = svmAccuracy(model, X, Y) === 1;

  const move = (index: number, x: number, y: number) =>
    setPoints((prev) => prev.map((p, i) => (i === index ? { ...p, x: +x.toFixed(2), y: +y.toFixed(2) } : p)));

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
          label={`Fourteen movable points and the widest street between the two kinds. ${model.support.length} points touch the street and are ringed.`}
        >
          <Street w={model.w!} b={model.b} />
          <SupportRings points={points} support={model.support} />
          {points.map((p, i) => (
            <DragHandle
              key={i}
              x={p.x}
              y={p.y}
              fill={p.label === 1 ? COLORS.ink : COLORS.cool}
              label={`${p.label === 1 ? 'Dark' : 'Blue'} point ${i + 1}${model.support.includes(i) ? ', a support vector' : ''}`}
              onChange={(q) => move(i, q.x, q.y)}
            />
          ))}
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'One kind', color: COLORS.ink, shape: 'dot' },
          { label: 'The other kind', color: COLORS.cool, shape: 'dot' },
          { label: 'Boundary and street edges', color: COLORS.accent, shape: 'line' },
          { label: 'Ringed: support vector', color: COLORS.accent, shape: 'dot' },
        ]}
      />

      <Readout
        items={[
          { label: 'Points', value: String(points.length) },
          { label: 'Support vectors', value: String(model.support.length), key: true },
          { label: 'Street width', value: separable ? model.marginWidth!.toFixed(2) : 'groups overlap' },
        ]}
      />

      <ControlBar>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => setPoints(few)}>
          Reset
        </button>
        <span className="font-mono text-[10px] text-stone-500">Drag any point. Try one far from the street, then a ringed one.</span>
      </ControlBar>
    </div>
  );
}
