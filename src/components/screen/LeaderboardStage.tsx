"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { Strings } from "@/lib/strings";
import type { ScreenSnapshot } from "@/lib/types";
import { Avatar } from "../ui/Avatar";

/** Starts in the previous order, then the rows glide to their new places. */
export function LeaderboardStage({ snap, s }: { snap: ScreenSnapshot; s: Strings }) {
  const standings = snap.standings ?? [];
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), 1100);
    return () => window.clearTimeout(t);
  }, []);

  const rows = settled
    ? standings
    : [...standings].sort(
        (a, b) => (a.previousRank ?? a.rank) - (b.previousRank ?? b.rank) || a.player.name.localeCompare(b.player.name, "he"),
      );
  const visible = rows.slice(0, 10);
  const crowded = visible.length > 7;

  return (
    <div className="flex h-full flex-col items-center px-[6vw] py-[5vh]">
      <h1 className="font-display text-[min(7vh,6vw)] font-bold text-gold-soft">{s.scrLeaderboard}</h1>
      <div className="gold-rule mb-[3vh] mt-[1.5vh] w-[30vw]" />
      {standings.length === 0 && <p className="text-[3vh] text-mute">{s.scrNoPlayers}</p>}
      <ol className={`flex w-full max-w-[1200px] flex-col ${crowded ? "gap-[1vh]" : "gap-[1.6vh]"}`}>
        {visible.map((st) => {
          const score = settled ? st.score : st.previousScore;
          const moved = st.previousRank !== null && st.previousRank > st.rank;
          return (
            <motion.li
              key={st.player.id}
              layout
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
              className={`flex items-center gap-[1.6vw] rounded-[2vh] border px-[2vw] ${crowded ? "py-[0.8vh]" : "py-[1.4vh]"} ${
                st.rank === 1 && settled ? "border-gold/70 bg-gold/10" : "border-ink-700 bg-ink-850"
              }`}
            >
              <span className={`w-[4vw] text-center font-display text-[min(4.4vh,4vw)] font-black ${st.rank === 1 ? "text-gold" : "text-mute"}`}>
                {settled ? st.rank : (st.previousRank ?? st.rank)}
              </span>
              <Avatar player={st.player} size={60} className="!h-[min(6.4vh,6vw)] !w-[min(6.4vh,6vw)]" />
              <bdi className="min-w-0 flex-1 truncate text-[min(3.8vh,3.6vw)] font-bold">{st.player.name}</bdi>
              {st.streak >= 3 && <span className="text-[min(2.8vh,2.8vw)] text-gold-soft">{s.streak(st.streak)}</span>}
              {settled && moved && (
                <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[min(2.8vh,2.8vw)] text-gold">
                  ▲{st.previousRank! - st.rank}
                </motion.span>
              )}
              <motion.span
                key={score}
                initial={{ scale: 1.5, color: "#e8cd96" }}
                animate={{ scale: 1, color: "#f3eee4" }}
                className="w-[6vw] text-center font-display text-[min(4.6vh,4.4vw)] font-bold tabular-nums"
              >
                {score}
              </motion.span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
