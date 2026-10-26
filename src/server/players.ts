import "server-only";
import { ApiError } from "./http";
import { storeImage } from "./images";
import type { GameRow, PlayerRow } from "./rows";
import { db } from "./supabase-admin";
import { hashToken, newSecret } from "./tokens";

export function cleanName(raw: unknown): string {
  if (typeof raw !== "string") throw new ApiError("name_required");
  const name = raw.normalize("NFC").replace(/\s+/g, " ").trim();
  if (!name) throw new ApiError("name_required");
  if ([...name].length > 24) throw new ApiError("name_too_long");
  return name;
}

export function nameKey(name: string): string {
  return name.normalize("NFKC").toLocaleLowerCase("he").replace(/\s+/g, " ").trim();
}

function cleanEmoji(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim();
  return e && [...e].length <= 8 ? e : null;
}

export async function joinGame(
  game: GameRow,
  input: { name: unknown; emoji: unknown; avatar: unknown; isFake?: boolean },
): Promise<{ player: PlayerRow; token: string }> {
  if (game.state === "FINISHED") throw new ApiError("game_finished", 409);
  if (game.state !== "LOBBY" && !game.allow_late_join && !input.isFake) {
    throw new ApiError("late_join_closed", 409);
  }
  const name = cleanName(input.name);
  const key = nameKey(name);

  // Friendly early check (the unique index is the real guarantee).
  const { data: clash } = await db()
    .from("players")
    .select("id")
    .eq("game_id", game.id)
    .eq("name_key", key)
    .is("kicked_at", null)
    .maybeSingle();
  if (clash) throw new ApiError("name_taken", 409);

  const avatarPath =
    input.avatar instanceof Blob && input.avatar.size > 0 ? await storeImage(game.id, "avatar", input.avatar) : null;

  const token = newSecret();
  const { data, error } = await db()
    .from("players")
    .insert({
      game_id: game.id,
      name,
      name_key: key,
      token_hash: hashToken(token),
      avatar_emoji: avatarPath ? null : cleanEmoji(input.emoji),
      avatar_path: avatarPath,
      is_fake: !!input.isFake,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw new ApiError("name_taken", 409);
    throw error;
  }
  return { player: data as PlayerRow, token };
}

/** Finds the player that owns this token, including kicked ones. */
export async function findPlayerByToken(gameId: string, token: string): Promise<PlayerRow | null> {
  if (!token) return null;
  const { data, error } = await db()
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (error) throw error;
  return (data as PlayerRow) ?? null;
}

const RPC_ERRORS = new Set([
  "game_not_found",
  "player_not_found",
  "player_kicked",
  "voting_closed",
  "not_current_round",
  "invalid_choice",
  "already_answered",
  "already_locked",
  "not_accepting",
  "invalid_transition",
  "waiting_for_birthday",
  "no_questions",
  "conflict",
  "already_revealed",
]);

/** Turns a status string returned by one of the SQL functions into an ApiError. */
export function rpcStatus(status: unknown) {
  if (status === "ok") return;
  if (typeof status === "string" && RPC_ERRORS.has(status)) {
    throw new ApiError(status as ConstructorParameters<typeof ApiError>[0], 409);
  }
  throw new Error(`Unexpected RPC status: ${String(status)}`);
}

export async function submitAnswer(gameId: string, playerId: string, roundId: string, choice: number) {
  const { data, error } = await db().rpc("submit_answer", {
    p_game_id: gameId,
    p_player_id: playerId,
    p_round_id: roundId,
    p_choice: choice,
  });
  if (error) throw error;
  rpcStatus(data);
}

export async function kickPlayer(gameId: string, playerId: string) {
  const { error } = await db()
    .from("players")
    .update({ kicked_at: new Date().toISOString() })
    .eq("game_id", gameId)
    .eq("id", playerId)
    .is("kicked_at", null);
  if (error) throw error;
}

export async function removeAllPlayers(gameId: string, onlyFake = false) {
  let q = db().from("players").delete().eq("game_id", gameId);
  if (onlyFake) q = q.eq("is_fake", true);
  const { error } = await q;
  if (error) throw error;
}
