import { Suspense } from "react";
import { BirthdayApp } from "@/components/birthday/BirthdayApp";
import { Loading } from "@/components/ui/Status";
import { getStrings } from "@/lib/strings";

export default function BirthdayPage(props: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<Loading label={getStrings().loading} />}>
      <BirthdayApp params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
