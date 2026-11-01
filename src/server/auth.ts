import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { serverEnv } from "./env";
import { ApiError } from "./http";

/** Supabase client bound to the request's auth cookies (Google sign-in). */
export async function authClient() {
  const store = await cookies();
  return createServerClient(serverEnv.supabaseUrl, serverEnv.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a place that can't set cookies; the browser refreshes the session itself.
        }
      },
    },
  });
}

/** The signed-in user, verified with Supabase Auth, or null. */
export async function currentUser(): Promise<User | null> {
  const { data, error } = await (await authClient()).auth.getUser();
  if (error) return null;
  return data.user;
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) throw new ApiError("login_required", 401);
  return user;
}

export function displayName(user: User): string {
  const m = user.user_metadata ?? {};
  return (m.full_name || m.name || user.email || "").toString();
}
