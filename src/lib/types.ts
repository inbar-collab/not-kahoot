// Types shared by the server (which builds snapshots) and the browser
// (which renders them). Each surface gets its own snapshot shape so the
// server can leave out anything that role must not see.

export const GAME_STATES = [
  "LOBBY",
  "INTRO",
  "QUESTION_OPEN",
  "QUESTION_CLOSED",
  "WAITING_FOR_BIRTHDAY",
  "REVEAL",
  "RESULTS",
  "LEADERBOARD",
  "FINISHED",
] as const;
export type GameState = (typeof GAME_STATES)[number];

export type Gender = "female" | "male";

export const CONTROL_ACTIONS = [
  "start",
  "open",
  "close",
  "reveal",
  "results",
  "leaderboard",
  "next",
  "prev",
  "end",
  "reset",
] as const;
export type ControlAction = (typeof CONTROL_ACTIONS)[number];

export interface PublicGame {
  id: string;
  code: string;
  title: string;
  birthdayName: string;
  birthdayGender: Gender;
  birthdayAge: number | null;
  birthdayDate: string | null;
  birthdayPhotoUrl: string | null;
  state: GameState;
  stateChangedAt: string;
  currentIndex: number;
  totalRounds: number;
  soundsEnabled: boolean;
  allowLateJoin: boolean;
  /** Server clock at the time the snapshot was built (ISO). */
  serverNow: string;
}

export interface PublicPlayer {
  id: string;
  name: string;
  emoji: string | null;
  avatarUrl: string | null;
  isFake: boolean;
}

export interface Standing {
  player: PublicPlayer;
  score: number;
  /** Dense rank: ties share a place (1, 1, 2, 3...). */
  rank: number;
  /** Rank before the most recent revealed question (for animations). */
  previousRank: number | null;
  previousScore: number;
  /** Consecutive correct answers ending at the latest revealed question. */
  streak: number;
}

export interface RoundBase {
  id: string;
  index: number;
  text: string;
  options: string[];
  photoUrl: string | null;
}

export interface RoundReveal {
  birthdayChoices: number[];
  /** Number of guests who picked each option. */
  distribution: number[];
  /** Player ids who picked each option. */
  votersByOption: string[][];
  correctCount: number;
  answeredCount: number;
  correctPlayerIds: string[];
}

export interface ScreenSnapshot {
  role: "screen";
  game: PublicGame;
  players: PublicPlayer[];
  round: (RoundBase & { answeredCount: number; eligibleCount: number; reveal: RoundReveal | null }) | null;
  /** Only present in LEADERBOARD and FINISHED. */
  standings: Standing[] | null;
}

export type GuestStatus = "ok" | "no_session" | "kicked" | "not_found";

export interface GuestSnapshot {
  role: "guest";
  game: PublicGame;
  status: GuestStatus;
  me: Standing | null;
  playerCount: number;
  round:
    | (RoundBase & {
        myChoice: number | null;
        /** Only present once the round has been revealed. */
        reveal: { birthdayChoices: number[]; correct: boolean | null } | null;
      })
    | null;
  /** Only present in FINISHED. */
  standings: Standing[] | null;
}

export interface BirthdaySnapshot {
  role: "birthday";
  game: PublicGame;
  round: (RoundBase & { myChoices: number[] | null; locked: boolean }) | null;
  /** Only present in FINISHED (all answers are locked by then). */
  winners: PublicPlayer[] | null;
}

export interface AdminQuestion {
  id: string;
  position: number;
  text: string;
  options: string[];
  photoUrl: string | null;
  photoPath: string | null;
  active: boolean;
}

export interface AdminLibraryPhoto {
  id: string;
  url: string;
}

export interface AdminRoundSummary {
  index: number;
  text: string;
  opened: boolean;
  revealed: boolean;
  birthdayLocked: boolean;
}

export interface AdminSettings {
  title: string;
  birthdayName: string;
  birthdayGender: Gender;
  birthdayAge: number | null;
  birthdayDate: string | null;
  numQuestions: number | null;
  leaderboardEvery: number;
  soundsEnabled: boolean;
  allowLateJoin: boolean;
}

export interface AdminSnapshot {
  role: "admin";
  game: PublicGame;
  version: number;
  settings: AdminSettings;
  birthdayToken: string;
  players: PublicPlayer[];
  round:
    | (RoundBase & {
        opened: boolean;
        revealed: boolean;
        birthdayLocked: boolean;
        answeredPlayerIds: string[];
        eligibleCount: number;
        /** Only once revealed: the host may be playing too. */
        reveal: RoundReveal | null;
      })
    | null;
  rounds: AdminRoundSummary[];
  standings: Standing[];
  questions: AdminQuestion[];
  library: AdminLibraryPhoto[];
  activeQuestionCount: number;
  plannedRoundCount: number;
}

export type AnySnapshot = ScreenSnapshot | GuestSnapshot | BirthdaySnapshot | AdminSnapshot;

/** Error codes returned by the API (translated in strings.ts). */
export type ApiErrorCode =
  | "bad_request"
  | "game_not_found"
  | "unauthorized"
  | "name_required"
  | "name_too_long"
  | "name_taken"
  | "late_join_closed"
  | "game_finished"
  | "player_not_found"
  | "player_kicked"
  | "voting_closed"
  | "not_current_round"
  | "invalid_choice"
  | "already_answered"
  | "already_locked"
  | "not_accepting"
  | "invalid_transition"
  | "waiting_for_birthday"
  | "no_questions"
  | "conflict"
  | "already_revealed"
  | "image_too_large"
  | "image_invalid"
  | "question_invalid"
  | "settings_invalid"
  | "creation_disabled"
  | "wrong_password"
  | "server_error";
