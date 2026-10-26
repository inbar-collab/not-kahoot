"use client";
// Keeps a role-specific game snapshot in sync with the database.
//
// How it stays live:
//   1. Supabase Realtime pushes a change signal (game_pulse row) for this
//      game whenever anything in it changes -> we re-fetch our snapshot from
//      the server, which decides what this role may see.
//   2. On (re)connect, when the tab becomes visible again, or when the phone
//      comes back online, we re-fetch too, so a dropped connection always
//      resyncs from the database.
//   3. A slow background check (every 15s) is a last safety net in case a
//      signal is ever missed. It is not what drives the game.
// The same channel carries Realtime Presence, so the host can see who is
// connected right now.

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ClientApiError } from "@/lib/api";
import { browserSupabase } from "@/lib/supabase-browser";
import type { AnySnapshot } from "@/lib/types";

export type ConnectionState = "connecting" | "live" | "reconnecting";

export interface PresenceMeta {
  role: "screen" | "guest" | "birthday" | "admin";
  playerId?: string;
}

interface Options<T> {
  load: () => Promise<T>;
  /** Pulse kinds this view does not care about (e.g. other guests' answers). */
  ignoreKinds?: string[];
  presence?: PresenceMeta | null;
  /** Change this to force a reload (e.g. after joining). */
  reloadKey?: unknown;
  enabled?: boolean;
}

const SAFETY_RESYNC_MS = 15_000;

export function useLiveGame<T extends AnySnapshot>({
  load,
  ignoreKinds = [],
  presence = null,
  reloadKey,
  enabled = true,
}: Options<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ClientApiError | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [online, setOnline] = useState<PresenceMeta[]>([]);
  const [clockOffset, setClockOffset] = useState(0);

  const loadRef = useRef(load);
  const ignoreRef = useRef(ignoreKinds);
  useEffect(() => {
    loadRef.current = load;
    ignoreRef.current = ignoreKinds;
  });

  const inflight = useRef(false);
  const pending = useRef(false);

  const refresh = useCallback(async () => {
    if (inflight.current) {
      pending.current = true;
      return;
    }
    inflight.current = true;
    try {
      do {
        pending.current = false;
        try {
          const snap = await loadRef.current();
          setData(snap);
          setError(null);
          setClockOffset(Date.parse(snap.game.serverNow) - Date.now());
        } catch (e) {
          setError(e instanceof ClientApiError ? e : new ClientApiError("server_error", 500));
        }
      } while (pending.current);
    } finally {
      inflight.current = false;
    }
  }, []);

  // Initial load and explicit reloads.
  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, reloadKey, refresh]);

  // Realtime subscription (once we know the game id).
  const gameId = data?.game.id ?? null;
  const presenceKey = presence ? `${presence.role}:${presence.playerId ?? ""}` : "";
  const presenceRef = useRef(presence);
  useEffect(() => {
    presenceRef.current = presence;
  });

  useEffect(() => {
    if (!gameId || !enabled) return;
    const supabase = browserSupabase();
    const me = presenceRef.current;
    const channel: RealtimeChannel = supabase.channel(`game:${gameId}`, {
      config: { presence: { key: me ? `${presenceKey}:${Math.random().toString(36).slice(2, 8)}` : "" } },
    });

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_pulse", filter: `game_id=eq.${gameId}` },
        (payload) => {
          const kind = (payload.new as { kind?: string } | null)?.kind;
          if (kind && ignoreRef.current.includes(kind)) return;
          void refresh();
        },
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceMeta>();
        setOnline(Object.values(state).flat());
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnection("live");
          void refresh(); // resync after every (re)connect
          if (me) void channel.track(me);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnection("reconnecting");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [gameId, enabled, presenceKey, refresh]);

  // Resync when the phone wakes up / comes back online, plus a slow safety net.
  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onOnline = () => void refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onOnline);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, SAFETY_RESYNC_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onOnline);
      window.clearInterval(timer);
    };
  }, [enabled, refresh]);

  /** Milliseconds since the game entered its current state (server clock). */
  const msInState = useCallback(() => {
    if (!data) return 0;
    return Date.now() + clockOffset - Date.parse(data.game.stateChangedAt);
  }, [data, clockOffset]);

  return { data, error, connection, online, refresh, msInState };
}
