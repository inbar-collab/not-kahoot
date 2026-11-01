"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Strings } from "@/lib/strings";
import { Button } from "../ui/Button";
import { Ltr } from "../ui/Ltr";
import { Section } from "./Section";

export function CopyRow({
  label,
  hint,
  url,
  s,
  open = true,
  whatsapp,
}: {
  label: string;
  hint?: string;
  url: string;
  s: Strings;
  open?: boolean;
  /** Text for a "send on WhatsApp" button. */
  whatsapp?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 border-b border-ink-800 py-3 last:border-0">
      <span className="text-lg font-bold">{label}</span>
      {hint && <span className="text-base text-mute">{hint}</span>}
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
      {whatsapp && (
        <a
          href={`https://wa.me/?text=${encodeURIComponent(whatsapp)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-5 text-lg font-bold text-[#0b2e17] hover:brightness-110"
        >
          💬 {s.adminShareWhatsApp}
        </a>
      )}
    </div>
  );
}

export function LinksPanel({
  base,
  code,
  title,
  birthdayToken,
  s,
}: {
  base: string;
  code: string;
  title: string;
  birthdayToken: string;
  s: Strings;
}) {
  const tv = `${base}/screen/${code}`;
  const join = `${base}/join/${code}`;
  const bday = `${base}/star/${code}?token=${birthdayToken}`;
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toString(bday, { type: "svg", margin: 1, color: { dark: "#000000", light: "#ffffff" } }).then(setQr, () => {});
  }, [bday]);

  return (
    <Section title={s.adminLinks}>
      <CopyRow label={`📺 ${s.adminLinkTv}`} hint={s.adminLinkTvHint} url={tv} s={s} />
      <CopyRow label={`📱 ${s.adminLinkJoin}`} hint={s.adminLinkJoinHint} url={join} s={s} whatsapp={s.adminWhatsAppText(title, join)} />
      <CopyRow label={s.adminLinkBirthday} url={bday} s={s} />
      <details className="py-3">
        <summary className="cursor-pointer text-lg text-gold-soft">{s.adminLinkBirthdayHint}</summary>
        <div
          className="mx-auto mt-3 w-56 overflow-hidden rounded-2xl bg-white p-2"
          role="img"
          aria-label={s.adminLinkBirthday}
          dangerouslySetInnerHTML={{ __html: qr }}
        />
      </details>
      <p className="pt-2 text-base text-mute">🔒 {s.adminLinkAdmin}</p>
    </Section>
  );
}
