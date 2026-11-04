"use client";
import { Ambient } from "../theme/Ambient";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useElapsed } from "@/hooks/useElapsed";
import { api, ClientApiError, gamePath } from "@/lib/api";
import { burst } from "@/lib/confetti";
import { pick, roundLabel, type Strings } from "@/lib/strings";
import { REACTIONS } from "@/lib/reactions";
import { REVEAL_ANSWER_MS, REVEAL_COUNTDOWN_MS } from "@/lib/timing";
import type { GuestSnapshot } from "@/lib/types";
import { Podium } from "../finale/Podium";
import { Ranking } from "../finale/Ranking";
import { Avatar } from "../ui/Avatar";
import { Spinner } from "../ui/Button";
import { Portrait } from "../ui/Portrait";
import { AnswerShape } from "../ui/AnswerShape";
import { CorrectBadge, SadFace } from "./Feedback";

interface Props {
  snap: GuestSnapshot;
  s: Strings;
  token: string;
  refresh: () => Promise<void>;
  msInState: () => number;
}

export function GuestPlay({ snap, s, token, refresh, msInState, react }: Props & { react: (emoji: string) => void }) {
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
    <main className="stage-bg relative isolate flex min-h-dvh flex-col">
      <Ambient id={snap.game.template} level="phone" />
      <header className="card mx-3 mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5">
        <Avatar player={me.player} size={40} />
        <span className="min-w-0 flex-1 truncate text-lg font-bold"><bdi>{me.player.name}</bdi></span>
        <span className="rounded-full bg-gold px-4 py-1 text-lg font-black text-ink-950" aria-live="polite">
          {me.score}
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
      {/* Reactions while watching the TV (not while answering). */}
      {(state === "LOBBY" || state === "REVEAL" || state === "RESULTS" || state === "LEADERBOARD" || state === "FINISHED") && (
        <ReactionBar label={s.guestReact} onSend={react} />
      )}
    </main>
  );
}

function ReactionBar({ label, onSend }: { label: string; onSend: (emoji: string) => void }) {
  const last = useRef(0);
  const [popped, setPopped] = useState<string | null>(null);
  return (
    <div className="sticky bottom-0 border-t border-ink-800 bg-ink-950/90 px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 backdrop-blur">
      <p className="mb-1 text-center text-sm text-mute">{label}</p>
      <div className="flex justify-center gap-2">
        {REACTIONS.map((e) => (
          <motion.button
            key={e}
            type="button"
            aria-label={e}
            whileTap={{ scale: 1.4 }}
            animate={popped === e ? { y: [0, -14, 0] } : { y: 0 }}
            onClick={() => {
              // A gentle limit so one excited guest can't flood the TV.
              if (Date.now() - last.current < 700) return;
              last.current = Date.now();
              setPopped(e);
              onSend(e);
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-800 text-2xl active:bg-ink-700"
          >
            {e}
          </motion.button>
        ))}
      </div>
    </div>
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
    <div className="px-4 pt-4">
      <p className="chip !bg-gold/15 text-sm !text-gold-soft">{roundLabel(s, round.index, snap.game)}</p>
      <h1 className="mt-3 font-display text-[1.7rem] font-bold leading-snug">{round.text}</h1>
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
        <p className="px-4 pt-2 text-lg text-mute">{s.guestPickPrompt}</p>
        <div className="flex flex-1 flex-col gap-3 p-4 pb-6">
          {round.options.map((opt, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => void answer(i)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 22 }}
              whileTap={{ scale: 0.97, y: 4 }}
              className={`tile tile-${i} flex min-h-[84px] flex-1 items-center gap-4 rounded-[1.4rem] px-5 py-3 text-start text-[1.45rem] font-bold leading-tight`}
            >
              <AnswerShape index={i} className="h-10 w-10 shrink-0 drop-shadow" />
              <span className="[overflow-wrap:anywhere]">{opt}</span>
            </motion.button>
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
              initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className={`tile tile-${chosen} flex h-32 w-32 items-center justify-center rounded-[2rem]`}
              aria-hidden
            >
              <AnswerShape index={chosen} className="h-16 w-16" />
            </motion.div>
            <p className="font-display text-4xl font-black" role="status">
              {s.guestRegistered}
            </p>
            <div className="card rounded-3xl px-6 py-4 text-xl">
              <span className="text-mute">{s.guestYourAnswer} </span>
              <strong>{round.options[chosen]}</strong>
            </div>
            <motion.div className="flex gap-2" aria-hidden>
              {[0, 1, 2].map((k) => (
                <motion.span
                  key={k}
                  className="h-2.5 w-2.5 rounded-full bg-gold"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: k * 0.2 }}
                />
              ))}
            </motion.div>
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
            className="flex h-56 w-56 items-center justify-center rounded-full bg-gold/15 font-display text-[8rem] font-black text-gold ring-8 ring-gold/40"
          >
            {n}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  const right = reveal.correct === true;
  return (
    <motion.div
      className={`relative m-3 flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden rounded-[2rem] p-6 text-center text-white ${
        right ? "bg-[linear-gradient(160deg,#2ad37f,#0f9a5a)]" : "bg-[linear-gradient(160deg,#ff6670,#c42b3d)]"
      } ${reveal.correct === null ? "!bg-[linear-gradient(160deg,#7b7f99,#4b4f6a)]" : ""}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      role="status"
    >
      {right ? (
        <>
          <CorrectBadge label={round.practice ? "✓" : "+1"} />
          <p className="font-display text-4xl font-black drop-shadow">{pick(s.guestCorrectLines, round.index + (snap.me?.score ?? 0))}</p>
        </>
      ) : (
        <>
          <SadFace />
          <p className="font-display text-3xl font-black drop-shadow">
            {reveal.correct === false ? pick(s.guestWrongLines, round.index) : s.guestNoAnswer}
          </p>
        </>
      )}
      <div className="w-full max-w-sm rounded-3xl bg-black/20 px-5 py-4">
        <p className="text-base font-bold opacity-80">{s.guestSheChose}</p>
        <div className="mt-2 flex flex-col gap-2">
          {reveal.birthdayChoices.map((c) => (
            <div key={c} className={`tile tile-${c} flex items-center gap-3 rounded-2xl px-4 py-2.5 text-start text-xl font-bold`}>
              <AnswerShape index={c} className="h-7 w-7 shrink-0" />
              {round.options[c]}
            </div>
          ))}
        </div>
      </div>
      {round.practice ? (
        <p className="text-lg font-bold opacity-90">{s.guestPracticeNote}</p>
      ) : (
        snap.me && <p className="rounded-full bg-black/20 px-5 py-2 text-xl font-bold">{s.guestScore(snap.me.score)}</p>
      )}
      {snap.me && snap.me.streak >= 3 && <p className="text-xl font-bold">{s.streak(snap.me.streak)}</p>}
    </motion.div>
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
