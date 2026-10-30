"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Strings } from "@/lib/strings";
import type { AdminQuestion, AdminSnapshot } from "@/lib/types";
import { Button } from "../ui/Button";
import { PhotoPicker } from "../ui/PhotoPicker";
import { Section } from "./Section";
import type { AdminActions } from "./useAdminActions";

type Confirm = (message: string, confirmLabel?: string) => Promise<boolean>;
interface Draft {
  id?: string;
  text: string;
  options: string[];
  practice: boolean;
}

const input =
  "w-full rounded-2xl border-2 border-ink-600 bg-ink-850 px-4 py-3 text-lg text-cream placeholder:text-ink-500 focus:border-gold focus:outline-none";

export function QuestionsPanel({
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
  const [draft, setDraft] = useState<Draft | null>(null);
  const practice = snap.questions.find((q) => q.practice);
  const qs = snap.questions.filter((q) => !q.practice);
  const edit = (q: AdminQuestion) => setDraft({ id: q.id, text: q.text, options: [...q.options], practice: q.practice });

  async function save() {
    if (!draft) return;
    const ok = await actions.run("saveQuestion", {
      question: { id: draft.id, text: draft.text, options: draft.options.filter((o) => o.trim()), practice: draft.practice },
    });
    if (ok) setDraft(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {snap.game.state !== "LOBBY" && (
        <p className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-lg">{s.qEditingLocked}</p>
      )}

      <Section
        title={s.adminTabQuestions}
        aside={<span className="text-base text-mute">{s.qCount(snap.activeQuestionCount, qs.length)}</span>}
      >
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <Button className="w-full" onClick={() => setDraft({ text: "", options: ["", ""], practice: false })}>
            {s.qAdd}
          </Button>
          {!practice && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setDraft({ text: "", options: ["", "", "", ""], practice: true })}
            >
              {s.qAddPractice}
            </Button>
          )}
        </div>

        <AnimatePresence>
          {draft && !draft.id && (
            <Editor key="new" draft={draft} setDraft={setDraft} s={s} onSave={save} busy={actions.busy === "saveQuestion"} />
          )}
        </AnimatePresence>

        {practice && (
          <div className="mb-4">
            {draft?.id === practice.id ? (
              <Editor draft={draft} setDraft={setDraft} s={s} onSave={save} busy={actions.busy === "saveQuestion"} />
            ) : (
              <ul>
                <QuestionRow q={practice} i={-1} last s={s} actions={actions} confirm={confirm} onEdit={() => edit(practice)} />
              </ul>
            )}
            <p className="mt-2 text-sm text-mute">{s.qPracticeHint}</p>
          </div>
        )}

        {qs.length === 0 && <p className="text-lg text-mute">{s.qEmpty}</p>}

        <ol className="flex flex-col gap-3">
          {qs.map((q, i) =>
            draft?.id === q.id ? (
              <li key={q.id}>
                <Editor draft={draft} setDraft={setDraft} s={s} onSave={save} busy={actions.busy === "saveQuestion"} />
              </li>
            ) : (
              <QuestionRow
                key={q.id}
                q={q}
                i={i}
                last={i === qs.length - 1}
                s={s}
                actions={actions}
                confirm={confirm}
                onEdit={() => edit(q)}
              />
            ),
          )}
        </ol>
      </Section>
    </div>
  );
}

