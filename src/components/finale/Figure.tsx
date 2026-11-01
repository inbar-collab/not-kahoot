"use client";
// A chunky, round, cartoonish figure. The face is the player's own avatar
// photo (circular crop, never stretched), their emoji, or their initial.
// Colors come from the template's theme tokens. Poses: standing on the
// podium (cheer / wave / stand), running in the leaderboard race (run), and
// a comic stumble for whoever is in last place (trip).
import { motion } from "motion/react";
import { useId } from "react";
import type { PublicPlayer } from "@/lib/types";

export type Pose = "cheer" | "wave" | "stand" | "run" | "trip";

const PLACE_COLOR = { 1: "var(--color-gold)", 2: "var(--color-silver)", 3: "var(--color-bronze)" } as const;
const LIMB = "var(--color-figure)";
const SHOE = "var(--color-ink-700)";

export function Figure({
  player,
  place,
  color,
  pose,
  width,
  delay = 0,
  enter = true,
  speed = 1,
}: {
  player: Pick<PublicPlayer, "name" | "emoji" | "avatarUrl">;
  place?: 1 | 2 | 3;
  /** Shirt color; defaults to the medal color of `place`. */
  color?: string;
  pose: Pose;
  width: string;
  delay?: number;
  /** Drop in from above when it first appears. */
  enter?: boolean;
  /** Running cadence multiplier. */
  speed?: number;
}) {
  const id = useId().replace(/:/g, "");
  const body = color ?? PLACE_COLOR[place ?? 1];
  const running = pose === "run" || pose === "trip";

  // Arm end points per pose (shoulders at 34,84 and 66,84).
  const arms =
    pose === "cheer"
      ? { l: [16, 46], r: [84, 46] }
      : pose === "wave"
        ? { l: [20, 112], r: [86, 52] }
        : running
          ? { l: [26, 112], r: [74, 112] }
          : { l: [22, 118], r: [78, 118] };

  const anim = running ? "run" : pose;
  const style = { "--stride": `${0.34 / speed}s` } as React.CSSProperties;

  return (
    <motion.svg
      viewBox="0 0 100 190"
      style={{ width, overflow: "visible", ...style }}
      initial={enter ? { y: -40, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 14 }}
      role="img"
      aria-label={player.name}
      className={`fig fig-${anim} ${pose === "trip" ? "fig-trip" : ""}`}
    >
      <defs>
        <clipPath id={`face-${id}`}>
          <circle cx="50" cy="38" r="29" />
        </clipPath>
      </defs>

      {/* Limbs and body move with CSS keyframes pivoting at fixed points
          (hips, shoulders, feet) in the SVG's own coordinates; see globals.css. */}
      <g className="fig-body">
        <g className="fig-leg-l">
          <path d="M42 140 L39 176" style={{ stroke: LIMB }} strokeWidth="13" strokeLinecap="round" />
          <ellipse cx="38" cy="180" rx="10" ry="6" style={{ fill: SHOE }} />
        </g>
        <g className="fig-leg-r">
          <path d="M58 140 L61 176" style={{ stroke: LIMB }} strokeWidth="13" strokeLinecap="round" />
          <ellipse cx="64" cy="180" rx="10" ry="6" style={{ fill: SHOE }} />
        </g>
        <g className="fig-arm-l">
          <path d={`M34 84 L${arms.l[0]} ${arms.l[1]}`} style={{ stroke: LIMB }} strokeWidth="12" strokeLinecap="round" />
          <circle cx={arms.l[0]} cy={arms.l[1]} r="7.5" style={{ fill: LIMB }} />
        </g>
        <g className="fig-arm-r">
          <path d={`M66 84 L${arms.r[0]} ${arms.r[1]}`} style={{ stroke: LIMB }} strokeWidth="12" strokeLinecap="round" />
          <circle cx={arms.r[0]} cy={arms.r[1]} r="7.5" style={{ fill: LIMB }} />
        </g>

        {/* torso */}
        <rect x="29" y="70" width="42" height="76" rx="21" style={{ fill: body }} />
        <rect x="29" y="70" width="42" height="76" rx="21" fill="none" stroke="rgb(0 0 0 / 0.15)" strokeWidth="1.5" />

        {/* head */}
        <circle cx="50" cy="38" r="32" style={{ fill: LIMB }} />
        {player.avatarUrl ? (
          <image
            href={player.avatarUrl}
            x="21"
            y="9"
            width="58"
            height="58"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#face-${id})`}
          />
        ) : player.emoji ? (
          <text x="50" y="40" textAnchor="middle" dominantBaseline="central" fontSize="36">
            {player.emoji}
          </text>
        ) : (
          <text
            x="50"
            y="40"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="30"
            fontWeight="700"
            fill="#121214"
            fontFamily="var(--font-display)"
          >
            {[...player.name][0] ?? "?"}
          </text>
        )}
        <circle cx="50" cy="38" r="31" fill="none" style={{ stroke: body }} strokeWidth="3" />
        {pose === "trip" && (
          <motion.text
            x="78"
            y="14"
            fontSize="22"
            animate={{ opacity: [0, 0, 1, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2.6, times: [0, 0.6, 0.7, 0.9, 1] }}
          >
            💫
          </motion.text>
        )}
      </g>
    </motion.svg>
  );
}

/** Shirt colors for runners in the race (cycled). */
export const RUNNER_COLORS = [
  "var(--color-gold)",
  "var(--color-silver)",
  "var(--color-bronze)",
  "#ef476f",
  "#06d6a0",
  "#4cc9f0",
  "#b388ff",
  "#ffd166",
];
