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
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(id)}
            className={`group relative rounded-[1.5rem] text-start transition hover:-translate-y-0.5 ${
              on ? "outline-[4px] outline-offset-[3px] outline-gold [outline-style:solid]" : ""
            }`}
          >
            {/* The card wears its own theme, whatever the page around it. */}
            <span data-theme={id} className="stage-bg card flex h-full flex-col items-start overflow-hidden rounded-[1.4rem]">
              <span className={`flex w-full items-center justify-between px-3 ${big ? "pt-4" : "pt-3"}`}>
                <span className={big ? "text-4xl" : "text-3xl"}>{t.emoji}</span>
                <span className="grid grid-cols-2 gap-1" aria-hidden>
                  {[0, 1, 2, 3].map((k) => (
                    <span key={k} className={`tile tile-${k} h-4 w-4 rounded-[5px] !border !shadow-none`} />
                  ))}
                </span>
              </span>
              <span className={`hero-title px-3 ${big ? "pt-2 text-2xl" : "pt-1 text-xl"}`}>{t.name[locale]}</span>
              <span className={`px-3 pb-3 text-sm text-mute ${big ? "" : "line-clamp-2"}`}>{t.blurb[locale]}</span>
              {on && (
                <span className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-black text-ink-950" aria-hidden>
                  ✓
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
