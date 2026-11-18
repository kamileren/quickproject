import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Popover } from 'radix-ui';

interface PopProps {
  /** Bold first line of the card: the term or the symbol. */
  heading: string;
  /** The explanation. */
  body: string;
  /** Style the trigger as a maths symbol rather than a word. */
  symbol?: boolean;
  children?: ReactNode;
}

const CLOSE_DELAY_MS = 150;

/**
 * An inline word that explains itself. Opens on hover with a mouse, and on
 * click, tap, Enter or Space for everyone else. A click pins it open until
 * the reader clicks away or presses Escape.
 */
export default function Pop({ heading, body, symbol = false, children }: PopProps) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancelClose = () => clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };
  useEffect(() => cancelClose, []);

  const isMouse = (e: React.PointerEvent) => e.pointerType === 'mouse';

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPinned(false);
      }}
    >
      <Popover.Anchor asChild>
        <button
          type="button"
          className={symbol ? 'pop-trigger is-symbol' : 'pop-trigger'}
          aria-expanded={open}
          aria-haspopup="dialog"
          data-state={open ? 'open' : 'closed'}
          onClick={() => {
            cancelClose();
            const next = !pinned;
            setPinned(next);
            setOpen(next);
          }}
          onPointerEnter={(e) => {
            if (!isMouse(e)) return;
            cancelClose();
            setOpen(true);
          }}
          onPointerLeave={(e) => {
            if (isMouse(e) && !pinned) scheduleClose();
          }}
        >
          {children}
        </button>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={8}
          collisionPadding={12}
          aria-label={`${heading}: definition`}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerEnter={cancelClose}
          onPointerLeave={(e) => {
            if (isMouse(e) && !pinned) scheduleClose();
          }}
          className="z-50 w-72 max-w-[calc(100vw-24px)] rounded border border-stone-900 bg-white p-4 text-left font-serif shadow-2xl"
        >
          <span className="micro-label mb-1.5 block text-orange-600" style={symbol ? { textTransform: 'none', fontSize: 13 } : undefined}>
            {heading}
          </span>
          <span className="block text-[13px] leading-relaxed text-stone-700">{body}</span>
          <Popover.Arrow className="fill-stone-900" width={12} height={6} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
