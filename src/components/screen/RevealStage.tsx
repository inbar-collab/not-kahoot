"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAutoFit } from "@/hooks/useAutoFit";
import { useElapsed } from "@/hooks/useElapsed";
import { burst } from "@/lib/confetti";
import type { SoundName } from "@/lib/sound";
import { pick, roundLabel, type Strings } from "@/lib/strings";
import { REVEAL_ANSWER_MS, REVEAL_COUNT_MS, REVEAL_COUNTDOWN_MS } from "@/lib/timing";
import type { ScreenSnapshot } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { AnswerShape } from "../ui/AnswerShape";
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
    <div className="flex h-full flex-col items-center justify-center px-[5vw] pb-[3vh] pt-[18vh] text-center">
      <p className="absolute top-[4vh] text-[min(3vh,3.4vw)] font-bold text-gold">
        {roundLabel(s, round.index, game)}
      </p>
      <h2 className="absolute top-[9vh] line-clamp-2 max-w-[80vw] font-display text-[min(4vh,4vw)] font-bold leading-tight text-mute">
        {round.text}
      </h2>

      <AnimatePresence mode="wait">
        {counting ? (
          <motion.div
            key={`n${n}`}
            className="relative flex h-[44vh] w-[44vh] items-center justify-center"
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <motion.span
              className="absolute inset-0 rounded-full border-[1.4vh] border-gold"
              initial={{ scale: 0.8, opacity: 0.9 }}
              animate={{ scale: 1.25, opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
            <span className="absolute inset-[6%] rounded-full bg-gold/15 ring-[1vh] ring-gold/40" />
            <span className="relative font-display text-[min(30vh,26vw)] font-black leading-none text-gold" aria-live="assertive">
              {n}
            </span>
          </motion.div>
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
              <HerAnswers options={round.options} choices={reveal.birthdayChoices} label={s.scrHerAnswer} />
            </div>

            <div className="mt-[4vh] min-h-[16vh]">
              {showCount && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-[2vh]">
                  <p className="font-display text-[min(6vh,5.5vw)] font-bold text-cream" role="status">
                    {reveal.correctCount === 0 && reveal.answeredCount > 0
                      ? s.scrNobodyKnew
                      : s.scrKnewHer(reveal.correctCount, reveal.answeredCount)}
                  </p>
                  {reveal.answeredCount > 0 && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 12 }}
                      className="font-display text-[min(3.4vh,3.2vw)] text-gold-soft"
                    >
                      {quip(s, reveal.correctCount, reveal.answeredCount, round.index)}
                    </motion.p>
                  )}
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

/** A cheeky one-liner that fits how the room did. Same line on every refresh. */
function quip(s: Strings, correct: number, answered: number, seed: number): string {
  const ratio = correct / answered;
  const list = ratio === 1 ? s.scrQuipAll : correct === 0 ? s.scrQuipNone : ratio <= 0.34 ? s.scrQuipFew : s.scrQuipMost;
  return pick(list, seed);
}

/** Her answer(s) as gold cards. The box has a fixed size; long answers shrink to fit. */
function HerAnswers({ options, choices, label }: { options: string[]; choices: number[]; label: string }) {
  const ref = useAutoFit<HTMLDivElement>([options.join("|"), choices.join(",")], {
    maxVh: 0.065,
    maxVw: 0.055,
    minVh: 0.022,
  });
  return (
    <div ref={ref} className="flex h-[34vh] w-[min(58vw,1100px)] min-w-0 flex-col items-start justify-center gap-[1.2vh]">
      <p className="shrink-0 font-display text-[min(4vh,4vw)] text-mute">{label}</p>
      {/* Cards are sized in em, so the whole card (letter, padding, text) scales with the fitted size. */}
      <div
        data-fit
        className={`grid min-h-0 w-full flex-1 content-center items-center gap-[0.5em] overflow-hidden ${
          choices.length > 2 ? "grid-cols-2" : "grid-cols-1 justify-items-start"
        }`}
        style={{ fontSize: "var(--fit)" }}
      >
        {choices.map((c, i) => (
          <motion.div
            key={c}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
            className={`tile tile-${c} flex min-w-0 max-w-full items-center gap-[0.45em] rounded-[0.45em] px-[0.6em] py-[0.3em]`}
          >
            <AnswerShape index={c} className="h-[1.1em] w-[1.1em] shrink-0" />
            <span className="min-w-0 text-start font-display font-bold leading-tight [overflow-wrap:anywhere]">
              {options[c]}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
