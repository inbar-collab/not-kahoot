"use client";
import { AnimatePresence, motion } from "motion/react";
import type { ConnectionState } from "@/hooks/useLiveGame";
import { Spinner } from "./Button";

/** Full-screen centered message (loading, invalid link, etc.). */
export function CenterMessage({
  title,
  body,
  icon,
  children,
}: {
  title: string;
  body?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <main className="stage-bg flex min-h-dvh flex-col items-center justify-center gap-5 p-6 text-center">
      {icon && <div className="text-6xl">{icon}</div>}
      <h1 className="font-display text-3xl font-bold text-cream">{title}</h1>
      {body && <p className="max-w-md text-xl text-mute">{body}</p>}
      {children}
    </main>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <main className="stage-bg flex min-h-dvh flex-col items-center justify-center gap-4 text-mute" aria-live="polite">
      <Spinner className="h-10 w-10 text-gold" />
      <p className="text-xl">{label}</p>
    </main>
  );
}

/** Small pill shown only when the realtime connection is down. */
export function ConnectionPill({ state, label }: { state: ConnectionState; label: string }) {
  return (
    <AnimatePresence>
      {state === "reconnecting" && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed inset-x-0 top-3 z-40 mx-auto flex w-fit items-center gap-2 rounded-full border border-ink-600 bg-ink-850/95 px-4 py-2 text-base text-mute shadow-lg"
        >
          <Spinner className="h-4 w-4 text-gold" />
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
