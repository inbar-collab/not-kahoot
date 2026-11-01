"use client";
import { motion } from "motion/react";
import { template } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";

// Fixed positions so every TV shows the same picture (no Math.random in render).
const SPOTS = [
  [4, 0.0], [14, 3.1], [24, 6.3], [36, 1.7], [47, 8.2], [58, 4.4],
  [69, 9.6], [79, 2.5], [89, 7.1], [96, 5.2], [31, 11.0], [63, 12.4],
];

/** The template's emoji drifting slowly up the screen, behind everything. */
export function Decor({ id, density = 1 }: { id: TemplateId; density?: number }) {
  const emoji = template(id).decor;
  const spots = SPOTS.slice(0, Math.round(SPOTS.length * density));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {spots.map(([x, delay], i) => (
        <motion.span
          key={i}
          className="absolute bottom-0 text-[min(5vh,5vw)] opacity-0"
          style={{ left: `${x}%` }}
          animate={{ y: ["10vh", "-110vh"], opacity: [0, 0.32, 0.32, 0], rotate: [0, i % 2 ? 25 : -25] }}
          transition={{ repeat: Infinity, duration: 14 + (i % 4) * 2.5, delay, ease: "linear" }}
        >
          {emoji[i % emoji.length]}
        </motion.span>
      ))}
    </div>
  );
}
