import "server-only";
import { randomUUID } from "node:crypto";
import { ApiError } from "./http";
import { db, PHOTO_BUCKET } from "./supabase-admin";

/** Hard ceiling. Browsers downscale to ~800px first, so real uploads are far smaller. */
export const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;

const SIGNATURES: { type: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { type: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/png",
    ext: "png",
    test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    type: "image/webp",
    ext: "webp",
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

export type PhotoKind = "birthday" | "question" | "library" | "avatar";

/** Validates the file by its bytes (not its claimed type) and stores it. Returns the storage path. */
export async function storeImage(gameId: string, kind: PhotoKind, file: unknown): Promise<string> {
  if (!(file instanceof Blob) || file.size === 0) throw new ApiError("image_invalid");
  if (file.size > MAX_IMAGE_BYTES) throw new ApiError("image_too_large", 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sig = SIGNATURES.find((s) => s.test(bytes));
  if (!sig) throw new ApiError("image_invalid");

  const path = `${gameId}/${kind}/${randomUUID()}.${sig.ext}`;
  const { error } = await db()
    .storage.from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType: sig.type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return path;
}

/** Best effort: a leftover file is harmless, so failures are only logged. */
export async function deleteImages(paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (list.length === 0) return;
  const { error } = await db().storage.from(PHOTO_BUCKET).remove(list);
  if (error) console.warn("[images] could not delete", list, error.message);
}
