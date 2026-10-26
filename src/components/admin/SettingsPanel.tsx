"use client";
import { useState } from "react";
import type { Strings } from "@/lib/strings";
import type { AdminSettings, AdminSnapshot, Gender } from "@/lib/types";
import { Button } from "../ui/Button";
import { PhotoPicker } from "../ui/PhotoPicker";
import { Portrait } from "../ui/Portrait";
import { Section } from "./Section";
import type { AdminActions } from "./useAdminActions";

const input =
  "h-14 w-full rounded-2xl border-2 border-ink-600 bg-ink-850 px-4 text-lg text-cream focus:border-gold focus:outline-none";

export function SettingsPanel({ snap, s, actions }: { snap: AdminSnapshot; s: Strings; actions: AdminActions }) {
  const [form, setForm] = useState<AdminSettings>(snap.settings);
  const set = <K extends keyof AdminSettings>(k: K, v: AdminSettings[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="flex flex-col gap-4">
      <Section title={s.stPhoto}>
        <div className="flex items-center gap-4">
          <Portrait url={snap.game.birthdayPhotoUrl} name={snap.game.birthdayName} size={96} />
          <PhotoPicker
            label={snap.game.birthdayPhotoUrl ? s.stPhotoReplace : s.stPhotoUpload}
            busyLabel={s.joinPhotoProcessing}
            className="flex-1"
            onPicked={async ([b]) => {
              if (await actions.upload("birthday", b)) actions.setMessage({ text: s.saved, kind: "ok" });
            }}
            onError={() => actions.setMessage({ text: s.errors.image_invalid, kind: "error" })}
          />
        </div>
      </Section>

      <Section title={s.adminTabSettings}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void actions.run("settings", { settings: form }, s.saved);
          }}
        >
          <Field label={s.stTitle}>
            <input className={input} value={form.title} maxLength={120} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label={s.stName}>
            <input className={input} value={form.birthdayName} maxLength={60} onChange={(e) => set("birthdayName", e.target.value)} />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-lg font-bold">{s.stGender}</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["female", "male"] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={form.birthdayGender === g}
                  onClick={() => set("birthdayGender", g)}
                  className={`min-h-[56px] rounded-2xl border-2 text-lg font-bold ${
                    form.birthdayGender === g ? "border-gold bg-gold/15" : "border-ink-600 bg-ink-850"
                  }`}
                >
                  {g === "female" ? s.homeFemale : s.homeMale}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <Field label={s.stAge}>
              <input
                className={input}
                type="number"
                inputMode="numeric"
                min={0}
                max={150}
                value={form.birthdayAge ?? ""}
                onChange={(e) => set("birthdayAge", e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
            <Field label={s.stDate}>
              <input
                className={input}
                type="date"
                value={form.birthdayDate ?? ""}
                onChange={(e) => set("birthdayDate", e.target.value || null)}
              />
            </Field>
          </div>
          <Field label={s.stNumQuestions}>
            <input
              className={input}
              type="number"
              inputMode="numeric"
              min={1}
              max={200}
              value={form.numQuestions ?? ""}
              onChange={(e) => set("numQuestions", e.target.value === "" ? null : Number(e.target.value))}
            />
          </Field>
          <Field label={s.stLeaderboardEvery}>
            <input
              className={input}
              type="number"
              inputMode="numeric"
              min={0}
              max={200}
              value={form.leaderboardEvery}
              onChange={(e) => set("leaderboardEvery", Number(e.target.value) || 0)}
            />
          </Field>
          <Toggle label={s.stSounds} on={form.soundsEnabled} onChange={(v) => set("soundsEnabled", v)} />
          <Toggle label={s.stLateJoin} on={form.allowLateJoin} onChange={(v) => set("allowLateJoin", v)} />
          <Button type="submit" busy={actions.busy === "settings"}>
            {s.stSave}
          </Button>
        </form>
      </Section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-lg font-bold">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex min-h-[60px] items-center justify-between gap-4 rounded-2xl border-2 border-ink-600 bg-ink-850 px-4 text-start text-lg font-bold"
    >
      <span>{label}</span>
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition ${on ? "bg-gold" : "bg-ink-600"}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-cream transition-all ${on ? "left-1" : "left-7"}`} />
      </span>
    </button>
  );
}
