"use client";
import type { Strings } from "@/lib/strings";
import type { AdminSnapshot } from "@/lib/types";
import { Button } from "../ui/Button";
import { Section } from "./Section";
import type { AdminActions } from "./useAdminActions";

type Confirm = (message: string, confirmLabel?: string) => Promise<boolean>;

export function TestPanel({
  snap,
  s,
  actions,
  confirm,
}: {
  snap: AdminSnapshot;
  s: Strings;
  actions: AdminActions;
  confirm: Confirm;
}) {
  const fakes = snap.players.filter((p) => p.isFake).length;
  const state = snap.game.state;
  const roundOpen = state === "QUESTION_OPEN";
  const herTurn = !!snap.round && !snap.round.birthdayLocked && (roundOpen || state === "WAITING_FOR_BIRTHDAY");
  return (
    <Section title={s.tmTitle}>
      <p className="mb-4 text-lg text-mute">{s.tmHint}</p>
      <div className="flex flex-col gap-3">
        <Button variant="secondary" busy={actions.busy === "testCreatePlayers"} onClick={() => void actions.run("testCreatePlayers", { count: 8 }, s.tmDone)}>
          {s.tmCreate(8)}
        </Button>
        <Button variant="ghost" disabled={!roundOpen || fakes === 0} busy={actions.busy === "testAnswer"} onClick={() => void actions.run("testAnswer", {}, s.tmDone)}>
          {s.tmAnswer}
        </Button>
        <Button variant="ghost" disabled={!herTurn} busy={actions.busy === "testBirthday"} onClick={() => void actions.run("testBirthday", {}, s.tmDone)}>
          {s.tmBirthday}
        </Button>
        <Button
          variant="ghost"
          disabled={fakes === 0}
          busy={actions.busy === "testRemovePlayers"}
          onClick={async () => {
            if (await confirm(s.adminConfirmRemoveFakes)) await actions.run("testRemovePlayers", {}, s.tmDone);
          }}
        >
          {s.tmRemove} ({fakes})
        </Button>
      </div>
    </Section>
  );
}
