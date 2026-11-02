// Event templates: what each kind of quiz looks like and which questions it
// starts with. The colors live in globals.css under [data-theme="<id>"].
//
// Text can be inflected for the star: "{name}" is replaced by the star's
// name, and "{a|b|c}" picks the female / male / plural (couple) form, in both
// Hebrew and English:  "מה {name} {אוהבת|אוהב|אוהבים}?"  "{is|is|are}".

import type { Gender, Locale, TemplateId } from "./types";

type L = Record<Locale, string>;

export interface TemplateDef {
  id: TemplateId;
  emoji: string;
  name: L;
  blurb: L;
  defaultGender: Gender;
  /** Label for the star's name in forms. */
  nameLabel: L;
  /** Default quiz title (inflected). */
  title: L;
  /** Big celebration line in the finale. */
  cheer: L;
  /** Floating decorations on the TV. */
  decor: string[];
  confetti: { colors: string[]; emoji: string[] };
  /** For previews (dashboard cards, template picker): background, surface, accent, text. */
  swatch: [string, string, string, string];
  /** The four answer colors (same as --color-a1…a4 in globals.css), for previews. */
  answers: [string, string, string, string];
  practice: QuestionSeed;
  questions: QuestionSeed[];
}

export interface QuestionSeed {
  he: [string, string[]];
  en: [string, string[]];
}

const q = (he: string, heOpts: string[], en: string, enOpts: string[]): QuestionSeed => ({
  he: [he, heOpts],
  en: [en, enOpts],
});

export function inflect(text: string, gender: Gender, name: string): string {
  const k = gender === "male" ? 1 : gender === "plural" ? 2 : 0;
  return text
    .replace(/\{([^{}]*\|[^{}]*)\}/g, (_, alts: string) => alts.split("|")[k] ?? "")
    .replaceAll("{name}", name);
}

/** A question seed in the game's language, inflected for the star. */
export function seedText(seed: QuestionSeed, locale: Locale, gender: Gender, name: string) {
  const [text, options] = seed[locale];
  return { text: inflect(text, gender, name), options: options.map((o) => inflect(o, gender, name)) };
}

// ------------------------------------------------------------- question pools

