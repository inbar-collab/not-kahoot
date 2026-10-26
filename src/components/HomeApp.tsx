"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ClientApiError } from "@/lib/api";
import { getStrings } from "@/lib/strings";
import type { Gender } from "@/lib/types";
import { Button } from "./ui/Button";

const input =
  "h-16 w-full rounded-2xl border-2 border-ink-600 bg-ink-850 px-5 text-2xl text-cream placeholder:text-ink-500 focus:border-gold focus:outline-none";

export function HomeApp() {
  const s = getStrings();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ code: string; adminToken: string }>("/api/games", {
        password,
        birthdayName: name,
        gender,
      });
      setCreated(`/admin/${res.code}?token=${encodeURIComponent(res.adminToken)}`);
    } catch (err) {
      const c = err instanceof ClientApiError ? err.code : "network";
      setError(c === "network" ? s.networkError : s.errors[c]);
    }
    setBusy(false);
  }

  return (
    <main className="stage-bg min-h-dvh px-5 py-10">
      <div className="mx-auto flex max-w-md flex-col gap-8">
        <header className="text-center">
          <p className="font-display text-5xl font-black text-gold">{s.homeTitle}</p>
          <p className="mt-3 text-xl text-mute">{s.homeTagline}</p>
        </header>

        <form
          className="flex flex-col gap-3 rounded-3xl border border-ink-700 bg-ink-900 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const c = code.trim().toUpperCase();
            if (c) router.push(`/join/${encodeURIComponent(c)}`);
          }}
        >
          <label htmlFor="code" className="text-xl font-bold">
            {s.homeEnterCode}
          </label>
          <input
            id="code"
            dir="ltr"
            className={`${input} text-center uppercase tracking-[0.3em]`}
            value={code}
            maxLength={10}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder={s.homeCodePlaceholder}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" size="xl" disabled={!code.trim()}>
            {s.homeJoin}
          </Button>
        </form>

        <details className="rounded-3xl border border-ink-700 bg-ink-900 p-5">
          <summary className="cursor-pointer text-xl font-bold text-gold-soft">{s.homeCreateTitle}</summary>
          {created ? (
            <div className="mt-4 flex flex-col gap-4">
              <p className="font-display text-2xl font-bold">{s.homeCreatedTitle}</p>
              <p className="text-lg text-mute">{s.homeCreatedBody}</p>
              <Button size="xl" onClick={() => router.push(created)}>
                {s.homeOpenAdmin}
              </Button>
            </div>
          ) : (
            <form className="mt-4 flex flex-col gap-4" onSubmit={create}>
              <label className="flex flex-col gap-2">
                <span className="text-lg font-bold">{s.homeCreateName}</span>
                <input className={input} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
              </label>
              <fieldset className="grid grid-cols-2 gap-2">
                <legend className="mb-2 text-lg font-bold">{s.homeCreateGender}</legend>
                {(["female", "male"] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={gender === g}
                    onClick={() => setGender(g)}
                    className={`min-h-[56px] rounded-2xl border-2 text-lg font-bold ${gender === g ? "border-gold bg-gold/15" : "border-ink-600 bg-ink-850"}`}
                  >
                    {g === "female" ? s.homeFemale : s.homeMale}
                  </button>
                ))}
              </fieldset>
              <label className="flex flex-col gap-2">
                <span className="text-lg font-bold">{s.homeCreatePassword}</span>
                <input
                  className={input}
                  type="password"
                  dir="ltr"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {error && (
                <p role="alert" className="rounded-2xl bg-ink-800 p-4 text-lg">
                  ⚠️ {error}
                </p>
              )}
              <Button type="submit" size="xl" busy={busy} disabled={!name.trim() || !password}>
                {s.homeCreateButton}
              </Button>
            </form>
          )}
        </details>
      </div>
    </main>
  );
}
