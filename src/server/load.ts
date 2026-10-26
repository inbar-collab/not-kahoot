import "server-only";
import { db } from "./supabase-admin";
import { ApiError } from "./http";
import { normalizeCode, safeEqual } from "./tokens";
import type {
  AnswerRow,
  GameRow,
  LibraryPhotoRow,
  PlayerRow,
  QuestionRow,
  RoundRow,
} from "./rows";

export interface GameBundle {
  game: GameRow;
  players: PlayerRow[]; // active (not kicked) players only
  rounds: RoundRow[]; // sorted by round_index
  answers: AnswerRow[];
}

export interface AdminBundle extends GameBundle {
  questions: QuestionRow[]; // sorted by position
  library: LibraryPhotoRow[];
}

const GAME_COLUMNS =
  "id, code, admin_token, birthday_token, title, birthday_name, birthday_gender, birthday_age, birthday_date, birthday_photo_path, num_questions, leaderboard_every, sounds_enabled, allow_late_join, state, current_index, state_changed_at, version";

/** Loads a game and everything needed to render it, in one request. */
export async function loadBundle(rawCode: string): Promise<GameBundle>;
export async function loadBundle(rawCode: string, withContent: true): Promise<AdminBundle>;
export async function loadBundle(rawCode: string, withContent = false): Promise<GameBundle | AdminBundle> {
  const code = normalizeCode(rawCode);
  if (!/^[A-Z0-9]{4,10}$/.test(code)) throw new ApiError("game_not_found", 404);

  const select = withContent
    ? `${GAME_COLUMNS}, players(*), rounds(*), answers(*), questions(*), library_photos(*)`
    : `${GAME_COLUMNS}, players(*), rounds(*), answers(*)`;

  const { data, error } = await db().from("games").select(select).eq("code", code).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError("game_not_found", 404);

  const row = data as unknown as GameRow & {
    players: PlayerRow[];
    rounds: RoundRow[];
    answers: AnswerRow[];
    questions?: QuestionRow[];
    library_photos?: LibraryPhotoRow[];
  };
  const { players, rounds, answers, questions, library_photos, ...game } = row;

  const bundle: GameBundle = {
    game: game as GameRow,
    players: players
      .filter((p) => !p.kicked_at)
      .sort((a, b) => a.joined_at.localeCompare(b.joined_at)),
    rounds: [...rounds].sort((a, b) => a.round_index - b.round_index),
    answers,
  };
  if (!withContent) return bundle;
  return {
    ...bundle,
    questions: [...(questions ?? [])].sort(
      (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
    ),
    library: [...(library_photos ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

/** Minimal game lookup (id + tokens + state) for mutations. */
export async function loadGame(rawCode: string): Promise<GameRow> {
  const code = normalizeCode(rawCode);
  if (!/^[A-Z0-9]{4,10}$/.test(code)) throw new ApiError("game_not_found", 404);
  const { data, error } = await db().from("games").select(GAME_COLUMNS).eq("code", code).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError("game_not_found", 404);
  return data as unknown as GameRow;
}

export function assertAdmin(game: GameRow, token: string) {
  if (!token || !safeEqual(token, game.admin_token)) throw new ApiError("unauthorized", 401);
}

export function assertBirthday(game: GameRow, token: string) {
  if (!token || !safeEqual(token, game.birthday_token)) throw new ApiError("unauthorized", 401);
}
