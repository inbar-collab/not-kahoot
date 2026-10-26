import Link from "next/link";
import { getStrings } from "@/lib/strings";

export default function NotFound() {
  const s = getStrings();
  return (
    <main className="stage-bg flex min-h-dvh flex-col items-center justify-center gap-5 p-6 text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="font-display text-3xl font-bold">{s.invalidCodeTitle}</h1>
      <Link href="/" className="rounded-2xl bg-gold px-6 py-4 text-xl font-bold text-ink-950">
        {s.homeTitle}
      </Link>
    </main>
  );
}
