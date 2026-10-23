import { SLIDER_KEYS, totalPoints } from "@mangaka/core";
import type { SliderKey, Sliders } from "@mangaka/core";

/** Points each slider starts at on the first chapter of a series. */
export const STARTING_POINTS = 10;

export const STARTING_SLIDERS: Sliders = {
  story: STARTING_POINTS,
  art: STARTING_POINTS,
  characters: STARTING_POINTS,
  worldbuilding: STARTING_POINTS,
  pacing: STARTING_POINTS,
};

/**
 * Moves one slider. The value is kept within the slider's range and within what is left of the
 * energy budget once the other sliders are paid for, so the player can never overspend.
 */
export function setSlider(
  sliders: Sliders,
  axis: SliderKey,
  value: number,
  budget: number,
  max: number,
): Sliders {
  const others = totalPoints(sliders) - sliders[axis];
  const clamped = Math.max(0, Math.min(max, Math.round(value), budget - others));
  return { ...sliders, [axis]: clamped };
}

/**
 * Trims an allocation down to a (smaller) budget, taking points from the last sliders first. Used
 * when the mangaka got tired and the same allocation no longer fits.
 */
export function fitToBudget(sliders: Sliders, budget: number): Sliders {
  const fitted: Record<SliderKey, number> = { ...sliders };
  let excess = Math.max(0, totalPoints(sliders) - Math.max(0, budget));
  for (const axis of SLIDER_KEYS.toReversed()) {
    const cut = Math.min(fitted[axis], excess);
    fitted[axis] -= cut;
    excess -= cut;
  }
  return fitted;
}
