"use client";
import { use, useCallback, useState } from "react";
import { useLiveGame } from "@/hooks/useLiveGame";
import { api, gamePath } from "@/lib/api";
import { getStrings } from "@/lib/strings";
import type { AdminSnapshot } from "@/lib/types";
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
  const s = getStrings(data?.game.birthdayGender, data?.game.birthdayName);
  const actions = useAdminActions(code, token, s, refresh);
  const [confirm, dialog] = useConfirm({ confirmLabel: s.confirm, cancelLabel: s.cancel });
  const { setMessage } = actions;
  const clearMessage = useCallback(() => setMessage(null), [setMessage]);

  if (error?.code === "game_not_found") return <CenterMessage icon="🔍" title={s.invalidCodeTitle} body={s.invalidCodeBody} />;
  if (error?.code === "unauthorized") return <CenterMessage icon="🔒" title={s.invalidTokenTitle} body={s.invalidTokenBody} />;
  if (!data) return <Loading label={s.loading} />;

  const base = (baseUrl || window.location.origin).replace(/\/$/, "");
  const tabs: [Tab, string][] = [
    ["game", s.adminTabGame],
    ["questions", s.adminTabQuestions],
    ["photos", s.adminTabPhotos],
    ["settings", s.adminTabSettings],
    ["test", s.adminTabTest],
  ];

  return (
    <main className="min-h-dvh bg-ink-950 pb-24">
      <ConnectionPill state={connection} label={s.reconnecting} />
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Portrait url={data.game.birthdayPhotoUrl} name={data.game.birthdayName} size={44} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold">{data.game.title}</h1>
            <p className="text-sm text-mute">
              {s.adminTitle} · <bdi dir="ltr">{data.game.code}</bdi>
            </p>
          </div>
        </div>
        <nav className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-2 pb-2" aria-label={s.adminTitle}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
              className={`min-h-[48px] rounded-xl px-1 text-base font-bold transition sm:text-lg ${
                tab === id ? "bg-gold text-ink-950" : "text-mute hover:bg-ink-800 hover:text-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
        {tab === "game" && (
          <>
            <GamePanel snap={data} s={s} actions={actions} confirm={confirm} online={online} />
            <LinksPanel base={base} code={data.game.code} birthdayToken={data.birthdayToken} s={s} />
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
