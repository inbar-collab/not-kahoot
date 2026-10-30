import "server-only";
// Builds the per-role view of a game. This is where the fairness rules live:
//   * screen / guests never get the birthday answer before the reveal;
//   * the birthday person never gets anything about guests' answers;
//   * the admin sees who answered, but not what, until the reveal.

import { computeReveal, computeStandings, type ScoringAnswer, type ScoringRound } from "@/lib/scoring";
import { isRoundState } from "@/lib/state-machine";
import type {
  AdminSnapshot,
  BirthdaySnapshot,
  GuestSnapshot,
  GuestStatus,
  PublicGame,
  PublicPlayer,
  RoundBase,
  ScreenSnapshot,
} from "@/lib/types";
import type { AdminBundle, GameBundle } from "./load";
import { publicPhotoUrl } from "./supabase-admin";
import type { PlayerRow, RoundRow } from "./rows";
import { hashToken } from "./tokens";
import { plannedRoundCount } from "./rounds";

function publicGame(b: GameBundle): PublicGame {
  const g = b.game;
  return {
    id: g.id,
    code: g.code,
    title: g.title,
    birthdayName: g.birthday_name,
    birthdayGender: g.birthday_gender,
    birthdayAge: g.birthday_age,
    birthdayDate: g.birthday_date,
    birthdayPhotoUrl: publicPhotoUrl(g.birthday_photo_path),
    state: g.state,
    stateChangedAt: g.state_changed_at,
    currentIndex: g.current_index,
    totalRounds: b.rounds.length,
    practiceRounds: b.rounds.filter((r) => r.is_practice).length,
    soundsEnabled: g.sounds_enabled,
    allowLateJoin: g.allow_late_join,
    serverNow: new Date().toISOString(),
  };
}

export function publicPlayer(p: PlayerRow): PublicPlayer {
  return {
    id: p.id,
    name: p.name,
    emoji: p.avatar_emoji,
    avatarUrl: publicPhotoUrl(p.avatar_path),
    isFake: p.is_fake,
  };
}

function roundBase(r: RoundRow): RoundBase {
  return {
    id: r.id,
    index: r.round_index,
    text: r.text,
    options: r.options,
    photoUrl: publicPhotoUrl(r.photo_path),
    practice: r.is_practice,
  };
}

function scoringRounds(b: GameBundle): ScoringRound[] {
  return b.rounds.map((r) => ({
    id: r.id,
    index: r.round_index,
    revealed: !!r.revealed_at,
    birthdayChoices: r.birthday_choices,
    optionCount: r.options.length,
    practice: r.is_practice,
  }));
}

function activeAnswers(b: GameBundle): ScoringAnswer[] {
  const active = new Set(b.players.map((p) => p.id));
  return b.answers
    .filter((a) => active.has(a.player_id))
    .map((a) => ({ roundId: a.round_id, playerId: a.player_id, choice: a.choice }));
}

function currentRound(b: GameBundle): RoundRow | null {
  return b.rounds.find((r) => r.round_index === b.game.current_index) ?? null;
}

function standings(b: GameBundle) {
  return computeStandings(b.players.map(publicPlayer), scoringRounds(b), activeAnswers(b));
}

function revealFor(b: GameBundle, r: RoundRow) {
  const sr = scoringRounds(b).find((x) => x.id === r.id)!;
  return computeReveal(sr, activeAnswers(b), new Set(b.players.map((p) => p.id)));
}

// ------------------------------------------------------------------ screen --

export function screenSnapshot(b: GameBundle): ScreenSnapshot {
  const state = b.game.state;
  const r = isRoundState(state) ? currentRound(b) : null;
  const answers = activeAnswers(b);
  return {
    role: "screen",
    game: publicGame(b),
    players: b.players.map(publicPlayer),
    round: r
      ? {
          ...roundBase(r),
          answeredCount: answers.filter((a) => a.roundId === r.id).length,
          eligibleCount: b.players.length,
          reveal: r.revealed_at ? revealFor(b, r) : null,
        }
      : null,
    standings: state === "LEADERBOARD" || state === "FINISHED" ? standings(b) : null,
  };
}

// ------------------------------------------------------------------- guest --

