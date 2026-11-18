import { useId, type ReactNode } from 'react';

/** The strip under a plot that holds buttons and sliders. */
export function ControlBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded border border-stone-200 bg-white p-3">
      {children}
    </div>
  );
}

interface SliderProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
  /** Plain-text name for screen readers when `label` is a symbol. */
  ariaLabel?: string;
}

export function Slider({ label, value, min, max, step, onChange, format = String, disabled, ariaLabel }: SliderProps) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <label htmlFor={id} className="shrink-0 font-mono text-[11px] text-stone-500">
        {label}
      </label>
      <input
        id={id}
        type="range"
        className="book-range min-w-20 flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <output htmlFor={id} className="w-14 shrink-0 text-right font-mono text-[11px] font-bold text-stone-900 tabular-nums">
        {format(value)}
      </output>
    </div>
  );
}

interface StepControlsProps {
  playing: boolean;
  onPlayPause: () => void;
  onStep: () => void;
  onReset: () => void;
  /** False when the run has finished. */
  canAdvance?: boolean;
  playLabel?: string;
}

const Icon = ({ d }: { d: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** Run / pause, one step, reset. Used by every figure that animates an algorithm. */
export function StepControls({ playing, onPlayPause, onStep, onReset, canAdvance = true, playLabel = 'Run' }: StepControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn btn-primary btn-small" onClick={onPlayPause} disabled={!canAdvance && !playing}>
        <Icon d={playing ? 'M2 1h3v10H2zM7 1h3v10H7z' : 'M2 1l9 5-9 5z'} />
        {playing ? 'Pause' : playLabel}
      </button>
      <button type="button" className="btn btn-secondary btn-small" onClick={onStep} disabled={playing || !canAdvance}>
        <Icon d="M1 1l6 5-6 5zM8 1h3v10H8z" />
        Step
      </button>
      <button type="button" className="btn btn-secondary btn-small" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

interface ReadoutItem {
  label: string;
  value: string;
  /** Mark the one number the reader should watch. */
  key?: boolean;
}

/** A row of live numbers. Values are text in ink; only the label carries meaning. */
export function Readout({ items }: { items: ReadoutItem[] }) {
  return (
    <dl
      className="grid gap-3 rounded border border-stone-200 bg-white p-3"
      style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 text-center">
          <dt className="mb-1 truncate font-sans text-[9px] tracking-wider text-stone-500 uppercase">{item.label}</dt>
          <dd className={`font-mono text-sm font-bold tabular-nums ${item.key ? 'text-orange-700' : 'text-stone-900'}`}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

/** A small set of mutually exclusive choices. */
export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`btn btn-small ${value === o.value ? 'btn-primary' : 'btn-secondary'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface LegendItem {
  label: string;
  color: string;
  /** How the series is drawn, so identity never depends on colour alone. */
  shape?: 'line' | 'dash' | 'dot';
}

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] text-stone-600">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <svg width="18" height="8" aria-hidden="true">
            {item.shape === 'dot' ? (
              <circle cx="9" cy="4" r="3.5" fill={item.color} />
            ) : (
              <line
                x1="0"
                x2="18"
                y1="4"
                y2="4"
                stroke={item.color}
                strokeWidth="2"
                strokeDasharray={item.shape === 'dash' ? '3 3' : undefined}
              />
            )}
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
