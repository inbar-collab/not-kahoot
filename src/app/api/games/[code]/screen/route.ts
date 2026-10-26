import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { loadBundle } from "@/server/load";
import { screenSnapshot } from "@/server/snapshots";

// Public: the TV screen. Never includes the birthday answer before the reveal.
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  await connection();
  return handle(async () => {
    const { code } = await ctx.params;
    return ok(screenSnapshot(await loadBundle(code)));
  });
}
