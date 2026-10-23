import { weekToDate } from "@mangaka/core";
import { useTranslation } from "react-i18next";

import { monthName } from "../i18n/month-name";
import { formatNumber, otherLanguage, toLanguageCode } from "../i18n/language";

export interface HudProps {
  readonly week: number;
  readonly money: number;
  /** Fans of the running series, `undefined` when there is none. */
  readonly fans: number | undefined;
  readonly fatigue: number;
  readonly fatigueMax: number;
}

/** The permanent top bar: date, money, fans, fatigue gauge and the language switch. */
export function Hud(props: HudProps) {
  const { t, i18n } = useTranslation();
  const language = toLanguageCode(i18n.language);
  const date = weekToDate(props.week);

  return (
    <header className="hud">
      <span className="hud__item">
        {t("hud.date", {
          month: monthName(date.month, language),
          year: date.year,
          // The core counts from 0; players count from 1.
          week: date.weekOfMonth + 1,
        })}
      </span>
      <span className="hud__item hud__money">
        {t("hud.money", { amount: formatNumber(props.money, language) })}
      </span>
      {props.fans === undefined ? null : (
        <span className="hud__item">
          {t("hud.fans", { value: formatNumber(props.fans, language) })}
        </span>
      )}
      <label className="hud__item hud__fatigue">
        <span>{t("hud.fatigue")}</span>
        <progress className="gauge" value={props.fatigue} max={props.fatigueMax} />
        <span>{formatNumber(props.fatigue, language)}</span>
      </label>
      <button
        className="hud__language"
        type="button"
        title={t("hud.otherLanguageName")}
        onClick={() => {
          void i18n.changeLanguage(otherLanguage(language));
        }}
      >
        {t("hud.otherLanguage")}
      </button>
    </header>
  );
}
