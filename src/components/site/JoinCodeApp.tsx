"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useSiteLocale } from "@/hooks/useSiteLocale";
import { useTheme } from "@/hooks/useTheme";
import { getStrings } from "@/lib/strings";
import { Button } from "../ui/Button";
import { LanguageToggle } from "./SiteHeader";

/** Enter the game code from the TV. */
export function JoinCodeApp() {
  const [locale, setLocale] = useSiteLocale();
  useTheme("site", locale);
  const s = getStrings({ locale });
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <main className="stage-bg flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      <div className="absolute end-4 top-4">
        <LanguageToggle locale={locale} onChange={setLocale} />
      </div>
      <motion.p
        className="font-display text-4xl font-black text-gold"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        dir="ltr"
      >
        🎉 Event Quiz
      </motion.p>
      <form
        className="card flex w-full max-w-sm flex-col gap-4 rounded-[2rem] p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const c = code.trim().toUpperCase();
          if (c) router.push(`/join/${encodeURIComponent(c)}`);
        }}
      >
        <label htmlFor="code" className="text-center text-2xl font-bold">
          {s.landJoinTitle}
        </label>
        <input
          id="code"
          dir="ltr"
          autoFocus
          className="field h-20 text-center !text-4xl font-black uppercase tracking-[0.25em]"
          value={code}
          maxLength={10}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder={s.landCodePlaceholder}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" size="xl" disabled={!code.trim()}>
          {s.landJoin}
        </Button>
      </form>
    </main>
  );
}