const PERSON: QuestionSeed[] = [
  q("מה המשקה החם האהוב על {name}?", ["קפה שחור", "קפה עם חלב", "תה", "שוקו"],
    "What's {name}'s favorite hot drink?", ["Black coffee", "Coffee with milk", "Tea", "Hot chocolate"]),
  q("בוקר או לילה – מתי {name} {במיטבה|במיטבו|במיטבם}?", ["ציפור בוקר 🌅", "ינשוף לילה 🦉"],
    "Morning or night – when {is|is|are} {name} at {her|his|their} best?", ["Early bird 🌅", "Night owl 🦉"]),
  q("איפה {name} {הייתה רוצה|היה רוצה|היו רוצים} לבלות חופשה?", ["חוף ים", "טיול בטבע", "עיר באירופה", "בבית עם המשפחה"],
    "Where would {name} love to spend a vacation?", ["The beach", "Hiking in nature", "A European city", "Home with family"]),
  q("מה {name} הכי לא {אוהבת|אוהב|אוהבים} לעשות בבית?", ["לשטוף כלים", "לקפל כביסה", "לבשל", "לנקות"],
    "Which chore {does|does|do} {name} hate the most?", ["Washing dishes", "Folding laundry", "Cooking", "Cleaning"]),
  q("מה {name} {עושה|עושה|עושים} בערב פנוי?", ["סדרה טובה", "ספר", "{מתקשרת|מתקשר|מתקשרים} לכולם", "{הולכת|הולך|הולכים} לישון מוקדם"],
    "What {does|does|do} {name} do on a free evening?", ["A good series", "A book", "{Calls|Calls|Call} everyone", "Early to bed"]),
  q("איזה קינוח {name} לא {תוכל|יוכל|יוכלו} לסרב לו?", ["שוקולד", "עוגת גבינה", "גלידה", "פירות"],
    "Which dessert can {name} never say no to?", ["Chocolate", "Cheesecake", "Ice cream", "Fruit"]),
  q("איך {name} {מגיבה|מגיב|מגיבים} להפתעה?", ["{בוכה|בוכה|בוכים} מהתרגשות", "{צוחקת|צוחק|צוחקים}", "״לא הייתם צריכים!״"],
    "How {does|does|do} {name} react to a surprise?", ["Happy tears", "Big laugh", "\"You shouldn't have!\""]),
  q("מה {name} {תזמין|יזמין|יזמינו} במסעדה?", ["פסטה", "סטייק", "סלט", "סושי"],
    "What would {name} order at a restaurant?", ["Pasta", "Steak", "Salad", "Sushi"]),
  q("מה {name} {עושה|עושה|עושים} ראשון בבוקר?", ["{בודקת|בודק|בודקים} את הטלפון", "קפה!", "ספורט", "{לוחצת|לוחץ|לוחצים} ״נודניק״"],
    "What's the first thing {name} {does|does|do} in the morning?", ["Phone check", "Coffee!", "Exercise", "Snooze button"]),
  q("איזה שיר {name} {תשיר|ישיר|ישירו} בקריוקי?", ["שיר ישראלי קלאסי", "להיט פופ", "שיר מהשמונים", "בשום פנים ואופן!"],
    "What would {name} sing at karaoke?", ["An oldies classic", "A pop hit", "An 80s anthem", "No way, never!"]),
  q("אם {name} {הייתה|היה|היו} חיה, מה {היא הייתה|הוא היה|הם היו}?", ["חתול 🐱", "כלב 🐶", "ינשוף 🦉", "דולפין 🐬"],
    "If {name} {was|was|were} an animal, what would {she|he|they} be?", ["Cat 🐱", "Dog 🐶", "Owl 🦉", "Dolphin 🐬"]),
  q("מה {name} {תעשה|יעשה|יעשו} עם זכייה בלוטו?", ["טיול מסביב לעולם", "בית חלומות", "{תחלק|יחלק|יחלקו} למשפחה", "{תמשיך|ימשיך|ימשיכו} כרגיל"],
    "What would {name} do after winning the lottery?", ["Travel the world", "Dream house", "Share with family", "Keep calm, carry on"]),
];
const PERSON_PRACTICE = q("חתולים או כלבים – מה {name} {מעדיפה|מעדיף|מעדיפים}?", ["חתולים 🐱", "כלבים 🐶", "שניהם", "אף אחד"],
  "Cats or dogs – which {does|does|do} {name} prefer?", ["Cats 🐱", "Dogs 🐶", "Both", "Neither"]);
const BIRTHDAY_EXTRA = q("מה הכי חשוב ל{name} ביום ההולדת?", ["שכולם יהיו ביחד", "מתנה מפתיעה", "עוגה טובה", "שקט ושלווה"],
  "What matters most to {name} on {her|his|their} birthday?", ["Everyone together", "A surprise gift", "A great cake", "Peace and quiet"]);

