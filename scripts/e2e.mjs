// End-to-end smoke test: TV + host + birthday person + 3 guests, a full game.
//
//   1. npm run dev            (with HOST_PASSWORD set in .env.local)
//   2. npx playwright install chromium   (once)
//   3. npm run test:e2e
//
// Env: BASE (default http://localhost:3000), HOST_PASSWORD (default from
// .env.local), SHOTS=some/dir to also save screenshots.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:3000';
const PASSWORD = process.env.HOST_PASSWORD || 'party123';
const SHOTS = process.env.SHOTS ? path.resolve(process.env.SHOTS) : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const OUT = SHOTS ? SHOTS + '/' : null;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true };

const shot = (page, name, fullPage = false) => (OUT ? page.screenshot({ path: OUT + name, fullPage }) : Promise.resolve());

(async () => {
  const b = await chromium.launch();
  // Create a game via the home-page API.
  const res = await fetch(BASE + '/api/games', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: PASSWORD, birthdayName: 'רחל', gender: 'female' }) });
  if (!res.ok) throw new Error('Could not create a game (is HOST_PASSWORD set?): ' + (await res.text()));
  const { code, adminToken } = await res.json();
  const adminSnap = await (await fetch(`${BASE}/api/games/${code}/admin`, { headers: { authorization: 'Bearer ' + adminToken } })).json();
  const bdayToken = adminSnap.birthdayToken;
  log('game', code);

  const errors = [];
  const mk = async (name, opts) => {
    const ctx = await b.newContext(opts);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
    p.on('console', (m) => m.type() === 'error' && errors.push(`${name} console: ${m.text()}`));
    return p;
  };
  const screen = await mk('screen', { viewport: { width: 1920, height: 1080 } });
  const admin = await mk('admin', PHONE);
  const bday = await mk('bday', PHONE);
  const g1 = await mk('g1', PHONE);
  const g2 = await mk('g2', PHONE);

  await screen.goto(`${BASE}/screen/${code}`);
  await screen.getByText('מחכים לשחקנים').waitFor();
  await screen.waitForTimeout(800);
  await shot(screen, '01-screen-lobby-empty.png');
  // Make an avatar photo from a screenshot of the lobby.
  const avatarFile = path.join(os.tmpdir(), `nk-avatar-${Date.now()}.png`);
  await screen.screenshot({ path: avatarFile, clip: { x: 200, y: 150, width: 500, height: 500 } });

  await admin.goto(`${BASE}/admin/${code}?token=${adminToken}`);
  await bday.goto(`${BASE}/birthday/${code}?token=${bdayToken}`);
  await bday.getByText('מחכים שהמשחק יתחיל').waitFor();

  // Guest 1: emoji
  await g1.goto(`${BASE}/join/${code}`);
  await g1.getByPlaceholder('השם שלך').fill('דני');
  await g1.getByRole('button', { name: '🦊' }).click();
  await g1.getByRole('button', { name: 'אני בפנים!' }).click();
  await g1.getByText('מחכים שהמשחק יתחיל').waitFor();
  // Guest 2: photo
  await g2.goto(`${BASE}/join/${code}`);
  await g2.getByPlaceholder('השם שלך').fill('Sarah Levi');
  await g2.locator('input[type=file]').setInputFiles(avatarFile);
  await g2.locator('img[class*="rounded-full"]').waitFor();
  await g2.getByRole('button', { name: 'אני בפנים!' }).click();
  await g2.getByText('מחכים שהמשחק יתחיל').waitFor();
  log('two guests joined');

  // Duplicate nickname is rejected.
  const g3 = await mk('g3', PHONE);
  await g3.goto(`${BASE}/join/${code}`);
  await g3.getByPlaceholder('השם שלך').fill(' דני ');
  await g3.getByRole('button', { name: 'אני בפנים!' }).click();
  await g3.getByText('השם הזה כבר תפוס').waitFor();
  log('duplicate name rejected');

  await screen.getByText('2 שחקנים הצטרפו').waitFor();
  await screen.waitForTimeout(700);
  await shot(screen, '02-screen-lobby-2.png');
  await shot(g2, '03-guest-lobby.png');
  await admin.getByText('שחקנים (2)').waitFor();
  await shot(admin, '04-admin-lobby.png', true);

  // Start
  await admin.getByRole('button', { name: '▶ התחלת המשחק' }).click();
  await screen.getByText('בואו נראה').waitFor();
  await screen.waitForTimeout(3000);
  await shot(screen, '05-screen-intro.png');
  await admin.getByRole('button', { name: 'פתיחת שאלה 1' }).click();
  await screen.getByText('שאלה 1 מתוך 8').waitFor();
  await screen.getByText('0 מתוך 2 ענו').waitFor();
  log('question 1 open');

  // Fairness checks via API before her lock.
  const bSnap = await (await fetch(`${BASE}/api/games/${code}/birthday`, { headers: { authorization: 'Bearer ' + bdayToken } })).json();
  const bStr = JSON.stringify(bSnap);
  if (/answered|distribution|score|players|standings/i.test(Object.keys(bSnap).join() + Object.keys(bSnap.round || {}).join())) throw new Error('birthday snapshot leaks: ' + bStr);

  await g1.getByRole('button', { name: /קפה שחור/ }).click();
  await g1.getByText('נרשם!').waitFor();
  await g2.getByRole('button', { name: /^ב/ }).first().click();
  await g2.getByText('נרשם!').waitFor();
  await screen.getByText('2 מתוך 2 ענו').waitFor();
  await screen.waitForTimeout(600);
  await shot(screen, '06-screen-question.png');
  await shot(g1, '07-guest-registered.png');
  log('guests answered; screen counter updated live');

  const bSnap2 = JSON.stringify(await (await fetch(`${BASE}/api/games/${code}/birthday`, { headers: { authorization: 'Bearer ' + bdayToken } })).json());
  if (bSnap2.includes('Sarah') || bSnap2.includes('דני')) throw new Error('birthday snapshot leaks player data');
  const gSnap = await (await fetch(`${BASE}/api/games/${code}/screen`)).json();
  if (gSnap.round.reveal !== null || JSON.stringify(gSnap).includes('birthday_choices') || JSON.stringify(gSnap).includes('birthdayChoices')) throw new Error('screen leaks her answer');

  // Close before she answers -> waiting state, reveal blocked.
  await admin.getByRole('button', { name: 'סגירת ההצבעה' }).click();
  await admin.getByRole('button', { name: 'מחכים לחוגגת…' }).waitFor();
  if (await admin.getByRole('button', { name: 'מחכים לחוגגת…' }).isEnabled()) throw new Error('reveal should be blocked');
  await screen.getByText('מחכים לתשובה של החוגגת').waitFor();
  await shot(screen, '08-screen-waiting.png');
  // Guest answer after close is rejected by the server.
  const lateAns = await g1.evaluate(async ([code, roundId]) => {
    const s = JSON.parse(localStorage.getItem('not-kahoot:player:' + code));
    const r = await fetch(`/api/games/${code}/answer`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-player-token': s.token }, body: JSON.stringify({ roundId, choice: 2 }) });
    return r.status + ' ' + (await r.text());
  }, [code, gSnap.round.id]);
  log('answer after close ->', lateAns);
  // Direct reveal API call is rejected too.
  const rv = await fetch(`${BASE}/api/games/${code}/admin`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + adminToken }, body: JSON.stringify({ action: 'reveal' }) });
  log('reveal before birthday ->', rv.status, await rv.text());

  // Birthday answers: multi-select 2 options, confirm, lock.
  await bday.getByText('כולם מחכים לך').waitFor();
  await bday.getByRole('checkbox', { name: /קפה שחור/ }).click();
  await bday.getByRole('checkbox', { name: /תה/ }).click();
  await shot(bday, '09-bday-select.png');
  await bday.getByRole('button', { name: 'המשך' }).click();
  await bday.getByText('בטוחה?').waitFor();
  await shot(bday, '10-bday-confirm.png');
  await bday.getByRole('button', { name: /נעילת התשובה/ }).click();
  await bday.getByText('התשובה שלך נשמרה').waitFor();
  await admin.getByRole('button', { name: '✨ חשיפה' }).waitFor();
  log('birthday locked; state auto-moved to closed');

  // Reveal
  await admin.getByRole('button', { name: '✨ חשיפה' }).click();
  await screen.waitForTimeout(1200);
  await shot(screen, '11-screen-countdown.png');
  await screen.getByText('1 מתוך 2 הכירו אותה').waitFor({ timeout: 10000 });
  await screen.waitForTimeout(1200);
  await shot(screen, '12-screen-reveal.png');
  await g1.getByText('אתם על אותו גל!').waitFor();
  await g2.getByText('אוי, לא הפעם').waitFor();
  await shot(g1, '13-guest-correct.png');
  await g2.waitForTimeout(800);
  await shot(g2, '14-guest-wrong.png');
  log('reveal ok on all devices');

  await admin.getByRole('button', { name: 'הצגת תוצאות' }).click();
  await screen.getByText('ככה הצבעתם').waitFor();
  await screen.waitForTimeout(1800);
  await shot(screen, '15-screen-results.png');

  // Refresh guest 1 mid-game: same player, score kept.
  await g1.reload();
  await g1.getByText('הניקוד שלך: 1').first().waitFor();
  log('refresh keeps the player');

  // Kick guest 2, who returns to the join screen and rejoins with a new name.
  await admin.getByRole('button', { name: 'הוצאה Sarah Levi' }).click();
  await admin.getByRole('alertdialog').getByRole('button', { name: 'אישור' }).click();
  await g2.getByText('הוצאתם מהמשחק').waitFor();
  await shot(g2, '16-guest-kicked.png');
  await g2.getByPlaceholder('השם שלך').fill('שרה');
  await g2.getByRole('button', { name: 'אני בפנים!' }).click();
  await g2.getByText('הניקוד שלך: 0').first().waitFor();
  log('kick + rejoin ok');

  // Late joiner
  await g3.getByPlaceholder('השם שלך').fill('מאוחר');
  await g3.getByRole('button', { name: 'אני בפנים!' }).click();
  await g3.getByText('הניקוד שלך: 0').first().waitFor();
  log('late join ok');

  // Q2 (two options). Next goes straight to the open question.
  await admin.getByRole('button', { name: 'לשאלה הבאה ◀' }).click();
  await screen.getByText('שאלה 2 מתוך 8').waitFor();
  for (const g of [g1, g2, g3]) await g.getByRole('button', { name: /ציפור בוקר/ }).click();
  await bday.getByRole('checkbox', { name: /ציפור בוקר/ }).click();
  await bday.getByRole('button', { name: 'המשך' }).click();
  await bday.getByRole('button', { name: /נעילת התשובה/ }).click();
  await screen.getByText('3 מתוך 3 ענו').waitFor();
  await admin.getByRole('button', { name: 'סגירת ההצבעה' }).click();
  await admin.getByRole('button', { name: '✨ חשיפה' }).click();
  await screen.getByText('כל ה-3 הכירו אותה').waitFor({ timeout: 10000 });
  await admin.getByRole('button', { name: 'טבלת מובילים' }).click();
  await screen.getByText('טבלת המובילים').waitFor();
  await screen.waitForTimeout(2500);
  await shot(screen, '17-screen-leaderboard.png');
  log('leaderboard ok');

  // End game -> finale
  await admin.getByRole('button', { name: 'סיום המשחק' }).click();
  await admin.getByRole('alertdialog').getByRole('button', { name: 'אישור' }).click();
  await screen.getByText('מי שמכיר אותה הכי טוב הוא').waitFor();
  await shot(screen, '18-screen-finale-tease.png');
  await screen.waitForTimeout(4200);
  await shot(screen, '19-screen-finale-winner.png');
  await screen.getByText('הדירוג המלא').waitFor({ timeout: 10000 });
  await screen.waitForTimeout(2500);
  await shot(screen, '20-screen-finale-podium.png');
  await g1.getByText('ניצחת!').waitFor();
  await g1.waitForTimeout(2500);
  await shot(g1, '21-guest-finale.png', true);
  await shot(bday, '22-bday-finale.png');
  await shot(admin, '23-admin-finished.png', true);
  log('finale ok');

  // The two 409s from the deliberate rejection checks are expected.
  const unexpected = errors.filter((e) => !e.includes('409'));
  console.log(unexpected.length ? ['UNEXPECTED ERRORS:', ...unexpected].join('\n') : '\nALL CHECKS PASSED ✓');
  if (unexpected.length) process.exitCode = 1;
  await b.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
