import type { Metadata } from "next";
import { JoinCodeApp } from "@/components/site/JoinCodeApp";

export const metadata: Metadata = { title: "Join" };

// The short address shown on the TV: guests type the game code here.
export default function JoinCodePage() {
  return <JoinCodeApp />;
}
