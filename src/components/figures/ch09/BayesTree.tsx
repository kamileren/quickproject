import { useState } from 'react';
import { bayesRule } from '@/lib/bayes';
import { ControlBar, Readout, Slider } from '../core/Controls';

const PEOPLE = 1000;
const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

const Box = ({ count, label, tone = 'plain', width }: { count: number; label: string; tone?: 'plain' | 'hit' | 'alarm' | 'muted'; width?: number }) => {
  const tones = {
    plain: 'border-stone-300 bg-white text-stone-900',
    hit: 'border-stone-900 bg-stone-900 text-white',
    alarm: 'border-orange-600 bg-orange-50 text-stone-900',
    muted: 'border-stone-200 bg-stone-50 text-stone-400',
  };
  return (
    <div className={`min-w-0 rounded border p-2 text-center ${tones[tone]}`} style={width === undefined ? undefined : { flex: `${Math.max(width, 0.12)} 1 0` }}>
      <div className="font-mono text-base font-bold tabular-nums sm:text-lg">{count}</div>
      <div className="font-sans text-[10px] leading-tight sm:text-[11px]">{label}</div>
    </div>
  );
};

/**
 * Bayes' rule by counting people. A thousand people take a test; the reader
 * sets how common the illness is and how good the test is, and reads off what
 * a positive result really means.
 */
export default function BayesTree() {
  const [prior, setPrior] = useState(0.1);
  const [sensitivity, setSensitivity] = useState(0.9);
  const [falseAlarm, setFalseAlarm] = useState(0.09);

  const ill = Math.round(PEOPLE * prior);
  const healthy = PEOPLE - ill;
  const truePositives = Math.round(ill * sensitivity);
  const falsePositives = Math.round(healthy * falseAlarm);
  const positives = truePositives + falsePositives;
  const posterior = bayesRule(prior, sensitivity, falseAlarm);
  // Column widths hint at the proportions but never get too narrow to read.
  const illWidth = Math.min(0.5, Math.max(prior, 0.36));

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3 sm:p-4" role="img" aria-label={`Of ${PEOPLE} people, ${ill} are ill and ${truePositives} of them test positive; ${healthy} are healthy and ${falsePositives} of them test positive. So ${pct(posterior)} of positive tests belong to ill people.`}>
        <div className="flex">
          <Box count={PEOPLE} label="people tested" width={1} />
        </div>
        <div className="flex gap-2">
          <Box count={ill} label="really ill" width={illWidth} />
          <Box count={healthy} label="really healthy" width={1 - illWidth} />
        </div>
        <div className="flex gap-2">
          <div className="flex min-w-0 gap-1" style={{ flex: `${illWidth} 1 0` }}>
            <Box count={truePositives} label="test positive" tone="hit" width={1} />
            <Box count={ill - truePositives} label="test negative" tone="muted" width={1} />
          </div>
          <div className="flex min-w-0 gap-1" style={{ flex: `${1 - illWidth} 1 0` }}>
            <Box count={falsePositives} label="test positive" tone="alarm" width={1} />
            <Box count={healthy - falsePositives} label="test negative" tone="muted" width={2} />
          </div>
        </div>
        <p className="pt-1 text-center font-sans text-[12px] leading-snug text-stone-600">
          Positive tests: <strong className="text-stone-900">{truePositives}</strong> from ill people +{' '}
          <strong className="text-stone-900">{falsePositives}</strong> from healthy people = {positives}
        </p>
      </div>

      <Readout
        items={[
          { label: 'Before the test: chance of illness', value: pct(prior) },
          { label: 'After a positive test', value: positives === 0 ? '–' : `${truePositives} of ${positives} = ${pct(posterior)}`, key: true },
        ]}
      />

      <ControlBar>
        <Slider label="How common the illness is" value={prior} min={0.01} max={0.5} step={0.01} onChange={setPrior} format={pct} />
      </ControlBar>
      <ControlBar>
        <Slider label="Ill people the test catches" value={sensitivity} min={0.5} max={1} step={0.01} onChange={setSensitivity} format={pct} />
      </ControlBar>
      <ControlBar>
        <Slider label="Healthy people it wrongly flags" value={falseAlarm} min={0.01} max={0.3} step={0.01} onChange={setFalseAlarm} format={pct} />
      </ControlBar>
    </div>
  );
}