const KID: QuestionSeed[] = [
  q("מה המאכל האהוב על {name}?", ["פיצה 🍕", "שניצל וצ׳יפס", "פסטה", "גלידה לארוחת ערב 😜"],
    "What's {name}'s favorite food?", ["Pizza 🍕", "Nuggets & fries", "Pasta", "Ice cream for dinner 😜"]),
  q("איזה צבע {name} הכי {אוהבת|אוהב|אוהבים}?", ["ורוד", "כחול", "ירוק", "סגול"],
    "What's {name}'s favorite color?", ["Pink", "Blue", "Green", "Purple"]),
  q("מה {name} {רוצה|רוצה|רוצים} להיות כש{תגדל|יגדל|יגדלו}?", ["{רופאה|רופא|רופאים}", "{כוכבת|כוכב|כוכבי} יוטיוב", "{אסטרונאוטית|אסטרונאוט|אסטרונאוטים} 🚀", "{ספורטאית|ספורטאי|ספורטאים}"],
    "What {does|does|do} {name} want to be when {she grows|he grows|they grow} up?", ["Doctor", "YouTube star", "Astronaut 🚀", "Athlete"]),
  q("איזו חיה {name} הכי {רוצה|רוצה|רוצים} בבית?", ["כלב 🐶", "חתול 🐱", "דינוזאור 🦖", "חד-קרן 🦄"],
    "Which pet would {name} love to have?", ["A dog 🐶", "A cat 🐱", "A dinosaur 🦖", "A unicorn 🦄"]),
  q("מה {name} {עושה|עושה|עושים} כש{משעמם לה|משעמם לו|משעמם להם}?", ["מסכים 📱", "ציור ויצירה", "משחקים בחוץ", "{מציקה|מציק|מציקים} לכולם 😅"],
    "What {does|does|do} {name} do when {she's|he's|they're} bored?", ["Screens 📱", "Arts & crafts", "Play outside", "Bug everyone 😅"]),
  q("איזה כוח-על {name} {הייתה בוחרת|היה בוחר|היו בוחרים}?", ["לעוף", "להיות {בלתי נראית|בלתי נראה|בלתי נראים}", "לדבר עם חיות", "לעצור את הזמן"],
    "Which superpower would {name} pick?", ["Flying", "Invisibility", "Talking to animals", "Stopping time"]),
  q("מה {name} הכי לא {אוהבת|אוהב|אוהבים} לאכול?", ["ירקות 🥦", "דגים", "אורז", "{אוכלת|אוכל|אוכלים} הכול!"],
    "Which food {does|does|do} {name} dislike the most?", ["Vegetables 🥦", "Fish", "Rice", "Eats everything!"]),
  q("לאן {name} הכי {אוהבת|אוהב|אוהבים} ללכת?", ["לגן השעשועים", "לים", "לסבא וסבתא", "לקניון"],
    "Where {does|does|do} {name} love going the most?", ["The playground", "The beach", "Grandma & Grandpa's", "The mall"]),
  q("מה המשחק האהוב על {name}?", ["מחבואים", "משחקי מחשב 🎮", "קוביות בנייה", "כדורגל ⚽"],
    "What's {name}'s favorite game?", ["Hide and seek", "Video games 🎮", "Building blocks", "Soccer ⚽"]),
  q("באיזו שעה {name} {הולכת|הולך|הולכים} לישון (באמת)?", ["לפני 8", "ב-9", "ב-10", "״עוד חמש דקות!״"],
    "What time {does|does|do} {name} REALLY go to sleep?", ["Before 8", "9:00", "10:00", "\"Five more minutes!\""]),
  q("מה {name} {תבחר|יבחר|יבחרו} לארוחת בוקר?", ["קורנפלקס", "פנקייק 🥞", "חביתה", "שוקו ולחמניה"],
    "What would {name} choose for breakfast?", ["Cereal", "Pancakes 🥞", "Eggs", "Chocolate milk & a bun"]),
  q("איזה סרט {name} {יכולה|יכול|יכולים} לראות מאה פעם?", ["סרט אנימציה", "גיבורי-על 🦸", "סרט על חיות", "קומדיה"],
    "Which kind of movie could {name} watch 100 times?", ["Animated", "Superheroes 🦸", "Animals", "Comedy"]),
];
const KID_PRACTICE = q("גלידה! איזה טעם {name} {בוחרת|בוחר|בוחרים}?", ["שוקולד 🍫", "וניל 🍦", "תות 🍓", "את כל הטעמים!"],
  "Ice cream! Which flavor {does|does|do} {name} pick?", ["Chocolate 🍫", "Vanilla 🍦", "Strawberry 🍓", "All of them!"]);
const KIDS_BIRTHDAY_EXTRA = q("מה {name} הכי {רוצה|רוצה|רוצים} לקבל ליום ההולדת?", ["אופניים 🚲", "משחק מחשב", "צעצוע ענק", "חיה אמיתית!"],
  "What does {name} want most for {her|his|their} birthday?", ["A bike 🚲", "A video game", "A giant toy", "A real pet!"]);

