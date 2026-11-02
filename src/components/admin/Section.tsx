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
    <section className="card rounded-[1.75rem] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-black sm:text-2xl">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
