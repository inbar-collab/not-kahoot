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

const MODEL = () => process.env.GEMINI_MODEL || "gemini-flash-latest";

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

export async function aiTurn(messages: AiMessage[], ctx: AiContext | null): Promise<AiTurn> {
  if (process.env.AI_MOCK === "1" && process.env.NODE_ENV !== "production") return mockTurn(messages, ctx);
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ApiError("ai_not_configured", 503);

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL()}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM + contextNote(ctx) }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
      generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0.9 },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(55_000),
  }).catch(() => null);

  if (!res) throw new ApiError("ai_failed", 502);
  if (res.status === 429) throw new ApiError("ai_limit", 429); // Google's free-tier quota
  if (!res.ok) {
    console.warn("[ai] gemini error", res.status, (await res.text()).slice(0, 400));
    throw new ApiError("ai_failed", 502);
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const turn = parseTurn(text, ctx);
  if (!turn) {
    console.warn("[ai] unusable reply", text.slice(0, 400));
    throw new ApiError("ai_failed", 502);
  }
  return turn;
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
