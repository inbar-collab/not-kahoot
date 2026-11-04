"use client";
import { useEffect } from "react";
import { setConfettiTemplate } from "@/lib/confetti";
import type { Locale, TemplateId } from "@/lib/types";

/** Applies a quiz's template (colors, fonts, confetti) and language direction to the whole page. */
export function useTheme(template: TemplateId | "site" | undefined, locale: Locale | undefined) {
  useEffect(() => {
    const html = document.documentElement;
    if (template) html.dataset.theme = template;
    if (locale) {
      html.lang = locale;
      html.dir = locale === "he" ? "rtl" : "ltr";
    }
    setConfettiTemplate(template === "site" ? undefined : template);
  }, [template, locale]);
}
