"use client";
import Link from "next/link";
import type { Locale } from "@/lib/types";

export function LanguageToggle({ locale, onChange }: { locale: Locale; onChange: (l: Locale) => void }) {
  return (
    <div className="flex rounded-full border border-ink-700 p-1 text-sm font-bold" role="group" aria-label="Language">
      {(["he", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          onClick={() => onChange(l)}
          className={`rounded-full px-3 py-1.5 ${locale === l ? "bg-gold text-ink-950" : "text-mute hover:text-cream"}`}
        >
          {l === "he" ? "עברית" : "English"}
        </button>
      ))}
    </div>
  );
}

export function SiteHeader({
  locale,
  onLocale,
  children,
}: {
  locale: Locale;
  onLocale: (l: Locale) => void;
  children?: React.ReactNode;
}) {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
      <Link href="/" className="flex items-center gap-2 font-display text-2xl font-black text-gold">
        <span aria-hidden>🎉</span>
        <span dir="ltr">Event Quiz</span>
      </Link>
      <div className="flex-1" />
      {children}
      <LanguageToggle locale={locale} onChange={onLocale} />
    </header>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6 shrink-0" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
