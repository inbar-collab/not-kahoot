// Choreography timings shared by the TV and the phones, measured from the
// moment the game entered the state (server clock), so every device shows
// the countdown and the reveal at the same moment.
export const REVEAL_COUNTDOWN_MS = 3000; // 3-2-1
export const REVEAL_ANSWER_MS = REVEAL_COUNTDOWN_MS + 200; // her answer appears
export const REVEAL_COUNT_MS = REVEAL_ANSWER_MS + 1800; // "7 of 10 knew her"

export const FINALE_TEASE_MS = 3500; // "The person who knows her best is..."
export const FINALE_SHOW_S = 6; // the themed show: the winner arrives at the top
export const FINALE_ARRIVE_MS = FINALE_TEASE_MS + FINALE_SHOW_S * 1000;
export const FINALE_LIST_MS = FINALE_ARRIVE_MS + 2600; // full ranking

export const LB_STRIKE_MS = 3900; // bowling ball, pins fly, "STRIKE!"
export const LB_RACE_MS = LB_STRIKE_MS + 3800; // runners reach their places
export const LB_DONE_MS = LB_RACE_MS + 900; // crowns, tags and rank changes
