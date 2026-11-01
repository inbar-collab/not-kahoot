import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminApp } from "@/components/admin/AdminApp";
import { Loading } from "@/components/ui/Status";
import { getStrings } from "@/lib/strings";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminPage(props: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<Loading label={getStrings().loading} />}>
      <AdminApp params={props.params} searchParams={props.searchParams} baseUrl={process.env.APP_BASE_URL ?? ""} />
    </Suspense>
  );
}
