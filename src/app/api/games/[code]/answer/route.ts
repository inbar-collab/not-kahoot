import { ApiError, handle, ok, readJson } from "@/server/http";
import { loadGame } from "@/server/load";
import { findPlayerByToken, submitAnswer } from "@/server/players";

// A guest answers the current question. The player is taken from the secret
// token, so nobody can answer on someone else's behalf.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const game = await loadGame(code);
    const player = await findPlayerByToken(game.id, req.headers.get("x-player-token") ?? "");
    if (!player) throw new ApiError("player_not_found", 401);
    if (player.kicked_at) throw new ApiError("player_kicked", 401);
    const body = await readJson<{ roundId?: string; choice?: number }>(req);
    if (typeof body.roundId !== "string" || !Number.isInteger(body.choice)) throw new ApiError("bad_request");
    await submitAnswer(game.id, player.id, body.roundId, body.choice as number);
    return ok({ ok: true });
  });
}
