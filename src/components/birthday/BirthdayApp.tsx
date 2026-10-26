"use client";
import { use, useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLiveGame } from "@/hooks/useLiveGame";
import { api, ClientApiError, gamePath } from "@/lib/api";
import { getStrings, type Strings } from "@/lib/strings";
import { OPTION_MARKS } from "@/lib/timing";
import type { BirthdaySnapshot } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Portrait } from "../ui/Portrait";
import { CenterMessage, ConnectionPill, Loading } from "../ui/Status";

const PRESENCE = { role: "birthday" as const };

export function BirthdayApp({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const code = use(params).code.toUpperCase();
  const raw = use(searchParams).token;
  const token = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  const load = useCallback(() => api.get<BirthdaySnapshot>(gamePath(code, "birthday"), { bearer: token }), [code, token]);
  // She never needs to react to guests' answers or joins.
  const { data, error, connection, refresh } = useLiveGame({
    load,
    ignoreKinds: ["answer", "player", "content"],
    presence: PRESENCE,
  });
  const s = getStrings(data?.game.birthdayGender, data?.game.birthdayName);

  if (error?.code === "game_not_found") return <CenterMessage icon="🔍" title={s.invalidCodeTitle} body={s.invalidCodeBody} />;
  if (error?.code === "unauthorized") return <CenterMessage icon="🔒" title={s.invalidTokenTitle} body={s.invalidTokenBody} />;
  if (!data) return <Loading label={s.loading} />;

  const { game, round } = data;
  const canAnswer =
    round && !round.locked && (game.state === "QUESTION_OPEN" || game.state === "WAITING_FOR_BIRTHDAY");

  let body: React.ReactNode;
  let key: string = game.state;
  if (canAnswer) {
    key = `answer-${round.id}`;
    body = <AnswerFlow snap={data} s={s} token={token} refresh={refresh} />;
  } else if (round?.locked && game.state !== "FINISHED") {
    key = `locked-${round.id}`;
    body = (
      <Center>
        <motion.div
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-gold text-6xl text-gold"
          aria-hidden
        >
          ✓
        </motion.div>
        <h1 className="font-display text-4xl font-bold">{s.bdSaved}</h1>
        <div className="flex flex-col gap-2">
          {(round.myChoices ?? []).map((c) => (
            <span key={c} className="rounded-2xl bg-ink-800 px-6 py-3 text-2xl font-bold text-gold-soft">
              {round.options[c]}
            </span>
          ))}
        </div>
        <p className="text-xl text-mute">{s.bdWaitReveal}</p>
      </Center>
    );
  } else if (game.state === "FINISHED") {
    body = (
      <Center>
        <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size={140} />
        <h1 className="font-display text-4xl font-bold">{s.bdFinished}</h1>
        {data.winners && data.winners.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-xl text-mute">{s.bdWinnerIs}</p>
            {data.winners.map((w) => (
              <div key={w.id} className="flex items-center gap-3">
                <Avatar player={w} size={56} ring />
                <bdi className="text-3xl font-bold text-gold-soft">{w.name}</bdi>
              </div>
            ))}
          </div>
        )}
      </Center>
    );
  } else if (game.state === "LOBBY" || game.state === "INTRO") {
    body = (
      <Center>
        <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size={150} />
        <h1 className="font-display text-4xl font-bold leading-tight">{s.bdHello(game.birthdayName)}</h1>
        <p className="max-w-sm text-xl leading-relaxed text-mute">{s.bdExplain}</p>
        <p className="text-xl text-gold-soft">{s.bdWaitStart}</p>
      </Center>
    );
  } else {
    body = (
      <Center>
        <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size={120} />
        <p className="text-2xl text-mute">{round && !round.locked ? s.bdMissed : s.bdBetween}</p>
      </Center>
    );
  }

  return (
    <main className="stage-bg flex min-h-dvh flex-col">
      <ConnectionPill state={connection} label={s.reconnecting} />
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          className="flex flex-1 flex-col"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">{children}</div>;
}

// Keyed by round id by the parent, so a new question always starts fresh.
function AnswerFlow({
  snap,
  s,
  token,
  refresh,
}: {
  snap: BirthdaySnapshot;
  s: Strings;
  token: string;
  refresh: () => Promise<void>;
}) {
  const round = snap.round!;
  const [selected, setSelected] = useState<number[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (i: number) =>
    setSelected((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort()));

  async function lock() {
    setBusy(true);
    setError(null);
    try {
      await api.post(gamePath(snap.game.code, "birthday"), { roundId: round.id, choices: selected }, { bearer: token });
    } catch (e) {
      const code = e instanceof ClientApiError ? e.code : "network";
      setError(code === "network" ? s.networkError : s.errors[code]);
    }
    setBusy(false);
    void refresh();
  }

  if (confirming) {
    return (
      <Center>
        <h1 className="font-display text-5xl font-bold">{s.bdAreYouSure}</h1>
        <p className="text-xl text-mute">{s.bdYouChose}</p>
        <div className="flex w-full max-w-md flex-col gap-2">
          {selected.map((i) => (
            <span key={i} className="rounded-2xl border-2 border-gold bg-gold/10 px-6 py-4 text-2xl font-bold">
              {round.options[i]}
            </span>
          ))}
        </div>
        {error && (
          <p role="alert" className="rounded-2xl bg-ink-800 p-4 text-lg">
            ⚠️ {error}
          </p>
        )}
        <div className="flex w-full max-w-md flex-col gap-3">
          <Button size="xl" busy={busy} onClick={() => void lock()}>
            {s.bdLock}
          </Button>
          <Button variant="ghost" size="lg" disabled={busy} onClick={() => setConfirming(false)}>
            {s.bdBack}
          </Button>
        </div>
      </Center>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-center gap-3">
        <Portrait url={snap.game.birthdayPhotoUrl} name={snap.game.birthdayName} size={48} />
        <p className="text-lg font-bold text-gold">{s.questionOf(round.index + 1, snap.game.totalRounds)}</p>
      </div>
      {snap.game.state === "WAITING_FOR_BIRTHDAY" && (
        <p className="mt-3 rounded-2xl bg-gold/10 px-4 py-2 text-lg text-gold-soft">{s.bdEveryoneWaiting}</p>
      )}
      <h1 className="mt-4 font-display text-3xl font-bold leading-snug">{round.text}</h1>
      <p className="mt-2 text-xl text-mute">{s.bdPick}</p>
      <div className="mt-5 flex flex-1 flex-col gap-3">
        {round.options.map((opt, i) => {
          const on = selected.includes(i);
          return (
            <button
              key={i}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(i)}
              className={`flex min-h-[76px] items-center gap-4 rounded-3xl border-2 px-5 py-3 text-start text-2xl font-bold transition ${
                on ? "border-gold bg-gold/15" : "border-ink-600 bg-ink-850 hover:border-gold/60"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 font-display text-xl ${
                  on ? "border-gold bg-gold text-ink-950" : "border-gold text-gold"
                }`}
              >
                {on ? "✓" : OPTION_MARKS[i]}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      <Button size="xl" className="mt-5" disabled={selected.length === 0} onClick={() => setConfirming(true)}>
        {s.bdContinue}
      </Button>
    </div>
  );
}
