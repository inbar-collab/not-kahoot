"use client";
import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import type { Strings } from "@/lib/strings";
import type { Standing, TemplateId } from "@/lib/types";
import { Figure, RUNNER_COLORS } from "../finale/Figure";
import { Avatar } from "../ui/Avatar";
import { Balloon, Cloud, Rocket } from "../theme/Ambient";

/**
 * The score show, in the event's own world. Every player's character gets as
 * far as their score takes them, and the leader always arrives last:
 *
 *   birthday       climbing a giant birthday cake to the candles
 *   kids_birthday  floating up on a bunch of balloons to the rainbow
 *   kids           a rocket race to the moon
 *   wedding        walking down the aisle to the flower arch (and the bouquet)
 *   mitzvah        lifted up on chairs, hora style
 *   baby_shower    the great stroller race to the teddy bear
 *   anniversary    riding champagne corks up to two clinking glasses
 *   party          a dance-off on rising neon columns, up to the disco ball
 *
 * Used between rounds (leaderboard) and as the grand finale. `elapsed` is
 * measured from the moment the show started, so a refresh mid-show jumps to
 * the right moment; `animate` is false when we join after the fact.
 */
export interface ShowProps {
  template: TemplateId;
  standings: Standing[];
  s: Strings;
  /** ms since the show began */
  elapsed: number;
  /** seconds until the leader arrives */
  duration: number;
  animate: boolean;
  /** Finale: no "previous score" count-up, the winner(s) go all the way. */
  finale?: boolean;
  /** Hide the big heading (the finale has its own). */
  hideTitle?: boolean;
  maxLanes?: number;
}

interface Entry {
  st: Standing;
  /** 0..1, how far this player gets */
  p: number;
  /** slot from the left (0..n-1); the leader is in the middle for climbs */
  slot: number;
  color: string;
  leader: boolean;
  last: boolean;
  moved: number;
  /** seconds this player travels */
  dur: number;
  delay: number;
}

type Ctx = { n: number; done: boolean; settled: boolean; animate: boolean; figW: string; rtl: boolean; finale: boolean };

const VERTICAL: Partial<Record<TemplateId, true>> = { birthday: true, kids_birthday: true, kids: true, mitzvah: true, anniversary: true, party: true };

export function ThemeShow(props: ShowProps) {
  const { template, standings, s, elapsed, duration, animate, finale = false, hideTitle = false, maxLanes = 8 } = props;
  const shown = standings.slice(0, maxLanes);
  const rest = standings.slice(maxLanes);
  const done = elapsed >= duration * 1000;
  const settled = elapsed >= duration * 1000 + 700;
  const vertical = !!VERTICAL[template];
  const rtl = s.dir === "rtl";

  if (shown.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[4vh] text-mute">{s.scrNoPlayers}</p>
      </div>
    );
  }

  const max = Math.max(1, ...shown.map((x) => x.score));
  const leaderScore = shown[0].score;
  // The "slow and steady" tag only when one player alone is last.
  const lowest = shown[shown.length - 1].score;
  const lastScore = shown.length > 2 && shown.filter((x) => x.score === lowest).length === 1 ? lowest : null;
  const n = shown.length;
  // Climbs put the leader in the middle and the others alternating outwards.
  const order = centerOut(n);
  const entries: Entry[] = shown.map((st, i) => {
    const p = leaderScore === 0 ? 0.06 : Math.max(0.05, st.score / max);
    return {
      st,
      p,
      slot: vertical ? order[i] : i,
      color: RUNNER_COLORS[i % RUNNER_COLORS.length],
      leader: st.rank === 1 && st.score > 0,
      last: !finale && lastScore !== null && st.score === lastScore && st.score < leaderScore,
      moved: st.previousRank !== null && st.previousRank > st.rank ? st.previousRank - st.rank : 0,
      // the leader arrives last, everyone else a little earlier
      dur: duration * (0.5 + 0.5 * p) - (st.rank === 1 ? 0 : 0.15),
      delay: 0,
    };
  });
  const ctx: Ctx = { n, done, settled, animate, figW: `min(${(vertical ? 50 : 30) / Math.max(n, 4)}vw, ${vertical ? 9 : 7.5}vh)`, rtl, finale };
  const Scene = SCENES[template] ?? SCENES.birthday!;

  return (
    <div className="relative flex h-full flex-col">
      {!hideTitle && (
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="hero-title relative z-10 shrink-0 pt-[2.5vh] text-center text-[min(6vh,5vw)] leading-tight"
        >
          {s.scrShowTitle[template]}
        </motion.h1>
      )}
      <div className="relative min-h-0 flex-1">
        <Scene entries={entries} ctx={ctx} s={s} finale={finale} />
      </div>
      {rest.length > 0 && (
        <p className="relative z-10 shrink-0 truncate pb-[1vh] text-center text-[min(2.2vh,2vw)] text-mute">
          {rest.slice(0, 12).map((x, i) => (
            <span key={x.player.id}>
              {i > 0 && " · "}
              <bdi>{x.player.name}</bdi> {x.score}
            </span>
          ))}
          {rest.length > 12 && ` · ${s.scrRaceMore(rest.length - 12)}`}
        </p>
      )}
    </div>
  );
}

