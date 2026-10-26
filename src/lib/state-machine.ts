// The game's state machine. Pure functions only: the server uses it to
// validate and plan every transition, the admin page uses it to decide which
// buttons are enabled. The database applies the plan atomically.

import type { ControlAction, GameState } from "./types";

export interface RoundStatus {
  opened: boolean;
  revealed: boolean;
  birthdayLocked: boolean;
}

export interface MachineContext {
  state: GameState;
  currentIndex: number;
  /** Rounds that exist (after start) — one entry per round, in order. */
  rounds: RoundStatus[];
  leaderboardEvery: number;
  /** Active questions available for a new game (only matters in LOBBY). */
  plannedRoundCount: number;
}

export type RoundEffect = "open" | "close" | "reveal";

export interface TransitionPlan {
  state: GameState;
  index: number;
  roundIndex: number | null;
  roundEffect: RoundEffect | null;
}

export type PlanResult =
  | { ok: true; plan: TransitionPlan }
  | { ok: false; error: "invalid_transition" | "waiting_for_birthday" | "no_questions" | "already_revealed" };

const fail = (error: Extract<PlanResult, { ok: false }>["error"]): PlanResult => ({ ok: false, error });
const go = (
  state: GameState,
  index: number,
  roundIndex: number | null = null,
  roundEffect: RoundEffect | null = null,
): PlanResult => ({ ok: true, plan: { state, index, roundIndex, roundEffect } });

/** Where landing on round `i` takes you, depending on how far it got before. */
function enterRound(ctx: MachineContext, i: number): PlanResult {
  const r = ctx.rounds[i];
  if (!r) return fail("invalid_transition");
  if (r.revealed) return go("RESULTS", i);
  if (r.opened) return go(r.birthdayLocked ? "QUESTION_CLOSED" : "WAITING_FOR_BIRTHDAY", i);
  return go("QUESTION_OPEN", i, i, "open");
}

export function isLeaderboardDue(ctx: MachineContext): boolean {
  const total = ctx.rounds.length;
  const i = ctx.currentIndex;
  return ctx.leaderboardEvery > 0 && i < total - 1 && (i + 1) % ctx.leaderboardEvery === 0;
}

export function planTransition(ctx: MachineContext, action: ControlAction): PlanResult {
  const { state, currentIndex: i } = ctx;
  const total = ctx.rounds.length;
  const round = ctx.rounds[i];

  switch (action) {
    case "start":
      if (state !== "LOBBY") return fail("invalid_transition");
      if (ctx.plannedRoundCount < 1) return fail("no_questions");
      return go("INTRO", 0);

    case "open":
      if (!round) return fail("invalid_transition");
      if (round.revealed) return fail("already_revealed");
      if (state === "INTRO" || state === "QUESTION_CLOSED" || state === "WAITING_FOR_BIRTHDAY") {
        return go("QUESTION_OPEN", i, i, "open");
      }
      return fail("invalid_transition");

    case "close":
      if (state !== "QUESTION_OPEN" || !round) return fail("invalid_transition");
      return go(round.birthdayLocked ? "QUESTION_CLOSED" : "WAITING_FOR_BIRTHDAY", i, i, "close");

    case "reveal":
      if (!round) return fail("invalid_transition");
      if (state !== "QUESTION_CLOSED" && state !== "WAITING_FOR_BIRTHDAY" && state !== "QUESTION_OPEN") {
        return fail("invalid_transition");
      }
      if (!round.birthdayLocked) return fail("waiting_for_birthday");
      return go("REVEAL", i, i, "reveal");

    case "results":
      if (!round?.revealed) return fail("invalid_transition");
      if (state === "REVEAL" || state === "LEADERBOARD") return go("RESULTS", i);
      return fail("invalid_transition");

    case "leaderboard":
      if (state === "REVEAL" || state === "RESULTS") return go("LEADERBOARD", i);
      return fail("invalid_transition");

    case "next":
      if (state === "INTRO") return enterRound(ctx, i);
      if (state === "REVEAL" || state === "RESULTS") {
        if (isLeaderboardDue(ctx)) return go("LEADERBOARD", i);
        return i >= total - 1 ? go("FINISHED", i) : enterRound(ctx, i + 1);
      }
      if (state === "LEADERBOARD" || state === "QUESTION_CLOSED" || state === "WAITING_FOR_BIRTHDAY") {
        return i >= total - 1 ? go("FINISHED", i) : enterRound(ctx, i + 1);
      }
      return fail("invalid_transition");

    case "prev":
      // From the leaderboard or the finale, step back to the current question.
      if (state === "LEADERBOARD" || state === "FINISHED") {
        if (total === 0) return fail("invalid_transition");
        return enterRoundNoOpen(ctx, i);
      }
      if (
        state === "INTRO" ||
        state === "LOBBY" ||
        state === "QUESTION_OPEN" ||
        i <= 0
      ) {
        return fail("invalid_transition");
      }
      return enterRoundNoOpen(ctx, i - 1);

    case "end":
      if (state === "FINISHED") return fail("invalid_transition");
      if (state === "QUESTION_OPEN") return go("FINISHED", i, i, "close");
      return go("FINISHED", Math.max(i, 0));

    case "reset":
      return go("LOBBY", -1);
  }
}

/** Going back never re-opens voting by itself; the host can press "Open". */
function enterRoundNoOpen(ctx: MachineContext, i: number): PlanResult {
  const r = ctx.rounds[i];
  if (!r) return fail("invalid_transition");
  if (r.revealed) return go("RESULTS", i);
  return go(r.birthdayLocked ? "QUESTION_CLOSED" : "WAITING_FOR_BIRTHDAY", i);
}

export function allowedActions(ctx: MachineContext): Set<ControlAction> {
  const out = new Set<ControlAction>();
  for (const a of ["start", "open", "close", "reveal", "results", "leaderboard", "next", "prev", "end", "reset"] as const) {
    if (planTransition(ctx, a).ok) out.add(a);
  }
  return out;
}

/** The single most likely next step, used for the big button on the admin page. */
export function suggestedAction(ctx: MachineContext): ControlAction | null {
  switch (ctx.state) {
    case "LOBBY":
      return "start";
    case "INTRO":
      return "open";
    case "QUESTION_OPEN":
      return "close";
    case "WAITING_FOR_BIRTHDAY":
    case "QUESTION_CLOSED":
      return "reveal";
    case "REVEAL":
      return "results";
    case "RESULTS":
    case "LEADERBOARD":
      return "next";
    case "FINISHED":
      return null;
  }
}

/** True when the given state shows the current round's question. */
export function isRoundState(state: GameState): boolean {
  return (
    state === "QUESTION_OPEN" ||
    state === "QUESTION_CLOSED" ||
    state === "WAITING_FOR_BIRTHDAY" ||
    state === "REVEAL" ||
    state === "RESULTS"
  );
}
