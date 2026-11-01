import http from "node:http";
const t = "2026-01-01T00:00:00Z";
const pl = (id, name, j, k = null) => ({ id, game_id: "g1", name, name_key: name, token_hash: "x", avatar_emoji: "🎉", avatar_path: null, is_fake: false, kicked_at: k, joined_at: j });
const rd = (id, i, text, ch, extra = {}) => ({ id, game_id: "g1", round_index: i, question_id: null, text, options: ["א","ב","ג","ד"], photo_path: null, birthday_choices: ch, birthday_locked_at: t, opened_at: t, closed_at: t, revealed_at: t, is_practice: false, ...extra });
const an = (r, p, c) => ({ id: r + p, game_id: "g1", round_id: r, player_id: p, choice: c, created_at: t });
const game = { id: "g1", code: "PARTY7", admin_token: "ADMINTOKEN", birthday_token: "BDAY", title: "", birthday_name: "רחל", birthday_gender: "female", birthday_age: 40, birthday_date: null, birthday_photo_path: null, num_questions: null, leaderboard_every: 3, sounds_enabled: true, allow_late_join: true, state: "FINISHED", current_index: 3, state_changed_at: t, version: 1,
  players: [pl("p1","דנה כהן","2026-01-01T00:00:01Z"), pl("p2","Yossi, Jr.","2026-01-01T00:00:02Z"), pl("p3","סבתא","2026-01-01T00:00:03Z"), pl("p4","מורחק","2026-01-01T00:00:04Z", t)],
  rounds: [rd("r0",0,"שאלת תרגול",[0],{is_practice:true}), rd("r1",1,"מה המאכל האהוב עליה?",[1]), rd("r2",2,"לאן היא הכי רוצה לטוס?",[0,3]), rd("r3",3,"מה הצבע האהוב?",[2])],
  answers: [an("r0","p1",0), an("r1","p1",1), an("r2","p1",3), an("r3","p1",0), an("r1","p2",1), an("r2","p2",2), an("r1","p3",0), an("r1","p4",1), an("r2","p4",0)] };
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  console.log(req.method, u.pathname, u.searchParams.get("code"));
  const code = (u.searchParams.get("code") || "").replace(/^eq\./, "");
  const body = code === game.code ? game : null;
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(body ? [body] : []));
}).listen(54999);
