import type { Metadata } from "next";
import { Suspense } from "react";
import { BirthdayApp } from "@/components/birthday/BirthdayApp";
import { Loading } from "@/components/ui/Status";
import { getStrings } from "@/lib/strings";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// The star's secret page (the birthday person, the couple...). Old links
// under /birthday/ still work and render the same page.
export default function StarPage(props: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<Loading label={getStrings().loading} />}>
      <BirthdayApp params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
