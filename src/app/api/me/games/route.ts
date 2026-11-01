import { connection } from "next/server";
import type { MyGame } from "@/lib/types";
import { requireUser } from "@/server/auth";
import { handle, ok } from "@/server/http";
import { db, publicPhotoUrl } from "@/server/supabase-admin";

// The signed-in user's quizzes, newest first, with the links to send out.
export async function GET() {
  await connection();
  return handle(async () => {
    const user = await requireUser();
    const { data, error } = await db()
      .from("games")
      .select(
        "code, title, template, locale, birthday_name, birthday_gender, birthday_photo_path, state, created_at, admin_token, birthday_token, players(kicked_at)",
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const games: MyGame[] = (data ?? []).map((g) => ({
      code: g.code,
      title: g.title,
      template: g.template,
      locale: g.locale,
      birthdayName: g.birthday_name,
      birthdayGender: g.birthday_gender,
      photoUrl: publicPhotoUrl(g.birthday_photo_path),
      state: g.state,
      createdAt: g.created_at,
      adminToken: g.admin_token,
      birthdayToken: g.birthday_token,
      playerCount: (g.players as { kicked_at: string | null }[]).filter((p) => !p.kicked_at).length,
    }));
    return ok({ games });
  });
}
