import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "./env";

let client: SupabaseClient | null = null;

/** Service-role client. Bypasses RLS — only ever used on the server. */
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(serverEnv.supabaseUrl, serverEnv.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    });
  }
  return client;
}

export const PHOTO_BUCKET = "photos";

export function publicPhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${serverEnv.supabaseUrl}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}
