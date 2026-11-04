"use client";
import confetti from "canvas-confetti";
import { template } from "./templates";
import type { TemplateId } from "./types";

// Celebrations in the current template's own style: a birthday fires
// sprinkle cannons, a wedding rains petals, a bar mitzvah sets off
// fireworks, a baby shower blows bubbles, an anniversary bursts into
// hearts, a party strobes neon, kids launch a rocket into a star shower.
// Every burst also tells the page's <Ambient> layer to play its matching
// on-screen moment (balloon release, foil shine, rocket, strobe…).

let current: TemplateId | undefined;
export function setConfettiTemplate(id: TemplateId | undefined) {
  current = id;
}

export const MOMENT_EVENT = "eq:moment";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Shapes are made lazily (they need a canvas) and cached.
const cache = new Map<string, confetti.Shape>();
function path(key: string, d: string): confetti.Shape | "circle" {
  if (!cache.has(key)) {
    try {
      cache.set(key, confetti.shapeFromPath({ path: d }));
    } catch {
      return "circle";
    }
  }
  return cache.get(key)!;
}
function emoji(e: string, scalar = 2): confetti.Shape | "circle" {
  const key = `e:${e}:${scalar}`;
  if (!cache.has(key)) {
    try {
      cache.set(key, confetti.shapeFromText({ text: e, scalar }));
    } catch {
      return "circle";
    }
  }
  return cache.get(key)!;
}
const HEART = "M10 18s-8-5.2-8-10.4C2 4.4 4.4 2 7.2 2c1.4 0 2.4.7 2.8 1.6C10.4 2.7 11.4 2 12.8 2 15.6 2 18 4.4 18 7.6 18 12.8 10 18 10 18z";
const PETAL = "M10 0C16 5 18 12 10 20 2 12 4 5 10 0z";
const STAR = "M10 0l2.9 6.6 7.1.7-5.4 4.8 1.6 7L10 15.4 3.8 19.1l1.6-7L0 7.3l7.1-.7z";
const SPRINKLE = "M0 1.5a1.5 1.5 0 0 1 1.5-1.5h9a1.5 1.5 0 0 1 0 3h-9A1.5 1.5 0 0 1 0 1.5z";

const fire = (o: confetti.Options) => void confetti({ disableForReducedMotion: true, ...o });
const later = (ms: number, fn: () => void) => window.setTimeout(fn, ms);

