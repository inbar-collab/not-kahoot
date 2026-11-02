import "server-only";
// The AI quiz builder. It interviews the host in a short chat, then writes
// the questions. Uses Google's Gemini API (the free tier is enough): set
// GEMINI_API_KEY, optionally GEMINI_MODEL. See README → "AI quiz builder".

import { STARTER_COUNT, seedText, template as templateDef } from "@/lib/templates";
import { parseTurn, type AiTurn } from "@/lib/ai-parse";
import { TEMPLATE_IDS, type AiContext, type AiMessage } from "@/lib/types";
import { ApiError } from "./http";

export { AI_MAX_QUESTIONS } from "@/lib/ai-parse";
export const AI_DAILY_LIMIT = 60; // chat messages per user per day
export const AI_MAX_TURNS = 24;

const SYSTEM = `You are the friendly quiz-builder assistant of "Event Quiz", a party game.

HOW THE GAME WORKS: a quiz is about one "star" (the birthday person, the couple, the kid...). For every question the star secretly picks their answer on their phone, and all the guests try to guess what the star picked. So questions must be about the star: tastes, habits, memories, personality, funny everyday situations - things guests can guess but not know for sure. Each question has 2 to 4 short answer options.

YOUR JOB: have a short, warm conversation to learn what you need, then write the quiz.
Find out (at most 2 short questions per message, about 4 messages in total; never ask about something you already know):
- the occasion (birthday, kid's birthday, wedding, bar/bat mitzvah, baby shower, anniversary, other party)
- who the star is: their name(s), and whether to refer to them as she, he, or they (a couple or group)
- the audience (family, friends, coworkers, kids, mixed ages)
- a few facts or interests about the star that could inspire questions (hobbies, food, quirks, shared memories) - optional
- the tone (funny, sentimental, mixed) and how many questions (default 15, maximum 30)
- the quiz language (Hebrew or English) - default to the language the user writes in.

When you have enough, or the user asks you to just go ahead, set "done" to true and fill "quiz". Quiz rules:
- Write in the quiz language. In Hebrew use correct gendered grammar for the star (female, male, or plural) and refer to the star by name.
- Each question at most 140 characters; each option at most 40 characters; 2-4 distinct, plausible options so guests must think. An emoji in an option is welcome when it adds fun.
- Make questions specific to what the user told you, mixed with good general ones. No embarrassing, intimate, medical, political or hurtful topics. Fit the audience (simple words for kids).
- Also write one easy warm-up "practice" question (it doesn't count) so guests learn how to play.
- "template" is one of: birthday, kids_birthday, kids, wedding, mitzvah, baby_shower, anniversary, party.
- "gender" is "female", "male" or "plural". "locale" is "he" or "en".
"reply" is always a short, friendly message to the user in the language they write in. While interviewing it contains your questions. When done, say the quiz is ready to review.
Answer with the JSON object only.`;

const FORMAT = `

REPLY FORMAT: exactly one JSON object, nothing else:
{"reply": string, "done": boolean, "quiz": null | {"template": string, "locale": "he"|"en", "starName": string, "gender": "female"|"male"|"plural", "title": string, "practice": {"text": string, "options": [string]}, "questions": [{"text": string, "options": [string]}]}}`;

const QUESTION_SCHEMA = {
  type: "OBJECT",
  properties: { text: { type: "STRING" }, options: { type: "ARRAY", items: { type: "STRING" } } },
  required: ["text", "options"],
};
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    done: { type: "BOOLEAN" },
    quiz: {
      type: "OBJECT",
      nullable: true,
      properties: {
        template: { type: "STRING", enum: [...TEMPLATE_IDS] },
        locale: { type: "STRING", enum: ["he", "en"] },
        starName: { type: "STRING" },
        gender: { type: "STRING", enum: ["female", "male", "plural"] },
        title: { type: "STRING" },
        practice: QUESTION_SCHEMA,
        questions: { type: "ARRAY", items: QUESTION_SCHEMA },
      },
      required: ["template", "locale", "starName", "gender", "title", "questions"],
    },
  },
  required: ["reply", "done"],
};

function contextNote(ctx: AiContext | null): string {
  if (!ctx) return "";
  return `\n\nTHIS QUIZ ALREADY EXISTS. Language: ${ctx.locale}. Template: ${ctx.template}. Star: ${ctx.starName} (${ctx.gender}). Use exactly these values in "quiz" and don't ask about them again; only ask about the audience, topics, tone and number of questions. Do not repeat these existing questions:\n${ctx.existing
    .slice(0, 60)
    .map((q) => `- ${q}`)
    .join("\n")}`;
}

