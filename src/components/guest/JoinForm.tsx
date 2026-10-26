"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { api, ClientApiError, gamePath } from "@/lib/api";
import { saveSession, type GuestSession } from "@/lib/session";
import { AVATAR_EMOJIS, type Strings } from "@/lib/strings";
import type { PublicGame } from "@/lib/types";
import { Button } from "../ui/Button";
import { PhotoPicker } from "../ui/PhotoPicker";
import { Portrait } from "../ui/Portrait";

export function JoinForm({
  game,
  s,
  notice,
  onJoined,
}: {
  game: PublicGame;
  s: Strings;
  notice: string | null;
  onJoined: (session: GuestSession) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string | null>(null);
  const [photo, setPhotoState] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = photo?.url ?? null;
  const setPhoto = (blob: Blob | null) => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhotoState(blob ? { blob, url: URL.createObjectURL(blob) } : null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError(s.errors.name_required);
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("name", name);
    if (emoji) form.set("emoji", emoji);
    if (photo) form.set("avatar", photo.blob, photo.blob.type === "image/webp" ? "avatar.webp" : "avatar.jpg");
    try {
      const res = await api.form<{ playerId: string; name: string; token: string }>(gamePath(game.code, "join"), form);
      const session = { playerId: res.playerId, token: res.token, name: res.name };
      saveSession(game.code, session);
      onJoined(session);
    } catch (err) {
      const code = err instanceof ClientApiError ? err.code : "network";
      setError(code === "network" ? s.networkError : s.errors[code]);
      setBusy(false);
    }
  }

  const late = game.state !== "LOBBY";

  return (
    <main className="stage-bg min-h-dvh px-5 pb-10 pt-8">
      <form onSubmit={submit} className="mx-auto flex max-w-md flex-col items-center gap-6" noValidate>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size={150} />
        </motion.div>
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold leading-tight text-cream">{game.title}</h1>
          <p className="mt-2 text-xl text-mute">{s.joinSubtitle}</p>
        </div>

        {notice && (
          <p role="status" className="w-full rounded-2xl border border-gold/40 bg-gold/10 p-4 text-lg">
            {notice}
          </p>
        )}
        {late && <p className="w-full rounded-2xl bg-ink-800 p-4 text-lg text-mute">{s.joinLateNotice}</p>}

        <label className="flex w-full flex-col gap-2">
          <span className="text-xl font-bold">{s.joinNameLabel}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            autoComplete="nickname"
            enterKeyHint="go"
            placeholder={s.joinNamePlaceholder}
            className="h-16 w-full rounded-2xl border-2 border-ink-600 bg-ink-850 px-5 text-2xl text-cream placeholder:text-ink-500 focus:border-gold focus:outline-none"
          />
        </label>

        <fieldset className="flex w-full flex-col gap-3">
          <legend className="mb-2 text-xl font-bold">{s.joinAvatarLabel}</legend>
          {preview ? (
            <div className="flex items-center gap-4">
              <img src={preview} alt="" className="h-24 w-24 rounded-full object-cover ring-2 ring-gold" />
              <div className="flex flex-col gap-2">
                <PhotoPicker
                  label={s.joinChangePhoto}
                  busyLabel={s.joinPhotoProcessing}
                  onPicked={([b]) => setPhoto(b)}
                  onError={() => setError(s.errors.image_invalid)}
                />
                <Button variant="quiet" onClick={() => setPhoto(null)}>
                  {s.joinRemovePhoto}
                </Button>
              </div>
            </div>
          ) : (
            <PhotoPicker
              label={s.joinTakePhoto}
              busyLabel={s.joinPhotoProcessing}
              onPicked={([b]) => {
                setPhoto(b);
                setEmoji(null);
              }}
              onError={() => setError(s.errors.image_invalid)}
              className="w-full"
            />
          )}
          {!preview && (
            <>
              <p className="text-lg text-mute">{s.joinPickEmoji}</p>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    aria-pressed={emoji === e}
                    aria-label={e}
                    onClick={() => setEmoji(emoji === e ? null : e)}
                    className={`flex h-14 items-center justify-center rounded-2xl text-3xl transition ${
                      emoji === e ? "bg-gold/25 ring-2 ring-gold" : "bg-ink-800 hover:bg-ink-700"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </>
          )}
        </fieldset>

        {error && (
          <p role="alert" className="w-full rounded-2xl border border-cream/30 bg-ink-800 p-4 text-lg">
            ⚠️ {error}
          </p>
        )}

        <Button type="submit" size="xl" busy={busy} className="w-full">
          {busy ? s.joinWorking : s.joinButton}
        </Button>
      </form>
    </main>
  );
}
