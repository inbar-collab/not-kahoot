"use client";
import { TEMPLATES } from "@/lib/templates";
import { TEMPLATE_IDS, type Locale, type TemplateId } from "@/lib/types";

/** Grid of template cards, each previewing its own colors (independent of the page theme). */
export function TemplatePicker({
  value,
  locale,
  onChange,
  big = false,
}: {
  value: TemplateId | null;
  locale: Locale;
  onChange: (t: TemplateId) => void;
  big?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${big ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4"}`}>
      {TEMPLATE_IDS.map((id) => {
        const t = TEMPLATES[id];
        const [bg, surface, accent, text] = t.swatch;
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(id)}
            className={`group relative flex flex-col items-start overflow-hidden rounded-2xl border-2 text-start transition ${
              on ? "border-gold ring-2 ring-gold/40" : "border-ink-700 hover:border-ink-500"
            }`}
            style={{ background: bg, color: text }}
          >
            <span className={`flex w-full items-center justify-between px-3 ${big ? "pt-4" : "pt-3"}`}>
              <span className={big ? "text-4xl" : "text-3xl"}>{t.emoji}</span>
              <span className="flex gap-1" aria-hidden>
                <span className="h-4 w-4 rounded-full" style={{ background: accent }} />
                <span className="h-4 w-4 rounded-full" style={{ background: surface }} />
              </span>
            </span>
            <span className={`px-3 font-bold ${big ? "pt-2 text-xl" : "pt-1 text-lg"}`}>{t.name[locale]}</span>
            <span className={`px-3 pb-3 text-sm opacity-75 ${big ? "" : "line-clamp-2"}`}>{t.blurb[locale]}</span>
            <span className="h-1.5 w-full" style={{ background: accent }} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
