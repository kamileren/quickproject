import { useEffect, useRef } from 'react';

/**
 * Calls `tick` every `ms` while `running` is true. The latest `tick` is
 * always used, so callers do not need to memoise it.
 */
export function useTicker(running: boolean, tick: () => void, ms = 60): void {
  const latest = useRef(tick);
  useEffect(() => {
    latest.current = tick;
  });
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => latest.current(), ms);
    return () => clearInterval(id);
  }, [running, ms]);
}
