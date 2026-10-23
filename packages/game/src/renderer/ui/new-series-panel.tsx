import type { LocalizedText } from "@mangaka/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { localized, toLanguageCode } from "../i18n/language";
import { ChoiceGroup } from "./choice-group";

interface NamedEntry {
  readonly id: string;
  readonly name: LocalizedText;
}

export interface SeriesChoice {
  readonly title: string;
  readonly themeId: string;
  readonly targetId: string;
  readonly artStyleId: string;
}

export interface NewSeriesPanelProps {
  readonly themes: readonly NamedEntry[];
  readonly targets: readonly NamedEntry[];
  readonly artStyles: readonly NamedEntry[];
  readonly titleMaxLength: number;
  /** Title of the series the magazine just cancelled, to tell the player why they are here. */
  readonly cancelledTitle: string | null;
  readonly onStart: (choice: SeriesChoice) => void;
}

/** First-or-empty: the content always has at least one entry of each kind (validated at load). */
const firstId = (entries: readonly NamedEntry[]): string => entries[0]?.id ?? "";

/** Choice of the theme, audience, art style and title of a new series. */
export function NewSeriesPanel(props: NewSeriesPanelProps) {
  const { t, i18n } = useTranslation();
  const language = toLanguageCode(i18n.language);
  const [title, setTitle] = useState(() => t("newSeries.defaultTitle"));
  const [themeId, setThemeId] = useState(() => firstId(props.themes));
  const [targetId, setTargetId] = useState(() => firstId(props.targets));
  const [artStyleId, setArtStyleId] = useState(() => firstId(props.artStyles));

  const choices = (entries: readonly NamedEntry[]) =>
    entries.map((entry) => ({ id: entry.id, label: localized(entry.name, language) }));

  return (
    <section className="panel">
      <h1 className="panel__title">{t("newSeries.title")}</h1>
      {props.cancelledTitle === null ? null : (
        <p className="panel__notice">
          {t("newSeries.cancelledNotice", { title: props.cancelledTitle })}
        </p>
      )}
      <p className="panel__muted">{t("newSeries.intro")}</p>
      <label className="field">
        <span className="field__label">{t("newSeries.titleLabel")}</span>
        <input
          className="field__input"
          type="text"
          value={title}
          maxLength={props.titleMaxLength}
          onChange={(event) => {
            setTitle(event.currentTarget.value);
          }}
        />
      </label>
      <ChoiceGroup
        legend={t("newSeries.theme")}
        name="theme"
        choices={choices(props.themes)}
        value={themeId}
        onChange={setThemeId}
      />
      <ChoiceGroup
        legend={t("newSeries.target")}
        name="target"
        choices={choices(props.targets)}
        value={targetId}
        onChange={setTargetId}
      />
      <ChoiceGroup
        legend={t("newSeries.artStyle")}
        name="art-style"
        choices={choices(props.artStyles)}
        value={artStyleId}
        onChange={setArtStyleId}
      />
      <button
        className="button button--primary"
        type="button"
        disabled={title.trim().length === 0}
        onClick={() => {
          props.onStart({ title, themeId, targetId, artStyleId });
        }}
      >
        {t("newSeries.start")}
      </button>
    </section>
  );
}
