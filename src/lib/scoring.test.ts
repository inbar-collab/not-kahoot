import { describe, expect, it } from "vitest";
import { computeReveal, computeStandings, denseRanks, podiumGroups } from "./scoring";
import type { PublicPlayer } from "./types";

const p = (id: string): PublicPlayer => ({ id, name: id, emoji: null, avatarUrl: null, isFake: false });

describe("scoring", () => {
  const players = [p("a"), p("b"), p("c")];
  const rounds = [
    { id: "r1", index: 0, revealed: true, birthdayChoices: [0, 2], optionCount: 4 },
    { id: "r2", index: 1, revealed: true, birthdayChoices: [1], optionCount: 2 },
    { id: "r3", index: 2, revealed: false, birthdayChoices: [0], optionCount: 2 },
  ];
  const answers = [
    { roundId: "r1", playerId: "a", choice: 2 }, // correct (multi-answer)
    { roundId: "r1", playerId: "b", choice: 0 }, // correct
    { roundId: "r1", playerId: "c", choice: 3 },
    { roundId: "r2", playerId: "a", choice: 1 }, // correct
    { roundId: "r2", playerId: "b", choice: 0 },
    { roundId: "r3", playerId: "c", choice: 0 }, // not revealed: does not count yet
  ];

  it("gives +1 for matching any of her answers, only for revealed rounds", () => {
    const s = computeStandings(players, rounds, answers);
    expect(s.map((x) => [x.player.id, x.score, x.rank])).toEqual([
      ["a", 2, 1],
      ["b", 1, 2],
      ["c", 0, 3],
    ]);
    expect(s[0].streak).toBe(2);
    expect(s[0].previousScore).toBe(1);
  });

  it("ties share a place", () => {
    expect(denseRanks([3, 3, 1, 0, 0])).toEqual([1, 1, 2, 3, 3]);
    const s = computeStandings([p("a"), p("b")], [], []);
    expect(podiumGroups(s)[0]).toHaveLength(2);
  });

  it("builds the vote distribution after the reveal only", () => {
    const rev = computeReveal(rounds[0], answers, new Set(["a", "b", "c"]))!;
    expect(rev.distribution).toEqual([1, 0, 1, 1]);
    expect(rev.correctCount).toBe(2);
    expect(computeReveal(rounds[2], answers, new Set(["a", "b", "c"]))).toBeNull();
  });
});
