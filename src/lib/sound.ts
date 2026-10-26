"use client";
// Tiny synthesized sound effects (no audio files). Sounds only play on the
// TV screen, only when the host turned them on, and only after someone has
// tapped the screen once (browsers block autoplay before a user gesture).

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Call from a click handler. Returns true when audio is ready. */
export async function unlockAudio(): Promise<boolean> {
  const a = audio();
  if (!a) return false;
  if (a.state !== "running") await a.resume().catch(() => {});
  return a.state === "running";
}

export function audioReady(): boolean {
  return ctx?.state === "running";
}

function tone(freq: number, start: number, dur: number, gain = 0.2, type: OscillatorType = "sine") {
  const a = audio()!;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime + start);
  g.gain.setValueAtTime(0.0001, a.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, a.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  osc.connect(g).connect(a.destination);
  osc.start(a.currentTime + start);
  osc.stop(a.currentTime + start + dur + 0.05);
}

function whooshNoise() {
  const a = audio()!;
  const len = Math.floor(a.sampleRate * 0.45);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, a.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2400, a.currentTime + 0.4);
  const g = a.createGain();
  g.gain.setValueAtTime(0.12, a.currentTime);
  src.connect(filter).connect(g).connect(a.destination);
  src.start();
}

export type SoundName = "whoosh" | "tick" | "reveal" | "winner";

export function play(name: SoundName) {
  if (!audioReady()) return;
  switch (name) {
    case "whoosh":
      whooshNoise();
      break;
    case "tick":
      tone(880, 0, 0.12, 0.15, "triangle");
      break;
    case "reveal":
      [523.25, 659.25, 783.99].forEach((f) => tone(f, 0, 0.9, 0.12));
      tone(1046.5, 0.05, 0.8, 0.08);
      break;
    case "winner":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.14, 0.5, 0.14, "triangle"));
      [523.25, 659.25, 783.99, 1046.5].forEach((f) => tone(f, 0.6, 1.4, 0.08));
      break;
  }
}
