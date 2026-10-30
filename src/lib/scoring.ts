// Scoring is derived from answers and revealed rounds every time it is
// needed; there is no stored score column that could drift or be tampered
// with. A guest earns +1 when their answer is one of the birthday person's
// choices. No speed bonus, no negative points. Ties share a place. The
// practice question is revealed like any other but never scored.

import type { PublicPlayer, RoundReveal, Standing } from "./types";

export interface ScoringRound {
  id: string;
  index: number;
  revealed: boolean;
  birthdayChoices: number[] | null;
  optionCount: number;
  practice?: boolean;
}

export interface ScoringAnswer {
  roundId: string;
  playerId: string;
  choice: number;
}

export function isCorrect(round: ScoringRound, choice: number): boolean {
  return round.revealed && !!round.birthdayChoices && round.birthdayChoices.includes(choice);
}

/** Dense ranking: [5, 5, 3, 1] -> [1, 1, 2, 3]. */
export function denseRanks(scores: number[]): number[] {
  const distinct = [...new Set(scores)].sort((a, b) => b - a);
  return scores.map((s) => distinct.indexOf(s) + 1);
}

export function computeStandings(
  players: PublicPlayer[],
  rounds: ScoringRound[],
  answers: ScoringAnswer[],
): Standing[] {
  const scored = rounds.filter((r) => !r.practice);
  const revealed = scored.filter((r) => r.revealed).sort((a, b) => a.index - b.index);
  const lastRevealed = revealed[revealed.length - 1];
  const byRound = new Map(scored.map((r) => [r.id, r]));
  const answerOf = new Map<string, number>(); // `${roundId}:${playerId}` -> choice
  for (const a of answers) answerOf.set(`${a.roundId}:${a.playerId}`, a.choice);

  const rows = players.map((player) => {
    let score = 0;
    let previousScore = 0;
    for (const a of answers) {
      if (a.playerId !== player.id) continue;
      const r = byRound.get(a.roundId);
      if (!r || !isCorrect(r, a.choice)) continue;
      score += 1;
      if (r !== lastRevealed) previousScore += 1;
    }
    let streak = 0;
    for (let k = revealed.length - 1; k >= 0; k--) {
      const r = revealed[k];
      const choice = answerOf.get(`${r.id}:${player.id}`);
      if (choice === undefined || !isCorrect(r, choice)) break;
      streak += 1;
    }
    return { player, score, previousScore, streak };
  });

  const ranks = denseRanks(rows.map((r) => r.score));
  const prevRanks = denseRanks(rows.map((r) => r.previousScore));

  return rows
    .map((r, k) => ({
      player: r.player,
      score: r.score,
      rank: ranks[k],
      previousScore: r.previousScore,
      previousRank: lastRevealed ? prevRanks[k] : null,
      streak: r.streak,
    }))
    .sort((a, b) => a.rank - b.rank || a.player.name.localeCompare(b.player.name, "he"));
}

export function computeReveal(
  round: ScoringRound,
  answers: ScoringAnswer[],
  activePlayerIds: Set<string>,
): RoundReveal | null {
  if (!round.revealed || !round.birthdayChoices) return null;
  const distribution = Array.from({ length: round.optionCount }, () => 0);
  const votersByOption: string[][] = Array.from({ length: round.optionCount }, () => []);
  const correctPlayerIds: string[] = [];
  let answeredCount = 0;
  for (const a of answers) {
    if (a.roundId !== round.id || !activePlayerIds.has(a.playerId)) continue;
    if (a.choice < 0 || a.choice >= round.optionCount) continue;
    answeredCount += 1;
    distribution[a.choice] += 1;
    votersByOption[a.choice].push(a.playerId);
    if (round.birthdayChoices.includes(a.choice)) correctPlayerIds.push(a.playerId);
  }
  return {
    birthdayChoices: [...round.birthdayChoices],
    distribution,
    votersByOption,
    correctCount: correctPlayerIds.length,
    answeredCount,
    correctPlayerIds,
  };
}

/** Groups standings into podium places (1st, 2nd, 3rd), ties together. */
export function podiumGroups(standings: Standing[]): Standing[][] {
  const groups: Standing[][] = [[], [], []];
  for (const s of standings) {
    if (s.rank >= 1 && s.rank <= 3) groups[s.rank - 1].push(s);
  }
  return groups;
}
