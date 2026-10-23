import {
  energyBudget,
  expectedCompetitorStrengths,
  findRunningSeries,
  previewChapter,
} from "@mangaka/core";
import type { GameContent, GameState, LanguageCode, Series, Sliders } from "@mangaka/core";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { localized, toLanguageCode } from "../i18n/language";
import { pickSeed } from "../random-seed";
import {
  selectContent,
  selectDispatch,
  selectGame,
  selectLastEvents,
  selectNewGame,
} from "../store/selectors";
import { useGameStore } from "../store/store-context";
import { GameOverPanel } from "./game-over-panel";
import { gameOverStats } from "./game-over-stats";
import { Hud } from "./hud";
import { NewSeriesPanel } from "./new-series-panel";
import { ProductionPanel } from "./production-panel";
import type { MagazineRow } from "./production-panel";
import { buildReport } from "./report";
import { ReportPanel } from "./report-panel";
import { fitToBudget, setSlider, STARTING_SLIDERS } from "./sliders";

function magazineRows(
  content: GameContent,
  game: GameState,
  language: LanguageCode,
): MagazineRow[] {
  return expectedCompetitorStrengths(content, game.week).map((entry) => {
    const competitor = content.competitors.find((candidate) => candidate.id === entry.id);
    return {
      id: entry.id,
      name: competitor === undefined ? entry.id : localized(competitor.name, language),
      strength: entry.score,
    };
  });
}

interface ProductionScreenProps {
  readonly game: GameState;
  readonly content: GameContent;
  readonly series: Series;
}

/** The chapter planner: owns the slider allocation (screen state) and sends commands. */
function ProductionScreen(props: ProductionScreenProps) {
  const { i18n } = useTranslation();
  const language = toLanguageCode(i18n.language);
  const dispatch = useGameStore(selectDispatch);
  const [allocation, setAllocation] = useState<Sliders>(STARTING_SLIDERS);

  const { game, content } = props;
  const budget = energyBudget(content.balance, game.mangaka.fatigue);
  // The same allocation may no longer fit once the mangaka is tired.
  const sliders = fitToBudget(allocation, budget);

  return (
    <ProductionPanel
      seriesTitle={props.series.title}
      chapterNumber={props.series.chaptersPublished + 1}
      sliders={sliders}
      sliderMax={content.balance.slider.max}
      budget={budget}
      qualityMax={content.balance.quality.max}
      preview={previewChapter(game, content, sliders)}
      magazine={magazineRows(content, game, language)}
      onSliderChange={(axis, value) => {
        setAllocation(setSlider(sliders, axis, value, budget, content.balance.slider.max));
      }}
      onPublish={() => {
        dispatch({ kind: "produceChapter", sliders });
      }}
      onRest={() => {
        dispatch({ kind: "advanceWeek" });
      }}
    />
  );
}

/** The whole game UI, wired to the store: the HUD, the panel of the current situation, the report. */
export function GameScreen() {
  const { t, i18n } = useTranslation();
  const language = toLanguageCode(i18n.language);
  const game = useGameStore(selectGame);
  const content = useGameStore(selectContent);
  const lastEvents = useGameStore(selectLastEvents);
  const dispatch = useGameStore(selectDispatch);
  const newGame = useGameStore(selectNewGame);

  const running = findRunningSeries(game);
  const lastSeries = game.series.at(-1);

  let panel: ReactNode;
  if (game.phase === "bankrupt") {
    panel = (
      <GameOverPanel
        stats={gameOverStats(game)}
        onNewGame={() => {
          newGame(pickSeed());
        }}
      />
    );
  } else if (running === undefined) {
    panel = (
      <NewSeriesPanel
        themes={content.themes}
        targets={content.targets}
        artStyles={content.artStyles}
        titleMaxLength={content.balance.series.titleMaxLength}
        cancelledTitle={lastSeries?.status === "cancelled" ? lastSeries.title : null}
        onStart={(choice) => {
          dispatch({ kind: "startSeries", ...choice });
        }}
      />
    );
  } else {
    panel = <ProductionScreen game={game} content={content} series={running} />;
  }

  return (
    <>
      <Hud
        week={game.week}
        money={game.money}
        fans={running?.fans}
        fatigue={game.mangaka.fatigue}
        fatigueMax={content.balance.fatigue.max}
      />
      <ReportPanel report={buildReport(t, lastEvents, language)} />
      {panel}
    </>
  );
}
