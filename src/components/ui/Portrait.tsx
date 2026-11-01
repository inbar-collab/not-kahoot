/** The birthday person's photo: a clean circle with a thin gold ring. Never filtered. */
export function Portrait({
  url,
  name,
  size = 120,
  className = "",
}: {
  url: string | null;
  name: string;
  size?: number | string;
  className?: string;
}) {
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      className={`relative inline-block shrink-0 rounded-full p-[3px] ${className}`}
      style={{
        width: dim,
        height: dim,
        background: "conic-gradient(from 210deg, var(--color-gold-deep), var(--color-gold-soft), var(--color-gold), var(--color-gold-deep))",
      }}
    >
      {url ? (
        <img src={url} alt={name} className="h-full w-full rounded-full bg-ink-900 object-cover" />
      ) : (
        <span
          role="img"
          aria-label={name}
          className="flex h-full w-full items-center justify-center rounded-full bg-ink-900 font-display text-gold-soft"
          style={{ fontSize: `calc(${dim} * 0.4)` }}
        >
          {[...name][0] ?? "🎂"}
        </span>
      )}
    </span>
  );
}
