# Event Quiz 🎉

**"Who knows the star of the night best?"** A party quiz that everyone plays from their phone, in Hebrew or English.

You make a quiz about the **star** of your event: the birthday person, the couple, the kid, the parents-to-be. At the party, the star secretly answers each question on their phone. Every guest answers the same question on their own phone and tries to guess what the star picked. The TV reveals the answer, everyone who matched gets a point, every few questions there's a funny race to the top, and at the end a podium shows who knows the star best.

| Who | Opens | What they see |
| --- | --- | --- |
| 🎛️ **Host** | the website → sign in with Google → **My quizzes** | All quizzes, the links to send, and each quiz's control page |
| 📺 **TV** | `/screen/CODE` | Lobby with QR code + link + code, the questions, the reveals, the leaderboard shows and the podium |
| 📱 **Guests** | `/join/CODE` (scan the QR on the TV) | Name and selfie or emoji, big answer buttons, emoji reactions to the TV |
| 🌟 **The star** | `/star/CODE?token=…` (secret link) | The question and their answers. They never see what guests picked |

**Templates** set the look, the fonts, the decorations, the confetti and the starter questions: 🎂 Birthday · 🎈 Kid's birthday · 🦖 Kids · 💍 Wedding · ✡️ Bar / Bat Mitzvah · 🍼 Baby shower · 🥂 Anniversary · 🪩 Party / any event.

---

## Contents

