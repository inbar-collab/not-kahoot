import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { loadBundle } from "@/server/load";
import { findPlayerByToken } from "@/server/players";
import { buildGuest, guestSnapshot } from "@/server/snapshots";

// A guest's own view. Identified by the secret player token from join.
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  await connection();
  return handle(async () => {
    const { code } = await ctx.params;
    const token = req.headers.get("x-player-token") ?? "";
    const bundle = await loadBundle(code);
    const snap = guestSnapshot(bundle, token);
    if (snap.status === "not_found") {
      const p = await findPlayerByToken(bundle.game.id, token);
      if (p?.kicked_at) return ok(buildGuest(bundle, null, "kicked"));
    }
    return ok(snap);
  });
}
