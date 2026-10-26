// Creates a demo game with the sample questions and prints its links.
//
//   npm run seed                       -> birthday person "אמא"
//   npm run seed -- "רותי" female 55   -> custom name / gender / age
//
// Reads .env.local (or the environment) for the Supabase keys.
import { createGame } from "../src/server/games";

async function main() {
  const [name = "אמא", gender = "female", age] = process.argv.slice(2);
  const base = (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const g = await createGame({
    birthdayName: name,
    gender: gender === "male" ? "male" : "female",
    age: age ? Number(age) : null,
  });
  console.log("\n🎂  Demo game created!\n");
  console.log(`  Game code:        ${g.code}`);
  console.log(`  TV screen:        ${base}/screen/${g.code}`);
  console.log(`  Guests join:      ${base}/join/${g.code}`);
  console.log(`  Birthday person:  ${base}/birthday/${g.code}?token=${g.birthdayToken}`);
  console.log(`  Host (admin):     ${base}/admin/${g.code}?token=${g.adminToken}`);
  console.log("\n  Keep the admin link private. Everything else is reachable from it.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
