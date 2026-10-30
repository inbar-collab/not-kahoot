"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useElapsed } from "@/hooks/useElapsed";
import { api, ClientApiError, gamePath } from "@/lib/api";
import { burst } from "@/lib/confetti";
import { roundLabel, type Strings } from "@/lib/strings";
import { OPTION_MARKS, REVEAL_ANSWER_MS, REVEAL_COUNTDOWN_MS } from "@/lib/timing";
import type { GuestSnapshot } from "@/lib/types";
import { Podium } from "../finale/Podium";
import { Ranking } from "../finale/Ranking";
import { Avatar } from "../ui/Avatar";
import { Spinner } from "../ui/Button";
import { Portrait } from "../ui/Portrait";
import { CorrectBadge, SadFace } from "./Feedback";

interface Props {
  snap: GuestSnapshot;
  s: Strings;
  token: string;
  refresh: () => Promise<void>;
  msInState: () => number;
}

export function GuestPlay({ snap, s, token, refresh, msInState }: Props) {
  const { game, me } = snap;
  if (!me) return null;
  const state = game.state;

  let body: React.ReactNode;
  let key: string = state;
  if (state === "LOBBY") {
    body = (
      <Centered>
        <Avatar player={me.player} size={120} ring />
        <h1 className="font-display text-4xl font-bold">{s.guestWelcome(me.player.name)}</h1>
        <p className="text-2xl text-mute">{s.guestLobbyWait}</p>
        <p className="text-xl text-mute">{s.guestPlayersIn(snap.playerCount)}</p>
        <p className="mt-4 text-xl">{s.guestLobbyLook}</p>
      </Centered>
    );
  } else if (state === "INTRO") {
    body = (
      <Centered>
        <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size={140} />
        <h1 className="font-display text-4xl font-bold">{s.guestIntro}</h1>
        <p className="text-xl text-mute">{s.scrRules[0]}</p>
      </Centered>
    );
  } else if (state === "LEADERBOARD") {
    body = (
      <Centered>
        <Avatar player={me.player} size={100} ring />
        <p className="font-display text-6xl font-black text-gold">{me.rank}</p>
        <p className="text-2xl">{s.guestLeaderboard(me.rank, me.score)}</p>
        {me.streak >= 3 && <p className="text-xl text-gold-soft">{s.streak(me.streak)}</p>}
        <p className="mt-4 text-xl text-mute">{s.guestLookAtScreen}</p>
      </Centered>
    );
  } else if (state === "FINISHED") {
    body = <GuestFinale snap={snap} s={s} />;
  } else if (snap.round) {
    key = `${state}-${snap.round.id}`;
    body = <RoundView snap={snap} s={s} token={token} refresh={refresh} msInState={msInState} />;
  } else {
    body = (
      <Centered>
        <Spinner className="h-10 w-10 text-gold" />
      </Centered>
    );
  }

  return (
    <main className="stage-bg flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-ink-800 px-4 py-3">
        <Avatar player={me.player} size={40} />
        <span className="min-w-0 flex-1 truncate text-lg font-bold"><bdi>{me.player.name}</bdi></span>
        <span className="rounded-full bg-ink-800 px-4 py-1 text-lg font-bold text-gold-soft" aria-live="polite">
          {s.guestScore(me.score)}
        </span>
        <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size={40} />
      </header>
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

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">{children}</div>;
}

function RoundView({ snap, s, token, refresh, msInState }: Props) {
  const round = snap.round!;
  const state = snap.game.state;
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chosen = round.myChoice ?? pending;

  async function answer(i: number) {
    if (chosen !== null) return;
    setPending(i); // lock immediately on tap
    setError(null);
    try {
      await api.post(gamePath(snap.game.code, "answer"), { roundId: round.id, choice: i }, { playerToken: token });
    } catch (e) {
      const code = e instanceof ClientApiError ? e.code : "network";
      if (code !== "already_answered") {
        setPending(null);
        setError(code === "network" ? s.networkError : s.errors[code]);
      }
    }
    void refresh();
  }

  const header = (
    <div className="px-5 pt-5">
      <p className="text-lg font-bold text-gold">{roundLabel(s, round.index, snap.game)}</p>
      <h1 className="mt-2 font-display text-3xl font-bold leading-snug">{round.text}</h1>
    </div>
  );

  if (state === "REVEAL" || state === "RESULTS") {
    return (
      <>
        {header}
        <RevealView snap={snap} s={s} msInState={msInState} />
      </>
    );
  }

  if (state === "QUESTION_OPEN" && chosen === null) {
    return (
      <>
        {header}
        <p className="px-5 pt-3 text-xl text-mute">{s.guestPickPrompt}</p>
        <div className="flex flex-1 flex-col gap-3 p-5">
          {round.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => void answer(i)}
              className="flex min-h-[76px] items-center gap-4 rounded-3xl border-2 border-ink-600 bg-ink-850 px-5 py-3 text-start text-2xl font-bold transition active:scale-[0.98] active:border-gold hover:border-gold/60"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gold font-display text-xl text-gold">
                {OPTION_MARKS[i]}
              </span>
              <span>{opt}</span>
            </button>
          ))}
          {error && (
            <p role="alert" className="rounded-2xl bg-ink-800 p-4 text-lg">
              ⚠️ {error}
            </p>
          )}
        </div>
      </>
    );
  }

  // Answered (or voting closed).
  return (
    <>
      {header}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
        {chosen !== null ? (
          <>
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
              className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-gold text-6xl text-gold"
              aria-hidden
            >
              ✓
            </motion.div>
            <p className="font-display text-4xl font-bold text-gold-soft" role="status">
              {s.guestRegistered}
            </p>
            <div className="rounded-3xl bg-ink-800 px-6 py-4 text-2xl">
              <span className="text-mute">{s.guestYourAnswer} </span>
              <strong>{round.options[chosen]}</strong>
            </div>
          </>
        ) : (
          <p className="text-2xl text-mute">{s.guestNoAnswer}</p>
        )}
        {state !== "QUESTION_OPEN" && (
          <p className="text-xl text-mute">
            {state === "WAITING_FOR_BIRTHDAY" ? s.guestWaitBirthday : s.guestWaitReveal}
          </p>
        )}
      </div>
    </>
  );
}

