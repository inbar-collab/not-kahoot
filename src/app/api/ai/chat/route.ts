import { TEMPLATE_IDS, type AiContext, type AiMessage, type TemplateId } from "@/lib/types";
import { AI_DAILY_LIMIT, AI_MAX_TURNS, aiTurn } from "@/server/ai";
import { requireUser } from "@/server/auth";
import { ApiError, handle, ok, readJson } from "@/server/http";
import { db } from "@/server/supabase-admin";

// Writing 30 questions can take the model a little while.
export const maxDuration = 120;

// One turn of the AI quiz builder chat. Signed-in hosts only, with a daily cap.
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson<{ messages?: unknown; context?: unknown }>(req);
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0 || messages.length > AI_MAX_TURNS) throw new ApiError("bad_request");
    const clean: AiMessage[] = messages.map((m) => {
      const r = m as { role?: unknown; text?: unknown };
      if ((r.role !== "user" && r.role !== "assistant") || typeof r.text !== "string" || !r.text.trim() || r.text.length > 2000) {
        throw new ApiError("bad_request");
      }
      return { role: r.role, text: r.text.trim() };
    });
    if (clean[clean.length - 1].role !== "user") throw new ApiError("bad_request");

    const ctx = cleanContext(body.context);
    const { data: allowed, error } = await db().rpc("bump_ai_usage", { p_user: user.id, p_limit: AI_DAILY_LIMIT });
    if (error) throw error;
    if (!allowed) throw new ApiError("ai_limit", 429);

    return ok(await aiTurn(clean, ctx));
  });
}

function cleanContext(raw: unknown): AiContext | null {
  const c = raw as Partial<AiContext> | null;
  if (!c || !TEMPLATE_IDS.includes(c.template as TemplateId)) return null;
  return {
    template: c.template as TemplateId,
    locale: c.locale === "en" ? "en" : "he",
    starName: String(c.starName ?? "").slice(0, 60),
    gender: c.gender === "male" || c.gender === "plural" ? c.gender : "female",
    existing: Array.isArray(c.existing) ? c.existing.filter((x): x is string => typeof x === "string").slice(0, 60).map((x) => x.slice(0, 300)) : [],
  };
}
