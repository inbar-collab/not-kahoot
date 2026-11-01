// Cleans what the AI quiz builder returns. The model's output is never
// trusted: anything malformed, too long or duplicated is dropped.
import { TEMPLATE_IDS, type AiContext, type AiQuestion, type AiQuiz, type Gender, type TemplateId } from "./types";

export const AI_MAX_QUESTIONS = 30;

export interface AiTurn {
  reply: string;
  quiz: AiQuiz | null;
}

/** Parses and cleans the model's JSON. Anything malformed is dropped, never trusted. */
export function parseTurn(text: string, ctx: AiContext | null): AiTurn | null {
  let raw: { reply?: unknown; done?: unknown; quiz?: unknown };
  try {
    raw = JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    return null;
  }
  const reply = typeof raw.reply === "string" ? raw.reply.slice(0, 2000) : "";
  const quiz = raw.done ? cleanQuiz(raw.quiz, ctx) : null;
  if (!reply && !quiz) return null;
  return { reply, quiz };
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

function cleanQuestion(q: unknown): AiQuestion | null {
  const r = q as { text?: unknown; options?: unknown } | null;
  const text = str(r?.text, 300);
  const options = Array.isArray(r?.options)
    ? [...new Set(r.options.map((o) => str(o, 80)).filter(Boolean))].slice(0, 4)
    : [];
  return text && options.length >= 2 ? { text, options } : null;
}

function cleanQuiz(q: unknown, ctx: AiContext | null): AiQuiz | null {
  const r = (q ?? {}) as Record<string, unknown>;
  const seen = new Set(ctx?.existing ?? []);
  const questions: AiQuestion[] = [];
  for (const item of Array.isArray(r.questions) ? r.questions : []) {
    const c = cleanQuestion(item);
    if (c && !seen.has(c.text)) {
      seen.add(c.text);
      questions.push(c);
    }
    if (questions.length >= AI_MAX_QUESTIONS) break;
  }
  if (questions.length === 0) return null;
  const tpl = TEMPLATE_IDS.includes(r.template as TemplateId) ? (r.template as TemplateId) : "party";
  const gender = (["female", "male", "plural"].includes(r.gender as string) ? r.gender : "female") as Gender;
  return {
    template: ctx?.template ?? tpl,
    locale: ctx?.locale ?? (r.locale === "en" ? "en" : "he"),
    starName: ctx?.starName ?? (str(r.starName, 60) || "⭐"),
    gender: ctx?.gender ?? gender,
    title: str(r.title, 120),
    practice: cleanQuestion(r.practice),
    questions,
  };
}

