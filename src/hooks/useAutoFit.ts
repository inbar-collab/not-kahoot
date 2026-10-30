"use client";
import { useLayoutEffect, useRef } from "react";

/**
 * Shrinks text until it fits. Every element marked `data-fit` inside the
 * container is a box with a fixed size (set by the layout) and
 * `overflow: hidden`; its text uses `font-size: var(--fit)`. The hook finds
 * the largest font size (between min and max, as fractions of the viewport
 * height) at which every box fits its content, so all boxes in one group
 * share one size and nothing is ever cut off or pushed off screen.
 */
export function useAutoFit<T extends HTMLElement>(
  deps: unknown[],
  { maxVh, minVh, maxVw }: { maxVh: number; minVh: number; maxVw?: number },
) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const fits = () =>
      Array.from(root.querySelectorAll<HTMLElement>("[data-fit]")).every(
        (box) => box.scrollHeight <= box.clientHeight + 1 && box.scrollWidth <= box.clientWidth + 1,
      );

    const fit = () => {
      const h = window.innerHeight;
      const w = window.innerWidth;
      let hi = Math.min(h * maxVh, maxVw ? w * maxVw : Infinity);
      let lo = Math.min(h * minVh, hi);
      root.style.setProperty("--fit", `${hi}px`);
      if (fits()) return;
      // Binary search to within half a pixel.
      while (hi - lo > 0.5) {
        const mid = (hi + lo) / 2;
        root.style.setProperty("--fit", `${mid}px`);
        if (fits()) lo = mid;
        else hi = mid;
      }
      root.style.setProperty("--fit", `${lo}px`);
    };

    fit();
    // Refit when the window resizes or web fonts finish loading.
    const ro = new ResizeObserver(() => fit());
    ro.observe(root);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass the content that affects size
  }, deps);

  return ref;
}
