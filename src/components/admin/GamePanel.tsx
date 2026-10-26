"use client";
import type { PresenceMeta } from "@/hooks/useLiveGame";
import { allowedActions, isLeaderboardDue, suggestedAction, type MachineContext } from "@/lib/state-machine";
import type { Strings } from "@/lib/strings";
import type { AdminSnapshot, ControlAction } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Section } from "./Section";
import type { AdminActions } from "./useAdminActions";

type Confirm = (message: string, confirmLabel?: string) => Promise<boolean>;

export function machineFromSnapshot(snap: AdminSnapshot): MachineContext {
  return {
    state: snap.game.state,
    currentIndex: snap.game.currentIndex,
    rounds: snap.game.state === "LOBBY" ? [] : snap.rounds,
    leaderboardEvery: snap.settings.leaderboardEvery,
    plannedRoundCount: snap.plannedRoundCount,
  };
}

const CONFIRM: Partial<Record<ControlAction, (s: Strings) => string>> = {
  end: (s) => s.adminConfirmEnd,
  reset: (s) => s.adminConfirmReset,
};

export function GamePanel({
  snap,
  s,
  actions,
  confirm,
  online,
}: {
  snap: AdminSnapshot;
  s: Strings;
  actions: AdminActions;
  confirm: Confirm;
  online: PresenceMeta[];
}) {
  const { game, round } = snap;
  const ctx = machineFromSnapshot(snap);
  const allowed = allowedActions(ctx);
  const primary = suggestedAction(ctx);
  const lastRound = game.currentIndex >= game.totalRounds - 1;
  const waitingForHer = !!round && !round.birthdayLocked && (game.state === "WAITING_FOR_BIRTHDAY" || game.state === "QUESTION_CLOSED");

  const onlinePlayers = new Set(online.filter((p) => p.role === "guest").map((p) => p.playerId));
  const birthdayOnline = online.some((p) => p.role === "birthday");
  const tvOnline = online.some((p) => p.role === "screen");
  const answered = new Set(round?.answeredPlayerIds ?? []);
  const showRound = !!round && game.state !== "LOBBY" && game.state !== "INTRO";

  async function control(action: ControlAction) {
    const msg = CONFIRM[action]?.(s);
    if (msg && !(await confirm(msg))) return;
    await actions.run(action);
  }

  function primaryLabel(): string {
    if (!primary) return "";
    if (primary === "open" && game.state === "INTRO") return s.adminOpenFirst;
    if (primary === "reveal" && waitingForHer) return s.adminWaitingBirthday;
    if (primary === "next") {
      if ((game.state === "RESULTS" || game.state === "REVEAL") && isLeaderboardDue(ctx)) return s.adminNextLeaderboard;
      return lastRound ? s.adminNextFinale : s.adminNextQuestion;
    }
    return s.adminActions[primary];
  }

  const ORDER: ControlAction[] = ["open", "close", "reveal", "results", "leaderboard", "prev", "next", "end", "reset"];

  return (
    <div className="flex flex-col gap-4">
      {/* Status + the one big button */}
      <Section
        title={s.adminStateNames[game.state]}
        aside={
          game.totalRounds > 0 && game.state !== "LOBBY" ? (
            <span className="rounded-full bg-ink-800 px-3 py-1 text-base font-bold text-gold">
              {s.questionOf(Math.max(1, game.currentIndex + 1), game.totalRounds)}
            </span>
          ) : null
        }
      >
        <div className="mb-3 flex flex-wrap gap-2 text-base">
          <Dot on={tvOnline} label={tvOnline ? s.adminTvOnline : s.adminTvOffline} />
          <Dot on={birthdayOnline} label={birthdayOnline ? s.adminBirthdayOnline : s.adminBirthdayOffline} />
        </div>

        {game.state === "LOBBY" && (
          <div className="mb-3 flex flex-col gap-2 text-lg">
            {snap.plannedRoundCount === 0 ? (
              <p className="rounded-2xl bg-ink-800 p-3">⚠️ {s.adminNoQuestionsWarn}</p>
            ) : (
              <p className="text-mute">{s.adminPlannedRounds(snap.plannedRoundCount)}</p>
            )}
            {snap.players.length === 0 && <p className="rounded-2xl bg-ink-800 p-3 text-mute">{s.adminNoPlayersWarn}</p>}
          </div>
        )}

        {showRound && round && (
          <div className="mb-4 rounded-2xl bg-ink-850 p-4">
            <p className="text-xl font-bold leading-snug">{round.text}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-lg">
              <span className="tabular-nums">{s.answeredOf(round.answeredPlayerIds.length, round.eligibleCount)}</span>
              <span className={round.birthdayLocked ? "text-gold-soft" : "text-mute"}>
                {round.birthdayLocked ? s.adminBirthdayAnswered : s.adminBirthdayNotAnswered}
              </span>
              {!lastRound && <span className="text-mute">{s.adminRemaining(game.totalRounds - game.currentIndex - 1)}</span>}
            </div>
            {round.reveal ? (
              <ul className="mt-3 flex flex-col gap-1 text-base">
                {round.options.map((o, i) => (
                  <li key={i} className={round.reveal!.birthdayChoices.includes(i) ? "font-bold text-gold-soft" : "text-mute"}>
                    {round.reveal!.birthdayChoices.includes(i) ? "★ " : "• "}
                    {o} — {round.reveal!.distribution[i]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-500">{s.adminDistributionHidden}</p>
            )}
          </div>
        )}

        {primary && (
          <Button
            size="xl"
            className="w-full"
            disabled={!allowed.has(primary)}
            busy={actions.busy === primary}
            onClick={() => void control(primary)}
          >
            {primaryLabel()}
          </Button>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ORDER.filter((a) => a !== primary).map((a) => (
            <Button
              key={a}
              variant={a === "end" || a === "reset" ? "secondary" : "ghost"}
              size="md"
              disabled={!allowed.has(a)}
              busy={actions.busy === a}
              onClick={() => void control(a)}
            >
              {s.adminActions[a]}
            </Button>
          ))}
          {round && !round.revealed && game.state !== "LOBBY" && (
            <Button
              variant="ghost"
              size="md"
              disabled={round.answeredPlayerIds.length === 0}
              busy={actions.busy === "deleteAnswers"}
              onClick={async () => {
                if (await confirm(s.adminConfirmDeleteAnswers)) await actions.run("deleteAnswers");
              }}
            >
              {s.adminDeleteAnswers}
            </Button>
          )}
        </div>

        <Button
          variant="quiet"
          className="mt-3"
          onClick={() => void actions.run("settings", { settings: { soundsEnabled: !snap.settings.soundsEnabled } })}
          aria-pressed={snap.settings.soundsEnabled}
        >
          {snap.settings.soundsEnabled ? s.adminSoundOn : s.adminSoundOff}
        </Button>
      </Section>

      {/* Players */}
      <Section
        title={s.adminPlayers(snap.players.length)}
        aside={
          snap.players.length > 0 ? (
            <Button
              variant="quiet"
              onClick={async () => {
                if (await confirm(s.adminConfirmRemoveAll)) await actions.run("removeAllPlayers");
              }}
            >
              {s.adminRemoveAll}
            </Button>
          ) : null
        }
      >
        {snap.players.length === 0 ? (
          <p className="text-lg text-mute">{s.adminNoPlayers}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-ink-800">
            {snap.players.map((p) => {
              const standing = snap.standings.find((x) => x.player.id === p.id);
              const isOnline = onlinePlayers.has(p.id);
              return (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <span className="relative">
                    <Avatar player={p} size={44} />
                    <span
                      className={`absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink-900 ${isOnline || p.isFake ? "bg-gold" : "bg-ink-500"}`}
                      title={isOnline ? s.adminOnline : s.adminOffline}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <bdi className="block truncate text-lg font-bold">{p.name}</bdi>
                    <span className="text-sm text-mute">
                      {p.isFake ? `${s.adminFake} · ` : ""}
                      {isOnline ? s.adminOnline : p.isFake ? "" : s.adminOffline}
                    </span>
                  </div>
                  {showRound && answered.has(p.id) && (
                    <span className="rounded-full bg-gold/15 px-2 py-0.5 text-sm text-gold-soft">✓ {s.adminAnswered}</span>
                  )}
                  <span className="w-8 text-center font-display text-xl font-bold tabular-nums text-gold-soft">
                    {standing?.score ?? 0}
                  </span>
                  <Button
                    variant="ghost"
                    size="md"
                    className="!min-h-[44px] !px-3 !text-base"
                    aria-label={`${s.adminKick} ${p.name}`}
                    busy={actions.busy === `kick${p.id}`}
                    onClick={async () => {
                      if (await confirm(s.adminConfirmKick(p.name))) await actions.run("kick", { playerId: p.id });
                    }}
                  >
                    {s.adminKick}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Dot({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-ink-850 px-3 py-1">
      <span className={`h-2.5 w-2.5 rounded-full ${on ? "bg-gold" : "bg-ink-500"}`} aria-hidden />
      {label}
    </span>
  );
}
