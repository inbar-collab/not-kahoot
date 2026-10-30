// Row shapes as stored in Postgres (see supabase/migrations).
import type { GameState, Gender } from "@/lib/types";

export interface GameRow {
  id: string;
  code: string;
  admin_token: string;
  birthday_token: string;
  title: string;
  birthday_name: string;
  birthday_gender: Gender;
  birthday_age: number | null;
  birthday_date: string | null;
  birthday_photo_path: string | null;
  num_questions: number | null;
  leaderboard_every: number;
  sounds_enabled: boolean;
  allow_late_join: boolean;
  state: GameState;
  current_index: number;
  state_changed_at: string;
  version: number;
}

export interface QuestionRow {
  id: string;
  game_id: string;
  position: number;
  text: string;
  options: string[];
  photo_path: string | null;
  active: boolean;
  is_practice: boolean;
  created_at: string;
}

export interface LibraryPhotoRow {
  id: string;
  game_id: string;
  path: string;
  created_at: string;
}

export interface PlayerRow {
  id: string;
  game_id: string;
  name: string;
  name_key: string;
  token_hash: string;
  avatar_emoji: string | null;
  avatar_path: string | null;
  is_fake: boolean;
  kicked_at: string | null;
  joined_at: string;
}

export interface RoundRow {
  id: string;
  game_id: string;
  round_index: number;
  question_id: string | null;
  text: string;
  options: string[];
  photo_path: string | null;
  birthday_choices: number[] | null;
  birthday_locked_at: string | null;
  opened_at: string | null;
  closed_at: string | null;
  revealed_at: string | null;
  is_practice: boolean;
}

export interface AnswerRow {
  id: string;
  game_id: string;
  round_id: string;
  player_id: string;
  choice: number;
  created_at: string;
}
