"use client";
import { useId, useRef, useState } from "react";
import { resizeImage } from "@/lib/image-resize";
import { Spinner } from "./Button";

/**
 * A big, labelled button that opens the camera / photo library, then
 * downscales the picture in the browser before handing it back.
 */
export function PhotoPicker({
  label,
  busyLabel,
  multiple = false,
  onPicked,
  onError,
  className = "",
  capture,
}: {
  label: string;
  busyLabel: string;
  multiple?: boolean;
  onPicked: (blobs: Blob[]) => void | Promise<void>;
  onError?: () => void;
  className?: string;
  capture?: "user" | "environment";
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const out: Blob[] = [];
      let failed = 0;
      for (const f of Array.from(files)) {
        try {
          out.push(await resizeImage(f));
        } catch {
          failed++;
        }
      }
      if (failed && onError) onError();
      if (out.length) await onPicked(out);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/*"
        multiple={multiple}
        capture={capture}
        className="sr-only"
        onChange={(e) => void handle(e.target.files)}
        disabled={busy}
      />
      <label
        htmlFor={id}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            input.current?.click();
          }
        }}
        className={`inline-flex min-h-[60px] cursor-pointer select-none items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/60 px-5 text-lg font-bold text-gold-soft transition-colors hover:bg-gold/10 ${busy ? "pointer-events-none opacity-70" : ""} ${className}`}
      >
        {busy ? (
          <>
            <Spinner /> {busyLabel}
          </>
        ) : (
          label
        )}
      </label>
    </>
  );
}
