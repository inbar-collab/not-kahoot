import { Suspense } from "react";
import { GuestApp } from "@/components/guest/GuestApp";
import { Loading } from "@/components/ui/Status";
import { getStrings } from "@/lib/strings";

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<Loading label={getStrings().loading} />}>
      <GuestApp params={params} />
    </Suspense>
  );
}
