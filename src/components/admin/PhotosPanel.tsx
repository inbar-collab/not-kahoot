"use client";
import { useState } from "react";
import type { Strings } from "@/lib/strings";
import type { AdminSnapshot } from "@/lib/types";
import { Spinner } from "../ui/Button";
import { PhotoPicker } from "../ui/PhotoPicker";
import { Section } from "./Section";
import type { AdminActions } from "./useAdminActions";

type Confirm = (message: string, confirmLabel?: string) => Promise<boolean>;

export function PhotosPanel({
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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function uploadAll(blobs: Blob[]) {
    setProgress({ done: 0, total: blobs.length });
    let failed = 0;
    // Two at a time: fast enough, gentle on a phone connection.
    const queue = [...blobs];
    let done = 0;
    await Promise.all(
      [0, 1].map(async () => {
        while (queue.length) {
          const b = queue.shift()!;
          if (!(await actions.upload("library", b))) failed++;
          done++;
          setProgress({ done, total: blobs.length });
        }
      }),
    );
    setProgress(null);
    if (failed) actions.setMessage({ text: s.phFailed(failed), kind: "error" });
  }

  return (
    <Section title={s.phTitle} aside={<span className="text-base text-mute">{snap.library.length}</span>}>
      <p className="mb-4 text-lg text-mute">{s.phHint}</p>
      {progress ? (
        <p className="mb-4 flex items-center gap-3 text-lg" role="status">
          <Spinner className="text-gold" /> {s.phUploading(progress.done, progress.total)}
        </p>
      ) : (
        <PhotoPicker
          label={s.phUpload}
          busyLabel={s.joinPhotoProcessing}
          multiple
          className="mb-4 w-full"
          onPicked={uploadAll}
          onError={() => actions.setMessage({ text: s.errors.image_invalid, kind: "error" })}
        />
      )}
      {snap.library.length === 0 ? (
        <p className="text-lg text-mute">{s.phEmpty}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {snap.library.map((p) => (
            <li key={p.id} className="relative">
              <img src={p.url} alt="" className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
              <button
                type="button"
                aria-label={s.phDelete}
                className="absolute left-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-ink-950/80 text-lg text-cream hover:bg-ink-700"
                onClick={async () => {
                  if (await confirm(`${s.phDelete}?`)) await actions.run("deleteLibraryPhoto", { id: p.id });
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
