import { connection } from "next/server";
import { buildResultsCsv, resultsCsvFilename } from "@/lib/results-csv";
import { bearer, handle } from "@/server/http";
import { assertAdmin, loadBundle } from "@/server/load";

// Host-only: download the game's results as a CSV (UTF-8 with BOM for Excel).
// Same auth as the other admin routes: `Authorization: Bearer <admin token>`.
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  await connection();
  return handle(async () => {
    const { code } = await ctx.params;
    const bundle = await loadBundle(code); // players already excludes kicked ones
    assertAdmin(bundle.game, bearer(req));

    const csv = buildResultsCsv({
      players: bundle.players.map((p) => ({
        id: p.id,
        name: p.name,
        emoji: p.avatar_emoji,
        avatarUrl: null,
        isFake: p.is_fake,
      })),
      rounds: bundle.rounds.map((r) => ({
        id: r.id,
        index: r.round_index,
        text: r.text,
        revealed: !!r.revealed_at,
        birthdayChoices: r.birthday_choices,
        optionCount: r.options.length,
        practice: r.is_practice,
      })),
      answers: bundle.answers.map((a) => ({ roundId: a.round_id, playerId: a.player_id, choice: a.choice })),
    });

    const filename = resultsCsvFilename(bundle.game.code);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  });
}
