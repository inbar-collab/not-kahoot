export function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-ink-700 bg-ink-900 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-gold-soft">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
