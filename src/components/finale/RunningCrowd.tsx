"use client";
import { motion } from "motion/react";
import { Figure, RUNNER_COLORS } from "./Figure";

const DEMO = [
  { name: "Noa", emoji: "🦊", avatarUrl: null, to: 78, speed: 1.15 },
  { name: "Ben", emoji: "🐼", avatarUrl: null, to: 64, speed: 1 },
  { name: "Mia", emoji: "🌻", avatarUrl: null, to: 52, speed: 0.9 },
  { name: "Leo", emoji: "🐢", avatarUrl: null, to: 30, speed: 0.7, trip: true },
];

/** Looping demo of the leaderboard race, for the landing page. */
export function RunningCrowd() {
  return (
    <div dir="ltr" className="absolute inset-x-[4%] bottom-[6%] top-[20%] flex flex-col justify-between [container-type:size]">
      {DEMO.map((p, i) => (
        <div key={p.name} className="relative h-[22%] border-b border-dashed border-ink-600">
          <div className="absolute inset-y-0 right-[6%] w-[3px] bg-[repeating-linear-gradient(0deg,var(--color-cream)_0_6px,var(--color-ink-900)_6px_12px)]" />
          <motion.div
            className="absolute bottom-0"
            initial={{ left: "0%" }}
            animate={{ left: ["0%", `${p.to}%`, `${p.to}%`] }}
            transition={{ repeat: Infinity, duration: 5, times: [0, 0.6, 1], ease: "easeOut", delay: i * 0.1 }}
          >
            <Figure player={p} pose={p.trip ? "trip" : "run"} color={RUNNER_COLORS[i]} width="12cqh" enter={false} speed={p.speed} />
          </motion.div>
        </div>
      ))}
    </div>
  );
}
