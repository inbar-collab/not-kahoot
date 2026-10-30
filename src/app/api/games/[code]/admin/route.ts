import { connection } from "next/server";
import { CONTROL_ACTIONS, type ControlAction } from "@/lib/types";
import {
  deleteLibraryPhoto,
  deleteQuestion,
  moveQuestion,
  saveQuestion,
  setQuestionActive,
  setQuestionPractice,
  setQuestionPhoto,
  updateSettings,
} from "@/server/content";
import { deleteCurrentAnswers, runControl } from "@/server/control";
import { ApiError, bearer, handle, ok, readJson } from "@/server/http";
import { assertAdmin, loadBundle, loadGame } from "@/server/load";
import { kickPlayer, removeAllPlayers } from "@/server/players";
import { adminSnapshot } from "@/server/snapshots";
import { createFakePlayers, fakePlayersAnswer, randomBirthdayAnswer, removeFakePlayers } from "@/server/test-mode";

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  await connection();
  return handle(async () => {
    const { code } = await ctx.params;
    const bundle = await loadBundle(code, true);
    assertAdmin(bundle.game, bearer(req));
    return ok(adminSnapshot(bundle));
  });
}

type Body = { action?: string } & Record<string, unknown>;

// Every host command goes through here: { action: "...", ...arguments }.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const game = await loadGame(code);
    assertAdmin(game, bearer(req));
    const body = await readJson<Body>(req);
    const action = body.action ?? "";

    if ((CONTROL_ACTIONS as readonly string[]).includes(action)) {
      await runControl(game.id, action as ControlAction);
      return ok({ ok: true });
    }

    switch (action) {
      case "kick":
        if (typeof body.playerId !== "string") throw new ApiError("bad_request");
        await kickPlayer(game.id, body.playerId);
        break;
      case "removeAllPlayers":
        await removeAllPlayers(game.id);
        break;
      case "deleteAnswers":
        await deleteCurrentAnswers(game);
        break;
      case "settings":
        await updateSettings(game, (body.settings ?? {}) as Record<string, unknown>);
        break;
      case "saveQuestion":
        return ok({ id: await saveQuestion(game, (body.question ?? {}) as Record<string, unknown>) });
      case "deleteQuestion":
        await deleteQuestion(game, body.id);
        break;
      case "setQuestionActive":
        await setQuestionActive(game, body.id, !!body.active);
        break;
      case "setQuestionPractice":
        await setQuestionPractice(game, body.id, !!body.practice);
        break;
      case "moveQuestion":
        await moveQuestion(game, body.id, body.direction === "up" ? "up" : "down");
        break;
      case "removeQuestionPhoto":
        await setQuestionPhoto(game, body.id, null);
        break;
      case "deleteLibraryPhoto":
        await deleteLibraryPhoto(game, body.id);
        break;
      case "testCreatePlayers":
        await createFakePlayers(game, Number(body.count) || 8);
        break;
      case "testAnswer":
        await fakePlayersAnswer(game);
        break;
      case "testBirthday":
        await randomBirthdayAnswer(game);
        break;
      case "testRemovePlayers":
        await removeFakePlayers(game);
        break;
      default:
        throw new ApiError("bad_request");
    }
    return ok({ ok: true });
  });
}
