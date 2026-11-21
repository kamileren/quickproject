import { useEffect, useId, useState } from 'react';
import { chapterIdFromPath, saveAnswer, savedAnswer } from '@/lib/progress';

export interface CheckpointOption {
  text: string;
  /** Exactly one option per checkpoint is correct. */
  correct?: boolean;
  /** One line shown after the reader picks this option. */
  why: string;
}

interface CheckpointProps {
  question: string;
  options: CheckpointOption[];
  predict?: boolean;
}

/** A single multiple-choice question. The reader can keep trying, and the last answer is remembered. */
export default function CheckpointIsland({ question, options, predict = false }: CheckpointProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const feedbackId = useId();

  // Restored after the first paint, because the saved answer only exists in the browser.
  useEffect(() => {
    const saved = savedAnswer(chapterIdFromPath(location.pathname), question);
    if (saved !== null && saved < options.length) setPicked(saved);
  }, [question, options.length]);

  const pick = (i: number) => {
    setPicked(i);
    saveAnswer(chapterIdFromPath(location.pathname), question, i);
  };
  const chosen = picked === null ? null : options[picked];

  return (
    <div className="my-10 rounded border border-stone-200 bg-stone-50/60 p-6 font-serif">
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <span className="micro-label text-stone-900">{predict ? 'Predict first' : 'Checkpoint'}</span>
        {predict && <span className="font-sans text-xs text-stone-500">Commit to a guess, then use the figure below to check it.</span>}
      </div>
      <p className="mb-4 text-base leading-relaxed text-stone-800">{question}</p>
      <div className="grid gap-2" role="group" aria-label="Answers">
        {options.map((option, i) => {
          const isPicked = picked === i;
          const tone = !isPicked
            ? 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
            : option.correct
              ? 'border-stone-900 bg-stone-900 text-white'
              : 'border-red-600 bg-white text-stone-700';
          return (
            <button
              key={option.text}
              type="button"
              aria-pressed={isPicked}
              aria-describedby={isPicked ? feedbackId : undefined}
              onClick={() => pick(i)}
              className={`flex cursor-pointer items-baseline gap-3 rounded border px-4 py-2.5 text-left text-[15px] leading-snug transition-colors ${tone}`}
            >
              <span className="font-mono text-[10px] font-bold opacity-60">{String.fromCharCode(65 + i)}</span>
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>
      <p id={feedbackId} aria-live="polite" className="mt-4 min-h-6 text-sm leading-relaxed text-stone-600">
        {chosen && (
          <>
            <strong className={chosen.correct ? 'text-orange-700' : 'text-red-600'}>
              {chosen.correct ? 'Correct.' : 'Not quite.'}
            </strong>{' '}
            {chosen.why}
          </>
        )}
      </p>
    </div>
  );
}
