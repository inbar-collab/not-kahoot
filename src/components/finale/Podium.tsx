"use client";
import { motion } from "motion/react";
import { podiumGroups } from "@/lib/scoring";
import type { Standing } from "@/lib/types";
import { Figure } from "./Figure";

const HEIGHTS = { 1: 1, 2: 0.72, 3: 0.52 } as const;
const MAX_FIGURES = 3;

/**
 * 1st / 2nd / 3rd podium. Tied players share a block. If more than three
 * players share a place, three figures are shown with a "+N" badge.
 */
export function Podium({
  standings,
  variant,
  highlightId,
  baseDelay = 0,
}: {
  standings: Standing[];
  variant: "tv" | "phone";
  highlightId?: string;
  baseDelay?: number;
}) {
  const groups = podiumGroups(standings);
  const tv = variant === "tv";
  const blockH = tv ? "min(30vh, 320px)" : "120px";
  // Classic layout: 2nd on the left, 1st in the middle, 3rd on the right.
  const order = [2, 1, 3] as const;
  // Rise from the bottom: 3rd, then 2nd, then 1st.
  const riseDelay = { 3: 0, 2: 0.5, 1: 1.0 } as const;

  return (
    <div dir="ltr" className="flex w-full items-end justify-center gap-[2%]">
      {order.map((place) => {
        const group = groups[place - 1];
        const shown = group.slice(0, MAX_FIGURES);
        const extra = group.length - shown.length;
        const n = Math.max(1, shown.length);
        const figW = tv ? `calc(min(13vw, 230px) / ${n === 1 ? 1 : n * 0.72})` : `calc(84px / ${n === 1 ? 1 : n * 0.72})`;
        const d = baseDelay + riseDelay[place];
        return (
          <div key={place} className="flex w-[30%] max-w-[420px] flex-col items-center">
            <div className="relative flex items-end justify-center gap-1">
              {shown.map((s) => (
                <div key={s.player.id} className="flex flex-col items-center">
                  <Figure
                    player={s.player}
                    place={place}
                    pose={place === 1 ? "cheer" : place === 2 ? "wave" : "stand"}
                    width={figW}
                    delay={d + 0.5}
                  />
                </div>
              ))}
              {extra > 0 && (
                <span className="absolute -top-2 left-full ms-1 rounded-full bg-ink-700 px-2 py-0.5 text-sm font-bold text-cream">
                  +{extra}
                </span>
              )}
            </div>
            <motion.div
              className={`relative flex w-full flex-col items-center justify-start rounded-t-3xl border-x border-t ${
                place === 1 ? "border-gold/60 bg-gradient-to-b from-ink-700 to-ink-850" : "border-ink-600 bg-gradient-to-b from-ink-800 to-ink-900"
              }`}
              style={{ height: `calc(${blockH} * ${HEIGHTS[place]})`, transformOrigin: "bottom" }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: d, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span
                className={`font-display font-black leading-none ${place === 1 ? "text-gold" : "text-mute"}`}
                style={{ fontSize: tv ? "min(9vh, 96px)" : "40px", marginTop: tv ? "2vh" : "6px" }}
              >
                {place}
              </span>
              <div dir="rtl" className="mt-1 flex flex-wrap justify-center gap-x-2 px-2 text-center">
                {group.length === 0 ? (
                  <span className="text-ink-500">—</span>
                ) : (
                  group.map((s) => (
                    <bdi
                      key={s.player.id}
                      className={`font-bold ${s.player.id === highlightId ? "text-gold-soft underline decoration-gold decoration-2 underline-offset-4" : "text-cream"}`}
                      style={{ fontSize: tv ? "min(3vh, 30px)" : "15px" }}
                    >
                      {s.player.name}
                    </bdi>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
