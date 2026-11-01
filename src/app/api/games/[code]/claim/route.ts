import { requireUser } from "@/server/auth";
import { ApiError, bearer, handle, ok } from "@/server/http";
import { assertAdmin, loadGame } from "@/server/load";
import { db } from "@/server/supabase-admin";

// Adds a quiz that has no owner (made before accounts existed) to the
// signed-in user's list. Needs the admin link's token as proof.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const game = await loadGame((await ctx.params).code);
    assertAdmin(game, bearer(req));
    if (game.owner_id === user.id) return ok({ ok: true });
    if (game.owner_id) throw new ApiError("unauthorized", 403);
    const { error } = await db().from("games").update({ owner_id: user.id }).eq("id", game.id).is("owner_id", null);
    if (error) throw error;
    return ok({ ok: true });
  });
}
