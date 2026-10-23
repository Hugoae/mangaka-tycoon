/** Seed of a new game. Entropy lives here, outside the core, which only ever receives the number. */
export function pickSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}
