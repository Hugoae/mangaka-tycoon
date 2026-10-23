export interface HubScreenProps {
  /** Already translated: this component knows nothing about i18n or the game. */
  readonly dateLabel: string;
  readonly nextWeekLabel: string;
  readonly eventLogLabel: string;
  readonly eventMessages: readonly string[];
  readonly onNextWeek: () => void;
}

/** Presentational hub: everything arrives through props, nothing is read from the store. */
export function HubScreen(props: HubScreenProps) {
  return (
    <main className="hub">
      <h1 className="hub__date">{props.dateLabel}</h1>
      <button className="hub__next-week" type="button" onClick={props.onNextWeek}>
        {props.nextWeekLabel}
      </button>
      <section className="hub__log" aria-label={props.eventLogLabel}>
        <ul>
          {props.eventMessages.map((message, index) => (
            // Messages are replaced as a whole on each command: the index is a stable identity.
            <li key={index}>{message}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
