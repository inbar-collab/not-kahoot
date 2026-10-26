"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useElapsed } from "@/hooks/useElapsed";
import { celebrate } from "@/lib/confetti";
import type { SoundName } from "@/lib/sound";
import type { Strings } from "@/lib/strings";
import { FINALE_LIST_MS, FINALE_PODIUM_MS, FINALE_TEASE_MS } from "@/lib/timing";
import type { ScreenSnapshot } from "@/lib/types";
import { Podium } from "../finale/Podium";
import { Ranking } from "../finale/Ranking";
import { Avatar } from "../ui/Avatar";
import { Portrait } from "../ui/Portrait";

/** Pause, "The person who knows her best is...", winner, podium, full ranking. */
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
  const showPodium = elapsed >= FINALE_PODIUM_MS;
  const showList = elapsed >= FINALE_LIST_MS;

  const winners = standings.filter((x) => x.rank === 1 && x.score > 0);
  const live = useRef(elapsed < FINALE_TEASE_MS);
  const done = useRef(false);
  useEffect(() => {
    if (!teasing && !done.current) {
      done.current = true;
      if (live.current && winners.length > 0) {
        sound("winner");
        celebrate(3000);
      }
    }
  });

  return (
    <div className="flex h-full flex-col px-[3vw] py-[3vh]">
      <AnimatePresence mode="wait">
        {teasing ? (
          <motion.div
            key="tease"
            className="flex flex-1 flex-col items-center justify-center gap-[4vh] text-center"
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(24vh, 26vw)" />
            <motion.h1
              className="font-display text-[min(7vh,6vw)] font-bold"
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
          <motion.div key="reveal" className="flex flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Winner name(s) */}
            <motion.div
              layout
              className={`flex flex-col items-center text-center ${showPodium ? "" : "flex-1 justify-center"}`}
            >
              {winners.length === 0 ? (
                <h1 className="font-display text-[min(7vh,6vw)] font-bold text-gold-soft">{s.scrFinaleNone}</h1>
              ) : (
                <>
                  {!showPodium && (
                    <div className="mb-[3vh] flex gap-[2vw]">
                      {winners.slice(0, 4).map((w) => (
                        <motion.div
                          key={w.player.id}
                          initial={{ scale: 0.3, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 12 }}
                        >
                          <Avatar player={w.player} size={200} ring className="!h-[min(26vh,24vw)] !w-[min(26vh,24vw)]" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {winners.length > 1 && <p className="font-display text-[min(3.6vh,3.6vw)] text-mute">{s.scrFinaleTie}</p>}
                  <motion.h1
                    layout
                    className={`font-display font-black leading-tight text-gold ${showPodium ? "text-[min(6vh,5vw)]" : "text-[min(11vh,9vw)]"}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 160, damping: 14 }}
                  >
                    {winners.map((w, i) => (
                      <span key={w.player.id}>
                        {i > 0 && " & "}
                        <bdi>{w.player.name}</bdi>
                      </span>
                    ))}
                  </motion.h1>
                </>
              )}
            </motion.div>

            {showPodium && (
              <div className="mt-[2vh] grid flex-1 grid-cols-1 items-end gap-[3vw] md:grid-cols-[1.7fr_1fr]">
                <div className="pt-[22vh]">
                  <Podium standings={standings} variant="tv" />
                </div>
                <div className="flex max-h-[68vh] flex-col overflow-hidden">
                  {showList && (
                    <>
                      <p className="mb-[1.5vh] font-display text-[min(3.4vh,3.4vw)] font-bold text-gold-soft">{s.scrFullRanking}</p>
                      <Ranking standings={standings} size="lg" />
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