function centerOut(n: number): number[] {
  // rank index -> slot. Ranks 0,1,2,3… go to middle, left, right, left…
  const mid = Math.floor((n - 1) / 2);
  return Array.from({ length: n }, (_, i) => {
    if (i === 0) return mid;
    const k = Math.ceil(i / 2);
    return i % 2 === 1 ? mid - k : mid + k;
  }).map((x, _, arr) => {
    // squash into 0..n-1 (for even n the right side has one more slot)
    const min = Math.min(...arr);
    return x - min;
  });
}

type SceneProps = { entries: Entry[]; ctx: Ctx; s: Strings; finale: boolean };

// ------------------------------------------------------------ building blocks

/** Name, place and score under (or beside) each lane. */
function Plate({ e, ctx, finale, className = "", style, compact = false }: { e: Entry; ctx: Ctx; finale: boolean; className?: string; style?: CSSProperties; compact?: boolean }) {
  const score = finale || ctx.done ? e.st.score : e.st.previousScore;
  if (compact) {
    // Two lines for narrow lanes: the name, then place and score.
    return (
      <div className={`card flex w-full flex-col items-center rounded-[1.4vh] px-[0.4vw] py-[0.5vh] leading-tight ${className}`} style={style}>
        <bdi className="w-full truncate text-center text-[min(2vh,1.5vw)] font-bold">{e.st.player.name}</bdi>
        <span className="flex items-center gap-[0.4vw]">
          <span className={`flex h-[min(2.8vh,2.2vw)] w-[min(2.8vh,2.2vw)] items-center justify-center rounded-full font-display text-[min(1.6vh,1.3vw)] font-black ${e.leader ? "bg-gold text-ink-950" : "bg-ink-800 text-mute"}`}>
            {e.st.rank}
          </span>
          <motion.span
            key={ctx.done ? "d" : "r"}
            initial={ctx.done && ctx.animate && !finale ? { scale: 1.7 } : false}
            animate={{ scale: 1 }}
            className="font-display text-[min(2.4vh,1.9vw)] font-black tabular-nums"
          >
            {score}
          </motion.span>
          {ctx.settled && e.moved > 0 && (
            <span className="text-[min(1.5vh,1.2vw)] font-bold text-gold">
              <bdi dir="ltr">▲{e.moved}</bdi>
            </span>
          )}
        </span>
      </div>
    );
  }
  return (
    <div className={`card flex items-center gap-[0.5vw] rounded-full py-[0.4vh] pe-[0.9vw] ps-[0.4vh] leading-none ${className}`} style={style}>
      <span
        className={`flex h-[min(3.6vh,2.8vw)] w-[min(3.6vh,2.8vw)] shrink-0 items-center justify-center rounded-full font-display text-[min(2vh,1.6vw)] font-black ${
          e.leader ? "bg-gold text-ink-950" : "bg-ink-800 text-mute"
        }`}
      >
        {e.st.rank}
      </span>
      <bdi className="min-w-0 flex-1 truncate text-[min(2.2vh,1.7vw)] font-bold">{e.st.player.name}</bdi>
      <motion.span
        key={ctx.done ? "d" : "r"}
        initial={ctx.done && ctx.animate && !finale ? { scale: 1.7 } : false}
        animate={{ scale: 1 }}
        className="font-display text-[min(2.6vh,2vw)] font-black tabular-nums"
      >
        {score}
      </motion.span>
      {ctx.settled && e.moved > 0 && (
        <span className="text-[min(1.7vh,1.4vw)] font-bold text-gold">
          <bdi dir="ltr">▲{e.moved}</bdi>
        </span>
      )}
    </div>
  );
}

function Crown({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.span
      initial={{ y: -30, opacity: 0, scale: 0.4 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 12 }}
      className="block text-[min(5vh,4vw)] leading-none drop-shadow"
    >
      👑
    </motion.span>
  );
}

function Turtle({ e, ctx, s }: { e: Entry; ctx: Ctx; s: Strings }) {
  if (!e.last || !ctx.settled) return null;
  return (
    <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className="chip whitespace-nowrap px-[0.6vw] py-[0.2vh] text-[min(1.7vh,1.4vw)]">
      {s.scrRaceLast}
    </motion.span>
  );
}

const ease = [0.32, 0.05, 0.25, 1] as const;

/**
 * The vertical engine: each rider climbs from the bottom of its lane to
 * `base + p * span` percent of the lane height. `inward(h)` (0..1) pulls a
 * rider toward the middle as it climbs, for shapes that narrow (the cake).
 */
