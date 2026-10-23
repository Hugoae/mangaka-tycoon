import type { WeekIndex } from "../calendar/calendar";

/**
 * Events are the journal the UI displays. They carry translation keys and parameters, never
 * formatted text, so the language can change at any time (ADR 0007).
 */
export interface WeekAdvancedEvent {
  readonly kind: "weekAdvanced";
  readonly key: "event.weekAdvanced";
  readonly params: { readonly week: WeekIndex };
}

export type GameEvent = WeekAdvancedEvent;
