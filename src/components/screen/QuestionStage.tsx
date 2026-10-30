"use client";
import { motion } from "motion/react";
import { useAutoFit } from "@/hooks/useAutoFit";
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
  const questionRef = useAutoFit<HTMLDivElement>([round.id, round.text, round.photoUrl], {
    maxVh: 0.075,
    maxVw: 0.06,
    minVh: 0.028,
  });
  // One shared size for all answers, so the grid looks even.
  const optionsRef = useAutoFit<HTMLDivElement>([round.id, round.options.join("|")], {
    maxVh: 0.048,
    maxVw: 0.04,
    minVh: 0.02,
  });

  return (
    <div className="flex h-full flex-col px-[4vw] pb-[11vh] pt-[4vh]">
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

      {/* The screen is split into fixed areas; text shrinks to fit its area. */}
      <div ref={questionRef} className="mt-[2.5vh] flex min-h-0 flex-[1.1] items-stretch gap-[3vw]">
        {/* Animate the box, not the text inside it, so measuring is never thrown off. */}
        <motion.div
          data-fit
          className="flex min-w-0 flex-1 items-center overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display font-bold leading-[1.15] [overflow-wrap:anywhere]" style={{ fontSize: "var(--fit)" }}>
            {round.text}
          </h1>
        </motion.div>
        {round.photoUrl && (
          // Shown whole (object-contain): family photos are never cropped or altered.
          <div className="hidden min-h-0 w-[38%] shrink-0 items-center justify-center md:flex">
            <motion.img
              src={round.photoUrl}
              alt=""
              className="max-h-full max-w-full rounded-[3vh] object-contain shadow-2xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            />
          </div>
        )}
      </div>

      <div
        ref={optionsRef}
        className="mt-[2.5vh] grid min-h-0 flex-1 grid-cols-2 gap-[2vh]"
        style={{ gridTemplateRows: `repeat(${Math.ceil(round.options.length / 2)}, minmax(0, 1fr))` }}
      >
        {round.options.map((opt, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: open ? 1 : 0.55, y: 0 }}
            transition={{ delay: 0.35 + i * 0.08 }}
            className={`flex min-h-0 min-w-0 items-center gap-[1.5vw] rounded-[2.5vh] border-2 border-ink-600 bg-ink-850 px-[2vw] py-[1.2vh] ${
              round.options.length % 2 === 1 && i === round.options.length - 1 ? "col-span-2" : ""
            }`}
          >
            <span className="flex h-[6vh] w-[6vh] shrink-0 items-center justify-center rounded-full border-2 border-gold font-display text-[3.2vh] text-gold">
              {OPTION_MARKS[i]}
            </span>
            <div data-fit className="flex h-full min-w-0 flex-1 items-center overflow-hidden">
              <span className="font-bold leading-tight [overflow-wrap:anywhere]" style={{ fontSize: "var(--fit)" }}>
                {opt}
              </span>
            </div>
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
