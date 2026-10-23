/**
 * Stylised calendar (ADR 0012): 4 weeks per month, 12 months, 48 weeks per year.
 *
 * A week is a zero-based index counted from the first week of January of the start year.
 * Months and weeks of the month are zero-based too; the UI adds one when it displays them.
 */

/** Number of weeks elapsed since week 1 of January of {@link START_YEAR}. Non-negative integer. */
export type WeekIndex = number;

/** First calendar year of the game. Becomes era data in `content` with milestone M2. */
export const START_YEAR = 1980;
export const WEEKS_PER_MONTH = 4;
export const MONTHS_PER_YEAR = 12;
export const WEEKS_PER_YEAR = WEEKS_PER_MONTH * MONTHS_PER_YEAR;

/** A date of the stylised calendar. `month` is 0-11 and `weekOfMonth` is 0-3. */
export interface GameDate {
  readonly year: number;
  readonly month: number;
  readonly weekOfMonth: number;
}

function assertValidWeek(week: WeekIndex): void {
  if (!Number.isInteger(week) || week < 0) {
    throw new RangeError(`A week index must be a non-negative integer, got ${week}.`);
  }
}

/** Converts an absolute week index into a calendar date. */
export function weekToDate(week: WeekIndex): GameDate {
  assertValidWeek(week);
  const weekOfYear = week % WEEKS_PER_YEAR;
  return {
    year: START_YEAR + Math.floor(week / WEEKS_PER_YEAR),
    month: Math.floor(weekOfYear / WEEKS_PER_MONTH),
    weekOfMonth: weekOfYear % WEEKS_PER_MONTH,
  };
}

/** True when `week` is the last week of its month, the week monthly systems (sales) run. */
export function isMonthEnd(week: WeekIndex): boolean {
  assertValidWeek(week);
  return week % WEEKS_PER_MONTH === WEEKS_PER_MONTH - 1;
}
