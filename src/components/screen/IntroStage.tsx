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
        className="mt-[1vh] font-display text-[min(8vh,7vw)] font-black leading-tight text-gold-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        {s.scrIntroLine2(game.birthdayName)}
      </motion.h1>
      <ol className="mt-[5vh] flex flex-col gap-[1.6vh] text-[min(3.2vh,3.4vw)]">
        {s.scrRules.map((rule, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.8 + i * 0.45, type: "spring", stiffness: 220, damping: 16 }}
            className="card flex items-center gap-[1.4vw] rounded-[2vh] px-[2vw] py-[1.6vh] text-start"
          >
            <span className={`tile tile-${i} flex h-[6vh] w-[6vh] shrink-0 items-center justify-center rounded-[1.4vh] font-display text-[3.4vh] font-black`}>
              {i + 1}
            </span>
            <span className="font-bold">{rule}</span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
