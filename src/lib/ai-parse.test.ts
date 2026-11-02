import { describe, expect, it } from "vitest";
import { parseTurn } from "./ai-parse";

describe("AI builder output", () => {
  it("keeps a follow-up question while interviewing", () => {
    expect(parseTurn('{"reply":"Who is it for?","done":false}', null)).toEqual({ reply: "Who is it for?", quiz: null });
  });

  it("cleans a finished quiz: trims, dedupes, drops bad questions, caps at 30", () => {
    const questions = [
      { text: "  Favorite   color? ", options: ["Red", "Blue", "Blue", ""] },
      { text: "Only one option", options: ["Yes"] },
      { text: "Favorite   color?", options: ["A", "B"] },
      ...Array.from({ length: 40 }, (_, i) => ({ text: `Q${i}`, options: ["a", "b", "c", "d", "e"] })),
    ];
    const t = parseTurn(
      "```json\n" +
        JSON.stringify({ reply: "Ready!", done: true, quiz: { template: "nope", locale: "en", starName: "Sam", gender: "x", title: "T", questions } }) +
        "\n```",
      null,
    )!;
    expect(t.quiz!.questions[0]).toEqual({ text: "Favorite color?", options: ["Red", "Blue"] });
    expect(t.quiz!.questions).toHaveLength(30);
    expect(t.quiz!.questions.every((q) => q.options.length >= 2 && q.options.length <= 4)).toBe(true);
    expect(t.quiz!.template).toBe("party");
    expect(t.quiz!.gender).toBe("female");
  });

  it("uses the existing quiz's settings and skips questions it already has", () => {
    const ctx = { template: "wedding" as const, locale: "he" as const, starName: "דנה ויואב", gender: "plural" as const, existing: ["Old?"] };
    const t = parseTurn(JSON.stringify({ reply: "x", done: true, quiz: { template: "kids", locale: "en", starName: "Z", gender: "male", title: "", questions: [{ text: "Old?", options: ["a", "b"] }, { text: "New?", options: ["a", "b"] }] } }), ctx)!;
    expect(t.quiz!.questions.map((q) => q.text)).toEqual(["New?"]);
    expect([t.quiz!.template, t.quiz!.locale, t.quiz!.starName, t.quiz!.gender]).toEqual(["wedding", "he", "דנה ויואב", "plural"]);
  });

  it("rejects garbage", () => {
    expect(parseTurn("not json", null)).toBeNull();
    expect(parseTurn('{"done":true,"quiz":{"questions":[]}}', null)).toBeNull();
  });
});

describe("AI builder output (wrapped)", () => {
  it("finds the JSON object even when the model adds a sentence around it", () => {
    expect(parseTurn('Sure! {"reply":"Who is the star?","done":false} Hope that helps', null)?.reply).toBe("Who is the star?");
  });
});
