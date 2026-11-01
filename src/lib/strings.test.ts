import { describe, expect, it } from "vitest";
import { getStrings } from "./strings";

describe("streak badge text", () => {
  it("shows the fire badge followed by the current streak length", () => {
    for (const gender of ["female", "male"] as const) {
      const s = getStrings(gender);
      expect(s.streak(3).startsWith("🔥 3")).toBe(true);
      expect(s.streak(4).startsWith("🔥 4")).toBe(true);
      expect(s.streak(12).startsWith("🔥 12")).toBe(true);
    }
  });
});