function QuestionRow({
  q,
  i,
  last,
  s,
  actions,
  confirm,
  onEdit,
}: {
  q: AdminQuestion;
  i: number;
  last: boolean;
  s: Strings;
  actions: AdminActions;
  confirm: Confirm;
  onEdit: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  return (
    <motion.li
      layout
      className={`rounded-2xl border p-3 ${q.active ? (q.practice ? "border-2 border-gold/70 bg-ink-850" : "border-ink-700 bg-ink-850") : "border-dashed border-ink-700 bg-ink-900 opacity-70"}`}
    >
      <div className="flex gap-3">
        <span className="mt-1 font-display text-xl font-bold text-gold">{q.practice ? "🎯" : i + 1}</span>
        <div className="min-w-0 flex-1">
          {q.practice && <p className="text-sm font-bold text-gold">{s.qPractice}</p>}
          <p className="text-lg font-bold leading-snug">{q.text}</p>
          <p className="mt-1 text-base text-mute">{q.options.join(" · ")}</p>
          {!q.active && <p className="mt-1 text-sm text-mute">{s.qInactive}</p>}
        </div>
        {q.photoUrl && <img src={q.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!q.practice && (
          <>
            <Button variant="ghost" size="md" className="!px-3" aria-label={s.qUp} disabled={i === 0} onClick={() => void actions.run("moveQuestion", { id: q.id, direction: "up" })}>
              ↑
            </Button>
            <Button variant="ghost" size="md" className="!px-3" aria-label={s.qDown} disabled={last} onClick={() => void actions.run("moveQuestion", { id: q.id, direction: "down" })}>
              ↓
            </Button>
          </>
        )}
        <Button variant="ghost" size="md" onClick={onEdit}>
          {s.qEdit}
        </Button>
        <Button
          variant="ghost"
          size="md"
          busy={actions.busy === `setQuestionActive${q.id}`}
          onClick={() => void actions.run("setQuestionActive", { id: q.id, active: !q.active })}
        >
          {q.active ? s.qDeactivate : s.qActivate}
        </Button>
        <Button
          variant="ghost"
          size="md"
          busy={actions.busy === `setQuestionPractice${q.id}`}
          onClick={() => void actions.run("setQuestionPractice", { id: q.id, practice: !q.practice })}
        >
          {q.practice ? s.qUnmakePractice : s.qMakePractice}
        </Button>
        {q.photoUrl ? (
          <Button variant="ghost" size="md" onClick={() => void actions.run("removeQuestionPhoto", { id: q.id })}>
            {s.qRemovePhoto}
          </Button>
        ) : (
          <PhotoPicker
            label={s.qAddPhoto}
            busyLabel={s.loading}
            className={`!min-h-[52px] !border-solid !text-base ${uploading ? "opacity-60" : ""}`}
            onPicked={async ([b]) => {
              setUploading(true);
              await actions.upload("question", b, q.id);
              setUploading(false);
            }}
          />
        )}
        <Button
          variant="ghost"
          size="md"
          onClick={async () => {
            if (await confirm(s.adminConfirmDeleteQuestion)) await actions.run("deleteQuestion", { id: q.id });
          }}
        >
          {s.qDelete}
        </Button>
      </div>
    </motion.li>
  );
}

function Editor({
  draft,
  setDraft,
  s,
  onSave,
  busy,
}: {
  draft: Draft;
  setDraft: (d: Draft | null) => void;
  s: Strings;
  onSave: () => void;
  busy: boolean;
}) {
  const setOption = (i: number, v: string) => setDraft({ ...draft, options: draft.options.map((o, k) => (k === i ? v : o)) });
  const valid = draft.text.trim() && draft.options.filter((o) => o.trim()).length >= 2;
  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mb-4 flex flex-col gap-3 rounded-2xl border-2 border-gold/60 bg-ink-850 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave();
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="font-bold">{s.qText}</span>
        <textarea
          className={`${input} min-h-[90px]`}
          value={draft.text}
          maxLength={300}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          autoFocus
        />
      </label>
      {draft.options.map((o, i) => (
        <div key={i} className="flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-bold">{s.qOption(i + 1)}</span>
            <input className={input} value={o} maxLength={80} onChange={(e) => setOption(i, e.target.value)} />
          </label>
          {draft.options.length > 2 && (
            <Button
              variant="ghost"
              size="md"
              aria-label={s.qRemoveOption}
              onClick={() => setDraft({ ...draft, options: draft.options.filter((_, k) => k !== i) })}
            >
              ✕
            </Button>
          )}
        </div>
      ))}
      {draft.options.length < 4 && (
        <Button variant="secondary" size="md" onClick={() => setDraft({ ...draft, options: [...draft.options, ""] })}>
          {s.qAddOption}
        </Button>
      )}
      <label className="flex items-center gap-3 text-lg">
        <input
          type="checkbox"
          className="h-6 w-6 accent-[var(--color-gold)]"
          checked={draft.practice}
          onChange={(e) => setDraft({ ...draft, practice: e.target.checked })}
        />
        {s.qPracticeCheckbox}
      </label>
      <p className="text-sm text-mute">{s.qNoPhotoHint}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button type="submit" disabled={!valid} busy={busy}>
          {s.save}
        </Button>
        <Button variant="ghost" onClick={() => setDraft(null)}>
          {s.cancel}
        </Button>
      </div>
    </motion.form>
  );
}
