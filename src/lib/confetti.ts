"use client";
import confetti from "canvas-confetti";
import { template } from "./templates";
import type { TemplateId } from "./types";

// Confetti in the current template's colors, mixed with its emoji.
let current: TemplateId | undefined;
export function setConfettiTemplate(id: TemplateId | undefined) {
  current = id;
}

const shapeCache = new Map<string, confetti.Shape[]>();
function shapes(): confetti.Shape[] | undefined {
  const t = template(current);
  if (!shapeCache.has(t.id)) {
    try {
      shapeCache.set(t.id, [...t.confetti.emoji.map((e) => confetti.shapeFromText({ text: e, scalar: 2 })), "square", "circle"]);
    } catch {
      shapeCache.set(t.id, ["square", "circle"]);
    }
  }
  return shapeCache.get(t.id);
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function burst(scale = 1) {
  if (reduced()) return;
  void confetti({
    particleCount: Math.round(90 * scale),
    spread: 75,
    startVelocity: 42,
    origin: { y: 0.6 },
    colors: template(current).confetti.colors,
    shapes: shapes(),
    scalar: 1.2,
    disableForReducedMotion: true,
  });
}

export function celebrate(durationMs = 2500) {
  if (reduced()) return;
  const end = Date.now() + durationMs;
  const colors = template(current).confetti.colors;
  const s = shapes();
  const frame = () => {
    void confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, shapes: s, scalar: 1.2 });
    void confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, shapes: s, scalar: 1.2 });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
