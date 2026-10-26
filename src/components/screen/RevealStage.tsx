"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useElapsed } from "@/hooks/useElapsed";
import { burst } from "@/lib/confetti";
import type { SoundName } from "@/lib/sound";
import type { Strings } from "@/lib/strings";
import { OPTION_MARKS, REVEAL_ANSWER_MS, REVEAL_COUNT_MS, REVEAL_COUNTDOWN_MS } from "@/lib/timing";
import type { ScreenSnapshot } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { Portrait } from "../ui/Portrait";

/** 3-2-1, then her answer(s) with her photo, then how many knew her. */
export function RevealStage({
  snap,
  s,
  msInState,
  sound,
}: {
  snap: ScreenSnapshot;
  s: Strings;
  msInState: () => number;
  sound: (n: SoundName) => void;
}) {
  const { game, players } = snap;
  const round = snap.round!;
  const reveal = round.reveal;
  const elapsed = useElapsed(msInState, REVEAL_COUNT_MS + 100, game.stateChangedAt);

  const counting = elapsed < REVEAL_COUNTDOWN_MS;
  const showAnswer = elapsed >= REVEAL_ANSWER_MS;
  const showCount = elapsed >= REVEAL_COUNT_MS;
  const n = Math.max(1, Math.ceil((REVEAL_COUNTDOWN_MS - elapsed) / 1000));

  // Sounds and confetti fire once each, only if we are watching it happen live.
  const fired = useRef<Set<string>>(new Set());
  const once = (k: string, fn: () => void) => {
    if (!fired.current.has(k)) {
      fired.current.add(k);
      fn();
    }
  };
  const live = useRef(elapsed < REVEAL_COUNTDOWN_MS);
  useEffect(() => {
    if (!live.current) return;
    if (counting) once(`tick${n}`, () => sound("tick"));
    if (showAnswer) once("reveal", () => sound("reveal"));
    if (showCount && reveal && reveal.correctCount > 0) once("confetti", () => burst(1.2));
  });

  if (!reveal) return null;
  const correctPlayers = players.filter((p) => reveal.correctPlayerIds.includes(p.id));

  return (
    <div className="flex h-full flex-col items-center justify-center px-[5vw] text-center">
      <p className="absolute top-[4vh] text-[min(3vh,3.4vw)] font-bold text-gold">
        {s.questionOf(round.index + 1, game.totalRounds)}
      </p>
      <h2 className="absolute top-[9vh] max-w-[80vw] font-display text-[min(4vh,4vw)] text-mute">{round.text}</h2>

      <AnimatePresence mode="wait">
        {counting ? (
          <motion.span
            key={`n${n}`}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            className="font-display text-[min(36vh,30vw)] font-black leading-none text-gold"
            aria-live="assertive"
          >
            {n}
          </motion.span>
        ) : (
          <motion.div
            key="answer"
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: showAnswer ? 1 : 0 }}
          >
            <div className="flex items-center gap-[3vw]">
              <motion.div
                initial={{ scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
              >
                <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(26vh, 26vw)" />
              </motion.div>
              <div className="flex flex-col items-start gap-[1.5vh]">
                <p className="font-display text-[min(4vh,4vw)] text-mute">{s.scrHerAnswer}</p>
                {reveal.birthdayChoices.map((c, i) => (
                  <motion.div
                    key={c}
                    initial={{ x: 60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 220, damping: 18 }}
                    className="flex items-center gap-[1.2vw] rounded-[2.5vh] bg-gold px-[2.4vw] py-[1.6vh] text-ink-950 shadow-[0_0_80px_-10px_rgb(214_176_107/0.7)]"
                  >
                    <span className="flex h-[6vh] w-[6vh] items-center justify-center rounded-full border-2 border-ink-950 font-display text-[3.2vh]">
                      {OPTION_MARKS[c]}
                    </span>
                    <span className="font-display text-[min(6.5vh,5.5vw)] font-bold leading-tight">{round.options[c]}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-[6vh] min-h-[16vh]">
              {showCount && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-[2vh]">
                  <p className="font-display text-[min(6vh,5.5vw)] font-bold text-cream" role="status">
                    {reveal.correctCount === 0 && reveal.answeredCount > 0
                      ? s.scrNobodyKnew
                      : s.scrKnewHer(reveal.correctCount, reveal.answeredCount)}
                  </p>
                  <div className="flex flex-wrap justify-center gap-[1vw]">
                    {correctPlayers.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 400, damping: 18 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <Avatar player={p} size={64} ring className="!h-[min(7vh,8vw)] !w-[min(7vh,8vw)]" />
                        <bdi className="max-w-[10vw] truncate text-[min(2vh,2.4vw)] font-bold">{p.name}</bdi>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
