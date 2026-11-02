"use client";
import { motion } from "motion/react";
import { useAutoFit } from "@/hooks/useAutoFit";
import { roundLabel, type Strings } from "@/lib/strings";
import type { ScreenSnapshot } from "@/lib/types";
import { AnswerShape } from "../ui/AnswerShape";
import { Portrait } from "../ui/Portrait";

/**
 * The question on the TV: a question card on top, the photo (or the star's
 * portrait) in the middle, the four colored answer tiles at the bottom, and a
 * ring counting how many have answered. Never the distribution.
 */
export function QuestionStage({ snap, s }: { snap: ScreenSnapshot; s: Strings }) {
  const { game } = snap;
  const round = snap.round!;
  const open = game.state === "QUESTION_OPEN";
  const waiting = game.state === "WAITING_FOR_BIRTHDAY";
  const questionRef = useAutoFit<HTMLDivElement>([round.id, round.text], { maxVh: 0.07, maxVw: 0.05, minVh: 0.03 });
  // One shared size for all answers, so the tiles look even.
  const optionsRef = useAutoFit<HTMLDivElement>([round.id, round.options.join("|")], { maxVh: 0.05, maxVw: 0.04, minVh: 0.022 });

  return (
    <div className="flex h-full flex-col gap-[2.4vh] px-[3vw] pb-[3vh] pt-[3vh]">
      <QuestionHeader snap={snap} s={s}>
        <AnsweredRing n={round.answeredCount} total={round.eligibleCount} label={s.answeredOf(round.answeredCount, round.eligibleCount)} />
      </QuestionHeader>

      {/* The question card. Text shrinks to fit; the box (not the text) animates. */}
      <div ref={questionRef} className="h-[19vh] shrink-0">
        <motion.div
          data-fit
          className="card flex h-full items-center justify-center overflow-hidden rounded-[3vh] px-[3vw] text-center"
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <h1 className="font-display font-bold leading-[1.15] [overflow-wrap:anywhere]" style={{ fontSize: "var(--fit)" }}>
            {round.text}
          </h1>
        </motion.div>
      </div>

      {/* Photo, or the star with a nudge to answer. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {round.photoUrl ? (
          // Shown whole (object-contain): family photos are never cropped or altered.
          <motion.img
            src={round.photoUrl}
            alt=""
            className="max-h-full max-w-[60%] rounded-[2.5vh] object-contain shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] ring-[0.6vh] ring-white/80"
            initial={{ opacity: 0, scale: 0.92, rotate: -1.5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 160, damping: 18 }}
          />
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-[1.5vh]">
            <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(20vh, 18vw)" />
            <p className="font-display text-[min(3vh,2.6vw)] text-mute">{s.scrAnswerNow}</p>
          </motion.div>
        )}

        {!open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="card absolute bottom-[1vh] flex items-center gap-4 rounded-full px-[2vw] py-[1.2vh]"
            role="status"
          >
            {waiting && (
              <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
                <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(6vh, 64px)" />
              </motion.span>
            )}
            <span className="font-display text-[min(3.2vh,3.2vw)] font-bold text-gold-soft">
              {waiting ? s.scrWaitingBirthday : s.scrVotingClosed}
            </span>
          </motion.div>
        )}
      </div>

      <div
        ref={optionsRef}
        className="grid h-[33vh] shrink-0 grid-cols-2 gap-[1.8vh]"
        style={{ gridTemplateRows: `repeat(${Math.ceil(round.options.length / 2)}, minmax(0, 1fr))` }}
      >
        {round.options.map((opt, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.07, type: "spring", stiffness: 260, damping: 20 }}
            className={`tile tile-${i} flex min-h-0 min-w-0 items-center gap-[1.4vw] rounded-[2.2vh] px-[1.8vw] text-[min(2.6vh,2.4vw)] ${
              open ? "" : "opacity-80"
            } ${round.options.length % 2 === 1 && i === round.options.length - 1 ? "col-span-2" : ""}`}
          >
            <AnswerShape index={i} className="h-[6vh] w-[6vh] shrink-0 drop-shadow" />
            <div data-fit className="flex h-full min-w-0 flex-1 items-center overflow-hidden py-[1vh]">
              <span className="font-bold leading-tight [overflow-wrap:anywhere]" style={{ fontSize: "var(--fit)" }}>
                {opt}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** A ring that fills as guests answer, with the count in the middle. */
function AnsweredRing({ n, total, label }: { n: number; total: number; label: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = total ? n / total : 0;
  return (
    <div className="flex items-center gap-[1vw]" aria-live="polite" aria-label={label}>
      <svg viewBox="0 0 64 64" className="h-[9vh] w-[9vh] -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" style={{ stroke: "var(--color-ink-800)" }} />
        <motion.circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          style={{ stroke: "var(--color-gold)" }}
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - frac) }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </svg>
      <div className="leading-none">
        <motion.span key={n} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="block font-display text-[min(5vh,4.4vw)] font-black tabular-nums">
          {n}
          <span className="text-[0.5em] text-mute">/{total}</span>
        </motion.span>
      </div>
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
    <div className="flex h-[9vh] shrink-0 items-center justify-between gap-4">
      <span className="chip !bg-gold/15 px-[1.4vw] py-[0.8vh] text-[min(2.8vh,3vw)] !text-gold-soft">{roundLabel(s, snap.game.currentIndex, snap.game)}</span>
      {children}
    </div>
  );
}
