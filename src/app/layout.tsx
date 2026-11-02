import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Fredoka, Rubik, Secular_One } from "next/font/google";
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

export const metadata: Metadata = {
  title: { default: "Event Quiz – the party quiz everyone plays from their phone", template: "%s · Event Quiz" },
  description:
    "Make a quiz about the star of your party – birthday, wedding, bar mitzvah and more. Guests guess the answers from their phones while it plays on the TV. חידון מסיבה שכולם משחקים מהטלפון.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#120b2e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      data-theme="birthday"
      suppressHydrationWarning
      className={`${rubik.variable} ${frank.variable} ${fredoka.variable} ${secular.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
