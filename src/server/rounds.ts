import "server-only";
import { randomInt } from "node:crypto";
import type { GameRow, LibraryPhotoRow, QuestionRow } from "./rows";

/** Scored questions that a new game will ask (the practice question is extra). */
export function plannedRoundCount(game: Pick<GameRow, "num_questions">, questions: QuestionRow[]): number {
  const active = questions.filter((q) => q.active && !q.is_practice).length;
  return game.num_questions ? Math.min(game.num_questions, active) : active;
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface RoundSeed {
  question_id: string;
  text: string;
  options: string[];
  photo_path: string | null;
  is_practice: boolean;
}

/**
 * Picks the questions for this run (active ones, in editor order, limited to
 * the configured number; an active practice question goes first and does not
 * count toward the limit) and gives every question without its own photo a
 * library photo: shuffled, no repeats until the library is used up, then a
 * fresh shuffle. Done once at start so it stays stable across refreshes.
 */
export function buildRounds(
  game: Pick<GameRow, "num_questions">,
  questions: QuestionRow[],
  library: LibraryPhotoRow[],
): RoundSeed[] {
  const practice = questions.find((q) => q.active && q.is_practice);
  const scored = questions.filter((q) => q.active && !q.is_practice).slice(0, plannedRoundCount(game, questions));
  const chosen = practice ? [practice, ...scored] : scored;
  let deck: string[] = [];
  const draw = (): string | null => {
    if (library.length === 0) return null;
    if (deck.length === 0) deck = shuffle(library.map((p) => p.path));
    return deck.pop() ?? null;
  };
  return chosen.map((q) => ({
    question_id: q.id,
    text: q.text,
    options: q.options,
    photo_path: q.photo_path ?? draw(),
    is_practice: q.is_practice,
  }));
}
