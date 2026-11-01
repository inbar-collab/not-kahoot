import { describe, expect, it } from "vitest";
import { BOM, buildResultsCsv, csvField, resultsCsvFilename, type CsvRound } from "./results-csv";
import type { PublicPlayer } from "./types";

const p = (id: string, name = id): PublicPlayer => ({ id, name, emoji: null, avatarUrl: null, isFake: false });
const round = (id: string, index: number, extra: Partial<CsvRound> = {}): CsvRound => ({
  id,
  index,
  text: `שאלה ${id}`,
  revealed: true,
  birthdayChoices: [0],
  optionCount: 4,
  ...extra,
});
const lines = (csv: string) => csv.slice(BOM.length).trimEnd().split("\r\n");

describe("buildResultsCsv", () => {
  const players = [p("a", "דנה"), p("b", "יוסי"), p("c", "רותי")];
  const rounds = [
    round("pr", 0, { practice: true }), // practice: never a column
    round("r1", 1, { birthdayChoices: [0, 2] }),
    round("r2", 2, { birthdayChoices: [1] }),
    round("r3", 3, { revealed: false }), // not revealed yet: not a column
  ];
  const answers = [
    { roundId: "pr", playerId: "a", choice: 0 },
    { roundId: "r1", playerId: "a", choice: 2 },
    { roundId: "r1", playerId: "b", choice: 3 },
    { roundId: "r2", playerId: "a", choice: 1 },
    { roundId: "r2", playerId: "b", choice: 1 },
    // c answered nothing
    { roundId: "r3", playerId: "c", choice: 0 },
  ];

  it("starts with a UTF-8 BOM and uses CRLF line endings", () => {
    const csv = buildResultsCsv({ players, rounds, answers });
    expect(csv.startsWith(BOM)).toBe(true);
    expect(Buffer.from(csv, "utf8").subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("has rank, name, score, then one ✓/✗/empty column per scored question", () => {
    const csv = buildResultsCsv({ players, rounds, answers });
    expect(lines(csv)).toEqual([
      "מקום,שם,ניקוד,1. שאלה r1,2. שאלה r2",
      "1,דנה,2,✓,✓",
      "2,יוסי,1,✗,✓",
      "3,רותי,0,,",
    ]);
  });

  it("ignores answers from players not in the list (kicked)", () => {
    const csv = buildResultsCsv({
      players: [p("a", "דנה")],
      rounds,
      answers: [...answers, { roundId: "r1", playerId: "kicked", choice: 0 }],
    });
    expect(lines(csv)).toEqual(["מקום,שם,ניקוד,1. שאלה r1,2. שאלה r2", "1,דנה,2,✓,✓"]);
  });

  it("ties share a rank", () => {
    const csv = buildResultsCsv({
      players: [p("a"), p("b")],
      rounds: [round("r1", 0)],
      answers: [
        { roundId: "r1", playerId: "a", choice: 0 },
        { roundId: "r1", playerId: "b", choice: 0 },
      ],
    });
    expect(lines(csv).slice(1)).toEqual(["1,a,1,✓", "1,b,1,✓"]);
  });

  it("works with no players and no rounds", () => {
    expect(lines(buildResultsCsv({ players: [], rounds: [], answers: [] }))).toEqual(["מקום,שם,ניקוד"]);
  });

  it("escapes names and question text", () => {
    const csv = buildResultsCsv({
      players: [p("a", 'דנה "הגדולה", כהן'), p("b", "=HYPERLINK(1)")],
      rounds: [round("r1", 0, { text: "מה?\nבאמת" })],
      answers: [],
    });
    const body = csv.slice(BOM.length);
    expect(body).toContain('"1. מה?\nבאמת"');
    expect(body).toContain('"דנה ""הגדולה"", כהן"');
    expect(body).toContain("'=HYPERLINK(1)");
  });
});

describe("csvField", () => {
  it("leaves plain values alone", () => {
    expect(csvField("שלום")).toBe("שלום");
    expect(csvField(3)).toBe("3");
    expect(csvField("")).toBe("");
  });
  it("guards formula-like strings", () => {
    expect(csvField("+972")).toBe("'+972");
    expect(csvField("@x")).toBe("'@x");
    expect(csvField("-1")).toBe("'-1");
  });
});

describe("resultsCsvFilename", () => {
  it("includes the game code", () => {
    expect(resultsCsvFilename("ABC234")).toBe("not-kahoot-ABC234-results.csv");
    expect(resultsCsvFilename('AB"C/..')).toBe("not-kahoot-ABC-results.csv");
  });
});
