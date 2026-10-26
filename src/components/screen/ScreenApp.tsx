"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLiveGame } from "@/hooks/useLiveGame";
import { api, gamePath } from "@/lib/api";
import { audioReady, play, unlockAudio, type SoundName } from "@/lib/sound";
import { getStrings } from "@/lib/strings";
import type { ScreenSnapshot } from "@/lib/types";
import { CenterMessage, ConnectionPill, Loading } from "../ui/Status";
import { Portrait } from "../ui/Portrait";
import { FinaleStage } from "./FinaleStage";
import { IntroStage } from "./IntroStage";
import { LeaderboardStage } from "./LeaderboardStage";
import { LobbyStage } from "./LobbyStage";
import { QuestionStage } from "./QuestionStage";
import { RevealStage } from "./RevealStage";
import { ResultsStage } from "./ResultsStage";

const PRESENCE = { role: "screen" as const };

export function ScreenApp({ params, baseUrl }: { params: Promise<{ code: string }>; baseUrl: string }) {
  const code = use(params).code.toUpperCase();
  const load = useCallback(() => api.get<ScreenSnapshot>(gamePath(code, "screen")), [code]);
  const { data, error, connection, msInState } = useLiveGame({ load, ignoreKinds: ["content"], presence: PRESENCE });
  const s = getStrings(data?.game.birthdayGender, data?.game.birthdayName);

  // Sounds: only when the host enabled them and after a tap on the TV.
  const [audioOn, setAudioOn] = useState(false);
  const soundsEnabled = !!data?.game.soundsEnabled;
  const sound = useCallback(
    (name: SoundName) => {
      if (soundsEnabled && audioReady()) play(name);
    },
    [soundsEnabled],
  );
  useEffect(() => {
    if (!soundsEnabled) return;
    const onTap = () => void unlockAudio().then(setAudioOn);
    window.addEventListener("pointerdown", onTap);
    window.addEventListener("keydown", onTap);
    return () => {
      window.removeEventListener("pointerdown", onTap);
      window.removeEventListener("keydown", onTap);
    };
  }, [soundsEnabled]);

  // A soft whoosh on every scene change.
  const sceneKey = data ? `${data.game.state}:${data.game.currentIndex}` : "";
  const lastScene = useRef("");
  useEffect(() => {
    if (!sceneKey) return;
    if (lastScene.current && lastScene.current !== sceneKey && !sceneKey.startsWith("REVEAL") && !sceneKey.startsWith("FINISHED")) {
      sound("whoosh");
    }
    lastScene.current = sceneKey;
  }, [sceneKey, sound]);

  if (error?.code === "game_not_found") return <CenterMessage icon="🔍" title={s.invalidCodeTitle} body={s.invalidCodeBody} />;
  if (!data) return <Loading label={s.loading} />;

  const { game } = data;
  const joinUrl = `${(baseUrl || window.location.origin).replace(/\/$/, "")}/join/${game.code}`;

  let stage: React.ReactNode;
  switch (game.state) {
    case "LOBBY":
      stage = <LobbyStage snap={data} s={s} joinUrl={joinUrl} />;
      break;
    case "INTRO":
      stage = <IntroStage snap={data} s={s} />;
      break;
    case "QUESTION_OPEN":
    case "QUESTION_CLOSED":
    case "WAITING_FOR_BIRTHDAY":
      stage = <QuestionStage snap={data} s={s} />;
      break;
    case "REVEAL":
      stage = <RevealStage snap={data} s={s} msInState={msInState} sound={sound} />;
      break;
    case "RESULTS":
      stage = <ResultsStage snap={data} s={s} />;
      break;
    case "LEADERBOARD":
      stage = <LeaderboardStage snap={data} s={s} />;
      break;
    case "FINISHED":
      stage = <FinaleStage snap={data} s={s} msInState={msInState} sound={sound} />;
      break;
  }

  // Question / reveal / results of the same round share one scene key so the
  // transition between them is a crossfade, not a full slide.
  const key = game.state === "LOBBY" || game.state === "INTRO" || game.state === "LEADERBOARD" || game.state === "FINISHED"
    ? game.state
    : `${game.state === "QUESTION_OPEN" || game.state === "QUESTION_CLOSED" || game.state === "WAITING_FOR_BIRTHDAY" ? "Q" : game.state}-${game.currentIndex}`;

  return (
    <main className="stage-bg relative h-dvh w-full overflow-hidden">
      <ConnectionPill state={connection} label={s.reconnecting} />
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {stage}
        </motion.div>
      </AnimatePresence>

      {/* Recurring portrait motif (not on scenes that already feature her). */}
      {game.state !== "LOBBY" && game.state !== "INTRO" && game.state !== "REVEAL" && game.state !== "FINISHED" && (
        <div className="pointer-events-none absolute bottom-[2.5vh] left-[2vw] flex items-center gap-3 opacity-90">
          <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(7vh, 72px)" />
          <bdi className="font-display text-[min(2.4vh,26px)] text-mute">{game.birthdayName}</bdi>
        </div>
      )}

      {soundsEnabled && !audioOn && (
        <button
          type="button"
          onClick={() => void unlockAudio().then(setAudioOn)}
          className="absolute bottom-[2.5vh] right-[2vw] rounded-full border border-ink-600 bg-ink-850/90 px-5 py-3 text-lg text-mute hover:text-cream"
        >
          {s.scrSoundOn}
        </button>
      )}
    </main>
  );
}