function Climb({
  entries,
  ctx,
  base,
  span,
  inward,
  rider,
  under,
  bounce = false,
  plateBottom = "1.2vh",
  laneArea = "inset-x-[3%] top-0 bottom-[9vh]",
}: {
  entries: Entry[];
  ctx: Ctx;
  base: number;
  span: number;
  inward?: (h: number) => number;
  rider: (e: Entry) => ReactNode;
  /** something drawn below the rider, sized to the height climbed (columns, trails) */
  under?: (e: Entry, h: number) => ReactNode;
  bounce?: boolean;
  plateBottom?: string;
  laneArea?: string;
}) {
  const n = ctx.n;
  const center = (slot: number) => ((slot + 0.5) / n) * 100;
  return (
    <div className={`absolute ${laneArea}`} dir="ltr">
      {entries.map((e) => {
        const h = base + e.p * span;
        const c = center(e.slot);
        const steps = [0, 0.2, 0.4, 0.6, 0.8, 1];
        const bottoms = steps.map((k) => `${base + e.p * span * k}%`);
        const lefts = steps.map((k) => {
          const hk = base + e.p * span * k;
          const f = inward ? inward(hk) : 1;
          return `${50 + (c - 50) * f}%`;
        });
        const t = { duration: ctx.animate ? e.dur : 0, ease, delay: e.delay };
        return (
          <div key={e.st.player.id}>
            {under?.(e, h)}
            <motion.div
              className="absolute z-10 flex flex-col items-center"
              style={{ x: "-50%" }}
              initial={ctx.animate ? { bottom: bottoms[0], left: lefts[0] } : false}
              animate={{ bottom: bottoms, left: lefts }}
              transition={{ bottom: t, left: t }}
            >
              <motion.div
                className="flex flex-col items-center"
                animate={bounce ? { y: ["0vh", "-1.6vh", "0vh"] } : undefined}
                transition={bounce ? { repeat: Infinity, duration: 0.55, ease: "easeInOut" } : undefined}
              >
                {rider(e)}
              </motion.div>
            </motion.div>
          </div>
        );
      })}
      {/* plates */}
      {entries.map((e) => (
        <div key={e.st.player.id} className="absolute z-20 flex justify-center px-[0.3vw]" style={{ left: `${center(e.slot)}%`, bottom: `calc(-1 * ${plateBottom} - 6vh)`, width: `${100 / n}%`, transform: "translateX(-50%)" }}>
          <Plate e={e} ctx={ctx} finale={ctx.finale} compact />
        </div>
      ))}
    </div>
  );
}

/** The horizontal engine: lanes stacked top to bottom, riders travel toward the finish. */
function Race({
  entries,
  ctx,
  finale,
  start = 0,
  span,
  rider,
  lane,
  backdrop,
  finish,
  finishAt,
  area = "inset-y-[2vh] start-[2vw] end-[2vw]",
}: {
  entries: Entry[];
  ctx: Ctx;
  finale: boolean;
  start?: number;
  span: number;
  rider: (e: Entry) => ReactNode;
  lane?: (e: Entry, i: number) => ReactNode;
  /** drawn across the whole track (behind the riders) */
  backdrop?: ReactNode;
  /** drawn centered on the finish line; gets the leader's row (or -1) */
  finish?: (leaderRow: number) => ReactNode;
  /** where the finish is drawn (% of the track); defaults to where the leader stops */
  finishAt?: number;
  area?: string;
}) {
  const n = ctx.n;
  const side = ctx.rtl ? "right" : "left";
  const leaderRow = entries.findIndex((e) => e.leader);
  return (
    <div className={`absolute flex flex-col ${area}`}>
      <div className="pointer-events-none absolute inset-y-0 start-[22%] end-0" aria-hidden>
        {backdrop}
        {finish && (
          <div className="absolute inset-y-0" style={{ [side]: `${finishAt ?? start + span}%`, translate: ctx.rtl ? "50% 0" : "-50% 0" }}>
            {finish(leaderRow)}
          </div>
        )}
      </div>
      {entries.map((e, i) => {
        const x = start + e.p * span;
        return (
          <div key={e.st.player.id} className="relative flex min-h-0 flex-1 items-center">
            {lane?.(e, i)}
            <div className="relative z-20 w-[22%] shrink-0 pe-[1vw]">
              <Plate e={e} ctx={ctx} finale={finale} />
            </div>
            <div className="relative h-full flex-1">
              <motion.div
                className="absolute bottom-[8%] z-10 flex items-end gap-[0.5vw]"
                style={{ [side]: `${x}%`, translate: ctx.rtl ? "50% 0" : "-50% 0" }}
                initial={ctx.animate ? { [side]: `${start}%` } : false}
                animate={{ [side]: `${x}%` }}
                transition={{ duration: ctx.animate ? e.dur : 0, ease }}
              >
                {rider(e)}
              </motion.div>
            </div>
          </div>
        );
      })}
      {n === 0 && null}
    </div>
  );
}

// -------------------------------------------------------------------- scenes

const SCENES: Partial<Record<TemplateId, (p: SceneProps) => ReactNode>> = {
  birthday: CakeScene,
  kids_birthday: BalloonScene,
  kids: MoonScene,
  wedding: AisleScene,
  mitzvah: HoraScene,
  baby_shower: StrollerScene,
  anniversary: CorkScene,
  party: DanceScene,
};

