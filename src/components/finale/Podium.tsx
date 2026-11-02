"use client";
import { motion } from "motion/react";
import { podiumGroups } from "@/lib/scoring";
import type { Standing } from "@/lib/types";
import { Figure } from "./Figure";

const HEIGHTS = { 1: 1, 2: 0.76, 3: 0.6 } as const;
const MEDAL = { 1: "#f7c948", 2: "#c9d1de", 3: "#df9a68" } as const;
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
  const blockH = tv ? "min(27vh, 300px)" : "120px";
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
        const shrink = n === 1 ? 1 : n * 0.72;
        const figW = tv ? `calc(min(14vh, 12vw) / ${shrink})` : `calc(84px / ${shrink})`;
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
              className="relative flex w-full flex-col items-center justify-start rounded-t-[1.4rem] text-[#24170b]"
              style={{
                height: `calc(${blockH} * ${HEIGHTS[place]})`,
                transformOrigin: "bottom",
                background: `linear-gradient(180deg, color-mix(in oklab, ${MEDAL[place]} 70%, white), ${MEDAL[place]} 45%, color-mix(in oklab, ${MEDAL[place]} 80%, black))`,
                boxShadow: `inset 0 3px 0 rgb(255 255 255 / 0.45), 0 20px 40px -20px rgb(0 0 0 / 0.6)`,
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: d, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span
                className="font-display font-black leading-none drop-shadow-[0_2px_0_rgb(255_255_255/0.4)]"
                style={{
                  fontSize: tv ? (place === 1 ? "min(8vh, 88px)" : "min(5.5vh, 60px)") : place === 1 ? "40px" : "30px",
                  marginTop: tv ? "1.5vh" : "6px",
                }}
              >
                {place}
              </span>
              <div className="mt-1 flex flex-wrap justify-center gap-x-1 px-2 text-center leading-snug">
                {group.length === 0 ? (
                  <span className="opacity-50">—</span>
                ) : (
                  group.map((s, k) => (
                    <bdi
                      key={s.player.id}
                      className={`font-bold ${s.player.id === highlightId ? "underline decoration-2 underline-offset-4" : ""}`}
                      style={{ fontSize: tv ? "min(2.6vh, 28px)" : "15px" }}
                    >
                      {s.player.name}
                      {k < group.length - 1 && <span className="opacity-60">,</span>}
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
