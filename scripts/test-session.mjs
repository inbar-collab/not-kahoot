// Test helper (local Supabase only): creates or reuses a confirmed test user
// and returns browser cookies for a signed-in session, so Playwright tests
// can use the dashboard without Google.
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function testSessionCookies(baseUrl, email = "host@example.com", name = "Test Host") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!/127\.0\.0\.1|localhost/.test(url)) throw new Error("test sessions are for the local Supabase only");
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const password = "test-password-123";
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
  if (error && !/already/i.test(error.message)) throw error;

  const jar = [];
  const sb = createServerClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => jar, setAll: (list) => list.forEach((c) => jar.push(c)) },
  });
  const { error: e2 } = await sb.auth.signInWithPassword({ email, password });
  if (e2) throw e2;
  const host = new URL(baseUrl).hostname;
  return jar.map((c) => ({ name: c.name, value: c.value, domain: host, path: "/", sameSite: "Lax" }));
}