// Birthday: a four-tier cake. Riders climb its face; the leader reaches the candles.
const TIERS = [
  { w: 1, body: "#fff1d6", icing: "#ff4f7b" },
  { w: 0.8, body: "#ffd0dc", icing: "#ffffff" },
  { w: 0.6, body: "#fff1d6", icing: "#7a4dff" },
  { w: 0.42, body: "#ffd0dc", icing: "#ffffff" },
];
const TIER_H = 17; // % of the lane height per tier
function CakeScene({ entries, ctx, s }: SceneProps) {
  const top = TIER_H * TIERS.length;
  const factor = (h: number) => TIERS[Math.min(TIERS.length - 1, Math.max(0, Math.floor((h - 1) / TIER_H)))].w * 0.92;
  return (
    <>
      <div className="absolute inset-x-[5%] top-0 bottom-[8vh]" aria-hidden>
        {/* plate */}
        <div className="absolute bottom-[-1.4vh] left-[-2%] right-[-2%] h-[2.6vh] rounded-[50%] border-[length:var(--line-w)] border-[var(--line)] bg-white" />
        {TIERS.map((t, k) => (
          <motion.div
            key={k}
            className="absolute overflow-hidden rounded-t-[2vh] border-[length:var(--line-w)] border-[var(--line)]"
            style={{ left: `${50 - (t.w * 100) / 2}%`, width: `${t.w * 100}%`, bottom: `${k * TIER_H}%`, height: `${TIER_H}%`, background: t.body }}
            initial={ctx.animate ? { scaleY: 0, opacity: 0 } : false}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: k * 0.08, type: "spring", stiffness: 200, damping: 18 }}
          >
            {/* icing drips */}
            <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[38%] w-full">
              <path d="M0 0h200v14c-8 0-8 16-16 16s-8-12-16-12-6 20-16 20-8-18-16-18-8 10-16 10-8-14-16-14-7 22-16 22-8-16-16-16-8 12-16 12-8-18-16-18-8 10-16 10-8-8-16-8z" fill={t.icing} stroke="var(--line)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            {/* sprinkles and berries */}
            {Array.from({ length: 7 }, (_, j) => (
              <span
                key={j}
                className="absolute h-[0.7vh] w-[1.6vh] rounded-full"
                style={{ left: `${8 + j * 13}%`, top: `${55 + ((j * 37) % 30)}%`, background: `var(--color-a${(j % 4) + 1})`, transform: `rotate(${(j * 47) % 180}deg)` }}
              />
            ))}
          </motion.div>
        ))}
        {/* candles */}
        <div className="absolute left-1/2 flex -translate-x-1/2 items-end gap-[1.6vw]" style={{ bottom: `${top}%` }}>
          {[0, 1, 2, 3, 4].map((k) => (
            <div key={k} className="flex flex-col items-center">
              <motion.span
                className="block h-[3.2vh] w-[1.6vh] rounded-[50%_50%_50%_50%/65%_65%_35%_35%] bg-[radial-gradient(circle_at_50%_70%,#fff6c2,#ffb627_55%,#ff5a3c)] shadow-[0_0_2vh_#ffb627]"
                initial={false}
                animate={ctx.done ? { scale: [0, 1.3, 1], opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ delay: ctx.animate ? k * 0.12 : 0, duration: 0.4 }}
                style={{ transformOrigin: "50% 100%" }}
              />
              <span className="block h-[6vh] w-[1.3vh] rounded-t-[0.4vh] border-[length:var(--line-w)] border-[var(--line)] bg-[repeating-linear-gradient(135deg,#fff_0_0.6vh,var(--color-a1)_0.6vh_1.2vh)]" />
            </div>
          ))}
        </div>
      </div>
      <Climb
        entries={entries}
        ctx={ctx}
        base={1.5}
        span={top - 1.5}
        inward={factor}
        rider={(e) => (
          <>
            <Crown show={ctx.settled && e.leader} />
            <Figure player={e.st.player} pose={ctx.done ? (e.leader ? "cheer" : "wave") : "run"} color={e.color} width={ctx.figW} enter={false} />
            <Turtle e={e} ctx={ctx} s={s} />
          </>
        )}
      />
    </>
  );
}

// Kid's birthday: everyone floats up holding three balloons, toward a rainbow.
function BalloonScene({ entries, ctx, s }: SceneProps) {
  return (
    <>
      <div className="absolute inset-0" aria-hidden>
        <svg viewBox="0 0 400 120" className="absolute inset-x-[10%] top-[-2vh] h-[24vh] w-[80%]" preserveAspectRatio="xMidYMax meet">
          {["#ff4757", "#ff9f1a", "#ffd23f", "#2ed573", "#1e90ff", "#6c5cff"].map((c, k) => (
            <path key={c} d={`M${20 + k * 9} 120a${180 - k * 9} ${100 - k * 9} 0 0 1 ${360 - k * 18} 0`} fill="none" stroke={c} strokeWidth="9" />
          ))}
        </svg>
        <div className="absolute left-[6%] top-[22%] h-[9vh] w-[16vh]"><Cloud outline /></div>
        <div className="absolute right-[8%] top-[34%] h-[8vh] w-[14vh]"><Cloud outline /></div>
        {/* grass */}
        <div className="absolute inset-x-0 bottom-0 h-[10vh] rounded-t-[50%_100%] border-t-[length:var(--line-w)] border-[var(--line)] bg-[#2ed573]" />
      </div>
      <Climb
        entries={entries}
        ctx={ctx}
        base={0}
        span={44}
        rider={(e) => (
          <>
            <Crown show={ctx.settled && e.leader} />
            <div className="relative flex h-[min(13vh,10vw)] w-[min(12vh,9vw)] items-end justify-center">
              {[-1, 0, 1].map((k) => (
                <motion.div
                  key={k}
                  className="absolute bottom-0 h-full w-1/2"
                  style={{ left: `${25 + k * 22}%`, rotate: k * 14, transformOrigin: "50% 100%" }}
                  animate={{ rotate: [k * 14 - 4, k * 14 + 4] }}
                  transition={{ repeat: Infinity, repeatType: "mirror", duration: 1.4 + k * 0.2 }}
                >
                  <Balloon i={e.slot + k + 1} outline />
                </motion.div>
              ))}
            </div>
            <Figure player={e.st.player} pose={ctx.done && e.leader ? "cheer" : "wave"} color={e.color} width={ctx.figW} enter={false} />
            <Turtle e={e} ctx={ctx} s={s} />
          </>
        )}
      />
    </>
  );
}