1. [One-time setup: database and website](#1-one-time-setup-database-and-website)
2. [Turn on "Sign in with Google"](#2-turn-on-sign-in-with-google)
3. [Turn on the AI quiz builder (Gemini, free)](#3-turn-on-the-ai-quiz-builder-gemini-free)
4. [Making a quiz](#4-making-a-quiz)
5. [On the day](#5-on-the-day)
6. [If something breaks during the party](#6-if-something-breaks-during-the-party)
7. [Running it on your own computer](#7-running-it-on-your-own-computer)
8. [Decisions I made](#8-decisions-i-made)
9. [How it works (for developers)](#9-how-it-works-for-developers)

---

## 1. One-time setup: database and website

You need free accounts on **Supabase** (database, sign-in, live updates, photos) and **Vercel** (hosting), and this code on GitHub.

**Database.** Create a Supabase project, then open **SQL Editor → New query** and run each file in [`supabase/migrations/`](supabase/migrations/) **in order of their names** (open the file on GitHub → **Raw** → copy → paste → **Run**). Each should say *"Success. No rows returned"*. Developers can instead run `npx supabase link --project-ref …` and `npx supabase db push`.

**Keys.** In Supabase, **Project Settings → API Keys / Data API**:

| Supabase calls it | Environment variable |
| --- | --- |
| Project URL (`https://abcd.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / **Publishable** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / **Secret** key | `SUPABASE_SERVICE_ROLE_KEY` ⚠️ private |

**Website.** In Vercel, import the GitHub repository, add those three variables plus `APP_BASE_URL` (your site's address, no trailing `/`), and deploy. Whenever you change a variable in Vercel, **redeploy** for it to take effect. The server region is in `vercel.json` (`sin1`, next to this project's Supabase); pick the region closest to your Supabase project.

## 2. Turn on "Sign in with Google"

Hosts sign in with Google to create and keep their quizzes. Guests, the TV and the star never need an account. This takes about 10 minutes, once.

**A. Google Cloud: create the sign-in client**

1. Go to <https://console.cloud.google.com>, sign in, and create a project (top bar → project picker → **New project**, name it e.g. *Event Quiz*).
2. Open **APIs & Services → OAuth consent screen** (newer consoles call it **Google Auth Platform → Branding / Audience**):
   - App name: *Event Quiz*. User support email and developer contact: your email.
   - Audience: **External**.
   - Under **Audience**, click **Publish app** so anyone with a Google account can sign in (not only test users). The app only asks for name, email and profile picture, so Google doesn't require a review.
3. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins:** your site, e.g. `https://not-kahoot-topaz.vercel.app`.
   - **Authorized redirect URIs:** `https://YOUR-PROJECT.supabase.co/auth/v1/callback` (your Supabase Project URL + `/auth/v1/callback`).
   - Click **Create** and copy the **Client ID** and **Client secret**.

**B. Supabase: connect it**

1. **Authentication → Sign In / Providers → Google:** turn it on, paste the Client ID and Client secret, **Save**.
2. **Authentication → URL Configuration:**
   - **Site URL:** your site, e.g. `https://not-kahoot-topaz.vercel.app`.
   - **Redirect URLs:** add `https://not-kahoot-topaz.vercel.app/**` (and `http://localhost:3000/**` if you develop locally).

Done. Open the site and click **Sign in with Google**.

> Quizzes made before accounts existed can be added to your list: open their admin link while signed in and press **Add to my quizzes**, or paste the admin link at the bottom of **My quizzes**.

## 3. Turn on the AI quiz builder (Gemini, free)

The 🤖 builder chats with you (what's the event, who's the star, who's the crowd, what kind of questions, how many) and then writes up to 30 questions plus a practice question. You untick what you don't want and create the quiz, or add them to an existing quiz from its **Questions** tab. It uses Google's **Gemini API on the free tier**.

1. Go to **<https://aistudio.google.com/apikey>** and sign in with a Google account.
2. Click **Create API key**. Choose **Create API key in new project** (or pick a project you made for this). Copy the key.
3. **Make sure it stays free:** do **not** click *Set up billing* / *Upgrade* in AI Studio, and don't link a billing account to that Google Cloud project. Without billing, the key can only use the free tier, so you can never be charged. AI Studio shows the project's plan as **Free** next to the key.
4. In **Vercel → your project → Settings → Environment Variables**, add `GEMINI_API_KEY` with the key (for Production and Preview). Then **Deployments → ⋯ → Redeploy**.
5. Optional: `GEMINI_MODEL` picks the model. The default `gemini-flash-latest` always points to Google's newest Flash model, which is on the free tier. You can set a specific free model name, e.g. `gemini-2.5-flash`.

Good to know:

- The free tier has a per-minute and per-day request limit (see your project's **Rate limit** page in AI Studio). When Google's limit is reached, the builder says to try again later. On top of that, the app allows each host **60 builder messages a day** (`AI_DAILY_LIMIT` in `src/server/ai.ts`), so one person can't use up the shared quota.
- On the free tier, Google may use what's typed into the builder to improve its products. The builder shows a reminder not to type sensitive details.
- The key lives only on the server. Browsers never see it.

## 4. Making a quiz

Sign in and open **My quizzes**. The first time, a short walkthrough explains everything (reopen it with **❓ How it works**).

**➕ New quiz**: either let the **🤖 AI** write it, or pick a template, the quiz language (Hebrew or English), the star's name and how to refer to them (she / he / they for a couple or group; Hebrew grammar follows). Every new quiz starts with sample questions and a **practice question** that fit the event.

Each quiz card on **My quizzes** has **⚙️ Manage** (the control page) and **🔗 Links to send** (TV, guests with a WhatsApp button, and the star's secret link).

On the control page:

- **Questions:** add (2–4 answers each), edit, reorder, turn off, delete, add a photo. **🎯 Practice question:** one question can be the practice round. It's always asked first and never counts. **🤖 AI builder** and **💡 Question ideas** (one tap adds a ready question for this event) are below the list.
- **Photos:** upload many family photos at once. Questions without their own photo get one from the library, shuffled, without repeats.
- **Settings:** event type (switch the whole look anytime), language, title, the star's name, pronoun and photo, how many questions to play, how often the leaderboard show appears, TV sounds, late joining.
- **Test:** fake players that answer at random, so you can rehearse alone. Afterwards delete them and **Reset** (keeps questions, photos and settings).

## 5. On the day

- 📺 **TV:** open the TV link on the computer or smart TV connected to the screen (`F11` for full screen; click once if sounds are on). The lobby shows the QR code, the link and the game code.
- 📱 **Guests:** scan the QR code, or open the guest link (send it on WhatsApp from the Links section). Name + selfie or emoji, no accounts.
- 🌟 **The star:** send them only their secret link.
- 🎛️ **You:** keep the control page on your phone and keep pressing the big button: Start → practice round → open question → close voting → ✨ reveal (3-2-1, the star's answer, how many knew, a cheeky one-liner) → results chart → next.
- **Every few questions** the TV puts on a little show. A different mix each time: one of four openers (starting lights, a bowling strike, a drumroll, a balloon that pops), then either a running race or rockets flying to the moon, where how far each player's character gets is their score. The leader gets a crown, last place gets a gentle comic moment.
- **Reactions:** while watching the TV, guests can tap 😂 ❤️ 🎉 😮 👏 🔥 and they float up the side of the TV with their name.
- **The finale:** "the one who knows them best is…", the winner with confetti in the template's colors, a podium of cartoon figures with each player's face, and the full ranking.

## 6. If something breaks during the party

Refreshing any screen is always safe: every screen reloads the real state from the database.

| Problem | What to do |
| --- | --- |
| A screen looks stuck | Refresh it. |
| A guest's phone restarted | Open the same join link on the same phone: same name, same score. |
| A guest is on a different phone | They join again with a slightly different name (or kick the old one first). |
| Wi-Fi dropped | A "reconnecting" bubble appears and everything resyncs automatically. |
| Reveal is greyed out | The star hasn't locked their answer. The Test tab can answer randomly for them in an emergency. |
| No sound on the TV | Turn 🔊 on in the control page, then click once on the TV. |
| The host phone died | Sign in on any device and open the quiz from My quizzes. |
| "Sign in with Google" fails | Check section 2: the redirect URI in Google, and Site URL / Redirect URLs in Supabase. |
| The AI builder says it isn't connected | `GEMINI_API_KEY` is missing in Vercel, or you didn't redeploy after adding it. |

## 7. Running it on your own computer

You need [Node.js 20+](https://nodejs.org) and, for a local database, Docker.

```bash
npm install
npx supabase start           # local Supabase; prints the local URL and keys for .env.local
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
npm run seed                 # a demo quiz (not owned by anyone) and its links
```

Set `AI_MOCK=1` in `.env.local` to try the AI builder without a Gemini key (a scripted chat; development only).

**Checks:**

```bash
npm run typecheck && npm run lint
npm test                 # state machine, scoring, templates, translations, AI output cleaning
npm run test:e2e         # a full game in real browsers (needs npm run dev and the local Supabase)
```

The end-to-end test signs the host in as a local test user (`scripts/test-session.mjs`, which refuses to run against anything but a local Supabase).

## 8. Decisions I made

- **Accounts only for hosts.** Google sign-in owns the dashboard; each quiz is still controlled by its secret admin link, so a co-host can help without an account, and quizzes made before accounts existed can be claimed.
- **Templates are themes, not separate apps.** Every template overrides the same color/font tokens, so all screens (TV, phones, admin) change together. Two templates (wedding, baby shower) are light; the rest are dark, which reads best on TVs.
- **One practice question per quiz,** always first, never scored and not counted in "question X of Y" or in the leaderboard rhythm.
- **Language and pronoun per quiz.** Hebrew and English share one dictionary shape (checked by a test); texts address the star by name and use she / he / they forms. Starter questions are written once with inflection markers, e.g. `{אוהבת|אוהב|אוהבים}`.
- **The leaderboard is a show,** chosen from 4 openers × 2 shows, picked from the question number so every screen (and a refresh) shows the same one.
- **AI output is never trusted:** it's parsed against a schema, trimmed, de-duplicated, capped at 30 questions and 2–4 answers, and the host reviews everything before it's saved.
- **Reactions** travel over Realtime broadcast only (nothing is stored), and the TV accepts only the six known emoji.
- **Everything from the original game still holds:** server-side state machine and scoring, the star never sees guests' answers, nobody sees the star's answer before the reveal, dense ranking for ties, streak badges, refresh-safe screens.

## 9. How it works (for developers)

**Stack:** Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, Supabase (Postgres, Auth, Realtime, Storage), Motion, `@supabase/ssr`, `qrcode`, `canvas-confetti`, Gemini API (REST).

```
supabase/migrations/     tables, RLS, realtime pulse, atomic game functions, owners/templates, AI usage
src/proxy.ts             refreshes the host's sign-in cookie
src/lib/                 framework-free code shared by server and browser
  strings.ts             ALL UI text, Hebrew + English
  templates.ts           templates: look, decorations, confetti, starter questions
  state-machine.ts, scoring.ts, ai-parse.ts, types.ts
src/server/              server-only (service-role key): snapshots (fairness), control, games, ai, auth…
src/app/                 pages: / (landing), /dashboard, /new, /admin, /screen, /join, /star; api/…
src/components/          site/ (landing, dashboard, wizard, AI builder, onboarding), screen/, guest/, birthday/, admin/, finale/, ui/
```

**Security model.** Every table has Row Level Security with no policies for browsers; all reads and writes go through server routes with the service-role key. The only browser-readable table is `game_pulse` (a change counter). Admin and star links carry 256-bit tokens compared in constant time; guests get their own token, stored hashed. Dashboard routes require a verified Supabase session; a quiz can only be deleted by its owner and only claimed with its admin token. State transitions are validated server-side and applied atomically with a version check. The Gemini key is server-only, and AI use is capped per user per day.
