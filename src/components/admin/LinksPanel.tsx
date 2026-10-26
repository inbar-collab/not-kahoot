"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Strings } from "@/lib/strings";
import { Button } from "../ui/Button";
import { Ltr } from "../ui/Ltr";
import { Section } from "./Section";

function CopyRow({ label, url, s, open = true }: { label: string; url: string; s: Strings; open?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 border-b border-ink-800 py-3 last:border-0">
      <span className="text-lg font-bold">{label}</span>
      <Ltr className="block break-all rounded-xl bg-ink-850 px-3 py-2 text-sm text-mute">{url}</Ltr>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="md"
          className="flex-1"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard blocked: the URL is visible above */
            }
          }}
        >
          {copied ? s.copied : s.copy}
        </Button>
        {open && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-ink-800 px-5 text-lg font-bold hover:bg-ink-700"
          >
            ↗
          </a>
        )}
      </div>
    </div>
  );
}

export function LinksPanel({
  base,
  code,
  birthdayToken,
  s,
}: {
  base: string;
  code: string;
  birthdayToken: string;
  s: Strings;
}) {
  const tv = `${base}/screen/${code}`;
  const join = `${base}/join/${code}`;
  const bday = `${base}/birthday/${code}?token=${birthdayToken}`;
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toString(bday, { type: "svg", margin: 1, color: { dark: "#0b0b0c", light: "#f3eee4" } }).then(setQr, () => {});
  }, [bday]);

  return (
    <Section title={s.adminLinks}>
      <CopyRow label={`📺 ${s.adminLinkTv}`} url={tv} s={s} />
      <CopyRow label={`📱 ${s.adminLinkJoin}`} url={join} s={s} />
      <CopyRow label={`🎂 ${s.adminLinkBirthday}`} url={bday} s={s} />
      <details className="py-3">
        <summary className="cursor-pointer text-lg text-gold-soft">{s.adminLinkBirthdayHint}</summary>
        <div
          className="mx-auto mt-3 w-56 overflow-hidden rounded-2xl bg-cream p-2"
          role="img"
          aria-label={s.adminLinkBirthday}
          dangerouslySetInnerHTML={{ __html: qr }}
        />
      </details>
      <p className="pt-2 text-base text-mute">🔒 {s.adminLinkAdmin}</p>
    </Section>
  );
}
