"use client";
import { motion } from "motion/react";
import { getStrings } from "@/lib/strings";
import type { Standing } from "@/lib/types";
import { Avatar } from "../ui/Avatar";

/** Full ranking list: place, avatar, name, score. Ties share a place. */
export function Ranking({
  standings,
  highlightId,
  size = "md",
  delay = 0,
}: {
  standings: Standing[];
  highlightId?: string;
  size?: "md" | "lg";
  delay?: number;
}) {
  const s = getStrings();
  const lg = size === "lg";
  return (
    <ol className={`flex w-full flex-col ${lg ? "gap-[1.1vh]" : "gap-2"}`}>
      {standings.map((st, i) => {
        const me = st.player.id === highlightId;
        return (
          <motion.li
            key={st.player.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + i * 0.06 }}
            className={`flex items-center gap-3 rounded-2xl border px-4 ${lg ? "py-[0.9vh]" : "py-2"} ${
              me ? "border-gold bg-gold/10" : "border-ink-700 bg-ink-850"
            }`}
          >
            <span
              className={`w-10 shrink-0 text-center font-display font-bold ${st.rank === 1 ? "text-gold" : "text-mute"} ${lg ? "text-[3vh]" : "text-xl"}`}
              aria-label={s.place(st.rank)}
            >
              {st.rank}
            </span>
            <Avatar player={st.player} size={lg ? 44 : 36} />
            <bdi className={`min-w-0 flex-1 truncate font-bold ${lg ? "text-[2.6vh]" : "text-lg"}`}>{st.player.name}</bdi>
            <span className={`shrink-0 font-display font-bold tabular-nums text-gold-soft ${lg ? "text-[3vh]" : "text-xl"}`}>
              {st.score}
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}
