import { useTranslation } from "react-i18next";

export interface ContentErrorScreenProps {
  /** Technical lines from the content loader: they are for the person who edited the data. */
  readonly errors: readonly string[];
}

/** Shown instead of the game when the data files cannot be read or are invalid. */
export function ContentErrorScreen(props: ContentErrorScreenProps) {
  const { t } = useTranslation();

  return (
    <section className="panel panel--error" role="alert">
      <h1 className="panel__title">{t("app.contentError.title")}</h1>
      <p className="panel__muted">{t("app.contentError.hint")}</p>
      <ul className="panel__errors">
        {props.errors.map((error, index) => (
          <li key={`error-${String(index)}`}>{error}</li>
        ))}
      </ul>
    </section>
  );
}
