"use client";
import confetti from "canvas-confetti";

// Confetti only at moments that matter: a correct answer and the winner.
const GOLD = ["#d6b06b", "#e8cd96", "#f3eee4", "#9f7c3c"];

export function burst(scale = 1) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  void confetti({
    particleCount: Math.round(90 * scale),
    spread: 75,
    startVelocity: 42,
    origin: { y: 0.6 },
    colors: GOLD,
    disableForReducedMotion: true,
  });
}

export function celebrate(durationMs = 2500) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const end = Date.now() + durationMs;
  const frame = () => {
    void confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: GOLD });
    void confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: GOLD });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