// Kids: rockets with each player in the window, racing to the moon.
function MoonScene({ entries, ctx, s }: SceneProps) {
  return (
    <>
      <div className="absolute inset-0" aria-hidden>
        <motion.div
          className="absolute left-1/2 top-[-12vh] h-[30vh] w-[30vh] -translate-x-1/2 rounded-full border-[length:var(--line-w)] border-[var(--line)] bg-[radial-gradient(circle_at_35%_35%,#fffbe6,#f3e3a2_55%,#d9c57a)]"
          animate={ctx.done ? { boxShadow: ["0 0 0vh #fff7c2", "0 0 10vh #fff7c2", "0 0 5vh #fff7c2"] } : { boxShadow: "0 0 4vh rgb(255 247 194 / .5)" }}
          transition={{ duration: 1.2 }}
        >
          {[[30, 60, 4], [62, 70, 3], [50, 82, 2.4], [70, 50, 2]].map(([x, y, r], k) => (
            <span key={k} className="absolute rounded-full bg-[#cdb76a]" style={{ left: `${x}%`, top: `${y}%`, width: `${r}vh`, height: `${r}vh` }} />
          ))}
        </motion.div>
        {ctx.done && entries.some((e) => e.leader) && (
          <motion.span
            className="absolute left-[calc(50%+6vh)] top-[8vh] origin-bottom text-[min(8vh,6vw)]"
            initial={ctx.animate ? { scale: 0, rotate: -40 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.3 }}
          >
            🚩
          </motion.span>
        )}
      </div>
      <Climb
        entries={entries}
        ctx={ctx}
        base={0}
        span={56}
        rider={(e) => (
          <>
            <Crown show={ctx.settled && e.leader} />
            <div className="relative h-[min(17vh,11vw)] w-[min(7vh,4.6vw)]">
              <Rocket />
              <div className="absolute left-1/2 top-[29%] -translate-x-1/2">
                <Avatar player={e.st.player} size={40} className="!h-[min(4.6vh,3vw)] !w-[min(4.6vh,3vw)] ring-2 ring-[#050a24]" />
              </div>
            </div>
            <Turtle e={e} ctx={ctx} s={s} />
          </>
        )}
        under={(e, h) =>
          // a fading exhaust trail from the pad to the rocket
          ctx.animate || ctx.done ? (
            <motion.div
              className="absolute bottom-0 w-[1.2vh] -translate-x-1/2 rounded-full bg-[linear-gradient(to_top,transparent,rgb(255_182_39/.65))]"
              style={{ left: `${((e.slot + 0.5) / ctx.n) * 100}%` }}
              initial={ctx.animate ? { height: "0%" } : false}
              animate={{ height: `${h}%`, opacity: ctx.settled ? 0.25 : 0.8 }}
              transition={{ duration: ctx.animate ? e.dur : 0, ease }}
            />
          ) : null
        }
      />
    </>
  );
}

// Wedding: a walk down the aisle to the flower arch; the winner catches the bouquet.
function AisleScene({ entries, ctx, s, finale }: SceneProps) {
  return (
    <Race
      entries={entries}
      ctx={ctx}
      finale={finale}
      span={86}
      backdrop={
        // the white runner, scattered with petals
        <div className="absolute inset-y-[3%] inset-x-0 rounded-[1vh] bg-[linear-gradient(90deg,#fffdf8,#f3e9da)] shadow-[inset_0_0_0_1px_rgb(169_129_74/.35)]">
          {Array.from({ length: 30 }, (_, k) => (
            <span key={k} className="absolute h-[1.1vh] w-[0.8vh] rounded-[50%_50%_50%_0]" style={{ left: `${(k * 37) % 96}%`, top: `${(k * 53) % 92}%`, background: k % 3 ? "#f3c9cf" : "#e7aab4", transform: `rotate(${k * 41}deg)` }} />
          ))}
        </div>
      }
      finish={(leaderRow) => (
        <div className="relative h-full w-[min(22vh,13vw)]">
          <svg viewBox="0 0 120 300" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <path d="M18 300V70a42 42 0 0 1 84 0v230" fill="none" stroke="#a9814a" strokeWidth="5" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* flowers along the arch */}
          {Array.from({ length: 30 }, (_, k) => {
            const top = k < 10;
            const a = Math.PI + (k / 9) * Math.PI;
            const x = top ? 50 + Math.cos(a) * 35 : k % 2 ? 15 : 85;
            const y = top ? 23 + Math.sin(a) * 14 : 23 + ((k - 10) / 20) * 76;
            return (
              <span
                key={k}
                className="absolute h-[2.6vh] w-[2.6vh] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#a9814a]/60"
                style={{ left: `${x}%`, top: `${y}%`, background: ["#f3c9cf", "#ffffff", "#e7aab4", "#a9bfa6"][k % 4] }}
              />
            );
          })}
          {/* the bouquet flies down to the winner */}
          {ctx.done && leaderRow >= 0 && (
            <motion.span
              className="absolute left-1/2 z-30 -translate-x-1/2 text-[min(7vh,5vw)]"
              initial={ctx.animate ? { top: "-20%", rotate: -70, scale: 0.5 } : false}
              animate={{ top: `${((leaderRow + 0.05) / ctx.n) * 100}%`, rotate: 12, scale: 1 }}
              transition={{ duration: 1.1, ease: [0.2, 0.7, 0.3, 1], delay: 0.25 }}
            >
              💐
            </motion.span>
          )}
        </div>
      )}
      rider={(e) => (
        <>
          <Figure player={e.st.player} pose={ctx.done ? (e.leader ? "cheer" : "stand") : "run"} color={e.color} width={ctx.figW} speed={0.55} enter={false} />
          <div className="mb-[2vh] flex flex-col items-start">
            <Crown show={ctx.settled && e.leader && !finale} />
            <Turtle e={e} ctx={ctx} s={s} />
          </div>
        </>
      )}
    />
  );
}

