import { useState } from 'react';
import { ControlBar, Readout } from '../core/Controls';

const X = 2;
const TARGET = 5;
const RATE = 0.05;
const START = { w: 0.5, b: 0.5 };

/** One forward and backward pass through a single neuron, for given weights. */
export function neuronPass(w: number, b: number) {
  const z = w * X + b;
  const a = Math.max(0, z);
  const loss = (a - TARGET) ** 2;
  const dA = 2 * (a - TARGET);
  const dZ = dA * (z > 0 ? 1 : 0);
  const dW = dZ * X;
  const dB = dZ;
  return { z, a, loss, dA, dZ, dW, dB };
}

const STEPS = [
  'Start: an input, a weight, a bias and a target.',
  'Forward: multiply the input by the weight and add the bias.',
  'Forward: apply the ReLU.',
  'Forward: measure the loss, the squared distance from the target.',
  'Backward: how does the loss change if the output changes? 2 × (output − target).',
  'Backward through the ReLU: its slope is 1 here, so the gradient passes straight through.',
  'Backward through the sum: the weight gets gradient × input, the bias gets the gradient as it is.',
  'Update: move the weight and the bias a small step against their gradients.',
];

interface NodeProps {
  name: string;
  value?: number;
  gradient?: number;
  kind?: 'value' | 'op' | 'param';
  note?: string;
}

function Node({ name, value, gradient, kind = 'value', note }: NodeProps) {
  const tone =
    kind === 'op' ? 'border-stone-900 bg-stone-900 text-white' : kind === 'param' ? 'border-orange-600 bg-orange-50 text-stone-900' : 'border-stone-300 bg-white text-stone-900';
  return (
    <div className={`min-w-0 flex-1 rounded border p-2 text-center ${tone}`}>
      <div className={`font-mono text-[10px] tracking-wider uppercase ${kind === 'op' ? 'text-stone-300' : 'text-stone-500'}`}>{name}</div>
      <div className="font-mono text-sm font-bold tabular-nums sm:text-base">{value === undefined ? '·' : value.toFixed(2)}</div>
      <div className={`font-mono text-[11px] tabular-nums ${kind === 'op' ? 'text-orange-300' : 'text-orange-700'}`}>
        {gradient === undefined ? ' ' : `grad ${gradient.toFixed(2)}`}
      </div>
      {note && <div className={`font-sans text-[9px] leading-tight ${kind === 'op' ? 'text-stone-400' : 'text-stone-400'}`}>{note}</div>}
    </div>
  );
}

const Arrow = () => (
  <span aria-hidden="true" className="shrink-0 text-center font-mono leading-none text-stone-400">
    <span className="sm:hidden">↓</span>
    <span className="hidden sm:inline">→</span>
  </span>
);

/**
 * Backpropagation on the smallest possible network: one input, one weight,
 * one bias, a ReLU and a squared-error loss. The reader steps forward to the
 * loss, backward to the gradients, applies the update, and goes round again.
 */
export default function BackwardSteps() {
  const [params, setParams] = useState(START);
  const [step, setStep] = useState(0);
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState<number[]>([]);

  const pass = neuronPass(params.w, params.b);
  const show = (from: number, v: number) => (step >= from ? v : undefined);

  const next = () => {
    if (step < 7) {
      if (step === 2) setHistory((h) => [...h, pass.loss]);
      setStep(step + 1);
      return;
    }
    setParams({ w: params.w - RATE * pass.dW, b: params.b - RATE * pass.dB });
    setStep(0);
    setRound((r) => r + 1);
  };

  const label = step === 7 ? 'Apply the update and go again' : step === 0 ? 'Start the forward pass' : step < 3 ? 'Next forward step' : step === 3 ? 'Start the backward pass' : 'Next backward step';

  return (
    <div className="space-y-3">
      <div
        className="space-y-1.5 rounded-lg border border-stone-200 bg-stone-50 p-3 sm:p-4"
        role="img"
        aria-label={`A neuron with weight ${params.w.toFixed(2)} and bias ${params.b.toFixed(2)}, input ${X}, target ${TARGET}. Step ${step} of 7: ${STEPS[step]}`}
      >
        <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <Node name="input x" value={X} />
          <Node name="weight w" value={params.w} gradient={show(6, pass.dW)} kind="param" />
          <Node name="bias b" value={params.b} gradient={show(6, pass.dB)} kind="param" />
        </div>
        <div className="text-center font-mono leading-none text-stone-400" aria-hidden="true">
          ↓
        </div>
        <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <Node name="z = w·x + b" value={show(1, pass.z)} gradient={show(5, pass.dZ)} />
          <Arrow />
          <Node name="ReLU" kind="op" value={show(2, pass.a)} gradient={show(4, pass.dA)} />
          <Arrow />
          <Node name="loss (out − 5)²" value={show(3, pass.loss)} gradient={show(4, 1)} />
        </div>
      </div>

      <p className="min-h-10 rounded border border-stone-200 bg-white p-3 font-sans text-[13px] leading-snug text-stone-700" aria-live="polite">
        <strong className="mr-1 font-mono text-[10px] tracking-widest text-orange-700 uppercase">
          Round {round}, step {step} of 7
        </strong>
        {STEPS[step]}
      </p>

      <Readout
        items={[
          { label: 'Target', value: String(TARGET) },
          { label: 'Output this round', value: step >= 2 ? pass.a.toFixed(2) : '–' },
          { label: 'Loss this round', value: step >= 3 ? pass.loss.toFixed(2) : '–', key: true },
          { label: 'Loss in earlier rounds', value: history.slice(0, step >= 3 ? -1 : undefined).slice(-4).map((l) => l.toFixed(2)).join(' → ') || '–' },
        ]}
      />

      <ControlBar>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary btn-small" onClick={next}>
            {label}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              setParams(START);
              setStep(0);
              setRound(1);
              setHistory([]);
            }}
          >
            Reset
          </button>
        </div>
        <span className="font-mono text-[10px] text-stone-500">Learning rate {RATE}</span>
      </ControlBar>
    </div>
  );
}
