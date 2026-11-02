"use client";
import { motion } from "motion/react";
import { useAutoFit } from "@/hooks/useAutoFit";
import type { Strings } from "@/lib/strings";
import type { ScreenSnapshot } from "@/lib/types";
import { AnswerShape } from "../ui/AnswerShape";
import { Avatar } from "../ui/Avatar";
import { Portrait } from "../ui/Portrait";
import { QuestionHeader } from "./QuestionStage";

/**
 * How the room voted: one colored column per answer, rising to its count.
 * The star's answer(s) keep their color and get a ✓ with the star's photo;
 * the others fade back. Voters' faces sit inside each column.
 */
export function ResultsStage({ snap, s }: { snap: ScreenSnapshot; s: Strings }) {
  const { game, players } = snap;
  const round = snap.round!;
  const reveal = round.reveal;
  // Hooks first: they must run on every render.
  const titleRef = useAutoFit<HTMLDivElement>([round.id, round.text], { maxVh: 0.05, maxVw: 0.045, minVh: 0.024 });
  const labelsRef = useAutoFit<HTMLDivElement>([round.id, round.options.join("|")], { maxVh: 0.032, maxVw: 0.022, minVh: 0.016 });
  if (!reveal) return null;
  const max = Math.max(1, ...reveal.distribution);
  const byId = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="flex h-full flex-col gap-[2vh] px-[3vw] pb-[3vh] pt-[3vh]">
      <QuestionHeader snap={snap} s={s}>
        <span className="chip px-[1.4vw] py-[0.8vh] text-[min(2.8vh,3vw)] !text-cream">{s.scrHowVoted}</span>
      </QuestionHeader>
      <div ref={titleRef} className="h-[11vh] shrink-0">
        <div data-fit className="card flex h-full items-center justify-center overflow-hidden rounded-[2.4vh] px-[2vw] text-center">
          <h1 className="font-display font-bold leading-tight [overflow-wrap:anywhere]" style={{ fontSize: "var(--fit)" }}>
            {round.text}
          </h1>
        </div>
      </div>

      <div ref={labelsRef} className="flex min-h-0 flex-1 items-stretch justify-center gap-[2.4vw]">
        {round.options.map((opt, i) => {
          const hers = reveal.birthdayChoices.includes(i);
          const count = reveal.distribution[i];
          const voters = reveal.votersByOption[i].map((id) => byId.get(id)).filter((p) => !!p);
          const h = 6 + (count / max) * 76; // leaves room above for the star's badge
          return (
            <div key={i} className="flex min-w-0 max-w-[22vw] flex-1 flex-col items-center">
              {/* the column, with the star's badge sitting right on top of it */}
              <div className="flex w-full min-h-0 flex-1 flex-col items-center justify-end">
                {hers && (
                  <motion.div
                    className="mb-[1vh] flex shrink-0 items-center gap-[0.5vw]"
                    initial={{ y: 20, opacity: 0, scale: 0.6 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1, type: "spring", stiffness: 300, damping: 14 }}
                  >
                    <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(7vh, 70px)" />
                    <span className="flex h-[4.4vh] w-[4.4vh] items-center justify-center rounded-full bg-gold text-[2.6vh] font-black text-ink-950 shadow-lg">
                      ✓
                    </span>
                  </motion.div>
                )}
                <motion.div
                  className={`tile tile-${i} relative flex w-full shrink-0 flex-col items-center justify-start gap-[1vh] overflow-hidden rounded-t-[2vh] rounded-b-[1vh] pt-[1.2vh] ${hers ? "" : "tile-dim"}`}
                  initial={{ height: "6%" }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.2 + i * 0.12, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <span className="font-display text-[min(5vh,4vw)] font-black leading-none tabular-nums">{count}</span>
                  <div className="flex flex-wrap justify-center gap-[0.3vw] px-[0.5vw]">
                    {voters.slice(0, 12).map((p) => (
                      <Avatar key={p.id} player={p} size={30} className="!h-[3.4vh] !w-[3.4vh] ring-2 ring-white/70" />
                    ))}
                  </div>
                </motion.div>
              </div>
              {/* the label */}
              <div className={`mt-[1.4vh] flex h-[12vh] w-full shrink-0 items-start gap-[0.6vw] ${hers ? "" : "opacity-60"}`}>
                <span className={`tile tile-${i} flex h-[4.4vh] w-[4.4vh] shrink-0 items-center justify-center rounded-[1vh] ${hers ? "" : "tile-dim"}`}>
                  <AnswerShape index={i} className="h-[2.8vh] w-[2.8vh]" />
                </span>
                <div data-fit className="flex h-full min-w-0 flex-1 overflow-hidden">
                  <span className={`font-bold leading-tight [overflow-wrap:anywhere] ${hers ? "text-cream" : "text-mute"}`} style={{ fontSize: "var(--fit)" }}>
                    {opt}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
