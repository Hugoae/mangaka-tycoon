import { describe, expect, it } from "vitest";

import {
  isMonthEnd,
  MONTHS_PER_YEAR,
  START_YEAR,
  weekToDate,
  WEEKS_PER_MONTH,
  WEEKS_PER_YEAR,
} from "./calendar";

const SIMULATED_YEARS = 40;

describe("weekToDate", () => {
  it("starts at the first week of January of the start year", () => {
    expect(weekToDate(0)).toEqual({ year: START_YEAR, month: 0, weekOfMonth: 0 });
  });

  it("ends a year on the last week of December", () => {
    expect(weekToDate(WEEKS_PER_YEAR - 1)).toEqual({
      year: START_YEAR,
      month: MONTHS_PER_YEAR - 1,
      weekOfMonth: WEEKS_PER_MONTH - 1,
    });
  });

  it("rolls over to the next year after 48 weeks", () => {
    expect(weekToDate(WEEKS_PER_YEAR)).toEqual({ year: START_YEAR + 1, month: 0, weekOfMonth: 0 });
  });

  // The domain is finite, so every week of a 40 year career is checked against an independently
  // built sequence (nested loops) instead of re-deriving the formula under test.
  it("matches an independent walk through all weeks of 40 years", () => {
    let week = 0;
    for (let yearOffset = 0; yearOffset < SIMULATED_YEARS; yearOffset++) {
      for (let month = 0; month < MONTHS_PER_YEAR; month++) {
        for (let weekOfMonth = 0; weekOfMonth < WEEKS_PER_MONTH; weekOfMonth++) {
          expect(weekToDate(week)).toEqual({ year: START_YEAR + yearOffset, month, weekOfMonth });
          expect(isMonthEnd(week)).toBe(weekOfMonth === WEEKS_PER_MONTH - 1);
          week++;
        }
      }
    }
    expect(week).toBe(SIMULATED_YEARS * WEEKS_PER_YEAR);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects the week %s", (week) => {
    expect(() => weekToDate(week)).toThrow(RangeError);
    expect(() => isMonthEnd(week)).toThrow(RangeError);
  });
});

describe("isMonthEnd", () => {
  it("is true once every four weeks", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(isMonthEnd)).toEqual([
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
    ]);
  });
});