const TEEN: QuestionSeed[] = [
  q("על מה {name} הכי {מבזבזת|מבזבז|מבזבזים} זמן בטלפון?", ["סרטונים קצרים", "משחקים", "צ׳אטים עם חברים", "מוזיקה 🎧"],
    "What {does|does|do} {name} use the phone for the most?", ["Short videos", "Games", "Chatting with friends", "Music 🎧"]),
  q("מה {name} הכי {רוצה|רוצה|רוצים} לקבל במתנה?", ["טלפון חדש", "טיול", "כסף 💸", "הפתעה"],
    "Which gift {does|does|do} {name} want most?", ["A new phone", "A trip", "Cash 💸", "A surprise"]),
  q("מה המקצוע האהוב על {name} בבית הספר?", ["ספורט", "אמנות", "מתמטיקה", "ההפסקה 😎"],
    "What's {name}'s favorite school subject?", ["P.E.", "Art", "Math", "Recess 😎"]),
  q("כמה זמן לוקח ל{name} להתארגן בבוקר?", ["5 דקות", "רבע שעה", "חצי שעה", "״עוד רגע!״"],
    "How long does {name} take to get ready in the morning?", ["5 minutes", "15 minutes", "Half an hour", "\"One more minute!\""]),
  q("מה {name} {אוכלת|אוכל|אוכלים} כש{היא חוזרת|הוא חוזר|הם חוזרים} מבית הספר?", ["טוסט", "פסטה", "חטיפים", "מה שיש במקרר"],
    "What's {name}'s after-school snack?", ["Grilled cheese", "Pasta", "Chips", "Whatever's in the fridge"]),
  q("איזה ספורט {name} הכי {אוהבת|אוהב|אוהבים}?", ["כדורגל ⚽", "כדורסל 🏀", "ריקוד 💃", "משחקי מחשב 🎮"],
    "Which sport {does|does|do} {name} love most?", ["Soccer ⚽", "Basketball 🏀", "Dance 💃", "eSports 🎮"]),
  q("לאיזה שיר {name} {תרקוד|ירקוד|ירקדו} הערב?", ["להיט ויראלי", "שיר מזרחי", "פופ באנגלית", "לא {רוקדת|רוקד|רוקדים}!"],
    "Which song will {name} dance to tonight?", ["A viral hit", "Mediterranean pop", "An English pop hit", "No dancing!"]),
  q("מה {name} {רוצה|רוצה|רוצים} להיות כש{תגדל|יגדל|יגדלו}?", ["{יזמית|יזם|יזמים} הייטק", "{רופאה|רופא|רופאים}", "{כוכבת|כוכב|כוכבי} רשת", "{טייסת|טייס|טייסים} ✈️"],
    "What {does|does|do} {name} want to be?", ["Tech founder", "Doctor", "Influencer", "Pilot ✈️"]),
];

