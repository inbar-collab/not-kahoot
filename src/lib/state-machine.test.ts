import { describe, expect, it } from "vitest";
import { allowedActions, planTransition, type MachineContext, type RoundStatus } from "./state-machine";

const r = (opened = false, revealed = false, birthdayLocked = false): RoundStatus => ({ opened, revealed, birthdayLocked });
const ctx = (over: Partial<MachineContext>): MachineContext => ({
  state: "LOBBY",
  currentIndex: -1,
  rounds: [],
  leaderboardEvery: 0,
  plannedRoundCount: 3,
  ...over,
});

describe("state machine", () => {
  it("starts only from the lobby and only with questions", () => {
    expect(planTransition(ctx({}), "start")).toMatchObject({ ok: true, plan: { state: "INTRO", index: 0 } });
    expect(planTransition(ctx({ plannedRoundCount: 0 }), "start")).toEqual({ ok: false, error: "no_questions" });
    expect(planTransition(ctx({ state: "INTRO", currentIndex: 0, rounds: [r()] }), "start").ok).toBe(false);
  });

  it("closing waits for the birthday person when she has not answered", () => {
    const open = ctx({ state: "QUESTION_OPEN", currentIndex: 0, rounds: [r(true)] });
    expect(planTransition(open, "close")).toMatchObject({ ok: true, plan: { state: "WAITING_FOR_BIRTHDAY" } });
    const locked = ctx({ state: "QUESTION_OPEN", currentIndex: 0, rounds: [r(true, false, true)] });
    expect(planTransition(locked, "close")).toMatchObject({ ok: true, plan: { state: "QUESTION_CLOSED", roundEffect: "close" } });
  });

  it("cannot reveal before the birthday answer exists", () => {
    const waiting = ctx({ state: "WAITING_FOR_BIRTHDAY", currentIndex: 0, rounds: [r(true)] });
    expect(planTransition(waiting, "reveal")).toEqual({ ok: false, error: "waiting_for_birthday" });
    expect(allowedActions(waiting).has("reveal")).toBe(false);
  });

  it("next goes to the leaderboard when due, then on, then to the finale", () => {
    const rounds = [r(true, true, true), r(true, true, true), r()];
    const res = ctx({ state: "RESULTS", currentIndex: 1, rounds, leaderboardEvery: 2 });
    expect(planTransition(res, "next")).toMatchObject({ ok: true, plan: { state: "LEADERBOARD", index: 1 } });
    const lb = ctx({ state: "LEADERBOARD", currentIndex: 1, rounds, leaderboardEvery: 2 });
    expect(planTransition(lb, "next")).toMatchObject({ ok: true, plan: { state: "QUESTION_OPEN", index: 2, roundEffect: "open" } });
    const last = ctx({ state: "RESULTS", currentIndex: 2, rounds: [r(true, true, true), r(true, true, true), r(true, true, true)], leaderboardEvery: 1 });
    expect(planTransition(last, "next")).toMatchObject({ ok: true, plan: { state: "FINISHED" } });
  });

  it("cannot move on while voting is open", () => {
    const open = ctx({ state: "QUESTION_OPEN", currentIndex: 0, rounds: [r(true), r()] });
    expect(planTransition(open, "next").ok).toBe(false);
    expect(planTransition(open, "prev").ok).toBe(false);
  });

  it("previous returns to the earlier question without re-opening it", () => {
    const c = ctx({ state: "RESULTS", currentIndex: 1, rounds: [r(true, true, true), r(true, true, true)] });
    expect(planTransition(c, "prev")).toMatchObject({ ok: true, plan: { state: "RESULTS", index: 0, roundEffect: null } });
  });

  it("revealed rounds cannot be re-opened", () => {
    const c = ctx({ state: "RESULTS", currentIndex: 0, rounds: [r(true, true, true)] });
    expect(planTransition(c, "open")).toEqual({ ok: false, error: "already_revealed" });
  });

  it("the practice question does not count toward the leaderboard rhythm", () => {
    const pr: RoundStatus = { ...r(true, true, true), practice: true };
    const rounds = [pr, r(true, true, true), r(true, true, true), r()];
    const afterPractice = ctx({ state: "RESULTS", currentIndex: 0, rounds: [pr, r(), r()], leaderboardEvery: 1 });
    expect(planTransition(afterPractice, "next")).toMatchObject({ ok: true, plan: { state: "QUESTION_OPEN", index: 1 } });
    const afterTwo = ctx({ state: "RESULTS", currentIndex: 2, rounds, leaderboardEvery: 2 });
    expect(planTransition(afterTwo, "next")).toMatchObject({ ok: true, plan: { state: "LEADERBOARD", index: 2 } });
    const afterOne = ctx({ state: "RESULTS", currentIndex: 1, rounds: [pr, r(true, true, true), r(), r()], leaderboardEvery: 2 });
    expect(planTransition(afterOne, "next")).toMatchObject({ ok: true, plan: { state: "QUESTION_OPEN", index: 2 } });
  });
});
