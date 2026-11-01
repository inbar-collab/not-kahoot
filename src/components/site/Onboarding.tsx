"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { Strings } from "@/lib/strings";
import { Button } from "../ui/Button";

const SEEN_KEY = "eq_onboarded";

export function onboardingSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true; // storage blocked: don't nag on every visit
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage blocked */
  }
}

/** A four-slide welcome for new hosts: what it is, create, send links, run it. */
export function Onboarding({ s, onClose }: { s: Strings; onClose: () => void }) {
  const [i, setI] = useState(0);
  const slides = s.onbSlides;
  const last = i === slides.length - 1;
  const [icon, title, body] = slides[i];
  const back = s.dir === "rtl" ? 1 : -1;
  const close = () => {
    markSeen();
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-title"
    >
      <motion.div
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-ink-700 bg-ink-900 p-6 shadow-2xl sm:p-8"
        initial={{ y: 40, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
      >
        <button type="button" onClick={close} className="absolute end-4 top-4 rounded-full px-3 py-1 text-base font-bold text-mute hover:bg-ink-800 hover:text-cream">
          {s.onbSkip}
        </button>
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            className="flex min-h-[280px] flex-col items-center pt-6 text-center"
            initial={{ opacity: 0, x: -40 * back }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 * back }}
            transition={{ duration: 0.25 }}
          >
            <motion.span
              className="text-7xl"
              initial={{ scale: 0.3, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 12 }}
              aria-hidden
            >
              {icon}
            </motion.span>
            <h2 id="onb-title" className="mt-5 font-display text-3xl font-black text-gold-soft">
              {title}
            </h2>
            <p className="mt-3 text-xl leading-relaxed text-cream">{body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex justify-center gap-2" aria-hidden>
          {slides.map((_, k) => (
            <span key={k} className={`h-2.5 rounded-full transition-all ${k === i ? "w-8 bg-gold" : "w-2.5 bg-ink-600"}`} />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {last ? (
            <>
              <Link
                href="/new"
                onClick={markSeen}
                className="inline-flex min-h-[64px] items-center justify-center rounded-2xl bg-gold px-6 text-xl font-bold text-ink-950 hover:bg-gold-soft"
              >
                {s.onbCreate}
              </Link>
              <Button variant="ghost" onClick={close}>
                {s.onbDone}
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={() => setI(i + 1)}>
              {s.onbNext}
            </Button>
          )}
          {i > 0 && (
            <Button variant="quiet" className="self-center" onClick={() => setI(i - 1)}>
              {s.onbBack}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