/**
 * Model names to try, in order. If Google doesn't know a name (it retires
 * and renames models), the next one is used. All are free-tier Flash models.
 */
function models(): string[] {
  return [...new Set([process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"].filter(Boolean) as string[])];
}

type GeminiReply = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  error?: { message?: string; status?: string };
};

async function callGemini(key: string, model: string, messages: AiMessage[], ctx: AiContext | null, strict: boolean) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM + FORMAT + contextNote(ctx) }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
      generationConfig: {
        responseMimeType: "application/json",
        ...(strict ? { responseSchema: RESPONSE_SCHEMA } : {}),
        temperature: 0.9,
        maxOutputTokens: 16384,
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(100_000),
  }).catch((e: unknown) => {
    console.error("[ai] request failed", model, e);
    return null;
  });
  if (!res) return { status: 0, data: null as GeminiReply | null };
  const data = (await res.json().catch(() => null)) as GeminiReply | null;
  return { status: res.status, data };
}

export async function aiTurn(messages: AiMessage[], ctx: AiContext | null): Promise<AiTurn> {
  if (process.env.AI_MOCK === "1" && process.env.NODE_ENV !== "production") return mockTurn(messages, ctx);
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ApiError("ai_not_configured", 503);

  let lastProblem = "";
  for (const model of models()) {
    for (const strict of [true, false]) {
      const { status, data } = await callGemini(key, model, messages, ctx, strict);
      const googleSays = data?.error?.message?.slice(0, 160) ?? "";
      if (status === 429) throw new ApiError("ai_limit", 429, "Gemini quota");
      if (status === 0) {
        lastProblem = "no answer from Gemini (timeout or network)";
        break; // a timeout won't get better with another format; try the next model
      }
      if (status === 404) {
        console.error("[ai] model not found", model, googleSays);
        lastProblem = `model ${model} not found`;
        break; // next model
      }
      if (status === 400 && strict) {
        console.error("[ai] request rejected, retrying without schema", model, googleSays);
        lastProblem = `Gemini ${status}: ${googleSays}`;
        continue; // same model, plain JSON mode
      }
      if (status !== 200) {
        console.error("[ai] gemini error", model, status, googleSays);
        // A bad key or a blocked project won't work with any model.
        throw new ApiError("ai_failed", 502, `Gemini ${status}: ${googleSays || data?.error?.status || "error"}`);
      }
      const cand = data?.candidates?.[0];
      const text = cand?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
      const turn = parseTurn(text, ctx);
      if (turn) return turn;
      console.error("[ai] unusable reply", model, cand?.finishReason, text.slice(0, 300));
      lastProblem = `unusable reply (${cand?.finishReason ?? "no candidates"})`;
      if (strict) continue; // try once more without the schema
    }
  }
  throw new ApiError("ai_failed", 502, lastProblem);
}

// --------------------------------------------------------------------- mock
// Local development and tests only (AI_MOCK=1): a scripted two-step chat
// that answers with template questions, so the whole flow works offline.

function mockTurn(messages: AiMessage[], ctx: AiContext | null): AiTurn {
  const users = messages.filter((m) => m.role === "user");
  const he = /[֐-׿]/.test(users.map((m) => m.text).join(" "));
  if (users.length < 2 && !/go ahead|just do it|יאללה/i.test(users.at(-1)?.text ?? "")) {
    return {
      reply: he ? "כיף! למי המסיבה, ואיך קוראים לכוכב/ת? ומי הקהל – משפחה, חברים, ילדים?" : "Fun! Who is the party for, and what's their name? And who's the crowd – family, friends, kids?",
      quiz: null,
    };
  }
  const t = templateDef(ctx?.template ?? "birthday");
  const locale = ctx?.locale ?? (he ? "he" : "en");
  const gender = ctx?.gender ?? "female";
  const name = ctx?.starName ?? (he ? "סיגל" : "Sam");
  const all = [...t.questions].map((q) => seedText(q, locale, gender, name)).filter((q) => !ctx?.existing.includes(q.text));
  return {
    reply: he ? "החידון מוכן! 🎉 עברו על השאלות ובחרו מה להשאיר." : "Your quiz is ready! 🎉 Review the questions and keep the ones you like.",
    quiz: {
      template: t.id,
      locale,
      starName: name,
      gender,
      title: "",
      practice: seedText(t.practice, locale, gender, name),
      questions: all.slice(0, Math.max(STARTER_COUNT, 10)),
    },
  };
}
