"use client";
import { motion } from "motion/react";
import type { Strings } from "@/lib/strings";
import type { ScreenSnapshot } from "@/lib/types";
import { Portrait } from "../ui/Portrait";

export function IntroStage({ snap, s }: { snap: ScreenSnapshot; s: Strings }) {
  const { game } = snap;
  return (
    <div className="flex h-full flex-col items-center justify-center px-[6vw] text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(34vh, 40vw)" />
      </motion.div>
      <motion.p
        className="mt-[4vh] font-display text-[min(4.5vh,5vw)] text-mute"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {s.scrIntroLine1}
      </motion.p>
      <motion.h1
        className="mt-[1vh] font-display text-[min(8vh,7vw)] font-bold leading-tight text-gold-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        {s.scrIntroLine2(game.birthdayName)}
      </motion.h1>
      <div className="gold-rule my-[4vh] w-[40vw]" />
      <ol className="flex flex-col gap-[1.6vh] text-[min(3.4vh,3.8vw)]">
        {s.scrRules.map((rule, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.8 + i * 0.5 }}
            className="flex items-center justify-center gap-4"
          >
            <span className="flex h-[5vh] w-[5vh] items-center justify-center rounded-full border-2 border-gold font-display text-gold">
              {i + 1}
            </span>
            {rule}
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
