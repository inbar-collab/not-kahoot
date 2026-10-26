"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

export function Toast({
  message,
  onDone,
}: {
  message: { text: string; kind: "error" | "ok" } | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDone, message.kind === "error" ? 6000 : 2500);
    return () => window.clearTimeout(t);
  }, [message, onDone]);
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role={message.kind === "error" ? "alert" : "status"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed inset-x-4 bottom-4 z-40 mx-auto max-w-lg rounded-2xl border px-5 py-4 text-lg shadow-2xl ${
            message.kind === "error" ? "border-cream/30 bg-ink-700" : "border-gold/50 bg-ink-800 text-gold-soft"
          }`}
          onClick={onDone}
        >
          {message.kind === "error" ? "⚠️ " : ""}
          {message.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
