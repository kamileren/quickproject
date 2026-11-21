import { useId, useMemo, useState } from 'react';
import { messageLabels, messageTokens, tokenize } from '@/data/messages';
import { classifyMessage, trainNaiveBayes } from '@/lib/bayes';
import { ControlBar, Readout, Segmented } from '../core/Controls';
import { Bars, COLORS, HRule, Plot, PlotLabel } from '../core/Plot';

interface SpamScoreProps {
  /** Let the reader turn smoothing off, to see what a single unseen word does. */
  smoothingToggle?: boolean;
  initialText?: string;
  examples?: string[];
}

const LIMIT = 4.5;
const MAX_BARS = 9;
const SMOOTH_OPTIONS = [
  { value: '1', label: 'Smoothing on' },
  { value: '0', label: 'Smoothing off' },
];
const DEFAULT_EXAMPLES = ['free lunch tomorrow', 'claim your free prize now', 'can you call me now'];

/**
 * Naive Bayes on a message the reader types. Each known word is a bar showing
 * how hard it pushes toward spam (up) or normal (down); the pushes add up to
 * the final score.
 */
export default function SpamScore({ smoothingToggle = false, initialText = 'free lunch tomorrow', examples = DEFAULT_EXAMPLES }: SpamScoreProps) {
  const [text, setText] = useState(initialText);
  const [smoothing, setSmoothing] = useState('1');
  const inputId = useId();

  const model = useMemo(() => trainNaiveBayes(messageTokens, messageLabels, Number(smoothing)), [smoothing]);
  const result = useMemo(() => classifyMessage(model, tokenize(text)), [model, text]);

  const shown = result.words.slice(0, MAX_BARS);
  const names = ['start', ...shown.map((w) => w.word)];
  const pushes = [result.priorPush, ...shown.map((w) => w.push)];
  // Infinite pushes are drawn a little short of the edge so their label stays readable.
  const clamp = (v: number) => (Number.isFinite(v) ? Math.max(-LIMIT, Math.min(LIMIT, v)) : Math.sign(v) * (LIMIT - 1));
  const fmt = (v: number) => (v === Infinity ? '+∞' : v === -Infinity ? '−∞' : `${v > 0 ? '+' : ''}${v.toFixed(2)}`);
  const undefinedScore = Number.isNaN(result.score);
  const verdict = undefinedScore ? 'no answer' : result.probability >= 0.5 ? 'spam' : 'normal';

  return (
    <div className="space-y-3">
      <div className="rounded border border-stone-200 bg-white p-3">
        <label htmlFor={inputId} className="mb-1.5 block font-mono text-[11px] text-stone-500">
          Type a message
        </label>
        <input
          id={inputId}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          className="w-full rounded border border-stone-300 bg-stone-50 px-3 py-2 font-mono text-sm text-stone-900 focus:border-orange-600"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {examples.map((example) => (
            <button key={example} type="button" className="btn btn-secondary btn-small normal-case" onClick={() => setText(example)}>
              {example}
            </button>
          ))}
        </div>
      </div>

      <Plot
        xDomain={[-0.6, Math.max(names.length - 0.4, 3.6)]}
        yDomain={[-LIMIT, LIMIT]}
        yLabel="Push toward spam"
        aspect={0.5}
        xTicks={Math.max(names.length, 4)}
        xTickFormat={(v) => (Number.isInteger(v) ? (names[v] ?? '') : '')}
        label={`How each word of the message pushes the verdict. Total score ${undefinedScore ? 'undefined' : fmt(result.score)}, probability of spam ${(result.probability * 100).toFixed(0)} percent.`}
      >
        <HRule at={0} stroke={COLORS.ink} strokeWidth={1} />
        <PlotLabel x={-0.6} y={LIMIT} dx={6} dy={14} fill={COLORS.muted}>
          ↑ more like spam
        </PlotLabel>
        <PlotLabel x={-0.6} y={-LIMIT} dx={6} dy={-6} fill={COLORS.muted}>
          ↓ more like a normal message
        </PlotLabel>
        <Bars bars={[{ x: 0, y: clamp(pushes[0]) }]} fill={COLORS.faint} title={() => `Starting point from how common spam is: ${fmt(pushes[0])}`} />
        <Bars
          bars={shown.map((w, i) => ({ x: i + 1, y: clamp(w.push) }))}
          fill={COLORS.ink}
          title={(b) => `${names[b.x]}: ${fmt(pushes[b.x])}`}
        />
        {pushes.map((p, i) => (
          <PlotLabel key={i} x={i} y={clamp(p)} dx={0} dy={p >= 0 ? -6 : 14} anchor="middle">
            {fmt(p)}
          </PlotLabel>
        ))}
      </Plot>

      <Readout
        items={[
          { label: 'Sum of all pushes', value: undefinedScore ? 'undefined' : fmt(result.score) },
          { label: 'Chance it is spam', value: undefinedScore ? '?' : `${(result.probability * 100).toFixed(result.probability > 0.995 || result.probability < 0.005 ? 1 : 0)}%`, key: true },
          { label: 'Verdict', value: verdict },
          { label: 'Words not in the inbox (ignored)', value: result.unknown.length ? result.unknown.slice(0, 4).join(', ') : 'none' },
        ]}
      />

      {smoothingToggle && (
        <ControlBar>
          <Segmented label="Smoothing" options={SMOOTH_OPTIONS} value={smoothing} onChange={setSmoothing} />
          <span className="font-mono text-[10px] text-stone-500">A bar labelled ∞ is an infinite push: it overrules everything else.</span>
        </ControlBar>
      )}
      {result.words.length > MAX_BARS && <p className="font-mono text-[10px] text-stone-500">Showing the first {MAX_BARS} known words. All of them count toward the score.</p>}
    </div>
  );
}