// Bar / Bat Mitzvah: hora! Everyone is lifted on a chair; the leader goes highest.
function Chair() {
  return (
    <svg viewBox="0 0 60 56" className="h-full w-full overflow-visible">
      <path d="M12 2h36v26H12z" fill="#d99a26" stroke="#3a2600" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M16 6h28v18H16z" fill="#b3214f" />
      <path d="M6 28h48l-4 8H10z" fill="#e8b64c" stroke="#3a2600" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M12 36v18M48 36v18M22 36v14M38 36v14" stroke="#3a2600" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
function HoraScene({ entries, ctx, s }: SceneProps) {
  return (
    <>
      <div className="absolute inset-0" aria-hidden>
        {ctx.done && entries.some((e) => e.leader) && (
          <motion.div
            className="absolute left-1/2 top-[-10vh] h-[120%] w-[26vw] -translate-x-1/2"
            style={{ background: "conic-gradient(from 165deg at 50% 0%, transparent, rgb(255 230 160 / .32) 15deg, transparent 30deg)" }}
            initial={ctx.animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
          />
        )}
        {/* the crowd, arms up */}
        <div className="absolute inset-x-0 bottom-[7vh] flex h-[11vh] items-end justify-around overflow-hidden px-[1vw]">
          {Array.from({ length: 26 }, (_, k) => (
            <motion.div
              key={k}
              className="relative flex flex-col items-center"
              animate={{ y: ["0vh", "-0.8vh", "0vh"] }}
              transition={{ repeat: Infinity, duration: 0.55, delay: (k % 5) * 0.1 }}
            >
              <span className="absolute -top-[3vh] h-[4vh] w-[0.7vh] origin-bottom -rotate-[20deg] rounded-full bg-[#050b1e]" style={{ left: "-0.4vh" }} />
              <span className="absolute -top-[3vh] h-[4vh] w-[0.7vh] origin-bottom rotate-[20deg] rounded-full bg-[#050b1e]" style={{ right: "-0.4vh" }} />
              <span className="h-[3.4vh] w-[3.4vh] rounded-full bg-[#050b1e]" />
              <span className="h-[6vh] w-[5vh] rounded-t-[2vh] bg-[#050b1e]" />
            </motion.div>
          ))}
        </div>
      </div>
      <Climb
        entries={entries}
        ctx={ctx}
        base={10}
        span={40}
        bounce={ctx.animate || ctx.done}
        rider={(e) => (
          <>
            <Crown show={ctx.settled && e.leader} />
            <Figure player={e.st.player} pose={e.leader && ctx.done ? "cheer" : "wave"} color={e.color} width={ctx.figW} enter={false} />
            <div className="-mt-[2.2vh] h-[min(7vh,5vw)] w-[min(7.5vh,5.4vw)]">
              <Chair />
            </div>
            {/* hands holding the chair up */}
            <div className="flex gap-[1.4vh]">
              {[0, 1, 2].map((k) => (
                <span key={k} className="h-[4vh] w-[0.9vh] rounded-full bg-[#f2d2b4] shadow-[0_0_0_1px_#3a2600]" />
              ))}
            </div>
            <Turtle e={e} ctx={ctx} s={s} />
          </>
        )}
      />
    </>
  );
}

// Baby shower: strollers racing to a giant teddy bear.
function Pram({ rolling }: { rolling: boolean }) {
  return (
    <svg viewBox="0 0 90 70" className="h-full w-full overflow-visible">
      <path d="M8 22h52a2 2 0 0 1 2 2c0 15-12 24-28 24S6 39 6 24a2 2 0 0 1 2-2z" fill="#a58cf5" stroke="#2a3352" strokeWidth="2.5" />
      <path d="M10 22A24 24 0 0 1 34 0v22z" fill="#f7799c" stroke="#2a3352" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M60 24l10-14h12" fill="none" stroke="#2a3352" strokeWidth="3" strokeLinecap="round" />
      {[18, 52].map((cx) => (
        <motion.g key={cx} animate={rolling ? { rotate: 360 } : undefined} transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}>
          <circle cx={cx} cy="58" r="10" fill="#fff" stroke="#2a3352" strokeWidth="2.5" />
          <path d={`M${cx - 9} 58h18M${cx} 49v18`} stroke="#2a3352" strokeWidth="1.5" />
        </motion.g>
      ))}
    </svg>
  );
}
function StrollerScene({ entries, ctx, s, finale }: SceneProps) {
  return (
    <>
      <Race
        entries={entries}
        ctx={ctx}
        finale={finale}
        span={74}
        finishAt={92}
        area="inset-y-[2vh] start-[1vw] end-[1vw]"
        finish={() => (
          <div className="relative flex h-full w-[min(18vh,11vw)] items-center justify-center">
            <div className="absolute inset-y-0 left-1/2 w-[1vh] -translate-x-1/2 rounded-full bg-[repeating-linear-gradient(#f7799c_0_2vh,#ffffff_2vh_4vh)] shadow" />
            <motion.span
              className="relative text-[min(16vh,10vw)] leading-none drop-shadow-[0_1vh_1vh_rgb(90_110_170/.35)]"
              animate={ctx.done ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] } : undefined}
              transition={{ duration: 0.8, repeat: ctx.done ? 2 : 0 }}
            >
              🧸
            </motion.span>
          </div>
        )}
        lane={(_, i) => <div className={`absolute inset-y-[6%] start-[22%] end-0 rounded-full ${i % 2 ? "bg-white/60" : "bg-white/35"}`} />}
        rider={(e) => (
          <>
            <motion.div
              className="relative h-[min(9vh,7vw)] w-[min(11.5vh,9vw)]"
              animate={ctx.done ? { y: e.leader ? ["0vh", "-2vh", "0vh"] : 0 } : { y: ["0vh", "-0.5vh", "0vh"] }}
              transition={{ repeat: Infinity, duration: ctx.done ? 0.6 : 0.25 }}
              style={{ scaleX: ctx.rtl ? -1 : 1 }}
            >
              <Pram rolling={!ctx.done} />
              <div className="absolute left-[14%] top-[6%]" style={{ transform: ctx.rtl ? "scaleX(-1)" : undefined }}>
                <Avatar player={e.st.player} size={40} className="!h-[min(4.6vh,3.4vw)] !w-[min(4.6vh,3.4vw)] ring-2 ring-white" />
              </div>
            </motion.div>
            <div className="mb-[2vh] flex flex-col items-start">
              <Crown show={ctx.settled && e.leader && !finale} />
              <Turtle e={e} ctx={ctx} s={s} />
            </div>
          </>
        )}
      />
    </>
  );
}

