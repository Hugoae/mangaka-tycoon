/**
 * Deterministic random streams (ADR 0005).
 *
 * A stream is a pure function of `(seed, week, systemId)`: the save file only needs the seed, and one
 * system drawing more or fewer values never shifts what another system draws.
 * Algorithm: sfc32 (four 32-bit words), seeded through an integer mixer.
 */

/** Draws a float in [0, 1). Each call advances the stream. Never store a stream in the game state. */
export type RandomStream = () => number;

const UINT32_RANGE = 4_294_967_296;
const WARM_UP_ROUNDS = 12;
const FNV_OFFSET = 0x81_1c_9d_c5;
const FNV_PRIME = 0x01_00_01_93;

/** FNV-1a: turns a system name into a 32-bit number. */
function hashText(text: string): number {
  let hash = FNV_OFFSET;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), FNV_PRIME);
  }
  return hash >>> 0;
}

/** Murmur3 finaliser: spreads every input bit over the whole word. */
function mix(value: number): number {
  let word = value | 0;
  word = Math.imul(word ^ (word >>> 16), 0x85_eb_ca_6b);
  word = Math.imul(word ^ (word >>> 13), 0xc2_b2_ae_35);
  return (word ^ (word >>> 16)) >>> 0;
}

/** sfc32 by Chris Doty-Humphrey (public domain). */
export function createSfc32(
  seedA: number,
  seedB: number,
  seedC: number,
  seedD: number,
): RandomStream {
  let a = seedA | 0;
  let b = seedB | 0;
  let c = seedC | 0;
  let d = seedD | 0;

  const next: RandomStream = () => {
    const sum = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + sum) | 0;
    return (sum >>> 0) / UINT32_RANGE;
  };

  // The first outputs of a freshly seeded generator are correlated with the seed: discard some.
  for (let round = 0; round < WARM_UP_ROUNDS; round += 1) {
    next();
  }
  return next;
}

/**
 * The private stream of one system for one week. Same `(seed, week, systemId)` always gives the
 * same sequence; any change to one of them gives an unrelated one.
 */
export function createStream(seed: number, week: number, systemId: string): RandomStream {
  const system = hashText(systemId);
  return createSfc32(
    mix(seed ^ system),
    mix(week + system),
    mix(seed + week),
    mix(system ^ mix(seed ^ week)),
  );
}

const TWICE = 2;

/** Draws a float in [-1, 1) from a stream. */
export function drawSymmetric(stream: RandomStream): number {
  return stream() * TWICE - 1;
}
