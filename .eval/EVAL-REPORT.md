# EVAL REPORT — results CSV export (branch `eval/t2-plain`)

## What changed

| File | Purpose |
| --- | --- |
| `src/app/api/games/[code]/admin/export/route.ts` | New `GET /api/games/[code]/admin/export`. Uses the same auth as the other admin routes (`assertAdmin(game, bearer(req))`, so `Authorization: Bearer <admin token>`). Loads the game with `loadBundle` (which already leaves out kicked players), builds the CSV, and returns it with `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="not-kahoot-<CODE>-results.csv"` and `Cache-Control: no-store`. Errors use the existing JSON format (401 `unauthorized`, 404 `game_not_found`). |
| `src/lib/results-csv.ts` | Pure CSV builder (`buildResultsCsv`, `csvField`, `resultsCsvFilename`). It reuses `computeStandings` / `isCorrect` from `src/lib/scoring.ts`, so rank and score always match the leaderboard in the app (dense ranks, so tied players share a place, and the same Hebrew name order). The file starts with a UTF-8 BOM and uses CRLF line endings. Fields are quoted per RFC 4180. |
| `src/lib/results-csv.test.ts` | Unit tests for the builder. |
| `src/app/api/games/[code]/admin/export/route.test.ts` | Route tests: the real handler, `loadBundle` and `assertAdmin` run against an in-memory Supabase mock. They check 401 with no token, a wrong token or the birthday token; 404 for an unknown game; the BOM bytes, headers and filename; that kicked players are left out; and that codes are case-insensitive. |

No UI changes. Nothing in the quiz builder / question editor area was touched.

## Verification

- `npx vitest run` → **4 files, 24 tests passed** (the 2 existing files plus the 2 new ones).
- `npm run typecheck` → clean.
- `npm run lint` → clean.
- `NEXT_PUBLIC_SUPABASE_URL=http://x SUPABASE_SERVICE_ROLE_KEY=x npm run build` → success. The build lists `ƒ /api/games/[code]/admin/export`.
- **Real-server check.** Docker isn't running in this container, so local Supabase was not an option. Instead I ran `next start` on the production build against a small mock of the Supabase REST endpoint (`.eval/mock-supabase.mjs`) and called it with curl:
  - no token → `401 {"error":"unauthorized"}`
  - birthday token → `401`
  - unknown code → `404 {"error":"game_not_found"}`
  - admin token, lowercase code `party7` → `200`, `content-type: text/csv; charset=utf-8`, `content-disposition: attachment; filename="not-kahoot-PARTY7-results.csv"; filename*=UTF-8''not-kahoot-PARTY7-results.csv`. The first bytes are `ef bb bf`. The kicked player "מורחק" and the practice question are not in the file.
  - Python `csv.reader(..., encoding='utf-8-sig')` reads the file back correctly.
  - The file saved from that run is `.eval/sample-PARTY7-results.csv`:
    ```
    מקום,שם,ניקוד,1. מה המאכל האהוב עליה?,2. לאן היא הכי רוצה לטוס?,3. מה הצבע האהוב?
    1,דנה כהן,2,✓,✓,✗
    2,"Yossi, Jr.",1,✓,✗,
    3,סבתא,0,✗,,
    ```
- I did not open the file in Excel itself; there was no Excel here. The BOM bytes were checked as described above.

## Files produced

- `.eval/sample-PARTY7-results.csv`: sample export from the real-server check.
- `.eval/mock-supabase.mjs`: the throwaway Supabase REST mock used for that check. It is not part of the app.
- No screenshots, since there are no UI changes.

## Assumptions

1. **Which questions get a column:** only rounds that are **revealed** and **not practice**. These are exactly the rounds that count toward the score, so the ✓ marks always add up to the score column. A practice round never scores. An unrevealed round has no correct answer yet, so ✓/✗ can't be decided. If the export is made mid-game, the columns cover the questions revealed so far.
2. **Headers are in Hebrew** to match the app: `מקום` (rank), `שם` (name), `ניקוד` (score). Question columns are `"<n>. <question text>"`, numbered from 1 over the exported questions.
3. **Test players** made with "test mode" are included, the same as on the in-app leaderboard. Only kicked players are left out.
4. **Formula-injection guard:** a player name or question text that starts with `= + - @`, a tab or a CR gets a leading `'`, so Excel doesn't run it as a formula. Numbers are not changed.
5. **Filename:** `not-kahoot-<CODE>-results.csv`. The code is cut down to `[A-Za-z0-9]`, which game codes already are.
6. The route uses `GET` with a Bearer header, like the existing admin `GET`. A plain `<a href>` download can't send that header, so any future UI would need to fetch the file and save it as a blob. Query-string tokens were not added, to keep the auth the same as the other admin routes.

## Sub-agents

None: 0 sub-agents were used. All work was done in the main session.
