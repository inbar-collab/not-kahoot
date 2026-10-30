"use client";
import { motion } from "motion/react";
import { useAutoFit } from "@/hooks/useAutoFit";
import type { Strings } from "@/lib/strings";
import { OPTION_MARKS } from "@/lib/timing";
import type { ScreenSnapshot } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { Portrait } from "../ui/Portrait";
import { QuestionHeader } from "./QuestionStage";

/** A simple, elegant bar chart of how guests voted, her answer(s) marked. */
export function ResultsStage({ snap, s }: { snap: ScreenSnapshot; s: Strings }) {
  const { game, players } = snap;
  const round = snap.round!;
  const reveal = round.reveal;
  // Hooks first: they must run on every render.
  const titleRef = useAutoFit<HTMLDivElement>([round.id, round.text], { maxVh: 0.055, maxVw: 0.05, minVh: 0.026 });
  const labelsRef = useAutoFit<HTMLDivElement>([round.id, round.options.join("|")], {
    maxVh: 0.036,
    maxVw: 0.032,
    minVh: 0.018,
  });
  if (!reveal) return null;
  const max = Math.max(1, ...reveal.distribution);
  const longest = Math.max(...round.options.map((o) => o.length));
  const byId = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="flex h-full flex-col px-[4vw] pb-[11vh] pt-[4vh]">
      <QuestionHeader snap={snap} s={s}>
        <span className="font-display text-[min(3.4vh,3.6vw)] font-bold text-gold-soft">
          {s.scrKnewHer(reveal.correctCount, reveal.answeredCount)}
        </span>
      </QuestionHeader>
      <div ref={titleRef} className="mt-[2.5vh] h-[13vh] shrink-0">
        <div data-fit className="flex h-full items-center overflow-hidden">
          <h1 className="font-display font-bold leading-tight [overflow-wrap:anywhere]" style={{ fontSize: "var(--fit)" }}>
            {round.text}
          </h1>
        </div>
      </div>
      <p className="mt-[0.5vh] shrink-0 text-[min(2.8vh,3vw)] text-mute">{s.scrHowVoted}</p>

      {/* Each answer gets an equal, fixed share of the remaining height. */}
      <div
        ref={labelsRef}
        className="mt-[2vh] grid min-h-0 flex-1 gap-[1.6vh]"
        style={{ gridTemplateRows: `repeat(${round.options.length}, minmax(0, 1fr))` }}
      >
        {round.options.map((opt, i) => {
          const hers = reveal.birthdayChoices.includes(i);
          const count = reveal.distribution[i];
          const voters = reveal.votersByOption[i].map((id) => byId.get(id)).filter((p) => !!p);
          return (
            <div
              key={i}
              className="grid min-h-0 items-center gap-[2vw]"
              style={{ gridTemplateColumns: `minmax(0, ${longest > 22 ? 42 : 32}%) 1fr` }}
            >
              <div className="flex h-full min-h-0 min-w-0 items-center gap-[1vw]">
                <span
                  className={`flex h-[5.5vh] w-[5.5vh] shrink-0 items-center justify-center rounded-full border-2 font-display text-[2.8vh] ${
                    hers ? "border-gold bg-gold text-ink-950" : "border-ink-500 text-mute"
                  }`}
                >
                  {OPTION_MARKS[i]}
                </span>
                <div data-fit className="flex h-full min-w-0 flex-1 items-center overflow-hidden">
                  <span
                    className={`font-bold leading-tight [overflow-wrap:anywhere] ${hers ? "text-gold-soft" : "text-cream"}`}
                    style={{ fontSize: "var(--fit)" }}
                  >
                    {opt}
                  </span>
                </div>
                {hers && <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(5vh, 52px)" className="shrink-0" />}
              </div>
              <div className="flex flex-col gap-[0.8vh]">
                <div className="flex items-center gap-[1vw]">
                  <div className="relative h-[5vh] flex-1 overflow-hidden rounded-full bg-ink-850">
                    <motion.div
                      className={`absolute inset-y-0 right-0 rounded-full ${hers ? "bg-gold" : "bg-ink-600"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / max) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.15, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                    />
                  </div>
                  <span className={`w-[4vw] text-center font-display text-[min(4vh,4vw)] font-bold tabular-nums ${hers ? "text-gold" : "text-mute"}`}>
                    {count}
                  </span>
                </div>
                {voters.length > 0 && (
                  <div className="flex flex-wrap gap-[0.4vw]">
                    {voters.slice(0, 14).map((p) => (
                      <Avatar key={p.id} player={p} size={30} className="!h-[3.4vh] !w-[3.4vh]" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
