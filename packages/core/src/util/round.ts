const TWO_DECIMALS = 100;

/**
 * Rounds to two decimals. Values shown to the player are rounded in the core so that every
 * platform reports the exact same number (floating-point `Math.pow` may differ in the last bit).
 */
export function round2(value: number): number {
  return Math.round(value * TWO_DECIMALS) / TWO_DECIMALS;
}
