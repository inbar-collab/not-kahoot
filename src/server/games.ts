// Creating games. Used by the home page ("create a new game") and by the
// seed script, so it must not depend on Next.js request APIs.
import { getStrings } from "@/lib/strings";
import type { Gender } from "@/lib/types";
import { sampleQuestions } from "./sample-questions";
import { db } from "./supabase-admin";
import { newGameCode, newSecret } from "./tokens";

export interface NewGameInput {
  birthdayName: string;
  gender: Gender;
  age?: number | null;
  title?: string;
}

export interface CreatedGame {
  id: string;
  code: string;
  adminToken: string;
  birthdayToken: string;
}

export async function createGame(input: NewGameInput): Promise<CreatedGame> {
  const s = getStrings(input.gender, input.birthdayName);
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
        title: input.title?.trim() || s.defaultTitle,
        birthday_name: input.birthdayName.trim().slice(0, 60),
        birthday_gender: input.gender,
        birthday_age: input.age ?? null,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") continue; // code collision, try another
      throw error;
    }
    const questions = sampleQuestions(input.gender).map((q, i) => ({
      game_id: data.id,
      position: i,
      text: q.text,
      options: q.options,
    }));
    const { error: qErr } = await db().from("questions").insert(questions);
    if (qErr) throw qErr;
    return { id: data.id, code, adminToken, birthdayToken };
  }
  throw new Error("Could not allocate a unique game code");
}