function RevealView({ snap, s, msInState }: Omit<Props, "token" | "refresh">) {
  const round = snap.round!;
  const reveal = round.reveal;
  const elapsed = useElapsed(msInState, REVEAL_ANSWER_MS, snap.game.stateChangedAt);
  const showResult = snap.game.state === "RESULTS" || elapsed >= REVEAL_ANSWER_MS;
  const celebrated = useRef(false);

  useEffect(() => {
    // Confetti once, at the reveal moment (not again on the results screen).
    if (showResult && reveal?.correct && snap.game.state === "REVEAL" && !celebrated.current) {
      celebrated.current = true;
      burst();
    }
  }, [showResult, reveal?.correct, snap.game.state]);

  if (!reveal) return null;
  if (!showResult) {
    const n = Math.max(1, Math.ceil((REVEAL_COUNTDOWN_MS - elapsed) / 1000));
    return (
      <div className="flex flex-1 items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={n}
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="font-display text-[9rem] font-black text-gold"
          >
            {n}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  const herAnswers = reveal.birthdayChoices.map((c) => round.options[c]);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center" role="status">
      {reveal.correct === true ? (
        <>
          <CorrectBadge label={round.practice ? "✓" : "+1"} />
          <p className="font-display text-4xl font-bold text-gold-soft">{s.guestCorrectTitle}</p>
        </>
      ) : (
        <>
          <SadFace />
          <p className="font-display text-3xl font-bold">{reveal.correct === false ? s.guestWrongTitle : s.guestNoAnswer}</p>
        </>
      )}
      <div className="w-full max-w-sm rounded-3xl bg-ink-800 px-5 py-4">
        <p className="text-lg text-mute">{s.guestSheChose}</p>
        {herAnswers.map((a) => (
          <p key={a} className="mt-1 text-2xl font-bold text-gold-soft">
            {a}
          </p>
        ))}
      </div>
      {round.practice ? (
        <p className="text-xl text-mute">{s.guestPracticeNote}</p>
      ) : (
        snap.me && <p className="text-xl">{s.guestScore(snap.me.score)}</p>
      )}
      {snap.me && snap.me.streak >= 3 && <p className="text-xl text-gold-soft">{s.streak(snap.me.streak)}</p>}
    </div>
  );
}

function GuestFinale({ snap, s }: { snap: GuestSnapshot; s: Strings }) {
  const me = snap.me!;
  const standings = snap.standings ?? [];
  useEffect(() => {
    if (me.rank === 1 && me.score > 0) burst(1.4);
  }, [me.rank, me.score]);
  return (
    <div className="flex flex-col items-center gap-6 p-5 text-center">
      <p className="font-display text-4xl font-bold text-gold-soft">
        {me.score > 0 ? s.guestFinalPlace(me.rank) : s.guestFinalThanks}
      </p>
      <p className="text-xl">{s.guestScore(me.score)}</p>
      <div className="w-full pt-24">
        <Podium standings={standings} variant="phone" highlightId={me.player.id} />
      </div>
      <Ranking standings={standings} highlightId={me.player.id} delay={1.5} />
      <p className="text-xl text-mute">{s.guestFinalThanks}</p>
    </div>
  );
}
