import { connection } from "next/server";
import { currentUser, displayName } from "@/server/auth";
import { handle, ok } from "@/server/http";

// Who is signed in (for the landing page and the admin page's "add to my quizzes").
export async function GET() {
  await connection();
  return handle(async () => {
    const user = await currentUser();
    if (!user) return ok({ user: null });
    return ok({
      user: {
        name: displayName(user),
        email: user.email ?? "",
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      },
    });
  });
}
