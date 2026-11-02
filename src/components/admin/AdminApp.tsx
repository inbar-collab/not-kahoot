"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLiveGame } from "@/hooks/useLiveGame";
import { useTheme } from "@/hooks/useTheme";
import { api, gamePath } from "@/lib/api";
import { getStrings } from "@/lib/strings";
import type { AdminSnapshot, Me } from "@/lib/types";
import { Button } from "../ui/Button";
import { useConfirm } from "../ui/Confirm";
import { Portrait } from "../ui/Portrait";
import { CenterMessage, ConnectionPill, Loading } from "../ui/Status";
import { GamePanel } from "./GamePanel";
import { LinksPanel } from "./LinksPanel";
import { PhotosPanel } from "./PhotosPanel";
import { QuestionsPanel } from "./QuestionsPanel";
import { SettingsPanel } from "./SettingsPanel";
import { TestPanel } from "./TestPanel";
import { Toast } from "./Toast";
import { useAdminActions } from "./useAdminActions";

type Tab = "game" | "questions" | "photos" | "settings" | "test";
const PRESENCE = { role: "admin" as const };

export function AdminApp({
  params,
  searchParams,
  baseUrl,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
  baseUrl: string;
}) {
  const code = use(params).code.toUpperCase();
  const raw = use(searchParams).token;
  const token = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const [tab, setTab] = useState<Tab>("game");

  const load = useCallback(() => api.get<AdminSnapshot>(gamePath(code, "admin"), { bearer: token }), [code, token]);
  const { data, error, connection, online, refresh } = useLiveGame({ load, presence: PRESENCE });
  const s = getStrings(data?.game);
  useTheme(data?.game.template, data?.game.locale);
  const actions = useAdminActions(code, token, s, refresh);
  const [confirm, dialog] = useConfirm({ confirmLabel: s.confirm, cancelLabel: s.cancel });
  const { setMessage } = actions;
  const clearMessage = useCallback(() => setMessage(null), [setMessage]);

  if (error?.code === "game_not_found") return <CenterMessage icon="🔍" title={s.invalidCodeTitle} body={s.invalidCodeBody} />;
  if (error?.code === "unauthorized") return <CenterMessage icon="🔒" title={s.invalidTokenTitle} body={s.invalidTokenBody} />;
  if (!data) return <Loading label={s.loading} />;

  const base = (baseUrl || window.location.origin).replace(/\/$/, "");
  const tabs: [Tab, string, string][] = [
    ["game", "🎮", s.adminTabGame],
    ["questions", "❓", s.adminTabQuestions],
    ["photos", "🖼️", s.adminTabPhotos],
    ["settings", "⚙️", s.adminTabSettings],
    ["test", "🧪", s.adminTabTest],
  ];

  return (
    <main className="stage-bg min-h-dvh pb-24">
      <ConnectionPill state={connection} label={s.reconnecting} />
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/dashboard" className="shrink-0 rounded-xl px-2 py-2 text-base font-bold text-mute hover:bg-ink-800 hover:text-cream">
            {s.adminBack}
          </Link>
          <Portrait url={data.game.birthdayPhotoUrl} name={data.game.birthdayName} size={44} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold">{data.game.title}</h1>
            <p className="text-sm text-mute">
              {s.adminTitle} · <bdi dir="ltr">{data.game.code}</bdi>
            </p>
          </div>
        </div>
        <nav className="mx-3 mb-3 grid max-w-3xl grid-cols-5 gap-1 rounded-2xl bg-ink-900/80 p-1 sm:mx-auto" aria-label={s.adminTitle}>
          {tabs.map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
              className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl px-1 text-xs font-bold transition sm:flex-row sm:gap-1.5 sm:text-base ${
                tab === id ? "bg-gold text-ink-950 shadow-md" : "text-mute hover:bg-ink-800 hover:text-cream"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
        {!data.owned && <ClaimBanner code={code} token={token} s={s} />}
        {tab === "game" && (
          <>
            <GamePanel snap={data} s={s} actions={actions} confirm={confirm} online={online} />
            <LinksPanel base={base} code={data.game.code} title={data.game.title} birthdayToken={data.birthdayToken} s={s} />
          </>
        )}
        {tab === "questions" && <QuestionsPanel snap={data} s={s} actions={actions} confirm={confirm} />}
        {tab === "photos" && <PhotosPanel snap={data} s={s} actions={actions} confirm={confirm} />}
        {tab === "settings" && <SettingsPanel key={JSON.stringify(data.settings)} snap={data} s={s} actions={actions} />}
        {tab === "test" && <TestPanel snap={data} s={s} actions={actions} confirm={confirm} />}
      </div>

      <Toast message={actions.message} onDone={clearMessage} />
      {dialog}
    </main>
  );
}

/** Offers to add an unowned quiz (made before accounts existed) to the signed-in user's list. */
function ClaimBanner({ code, token, s }: { code: string; token: string; s: ReturnType<typeof getStrings> }) {
  const [me, setMe] = useState<Me | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get<{ user: Me | null }>("/api/me").then((r) => setMe(r.user), () => {});
  }, []);
  if (!me || done) return null;
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-gold/40 bg-gold/10 p-4 sm:flex-row sm:items-center">
      <p className="flex-1 text-lg">{s.adminClaimBody}</p>
      <Button
        size="md"
        busy={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api.post(gamePath(code, "claim"), {}, { bearer: token });
            setDone(true);
          } catch {
            /* stays visible; the user can try again */
          }
          setBusy(false);
        }}
      >
        {s.adminClaimButton}
      </Button>
    </div>
  );
}
