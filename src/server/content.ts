import "server-only";
// Settings, questions and the photo library (admin only).
import type { Gender } from "@/lib/types";
import { ApiError } from "./http";
import { deleteImages } from "./images";
import type { GameRow, QuestionRow } from "./rows";
import { db } from "./supabase-admin";

const str = (v: unknown, max: number, field: string): string => {
  if (typeof v !== "string") throw new ApiError("settings_invalid");
  const s = v.trim();
  if ([...s].length > max) throw new ApiError("settings_invalid", 400);
  void field;
  return s;
};

const intOrNull = (v: unknown, min: number, max: number): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new ApiError("settings_invalid");
  return n;
};

export async function updateSettings(game: GameRow, input: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  if ("title" in input) patch.title = str(input.title, 120, "title");
  if ("birthdayName" in input) patch.birthday_name = str(input.birthdayName, 60, "birthdayName");
  if ("birthdayGender" in input) {
    if (input.birthdayGender !== "female" && input.birthdayGender !== "male") throw new ApiError("settings_invalid");
    patch.birthday_gender = input.birthdayGender as Gender;
  }
  if ("birthdayAge" in input) patch.birthday_age = intOrNull(input.birthdayAge, 0, 150);
  if ("birthdayDate" in input) {
    const d = input.birthdayDate;
    if (d === null || d === "") patch.birthday_date = null;
    else if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) patch.birthday_date = d;
    else throw new ApiError("settings_invalid");
  }
  if ("numQuestions" in input) patch.num_questions = intOrNull(input.numQuestions, 1, 200);
  if ("leaderboardEvery" in input) patch.leaderboard_every = intOrNull(input.leaderboardEvery, 0, 200) ?? 0;
  if ("soundsEnabled" in input) patch.sounds_enabled = !!input.soundsEnabled;
  if ("allowLateJoin" in input) patch.allow_late_join = !!input.allowLateJoin;
  if (Object.keys(patch).length === 0) return;
  const { error } = await db().from("games").update(patch).eq("id", game.id);
  if (error) throw error;
}

export async function setBirthdayPhoto(game: GameRow, path: string) {
  const { error } = await db().from("games").update({ birthday_photo_path: path }).eq("id", game.id);
  if (error) throw error;
  await deleteImages([game.birthday_photo_path]);
}

function cleanQuestion(input: Record<string, unknown>) {
  const text = typeof input.text === "string" ? input.text.replace(/\s+/g, " ").trim() : "";
  const options = Array.isArray(input.options)
    ? input.options.map((o) => (typeof o === "string" ? o.replace(/\s+/g, " ").trim() : "")).filter(Boolean)
    : [];
  if (!text || [...text].length > 300) throw new ApiError("question_invalid");
  if (options.length < 2 || options.length > 4 || options.some((o) => [...o].length > 80)) {
    throw new ApiError("question_invalid");
  }
  return { text, options };
}

async function getQuestion(game: GameRow, id: unknown): Promise<QuestionRow> {
  if (typeof id !== "string") throw new ApiError("bad_request");
  const { data, error } = await db().from("questions").select("*").eq("game_id", game.id).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError("bad_request", 404);
  return data as QuestionRow;
}

export async function saveQuestion(game: GameRow, input: Record<string, unknown>): Promise<string> {
  const q = cleanQuestion(input);
  if (input.id) {
    const old = await getQuestion(game, input.id);
    const { error } = await db().from("questions").update(q).eq("id", input.id as string);
    if (error) throw error;
    if (typeof input.practice === "boolean" && input.practice !== !!old.is_practice) {
      await setQuestionPractice(game, input.id, input.practice);
    }
    return input.id as string;
  }
  const { data: last } = await db()
    .from("questions")
    .select("position")
    .eq("game_id", game.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await db()
    .from("questions")
    .insert({ ...q, game_id: game.id, position: (last?.position ?? -1) + 1 })
    .select("id")
    .single();
  if (error) throw error;
  if (input.practice === true) await setQuestionPractice(game, data.id, true);
  return data.id;
}

export async function deleteQuestion(game: GameRow, id: unknown) {
  const q = await getQuestion(game, id);
  const { error } = await db().from("questions").delete().eq("id", q.id);
  if (error) throw error;
  // Keep the photo if a round of the current game still shows it.
  const { count } = await db()
    .from("rounds")
    .select("id", { count: "exact", head: true })
    .eq("photo_path", q.photo_path ?? "");
  if (!count) await deleteImages([q.photo_path]);
}

export async function setQuestionActive(game: GameRow, id: unknown, active: boolean) {
  const q = await getQuestion(game, id);
  const { error } = await db().from("questions").update({ active }).eq("id", q.id);
  if (error) throw error;
}

/** Marks one question as the practice question (only one per game) or unmarks it. */
export async function setQuestionPractice(game: GameRow, id: unknown, practice: boolean) {
  const q = await getQuestion(game, id);
  if (practice) {
    const { error: e } = await db()
      .from("questions")
      .update({ is_practice: false })
      .eq("game_id", game.id)
      .eq("is_practice", true)
      .neq("id", q.id);
    if (e) throw e;
  }
  const { error } = await db().from("questions").update({ is_practice: practice }).eq("id", q.id);
  if (error) throw error;
}

export async function moveQuestion(game: GameRow, id: unknown, direction: "up" | "down") {
  const { data, error } = await db()
    .from("questions")
    .select("*")
    .eq("game_id", game.id)
    .order("position")
    .order("created_at");
  if (error) throw error;
  // The practice question always plays first, wherever it sits.
  const list = (data as QuestionRow[]).filter((q) => !q.is_practice);
  const i = list.findIndex((q) => q.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  // Renumber everything so positions are always 0..n-1.
  const changed = list.map((q, k) => ({ q, k })).filter(({ q, k }) => q.position !== k);
  await Promise.all(
    changed.map(async ({ q, k }) => {
      const { error: e } = await db().from("questions").update({ position: k }).eq("id", q.id);
      if (e) throw e;
    }),
  );
}

export async function setQuestionPhoto(game: GameRow, id: unknown, path: string | null) {
  const q = await getQuestion(game, id);
  const { error } = await db().from("questions").update({ photo_path: path }).eq("id", q.id);
  if (error) throw error;
  if (q.photo_path && q.photo_path !== path) {
    const { count } = await db()
      .from("rounds")
      .select("id", { count: "exact", head: true })
      .eq("photo_path", q.photo_path);
    if (!count) await deleteImages([q.photo_path]);
  }
}

export async function addLibraryPhoto(game: GameRow, path: string) {
  const { error } = await db().from("library_photos").insert({ game_id: game.id, path });
  if (error) throw error;
}

export async function deleteLibraryPhoto(game: GameRow, id: unknown) {
  if (typeof id !== "string") throw new ApiError("bad_request");
  const { data, error } = await db()
    .from("library_photos")
    .delete()
    .eq("game_id", game.id)
    .eq("id", id)
    .select("path")
    .maybeSingle();
  if (error) throw error;
  if (data) {
    const { count } = await db()
      .from("rounds")
      .select("id", { count: "exact", head: true })
      .eq("photo_path", data.path);
    if (!count) await deleteImages([data.path]);
  }
}
