import { useMemo, useState } from 'react';
import { mixed } from '@/data/svm-points';
import { toLabels, toRows, TOY_RANGE } from '@/data/toy2d';
import { svmAccuracy, trainSvm } from '@/lib/svm';
import { ControlBar, Legend, Readout, Slider } from '../core/Controls';
import { COLORS, Plot } from '../core/Plot';
import { ClassDots, Street, SupportRings } from './shared';

const X = toRows(mixed);
const Y = toLabels(mixed);
const formatC = (c: number) => (c >= 1 ? c.toFixed(0) : c >= 0.01 ? c.toFixed(2) : c.toFixed(3));

/** Overlapping groups, and a dial for how much the SVM minds points inside its street. */
export default function SoftMargin() {
  const [exponent, setExponent] = useState(0);
  const C = 10 ** exponent;
  const model = useMemo(() => trainSvm(X, Y, { C }), [C]);

  const inside = X.filter((x) => Math.abs(model.decision(x)) < 1 - 1e-6).length;
  const wrong = Math.round((1 - svmAccuracy(model, X, Y)) * X.length);

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
          label={`Two overlapping groups. With C = ${formatC(C)} the street is ${model.marginWidth!.toFixed(2)} wide, ${inside} points are inside it and ${wrong} are on the wrong side.`}
        >
          <Street w={model.w!} b={model.b} />
          <SupportRings points={mixed} support={model.support} />
          <ClassDots points={mixed} r={4} />
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'Boundary and street edges', color: COLORS.accent, shape: 'line' },
          { label: 'Ringed: support vector', color: COLORS.accent, shape: 'dot' },
        ]}
      />

      <Readout
        items={[
          { label: 'Cost of a violation (C)', value: formatC(C) },
          { label: 'Street width', value: model.marginWidth!.toFixed(2), key: true },
          { label: 'Points inside the street', value: String(inside) },
          { label: 'On the wrong side', value: String(wrong) },
        ]}
      />

      <ControlBar>
        <Slider label="C" value={exponent} min={-3} max={2} step={0.25} onChange={setExponent} format={(e) => formatC(10 ** e)} />
      </ControlBar>
    </div>
  );
}
