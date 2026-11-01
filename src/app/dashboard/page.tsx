import type { Metadata } from "next";
import { DashboardApp } from "@/components/site/DashboardApp";

export const metadata: Metadata = { title: "Event Quiz", robots: { index: false, follow: false } };

export default function DashboardPage() {
  return <DashboardApp baseUrl={process.env.APP_BASE_URL ?? ""} />;
}
