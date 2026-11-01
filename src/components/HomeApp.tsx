"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useSiteLocale } from "@/hooks/useSiteLocale";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";
import { getStrings } from "@/lib/strings";
import { signInWithGoogle } from "@/lib/supabase-auth";
import { TEMPLATES } from "@/lib/templates";
import { TEMPLATE_IDS, type Me } from "@/lib/types";
import { GoogleIcon, SiteHeader } from "./site/SiteHeader";
import { Button } from "./ui/Button";
import { RunningCrowd } from "./finale/RunningCrowd";

const input =
  "h-16 w-full rounded-2xl border-2 border-ink-600 bg-ink-850 px-5 text-2xl text-cream placeholder:text-ink-500 focus:border-gold focus:outline-none";

/** Public landing page: what it is, sign in with Google, or join a game with a code. */
export function HomeApp() {
  const [locale, setLocale] = useSiteLocale();
  useTheme("birthday", locale);
  const s = getStrings({ locale });
  const router = useRouter();
  const [code, setCode] = useState("");
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [signingIn, setSigningIn] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);

  useEffect(() => {
    const failed = new URLSearchParams(window.location.search).get("login") === "failed";
    api.get<{ user: Me | null }>("/api/me").then(
      (r) => {
        setMe(r.user);
        // ?login=failed is set by /auth/callback when Google sign-in didn't complete.
        if (failed && !r.user) setLoginFailed(true);
      },
      () => setMe(null),
    );
  }, []);

  async function signIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      setSigningIn(false);
      setLoginFailed(true);
    }
  }

  const cta =
    me === undefined ? null : me ? (
      <Link href="/dashboard" className="inline-flex min-h-[64px] items-center justify-center rounded-2xl bg-gold px-8 text-xl font-bold text-ink-950 hover:bg-gold-soft">
        {s.landGoDashboard}
      </Link>
    ) : (
      <Button size="lg" busy={signingIn} onClick={() => void signIn()} className="!bg-white !text-[#1f1f1f] hover:!bg-[#f1f1f1]">
        {!signingIn && <GoogleIcon />}
        {signingIn ? s.landSigningIn : s.landSignIn}
      </Button>
    );

  return (
    <main className="stage-bg min-h-dvh overflow-x-hidden">
      <SiteHeader locale={locale} onLocale={setLocale}>
        {me && (
          <Link href="/dashboard" className="hidden rounded-full px-3 py-1.5 font-bold text-gold-soft hover:bg-ink-800 sm:block">
            {s.dashTitle}
          </Link>
        )}
      </SiteHeader>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-6 md:grid-cols-[1.1fr_1fr] md:pt-12">
        <div className="flex flex-col items-start gap-5">
          <p className="rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-base font-bold text-gold-soft">{s.landTagline}</p>
          <h1 className="font-display text-5xl font-black leading-[1.05] md:text-6xl">{s.landHeroTitle}</h1>
          <p className="max-w-xl text-xl leading-relaxed text-mute">{s.landHeroBody}</p>
          {loginFailed && <p role="alert" className="rounded-2xl bg-ink-800 px-4 py-3 text-lg">⚠️ {s.errors.login_required}</p>}
          <div className="flex flex-wrap items-center gap-3 pt-2">{cta}</div>
        </div>

        {/* A tiny TV showing the race */}
        <div className="relative">
          <div className="relative aspect-video overflow-hidden rounded-[28px] border-[10px] border-ink-800 bg-ink-900 shadow-[0_40px_120px_-40px_color-mix(in_oklab,var(--color-gold)_45%,transparent)]">
            <div className="absolute inset-x-0 top-[7%] text-center font-display text-[clamp(14px,2.4vw,24px)] font-bold text-gold-soft">
              {s.scrRaceTitle}
            </div>
            <RunningCrowd />
          </div>
          <div className="mx-auto h-4 w-1/3 rounded-b-2xl bg-ink-800" aria-hidden />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="mb-6 font-display text-3xl font-bold text-gold-soft">{s.landHowTitle}</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {s.landSteps.map(([icon, title, body], i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="rounded-3xl border border-ink-700 bg-ink-900 p-6"
            >
              <span className="text-4xl">{icon}</span>
              <h3 className="mt-3 text-2xl font-bold">{title}</h3>
              <p className="mt-2 text-lg text-mute">{body}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Templates */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="mb-6 font-display text-3xl font-bold text-gold-soft">{s.landTemplatesTitle}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {TEMPLATE_IDS.map((id, i) => {
            const t = TEMPLATES[id];
            const [bg, surface, accent, text] = t.swatch;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.08 }}
                className="relative overflow-hidden rounded-3xl p-5"
                style={{ background: `linear-gradient(160deg, ${surface}, ${bg})`, color: text }}
              >
                <div className="flex gap-1 text-3xl" aria-hidden>
                  {t.decor.slice(0, 3).map((e, j) => (
                    <motion.span
                      key={e}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2.4, delay: ((i * 3 + j) * 0.37) % 2 }}
                    >
                      {e}
                    </motion.span>
                  ))}
                </div>
                <p className="mt-4 text-xl font-bold">{t.name[locale]}</p>
                <p className="mt-1 text-sm opacity-75">{t.blurb[locale]}</p>
                <span className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: accent }} aria-hidden />
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Join with a code */}
      <section className="mx-auto max-w-md px-5 py-12">
        <form
          className="flex flex-col gap-3 rounded-3xl border border-ink-700 bg-ink-900 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const c = code.trim().toUpperCase();
            if (c) router.push(`/join/${encodeURIComponent(c)}`);
          }}
        >
          <label htmlFor="code" className="text-xl font-bold">
            {s.landJoinTitle}
          </label>
          <input
            id="code"
            dir="ltr"
            className={`${input} text-center uppercase tracking-[0.3em]`}
            value={code}
            maxLength={10}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder={s.landCodePlaceholder}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" size="lg" disabled={!code.trim()}>
            {s.landJoin}
          </Button>
        </form>
      </section>

      <footer className="pb-10 text-center text-mute">{s.landFooter}</footer>
    </main>
  );
}
