import { addLibraryPhoto, setBirthdayPhoto, setQuestionPhoto } from "@/server/content";
import { ApiError, bearer, handle, ok } from "@/server/http";
import { storeImage } from "@/server/images";
import { assertAdmin, loadGame } from "@/server/load";

// Admin photo uploads. multipart/form-data: kind (birthday|question|library), file, questionId?
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const game = await loadGame(code);
    assertAdmin(game, bearer(req));
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new ApiError("bad_request");
    }
    const kind = form.get("kind");
    const file = form.get("file");
    if (kind === "birthday") {
      await setBirthdayPhoto(game, await storeImage(game.id, "birthday", file));
    } else if (kind === "question") {
      const id = form.get("questionId");
      if (typeof id !== "string") throw new ApiError("bad_request");
      await setQuestionPhoto(game, id, await storeImage(game.id, "question", file));
    } else if (kind === "library") {
      await addLibraryPhoto(game, await storeImage(game.id, "library", file));
    } else {
      throw new ApiError("bad_request");
    }
    return ok({ ok: true }, 201);
  });
}
