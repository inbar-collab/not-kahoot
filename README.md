# not-kahoot 🎂

**"How well do you know her?"** A real-time birthday game for the family.

The birthday person answers each question privately on her phone. Every guest answers the same question on their own phone and tries to guess what she picked. The host reveals the answer on the TV, and every guest who matched her gets a point. At the end a podium shows who knows her best.

There are four screens:

| Who | Opens | What they see |
| --- | --- | --- |
| 📺 **TV** | `/screen/CODE` | Lobby with a QR code, the questions, the big reveal, the leaderboard and the podium |
| 📱 **Guests** | `/join/CODE` (scan the QR on the TV) | Name and avatar, then big answer buttons |
| 🎂 **Birthday person** | `/birthday/CODE?token=…` (secret link) | The question and her answers. She never sees what guests picked |
| 🎛️ **Host** | `/admin/CODE?token=…` (secret link) | All the controls, the question editor, photos, settings and test mode |

Everything is in Hebrew, right to left, with large text and big buttons.

---

## Contents

1. [What you need](#1-what-you-need)
2. [Create the Supabase project (the database)](#2-create-the-supabase-project-the-database)
3. [Create the tables (run the migration)](#3-create-the-tables-run-the-migration)
4. [Deploy to Vercel](#4-deploy-to-vercel)
5. [Start a new game](#5-start-a-new-game)
6. [Prepare the game: photo, questions and settings](#6-prepare-the-game-photo-questions-and-settings)
7. [Rehearse alone with test mode](#7-rehearse-alone-with-test-mode)
8. [On the day: which link goes where](#8-on-the-day-which-link-goes-where)
9. [Running the game (host buttons)](#9-running-the-game-host-buttons)
10. [If something breaks during the party](#10-if-something-breaks-during-the-party)
11. [Running it on your own computer (optional)](#11-running-it-on-your-own-computer-optional)
12. [Decisions I made](#12-decisions-i-made)
13. [How it works (for developers)](#13-how-it-works-for-developers)

---

## 1. What you need

- A free **Supabase** account: <https://supabase.com>. This is the database, live updates and photo storage.
- Your **Vercel** account: <https://vercel.com>. This hosts the website.
- This code in a **GitHub** repository that Vercel can see (it already is).

Allow about 20 minutes the first time.

## 2. Create the Supabase project (the database)

1. Go to <https://supabase.com/dashboard> and click **New project**.
2. Give it a name (e.g. `not-kahoot`) and choose a database password. Save the password somewhere, although you won't need it for this app.
3. **Region:** pick the one closest to where the party is (for Israel, *Central EU (Frankfurt)* works well).
4. Click **Create new project** and wait about a minute until it's ready.

## 3. Create the tables (run the migration)

The app's tables, security rules, live updates and photo storage are all defined in one file: `supabase/migrations/20261026000000_init.sql`. You don't create anything by hand.

**The easiest way (no tools needed):**

1. In your Supabase project, open **SQL Editor** in the left menu and click **New query**.
2. Open [`supabase/migrations/20261026000000_init.sql`](supabase/migrations/20261026000000_init.sql) on GitHub, click **Raw**, then select all and copy.
3. Paste it into the SQL Editor and click **Run**. You should see *"Success. No rows returned"*.

That's it. Run it **once** per Supabase project.

<details>
<summary>Alternative for developers: Supabase CLI</summary>

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```
</details>

**Get the keys you'll need next.** In Supabase, open **Project Settings → API** (on newer dashboards: **Project Settings → API Keys** and **Data API**) and copy:

| What Supabase calls it | Where it goes |
| --- | --- |
| Project URL (looks like `https://abcd.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key, or the **Publishable** key (`sb_publishable_…`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key, or a **Secret** key (`sb_secret_…`) | `SUPABASE_SERVICE_ROLE_KEY` ⚠️ keep this private |

## 4. Deploy to Vercel

1. In Vercel, click **Add New… → Project** and import this GitHub repository.
2. Vercel will recognise it as Next.js. Don't change the build settings.
3. Open **Environment Variables** and add these five (see `.env.example`):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | the Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon / publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | the service_role / secret key |
   | `HOST_PASSWORD` | any password you choose. You'll type it to create games |
   | `APP_BASE_URL` | leave empty for now |

4. Click **Deploy** and wait for it to finish. You'll get an address like `https://not-kahoot-xyz.vercel.app`.
5. *(Recommended)* Go to **Settings → Environment Variables**, set `APP_BASE_URL` to that address (no trailing `/`), then **Deployments → ⋯ → Redeploy**. This makes the QR code and links use the right address.
6. *(Optional, for speed)* In **Settings → Functions → Function Region**, choose the region closest to your Supabase project (e.g. Frankfurt `fra1`).

> Whenever you change an environment variable in Vercel, you must **redeploy** for it to take effect.

## 5. Start a new game

1. Open your site's home page (e.g. `https://not-kahoot-xyz.vercel.app`).
2. Open **"מארחים? יצירת משחק חדש"** (Hosts? Create a new game).
3. Type the birthday person's name, choose female/male (Hebrew grammar adapts), and enter your `HOST_PASSWORD`.
4. Click **יצירת משחק**. You land on the **host page**. **Bookmark it.** That link is your key to the game, and every other link is listed on it.

Each new game starts with 8 sample questions in Hebrew, so you can try it straight away.

*(Developers can also run `npm run seed`, which prints all the links.)*

## 6. Prepare the game: photo, questions and settings

Everything is on the host page, in the tabs along the top.

**הגדרות (Settings)**
- **The birthday photo:** upload it once and it appears everywhere (lobby, intro, reveal, finale, and as a small portrait in the corner). It's shown in a clean round frame and is never filtered or altered. Any photo from your phone works, because it's shrunk automatically before upload.
- Title, name, age, birthday date.
- **How many questions to play** (empty = all active questions).
- **Show the leaderboard every X questions** (0 = only when you press the button).
- **Sounds on the TV** (off by default).
- **Allow joining mid-game** (late guests start at 0 points).

**שאלות (Questions)**
- **➕ שאלה חדשה** adds a question: the text plus 2 to 4 answers.
- **עריכה** edits, **מחיקה** deletes (it asks first), and **השבתה / הפעלה** deactivates or activates a question without deleting it.
- **↑ ↓** reorders. Questions are played in this order.
- **📷 הוספת תמונה** adds an optional photo for that question.
- Delete or replace the sample questions with your own.

**תמונות (Photo library)**
- Upload many family photos at once. Questions without their own photo get a library photo: shuffled, with no repeats until the library runs out. The photos are chosen once, when the game starts, so they don't change if someone refreshes.

## 7. Rehearse alone with test mode

On the host page, open **בדיקה (Test)**:

1. **יצירת 8 שחקני בדיקה** creates fake players with random names and emoji.
2. Open the TV link in another tab, then press **Start** on the **משחק** tab.
3. On each question, press **שחקני הבדיקה עונים עכשיו** (fake players answer at random) and **תשובה אקראית בשם החוגגת** (a random birthday answer). Or open the birthday link on your phone and answer for real.
4. Play through to the podium.
5. **When you're done:** press **מחיקת שחקני הבדיקה** (delete test players), then **איפוס המשחק** (reset game) on the **משחק** tab. Reset keeps your questions, photos and settings. It only clears answers and scores.

> Tip: if you tested with your own phones as guests, use **הוצאת כל השחקנים** (remove all players) before the party so the lobby starts empty.

## 8. On the day: which link goes where

All links are on the host page under **קישורים** (Links), each with a copy button:

- 📺 **TV:** open the **מסך הטלוויזיה** link on the computer or smart TV connected to the big screen. Press `F11` for full screen. If you turned sounds on, click the screen once (browsers only allow sound after a click).
- 📱 **Guests:** they scan the QR code on the TV, or open **הצטרפות לאורחים**. No accounts or passwords. They type a name and can take a selfie or pick an emoji.
- 🎂 **Birthday person:** send her **only** the **הקישור הסודי של החוגגת** link, or let her scan the small QR code under it from your phone.
- 🎛️ **You (host):** keep the admin link to yourself. It works best on your phone.

## 9. Running the game (host buttons)

The big gold button always shows the next sensible step, so you can simply keep pressing it:

1. **▶ התחלת המשחק** (Start): the TV shows a short intro with the rules.
2. **פתיחת שאלה** (Open question): everyone sees the question. The TV shows "6 of 10 answered", but never which answers were picked.
3. **סגירת ההצבעה** (Close voting).
   - If she hasn't answered yet, the button says **מחכים לחוגגת…** (waiting for the birthday girl) and the reveal is blocked. Her phone gently says "everyone is waiting for you 😊". As soon as she locks her answer, you can reveal.
4. **✨ חשיפה** (Reveal): a 3-2-1 countdown on the TV, then her answer(s) with her photo, then "7 of 10 knew her". Phones show confetti and "+1", or a gentle sad face with what she chose.
5. **הצגת תוצאות** (Show results): a bar chart of how everyone voted, with her answer(s) in gold.
6. **הבא** (Next): goes to the next question. It shows the leaderboard first when one is due, and goes to the finale after the last question.

Other buttons: **טבלת מובילים** (show the leaderboard now), **הקודם** (go back to the previous question's results), **סיום המשחק** (end now and go to the finale), **איפוס המשחק** (back to the lobby), **מחיקת תשובות השאלה** (clear guests' answers to the current question, before its reveal), **הוצאה** (kick a player; their phone returns to the join screen and they can rejoin under a new name), and the 🔇/🔊 sound toggle.

**The finale:** a pause, *"The person who knows her best is…"*, the winner with confetti, then a podium with cartoon figures wearing each player's photo or emoji as their face, plus the full ranking. Ties share a place. Every phone shows its own place too.

## 10. If something breaks during the party

Nothing is stored on the phones except "who am I", so **refreshing any screen is always safe.** Every screen reloads the real state from the database.

| Problem | What to do |
| --- | --- |
| A screen looks stuck | Refresh the page. It comes back to exactly where the game is. |
| A guest closed the browser or the phone restarted | Open the same join link again on the same phone. They're still in, with the same name and score. |
| A guest is on a different phone, or cleared the browser | They join again with a slightly different name (the old name stays taken). Or kick the old one first, then they can reuse the name. |
| Wi-Fi dropped | A small "מתחברים מחדש…" (reconnecting) bubble appears, and everything resyncs automatically when the connection returns. |
| The TV shows the wrong address in the QR code | Set `APP_BASE_URL` in Vercel and redeploy (see step 4). |
| Reveal is greyed out | She hasn't locked her answer yet. Check her phone. In an emergency, the Test tab can give a random answer for her. |
| She locked the wrong answer | Locked answers can't change (that's the fairness rule). Move on with **הבא**, or use **איפוס המשחק** to start over. |
| Someone joined with a silly name | **הוצאה** (kick) next to their name. |
| No sound on the TV | Make sure 🔊 is on in the host page, then click once anywhere on the TV screen. |
| The host phone died | Open the admin link on any other device. Nothing is lost. |
| "Couldn't find the game" | Check the code in the link. Codes are 6 letters/digits. |
| "This link is invalid" on the host or birthday page | The token part of the link was cut off. Copy it again from the host page. |
| Nothing updates live at all | In Supabase, check **Realtime → Settings** and make sure public channels are allowed (this is the default). Then refresh. |

## 11. Running it on your own computer (optional)

You need [Node.js 20+](https://nodejs.org).

```bash
npm install
cp .env.example .env.local       # then fill in the values (see step 3)
npm run dev                      # open http://localhost:3000
npm run seed                     # creates a demo game and prints its links
```

To test with real phones on your home Wi-Fi, set `APP_BASE_URL=http://YOUR-COMPUTER-IP:3000` in `.env.local`.

**Fully local database (developers, needs Docker):** `npx supabase start` runs Supabase on your machine and applies the migration. It prints a local URL and keys for `.env.local`.

**Checks:**

```bash
npm run typecheck     # TypeScript
npm run lint          # ESLint
npm test              # unit tests: state machine and scoring
npx playwright install chromium   # once
npm run test:e2e      # full game in real browsers: TV, host, birthday person and 3 guests
```

`test:e2e` needs `npm run dev` running and `HOST_PASSWORD` set. It plays a whole game and checks the fairness rules, the live updates, refresh, kick and rejoin, late join, and the finale. Set `SHOTS=./shots` to also save screenshots.

## 12. Decisions I made

The brief said to choose sensibly and write it down. Here's what I chose:

- **An extra `INTRO` state.** I added `INTRO` between `LOBBY` and the first question, for the intro transition the brief asks for. All the other states are exactly as specified.
- **Reveal and results are two steps.** `REVEAL` is the dramatic part (countdown → her answer with her photo → "N of M knew her" + confetti). `RESULTS` is the calmer bar chart, so the host controls the pacing.
- **Reveal straight from an open question.** Once she has locked her answer, the host may press Reveal while voting is still open, and voting closes as part of the reveal. This saves a tap. Closing first works as usual.
- **Previous** goes back to the previous question's results (or its closed state) and never re-opens voting by itself. **Next** from there returns to where you were.
- **The leaderboard is never shown after the last question**, because it would spoil the finale. The finale goes straight to the winner.
- **Ties use "dense" ranking:** 5, 5, 4 points are places 1, 1, 2. That's friendlier for a family game, and it means the podium always has a 2nd place if anyone scored less than the winners. Tied players stand together on the same podium block (up to 3 figures, then "+N").
- **If nobody scored at all**, the finale says "everyone wins today 💛" instead of crowning anyone.
- **Streaks:** a 🔥 badge appears after 3 or more correct answers in a row.
- **Gender setting:** Hebrew is gendered, so the birthday person can be set to female or male and all texts adapt (היא בחרה / הוא בחר). The sample questions come in both versions.
- **Kicked players** are marked as removed rather than deleted, so their phone knows it was kicked and shows a friendly message. Their name becomes free again. **Remove all players** deletes players completely, which is meant for clearing test runs.
- **Players who left** (kicked) don't count in "N answered", in the chart, or in the scores.
- **Editing questions during a game** is allowed, but a running game keeps the version it started with. Questions are copied into the game at Start, so an edit can never break answers that were already given. Changes apply after a reset.
- **Photos** are stored in a public-read Supabase bucket under random, unguessable file names. Uploads only go through the server. This keeps the TV fast. Question photos are always shown whole (never cropped). Avatars use a clean circular crop.
- **Image handling:** photos are shrunk in the browser to 800px on the long side and saved as WebP (or JPEG on older devices) at quality 0.8. The server rejects anything over 2.5 MB and checks the actual file bytes, not just the file name. iPhone HEIC photos are converted by the phone when picked from the browser.
- **Live updates:** browsers listen to a Supabase Realtime signal for their game. On every change, each screen re-fetches *its own filtered view* from the server. Screens also resync on reconnect, when a phone wakes up, and through a slow 15-second safety check in case a signal is ever missed. The safety check is a backup; Realtime drives the game.
- **Who's connected:** the host page uses Realtime Presence to show which guests, the TV and the birthday person are online right now.
- **Sounds** are synthesized in the browser (no audio files). They play only on the TV, only when enabled, and only after a click.
- **Creating games from the website** requires `HOST_PASSWORD`. If it isn't set, use `npm run seed`.
- **Answer labels** on every screen use the Hebrew letters א ב ג ד, so guests can match the TV to their phone.
- **The host doesn't see the answers before the reveal** either: only who answered, and whether she answered, not what. The host might be playing too.

## 13. How it works (for developers)

**Stack:** Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase (Postgres, Realtime, Storage), Motion for animation, `qrcode`, `canvas-confetti`.

```
supabase/migrations/   SQL: tables, RLS, realtime pulse, atomic game functions, storage bucket
scripts/seed.ts        creates a demo game and prints its links
scripts/e2e.mjs        Playwright end-to-end test of a full game
src/lib/               shared, framework-free code
  strings.ts           ALL Hebrew UI text (edit here)
  state-machine.ts     game state machine (used by server and host UI)
  scoring.ts           points, ranks (ties), streaks, vote distribution
  types.ts             snapshot types per role
src/server/            server-only code (service-role key)
  snapshots.ts         builds each role's filtered view: the fairness rules live here
  control.ts           runs host actions through the state machine
  players.ts, content.ts, images.ts, test-mode.ts, games.ts
src/app/api/games/…    route handlers (all reads and writes go through these)
src/hooks/useLiveGame  realtime subscription + resync + presence
src/components/        UI per surface: screen/, guest/, birthday/, admin/, finale/, ui/
```

**Security model**

- **The database is closed to browsers.** Every table has Row Level Security enabled with no policies for the public roles, and table privileges are revoked as well. The anon key cannot read or write any game data. The only exception is `game_pulse`, a per-game change counter with no content, which browsers subscribe to for live updates.
- **All writes go through server routes** using the service-role key, which is only ever read in `src/server/` and never sent to the browser.
- **Host and birthday links** carry a 256-bit random token, compared in constant time on every request. Guests get their own secret token when they join, stored only as a SHA-256 hash in the database. Every answer is attributed from that token, so nobody can answer for someone else.
- **Fairness is enforced on the server.** The birthday view never includes guest answers, counts, results or scores (only the winner's name at the very end). The TV and guest views never include her answer before the reveal, and the vote distribution only appears after it. Scores are computed on the server from answers and revealed rounds. There is no stored score column anyone could change.
- **Every state transition is validated server-side** by `state-machine.ts` and applied atomically in Postgres (`apply_transition`, `start_game`, `birthday_lock`, `submit_answer`) with a version check. Double-clicks or two host phones can't skip a step, an answer can't land after voting closes, and a reveal is impossible before her answer exists. These functions can only be executed by the service role.
- **Hardening headers:** `Referrer-Policy: no-referrer` (secret links never leak), `X-Frame-Options: DENY`, and `nosniff`.
