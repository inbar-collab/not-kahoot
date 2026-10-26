import { ApiError, handle, ok } from "@/server/http";
import { loadGame } from "@/server/load";
import { joinGame } from "@/server/players";

// Join as a guest. multipart/form-data: name, emoji?, avatar? (image file)
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const game = await loadGame(code);
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new ApiError("bad_request");
    }
    const { player, token } = await joinGame(game, {
      name: form.get("name"),
      emoji: form.get("emoji"),
      avatar: form.get("avatar"),
    });
    return ok({ playerId: player.id, name: player.name, token }, 201);
  });
}
