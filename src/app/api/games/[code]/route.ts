import { requireUser } from "@/server/auth";
import { deleteGame } from "@/server/games";
import { ApiError, handle, ok } from "@/server/http";
import { loadGame } from "@/server/load";

// Delete a quiz (owner only).
export async function DELETE(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const game = await loadGame((await ctx.params).code);
    if (game.owner_id !== user.id) throw new ApiError("unauthorized", 403);
    await deleteGame(game.id);
    return ok({ ok: true });
  });
}
