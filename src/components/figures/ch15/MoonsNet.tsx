import { useMemo, useState } from 'react';
import { TOY_RANGE } from '@/data/toy2d';
import { ControlBar, Legend, Readout, Segmented, Slider } from '../core/Controls';
import { COLORS, Dots, Plot, Regions } from '../core/Plot';
import { MOONS, trainMoons } from './shared';

const OPTIONS = [
  { value: 'relu', label: 'With ReLU' },
  { value: 'none', label: 'No activation' },
];

/**
 * A network with one hidden layer, trained from scratch each time a control
 * changes. Without an activation its boundary is a straight line however many
 * neurons it has; with ReLUs the boundary bends to fit the two crescents.
 */
export default function MoonsNet() {
  const [hidden, setHidden] = useState(1);
  const [activation, setActivation] = useState('relu');
  const model = useMemo(() => trainMoons(hidden, activation === 'relu'), [hidden, activation]);

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
          label={`Two crescents of points and the decision regions of a network with ${hidden} hidden neuron${hidden === 1 ? '' : 's'} ${activation === 'relu' ? 'and ReLU activations' : 'and no activation'}. It gets ${(model.trainAccuracy * 100).toFixed(0)} percent right.`}
        >
          <Regions cols={48} rows={48} opacity={(x, y) => (model.probability(x, y) >= 0.5 ? 0.2 : 0)} />
          <Dots points={MOONS.filter((p) => p.label === 1)} r={4} />
          <Dots points={MOONS.filter((p) => p.label === 0)} r={4} hollow />
        </Plot>
      </div>

      <Legend
        items={[
          { label: 'Shaded: called the filled kind', color: COLORS.accent, shape: 'dot' },
          { label: 'Filled and hollow: the two kinds', color: COLORS.ink, shape: 'dot' },
        ]}
      />

      <Readout
        items={[
          { label: 'Hidden neurons', value: String(hidden) },
          { label: 'Right on the 100 shown', value: `${(model.trainAccuracy * 100).toFixed(0)}%`, key: true },
          { label: 'Right on 300 new points', value: `${(model.testAccuracy * 100).toFixed(1)}%` },
        ]}
      />

      <ControlBar>
        <Slider label="Hidden neurons" value={hidden} min={1} max={12} step={1} onChange={setHidden} />
        <Segmented label="Activation in the hidden layer" options={OPTIONS} value={activation} onChange={setActivation} />
      </ControlBar>
    </div>
  );
}