const COUPLE: QuestionSeed[] = [
  q("איך {name} {הכירה|הכיר|הכירו}?", ["דרך חברים", "בעבודה", "באפליקציה 📱", "בלימודים"],
    "How did {name} meet?", ["Through friends", "At work", "On an app 📱", "At school"]),
  q("מה היה הדייט הראשון של {name}?", ["מסעדה", "בית קפה ☕", "הליכה על החוף", "סרט"],
    "What was {name}'s first date?", ["Dinner", "Coffee ☕", "A walk on the beach", "A movie"]),
  q("מה החופשה החלומית של {name}?", ["אי טרופי 🏝️", "טיול באירופה", "ספארי באפריקה", "צימר בצפון"],
    "What's {name}'s dream vacation?", ["Tropical island 🏝️", "Europe trip", "African safari", "Cozy cabin"]),
  q("איך {name} {מבלה|מבלה|מבלים} בערב שישי?", ["ארוחה משפחתית", "בילוי עם חברים", "ספה וסדרה", "הולכים לישון מוקדם"],
    "How {does|does|do} {name} spend a Friday night?", ["Family dinner", "Out with friends", "Couch & a series", "Early to bed"]),
  q("מה {name} הכי {אוהבת|אוהב|אוהבים} להזמין הביתה?", ["סושי 🍣", "פיצה 🍕", "המבורגר 🍔", "אוכל אסייתי 🥡"],
    "What's {name}'s go-to takeout?", ["Sushi 🍣", "Pizza 🍕", "Burgers 🍔", "Chinese 🥡"]),
  q("מה סוד הזוגיות של {name}?", ["הומור", "סבלנות", "אוכל טוב", "״כן, אהובי/אהובתי״"],
    "What's {name}'s relationship secret?", ["Humor", "Patience", "Good food", "\"Yes, dear\""]),
  q("איזו חיית מחמד {name} {תאמץ|יאמץ|יאמצו} ראשונה?", ["כלב 🐶", "חתול 🐱", "דגים 🐠", "עציץ זה מספיק 🌱"],
    "Which pet will {name} adopt first?", ["A dog 🐶", "A cat 🐱", "Fish 🐠", "A plant is enough 🌱"]),
  q("מה {name} {תעשה|יעשה|יעשו} עם זכייה בלוטו?", ["טיול מסביב לעולם", "בית חלומות", "{תחלק|יחלק|יחלקו} למשפחה", "{תמשיך|ימשיך|ימשיכו} כרגיל"],
    "What would {name} do after winning the lottery?", ["Travel the world", "Dream house", "Share with family", "Keep calm, carry on"]),
  q("איזו מוזיקה {name} {אוהבת|אוהב|אוהבים}?", ["פופ", "רוק 🎸", "מזרחית", "ג׳אז 🎷"],
    "What music {does|does|do} {name} love?", ["Pop", "Rock 🎸", "Country", "Jazz 🎷"]),
  q("כמה ילדים {name} {רוצה|רוצה|רוצים}?", ["אחד", "שניים", "שלושה", "קבוצת כדורגל ⚽"],
    "How many kids {does|does|do} {name} want?", ["One", "Two", "Three", "A soccer team ⚽"]),
  q("מה {name} {עושה|עושה|עושים} בשבת בבוקר?", ["ישנים עד הצהריים 😴", "ארוחת בוקר בחוץ", "ספורט", "ניקיונות 😩"],
    "What {does|does|do} {name} do on a Saturday morning?", ["Sleep in 😴", "Brunch out", "Exercise", "Cleaning 😩"]),
];
const COUPLE_PRACTICE = q("קפה או תה – מה {name} {שותה|שותה|שותים} בבוקר?", ["קפה ☕", "תה 🍵", "שוקו", "מיץ תפוזים 🍊"],
  "Coffee or tea – what {does|does|do} {name} drink in the morning?", ["Coffee ☕", "Tea 🍵", "Hot chocolate", "Orange juice 🍊"]);
const WEDDING_EXTRA = q("לאן {name} {טסה|טס|טסים} לירח הדבש?", ["אירופה", "תאילנד 🌴", "יוון", "עוד לא החליטו"],
  "Where {is|is|are} {name} going for the honeymoon?", ["Europe", "Thailand 🌴", "Greece", "Still deciding"]);
const ANNIVERSARY_EXTRA = q("מה {name} {עשתה|עשה|עשו} ביום הנישואין הראשון?", ["ארוחה רומנטית", "טיול", "נשארו בבית", "שכחו 😅"],
  "What did {name} do on {her|his|their} first anniversary?", ["Romantic dinner", "A trip", "Stayed home", "Forgot 😅"]);

