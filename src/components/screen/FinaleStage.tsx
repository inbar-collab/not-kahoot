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
          <motion.div key="reveal" className="flex min-h-0 flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {!showPodium ? (
              // The big moment: the winner alone, centered.
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                {winners.length === 0 ? (
                  <h1 className="font-display text-[min(8vh,7vw)] font-bold text-gold-soft">{s.scrFinaleNone}</h1>
                ) : (
                  <>
                    <div className="mb-[4vh] flex gap-[2vw]">
                      {winners.slice(0, 4).map((w) => (
                        <motion.div
                          key={w.player.id}
                          initial={{ scale: 0.3, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 12 }}
                        >
                          <Avatar player={w.player} size={200} ring className="!h-[min(28vh,24vw)] !w-[min(28vh,24vw)]" />
                        </motion.div>
                      ))}
                    </div>
                    {winners.length > 1 && <p className="font-display text-[min(4vh,4vw)] text-mute">{s.scrFinaleTie}</p>}
                    <motion.h1
                      className="font-display text-[min(12vh,9vw)] font-black leading-tight text-gold"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.2 }}
                    >
                      <WinnerNames winners={winners} />
                    </motion.h1>
                  </>
                )}
              </div>
            ) : (
              // Podium on one side, the full ranking on the other.
              <div className="flex min-h-0 flex-1 flex-col">
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center font-display text-[min(6vh,5vw)] font-black text-gold"
                >
                  {winners.length === 0 ? s.scrFinaleNone : <>🏆 <WinnerNames winners={winners} /></>}
                </motion.h1>
                <div className="grid min-h-0 flex-1 grid-cols-1 gap-[3vw] md:grid-cols-[1.7fr_1fr]">
                  <div className="flex min-h-0 items-end">
                    <Podium standings={standings} variant="tv" />
                  </div>
                  <div className="flex min-h-0 flex-col justify-center overflow-hidden">
                    {showList && (
                      <>
                        <p className="mb-[1.5vh] font-display text-[min(3.4vh,3.4vw)] font-bold text-gold-soft">{s.scrFullRanking}</p>
                        <Ranking standings={standings.slice(0, 12)} size="lg" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WinnerNames({ winners }: { winners: { player: { id: string; name: string } }[] }) {
  return (
    <>
      {winners.map((w, i) => (
        <span key={w.player.id}>
          {i > 0 && " & "}
          <bdi>{w.player.name}</bdi>
        </span>
      ))}
    </>
  );
}
