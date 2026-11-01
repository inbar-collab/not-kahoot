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

/** How the star is referred to: she, he, or a couple / group ("they"). */
export type Gender = "female" | "male" | "plural";

export type Locale = "he" | "en";

export const TEMPLATE_IDS = [
  "birthday",
  "kids_birthday",
  "kids",
  "wedding",
  "mitzvah",
  "baby_shower",
  "anniversary",
  "party",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

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
  template: TemplateId;
  locale: Locale;
  state: GameState;
  stateChangedAt: string;
  currentIndex: number;
  totalRounds: number;
  /** Rounds at the start that are practice (0 or 1); they come before question 1. */
  practiceRounds: number;
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
  practice: boolean;
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
  practice: boolean;
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
  practice: boolean;
}

export interface AdminSettings {
  template: TemplateId;
  locale: Locale;
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
  /** False for quizzes made before accounts existed (they can be claimed). */
  owned: boolean;
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

/** AI quiz builder: one chat message. */
export interface AiMessage {
  role: "user" | "assistant";
  text: string;
}

export interface AiQuestion {
  text: string;
  options: string[];
}

/** What the AI produces once it knows enough. */
export interface AiQuiz {
  template: TemplateId;
  locale: Locale;
  starName: string;
  gender: Gender;
  title: string;
  practice: AiQuestion | null;
  questions: AiQuestion[];
}

/** Sent along when the builder is opened from an existing quiz. */
export interface AiContext {
  template: TemplateId;
  locale: Locale;
  starName: string;
  gender: Gender;
  existing: string[];
}

/** A quiz in the signed-in user's dashboard. */
export interface MyGame {
  code: string;
  title: string;
  template: TemplateId;
  locale: Locale;
  birthdayName: string;
  birthdayGender: Gender;
  photoUrl: string | null;
  state: GameState;
  createdAt: string;
  adminToken: string;
  birthdayToken: string;
  playerCount: number;
}

export interface Me {
  name: string;
  email: string;
  avatarUrl: string | null;
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
  | "login_required"
  | "too_many_games"
  | "ai_not_configured"
  | "ai_limit"
  | "ai_failed"
  | "server_error";