function recipe(id: TemplateId | undefined, scale: number) {
  const t = template(id);
  const colors = t.confetti.colors;
  const n = (k: number) => Math.max(8, Math.round(k * scale));
  switch (id) {
    case "wedding": {
      // Petals drifting down across the whole width, plus a little gold dust.
      const petals = [path("petal", PETAL)];
      for (let i = 0; i < 6; i++) {
        later(i * 160, () =>
          fire({ particleCount: n(14), angle: 270, spread: 160, startVelocity: 6, gravity: 0.35, drift: i % 2 ? 0.8 : -0.8, ticks: 420, scalar: 1.6, origin: { x: 0.1 + i * 0.16, y: -0.1 }, colors, shapes: petals }),
        );
      }
      fire({ particleCount: n(40), spread: 100, startVelocity: 26, gravity: 0.6, ticks: 160, scalar: 0.5, origin: { y: 0.55 }, colors: ["#e8cd96", "#fff6e0", "#c9a467"], shapes: ["circle"] });
      return;
    }
    case "mitzvah": {
      // Fireworks: round bursts popping one after another.
      const spots = [[0.25, 0.3], [0.72, 0.25], [0.5, 0.18], [0.15, 0.45], [0.85, 0.42]];
      spots.slice(0, scale >= 1 ? 5 : 3).forEach(([x, y], i) =>
        later(i * 260, () =>
          fire({ particleCount: n(55), spread: 360, startVelocity: 26, gravity: 0.7, decay: 0.92, ticks: 130, scalar: 0.9, origin: { x, y }, colors: i % 2 ? colors : ["#f3d48a", "#e8b64c", "#fff"], shapes: ["circle", path("star", STAR)] }),
        ),
      );
      return;
    }
    case "baby_shower": {
      // Soap bubbles floating up from below.
      for (const x of [0.2, 0.5, 0.8]) {
        fire({ particleCount: n(16), angle: 90, spread: 70, startVelocity: 32, gravity: -0.12, ticks: 260, scalar: 2.4, origin: { x, y: 1.05 }, colors, shapes: ["circle"] });
      }
      fire({ particleCount: n(10), spread: 90, startVelocity: 30, origin: { y: 0.6 }, scalar: 1.2, shapes: t.confetti.emoji.map((e) => emoji(e)), colors });
      return;
    }
    case "anniversary": {
      // A heart burst, then champagne bubbles rising.
      fire({ particleCount: n(60), spread: 110, startVelocity: 38, gravity: 0.7, ticks: 220, scalar: 1.8, origin: { y: 0.55 }, colors: ["#b3214f", "#e46a8a", "#f5dcb0", "#fff"], shapes: [path("heart", HEART)] });
      later(300, () =>
        fire({ particleCount: n(50), angle: 90, spread: 50, startVelocity: 25, gravity: -0.2, ticks: 220, scalar: 0.55, origin: { x: 0.5, y: 1.05 }, colors: ["#f5dcb0", "#fff3dc", "#e9c58a"], shapes: ["circle"] }),
      );
      return;
    }
    case "party": {
      // Neon cannons from all four corners, in quick succession.
      const corners: [number, number, number][] = [[0, 1, 60], [1, 1, 120], [0, 0.1, -30], [1, 0.1, 210]];
      corners.forEach(([x, y, angle], i) =>
        later(i * 120, () =>
          fire({ particleCount: n(45), angle, spread: 55, startVelocity: 60, ticks: 170, scalar: 1.1, origin: { x, y }, colors: ["#ff2fb4", "#2ff3e0", "#ffe14f", "#9b5bff"], shapes: ["square", "circle"] }),
        ),
      );
      return;
    }
    case "kids": {
      // Rocket exhaust shooting up, then a star shower at the top.
      fire({ particleCount: n(50), angle: 90, spread: 18, startVelocity: 70, gravity: 1.2, ticks: 120, scalar: 1, origin: { x: 0.5, y: 1.05 }, colors: ["#ffb627", "#ff5a3c", "#ffd36b"], shapes: ["circle"] });
      later(650, () =>
        fire({ particleCount: n(90), spread: 360, startVelocity: 30, gravity: 0.5, ticks: 200, scalar: 1.4, origin: { x: 0.5, y: 0.25 }, colors: ["#ffd36b", "#fff", "#19b8ff", "#a35cff"], shapes: [path("star", STAR), emoji("⭐", 1.6)] }),
      );
      return;
    }
    case "kids_birthday": {
      // A piñata: a big pop in the middle, then a second wave of treats.
      const treats = [path("star", STAR), "circle" as const, ...t.confetti.emoji.map((e) => emoji(e))];
      fire({ particleCount: n(90), spread: 120, startVelocity: 48, origin: { y: 0.55 }, scalar: 1.4, colors, shapes: treats });
      later(260, () => fire({ particleCount: n(50), spread: 160, startVelocity: 36, origin: { y: 0.5 }, scalar: 1.1, colors, shapes: treats }));
      return;
    }
    default: {
      // Birthday (and the site): sprinkle cannons from both bottom corners.
      const sprinkles = [path("sprinkle", SPRINKLE), "circle" as const];
      const palette = id === "birthday" ? ["#ff3b5c", "#7a4dff", "#ffc21a", "#10c79a", "#ffffff"] : ["#ff4d6d", "#3d5afe", "#ffbe0b", "#00b386"];
      for (const [x, angle] of [[0, 62], [1, 118]] as const) {
        fire({ particleCount: n(70), angle, spread: 50, startVelocity: 62, ticks: 220, scalar: 1.5, origin: { x, y: 1 }, colors: palette, shapes: sprinkles });
      }
      later(220, () => fire({ particleCount: n(24), spread: 90, startVelocity: 34, origin: { y: 0.6 }, scalar: 1.2, shapes: t.confetti.emoji.map((e) => emoji(e)), colors: palette }));
    }
  }
}

function moment(scale: number) {
  window.dispatchEvent(new CustomEvent(MOMENT_EVENT, { detail: { scale } }));
}

/** One celebration in the template's style. */
export function burst(scale = 1) {
  if (reduced()) return;
  recipe(current, scale);
  moment(scale);
}

/** A longer celebration (the finale): the template's burst, repeated. */
export function celebrate(durationMs = 2500) {
  if (reduced()) return;
  const rounds = Math.max(1, Math.round(durationMs / 1100));
  for (let i = 0; i < rounds; i++) later(i * 1100, () => recipe(current, 0.8));
  moment(1.4);
}
