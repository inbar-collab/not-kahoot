"use client";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useLiveGame } from "@/hooks/useLiveGame";
import { api, gamePath } from "@/lib/api";
import { clearSession, loadSession, type GuestSession } from "@/lib/session";
import { getStrings } from "@/lib/strings";
import type { GuestSnapshot } from "@/lib/types";
import { CenterMessage, ConnectionPill, Loading } from "../ui/Status";
import { GuestPlay } from "./GuestPlay";
import { JoinForm } from "./JoinForm";

export function GuestApp({ params }: { params: Promise<{ code: string }> }) {
  const code = use(params).code.toUpperCase();
  const [session, setSession] = useState<GuestSession | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // The session lives in localStorage; read it after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of browser storage
    setSession(loadSession(code));
    setReady(true);
  }, [code]);

  const token = session?.token;
  const load = useCallback(
    () => api.get<GuestSnapshot>(gamePath(code, "guest"), token ? { playerToken: token } : undefined),
    [code, token],
  );
  const presence = useMemo(
    () => (session ? { role: "guest" as const, playerId: session.playerId } : null),
    [session],
  );
  const { data, error, connection, refresh, msInState } = useLiveGame({
    load,
    enabled: ready,
    reloadKey: token,
    ignoreKinds: ["answer", "content"],
    presence,
  });

  const s = getStrings(data?.game.birthdayGender, data?.game.birthdayName);

  // Kicked or removed: forget this phone's player and go back to the join screen.
  const status = data?.status;
  useEffect(() => {
    if (session && (status === "kicked" || status === "not_found")) {
      clearSession(code);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a server verdict
      setNotice(status === "kicked" ? s.joinKickedNotice : s.errors.player_not_found);
      setSession(null);
    }
  }, [status, session, code, s]);

  if (error?.code === "game_not_found") {
    return <CenterMessage icon="🔍" title={s.invalidCodeTitle} body={s.invalidCodeBody} />;
  }
  if (!data || !ready) return <Loading label={s.loading} />;

  const { game } = data;
  const playing = session && data.status === "ok" && data.me;

  if (!playing) {
    if (session) return <Loading label={s.loading} />; // verifying the stored session
    if (game.state === "FINISHED") return <CenterMessage icon="🎉" title={s.errors.game_finished} />;
    if (game.state !== "LOBBY" && !game.allowLateJoin) {
      return <CenterMessage icon="📺" title={s.errors.late_join_closed} />;
    }
    return (
      <JoinForm
        game={game}
        s={s}
        notice={notice}
        onJoined={(sess) => {
          setNotice(null);
          setSession(sess);
        }}
      />
    );
  }

  return (
    <>
      <ConnectionPill state={connection} label={s.reconnecting} />
      <GuestPlay
        snap={data}
        s={s}
        token={session.token}
        refresh={refresh}
        msInState={msInState}
      />
    </>
  );
}
