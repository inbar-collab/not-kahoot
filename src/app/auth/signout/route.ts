import { NextResponse } from "next/server";
import { authClient } from "@/server/auth";

export async function POST(req: Request) {
  await (await authClient()).auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
