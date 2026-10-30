import "server-only";
import { planTransition, type MachineContext } from "@/lib/state-machine";
import type { ControlAction } from "@/lib/types";
import { ApiError } from "./http";
import { rpcStatus } from "./players";
import type { GameRow, LibraryPhotoRow, QuestionRow, RoundRow } from "./rows";
import { buildRounds, plannedRoundCount } from "./rounds";
import { db } from "./supabase-admin";

async function fetchContext(game: GameRow) {
  const [rounds, questions, library] = await Promise.all([
    db().from("rounds").select("*").eq("game_id", game.id).order("round_index"),
    db().from("questions").select("*").eq("game_id", game.id).order("position").order("created_at"),
    db().from("library_photos").select("*").eq("game_id", game.id),
  ]);
  for (const r of [rounds, questions, library]) if (r.error) throw r.error;
  return {
    rounds: rounds.data as RoundRow[],
    questions: questions.data as QuestionRow[],
    library: library.data as LibraryPhotoRow[],
  };
}

export function machineContext(game: GameRow, rounds: RoundRow[], questions: QuestionRow[]): MachineContext {
  return {
    state: game.state,
    currentIndex: game.current_index,
    rounds: game.state === "LOBBY" ? [] : rounds.map((r) => ({
      opened: !!r.opened_at,
      revealed: !!r.revealed_at,
      birthdayLocked: !!r.birthday_locked_at,
      practice: r.is_practice,
    })),
    leaderboardEvery: game.leaderboard_every,
    plannedRoundCount: plannedRoundCount(game, questions),
  };
}

/**
 * Runs one host action. The state machine validates it against the current
 * database state; the SQL function applies it atomically with a version
 * check, so double-clicks or two admin phones can never skip a step.
 */
export async function runControl(gameId: string, action: ControlAction): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: g, error } = await db().from("games").select("*").eq("id", gameId).single();
    if (error) throw error;
    const game = g as GameRow;
    const { rounds, questions, library } = await fetchContext(game);

    if (action === "reset") {
      const { data, error: e } = await db().rpc("reset_game", { p_game_id: game.id });
      if (e) throw e;
      return rpcStatus(data);
    }

    const result = planTransition(machineContext(game, rounds, questions), action);
    if (!result.ok) throw new ApiError(result.error, 409);
    const plan = result.plan;

    let status: unknown;
    if (action === "start") {
      const seeds = buildRounds(game, questions, library);
      const { data, error: e } = await db().rpc("start_game", {
        p_game_id: game.id,
        p_expected_version: game.version,
        p_rounds: seeds,
      });
      if (e) throw e;
      status = data;
    } else {
      const { data, error: e } = await db().rpc("apply_transition", {
        p_game_id: game.id,
        p_expected_version: game.version,
        p_state: plan.state,
        p_index: plan.index,
        p_round_index: plan.roundIndex,
        p_round_effect: plan.roundEffect,
      });
      if (e) throw e;
      status = data;
    }
    if (status === "conflict") continue; // someone else changed the game; re-plan
    return rpcStatus(status);
  }
  throw new ApiError("conflict", 409);
}

/** Deletes guests' answers for the current question (only before its reveal). */
export async function deleteCurrentAnswers(game: GameRow) {
  const { data: r, error } = await db()
    .from("rounds")
    .select("id, revealed_at")
    .eq("game_id", game.id)
    .eq("round_index", game.current_index)
    .maybeSingle();
  if (error) throw error;
  if (!r) throw new ApiError("invalid_transition", 409);
  if (r.revealed_at) throw new ApiError("already_revealed", 409);
  const { error: e } = await db().from("answers").delete().eq("round_id", r.id);
  if (e) throw e;
}

export async function birthdayLock(gameId: string, roundId: string, choices: number[]) {
  const { data, error } = await db().rpc("birthday_lock", {
    p_game_id: gameId,
    p_round_id: roundId,
    p_choices: choices,
  });
  if (error) throw error;
  rpcStatus(data);
}
