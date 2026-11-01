import type { Metadata } from "next";
import { NewQuizApp } from "@/components/site/NewQuizApp";

export const metadata: Metadata = { title: "Event Quiz", robots: { index: false, follow: false } };

export default function NewQuizPage() {
  return <NewQuizApp />;
}
