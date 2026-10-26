"use client";
import { motion } from "motion/react";

/** Gold "+1" medal for a correct guess. */
export function CorrectBadge() {
  return (
    <motion.div
      initial={{ scale: 0.3, rotate: -12, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 12 }}
      className="flex h-36 w-36 items-center justify-center rounded-full bg-gold text-ink-950 shadow-[0_0_80px_-10px_rgb(214_176_107/0.8)]"
    >
      <span className="font-display text-6xl font-black">+1</span>
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
      <circle cx="60" cy="60" r="54" fill="#2b2b30" stroke="#a7a299" strokeWidth="3" />
      {/* eyebrows tilted up in the middle */}
      <path d="M32 40 L50 34" stroke="#f3eee4" strokeWidth="4" strokeLinecap="round" />
      <path d="M88 40 L70 34" stroke="#f3eee4" strokeWidth="4" strokeLinecap="round" />
      <circle cx="43" cy="52" r="5" fill="#f3eee4" />
      <circle cx="77" cy="52" r="5" fill="#f3eee4" />
      {/* wobbly frown */}
      <motion.path
        d="M40 88 Q60 72 80 88"
        fill="none"
        stroke="#f3eee4"
        strokeWidth="4.5"
        strokeLinecap="round"
        animate={{ d: ["M40 88 Q60 72 80 88", "M40 86 Q60 76 80 86", "M40 88 Q60 72 80 88"] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      />
      {/* a single tear rolling down */}
      <motion.path
        d="M80 60 q4 7 0 10 q-4 -3 0 -10z"
        fill="#e8cd96"
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: [0, 0, 26], opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, delay: 0.8, times: [0, 0.2, 1], repeatDelay: 0.8 }}
      />
    </motion.svg>
  );
}
