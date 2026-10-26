"use client";
import { useEffect, useState } from "react";

/**
 * Re-renders while the current state is younger than `untilMs`, returning
 * how long (ms, server clock) the game has been in this state.
 */
export function useElapsed(msInState: () => number, untilMs: number, key: unknown): number {
  const [elapsed, setElapsed] = useState(() => msInState());
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const e = msInState();
      // Only re-render when something visible could change (every 100ms).
      const bucket = Math.floor(e / 100);
      if (bucket !== last) {
        last = bucket;
        setElapsed(e);
      }
      if (e < untilMs) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [msInState, untilMs, key]);
  return elapsed;
}
