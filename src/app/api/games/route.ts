import { TEMPLATE_IDS, type Gender, type TemplateId } from "@/lib/types";
import { requireUser } from "@/server/auth";
import { AI_MAX_QUESTIONS } from "@/server/ai";
import { cleanQuestion } from "@/server/content";
import { createGame, MAX_GAMES_PER_USER } from "@/server/games";
import { ApiError, handle, ok, readJson } from "@/server/http";
import { db } from "@/server/supabase-admin";

// Create a new quiz. Requires a signed-in user (Google).
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson<{
      template?: string;
      locale?: string;
      birthdayName?: string;
      gender?: string;
      title?: string;
      questions?: unknown;
      practice?: unknown;
    }>(req);
    // Optional ready-made questions (from the AI builder); otherwise the template's.
    let questions: { text: string; options: string[] }[] | undefined;
    if (Array.isArray(body.questions)) {
      if (body.questions.length === 0 || body.questions.length > AI_MAX_QUESTIONS) throw new ApiError("question_invalid");
      questions = body.questions.map((q) => cleanQuestion((q ?? {}) as Record<string, unknown>));
    }
    const practice = questions && body.practice ? cleanQuestion(body.practice as Record<string, unknown>) : null;
    const name = (body.birthdayName ?? "").trim();
    if (!name || [...name].length > 60) throw new ApiError("settings_invalid");
    if (!TEMPLATE_IDS.includes(body.template as TemplateId)) throw new ApiError("settings_invalid");
    const gender = (["female", "male", "plural"].includes(body.gender ?? "") ? body.gender : "female") as Gender;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if ([...title].length > 120) throw new ApiError("settings_invalid");

    const { count, error } = await db().from("games").select("id", { count: "exact", head: true }).eq("owner_id", user.id);
    if (error) throw error;
    if ((count ?? 0) >= MAX_GAMES_PER_USER) throw new ApiError("too_many_games", 403);

    const game = await createGame({
      ownerId: user.id,
      template: body.template as TemplateId,
      locale: body.locale === "en" ? "en" : "he",
      birthdayName: name,
      gender,
      title,
      questions,
      practice,
    });
    return ok({ code: game.code, adminToken: game.adminToken }, 201);
  });
}