// Anniversary: champagne corks pop, each with a player riding it, up to two glasses.
function Bottle() {
  return (
    <svg viewBox="0 0 40 110" className="h-full w-full">
      <path d="M15 4h10v26c0 6 11 12 11 26v48a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V56c0-14 11-20 11-26z" fill="#1d3b2a" stroke="#0b1a12" strokeWidth="2" />
      <path d="M14 4h12v24H14z" fill="#e9c58a" />
      <rect x="8" y="64" width="24" height="22" rx="2" fill="#fbeee6" />
      <path d="M12 75h16" stroke="#b3214f" strokeWidth="2" />
      <path d="M9 60c0-8 4-12 6-14" stroke="#fff" strokeOpacity=".35" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function Glass({ side, clink }: { side: 1 | -1; clink: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 40 100"
      className="h-full w-full overflow-visible"
      style={{ originX: "50%", originY: "100%" }}
      animate={clink ? { rotate: [0, side * 14, side * 9] } : { rotate: side * -4 }}
      transition={{ duration: 0.6 }}
    >
      <path d="M8 4h24l-3 40a9 9 0 0 1-18 0z" fill="rgb(245 220 176 / .35)" stroke="#e9c58a" strokeWidth="2" />
      <path d="M10 18h20l-2 26a8 8 0 0 1-16 0z" fill="#f5dcb0" />
      <path d="M20 53v38M10 94h20" stroke="#e9c58a" strokeWidth="2.5" strokeLinecap="round" />
    </motion.svg>
  );
}
function CorkScene({ entries, ctx, s }: SceneProps) {
  return (
    <>
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-[-1vh] flex h-[17vh] -translate-x-1/2 items-end gap-[0.5vh]">
          <div className="h-full w-[7vh]"><Glass side={1} clink={ctx.done} /></div>
          <div className="h-full w-[7vh]"><Glass side={-1} clink={ctx.done} /></div>
        </div>
        {ctx.done && (
          <motion.span
            className="absolute left-1/2 top-[1vh] -translate-x-1/2 text-[min(7vh,5vw)]"
            initial={ctx.animate ? { scale: 0, y: "3vh" } : false}
            animate={{ scale: [0, 1.4, 1], y: "-1vh" }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            ❤️
          </motion.span>
        )}
      </div>
      {/* the bottles, one per lane */}
      <div className="absolute inset-x-[5%] bottom-[8vh] h-[15vh]" dir="ltr" aria-hidden>
        {entries.map((e) => (
          <div key={e.st.player.id} className="absolute bottom-0 h-full w-[min(5.5vh,4vw)] -translate-x-1/2" style={{ left: `${((e.slot + 0.5) / ctx.n) * 100}%` }}>
            <Bottle />
          </div>
        ))}
      </div>
      <Climb
        entries={entries}
        ctx={ctx}
        base={17}
        span={46}
        rider={(e) => (
          <>
            <Crown show={ctx.settled && e.leader} />
            <Figure player={e.st.player} pose={ctx.done && e.leader ? "cheer" : "wave"} color={e.color} width={ctx.figW} enter={false} />
            <span className="-mt-[1vh] block h-[3.4vh] w-[2.6vh] rounded-[0.6vh_0.6vh_1vh_1vh] border-2 border-[#5a3a1a] bg-[repeating-linear-gradient(0deg,#c99a5b_0_0.6vh,#b5844a_0.6vh_1.2vh)]" />
            <Turtle e={e} ctx={ctx} s={s} />
          </>
        )}
        under={(e, h) => (
          // the champagne spray under each cork
          <motion.div
            className="absolute w-[2.4vh] -translate-x-1/2 overflow-hidden"
            style={{ left: `${((e.slot + 0.5) / ctx.n) * 100}%`, bottom: "17%" }}
            initial={ctx.animate ? { height: "0%" } : false}
            animate={{ height: `${h - 17}%`, opacity: ctx.settled ? 0.35 : 0.9 }}
            transition={{ duration: ctx.animate ? e.dur : 0, ease }}
          >
            <div className="h-full w-full bg-[radial-gradient(circle,rgb(245_220_176/.9)_0_25%,transparent_30%)] bg-[length:1.2vh_1.6vh]" />
          </motion.div>
        )}
      />
    </>
  );
}

// Party: a dance-off. Neon columns rise like an equalizer; the leader touches the disco ball.
function DanceScene({ entries, ctx, s }: SceneProps) {
  const neon = ["#ff2fb4", "#2ff3e0", "#ffe14f", "#9b5bff", "#22b8ff", "#ff8a3d", "#7dff6a", "#ff5a7a"];
  return (
    <>
      <div className="absolute inset-0" aria-hidden>
        {/* disco ball */}
        <div className="absolute left-1/2 top-[-2vh] flex -translate-x-1/2 flex-col items-center">
          <span className="h-[4vh] w-[0.3vh] bg-white/50" />
          <motion.span
            className="block h-[13vh] w-[13vh] rounded-full shadow-[0_0_6vh_rgb(255_255_255/.35)]"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, rgb(255 255 255 / .9), transparent 30%), repeating-linear-gradient(90deg, #9aa3c7 0 1.2vh, #e8ecff 1.2vh 1.4vh), repeating-linear-gradient(0deg, transparent 0 1.2vh, rgb(30 30 60 / .5) 1.2vh 1.4vh)",
              backgroundBlendMode: "screen, normal, multiply",
            }}
            animate={{ backgroundPositionX: ["0vh", "14vh"] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
          />
        </div>
        {ctx.done &&
          [-50, -25, 0, 25, 50].map((r, k) => (
            <motion.span
              key={r}
              className="absolute left-1/2 top-[8vh] h-[90vh] w-[2vh] origin-top"
              style={{ background: `linear-gradient(${neon[k]}, transparent 75%)`, rotate: r, mixBlendMode: "screen" }}
              initial={ctx.animate ? { opacity: 0 } : false}
              animate={{ opacity: [0.2, 0.6, 0.2], rotate: [r - 6, r + 6] }}
              transition={{ repeat: Infinity, repeatType: "mirror", duration: 1.6 + k * 0.2 }}
            />
          ))}
        {/* glowing dance floor */}
        <div className="absolute inset-x-[-10%] bottom-[-4vh] h-[16vh] [transform:perspective(30vh)_rotateX(55deg)]">
          <div className="grid h-full grid-cols-12 grid-rows-3 gap-[0.4vh]">
            {Array.from({ length: 36 }, (_, k) => (
              <motion.span
                key={k}
                className="rounded-[0.3vh]"
                animate={{ opacity: [0.15, 0.7, 0.15] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: ((k * 7) % 12) * 0.1 }}
                style={{ background: neon[k % neon.length] }}
              />
            ))}
          </div>
        </div>
      </div>
      <Climb
        entries={entries}
        ctx={ctx}
        base={0}
        span={62}
        rider={(e) => (
          <>
            <Crown show={ctx.settled && e.leader} />
            <Figure player={e.st.player} pose="cheer" color={e.color} width={ctx.figW} enter={false} speed={1.4} />
            <Turtle e={e} ctx={ctx} s={s} />
          </>
        )}
        under={(e, h) => {
          const c = neon[e.slot % neon.length];
          return (
            <motion.div
              className="absolute bottom-0 w-[min(5vh,4vw)] -translate-x-1/2 rounded-t-[1vh] border-2"
              style={{ left: `${((e.slot + 0.5) / ctx.n) * 100}%`, borderColor: c, background: `linear-gradient(to top, transparent, ${c}55)`, boxShadow: `0 0 2vh ${c}` }}
              initial={ctx.animate ? { height: "0%" } : false}
              animate={{ height: `${Math.max(0, h - 1)}%` }}
              transition={{ duration: ctx.animate ? e.dur : 0, ease }}
            />
          );
        }}
      />
    </>
  );
}
