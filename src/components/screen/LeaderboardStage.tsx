"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useElapsed } from "@/hooks/useElapsed";
import { burst } from "@/lib/confetti";
import type { SoundName } from "@/lib/sound";
import type { Strings } from "@/lib/strings";
import { template } from "@/lib/templates";
import { LB_DONE_MS, LB_RACE_MS, LB_STRIKE_MS } from "@/lib/timing";
import type { ScreenSnapshot, Standing } from "@/lib/types";
import { Figure, RUNNER_COLORS } from "../finale/Figure";
import { ThemeShow } from "../shows/ThemeShow";

const MAX_LANES = 8;
const OPENERS = ["lights", "bowling", "drumroll", "balloon"] as const;

/**
 * The leaderboard as a little show, different each time: a short opener
 * (starting lights, a bowling strike, a drumroll, or a balloon that pops),
 * then either a running race or rockets flying up, where how far each
 * player's character gets matches their score. The leader gets a crown;
 * whoever is last gets a gentle comic moment. Timed from the moment the state
 * began, so a refresh jumps straight to the right moment.
 */
export function LeaderboardStage({
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
  const standings = snap.standings ?? [];
  const elapsed = useElapsed(msInState, LB_DONE_MS + 100, snap.game.stateChangedAt);
  const bowling = elapsed < LB_STRIKE_MS && standings.length > 0;
  // A different mix each time: one of four openers, then one of two shows.
  const h = snap.game.currentIndex * 7 + 3;
  const opener = OPENERS[h % OPENERS.length];
  // Mostly the event's own show (cake climb, aisle walk, hora…), and every
  // third time one of the classic ones, for variety.
  const i = snap.game.currentIndex;
  const classic = i % 3 === 2 ? (Math.floor(i / 3) % 2 === 0 || snap.game.template === "kids" ? "race" : "rockets") : null;
  const show = classic ?? "theme";

  // Watching it happen (not a refresh in the middle): play sounds and animate.
  // (The TV's scene change takes a moment, so allow some slack.)
  const [live] = useState(() => elapsed < 2000);
  const fired = useRef(new Set<string>());
  useEffect(() => {
    if (!live) return;
    const once = (k: string, fn: () => void) => {
      if (!fired.current.has(k)) {
        fired.current.add(k);
        fn();
      }
    };
    once("opener", () => sound(opener === "bowling" ? "strike" : opener === "lights" ? "tick" : "whoosh"));
    if (elapsed >= LB_RACE_MS) once("tada", () => {
      sound("tada");
      burst(0.8);
    });
  });

  return (
    <div className="relative h-full overflow-hidden">
      <AnimatePresence mode="wait">
        {bowling ? (
          <motion.div key="bowl" className="absolute inset-0" exit={{ opacity: 0, scale: 1.08 }} transition={{ duration: 0.35 }}>
            {opener === "bowling" ? (
              <Strike s={s} template={snap.game.template} skip={!live} />
            ) : opener === "lights" ? (
              <Lights s={s} skip={!live} sound={sound} />
            ) : opener === "drumroll" ? (
              <Drumroll s={s} skip={!live} />
            ) : (
              <Balloon s={s} template={snap.game.template} skip={!live} />
            )}
          </motion.div>
        ) : (
          <motion.div key="race" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {show === "theme" ? (
              <ThemeShow
                template={snap.game.template}
                standings={standings}
                s={s}
                elapsed={Math.max(0, elapsed - LB_STRIKE_MS)}
                duration={(LB_RACE_MS - LB_STRIKE_MS) / 1000}
                animate={live}
              />
            ) : show === "race" ? (
              <Race s={s} standings={standings} elapsed={elapsed} animate={live} />
            ) : (
              <Rockets s={s} standings={standings} elapsed={elapsed} animate={live} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------------ bowling

// Pin positions on the lane, back row first (drawn first, so front pins overlap them).
const PINS = [
  [725, 170], [775, 170], [825, 170], [875, 170],
  [750, 196], [800, 196], [850, 196],
  [775, 222], [825, 222],
  [800, 248],
];
// Deterministic "random" flight for each pin.
const FLIGHT = PINS.map((_, i) => {
  const r = (n: number) => ((Math.sin((i + 1) * n) + 1) / 2);
  const side = PINS[i][0] < 800 ? -1 : PINS[i][0] > 800 ? 1 : i % 2 ? 1 : -1;
  return { x: side * (120 + r(12.9) * 380), y: -(140 + r(78.2) * 320), rotate: side * (200 + r(3.7) * 500) };
});
const HIT_S = 1.05;

function Pin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 14} ${y - 52}) scale(0.7)`}>
      <path
        d="M20 0 C30 0 32 12 28 24 C26 30 26 34 30 42 C40 60 40 84 32 100 L8 100 C0 84 0 60 10 42 C14 34 14 30 12 24 C8 12 10 0 20 0 Z"
        fill="#fbfaf7"
        stroke="rgb(0 0 0 / 0.25)"
        strokeWidth="1.5"
      />
      <rect x="11.5" y="27" width="17" height="5" rx="2" style={{ fill: "var(--color-gold-deep)" }} />
      <rect x="11" y="35" width="18" height="4" rx="2" style={{ fill: "var(--color-gold-deep)" }} />
    </g>
  );
}

function Strike({ s, template: id, skip }: { s: Strings; template: string; skip: boolean }) {
  const decor = template(id).decor;
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="lane" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--color-ink-800)" }} />
            <stop offset="1" style={{ stopColor: "var(--color-ink-700)" }} />
          </linearGradient>
          <radialGradient id="ball" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" style={{ stopColor: "var(--color-gold-soft)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--color-gold)" }} />
            <stop offset="1" style={{ stopColor: "var(--color-gold-deep)" }} />
          </radialGradient>
        </defs>
        {/* gutters and lane in perspective */}
        <polygon points="230,900 1370,900 975,140 625,140" style={{ fill: "var(--color-ink-850)" }} />
        <polygon points="300,900 1300,900 950,140 650,140" fill="url(#lane)" />
        {[0.2, 0.4, 0.6, 0.8].map((f) => (
          <line
            key={f}
            x1={300 + 1000 * f}
            y1={900}
            x2={650 + 300 * f}
            y2={140}
            style={{ stroke: "var(--color-ink-600)" }}
            strokeWidth="2"
            opacity="0.5"
          />
        ))}
        {/* arrows painted on the lane */}
        {[-2, -1, 0, 1, 2].map((k) => (
          <polygon key={k} points={`${800 + k * 70},590 ${788 + k * 70},612 ${812 + k * 70},612`} style={{ fill: "var(--color-gold)" }} opacity="0.5" />
        ))}

        {/* pins */}
        {PINS.map(([x, y], i) => (
          <motion.g
            key={i}
            initial={skip ? false : { x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: FLIGHT[i].x, y: FLIGHT[i].y, rotate: FLIGHT[i].rotate, opacity: 0 }}
            transition={{ delay: HIT_S + (y - 170) / 900, duration: 1.1, ease: [0.2, 0.7, 0.4, 1] }}
          >
            <Pin x={x} y={y} />
          </motion.g>
        ))}

        {/* the ball */}
        <motion.g
          initial={skip ? false : { x: 0, y: 0, scale: 1 }}
          animate={{ x: 10, y: -630, scale: 0.38, opacity: [1, 1, 0] }}
          transition={{ duration: skip ? 0 : HIT_S + 0.2, ease: [0.4, 0, 0.9, 0.6], opacity: { times: [0, 0.85, 1] } }}
        >
          <circle cx="800" cy="840" r="66" fill="url(#ball)" />
          <circle cx="780" cy="812" r="8" style={{ fill: "var(--color-ink-900)" }} />
          <circle cx="806" cy="806" r="8" style={{ fill: "var(--color-ink-900)" }} />
          <circle cx="796" cy="834" r="10" style={{ fill: "var(--color-ink-900)" }} />
        </motion.g>
      </svg>

      {/* flash + STRIKE! */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-cream"
        initial={{ opacity: 0 }}
        animate={{ opacity: skip ? 0 : [0, 0, 0.35, 0] }}
        transition={{ duration: 1.6, times: [0, HIT_S / 1.6, (HIT_S + 0.08) / 1.6, 1] }}
      />
      <div className="absolute inset-x-0 top-[24%] flex flex-col items-center">
        <motion.p
          className="font-display text-[min(22vh,17vw)] font-black italic leading-none text-gold [text-shadow:0_0.06em_0_var(--color-gold-deep),0_0.12em_0.3em_rgb(0_0_0/0.4)]"
          initial={{ scale: skip ? 1 : 3, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: -6 }}
          transition={{ delay: skip ? 0 : HIT_S + 0.25, type: "spring", stiffness: 260, damping: 11 }}
        >
          {s.scrStrike}
        </motion.p>
        <div className="relative h-0 w-0">
          {decor.concat(decor).map((e, i) => {
            const a = (i / (decor.length * 2)) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                className="absolute text-[min(7vh,6vw)]"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{ x: Math.cos(a) * 520, y: Math.sin(a) * 260 - 120, opacity: [0, 1, 1, 0], scale: 1.2, rotate: (i % 2 ? 1 : -1) * 90 }}
                transition={{ delay: skip ? 0 : HIT_S + 0.3, duration: 1.6, ease: "easeOut" }}
              >
                {e}
              </motion.span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ other openers

function Lights({ s, skip, sound }: { s: Strings; skip: boolean; sound: (n: SoundName) => void }) {
  const steps = [0.3, 1.1, 1.9]; // red, red, green (seconds)
  useEffect(() => {
    if (skip) return;
    const ts = steps.map((t, i) => window.setTimeout(() => sound(i === 2 ? "reveal" : "tick"), t * 1000));
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[5vh]">
      <div className="flex gap-[3vw] rounded-[4vh] border-[1vh] border-ink-700 bg-ink-900 px-[3vw] py-[3vh]">
        {steps.map((t, i) => (
          <motion.span
            key={i}
            className="h-[16vh] w-[16vh] rounded-full bg-ink-800"
            initial={skip ? false : { backgroundColor: "var(--color-ink-800)", boxShadow: "0 0 0 0 transparent" }}
            animate={{
              backgroundColor: i === 2 ? "#2bd96b" : "#ff3b3b",
              boxShadow: `0 0 80px 10px ${i === 2 ? "#2bd96b88" : "#ff3b3b88"}`,
            }}
            transition={{ delay: skip ? 0 : t, duration: 0.15 }}
          />
        ))}
      </div>
      <motion.p
        className="font-display text-[min(20vh,16vw)] font-black italic leading-none text-gold"
        initial={{ scale: skip ? 1 : 0, rotate: -10 }}
        animate={{ scale: 1, rotate: -4 }}
        transition={{ delay: skip ? 0 : 2.0, type: "spring", stiffness: 300, damping: 10 }}
      >
        {s.scrGo}
      </motion.p>
    </div>
  );
}

function Drumroll({ s, skip }: { s: Strings; skip: boolean }) {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      {/* two spotlights sweeping, then meeting in the middle */}
      {[-1, 1].map((d) => (
        <motion.div
          key={d}
          className="absolute top-[-20vh] h-[140vh] w-[36vw] origin-top bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-gold-soft)_45%,transparent),transparent_70%)] [clip-path:polygon(45%_0,55%_0,100%_100%,0_100%)]"
          style={{ left: d < 0 ? "10vw" : "54vw" }}
          initial={{ rotate: d * 30 }}
          animate={skip ? { rotate: d * -8 } : { rotate: [d * 30, d * -25, d * 20, d * -8] }}
          transition={{ duration: 2.6, ease: "easeInOut" }}
        />
      ))}
      <div className="relative flex flex-col items-center gap-[4vh]">
        <motion.div
          className="text-[min(18vh,14vw)] leading-none"
          animate={{ rotate: [-8, 8], y: [0, -10] }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.12 }}
          aria-hidden
        >
          🥁
        </motion.div>
        <motion.p
          className="font-display text-[min(10vh,8vw)] font-black text-gold"
          initial={{ opacity: 0, letterSpacing: "0.4em" }}
          animate={{ opacity: 1, letterSpacing: "0.02em" }}
          transition={{ delay: skip ? 0 : 0.5, duration: 1.4 }}
        >
          {s.scrDrumroll}
        </motion.p>
      </div>
    </div>
  );
}

function Balloon({ s, template: id, skip }: { s: Strings; template: string; skip: boolean }) {
  const decor = template(id).decor;
  const popAt = 2.1;
  useEffect(() => {
    if (skip) return;
    const t = window.setTimeout(() => burst(1.6), popAt * 1000);
    return () => clearTimeout(t);
  }, [skip]);
  return (
    <div className="relative flex h-full items-center justify-center">
      {!skip && (
        <motion.div
          className="absolute h-[30vh] w-[25vh] rounded-[50%] bg-[radial-gradient(circle_at_35%_30%,var(--color-gold-soft),var(--color-gold)_55%,var(--color-gold-deep))]"
          initial={{ scale: 0.2 }}
          animate={{ scale: [0.2, 1.4, 1.3, 2.3, 2.6], opacity: [1, 1, 1, 1, 0], rotate: [0, -3, 3, -4, 0] }}
          transition={{ duration: popAt, times: [0, 0.35, 0.5, 0.97, 1], ease: "easeInOut" }}
        />
      )}
      <motion.p
        className="relative font-display text-[min(24vh,18vw)] font-black italic leading-none text-gold [text-shadow:0_0.06em_0_var(--color-gold-deep)]"
        initial={{ scale: skip ? 1 : 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: skip ? 0 : popAt, type: "spring", stiffness: 400, damping: 9 }}
      >
        {s.scrPop}
      </motion.p>
      {decor.concat(decor).map((e, i) => {
        const a = (i / (decor.length * 2)) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute text-[min(7vh,6vw)]"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: Math.cos(a) * 600, y: Math.sin(a) * 340, opacity: [0, 1, 0], rotate: 180 }}
            transition={{ delay: skip ? 0 : popAt, duration: 1.4, ease: "easeOut" }}
          >
            {e}
          </motion.span>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ rockets

function Rockets({ s, standings, elapsed, animate }: { s: Strings; standings: Standing[]; elapsed: number; animate: boolean }) {
  const shown = standings.slice(0, MAX_LANES);
  const rest = standings.slice(MAX_LANES);
  const done = elapsed >= LB_RACE_MS;
  const settled = elapsed >= LB_DONE_MS;
  const max = Math.max(1, ...shown.map((x) => x.score));
  const leaderScore = shown[0]?.score ?? 0;
  const lastScore = shown.length > 2 ? shown[shown.length - 1].score : null;
  const flight = (LB_RACE_MS - LB_STRIKE_MS) / 1000;
  const cols = Math.max(shown.length, 4);
  const figW = `min(${46 / cols}vw, 7vh)`;

  if (standings.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[4vh] text-mute">{s.scrNoPlayers}</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col px-[3vw] pb-[2vh] pt-[3vh]">
      {/* stars and the moon */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="absolute h-[0.5vh] w-[0.5vh] rounded-full bg-cream opacity-40"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 70}%` }}
          />
        ))}
        <span className="absolute right-[4vw] top-[3vh] text-[min(12vh,10vw)]">🌙</span>
      </div>
      <h1 className="relative text-center font-display text-[min(6vh,5vw)] font-black text-gold-soft">{s.scrRocketTitle}</h1>
      <div className="relative mt-[1vh] flex min-h-0 flex-1 items-stretch justify-center gap-[1.5vw]">
        {shown.map((st, i) => {
          const pct = 4 + (st.score / max) * 66;
          const isLeader = st.rank === 1 && st.score > 0;
          const isLast = lastScore !== null && st.score === lastScore && st.score < leaderScore;
          const moved = st.previousRank !== null && st.previousRank > st.rank ? st.previousRank - st.rank : 0;
          return (
            <div key={st.player.id} className="relative flex max-w-[14vw] flex-1 flex-col items-center">
              <div className="relative w-full flex-1">
                <motion.div
                  className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center"
                  initial={{ bottom: animate ? "0%" : `${pct}%` }}
                  animate={{ bottom: `${pct}%` }}
                  transition={{ duration: animate ? flight * (0.6 + 0.4 * (st.score / max)) : 0, ease: [0.3, 0.1, 0.25, 1], delay: animate ? i * 0.08 : 0 }}
                >
                  {settled && isLeader && (
                    <motion.span initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[min(5vh,4vw)] leading-none">
                      👑
                    </motion.span>
                  )}
                  <Figure player={st.player} pose={done && isLeader ? "cheer" : "wave"} color={RUNNER_COLORS[i % RUNNER_COLORS.length]} width={figW} enter={false} />
                  <motion.span
                    className="-mt-[1vh] text-[min(7vh,5vw)] leading-none"
                    style={{ rotate: -45 }}
                    animate={isLast && settled ? { x: [-3, 3, -3] } : { y: [0, 2, 0] }}
                    transition={{ repeat: Infinity, duration: isLast && settled ? 0.15 : 0.3 }}
                  >
                    🚀
                  </motion.span>
                  {/* exhaust */}
                  <motion.span
                    className="mt-[-0.5vh] block h-[6vh] w-[1.6vh] rounded-full bg-[linear-gradient(var(--color-gold-soft),transparent)]"
                    animate={{ opacity: done ? 0.3 : [0.6, 1, 0.6], scaleY: done ? 0.5 : [0.8, 1.3, 0.8] }}
                    transition={{ repeat: Infinity, duration: 0.25 }}
                  />
                  {settled && isLast && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="whitespace-nowrap rounded-full bg-ink-800 px-[0.8vw] py-[0.3vh] text-[min(1.8vh,1.6vw)] font-bold text-mute"
                    >
                      {s.scrRaceLast}
                    </motion.span>
                  )}
                </motion.div>
              </div>
              {/* launch pad: place, name, score */}
              <div className="flex w-full flex-col items-center border-t-[0.5vh] border-ink-600 pt-[0.8vh] leading-tight">
                <span className="flex items-center gap-[0.8vw]">
                  <span
                    className={`flex h-[min(4vh,3vw)] w-[min(4vh,3vw)] items-center justify-center rounded-full font-display text-[min(2.4vh,1.9vw)] font-black ${
                      isLeader ? "bg-gold text-ink-950" : "bg-ink-800 text-mute"
                    }`}
                  >
                    {st.rank}
                  </span>
                  <motion.span
                    key={done ? "d" : "r"}
                    initial={done && animate ? { scale: 1.6 } : false}
                    animate={{ scale: 1 }}
                    className="font-display text-[min(3.6vh,3vw)] font-bold tabular-nums"
                  >
                    {done ? st.score : st.previousScore}
                  </motion.span>
                  {settled && moved > 0 && (
                    <span className="text-[min(1.9vh,1.6vw)] font-bold text-gold">
                      <bdi dir="ltr">▲{moved}</bdi>
                    </span>
                  )}
                </span>
                <bdi className="w-full truncate text-center text-[min(2.4vh,1.9vw)] font-bold">{st.player.name}</bdi>
              </div>
            </div>
          );
        })}
      </div>
      {rest.length > 0 && (
        <p className="relative mt-[1vh] truncate text-center text-[min(2.2vh,2vw)] text-mute">
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

// --------------------------------------------------------------------- race

function Race({ s, standings, elapsed, animate }: { s: Strings; standings: Standing[]; elapsed: number; animate: boolean }) {
  const shown = standings.slice(0, MAX_LANES);
  const rest = standings.slice(MAX_LANES);
  const done = elapsed >= LB_RACE_MS;
  const settled = elapsed >= LB_DONE_MS;
  const rtl = s.dir === "rtl";
  const max = Math.max(1, ...shown.map((x) => x.score));
  const lanes = Math.max(shown.length, 3);
  const laneVh = Math.min(15, 74 / lanes);
  const lastScore = shown.length > 2 ? shown[shown.length - 1].score : null;
  const leaderScore = shown[0]?.score ?? 0;
  const raceSec = (LB_RACE_MS - LB_STRIKE_MS) / 1000;

  if (standings.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[4vh] text-mute">{s.scrNoPlayers}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-[3vw] pb-[3vh] pt-[3vh]">
      <h1 className="text-center font-display text-[min(6vh,5vw)] font-black text-gold-soft">{s.scrRaceTitle}</h1>
      <div className="mt-[2vh] flex min-h-0 flex-1 flex-col justify-center">
        {shown.map((st, i) => {
          const pct = 2 + (st.score / max) * 82;
          const isLeader = st.rank === 1 && st.score > 0;
          const isLast = lastScore !== null && st.score === lastScore && st.score < leaderScore;
          const pose = !done ? "run" : isLast ? "trip" : isLeader ? "cheer" : "stand";
          const moved = st.previousRank !== null && st.previousRank > st.rank ? st.previousRank - st.rank : 0;
          // Slower runners take longer; everyone leaves the start line together.
          const duration = animate ? raceSec * (0.55 + 0.45 * (st.score / max)) : 0;
          const side = rtl ? "right" : "left";
          return (
            <div
              key={st.player.id}
              className="flex items-center gap-[1.4vw] border-b border-dashed border-ink-700"
              style={{ height: `${laneVh}vh` }}
            >
              {/* place + name */}
              <span
                className={`w-[3.4vw] shrink-0 text-center font-display font-black leading-none ${isLeader ? "text-gold" : "text-mute"}`}
                style={{ fontSize: `min(${laneVh * 0.45}vh, 4vw)` }}
              >
                {st.rank}
              </span>
              <div className="flex w-[17vw] shrink-0 flex-col justify-center leading-tight">
                <bdi className="truncate font-bold" style={{ fontSize: `min(${Math.max(2.2, laneVh * 0.26)}vh, 2.8vw)` }}>
                  {st.player.name}
                </bdi>
                <span className="flex gap-[0.6vw] text-[min(2vh,1.8vw)]">
                  {settled && moved > 0 && (
                    <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-bold text-gold">
                      <bdi dir="ltr">▲{moved}</bdi>
                    </motion.span>
                  )}
                  {st.streak >= 3 && <span className="text-gold-soft">{s.streak(st.streak)}</span>}
                </span>
              </div>

              {/* the track */}
              <div className="relative h-full min-w-0 flex-1">
                <div
                  className="absolute inset-y-[10%] w-[0.6vh] bg-[repeating-linear-gradient(0deg,var(--color-cream)_0_1vh,var(--color-ink-900)_1vh_2vh)] opacity-70"
                  style={{ [rtl ? "left" : "right"]: "6%" }}
                />
                <motion.div
                  className="absolute bottom-[4%] flex items-end"
                  initial={{ [side]: animate ? "0%" : `${pct}%` }}
                  animate={{ [side]: `${pct}%` }}
                  transition={{ duration, ease: [0.25, 0.6, 0.35, 1] }}
                >
                  <div className="relative" style={rtl ? { transform: "scaleX(-1)" } : undefined}>
                    <Figure
                      player={st.player}
                      pose={pose}
                      color={RUNNER_COLORS[i % RUNNER_COLORS.length]}
                      width={`${laneVh * 0.47}vh`}
                      enter={false}
                      speed={0.8 + 0.5 * (st.score / max)}
                    />
                  </div>
                  {settled && isLeader && (
                    <motion.span
                      className="absolute -top-[0.4em] left-1/2 -translate-x-1/2 leading-none"
                      style={{ fontSize: `${laneVh * 0.32}vh` }}
                      initial={{ y: -30, opacity: 0, rotate: -20 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 12 }}
                    >
                      👑
                    </motion.span>
                  )}
                  {settled && isLast && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ms-[0.8vw] mb-[0.6vh] whitespace-nowrap rounded-full bg-ink-800 px-[0.8vw] py-[0.3vh] text-[min(1.9vh,1.7vw)] font-bold text-mute"
                    >
                      {s.scrRaceLast}
                    </motion.span>
                  )}
                </motion.div>
              </div>

              {/* score */}
              <motion.span
                key={done ? "done" : "running"}
                initial={done && animate ? { scale: 1.6 } : false}
                animate={{ scale: 1 }}
                className="w-[5vw] shrink-0 text-center font-display font-bold tabular-nums leading-none"
                style={{ fontSize: `min(${laneVh * 0.42}vh, 4vw)` }}
              >
                {done ? st.score : st.previousScore}
              </motion.span>
            </div>
          );
        })}
      </div>
      {rest.length > 0 && (
        <p className="mt-[1.5vh] truncate text-center text-[min(2.4vh,2.2vw)] text-mute">
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
