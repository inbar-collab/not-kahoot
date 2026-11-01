"use client";
import { useCallback, useSyncExternalStore } from "react";
import type { Locale } from "@/lib/types";

// The language of the site pages (landing, dashboard, new quiz). Each quiz
// has its own language; this is only the visitor's preference.
const KEY = "eq_locale";
const listeners = new Set<() => void>();

function read(): Locale {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "he" || saved === "en") return saved;
  } catch {
    /* storage blocked */
  }
  return navigator.language?.toLowerCase().startsWith("he") ? "he" : "en";
}

export function useSiteLocale(): [Locale, (l: Locale) => void] {
  const locale = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "he" as Locale,
  );
  const set = useCallback((l: Locale) => {
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* storage blocked */
    }
    listeners.forEach((cb) => cb());
  }, []);
  return [locale, set];
}
