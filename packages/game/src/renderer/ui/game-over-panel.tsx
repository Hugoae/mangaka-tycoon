import { useTranslation } from "react-i18next";

import { formatNumber, toLanguageCode } from "../i18n/language";

export interface GameOverStats {
  readonly weeks: number;
  readonly chapters: number;
  readonly peakFans: number;
  readonly money: number;
}

export interface GameOverPanelProps {
  readonly stats: GameOverStats;
  readonly onNewGame: () => void;
}

/** End of a career: what the player achieved, and a way to try again. */
export function GameOverPanel(props: GameOverPanelProps) {
  const { t, i18n } = useTranslation();
  const language = toLanguageCode(i18n.language);
  const number = (value: number): string => formatNumber(value, language);

  return (
    <section className="panel">
      <h1 className="panel__title">{t("gameOver.title")}</h1>
      <p className="panel__muted">{t("gameOver.intro")}</p>
      <ul className="panel__stats">
        <li>{t("gameOver.weeks", { value: number(props.stats.weeks) })}</li>
        <li>{t("gameOver.chapters", { value: number(props.stats.chapters) })}</li>
        <li>{t("gameOver.peakFans", { value: number(props.stats.peakFans) })}</li>
        <li>{t("gameOver.money", { amount: number(props.stats.money) })}</li>
      </ul>
      <button className="button button--primary" type="button" onClick={props.onNewGame}>
        {t("gameOver.newGame")}
      </button>
    </section>
  );
}
