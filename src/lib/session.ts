"use client";
// The guest's identity on this phone. Survives refreshes and browser restarts.

export interface GuestSession {
  playerId: string;
  token: string;
  name: string;
}

const key = (code: string) => `not-kahoot:player:${code.toUpperCase()}`;

export function loadSession(code: string): GuestSession | null {
  try {
    const raw = localStorage.getItem(key(code));
    return raw ? (JSON.parse(raw) as GuestSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(code: string, s: GuestSession) {
  try {
    localStorage.setItem(key(code), JSON.stringify(s));
  } catch {
    /* private mode: the session lasts for this tab only */
  }
}

export function clearSession(code: string) {
  try {
    localStorage.removeItem(key(code));
  } catch {
    /* ignore */
  }
}
