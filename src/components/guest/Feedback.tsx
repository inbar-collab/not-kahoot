"use client";
import { motion } from "motion/react";

/** Gold "+1" medal for a correct guess (a check mark on the practice question). */
export function CorrectBadge({ label = "+1" }: { label?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.3, rotate: -12, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 12 }}
      className="flex h-36 w-36 items-center justify-center rounded-full bg-gold text-ink-950 shadow-[0_0_80px_-10px_color-mix(in_oklab,var(--color-gold)_80%,transparent)]"
    >
      <bdi dir="ltr" className="font-display text-6xl font-black">{label}</bdi>
    </motion.div>
  );
}

/** A gentle, slightly funny sad face with one rolling tear. */
export function SadFace() {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className="h-36 w-36"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1, rotate: [0, -4, 4, -2, 0] }}
      transition={{ duration: 1.2, rotate: { delay: 0.4, duration: 1.4 } }}
      aria-hidden
    >
      <circle cx="60" cy="60" r="54" style={{ fill: "var(--color-ink-700)", stroke: "var(--color-mute)" }} strokeWidth="3" />
      {/* eyebrows tilted up in the middle */}
      <path d="M32 40 L50 34" style={{ stroke: "var(--color-cream)" }} strokeWidth="4" strokeLinecap="round" />
      <path d="M88 40 L70 34" style={{ stroke: "var(--color-cream)" }} strokeWidth="4" strokeLinecap="round" />
      <circle cx="43" cy="52" r="5" style={{ fill: "var(--color-cream)" }} />
      <circle cx="77" cy="52" r="5" style={{ fill: "var(--color-cream)" }} />
      {/* wobbly frown */}
      <motion.path
        d="M40 88 Q60 72 80 88"
        fill="none"
        style={{ stroke: "var(--color-cream)" }}
        strokeWidth="4.5"
        strokeLinecap="round"
        animate={{ d: ["M40 88 Q60 72 80 88", "M40 86 Q60 76 80 86", "M40 88 Q60 72 80 88"] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      />
      {/* a single tear rolling down */}
      <motion.path
        d="M80 60 q4 7 0 10 q-4 -3 0 -10z"
        style={{ fill: "var(--color-gold-soft)" }}
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: [0, 0, 26], opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, delay: 0.8, times: [0, 0.2, 1], repeatDelay: 0.8 }}
      />
    </motion.svg>
  );
}
