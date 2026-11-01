// Creates a demo quiz (not owned by any account) and prints its links. You
// can add it to your account later from the dashboard ("Made a quiz before
// signing in?") or from its admin page.
//
//   npm run seed                                   -> birthday quiz for "אמא", in Hebrew
//   npm run seed -- "Dana & Yoav" plural wedding en -> name, pronoun, template, language
//
// Reads .env.local (or the environment) for the Supabase keys.
import { TEMPLATE_IDS, type Gender, type TemplateId } from "../src/lib/types";
import { createGame } from "../src/server/games";

async function main() {
  const [name = "אמא", gender = "female", template = "birthday", locale = "he"] = process.argv.slice(2);
  const base = (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const g = await createGame({
    ownerId: null,
    birthdayName: name,
    gender: (["female", "male", "plural"].includes(gender) ? gender : "female") as Gender,
    template: (TEMPLATE_IDS.includes(template as TemplateId) ? template : "birthday") as TemplateId,
    locale: locale === "en" ? "en" : "he",
  });
  console.log("\n🎉  Demo quiz created!\n");
  console.log(`  Game code:   ${g.code}`);
  console.log(`  TV screen:   ${base}/screen/${g.code}`);
  console.log(`  Guests join: ${base}/join/${g.code}`);
  console.log(`  The star:    ${base}/star/${g.code}?token=${g.birthdayToken}`);
  console.log(`  Host:        ${base}/admin/${g.code}?token=${g.adminToken}`);
  console.log("\n  Keep the host link private. Everything else is reachable from it.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
