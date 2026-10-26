import "server-only";
// Test mode: fake players that answer randomly, so the host can rehearse
// the whole game alone.
import { randomInt } from "node:crypto";
import { AVATAR_EMOJIS, FAKE_NAMES } from "@/lib/strings";
import { ApiError } from "./http";
import { birthdayLock } from "./control";
import { joinGame, removeAllPlayers, submitAnswer } from "./players";
import type { GameRow, PlayerRow, RoundRow } from "./rows";
import { shuffle } from "./rounds";
import { db } from "./supabase-admin";

export async function createFakePlayers(game: GameRow, count: number) {
  const n = Math.max(1, Math.min(10, count));
  const { data } = await db().from("players").select("name").eq("game_id", game.id).is("kicked_at", null);
  const taken = new Set((data ?? []).map((p) => p.name as string));
  const names = shuffle(FAKE_NAMES).filter((x) => !taken.has(x));
  const emojis = shuffle(AVATAR_EMOJIS);
  let made = 0;
  for (let k = 0; made < n && k < names.length + n; k++) {
    const name = names[k] ?? `בדיקה ${randomInt(100, 999)}`;
    try {
      await joinGame(game, { name, emoji: emojis[k % emojis.length], avatar: null, isFake: true });
      made++;
    } catch (e) {
      if (!(e instanceof ApiError && e.code === "name_taken")) throw e;
    }
  }
}

async function currentRound(game: GameRow): Promise<RoundRow> {
  const { data, error } = await db()
    .from("rounds")
    .select("*")
    .eq("game_id", game.id)
    .eq("round_index", game.current_index)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError("invalid_transition", 409);
  return data as RoundRow;
}

export async function fakePlayersAnswer(game: GameRow) {
  if (game.state !== "QUESTION_OPEN") throw new ApiError("voting_closed", 409);
  const round = await currentRound(game);
  const [{ data: fakes }, { data: answered }] = await Promise.all([
    db().from("players").select("*").eq("game_id", game.id).eq("is_fake", true).is("kicked_at", null),
    db().from("answers").select("player_id").eq("round_id", round.id),
  ]);
  const done = new Set((answered ?? []).map((a) => a.player_id as string));
  for (const p of (fakes ?? []) as PlayerRow[]) {
    if (done.has(p.id)) continue;
    try {
      await submitAnswer(game.id, p.id, round.id, randomInt(round.options.length));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
    }
  }
}

export async function randomBirthdayAnswer(game: GameRow) {
  const round = await currentRound(game);
  const n = round.options.length;
  const choices = [randomInt(n)];
  if (n > 2 && randomInt(4) === 0) choices.push((choices[0] + 1) % n); // sometimes two answers
  await birthdayLock(game.id, round.id, choices);
}

export async function removeFakePlayers(game: GameRow) {
  await removeAllPlayers(game.id, true);
}
