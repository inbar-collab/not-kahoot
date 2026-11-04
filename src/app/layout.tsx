import type { Metadata, Viewport } from "next";
import {
  Bellefair,
  Frank_Ruhl_Libre,
  Fredoka,
  Rubik,
  Rubik_Bubbles,
  Rubik_Moonrocks,
  Rubik_Vinyl,
  Rubik_Wet_Paint,
  Secular_One,
  Suez_One,
} from "next/font/google";
import "./globals.css";

// Rubik is the app's typeface (Hebrew + Latin). The others are template
// display fonts and are only downloaded when a template uses them.
const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik", display: "swap" });
const frank = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["500", "700", "900"],
  variable: "--font-frank",
  display: "swap",
  preload: false,
});
const fredoka = Fredoka({ subsets: ["hebrew", "latin"], variable: "--font-fredoka", display: "swap", preload: false });
const secular = Secular_One({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-secular", display: "swap", preload: false });
// Signature title lettering, one per theme (only the big titles use these).
const wetpaint = Rubik_Wet_Paint({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-wetpaint", display: "swap", preload: false });
const bubbles = Rubik_Bubbles({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-bubbles", display: "swap", preload: false });
const moonrocks = Rubik_Moonrocks({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-moonrocks", display: "swap", preload: false });
const vinyl = Rubik_Vinyl({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-vinyl", display: "swap", preload: false });
const bellefair = Bellefair({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-bellefair", display: "swap", preload: false });
const suez = Suez_One({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-suez", display: "swap", preload: false });

export const metadata: Metadata = {
  title: { default: "Event Quiz – the party quiz everyone plays from their phone", template: "%s · Event Quiz" },
  description:
    "Make a quiz about the star of your party – birthday, wedding, bar mitzvah and more. Guests guess the answers from their phones while it plays on the TV. חידון מסיבה שכולם משחקים מהטלפון.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff4e2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      data-theme="site"
      suppressHydrationWarning
      className={[rubik, frank, fredoka, secular, wetpaint, bubbles, moonrocks, vinyl, bellefair, suez].map((f) => f.variable).join(" ")}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
