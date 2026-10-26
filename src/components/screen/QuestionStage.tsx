"use client";
import { motion } from "motion/react";
import type { Strings } from "@/lib/strings";
import { OPTION_MARKS } from "@/lib/timing";
import type { ScreenSnapshot } from "@/lib/types";
import { Portrait } from "../ui/Portrait";

/** Question text big, answers in a grid, answered counter. Never the distribution. */
export function QuestionStage({ snap, s }: { snap: ScreenSnapshot; s: Strings }) {
  const { game } = snap;
  const round = snap.round!;
  const open = game.state === "QUESTION_OPEN";
  const waiting = game.state === "WAITING_FOR_BIRTHDAY";
  const progress = round.eligibleCount ? round.answeredCount / round.eligibleCount : 0;

  return (
    <div className="flex h-full flex-col px-[4vw] pb-[12vh] pt-[4vh]">
      <QuestionHeader snap={snap} s={s}>
        <div className="flex items-center gap-4">
          <span className="text-[min(3vh,3.4vw)] font-bold tabular-nums" aria-live="polite">
            {s.answeredOf(round.answeredCount, round.eligibleCount)}
          </span>
          <div className="h-[1.2vh] w-[14vw] overflow-hidden rounded-full bg-ink-800">
            <motion.div
              className="h-full rounded-full bg-gold"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      </QuestionHeader>

      <div className={`mt-[3vh] grid flex-1 items-center gap-[3vw] ${round.photoUrl ? "md:grid-cols-[1.4fr_1fr]" : ""}`}>
        <motion.h1
          className="font-display text-[min(7vh,6vw)] font-bold leading-[1.15]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {round.text}
        </motion.h1>
        {round.photoUrl && (
          <motion.img
            src={round.photoUrl}
            alt=""
            className="hidden max-h-[44vh] w-full rounded-[3vh] object-cover shadow-2xl md:block"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          />
        )}
      </div>

      <div className={`mt-[3vh] grid gap-[2vh] ${round.options.length > 2 ? "grid-cols-2" : "grid-cols-2"}`}>
        {round.options.map((opt, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: open ? 1 : 0.55, y: 0 }}
            transition={{ delay: 0.35 + i * 0.08 }}
            className="flex min-h-[11vh] items-center gap-[1.5vw] rounded-[2.5vh] border-2 border-ink-600 bg-ink-850 px-[2vw] py-[1.5vh]"
          >
            <span className="flex h-[6vh] w-[6vh] shrink-0 items-center justify-center rounded-full border-2 border-gold font-display text-[3.2vh] text-gold">
              {OPTION_MARKS[i]}
            </span>
            <span className="text-[min(4vh,3.6vw)] font-bold leading-tight">{opt}</span>
          </motion.div>
        ))}
      </div>

      {!open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-0 bottom-[3vh] mx-auto flex w-fit items-center gap-4 rounded-full border border-gold/50 bg-ink-850/95 px-8 py-3 shadow-2xl"
          role="status"
        >
          {waiting && (
            <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
              <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(6vh, 64px)" />
            </motion.span>
          )}
          <span className="font-display text-[min(3.4vh,3.6vw)] font-bold text-gold-soft">
            {waiting ? s.scrWaitingBirthday : s.scrVotingClosed}
          </span>
        </motion.div>
      )}
    </div>
  );
}

export function QuestionHeader({
  snap,
  s,
  children,
}: {
  snap: ScreenSnapshot;
  s: Strings;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="rounded-full border border-gold/50 px-5 py-1.5 text-[min(3vh,3.4vw)] font-bold text-gold">
        {s.questionOf(snap.game.currentIndex + 1, snap.game.totalRounds)}
      </span>
      {children}
    </div>
  );
}
