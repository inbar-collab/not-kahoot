import type { PublicPlayer } from "@/lib/types";

/** Round avatar: the player's photo (never stretched), their emoji, or their initial. */
export function Avatar({
  player,
  size = 48,
  ring = false,
  className = "",
}: {
  player: Pick<PublicPlayer, "name" | "emoji" | "avatarUrl">;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const style = { width: size, height: size, fontSize: size * 0.5 };
  const ringCls = ring ? "ring-2 ring-gold ring-offset-2 ring-offset-ink-950" : "";
  if (player.avatarUrl) {
    return (
      <img
        src={player.avatarUrl}
        alt=""
        width={size}
        height={size}
        style={style}
        className={`shrink-0 rounded-full bg-ink-800 object-cover ${ringCls} ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={style}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-ink-800 leading-none ${ringCls} ${className}`}
    >
      {player.emoji ?? <span className="font-display font-bold text-gold-soft">{[...player.name][0] ?? "?"}</span>}
    </span>
  );
}
