export function getRandomIntVal(min: number, max: number): number {
  // max, min inclusive
  return Math.floor(Math.random() * (max - min + 1) + min);
}
