"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import QRCode from "qrcode";
import type { Strings } from "@/lib/strings";
import type { ScreenSnapshot } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { Ltr } from "../ui/Ltr";
import { Portrait } from "../ui/Portrait";

export function LobbyStage({ snap, s, joinUrl }: { snap: ScreenSnapshot; s: Strings; joinUrl: string }) {
  const { game, players } = snap;
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toString(joinUrl, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0b0b0c", light: "#f3eee4" },
    }).then(setQr, () => setQr(""));
  }, [joinUrl]);

  const displayUrl = joinUrl.replace(/^https?:\/\//, "");

  return (
    <div className="flex h-full flex-col px-[4vw] py-[4vh]">
      <div className="grid flex-1 grid-cols-1 items-center gap-[4vw] md:grid-cols-[1.15fr_1fr]">
        {/* Her */}
        <div className="flex flex-col items-center text-center md:items-start md:text-start">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
            <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(36vh, 30vw)" />
          </motion.div>
          <p className="mt-[3vh] text-[min(2.6vh,3.2vw)] uppercase tracking-[0.3em] text-gold">{s.appName}</p>
          <h1 className="mt-[1vh] font-display text-[min(7.5vh,6vw)] font-bold leading-[1.1]">{game.title}</h1>
          <p className="mt-[1.5vh] font-display text-[min(4.4vh,4vw)] text-gold-soft">
            <bdi>{game.birthdayName}</bdi>
            {game.birthdayAge ? <span className="text-mute"> · {s.age(game.birthdayAge)}</span> : null}
          </p>
        </div>

        {/* Join */}
        <div className="flex flex-col items-center">
          <p className="mb-[2vh] font-display text-[min(4vh,4vw)] font-bold">{s.scrJoinCta}</p>
          <div
            className="aspect-square w-[min(44vh,38vw)] overflow-hidden rounded-[2.5vh] bg-cream p-[1.2vh] shadow-[0_0_80px_-20px_rgb(214_176_107/0.5)]"
            role="img"
            aria-label={joinUrl}
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <p className="mt-[2vh] text-[min(2.4vh,3vw)] text-mute">{s.scrOrVisit}</p>
          <Ltr className="text-[min(3vh,3.4vw)] font-bold tracking-wide text-cream">{displayUrl}</Ltr>
        </div>
      </div>

      {/* Who's here */}
      <div className="mt-[2vh] border-t border-ink-800 pt-[2.5vh]">
        <p className="mb-[1.5vh] text-center font-display text-[min(3.6vh,4vw)] font-bold text-gold-soft" aria-live="polite">
          {s.scrPlayersJoined(players.length)}
        </p>
        <div className="flex min-h-[9vh] flex-wrap items-start justify-center gap-[1.4vw]">
          <AnimatePresence>
            {players.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 20 }}
                className="flex w-[min(10vh,12vw)] flex-col items-center gap-1"
              >
                <Avatar player={p} size={64} className="!h-[min(7vh,9vw)] !w-[min(7vh,9vw)]" />
                <bdi className="w-full truncate text-center text-[min(2vh,2.6vw)] font-bold">{p.name}</bdi>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
