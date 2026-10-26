import { createGame } from "@/server/games";
import { serverEnv } from "@/server/env";
import { ApiError, handle, ok, readJson } from "@/server/http";
import { safeEqual } from "@/server/tokens";

// Create a new game (home page). Protected by HOST_PASSWORD.
export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson<{ password?: string; birthdayName?: string; gender?: string }>(req);
    const expected = serverEnv.hostPassword;
    if (!expected) throw new ApiError("creation_disabled", 403);
    if (!body.password || !safeEqual(body.password, expected)) throw new ApiError("wrong_password", 401);
    const name = (body.birthdayName ?? "").trim();
    if (!name || name.length > 60) throw new ApiError("settings_invalid");
    const game = await createGame({ birthdayName: name, gender: body.gender === "male" ? "male" : "female" });
    return ok({ code: game.code, adminToken: game.adminToken }, 201);
  });
}
