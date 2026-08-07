// =============================================================================
// useGameLoop — fixed-clamped requestAnimationFrame loop
// -----------------------------------------------------------------------------
// Calls `cb(dt)` every animation frame (dt in seconds, clamped to avoid spiral
// of death on lag / tab-blur). Pass `paused` to suspend (pause menu, results).
// The callback reads/mutates a world ref; the scene bumps a render tick.
// =============================================================================

import { useEffect, useRef } from "react";

export function useGameLoop(cb: (dt: number) => void, paused: boolean = false): void {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let last = 0;
    let mounted = true;

    const tick = (now: number) => {
      if (!mounted) return;
      if (last === 0) last = now;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05; // clamp to 20fps-min step
      if (dt > 0) cbRef.current(dt);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [paused]);
}