const BABY: QuestionSeed[] = [
  q("למה {name} הכי {מחכה|מחכה|מחכים}?", ["החיבוק הראשון", "המילה הראשונה", "הצעד הראשון", "לילה שלם של שינה 😴"],
    "What {is|is|are} {name} most excited for?", ["The first cuddle", "The first word", "The first steps", "A full night's sleep 😴"]),
  q("באיזה צבע החדר של התינוק?", ["תכלת", "ורוד", "צהוב", "לבן"],
    "What color is the nursery?", ["Light blue", "Pink", "Yellow", "White"]),
  q("למי התינוק ידמה?", ["לאמא", "לאבא", "לשניהם", "לסבא 😂"],
    "Who will the baby look like?", ["Mom", "Dad", "Both", "Grandpa 😂"]),
  q("ממה {name} הכי {חוששת|חושש|חוששים}?", ["חיתולים 💩", "לילות לבנים", "האמבטיה הראשונה", "כלום – {מוכנה|מוכן|מוכנים}!"],
    "What {is|is|are} {name} most nervous about?", ["Diapers 💩", "Sleepless nights", "The first bath", "Nothing – ready!"]),
  q("מה היה החשק הכי מוזר בהיריון?", ["חמוצים עם גלידה", "שוקולד באמצע הלילה", "פיצה", "אבטיח 🍉"],
    "What was the weirdest pregnancy craving?", ["Pickles & ice cream", "Midnight chocolate", "Pizza", "Watermelon 🍉"]),
  q("מתי התינוק יגיע?", ["לפני הזמן", "בדיוק בזמן", "באיחור", "באמצע הלילה, ברור"],
    "When will the baby arrive?", ["Early", "Right on time", "Late", "Middle of the night, obviously"]),
  q("מה הדבר הראשון ש{name} {קנתה|קנה|קנו} לתינוק?", ["בגד קטנטן", "צעצוע", "עגלה", "ספר 📖"],
    "What was the first thing {name} bought for the baby?", ["A tiny outfit", "A toy", "A stroller", "A book 📖"]),
  q("איזה תחביב {name} {תלמד|ילמד|ילמדו} את התינוק ראשון?", ["בישול", "ספורט", "מוזיקה 🎵", "טיולים"],
    "Which hobby will {name} teach the baby first?", ["Cooking", "Sports", "Music 🎵", "Hiking"]),
  q("כמה שעות {name} {ישנה|ישן|ישנים} בלילה עכשיו?", ["8 ומעלה", "6", "4", "מה זה שינה?"],
    "How many hours of sleep {does|does|do} {name} get now?", ["8+", "6", "4", "What's sleep?"]),
];
const BABY_PRACTICE = q("מתוק או מלוח – מה {name} {מעדיפה|מעדיף|מעדיפים}?", ["מתוק 🍰", "מלוח 🥨", "שניהם", "תלוי ביום"],
  "Sweet or salty – which {does|does|do} {name} prefer?", ["Sweet 🍰", "Salty 🥨", "Both", "Depends on the day"]);

// ------------------------------------------------------------------ templates