export function guestSnapshot(b: GameBundle, playerToken: string): GuestSnapshot {
  let status: GuestStatus = "no_session";
  let player: PlayerRow | null = null;
  if (playerToken) {
    const h = hashToken(playerToken);
    player = b.players.find((p) => p.token_hash === h) ?? null;
    status = player ? "ok" : "not_found";
  }
  return buildGuest(b, player, status);
}

export function buildGuest(b: GameBundle, player: PlayerRow | null, status: GuestStatus): GuestSnapshot {
  const state = b.game.state;
  const all = standings(b);
  const me = player ? (all.find((s) => s.player.id === player.id) ?? null) : null;
  const r = player && isRoundState(state) ? currentRound(b) : null;
  const mine = r && player ? b.answers.find((a) => a.round_id === r.id && a.player_id === player.id) : undefined;
  const revealed = !!r?.revealed_at && !!r.birthday_choices;

  return {
    role: "guest",
    game: publicGame(b),
    status,
    me,
    playerCount: b.players.length,
    round: r
      ? {
          ...roundBase(r),
          myChoice: mine ? mine.choice : null,
          reveal: revealed
            ? {
                birthdayChoices: r.birthday_choices!,
                correct: mine ? r.birthday_choices!.includes(mine.choice) : null,
              }
            : null,
        }
      : null,
    standings: state === "FINISHED" && player ? all : null,
  };
}

// ---------------------------------------------------------------- birthday --

export function birthdaySnapshot(b: GameBundle): BirthdaySnapshot {
  const state = b.game.state;
  const r = isRoundState(state) ? currentRound(b) : null;
  const winners =
    state === "FINISHED"
      ? standings(b)
          .filter((s) => s.rank === 1 && s.score > 0)
          .map((s) => s.player)
      : null;
  return {
    role: "birthday",
    game: publicGame(b),
    round: r
      ? {
          ...roundBase(r),
          myChoices: r.birthday_choices,
          locked: !!r.birthday_locked_at,
        }
      : null,
    winners,
  };
}

// ------------------------------------------------------------------- admin --

export function adminSnapshot(b: AdminBundle): AdminSnapshot {
  const g = b.game;
  const r = currentRound(b);
  const activeIds = new Set(b.players.map((p) => p.id));
  return {
    role: "admin",
    game: publicGame(b),
    version: g.version,
    settings: {
      title: g.title,
      birthdayName: g.birthday_name,
      birthdayGender: g.birthday_gender,
      birthdayAge: g.birthday_age,
      birthdayDate: g.birthday_date,
      numQuestions: g.num_questions,
      leaderboardEvery: g.leaderboard_every,
      soundsEnabled: g.sounds_enabled,
      allowLateJoin: g.allow_late_join,
    },
    birthdayToken: g.birthday_token,
    players: b.players.map(publicPlayer),
    round: r
      ? {
          ...roundBase(r),
          opened: !!r.opened_at,
          revealed: !!r.revealed_at,
          birthdayLocked: !!r.birthday_locked_at,
          answeredPlayerIds: b.answers
            .filter((a) => a.round_id === r.id && activeIds.has(a.player_id))
            .map((a) => a.player_id),
          eligibleCount: b.players.length,
          reveal: r.revealed_at ? revealFor(b, r) : null,
        }
      : null,
    rounds: b.rounds.map((x) => ({
      index: x.round_index,
      text: x.text,
      opened: !!x.opened_at,
      revealed: !!x.revealed_at,
      birthdayLocked: !!x.birthday_locked_at,
      practice: x.is_practice,
    })),
    standings: standings(b),
    questions: b.questions.map((q) => ({
      id: q.id,
      position: q.position,
      text: q.text,
      options: q.options,
      photoUrl: publicPhotoUrl(q.photo_path),
      photoPath: q.photo_path,
      active: q.active,
      practice: q.is_practice,
    })),
    library: b.library.map((p) => ({ id: p.id, url: publicPhotoUrl(p.path)! })),
    activeQuestionCount: b.questions.filter((q) => q.active && !q.is_practice).length,
    plannedRoundCount: plannedRoundCount(g, b.questions),
  };
}
