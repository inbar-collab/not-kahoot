# Eval report: streak length next to the 🔥 badge

## Finding
The feature was **already in the code** before this session, going back to the first commit (`5d4d217`).
The badge text is `streak: (n) => \`🔥 ${n} ברצף\`` in `src/lib/strings.ts:37` ("🔥 4 in a row").
That function is the only way the badge is ever rendered:
- TV leaderboard: `src/components/screen/LeaderboardStage.tsx:54`
- Guest phone, leaderboard state: `src/components/guest/GuestPlay.tsx:56`
- Guest phone, after the answer is revealed: `src/components/guest/GuestPlay.tsx:270`

All three render it only when `streak >= 3`, so the 3+ rule is already in place.
No other place in `src/` shows 🔥.
`streak` is a number (`Standing.streak` in `src/lib/types.ts`), worked out in `src/lib/scoring.ts`.

## What I changed
- I made no UI or logic changes, because none were needed.
- I added `src/lib/strings.test.ts`, a regression test. It checks that `s.streak(n)` starts with `🔥 n` for n = 3, 4 and 12, for both genders.
- I added this report and a screenshot.

## Verification
- `npm ci`: OK
- `npm test` (vitest): 3 files, 13 tests passed, including the new test
- `npm run typecheck` (tsc --noEmit): no errors
- `npx eslint src/lib/strings.test.ts src/components`: clean
- RTL rendering check: I used Playwright and Chromium to render a static mock of leaderboard rows in `dir="rtl"`, with streaks of 2, 3, 4 and 12.
  - The screenshot is at `.eval/streak-badge-rtl.png`.
  - The streak-2 row shows no badge. The other rows show "🔥 3 ברצף", "🔥 4 ברצף" and "🔥 12 ברצף", and the number sits next to the emoji with correct bidi order.
  - This was a standalone HTML mock, not the live app. Running the real app would need a local Supabase stack, and I judged that unnecessary because no code changed.

## Assumptions
- The existing "🔥 N ברצף" wording meets the request ("🔥 4"). I kept the Hebrew "in a row" suffix rather than cutting the text down to just "🔥 4".
- I did not touch the quiz builder or question editor.

## Sub-agents
None (0).
