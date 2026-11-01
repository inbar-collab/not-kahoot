// Builds the host's "export results" CSV. Pure (no server imports) so it can
// be unit-tested; the route in app/api/games/[code]/admin/export wires it to
// the database.
//
// Layout: rank, player name, score, then one column per scored question with
// ✓ (correct), ✗ (wrong) or empty (didn't answer). Only revealed, non-practice
// rounds get a column — those are exactly the rounds that count toward the
// score, so the ✓ marks always add up to the score column.

import { computeStandings, isCorrect, type ScoringAnswer, type ScoringRound } from "./scoring";
import type { PublicPlayer } from "./types";

export interface CsvRound extends ScoringRound {
  text: string;
}

export interface ResultsCsvInput {
  /** Active players only: callers must drop kicked players. */
  players: PublicPlayer[];
  rounds: CsvRound[];
  answers: ScoringAnswer[];
}

export const CSV_HEADERS = { rank: "מקום", name: "שם", score: "ניקוד" } as const;
export const MARK_CORRECT = "✓";
export const MARK_WRONG = "✗";
/** UTF-8 byte-order mark: makes Excel read the file as UTF-8 (Hebrew). */
export const BOM = "﻿";

/** Quotes a field when needed and neutralises spreadsheet formula injection. */
export function csvField(value: string | number): string {
  let s = String(value);
  // A cell starting with = + - @ (or tab / CR) is run as a formula by Excel.
  // Player names are user input, so prefix those with an apostrophe.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildResultsCsv({ players, rounds, answers }: ResultsCsvInput): string {
  const activeIds = new Set(players.map((p) => p.id));
  const activeAnswers = answers.filter((a) => activeIds.has(a.playerId));
  const columns = rounds
    .filter((r) => !r.practice && r.revealed)
    .sort((a, b) => a.index - b.index);

  const choiceOf = new Map<string, number>();
  for (const a of activeAnswers) choiceOf.set(`${a.roundId}:${a.playerId}`, a.choice);

  const header = [
    CSV_HEADERS.rank,
    CSV_HEADERS.name,
    CSV_HEADERS.score,
    ...columns.map((r, k) => `${k + 1}. ${r.text}`),
  ];

  const rows = computeStandings(players, rounds, activeAnswers).map((s) => [
    s.rank,
    s.player.name,
    s.score,
    ...columns.map((r) => {
      const choice = choiceOf.get(`${r.id}:${s.player.id}`);
      if (choice === undefined) return "";
      return isCorrect(r, choice) ? MARK_CORRECT : MARK_WRONG;
    }),
  ]);

  return BOM + [header, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n";
}

export function resultsCsvFilename(code: string): string {
  return `not-kahoot-${code.replace(/[^A-Za-z0-9]/g, "")}-results.csv`;
}
