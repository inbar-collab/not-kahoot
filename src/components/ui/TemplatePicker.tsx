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
            className={`group relative flex flex-col items-start overflow-hidden rounded-[1.4rem] border-2 text-start shadow-lg transition hover:-translate-y-0.5 ${
              on ? "border-gold ring-4 ring-gold/30" : "border-white/10 hover:border-white/30"
            }`}
            style={{ background: `radial-gradient(circle at 85% 0%, ${surface}, ${bg} 75%)`, color: text }}
          >
            <span className={`flex w-full items-center justify-between px-3 ${big ? "pt-4" : "pt-3"}`}>
              <span className={big ? "text-4xl" : "text-3xl"}>{t.emoji}</span>
              <span className="grid grid-cols-2 gap-1" aria-hidden>
                {t.answers.map((c) => (
                  <span key={c} className="h-3.5 w-3.5 rounded-[5px]" style={{ background: c }} />
                ))}
              </span>
            </span>
            <span className={`px-3 font-black ${big ? "pt-2 text-xl" : "pt-1 text-lg"}`}>{t.name[locale]}</span>
            <span className={`px-3 pb-3 text-sm opacity-75 ${big ? "" : "line-clamp-2"}`}>{t.blurb[locale]}</span>
            <span className="h-1.5 w-full" style={{ background: accent }} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