const def = (t: TemplateDef) => t;

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  birthday: def({
    id: "birthday",
    emoji: "🎂",
    name: { he: "יום הולדת", en: "Birthday" },
    blurb: { he: "קלאסי ואלגנטי: שחור וזהב, לכל גיל", en: "Classic and elegant: black and gold, for any age" },
    defaultGender: "female",
    nameLabel: { he: "שם החוגג/ת", en: "Birthday person's name" },
    title: { he: "כמה טוב אתם מכירים את {name}?", en: "How well do you know {name}?" },
    cheer: { he: "מזל טוב! 🎂", en: "Happy birthday! 🎂" },
    decor: ["🎂", "🎈", "🎉", "🥂", "✨"],
    confetti: { colors: ["#d6b06b", "#e8cd96", "#f3eee4", "#9f7c3c"], emoji: ["🎉", "✨"] },
    swatch: ["#120b2e", "#2b1f62", "#ffc94d", "#fbf8ff"],
    answers: ["#ef4467", "#6b5cff", "#f3a10f", "#10b3a3"],
    practice: PERSON_PRACTICE,
    questions: [...PERSON.slice(0, 7), BIRTHDAY_EXTRA, ...PERSON.slice(7)],
  }),
  kids_birthday: def({
    id: "kids_birthday",
    emoji: "🎈",
    name: { he: "יום הולדת לילדים", en: "Kid's birthday" },
    blurb: { he: "בלונים, צבעים ומלא שמחה", en: "Balloons, bright colors and lots of fun" },
    defaultGender: "female",
    nameLabel: { he: "שם החוגג/ת", en: "Birthday kid's name" },
    title: { he: "מי מכיר את {name} הכי טוב? 🎈", en: "Who knows {name} best? 🎈" },
    cheer: { he: "יום הולדת שמח! 🎈", en: "Happy birthday! 🎈" },
    decor: ["🎈", "🧁", "🎁", "🦄", "⭐", "🍭"],
    confetti: { colors: ["#ffd23f", "#ff5d8f", "#4cc9f0", "#7bd88f", "#b388ff"], emoji: ["🎈", "⭐", "🍭"] },
    swatch: ["#3d16a6", "#5d31d8", "#ffd23f", "#ffffff"],
    answers: ["#ff3d7f", "#1f9bff", "#f59e0b", "#22b455"],
    practice: KID_PRACTICE,
    questions: [KIDS_BIRTHDAY_EXTRA, ...KID],
  }),
  kids: def({
    id: "kids",
    emoji: "🦖",
    name: { he: "ילדים", en: "Kids" },
    blurb: { he: "חידון כיפי עם דינוזאורים וטילים", en: "A playful quiz with dinosaurs and rockets" },
    defaultGender: "male",
    nameLabel: { he: "שם הילד/ה", en: "Kid's name" },
    title: { he: "כמה טוב אתם מכירים את {name}?", en: "How well do you know {name}?" },
    cheer: { he: "יש! 🚀", en: "Woohoo! 🚀" },
    decor: ["🦖", "🚀", "⭐", "🧸", "🪐", "🎨"],
    confetti: { colors: ["#ff8a3d", "#ffd166", "#06d6a0", "#4cc9f0", "#ef476f"], emoji: ["⭐", "🚀", "🦖"] },
    swatch: ["#0b2547", "#194277", "#ff8a3d", "#ffffff"],
    answers: ["#ff6b35", "#0aa5d6", "#9b5de5", "#0fb98a"],
    practice: KID_PRACTICE,
    questions: KID,
  }),
  wedding: def({
    id: "wedding",
    emoji: "💍",
    name: { he: "חתונה", en: "Wedding" },
    blurb: { he: "שנהב, זהב ורוד ופרחים", en: "Ivory, rose gold and flowers" },
    defaultGender: "plural",
    nameLabel: { he: "שמות בני הזוג", en: "The couple's names" },
    title: { he: "{name} {מתחתנת|מתחתן|מתחתנים}! כמה טוב אתם {מכירים אותה|מכירים אותו|מכירים אותם}?", en: "{name} {is|is|are} getting married! How well do you know {her|him|them}?" },
    cheer: { he: "מזל טוב! 💍", en: "Congratulations! 💍" },
    decor: ["💍", "🥂", "🤍", "🌸", "🕊️"],
    confetti: { colors: ["#ffffff", "#f6d6d0", "#e7c6a3", "#c99a72"], emoji: ["🤍", "🌸"] },
    swatch: ["#f8f3ec", "#ffffff", "#a8794d", "#2b241e"],
    answers: ["#c0607a", "#5f8a6b", "#b08647", "#5f82aa"],
    practice: COUPLE_PRACTICE,
    questions: [...COUPLE.slice(0, 7), WEDDING_EXTRA, ...COUPLE.slice(7)],
  }),
  mitzvah: def({
    id: "mitzvah",
    emoji: "✡️",
    name: { he: "בר / בת מצווה", en: "Bar / Bat Mitzvah" },
    blurb: { he: "כחול לילה, תכלת וכסף", en: "Midnight blue, sky and silver" },
    defaultGender: "male",
    nameLabel: { he: "שם חתן/כלת המצווה", en: "Name of the Bar / Bat Mitzvah" },
    title: { he: "{name} {חוגגת בת|חוגג בר|חוגגים} מצווה! מי {מכיר אותה|מכיר אותו|מכיר אותם} הכי טוב?", en: "{name}'s {Bat|Bar|B'nai} Mitzvah Quiz" },
    cheer: { he: "מזל טוב! ✡️", en: "Mazel tov! ✡️" },
    decor: ["✡️", "📜", "🎉", "🕺", "💙"],
    confetti: { colors: ["#7cc4ff", "#b3dcff", "#ffffff", "#c0c8d4"], emoji: ["✡️", "💙"] },
    swatch: ["#07142e", "#152c5c", "#5cc8ff", "#f4f8ff"],
    answers: ["#2f6bff", "#0aa0d8", "#d19a2a", "#8b5cf6"],
    practice: KID_PRACTICE,
    questions: [...TEEN, ...KID.slice(3, 6)],
  }),
  baby_shower: def({
    id: "baby_shower",
    emoji: "🍼",
    name: { he: "מסיבת לידה", en: "Baby shower" },
    blurb: { he: "פסטל רך, עננים ומתיקות", en: "Soft pastels, clouds and sweetness" },
    defaultGender: "plural",
    nameLabel: { he: "שמות ההורים לעתיד", en: "Parents-to-be" },
    title: { he: "{name} {מחכה|מחכה|מחכים} לתינוק! 🍼", en: "Baby on the way for {name}! 🍼" },
    cheer: { he: "מזל טוב! 👶", en: "Congratulations! 👶" },
    decor: ["🍼", "👶", "🧸", "☁️", "🌙"],
    confetti: { colors: ["#ffc8dd", "#bde0fe", "#cdb4db", "#fff1c1"], emoji: ["☁️", "🍼"] },
    swatch: ["#eef4fd", "#ffffff", "#e0688d", "#263045"],
    answers: ["#e86a95", "#4b9be0", "#9b7ef5", "#23b391"],
    practice: BABY_PRACTICE,
    questions: BABY,
  }),
  anniversary: def({
    id: "anniversary",
    emoji: "🥂",
    name: { he: "יום נישואין", en: "Anniversary" },
    blurb: { he: "יין, ורדים ואור נרות", en: "Wine, roses and candlelight" },
    defaultGender: "plural",
    nameLabel: { he: "שמות בני הזוג", en: "The couple's names" },
    title: { he: "{name} – כמה טוב אתם {מכירים אותה|מכירים אותו|מכירים אותם}?", en: "{name} – how well do you know {her|him|them}?" },
    cheer: { he: "לחיים! 🥂", en: "Cheers! 🥂" },
    decor: ["🥂", "🌹", "❤️", "🕯️", "✨"],
    confetti: { colors: ["#e0a3b6", "#f2c9d6", "#ffffff", "#9b2f4f"], emoji: ["❤️", "🌹"] },
    swatch: ["#1d0912", "#3f182a", "#f0c27b", "#fff3f6"],
    answers: ["#c0305f", "#d9607f", "#c08a35", "#7d3c98"],
    practice: COUPLE_PRACTICE,
    questions: [ANNIVERSARY_EXTRA, ...COUPLE],
  }),
  party: def({
    id: "party",
    emoji: "🪩",
    name: { he: "מסיבה / כל אירוע", en: "Party / any event" },
    blurb: { he: "ניאון, דיסקו ואנרגיה", en: "Neon, disco and energy" },
    defaultGender: "female",
    nameLabel: { he: "שם הכוכב/ת של הערב", en: "Who's the star?" },
    title: { he: "החידון של {name}", en: "The {name} Quiz" },
    cheer: { he: "איזו מסיבה! 🪩", en: "What a party! 🪩" },
    decor: ["🪩", "🎉", "🎶", "🌟", "🕺"],
    confetti: { colors: ["#19e3c5", "#ff4fd8", "#ffe14f", "#7a5cff"], emoji: ["🪩", "🎶"] },
    swatch: ["#07071a", "#1a1a42", "#22f0c8", "#f6f6ff"],
    answers: ["#f0249a", "#0ab4e6", "#f08a1c", "#7b61ff"],
    practice: PERSON_PRACTICE,
    questions: PERSON,
  }),
};

export const STARTER_COUNT = 8;

export function template(id: string | undefined | null): TemplateDef {
  return TEMPLATES[(id ?? "birthday") as TemplateId] ?? TEMPLATES.birthday;
}

/** Light templates use a light background (their theme flips text colors). */
export const LIGHT_TEMPLATES: TemplateId[] = ["wedding", "baby_shower"];
