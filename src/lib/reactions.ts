// Emoji reactions guests can send to the TV. They travel over Realtime
// broadcast only (nothing is stored), and the TV ignores anything not on this list.
export const REACTIONS = ["😂", "❤️", "🎉", "😮", "👏", "🔥"] as const;

export interface Reaction {
  emoji: string;
  name: string;
}

export function isReaction(x: unknown): x is Reaction {
  const r = x as Reaction | null;
  return !!r && (REACTIONS as readonly string[]).includes(r.emoji) && typeof r.name === "string" && r.name.length <= 24;
}
