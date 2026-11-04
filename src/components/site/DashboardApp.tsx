"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useSiteLocale } from "@/hooks/useSiteLocale";
import { useTheme } from "@/hooks/useTheme";
import { api, ClientApiError, gamePath } from "@/lib/api";
import { getStrings, type Strings } from "@/lib/strings";
import { TEMPLATES } from "@/lib/templates";
import type { Me, MyGame } from "@/lib/types";
import { CopyRow } from "../admin/LinksPanel";
import { Button } from "../ui/Button";
import { useConfirm } from "../ui/Confirm";
import { Loading } from "../ui/Status";
import { Onboarding, onboardingSeen } from "./Onboarding";
import { SiteHeader } from "./SiteHeader";

/** The signed-in host's quizzes, with every link they need to send out. */
export function DashboardApp({ baseUrl }: { baseUrl: string }) {
  const [locale, setLocale] = useSiteLocale();
  useTheme("site", locale);
  const s = getStrings({ locale });
  const router = useRouter();
  const [games, setGames] = useState<MyGame[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [confirm, dialog] = useConfirm({ confirmLabel: s.confirm, cancelLabel: s.cancel });
  const [onboarding, setOnboarding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mine, who] = await Promise.all([
        api.get<{ games: MyGame[] }>("/api/me/games"),
        api.get<{ user: Me | null }>("/api/me"),
      ]);
      setGames(mine.games);
      setMe(who.user);
      // First visit: show the short walkthrough.
      if (!onboardingSeen()) setOnboarding(true);
    } catch (e) {
      if (e instanceof ClientApiError && e.code === "login_required") router.replace("/");
    }
  }, [router, setOnboarding]);

  useEffect(() => {
    // Fetch once on mount; state is set after the network round-trip.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (!games) return <Loading label={s.loading} />;
  const base = (baseUrl || window.location.origin).replace(/\/$/, "");

  return (
    <main className="stage-bg min-h-dvh pb-16">
      <SiteHeader locale={locale} onLocale={setLocale}>
        <button
          type="button"
          onClick={() => setOnboarding(true)}
          className="rounded-full px-3 py-1.5 text-sm font-bold text-mute hover:bg-ink-800 hover:text-cream"
        >
          {s.dashHelp}
        </button>
        <form action="/auth/signout" method="post">
          <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-bold text-mute hover:bg-ink-800 hover:text-cream">
            {s.dashSignOut}
          </button>
        </form>
      </SiteHeader>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-black">{s.dashTitle}</h1>
            {me && <p className="mt-1 text-mute">{s.dashSignedInAs(me.name || me.email)}</p>}
          </div>
          <Link href="/new" className="inline-flex min-h-[60px] items-center rounded-2xl bg-gold px-6 text-xl font-bold text-ink-950 hover:bg-gold-soft">
            {s.dashNew}
          </Link>
        </div>

        {games.length === 0 && (
          <div className="rounded-3xl border border-dashed border-ink-600 p-10 text-center">
            <p className="text-6xl" aria-hidden>🎈</p>
            <p className="mt-4 text-xl text-mute">{s.dashEmpty}</p>
          </div>
        )}

        <ul className="grid gap-5 md:grid-cols-2">
          <AnimatePresence>
            {games.map((g) => (
              <GameCard
                key={g.code}
                g={g}
                base={base}
                s={s}
                onDelete={async () => {
                  if (!(await confirm(s.dashConfirmDelete(g.title), s.dashDelete))) return;
                  await fetch(`/api/games/${encodeURIComponent(g.code)}`, { method: "DELETE" }).catch(() => {});
                  void load();
                }}
              />
            ))}
          </AnimatePresence>
        </ul>

        <ClaimForm s={s} onClaimed={load} />
      </div>
      {dialog}
      <AnimatePresence>{onboarding && <Onboarding s={s} onClose={() => setOnboarding(false)} />}</AnimatePresence>
    </main>
  );
}

function GameCard({ g, base, s, onDelete }: { g: MyGame; base: string; s: Strings; onDelete: () => void }) {
  const t = TEMPLATES[g.template];
  // Links speak the quiz's own language (its star's pronoun and name).
  const gs = getStrings({ locale: g.locale, birthdayGender: g.birthdayGender, birthdayName: g.birthdayName, template: g.template });
  const admin = `/admin/${g.code}?token=${encodeURIComponent(g.adminToken)}`;
  const tv = `${base}/screen/${g.code}`;
  const join = `${base}/join/${g.code}`;
  const star = `${base}/star/${g.code}?token=${encodeURIComponent(g.birthdayToken)}`;
  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="overflow-hidden rounded-3xl card">
      <div data-theme={g.template} className="stage-bg flex items-center gap-4 border-b-[length:var(--line-w)] border-[var(--line)] p-5">
        {g.photoUrl ? (
          <img src={g.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" style={{ boxShadow: "0 0 0 3px var(--color-gold)" }} />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-4xl" style={{ background: "var(--color-ink-900)", boxShadow: "0 0 0 3px var(--color-gold)" }}>
            {t.emoji}
          </span>
        )}
        <div className="min-w-0 flex-1" dir={g.locale === "he" ? "rtl" : "ltr"}>
          <p className="hero-title truncate text-2xl leading-tight">{g.title}</p>
          <p className="truncate text-sm text-mute">
            {t.emoji} {t.name[g.locale]} · <bdi>{g.birthdayName}</bdi>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-5 pt-4 text-sm">
        <span className={`rounded-full px-3 py-1 font-bold ${g.state === "LOBBY" ? "bg-ink-800 text-mute" : g.state === "FINISHED" ? "bg-ink-800 text-cream" : "bg-gold/20 text-gold-soft"}`}>
          {s.dashState(g.state)}
        </span>
        <span className="rounded-full bg-ink-800 px-3 py-1 text-mute">{s.dashPlayers(g.playerCount)}</span>
        <span className="rounded-full bg-ink-800 px-3 py-1 text-mute" dir="ltr">{g.code}</span>
      </div>
      <div className="flex flex-col gap-3 p-5">
        <Link href={admin} className="btn-press btn-primary inline-flex min-h-[56px] items-center justify-center rounded-2xl px-5 text-lg font-extrabold">
          {s.dashManage}
        </Link>
        <details className="rounded-2xl bg-ink-850 px-4">
          <summary className="cursor-pointer py-3 text-lg font-bold text-gold-soft">🔗 {s.adminLinks}</summary>
          <CopyRow label={s.dashTv} url={tv} s={s} />
          <CopyRow label={s.dashGuests} url={join} s={s} whatsapp={gs.adminWhatsAppText(g.title, join)} />
          <CopyRow label={s.dashStar(g.birthdayName)} url={star} s={s} />
        </details>
        <Button variant="quiet" className="self-end" onClick={onDelete}>
          🗑 {s.dashDelete}
        </Button>
      </div>
    </motion.li>
  );
}

function ClaimForm({ s, onClaimed }: { s: Strings; onClaimed: () => void }) {
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <details className="rounded-3xl card p-5">
      <summary className="cursor-pointer text-lg font-bold text-mute">{s.dashClaimTitle}</summary>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const m = link.match(/\/admin\/([A-Za-z0-9]{4,10})\?token=([^&\s#]+)/);
          if (!m) return setMsg(s.dashClaimBad);
          setBusy(true);
          try {
            await api.post(gamePath(m[1], "claim"), {}, { bearer: decodeURIComponent(m[2]) });
            setMsg(s.dashClaimed);
            setLink("");
            onClaimed();
          } catch (err) {
            const c = err instanceof ClientApiError ? err.code : "network";
            setMsg(c === "network" ? s.networkError : s.errors[c]);
          }
          setBusy(false);
        }}
      >
        <p className="text-mute">{s.dashClaimHint}</p>
        <input
          dir="ltr"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder={s.dashClaimPlaceholder}
          className="h-14 w-full field"
        />
        <Button type="submit" size="md" busy={busy} disabled={!link.trim()}>
          {s.dashClaimButton}
        </Button>
        {msg && <p role="status" className="text-lg">{msg}</p>}
      </form>
    </details>
  );
}
