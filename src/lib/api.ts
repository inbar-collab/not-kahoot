"use client";
import type { ApiErrorCode } from "./types";

export class ClientApiError extends Error {
  constructor(
    public code: ApiErrorCode | "network",
    public status: number,
  ) {
    super(code);
  }
}

export interface Auth {
  bearer?: string;
  playerToken?: string;
}

function headers(auth: Auth | undefined, json: boolean): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h["content-type"] = "application/json";
  if (auth?.bearer) h.authorization = `Bearer ${auth.bearer}`;
  if (auth?.playerToken) h["x-player-token"] = auth.playerToken;
  return h;
}

async function parse<T>(res: Response): Promise<T> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const code = (data as { error?: ApiErrorCode } | null)?.error ?? "server_error";
    throw new ClientApiError(code, res.status);
  }
  return data as T;
}

async function send<T>(input: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, { ...init, cache: "no-store" });
  } catch {
    throw new ClientApiError("network", 0);
  }
  return parse<T>(res);
}

export const api = {
  get<T>(path: string, auth?: Auth) {
    return send<T>(path, { headers: headers(auth, false) });
  },
  post<T>(path: string, body: unknown, auth?: Auth) {
    return send<T>(path, { method: "POST", headers: headers(auth, true), body: JSON.stringify(body) });
  },
  form<T>(path: string, form: FormData, auth?: Auth) {
    return send<T>(path, { method: "POST", headers: headers(auth, false), body: form });
  },
};

export const gamePath = (code: string, sub: string) => `/api/games/${encodeURIComponent(code)}/${sub}`;
