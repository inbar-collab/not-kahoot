"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import QRCode from "qrcode";
import type { Strings } from "@/lib/strings";
import { template } from "@/lib/templates";
import type { ScreenSnapshot } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { Ltr } from "../ui/Ltr";
import { Portrait } from "../ui/Portrait";

/**
 * The waiting room: a join bar (QR + address + game code) across the top,
 * the star in the middle, and every guest popping in as a name chip.
 */
export function LobbyStage({ snap, s, joinUrl }: { snap: ScreenSnapshot; s: Strings; joinUrl: string }) {
  const { game, players } = snap;
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toString(joinUrl, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setQr, () => setQr(""));
  }, [joinUrl]);

  // Short and typeable: the site's /join page asks for the code shown next to it.
  const displayUrl = joinUrl.replace(/^https?:\/\//, "").replace(/\/join\/.*$/, "/join");
  const t = template(game.template);

  return (
    <div className="flex h-full flex-col gap-[2.5vh] px-[3vw] py-[3vh]">
      {/* Join bar */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
        className="card flex h-[24vh] shrink-0 items-center gap-[3vw] rounded-[3vh] px-[2.5vw]"
      >
        <div
          className="aspect-square h-[19vh] shrink-0 overflow-hidden rounded-[1.6vh] bg-white p-[0.8vh] shadow-lg"
          role="img"
          aria-label={joinUrl}
          dangerouslySetInnerHTML={{ __html: qr }}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-[0.8vh]">
          <p className="font-display text-[min(4.2vh,3.6vw)] font-bold">{s.scrJoinCta}</p>
          <p className="text-[min(2.6vh,2.2vw)] text-mute">
            {s.scrOrVisit} <Ltr className="font-bold text-cream">{displayUrl}</Ltr>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-[2vh] bg-ink-950/40 px-[2.5vw] py-[1.5vh]">
          <span className="text-[min(2.2vh,2vw)] font-bold uppercase tracking-widest text-mute">{s.scrCode}</span>
          <Ltr className="font-display text-[min(10vh,8vw)] font-black leading-none tracking-[0.08em] text-gold">{game.code}</Ltr>
        </div>
      </motion.div>

      {/* The star */}
      <div className="flex shrink-0 items-center justify-center gap-[3vw]">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 14 }}
        >
          <Portrait url={game.birthdayPhotoUrl} name={game.birthdayName} size="min(26vh, 22vw)" />
        </motion.div>
        <div className="min-w-0 max-w-[58vw]">
          <p className="chip mb-[1.2vh] px-[1.2vw] py-[0.6vh] text-[min(2.4vh,2vw)]">
            {t.emoji} {t.name[game.locale]}
          </p>
          <h1 className="font-display text-[min(7vh,5.4vw)] font-black leading-[1.05]">{game.title}</h1>
          <p className="mt-[1vh] font-display text-[min(3.8vh,3.2vw)] font-bold text-gold-soft">
            <bdi>{game.birthdayName}</bdi>
            {game.birthdayAge ? <span className="text-mute"> · {s.age(game.birthdayAge)}</span> : null}
          </p>
        </div>
      </div>

      {/* Who's here */}
      <div className="card flex min-h-0 flex-1 flex-col rounded-[3vh] px-[2vw] py-[2vh]">
        <div className="mb-[1.5vh] flex items-center justify-between">
          <p className="font-display text-[min(3.4vh,3vw)] font-bold" aria-live="polite">
            {s.scrPlayersJoined(players.length)}
          </p>
          <span className="flex items-center gap-[0.6vw] text-[min(2.4vh,2vw)] text-mute">
            <motion.span
              className="h-[1.4vh] w-[1.4vh] rounded-full bg-gold"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
            />
            {players.length}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-wrap content-start gap-[1vw] overflow-hidden">
          <AnimatePresence>
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className={`tile tile-${i % 4} flex items-center gap-[0.7vw] rounded-full py-[0.6vh] pe-[1.4vw] ps-[0.6vh] text-[min(2.6vh,2.2vw)]`}
              >
                <Avatar player={p} size={48} className="!h-[5vh] !w-[5vh] ring-2 ring-white/80" />
                <bdi className="max-w-[16vw] truncate font-bold">{p.name}</bdi>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
