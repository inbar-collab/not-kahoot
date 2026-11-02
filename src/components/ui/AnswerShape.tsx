/**
 * Each answer slot has a color (.tile-0 … .tile-3) and a shape, the same on
 * the TV, the guests' phones and the star's phone, so people can match them
 * at a glance even before reading: star, heart, moon, bolt.
 */
const PATHS = [
  // star
  "M12 2.6l2.8 5.9 6.4.8-4.7 4.5 1.2 6.4L12 17.1l-5.7 3.1 1.2-6.4-4.7-4.5 6.4-.8z",
  // heart
  "M12 20.6s-7.9-4.7-9.4-9.6C1.5 7.4 3.7 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.5 0 5.7 3.4 4.6 7-1.5 4.9-9.4 9.6-9.4 9.6z",
  // crescent moon
  "M15.6 2.8a9.4 9.4 0 1 0 5.6 13.6A8 8 0 0 1 15.6 2.8z",
  // lightning bolt
  "M13.6 2 4.8 13.4h6l-1.4 8.6 8.8-11.4h-6z",
];

export function AnswerShape({ index, className = "" }: { index: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d={PATHS[index % PATHS.length]} strokeLinejoin="round" />
    </svg>
  );
}
