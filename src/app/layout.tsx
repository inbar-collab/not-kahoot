import type { Metadata, Viewport } from "next";
import { Assistant, Bellefair, Frank_Ruhl_Libre, Fredoka, Secular_One, Varela_Round } from "next/font/google";
import "./globals.css";

const assistant = Assistant({ subsets: ["hebrew", "latin"], variable: "--font-assistant", display: "swap" });
const frank = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-frank",
  display: "swap",
});
// Template fonts: only downloaded when a template that uses them is shown.
const fredoka = Fredoka({ subsets: ["hebrew", "latin"], variable: "--font-fredoka", display: "swap", preload: false });
const varela = Varela_Round({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-varela", display: "swap", preload: false });
const bellefair = Bellefair({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-bellefair", display: "swap", preload: false });
const secular = Secular_One({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-secular", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Event Quiz",
  description: "The party quiz everyone plays from their phone. חידון מסיבה שכולם משחקים מהטלפון.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      data-theme="birthday"
      suppressHydrationWarning
      className={`${assistant.variable} ${frank.variable} ${fredoka.variable} ${varela.variable} ${bellefair.variable} ${secular.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
