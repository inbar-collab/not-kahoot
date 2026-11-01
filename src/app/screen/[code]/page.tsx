import type { Metadata } from "next";
import { Suspense } from "react";
import { ScreenApp } from "@/components/screen/ScreenApp";
import { Loading } from "@/components/ui/Status";
import { getStrings } from "@/lib/strings";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ScreenPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<Loading label={getStrings().loading} />}>
      <ScreenApp params={params} baseUrl={process.env.APP_BASE_URL ?? ""} />
    </Suspense>
  );
}
