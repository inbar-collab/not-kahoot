import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Keeps the host's Google sign-in fresh: Supabase access tokens expire after
// an hour, so pages and API routes that need the signed-in user get a
// refreshed session cookie here first. Visitors without a session cookie
// (guests, the TV) pass straight through.
export async function proxy(request: NextRequest) {
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/new",
    "/admin/:code",
    "/api/me/:path*",
    "/api/ai/:path*",
    "/api/games",
    "/api/games/:code",
    "/api/games/:code/claim",
  ],
};
