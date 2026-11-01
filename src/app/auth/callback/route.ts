import { NextResponse } from "next/server";
import { authClient } from "@/server/auth";

// Google sends the user back here with a one-time code; we trade it for a
// session cookie and continue to the dashboard.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (code) {
    const { error } = await (await authClient()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
    console.warn("[auth] code exchange failed", error.message);
  }
  return NextResponse.redirect(new URL("/?login=failed", url.origin));
}
