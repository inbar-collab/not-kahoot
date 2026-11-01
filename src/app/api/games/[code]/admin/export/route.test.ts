import { beforeEach, describe, expect, it, vi } from "vitest";

// The route's server modules import "server-only" and a Supabase client;
// replace both so the handler runs against an in-memory game.
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));

let gameRow: Record<string, unknown> | null = null;
vi.mock("@/server/supabase-admin", () => ({
  db: () => ({
    from: () => ({
      select: () => ({
        eq: (_col: string, code: string) => ({
          maybeSingle: async () => ({ data: gameRow && gameRow.code === code ? gameRow : null, error: null }),
        }),
      }),
    }),
  }),
  publicPhotoUrl: () => null,
}));

const { GET } = await import("./route");

const ADMIN = "admin-secret-token";
const player = (id: string, name: string, joined: string, kicked: string | null = null) => ({
  id,
  game_id: "g1",
  name,
  name_key: name,
  token_hash: "x",
  avatar_emoji: null,
  avatar_path: null,
  is_fake: false,
  kicked_at: kicked,
  joined_at: joined,
});
const round = (id: string, idx: number, extra: Record<string, unknown> = {}) => ({
  id,
  game_id: "g1",
  round_index: idx,
  question_id: null,
  text: `שאלה ${idx}`,
  options: ["א", "ב", "ג"],
  photo_path: null,
  birthday_choices: [0],
  birthday_locked_at: "2026-01-01T00:00:00Z",
  opened_at: "2026-01-01T00:00:00Z",
  closed_at: "2026-01-01T00:00:00Z",
  revealed_at: "2026-01-01T00:00:00Z",
  is_practice: false,
  ...extra,
});
const answer = (round_id: string, player_id: string, choice: number) => ({
  id: `${round_id}-${player_id}`,
  game_id: "g1",
  round_id,
  player_id,
  choice,
  created_at: "2026-01-01T00:00:00Z",
});

function call(code: string, token?: string) {
  const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {};
  return GET(new Request(`http://localhost/api/games/${code}/admin/export`, { headers }), {
    params: Promise.resolve({ code }),
  });
}

beforeEach(() => {
  gameRow = {
    id: "g1",
    code: "PARTY7",
    admin_token: ADMIN,
    birthday_token: "bday",
    title: "",
    birthday_name: "רחל",
    birthday_gender: "female",
    state: "FINISHED",
    current_index: 2,
    players: [
      player("p1", "דנה", "2026-01-01T00:00:01Z"),
      player("p2", "יוסי", "2026-01-01T00:00:02Z"),
      player("p3", "מורחק", "2026-01-01T00:00:03Z", "2026-01-01T00:05:00Z"),
    ],
    rounds: [round("r0", 0, { is_practice: true }), round("r1", 1), round("r2", 2, { birthday_choices: [1, 2] })],
    answers: [
      answer("r0", "p1", 0),
      answer("r1", "p1", 0),
      answer("r2", "p1", 0),
      answer("r1", "p2", 0),
      answer("r2", "p2", 2),
      answer("r1", "p3", 0),
      answer("r2", "p3", 1),
    ],
  };
});

describe("GET /api/games/[code]/admin/export", () => {
  it("rejects a missing or wrong admin token", async () => {
    for (const token of [undefined, "nope", "bday"]) {
      const res = await call("PARTY7", token);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "unauthorized" });
    }
  });

  it("404s for an unknown game", async () => {
    const res = await call("NOPE99", ADMIN);
    expect(res.status).toBe(404);
  });

  it("returns a UTF-8 BOM CSV download named after the game code, without kicked players", async () => {
    const res = await call("party7", ADMIN); // codes are case-insensitive
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toContain('attachment; filename="not-kahoot-PARTY7-results.csv"');
    expect(res.headers.get("cache-control")).toContain("no-store");

    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
    expect(text.slice(1).trimEnd().split("\r\n")).toEqual([
      "מקום,שם,ניקוד,1. שאלה 1,2. שאלה 2",
      "1,יוסי,2,✓,✓",
      "2,דנה,1,✓,✗",
    ]);
    expect(text).not.toContain("מורחק");
  });
});
