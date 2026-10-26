"use client";
// A chunky, round, cartoonish figure in the spirit of Wii Sports. The face
// is the player's own avatar photo (circular crop, never stretched) or their
// emoji. This is the one deliberately playful illustration in the app.
import { motion } from "motion/react";
import { useId } from "react";
import type { PublicPlayer } from "@/lib/types";

export type Pose = "cheer" | "wave" | "stand";

const BODY = { 1: "#d6b06b", 2: "#cfcac1", 3: "#a8917a" } as const;

export function Figure({
  player,
  place,
  pose,
  width,
  delay = 0,
}: {
  player: Pick<PublicPlayer, "name" | "emoji" | "avatarUrl">;
  place: 1 | 2 | 3;
  pose: Pose;
  width: string;
  delay?: number;
}) {
  const id = useId().replace(/:/g, "");
  const body = BODY[place];
  const limb = "#f3eee4";

  // Arm end points per pose (shoulders at 34,84 and 66,84).
  const arms =
    pose === "cheer"
      ? { l: [16, 46], r: [84, 46] }
      : pose === "wave"
        ? { l: [20, 112], r: [86, 52] }
        : { l: [22, 118], r: [78, 118] };

  return (
    <motion.svg
      viewBox="0 0 100 190"
      style={{ width, overflow: "visible" }}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 14 }}
      role="img"
      aria-label={player.name}
    >
      <defs>
        <clipPath id={`face-${id}`}>
          <circle cx="50" cy="38" r="29" />
        </clipPath>
      </defs>

      <motion.g
        animate={pose === "cheer" ? { y: [0, -6, 0] } : undefined}
        transition={pose === "cheer" ? { repeat: Infinity, duration: 0.9, ease: "easeInOut", delay: delay + 0.6 } : undefined}
      >
        {/* legs */}
        <path d="M42 140 L39 176" stroke={limb} strokeWidth="13" strokeLinecap="round" />
        <path d="M58 140 L61 176" stroke={limb} strokeWidth="13" strokeLinecap="round" />
        <ellipse cx="36" cy="180" rx="10" ry="6" fill="#2b2b30" />
        <ellipse cx="64" cy="180" rx="10" ry="6" fill="#2b2b30" />

        {/* arms */}
        <motion.g
          style={{ originX: "50px", originY: "84px" }}
          animate={pose === "cheer" ? { rotate: [-4, 4, -4] } : undefined}
          transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
        >
          <path d={`M34 84 L${arms.l[0]} ${arms.l[1]}`} stroke={limb} strokeWidth="12" strokeLinecap="round" />
          <circle cx={arms.l[0]} cy={arms.l[1]} r="7.5" fill={limb} />
        </motion.g>
        <motion.g
          animate={pose === "wave" ? { rotate: [0, 14, 0] } : pose === "cheer" ? { rotate: [4, -4, 4] } : undefined}
          style={{ originX: "66px", originY: "84px" }}
          transition={{ repeat: Infinity, duration: pose === "wave" ? 1.1 : 0.9, ease: "easeInOut" }}
        >
          <path d={`M66 84 L${arms.r[0]} ${arms.r[1]}`} stroke={limb} strokeWidth="12" strokeLinecap="round" />
          <circle cx={arms.r[0]} cy={arms.r[1]} r="7.5" fill={limb} />
        </motion.g>

        {/* torso */}
        <rect x="29" y="70" width="42" height="76" rx="21" fill={body} />
        <rect x="29" y="70" width="42" height="76" rx="21" fill="none" stroke="rgb(0 0 0 / 0.15)" strokeWidth="1.5" />

        {/* head */}
        <circle cx="50" cy="38" r="32" fill={limb} />
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
        <circle cx="50" cy="38" r="31" fill="none" stroke={body} strokeWidth="3" />
      </motion.g>
    </motion.svg>
  );
}
