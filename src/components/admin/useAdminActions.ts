"use client";
import { useCallback, useState } from "react";
import { api, ClientApiError, gamePath } from "@/lib/api";
import type { Strings } from "@/lib/strings";

/** Runs admin commands, tracks which one is in flight, and reports errors. */
export function useAdminActions(code: string, token: string, s: Strings, refresh: () => Promise<void>) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; kind: "error" | "ok" } | null>(null);

  const report = useCallback(
    (e: unknown) => {
      const c = e instanceof ClientApiError ? e.code : "network";
      setMessage({ text: c === "network" ? s.networkError : s.errors[c], kind: "error" });
    },
    [s],
  );

  const run = useCallback(
    async (action: string, args: Record<string, unknown> = {}, okText?: string): Promise<boolean> => {
      setBusy(action + (args.id ?? args.playerId ?? ""));
      setMessage(null);
      try {
        await api.post(gamePath(code, "admin"), { action, ...args }, { bearer: token });
        if (okText) setMessage({ text: okText, kind: "ok" });
        return true;
      } catch (e) {
        report(e);
        return false;
      } finally {
        setBusy(null);
        void refresh();
      }
    },
    [code, token, refresh, report],
  );

  const upload = useCallback(
    async (kind: "birthday" | "question" | "library", file: Blob, questionId?: string): Promise<boolean> => {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file, file.type === "image/webp" ? "photo.webp" : "photo.jpg");
      if (questionId) form.set("questionId", questionId);
      try {
        await api.form(gamePath(code, "admin/upload"), form, { bearer: token });
        return true;
      } catch (e) {
        report(e);
        return false;
      } finally {
        void refresh();
      }
    },
    [code, token, refresh, report],
  );

  return { run, upload, busy, message, setMessage };
}

export type AdminActions = ReturnType<typeof useAdminActions>;
