import { connection } from "next/server";
import { birthdayLock } from "@/server/control";
import { ApiError, bearer, handle, ok, readJson } from "@/server/http";
import { assertBirthday, loadBundle, loadGame } from "@/server/load";
import { birthdaySnapshot } from "@/server/snapshots";

// The birthday person's view: her question and her own answer only.
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  await connection();
  return handle(async () => {
    const { code } = await ctx.params;
    const bundle = await loadBundle(code);
    assertBirthday(bundle.game, bearer(req));
    return ok(birthdaySnapshot(bundle));
  });
}

// Lock her answer(s) for the current question. Cannot be changed afterwards.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const game = await loadGame(code);
    assertBirthday(game, bearer(req));
    const body = await readJson<{ roundId?: string; choices?: number[] }>(req);
    if (
      typeof body.roundId !== "string" ||
      !Array.isArray(body.choices) ||
      body.choices.length === 0 ||
      !body.choices.every((c) => Number.isInteger(c))
    ) {
      throw new ApiError("bad_request");
    }
    await birthdayLock(game.id, body.roundId, body.choices);
    return ok({ ok: true });
  });
}
