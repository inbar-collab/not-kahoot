"use client";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { MOMENT_EVENT } from "@/lib/confetti";
import type { TemplateId } from "@/lib/types";

/**
 * The living backdrop of each theme, plus its one-shot "moment" when the
 * page celebrates (any burst() call):
 *
 *  birthday       balloons drifting up          → a balloon release
 *  kids_birthday  toys bobbing, clouds drifting → a toy-box pop
 *  kids           twinkling stars, planet, rocket fly-bys, shooting stars → rocket launch
 *  wedding        petals falling, gold dust     → a gold-foil shine
 *  mitzvah        light rays, sparkles, fireworks → firework blooms
 *  baby_shower    soap bubbles, clouds          → a wave of bubbles
 *  anniversary    champagne bubbles, hearts, candlelight → hearts rising
 *  party          lasers, moving spotlights, equalizer → a strobe
 *
 * Everything is CSS keyframes on transform/opacity, at fixed (hashed)
 * positions so every screen shows the same picture. The parent must be
 * `relative isolate`; the layer sits behind its content.
 */
export type AmbientLevel = "full" | "calm" | "phone";
type ThemeId = TemplateId | "site";

export function Ambient({ id, level = "full" }: { id: ThemeId; level?: AmbientLevel }) {
  const [moment, setMoment] = useState<number | null>(null);
  useEffect(() => {
    let t: number | undefined;
    const on = () => {
      setMoment(Date.now());
      window.clearTimeout(t);
      t = window.setTimeout(() => setMoment(null), 4200);
    };
    window.addEventListener(MOMENT_EVENT, on);
    return () => {
      window.removeEventListener(MOMENT_EVENT, on);
      window.clearTimeout(t);
    };
  }, []);

  const pick = (full: number, calm: number, phone: number) => (level === "full" ? full : level === "calm" ? calm : phone);
  return (
    <>
      <div className="amb" style={{ zIndex: -1, opacity: level === "calm" ? 0.7 : 1, position: level === "phone" ? "fixed" : undefined }} aria-hidden>
        {SCENES[id]?.(pick) ?? null}
      </div>
      {moment !== null && (
        <div key={moment} className="amb amb-moment" style={{ zIndex: 40, position: level === "phone" ? "fixed" : undefined }} aria-hidden>
          {MOMENTS[id]?.() ?? null}
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------- helpers --

/** Deterministic 0..1 values for item i (same on server and every client). */
function rnd(i: number, k: number) {
  let h = (i + 1) * 374761393 + (k + 1) * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return ((h >>> 0) % 10000) / 10000;
}
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const v = (o: Record<string, string | number | undefined>) => o as CSSProperties;
const A = (i: number) => `var(--color-a${(i % 4) + 1})`;

type Pick = (full: number, calm: number, phone: number) => number;

// --------------------------------------------------------------- shapes --

export function Balloon({ i, outline }: { i: number; outline: boolean }) {
  const stroke = outline ? { stroke: "var(--line)", strokeWidth: 2 } : {};
  return (
    <svg viewBox="0 0 40 80" className="h-full w-full overflow-visible">
      <path d="M20 48c-2.5 6 3 9 0 14.5s2.5 9 0 16" fill="none" style={{ stroke: outline ? "var(--line)" : "rgb(0 0 0 / .35)" }} strokeWidth="1.3" />
      <path d="M20 2C9.5 2 3 10.5 3 20.5 3 33 12 43 20 45.5 28 43 37 33 37 20.5 37 10.5 30.5 2 20 2z" style={{ fill: A(i), ...stroke }} />
      <path d="M16.5 45.2h7L20 49.5z" style={{ fill: A(i), ...stroke }} />
      <ellipse cx="12.5" cy="14" rx="3.2" ry="6.5" fill="#fff" opacity=".55" transform="rotate(25 12.5 14)" />
    </svg>
  );
}

const TOYS = [
  "M20 3l4.9 10.6 11.6 1.3-8.6 7.9 2.4 11.4L20 28.4 9.7 34.2l2.4-11.4-8.6-7.9 11.6-1.3z",
  "M20 5a15 15 0 1 1 0 30 15 15 0 0 1 0-30zm0 8a7 7 0 1 0 0 14 7 7 0 0 0 0-14z",
  "M20 5l16 28H4z",
  "M4 24c4-8 8-8 12 0s8 8 12 0 6-6 8-4",
  "M16 4h8v12h12v8H24v12h-8V24H4v-8h12z",
];
function Toy({ i }: { i: number }) {
  const k = i % TOYS.length;
  const squiggle = k === 3;
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full overflow-visible">
      <path
        d={TOYS[k]}
        fillRule="evenodd"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={squiggle ? { fill: "none", stroke: A(i), strokeWidth: 6 } : { fill: A(i), stroke: "var(--line)", strokeWidth: 2.5 }}
      />
    </svg>
  );
}

export function Cloud({ outline }: { outline?: boolean }) {
  return (
    <svg viewBox="0 0 64 36" className="h-full w-full overflow-visible">
      <path
        d="M12 33a10 10 0 0 1 1.5-19.9A13 13 0 0 1 38 9a10 10 0 0 1 16 7.5A8.5 8.5 0 0 1 53 33z"
        fill="#fff"
        style={outline ? { stroke: "var(--line)", strokeWidth: 2 } : { opacity: 0.85 }}
      />
    </svg>
  );
}

const SPARK = "M10 0l2.2 7.8L20 10l-7.8 2.2L10 20l-2.2-7.8L0 10l7.8-2.2z";
const HEART = "M10 18s-8-5.2-8-10.4C2 4.4 4.4 2 7.2 2c1.4 0 2.4.7 2.8 1.6C10.4 2.7 11.4 2 12.8 2 15.6 2 18 4.4 18 7.6 18 12.8 10 18 10 18z";
const PETAL = "M10 0C16 5 18 12 10 20 2 12 4 5 10 0z";
const LEAF = "M2 18C2 8 8 2 18 2 18 12 12 18 2 18z";

function Svg({ d, fill, className = "" }: { d: string; fill: string; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-full w-full ${className}`}>
      <path d={d} style={{ fill }} />
    </svg>
  );
}

export function Rocket() {
  return (
    <svg viewBox="0 0 40 96" className="h-full w-full overflow-visible">
      <g className="amb-flame" style={{ transformBox: "fill-box" }}>
        <path d="M12 64Q20 98 28 64z" fill="#ffb627" />
        <path d="M15.5 64Q20 84 24.5 64z" fill="#fff3c4" />
      </g>
      <path d="M8 46 0 62v6l8-4zM32 46l8 16v6l-8-4z" fill="#ff5a3c" stroke="#050a24" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 2C30 12 33 28 32 50v14H8V50C7 28 10 12 20 2z" fill="#f4f6ff" stroke="#050a24" strokeWidth="2.5" />
      <path d="M20 2c5 5 8.5 11 10.5 18h-21C11.5 13 15 7 20 2z" fill="#ff5a3c" stroke="#050a24" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="20" cy="33" r="6" fill="#19b8ff" stroke="#050a24" strokeWidth="2.5" />
      <circle cx="18" cy="31" r="1.8" fill="#fff" opacity=".8" />
    </svg>
  );
}

function Planet() {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="amb-planet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9a6b" />
          <stop offset="1" stopColor="#a35cff" />
        </linearGradient>
      </defs>
      <path d="M8 46c0-8 104-26 104-14" fill="none" stroke="#ffd36b" strokeWidth="5" strokeLinecap="round" opacity=".9" />
      <circle cx="60" cy="40" r="28" fill="url(#amb-planet)" stroke="#050a24" strokeWidth="3" />
      <circle cx="50" cy="30" r="5" fill="#fff" opacity=".18" />
      <circle cx="70" cy="50" r="7" fill="#050a24" opacity=".15" />
      <path d="M8 46c0 10 104-4 104-14" fill="none" stroke="#ffd36b" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Firework({ hue }: { hue: string }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
      {range(14).map((k) => {
        const a = (k / 14) * Math.PI * 2;
        const x = 50 + Math.cos(a) * 42;
        const y = 50 + Math.sin(a) * 42;
        return (
          <g key={k}>
            <line x1={50 + Math.cos(a) * 18} y1={50 + Math.sin(a) * 18} x2={x} y2={y} stroke={hue} strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
            <circle cx={x} cy={y} r="2.6" fill={hue} />
          </g>
        );
      })}
    </svg>
  );
}

const bubbleStyle: CSSProperties = {
  borderRadius: "999px",
  border: "1px solid rgb(255 255 255 / .85)",
  background:
    "radial-gradient(circle at 32% 28%, #fff 0 9%, rgb(255 255 255 / .25) 22%, transparent 45%), radial-gradient(circle at 70% 75%, rgb(165 140 245 / .35), transparent 55%), radial-gradient(circle at 30% 80%, rgb(95 168 245 / .3), transparent 60%), rgb(255 255 255 / .12)",
  boxShadow: "inset 0 0 1.2vh rgb(255 255 255 / .6)",
};

// --------------------------------------------------------------- scenes --

function Balloons({ n, outline, spread = 1 }: { n: number; outline: boolean; spread?: number }) {
  return range(n).map((i) => {
    const size = 7 + rnd(i, 1) * 6;
    const side = rnd(i, 7);
    // Mostly at the sides so the middle of the screen stays clear.
    const left = spread < 1 ? (side < 0.5 ? side * 36 : 64 + (side - 0.5) * 72) : side * 100;
    return (
      <div key={i} className="amb-rise" style={v({ left: `${left}%`, width: `${size * 0.55}vh`, height: `${size * 1.1}vh`, "--d": `${20 + rnd(i, 2) * 14}s`, "--delay": `${-rnd(i, 3) * 30}s`, "--dx": `${(rnd(i, 4) - 0.5) * 12}vw` })}>
        <div className="amb-sway h-full w-full" style={v({ "--sw": `${3 + rnd(i, 5) * 2.5}s` })}>
          <Balloon i={i} outline={outline} />
        </div>
      </div>
    );
  });
}

function Toys({ n, spread = 1 }: { n: number; spread?: number }) {
  return range(n).map((i) => {
    const size = 3.4 + rnd(i, 1) * 3.6;
    const x = rnd(i, 2);
    const left = spread < 1 ? (x < 0.5 ? 1 + x * 22 : 77 + (x - 0.5) * 42) : 2 + x * 94;
    return (
      <div key={i} className="amb-bob" style={v({ left: `${left}%`, top: `${4 + rnd(i, 3) * 86}%`, width: `${size}vh`, height: `${size}vh`, "--d": `${2.6 + rnd(i, 4) * 2.4}s`, "--delay": `${-rnd(i, 5) * 4}s`, "--bob": `${-1 - rnd(i, 6) * 2.5}vh`, "--r0": `${-20 + rnd(i, 8) * 10}deg`, "--r1": `${10 + rnd(i, 9) * 20}deg` })}>
        <Toy i={i} />
      </div>
    );
  });
}

function Clouds({ n, outline, top = 0, band = 70 }: { n: number; outline?: boolean; top?: number; band?: number }) {
  return range(n).map((i) => {
    const w = 14 + rnd(i, 1) * 14;
    return (
      <div key={i} className="amb-drift" style={v({ left: 0, top: `${top + rnd(i, 2) * band}%`, width: `${w}vw`, height: `${w * 0.56}vw`, "--d": `${70 + rnd(i, 3) * 50}s`, "--delay": `${-rnd(i, 4) * 120}s` })}>
        <Cloud outline={outline} />
      </div>
    );
  });
}

function Twinkles({ n, color, min = 0.8, max = 2.4, shape = "dot" }: { n: number; color: string; min?: number; max?: number; shape?: "dot" | "spark" }) {
  return range(n).map((i) => {
    const s = min + rnd(i, 1) * (max - min);
    return (
      <div key={i} className="amb-twinkle" style={v({ left: `${rnd(i, 2) * 100}%`, top: `${rnd(i, 3) * 100}%`, width: `${s}vh`, height: `${s}vh`, "--d": `${1.8 + rnd(i, 4) * 3}s`, "--delay": `${-rnd(i, 5) * 5}s` })}>
        {shape === "spark" ? <Svg d={SPARK} fill={color} /> : <div className="h-full w-full rounded-full" style={{ background: color, boxShadow: `0 0 ${s * 2}vh ${color}` }} />}
      </div>
    );
  });
}

function Risers({ n, render, minS, maxS, minD, maxD, spread = 1 }: { n: number; render: (i: number) => ReactNode; minS: number; maxS: number; minD: number; maxD: number; spread?: number }) {
  return range(n).map((i) => {
    const s = minS + rnd(i, 1) * (maxS - minS);
    const x = rnd(i, 2);
    const left = spread < 1 ? (x < 0.5 ? x * 40 : 60 + (x - 0.5) * 80) : x * 100;
    return (
      <div key={i} className="amb-rise" style={v({ left: `${left}%`, width: `${s}vh`, height: `${s}vh`, "--d": `${minD + rnd(i, 3) * (maxD - minD)}s`, "--delay": `${-rnd(i, 4) * maxD}s`, "--dx": `${(rnd(i, 5) - 0.5) * 10}vw` })}>
        {render(i)}
      </div>
    );
  });
}

const SCENES: Partial<Record<ThemeId, (pick: Pick) => ReactNode>> = {
  site: (pick) => <Toys n={pick(10, 6, 5)} spread={0.5} />,

  birthday: (pick) => <Balloons n={pick(10, 5, 5)} outline spread={pick(1, 0.5, 1)} />,

  kids_birthday: (pick) => (
    <>
      <Clouds n={pick(4, 3, 2)} top={-4} band={22} />
      <Toys n={pick(12, 6, 6)} spread={pick(1, 0.5, 1)} />
    </>
  ),

  kids: (pick) => (
    <>
      <Twinkles n={pick(34, 22, 18)} color="#ffffff" min={0.3} max={0.9} />
      <Twinkles n={pick(8, 5, 4)} color="#ffd36b" min={1.4} max={2.6} shape="spark" />
      <div className="amb-bob" style={v({ insetInlineStart: "-3vw", bottom: "-4vh", width: "26vh", height: "17vh", "--d": "6s", "--delay": "0s", "--bob": "-2vh", "--r0": "-6deg", "--r1": "2deg" })}>
        <Planet />
      </div>
      {range(2).map((i) => (
        <div key={i} className="amb-shoot" style={v({ right: `${8 + i * 30}%`, top: `${6 + i * 12}%`, width: "16vh", height: "0.4vh", borderRadius: "1vh", background: "linear-gradient(90deg, #fff, transparent)", "--d": `${9 + i * 4}s`, "--delay": `${-i * 5}s`, "--rot": "-28deg", "--sx": "-40vw", "--sy": "22vh" })} />
      ))}
      {pick(1, 1, 0) > 0 && (
        <div className="amb-cross" style={v({ left: "-10vw", bottom: "-14vh", width: "6vh", height: "14.4vh", "--d": "22s", "--delay": "-4s", "--rot": "52deg", "--sx": "125vw", "--sy": "-95vh" })}>
          <Rocket />
        </div>
      )}
    </>
  ),

  wedding: (pick) => (
    <>
      {range(pick(16, 8, 9)).map((i) => {
        const s = 1.6 + rnd(i, 1) * 2;
        const leaf = i % 5 === 4;
        return (
          <div key={i} className="amb-fall" style={v({ left: `${rnd(i, 2) * 100}%`, width: `${s}vh`, height: `${s}vh`, "--d": `${14 + rnd(i, 3) * 10}s`, "--delay": `${-rnd(i, 4) * 24}s`, "--dx": `${(rnd(i, 5) - 0.3) * 10}vw` })}>
            <div className="amb-flutter h-full w-full" style={v({ "--sw": `${2 + rnd(i, 6) * 2}s` })}>
              <Svg d={leaf ? LEAF : PETAL} fill={leaf ? "#a9bfa6" : ["#f3c9cf", "#ffffff", "#ead9bf", "#e7aab4"][i % 4]} className="drop-shadow-[0_1px_1px_rgb(120_80_60/0.25)]" />
            </div>
          </div>
        );
      })}
      <Twinkles n={pick(10, 5, 5)} color="#c9a467" min={0.9} max={1.8} shape="spark" />
    </>
  ),

  mitzvah: (pick) => (
    <>
      <div className="amb-spin" style={v({ left: "calc(50% - 100vh)", top: "-120vh", width: "200vh", height: "200vh", "--d": "120s", background: "repeating-conic-gradient(from 0deg, rgb(232 182 76 / .09) 0 5deg, transparent 5deg 15deg)", maskImage: "radial-gradient(closest-side, #000 20%, transparent)", WebkitMaskImage: "radial-gradient(closest-side, #000 20%, transparent)" })} />
      <Twinkles n={pick(16, 9, 9)} color="#f3d48a" min={1} max={2.4} shape="spark" />
      {range(pick(4, 2, 2)).map((i) => (
        <div key={i} className="amb-bloom" style={v({ left: `${[8, 78, 20, 66][i]}%`, top: `${[10, 14, 56, 60][i]}%`, width: "18vh", height: "18vh", opacity: 0, "--d": `${6 + i * 1.3}s`, "--delay": `${-i * 1.7}s` })}>
          <Firework hue={["#f3d48a", "#5cc8ff", "#e8b64c", "#ffffff"][i]} />
        </div>
      ))}
    </>
  ),

  baby_shower: (pick) => (
    <>
      <Clouds n={pick(4, 3, 2)} top={-4} band={26} />
      <Risers n={pick(12, 6, 7)} minS={2.5} maxS={7} minD={14} maxD={24} spread={pick(1, 0.5, 1)} render={() => <div className="h-full w-full" style={bubbleStyle} />} />
      <Twinkles n={pick(8, 4, 4)} color="#f7799c" min={0.9} max={1.6} shape="spark" />
    </>
  ),

  anniversary: (pick) => (
    <>
      <div className="amb-flicker" style={v({ left: "-20vw", bottom: "-30vh", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgb(255 190 120 / .22), transparent 60%)", "--d": "2.2s", "--delay": "0s" })} />
      <div className="amb-flicker" style={v({ right: "-20vw", bottom: "-30vh", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgb(255 170 120 / .18), transparent 60%)", "--d": "2.9s", "--delay": "-1s" })} />
      <Risers n={pick(26, 14, 14)} minS={0.5} maxS={1.3} minD={7} maxD={13} render={() => <div className="h-full w-full rounded-full" style={{ border: "1px solid rgb(245 220 176 / .7)", background: "rgb(245 220 176 / .18)" }} />} />
      <Risers n={pick(8, 4, 4)} minS={2.2} maxS={4} minD={18} maxD={28} spread={pick(1, 0.5, 1)} render={(i) => <Svg d={HEART} fill={i % 2 ? "rgb(228 106 138 / .45)" : "rgb(179 33 79 / .5)"} />} />
    </>
  ),

  party: (pick) => (
    <>
      {range(pick(3, 2, 2)).map((i) => (
        <div key={i} className="amb-spot" style={v({ left: `${[-10, 50, 20][i]}%`, top: `${[-10, 30, 50][i]}%`, width: "60vh", height: "60vh", borderRadius: "50%", background: `radial-gradient(circle, ${["rgb(255 47 180 / .22)", "rgb(47 243 224 / .18)", "rgb(155 91 255 / .2)"][i]}, transparent 62%)`, "--d": `${7 + i * 2}s`, "--delay": `${-i * 3}s`, "--sx": `${[40, -35, 25][i]}vw`, "--sy": `${[25, -20, -30][i]}vh` })} />
      ))}
      {range(pick(6, 4, 4)).map((i) => {
        const fromLeft = i % 2 === 0;
        return (
          <div key={i} className="amb-laser" style={v({ left: fromLeft ? `${2 + i * 3}%` : undefined, right: fromLeft ? undefined : `${2 + i * 3}%`, width: "0.35vh", height: "135vh", background: `linear-gradient(to top, ${i % 3 === 0 ? "#2ff3e0" : i % 3 === 1 ? "#ff2fb4" : "#9b5bff"}, transparent 80%)`, opacity: 0.45, mixBlendMode: "screen", "--d": `${3 + rnd(i, 1) * 3}s`, "--delay": `${-rnd(i, 2) * 3}s`, "--r0": fromLeft ? "8deg" : "-50deg", "--r1": fromLeft ? "50deg" : "-8deg" })} />
        );
      })}
      <div className="absolute inset-x-0 bottom-0 flex h-[9vh] items-end justify-center gap-[0.5vw] px-[2vw]" style={{ opacity: pick(0.4, 0.18, 0.25) }}>
        {range(36).map((i) => (
          <div key={i} className="amb-eq relative h-full flex-1 rounded-t-[0.6vh]" style={v({ background: "linear-gradient(to top, #ff2fb4, #2ff3e0)", "--d": `${0.35 + rnd(i, 1) * 0.6}s`, "--delay": `${-rnd(i, 2)}s` })} />
        ))}
      </div>
    </>
  ),
};

// -------------------------------------------------------------- moments --

function PopOut({ n, render, from = [50, 90] }: { n: number; render: (i: number) => ReactNode; from?: [number, number] }) {
  return range(n).map((i) => {
    const a = -Math.PI / 2 + (rnd(i, 1) - 0.5) * Math.PI * 1.3;
    const r = 30 + rnd(i, 2) * 45;
    const s = 4 + rnd(i, 3) * 4;
    return (
      <div key={i} className="mom-pop" style={v({ left: `calc(${from[0]}% - ${s / 2}vh)`, top: `${from[1]}%`, width: `${s}vh`, height: `${s}vh`, "--d": `${1.6 + rnd(i, 4) * 0.8}s`, "--delay": `${rnd(i, 5) * 0.25}s`, "--dx": `${Math.cos(a) * r}vw`, "--dy": `${Math.sin(a) * r}vh`, "--r": `${(rnd(i, 6) - 0.5) * 540}deg` })}>
        {render(i)}
      </div>
    );
  });
}

function Wave({ n, render, minS, maxS }: { n: number; render: (i: number) => ReactNode; minS: number; maxS: number }) {
  return range(n).map((i) => {
    const s = minS + rnd(i, 1) * (maxS - minS);
    return (
      <div key={i} className="mom-release" style={v({ left: `${(i / n) * 100 + rnd(i, 2) * 4}%`, width: `${s}vh`, height: `${s}vh`, "--d": `${2.4 + rnd(i, 3) * 1.2}s`, "--delay": `${rnd(i, 4) * 0.7}s`, "--dx": `${(rnd(i, 5) - 0.5) * 16}vw`, "--r": `${(rnd(i, 6) - 0.5) * 40}deg` })}>
        {render(i)}
      </div>
    );
  });
}

const Shine = ({ color }: { color: string }) => (
  <div className="mom-sweep absolute inset-y-0 -inset-x-1/2" style={v({ "--delay": "0.1s", background: `linear-gradient(105deg, transparent 38%, ${color} 50%, transparent 62%)`, mixBlendMode: "soft-light" })} />
);

const MOMENTS: Partial<Record<ThemeId, () => ReactNode>> = {
  site: () => <PopOut n={16} render={(i) => <Toy i={i} />} />,
  birthday: () =>
    range(16).map((i) => {
      const s = 8 + rnd(i, 1) * 6;
      return (
        <div key={i} className="mom-release" style={v({ left: `${(i / 16) * 100}%`, width: `${s * 0.55}vh`, height: `${s * 1.1}vh`, "--d": `${2.6 + rnd(i, 2) * 1.2}s`, "--delay": `${rnd(i, 3) * 0.8}s`, "--dx": `${(rnd(i, 4) - 0.5) * 14}vw`, "--r": `${(rnd(i, 5) - 0.5) * 30}deg` })}>
          <Balloon i={i} outline />
        </div>
      );
    }),
  kids_birthday: () => <PopOut n={20} from={[50, 62]} render={(i) => <Toy i={i} />} />,
  kids: () => (
    <>
      <div className="mom-rocket absolute bottom-[-18vh] left-1/2 h-[24vh] w-[10vh]">
        <Rocket />
      </div>
      {range(8).map((i) => (
        <div key={i} className="mom-puff absolute bottom-[-4vh] rounded-full bg-white/80" style={v({ left: `calc(50% + ${(i - 3.5) * 2.4}vh)`, width: "8vh", height: "8vh", "--delay": `${0.2 + i * 0.05}s`, "--dx": `${(i - 3.5) * 2.5}vw` })} />
      ))}
    </>
  ),
  wedding: () => (
    <>
      <Shine color="rgb(255 236 200 / .95)" />
      {range(12).map((i) => (
        <div key={i} className="mom-spark" style={v({ left: `${8 + rnd(i, 1) * 84}%`, top: `${8 + rnd(i, 2) * 70}%`, width: "3vh", height: "3vh", "--delay": `${rnd(i, 3) * 0.9}s` })}>
          <Svg d={SPARK} fill="#c9a467" />
        </div>
      ))}
    </>
  ),
  mitzvah: () => (
    <>
      <Shine color="rgb(255 225 150 / .7)" />
      {range(5).map((i) => (
        <div key={i} className="mom-bloom" style={v({ left: `${[10, 70, 40, 18, 78][i]}%`, top: `${[8, 6, 2, 40, 38][i]}%`, width: "22vh", height: "22vh", "--delay": `${i * 0.22}s` })}>
          <Firework hue={["#f3d48a", "#5cc8ff", "#ffffff", "#e8b64c", "#a8e2ff"][i]} />
        </div>
      ))}
    </>
  ),
  baby_shower: () => <Wave n={16} minS={4} maxS={9} render={() => <div className="h-full w-full" style={bubbleStyle} />} />,
  anniversary: () => <Wave n={18} minS={3} maxS={6} render={(i) => <Svg d={HEART} fill={["#b3214f", "#e46a8a", "#f5dcb0"][i % 3]} />} />,
  party: () => (
    <>
      <div className="mom-strobe absolute inset-0" style={v({ "--delay": "0s", background: "radial-gradient(circle at 50% 40%, rgb(255 47 180 / .35), transparent 70%)" })} />
      <div className="mom-strobe absolute inset-0" style={v({ "--delay": "0.15s", background: "radial-gradient(circle at 50% 40%, rgb(47 243 224 / .3), transparent 70%)" })} />
    </>
  ),
};
