"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./Button";

interface Pending {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (ok: boolean) => void;
}

/** const [confirm, dialog] = useConfirm(); if (await confirm("Sure?")) ... ; render {dialog} */
export function useConfirm(defaults: { confirmLabel: string; cancelLabel: string }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (message: string, confirmLabel?: string) =>
      new Promise<boolean>((resolve) =>
        setPending({
          message,
          confirmLabel: confirmLabel ?? defaults.confirmLabel,
          cancelLabel: defaults.cancelLabel,
          resolve,
        }),
      ),
    [defaults.confirmLabel, defaults.cancelLabel],
  );

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  const dialog = <ConfirmDialog pending={pending} onClose={close} />;
  return [confirm, dialog] as const;
}

function ConfirmDialog({ pending, onClose }: { pending: Pending | null; onClose: (ok: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!pending) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, onClose]);

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onClose(false)}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-msg"
            className="w-full max-w-md rounded-3xl border border-ink-600 bg-ink-850 p-6 shadow-2xl"
            initial={{ y: 24, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p id="confirm-msg" className="mb-6 text-xl leading-relaxed">
              {pending.message}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="primary" onClick={() => onClose(true)}>
                {pending.confirmLabel}
              </Button>
              <Button ref={cancelRef} variant="ghost" onClick={() => onClose(false)}>
                {pending.cancelLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
