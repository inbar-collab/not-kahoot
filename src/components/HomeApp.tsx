"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useSiteLocale } from "@/hooks/useSiteLocale";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";
import { getStrings, type Strings } from "@/lib/strings";
import { signInWithGoogle } from "@/lib/supabase-auth";
import { TEMPLATES, type TemplateDef } from "@/lib/templates";
import { TEMPLATE_IDS, type Locale, type Me } from "@/lib/types";
import { RunningCrowd } from "./finale/RunningCrowd";
import { GoogleIcon, SiteHeader } from "./site/SiteHeader";
import { AnswerShape } from "./ui/AnswerShape";

/** Public landing page: what it is, sign in with Google, or join a game with a code. */
export function HomeApp() {
  const [locale, setLocale] = useSiteLocale();
  useTheme("birthday", locale);
  const s = getStrings({ locale });
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

  const primaryCta = me ? (
    <Link href="/dashboard" className="btn-press btn-primary inline-flex min-h-[62px] items-center justify-center rounded-2xl px-7 text-xl font-extrabold">
      {s.landGoDashboard}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => void signIn()}
      disabled={signingIn || me === undefined}
      className="btn-press inline-flex min-h-[62px] items-center justify-center gap-3 rounded-2xl bg-white px-7 text-xl font-extrabold text-[#1f1f1f] [--btn-edge:#c9c9d6] hover:bg-[#f4f4f7]"
    >
      <GoogleIcon />
      {signingIn ? s.landSigningIn : s.landSignIn}
    </button>
  );

  return (
    <main className="stage-bg min-h-dvh overflow-x-hidden">
      <SiteHeader locale={locale} onLocale={setLocale}>
        <nav className="hidden items-center gap-1 text-base font-bold text-mute md:flex">
          <a href="#how" className="rounded-full px-3 py-1.5 hover:bg-white/5 hover:text-cream">{s.landNavHow}</a>
          <a href="#styles" className="rounded-full px-3 py-1.5 hover:bg-white/5 hover:text-cream">{s.landNavTemplates}</a>
          <a href="#faq" className="rounded-full px-3 py-1.5 hover:bg-white/5 hover:text-cream">{s.landNavFaq}</a>
        </nav>
        <Link href="/join" className="rounded-full px-3 py-1.5 text-base font-bold text-gold-soft hover:bg-white/5">
          {s.landJoin}
        </Link>
      </SiteHeader>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 md:grid-cols-[1.05fr_1fr] md:pt-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start gap-6">
          <span className="chip !bg-gold/15 !px-4 !py-1.5 text-base !text-gold-soft">🎉 {s.landTagline}</span>
          <h1 className="font-display text-[2.9rem] font-black leading-[1.02] sm:text-6xl">
            {s.landHeroA}{" "}
            <span className="bg-[linear-gradient(90deg,var(--color-gold),var(--color-accent2))] bg-clip-text text-transparent">{s.landHeroB}</span>{" "}
            {s.landHeroC}
          </h1>
          <p className="max-w-xl text-xl leading-relaxed text-mute">{s.landHeroBody}</p>
          {loginFailed && <p role="alert" className="card rounded-2xl px-4 py-3 text-lg">⚠️ {s.errors.login_required}</p>}
          <div className="flex flex-wrap items-center gap-3">
            {primaryCta}
            <Link href="/join" className="btn-press btn-ghost inline-flex min-h-[62px] items-center justify-center rounded-2xl px-6 text-xl font-extrabold">
              🔢 {s.landJoinCta}
            </Link>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-base font-bold text-mute">
            {s.landTrust.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </motion.div>
        <HeroDevices s={s} />
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <h2 className="mb-10 text-center font-display text-4xl font-black">{s.landHowTitle}</h2>
        <ol className="grid gap-7 md:grid-cols-3">
          {s.landSteps.map(([icon, title, body], i) => (
            <Reveal key={title} delay={i * 0.1} as="li" className="card relative rounded-[1.75rem] p-7 pt-9">
              <span className={`tile tile-${i} absolute -top-5 start-7 flex h-11 w-11 items-center justify-center rounded-2xl font-display text-xl font-black`}>
                {i + 1}
              </span>
              <span className="text-5xl" aria-hidden>
                {icon}
              </span>
              <h3 className="mt-4 text-2xl font-black">{title}</h3>
              <p className="mt-2 text-lg leading-relaxed text-mute">{body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="mb-8 text-center font-display text-4xl font-black">{s.landFeaturesTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.landFeatures.map(([icon, title, body], i) => (
            <Reveal key={title} delay={(i % 3) * 0.08} className="card flex gap-4 rounded-[1.5rem] p-6">
              <span className={`tile tile-${i % 4} flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl`} aria-hidden>
                {icon}
              </span>
              <div>
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-1 leading-relaxed text-mute">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Styles */}
      <section id="styles" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <h2 className="mb-8 text-center font-display text-4xl font-black">{s.landTemplatesTitle}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {TEMPLATE_IDS.map((id, i) => (
            <Reveal key={id} delay={(i % 4) * 0.07}>
              <TemplatePreview t={TEMPLATES[id]} locale={locale} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-14">
        <h2 className="mb-8 text-center font-display text-4xl font-black">{s.landFaqTitle}</h2>
        <div className="flex flex-col gap-3">
          {s.landFaq.map(([q, a]) => (
            <details key={q} className="card group rounded-2xl px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                {q}
                <span className="text-2xl text-gold transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-lg leading-relaxed text-mute">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,var(--color-a2),var(--color-accent2))] p-10 text-center text-white shadow-2xl sm:p-14">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background:var(--art)_0_0/var(--art-size)]" aria-hidden />
          <h2 className="relative font-display text-4xl font-black sm:text-5xl">{s.landCtaTitle}</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-xl opacity-90">{s.landCtaBody}</p>
          <div className="relative mt-8 flex justify-center">{primaryCta}</div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-white/5 px-5 py-8 text-mute">
        <span className="font-display text-xl font-black text-gold" dir="ltr">
          🎉 Event Quiz
        </span>
        <span>{s.landFooter}</span>
      </footer>
    </main>
  );
}

/** Fades in as it scrolls into view. */
function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const M = as === "li" ? motion.li : motion.div;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, type: "spring", stiffness: 160, damping: 20 }}
    >
      {children}
    </M>
  );
}

/** A TV showing the race, and a phone with the answer tiles in front of it. */
function HeroDevices({ s }: { s: Strings }) {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-xl pb-10"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15, type: "spring", stiffness: 120, damping: 18 }}
    >
      <div className="relative aspect-video overflow-hidden rounded-[1.6rem] border-[10px] border-[#0d0a1f] bg-ink-900 shadow-[0_50px_120px_-40px_color-mix(in_oklab,var(--color-a2)_70%,transparent)]">
        <div className="stage-bg absolute inset-0" />
        <div className="absolute inset-x-0 top-[7%] text-center font-display text-[clamp(13px,2.2vw,22px)] font-black text-gold-soft">
          {s.scrRaceTitle}
        </div>
        <RunningCrowd />
      </div>
      <div className="mx-auto h-3 w-1/4 rounded-b-xl bg-[#0d0a1f]" aria-hidden />

      <motion.div
        className="absolute -bottom-2 end-[-4%] w-[34%] min-w-[130px] rounded-[1.6rem] border-[6px] border-[#0d0a1f] bg-ink-950 p-2 shadow-2xl"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        aria-hidden
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-ink-700" />
        <div className="grid grid-cols-2 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`tile tile-${i} flex aspect-square items-center justify-center rounded-xl`}>
              <AnswerShape index={i} className="h-1/2 w-1/2" />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** A mini screen in the template's own colors. */
function TemplatePreview({ t, locale }: { t: TemplateDef; locale: Locale }) {
  const [bg, surface, accent, text] = t.swatch;
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 shadow-xl transition hover:-translate-y-1">
      <div className="relative aspect-[4/3] p-3" style={{ background: `radial-gradient(circle at 80% 0%, ${surface}, ${bg} 70%)`, color: text }}>
        <div className="flex items-center justify-between">
          <span className="text-2xl">{t.emoji}</span>
          <span className="flex gap-0.5 text-sm" aria-hidden>
            {t.decor.slice(1, 4).map((d) => (
              <span key={d}>{d}</span>
            ))}
          </span>
        </div>
        <div className="mt-2 h-2.5 w-3/4 rounded-full" style={{ background: accent }} />
        <div className="mt-1.5 h-2 w-1/2 rounded-full opacity-40" style={{ background: text }} />
        <div className="absolute inset-x-3 bottom-3 grid grid-cols-2 gap-1.5">
          {t.answers.map((c, i) => (
            <div key={i} className="flex h-7 items-center justify-center rounded-lg text-white" style={{ background: c, boxShadow: `0 3px 0 color-mix(in oklab, ${c} 70%, black)` }}>
              <AnswerShape index={i} className="h-3.5 w-3.5" />
            </div>
          ))}
        </div>
      </div>
      <div className="card !rounded-none !border-0 px-4 py-3">
        <p className="text-lg font-black">{t.name[locale]}</p>
        <p className="text-sm text-mute">{t.blurb[locale]}</p>
      </div>
    </div>
  );
}
