"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useElapsed } from "@/hooks/useElapsed";
import { celebrate } from "@/lib/confetti";
import type { SoundName } from "@/lib/sound";
import type { Strings } from "@/lib/strings";
import { FINALE_ARRIVE_MS, FINALE_LIST_MS, FINALE_SHOW_S, FINALE_TEASE_MS } from "@/lib/timing";
import type { ScreenSnapshot } from "@/lib/types";
import { Ranking } from "../finale/Ranking";
import { ThemeShow } from "../shows/ThemeShow";
import { Portrait } from "../ui/Portrait";

/** Pause, "The person who knows her best is...", the event's own show up to the winner, then the full ranking. */
export function FinaleStage({
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
  const { game } = snap;
  const standings = snap.standings ?? [];
  const elapsed = useElapsed(msInState, FINALE_LIST_MS + 100, game.stateChangedAt);
  const teasing = elapsed < FINALE_TEASE_MS;
  const arrived = elapsed >= FINALE_ARRIVE_MS;
  const showList = elapsed >= FINALE_LIST_MS;

  const winners = standings.filter((x) => x.rank === 1 && x.score > 0);
  const [live] = useState(() => elapsed < FINALE_TEASE_MS);
  const done = useRef(false);
  useEffect(() => {
    if (arrived && !done.current) {
      done.current = true;
      if (live && winners.length > 0) {
        sound("winner");
        celebrate(3000);
      }
    }
  });

  return (
    <div className="flex h-full flex-col px-[3vw] pb-[2vh] pt-[3vh]">
      <AnimatePresence mode="wait">
        {teasing ? (
          <motion.div
            key="tease"
            className="flex flex-1 flex-col items-center justify-center gap-[4vh] text-center"
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(24vh, 26vw)" />
            <motion.h1
              className="hero-title text-[min(7vh,6vw)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {s.scrFinaleTease}
            </motion.h1>
            <div className="flex gap-[1.2vw]" aria-hidden>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-[2vh] w-[2vh] rounded-full bg-gold"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          // The event's own show (the cake climb, the aisle, the hora…) with
          // the announcement and the full ranking beside it.
          <motion.div key="show" className="grid min-h-0 flex-1 grid-cols-[1.8fr_1fr] gap-[2.5vw]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="relative min-h-0">
              <ThemeShow
                template={game.template}
                standings={standings}
                s={s}
                elapsed={Math.max(0, elapsed - FINALE_TEASE_MS)}
                duration={FINALE_SHOW_S}
                animate={live}
                finale
                hideTitle
                maxLanes={7}
              />
            </div>
            <div className="flex min-h-0 flex-col justify-center gap-[2.5vh] overflow-hidden">
              <AnimatePresence mode="wait">
                {!arrived ? (
                  <motion.div key="wait" className="flex flex-col items-center gap-[2vh] text-center" exit={{ opacity: 0, y: -20 }}>
                    <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(18vh, 14vw)" />
                    <p className="font-display text-[min(3.6vh,2.8vw)] font-bold text-mute">{s.scrFinaleTease}</p>
                    <div className="flex gap-[0.8vw]" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <motion.span key={i} className="h-[1.6vh] w-[1.6vh] rounded-full bg-gold" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }} />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="won"
                    className="flex flex-col items-center text-center"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 180, damping: 13 }}
                  >
                    {winners.length === 0 ? (
                      <h1 className="hero-title text-[min(6vh,4.6vw)] leading-tight">{s.scrFinaleNone}</h1>
                    ) : (
                      <>
                        <span className="text-[min(9vh,7vw)] leading-none">🏆</span>
                        {winners.length > 1 && <p className="mt-[1vh] font-display text-[min(3vh,2.4vw)] text-mute">{s.scrFinaleTie}</p>}
                        <h1 className={`hero-title mt-[1vh] leading-tight [overflow-wrap:anywhere] ${winners.length > 1 ? "text-[min(5.5vh,3.8vw)]" : "text-[min(7.5vh,5vw)]"}`}>
                          <WinnerNames winners={winners} s={s} />
                        </h1>
                        <p className="mt-[1vh] font-display text-[min(3.6vh,2.8vw)] font-bold text-gold-soft">{s.scrCheer}</p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {showList && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card min-h-0 overflow-hidden rounded-[2.4vh] p-[1.6vh]">
                  <p className="mb-[1vh] font-display text-[min(2.8vh,2.4vw)] font-bold text-gold-soft">{s.scrFullRanking}</p>
                  <Ranking standings={standings.slice(0, 6)} size="md" />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WinnerNames({ winners, s }: { winners: { player: { id: string; name: string } }[]; s: Strings }) {
  // A big tie would not fit: the first three, then "and N more".
  const named = winners.slice(0, 3);
  return (
    <>
      {named.map((w, i) => (
        <span key={w.player.id}>
          {i > 0 && " & "}
          <bdi>{w.player.name}</bdi>
        </span>
      ))}
      {winners.length > 3 && <span className="text-[0.55em]"> {s.scrRaceMore(winners.length - 3)}</span>}
    </>
  );
}
