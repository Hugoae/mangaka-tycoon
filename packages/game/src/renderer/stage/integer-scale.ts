/** Internal resolution of the game (ADR 0010). Everything is laid out in these "game pixels". */
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;

/**
 * Largest whole-number zoom at which the game fits in the viewport (ADR 0010). Never below 1: a
 * viewport smaller than the game is cropped rather than blurred by a fractional scale.
 * Invalid sizes (NaN, 0, negative) fall back to 1.
 */
export function computeIntegerScale(viewportWidth: number, viewportHeight: number): number {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight)) {
    return 1;
  }
  return Math.max(
    1,
    Math.floor(Math.min(viewportWidth / GAME_WIDTH, viewportHeight / GAME_HEIGHT)),
  );
}
