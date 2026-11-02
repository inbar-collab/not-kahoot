"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useSiteLocale } from "@/hooks/useSiteLocale";
import { useTheme } from "@/hooks/useTheme";
import { api, ClientApiError } from "@/lib/api";
import { getStrings } from "@/lib/strings";
import { inflect, TEMPLATES } from "@/lib/templates";
import type { AiQuiz, Gender, Locale, TemplateId } from "@/lib/types";
import { Choice } from "../admin/SettingsPanel";
import { Button } from "../ui/Button";
import { TemplatePicker } from "../ui/TemplatePicker";
import { AiBuilder } from "./AiBuilder";
import { SiteHeader } from "./SiteHeader";

const input =
  "field h-14";

/** Two steps: pick the kind of event, then the star's name, pronoun and language. */
export function NewQuizApp() {
  const [siteLocale, setSiteLocale] = useSiteLocale();
  const router = useRouter();
  const [templateId, setTemplateId] = useState<TemplateId | null>(null);
  const [aiMode, setAiMode] = useState(false);
  const [quizLocale, setQuizLocale] = useState<Locale | null>(null);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locale = quizLocale ?? siteLocale;
  // Preview the chosen template while filling in the details.
  useTheme(templateId ?? "birthday", siteLocale);
  const s = getStrings({ locale: siteLocale });
  const t = templateId ? TEMPLATES[templateId] : null;
  const pronoun = gender ?? t?.defaultGender ?? "female";
  const autoTitle = t ? inflect(t.title[locale], pronoun, name.trim() || "…") : "";

  /** Creates the quiz straight from the AI builder's result. */
  async function createFromAi(quiz: AiQuiz, picked: AiQuiz["questions"]) {
    try {
      const res = await api.post<{ code: string; adminToken: string }>("/api/games", {
        template: quiz.template,
        locale: quiz.locale,
        birthdayName: quiz.starName,
        gender: quiz.gender,
        title: quiz.title,
        questions: picked,
        practice: quiz.practice,
      });
      router.push(`/admin/${res.code}?token=${encodeURIComponent(res.adminToken)}`);
    } catch (err) {
      const c = err instanceof ClientApiError ? err.code : "network";
      if (c === "login_required") return router.replace("/");
      setError(c === "network" ? s.networkError : s.errors[c]);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!t) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ code: string; adminToken: string }>("/api/games", {
        template: t.id,
        locale,
        birthdayName: name,
        gender: pronoun,
        title,
      });
      router.push(`/admin/${res.code}?token=${encodeURIComponent(res.adminToken)}`);
    } catch (err) {
      const c = err instanceof ClientApiError ? err.code : "network";
      if (c === "login_required") return router.replace("/");
      setError(c === "network" ? s.networkError : s.errors[c]);
      setBusy(false);
    }
  }

  return (
    <main className="stage-bg min-h-dvh pb-16">
      <SiteHeader locale={siteLocale} onLocale={setSiteLocale} />
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4">
        <h1 className="font-display text-4xl font-black">{s.newTitle}</h1>
        <AnimatePresence mode="wait">
          {aiMode ? (
            <motion.section key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setAiMode(false)} className="rounded-xl px-2 py-1 font-bold text-mute hover:bg-ink-800 hover:text-cream">
                  {s.newBack}
                </button>
                <h2 className="text-2xl font-bold text-gold-soft">{s.aiTitle}</h2>
              </div>
              {error && (
                <p role="alert" className="rounded-2xl bg-ink-800 p-4 text-lg">
                  ⚠️ {error}
                </p>
              )}
              <AiBuilder s={s} actionLabel={s.aiCreate} onUse={createFromAi} />
            </motion.section>
          ) : !t ? (
            <motion.section key="pick" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button
                type="button"
                onClick={() => setAiMode(true)}
                className="mb-6 flex w-full items-center gap-4 rounded-3xl border-2 border-gold/60 bg-gradient-to-l from-gold/20 to-transparent p-5 text-start transition hover:border-gold"
              >
                <motion.span className="text-5xl" animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }} aria-hidden>
                  🤖
                </motion.span>
                <span>
                  <span className="block text-2xl font-bold text-gold-soft">{s.aiCta}</span>
                  <span className="block text-lg text-mute">{s.aiCtaBody}</span>
                </span>
              </button>
              <h2 className="mb-4 text-2xl font-bold">{s.newStep1}</h2>
              <p className="-mt-2 mb-4 text-mute">{s.aiOr}</p>
              <TemplatePicker value={templateId} locale={siteLocale} onChange={setTemplateId} big />
            </motion.section>
          ) : (
            <motion.form
              key="details"
              onSubmit={create}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5 rounded-3xl card p-5 sm:p-7"
            >
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setTemplateId(null)} className="rounded-xl px-2 py-1 font-bold text-mute hover:bg-ink-800 hover:text-cream">
                  {s.newBack}
                </button>
                <span className="text-3xl" aria-hidden>
                  {t.emoji}
                </span>
                <h2 className="text-2xl font-bold text-gold-soft">{t.name[siteLocale]}</h2>
              </div>
              <div className="flex gap-2 text-3xl" aria-hidden>
                {t.decor.map((d, i) => (
                  <motion.span key={d} animate={{ y: [0, -6, 0], rotate: [0, i % 2 ? 8 : -8, 0] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}>
                    {d}
                  </motion.span>
                ))}
              </div>

              <Choice
                legend={s.newLanguage}
                options={(["he", "en"] as Locale[]).map((l) => [l, s.languages[l]])}
                value={locale}
                onChange={setQuizLocale}
              />
              <label className="flex flex-col gap-1">
                <span className="text-lg font-bold">{t.nameLabel[siteLocale]}</span>
                <input className={input} value={name} maxLength={60} required autoFocus onChange={(e) => setName(e.target.value)} />
              </label>
              <Choice
                legend={s.newPronoun}
                options={(["female", "male", "plural"] as Gender[]).map((g) => [g, s.pronouns[g]])}
                value={pronoun}
                onChange={setGender}
              />
              <label className="flex flex-col gap-1">
                <span className="text-lg font-bold">{s.newTitleLabel}</span>
                <input
                  className={input}
                  dir={locale === "he" ? "rtl" : "ltr"}
                  value={title}
                  maxLength={120}
                  placeholder={autoTitle}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <p className="text-base text-mute">{s.newStarterNote}</p>
              {error && (
                <p role="alert" className="rounded-2xl bg-ink-800 p-4 text-lg">
                  ⚠️ {error}
                </p>
              )}
              <Button type="submit" size="xl" busy={busy} disabled={!name.trim()}>
                {s.newCreate}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
