"use client";
import { AnimatePresence, motion } from "motion/react";
import type { Reaction } from "@/lib/reactions";

/** Guests' emoji reactions, floating up the side of the TV with their name. */
export function Reactions({ list }: { list: (Reaction & { id: number })[] }) {
  return (
    <div className="pointer-events-none absolute inset-y-0 end-0 w-[16vw] overflow-hidden" aria-hidden>
      <AnimatePresence>
        {list.map((r) => {
          const x = Math.floor((r.id * 1000) % 70);
          return (
            <motion.div
              key={r.id}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ insetInlineEnd: `${x}%` }}
              initial={{ y: 40, opacity: 0, scale: 0.5 }}
              animate={{ y: "-70vh", opacity: [0, 1, 1, 0], scale: 1, rotate: [0, -10, 10, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: "easeOut" }}
            >
              <span className="text-[min(7vh,6vw)] leading-none">{r.emoji}</span>
              <bdi className="max-w-[12vw] truncate rounded-full bg-ink-900/80 px-2 text-[min(1.8vh,1.6vw)] font-bold text-cream">{r.name}</bdi>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
