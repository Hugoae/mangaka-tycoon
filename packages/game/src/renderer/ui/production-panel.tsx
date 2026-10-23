import { SLIDER_KEYS, totalPoints } from "@mangaka/core";
import type { ChapterEvaluation, SliderKey, Sliders } from "@mangaka/core";
import { useTranslation } from "react-i18next";

import { formatNumber, toLanguageCode } from "../i18n/language";
import { describeAxis } from "./report";

export interface MagazineRow {
  readonly id: string;
  readonly name: string;
  readonly strength: number;
}

export interface ProductionPanelProps {
  readonly seriesTitle: string;
  readonly chapterNumber: number;
  readonly sliders: Sliders;
  readonly sliderMax: number;
  /** Slider points the mangaka can spend this week. */
  readonly budget: number;
  readonly qualityMax: number;
  /** What the chapter would be worth with the current sliders. */
  readonly preview: ChapterEvaluation | undefined;
  readonly magazine: readonly MagazineRow[];
  readonly onSliderChange: (axis: SliderKey, value: number) => void;
  readonly onPublish: () => void;
  readonly onRest: () => void;
}

const PLAYER_ROW_ID = "player";

/** The magazine's series by strength, with the player's estimated chapter slotted in. */
function rankedRows(
  magazine: readonly MagazineRow[],
  you: MagazineRow | undefined,
): readonly MagazineRow[] {
  const rows = you === undefined ? magazine : [...magazine, you];
  return rows.toSorted((first, second) => second.strength - first.strength);
}

/** The weekly decision: spread the energy over the five sliders, then publish or rest. */
export function ProductionPanel(props: ProductionPanelProps) {
  const { t, i18n } = useTranslation();
  const language = toLanguageCode(i18n.language);
  const spent = totalPoints(props.sliders);
  const shares = new Map(props.preview?.axes.map((axis) => [axis.axis, axis.weight]));
  const you: MagazineRow | undefined =
    props.preview === undefined
      ? undefined
      : { id: PLAYER_ROW_ID, name: t("production.you"), strength: props.preview.quality };

  return (
    <section className="panel">
      <h1 className="panel__title">
        {t("production.title", { title: props.seriesTitle, chapter: props.chapterNumber })}
      </h1>

      <p className="panel__line">
        {t("production.energy", {
          used: formatNumber(spent, language),
          available: formatNumber(props.budget, language),
        })}
      </p>

      {SLIDER_KEYS.map((axis) => (
        <label className="slider" key={axis}>
          <span className="slider__label">
            {t("slider.label", {
              axis: describeAxis(t, axis),
              share: formatNumber((shares.get(axis) ?? 0) * 100, language),
            })}
          </span>
          <input
            className="slider__input"
            type="range"
            min={0}
            max={props.sliderMax}
            step={1}
            value={props.sliders[axis]}
            onChange={(event) => {
              props.onSliderChange(axis, Number(event.currentTarget.value));
            }}
          />
          <span className="slider__value">{props.sliders[axis]}</span>
        </label>
      ))}

      {props.preview === undefined ? null : (
        <p className="panel__line panel__line--strong">
          {t("production.quality", {
            quality: formatNumber(props.preview.quality, language, 1),
            max: props.qualityMax,
          })}
        </p>
      )}

      <div className="panel__actions">
        <button className="button button--primary" type="button" onClick={props.onPublish}>
          {t("production.publish")}
        </button>
        <button
          className="button"
          type="button"
          title={t("production.restHint")}
          onClick={props.onRest}
        >
          {t("production.rest")}
        </button>
      </div>

      <h2 className="panel__subtitle">{t("production.competitors")}</h2>
      <ol className="magazine">
        {rankedRows(props.magazine, you).map((row) => (
          <li
            className={
              row.id === PLAYER_ROW_ID ? "magazine__row magazine__row--you" : "magazine__row"
            }
            key={row.id}
          >
            <span>{row.name}</span>
            <span>{formatNumber(row.strength, language, 1)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
