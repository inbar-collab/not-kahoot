// Creating and deleting games. createGame is also used by the seed script,
// so it must not depend on Next.js request APIs.
import { inflect, seedText, STARTER_COUNT, template } from "@/lib/templates";
import type { Gender, Locale, TemplateId } from "@/lib/types";
import { deleteImages } from "./images";
import { db } from "./supabase-admin";
import { newGameCode, newSecret } from "./tokens";

export const MAX_GAMES_PER_USER = 50;

export interface NewGameInput {
  ownerId: string | null;
  template: TemplateId;
  locale: Locale;
  birthdayName: string;
  gender: Gender;
  title?: string;
  /** Questions to start with instead of the template's (e.g. written by the AI builder). */
  questions?: { text: string; options: string[] }[];
  practice?: { text: string; options: string[] } | null;
}

export interface CreatedGame {
  id: string;
  code: string;
  adminToken: string;
  birthdayToken: string;
}

export async function createGame(input: NewGameInput): Promise<CreatedGame> {
  const t = template(input.template);
  const name = input.birthdayName.trim().slice(0, 60);
  const title = input.title?.trim() || inflect(t.title[input.locale], input.gender, name);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newGameCode();
    const adminToken = newSecret();
    const birthdayToken = newSecret();
    const { data, error } = await db()
      .from("games")
      .insert({
        code,
        admin_token: adminToken,
        birthday_token: birthdayToken,
        owner_id: input.ownerId,
        template: t.id,
        locale: input.locale,
        title: title.slice(0, 120),
        birthday_name: name,
        birthday_gender: input.gender,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") continue; // code collision, try another
      throw error;
    }
    const practice = input.questions ? input.practice : seedText(t.practice, input.locale, input.gender, name);
    const scored =
      input.questions ?? t.questions.slice(0, STARTER_COUNT).map((seed) => seedText(seed, input.locale, input.gender, name));
    const questions = [...(practice ? [practice] : []), ...scored].map((q, i) => ({
      game_id: data.id,
      position: i,
      text: q.text,
      options: q.options,
      is_practice: !!practice && i === 0,
    }));
    const { error: qErr } = await db().from("questions").insert(questions);
    if (qErr) throw qErr;
    return { id: data.id, code, adminToken, birthdayToken };
  }
  throw new Error("Could not allocate a unique game code");
}

/** Deletes a game, everything in it, and its photos. */
export async function deleteGame(gameId: string) {
  const [g, qs, lib, players] = await Promise.all([
    db().from("games").select("birthday_photo_path").eq("id", gameId).single(),
    db().from("questions").select("photo_path").eq("game_id", gameId),
    db().from("library_photos").select("path").eq("game_id", gameId),
    db().from("players").select("avatar_path").eq("game_id", gameId),
  ]);
  for (const r of [g, qs, lib, players]) if (r.error) throw r.error;
  const paths = [
    g.data?.birthday_photo_path,
    ...(qs.data ?? []).map((x) => x.photo_path),
    ...(lib.data ?? []).map((x) => x.path),
    ...(players.data ?? []).map((x) => x.avatar_path),
  ];
  const { error } = await db().from("games").delete().eq("id", gameId);
  if (error) throw error;
  await deleteImages(paths);
}
