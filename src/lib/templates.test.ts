import { describe, expect, it } from "vitest";
import { getStrings } from "./strings";
import { inflect, seedText, STARTER_COUNT, TEMPLATES } from "./templates";
import { TEMPLATE_IDS, type Gender, type Locale } from "./types";

const GENDERS: Gender[] = ["female", "male", "plural"];
const LOCALES: Locale[] = ["he", "en"];

describe("templates", () => {
  it("inflects names and she / he / they forms", () => {
    expect(inflect("מה {name} {אוהבת|אוהב|אוהבים}?", "female", "סיגל")).toBe("מה סיגל אוהבת?");
    expect(inflect("מה {name} {אוהבת|אוהב|אוהבים}?", "plural", "דנה ויואב")).toBe("מה דנה ויואב אוהבים?");
    expect(inflect("What {does|does|do} {name} want when {she grows|he grows|they grow} up?", "male", "Max")).toBe(
      "What does Max want when he grows up?",
    );
  });

  it("every template has a valid practice question and enough starter questions in both languages", () => {
    for (const id of TEMPLATE_IDS) {
      const t = TEMPLATES[id];
      expect(t.questions.length).toBeGreaterThanOrEqual(STARTER_COUNT);
      for (const seed of [t.practice, ...t.questions]) {
        for (const locale of LOCALES) {
          for (const g of GENDERS) {
            const q = seedText(seed, locale, g, "Alex");
            expect(q.text).not.toMatch(/[{}|]/);
            expect([...q.text].length).toBeLessThanOrEqual(300);
            expect(q.options.length).toBeGreaterThanOrEqual(2);
            expect(q.options.length).toBeLessThanOrEqual(4);
            for (const o of q.options) {
              expect(o).not.toMatch(/[{}|]/);
              expect([...o].length).toBeLessThanOrEqual(80);
              expect(o.trim()).not.toBe("");
            }
          }
        }
      }
      for (const locale of LOCALES) {
        for (const g of GENDERS) expect(inflect(t.title[locale], g, "Alex")).not.toMatch(/[{}|]/);
      }
    }
  });

  it("English and Hebrew strings have the same keys", () => {
    const he = Object.keys(getStrings({ locale: "he" })).sort();
    const en = Object.keys(getStrings({ locale: "en" })).sort();
    expect(en).toEqual(he);
  });
});
