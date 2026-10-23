import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";

import { createI18n } from "../i18n/i18n";
import type { Language } from "../i18n/i18n";
import { createGameStore } from "../store/game-store";
import { GameStoreProvider } from "../store/store-context";
import { TEST_CONTENT } from "../testing/test-content";
import { ContentErrorScreen } from "./content-error-screen";
import { gameOverStats } from "./game-over-stats";
import { GameScreen } from "./game-screen";

const START = {
  kind: "startSeries",
  title: "Mon <manga>",
  themeId: "sport",
  targetId: "shonen",
  artStyleId: "classic",
} as const;

const GOOD_CHAPTER = {
  kind: "produceChapter",
  sliders: { story: 0, art: 0, characters: 25, worldbuilding: 0, pacing: 25 },
} as const;

async function render(
  prepare: (store: ReturnType<typeof createGameStore>) => void,
  language: Language = "fr",
): Promise<string> {
  const i18n = await createI18n(language);
  const store = createGameStore(1, TEST_CONTENT);
  prepare(store);
  return renderToStaticMarkup(
    createElement(I18nextProvider, {
      i18n,
      children: createElement(GameStoreProvider, {
        store,
        children: createElement(GameScreen),
      }),
    }),
  );
}

describe("GameScreen", () => {
  it("offers to start a series at the beginning, with every theme of the content", async () => {
    const html = await render(() => undefined);

    expect(html).toContain("Lancer une nouvelle série");
    expect(html).toContain("Sport");
    expect(html).toContain("Comédie");
    expect(html).toContain("Shonen");
    expect(html).toContain("Classique");
  });

  it("shows the hud with the date, the money and the fatigue", async () => {
    const html = await render(() => undefined);

    expect(html).toContain("Janvier 1980 · semaine 1");
    expect(html).toContain("1 000 ¥");
    expect(html).toContain('max="100"');
  });

  it("shows the chapter planner once a series runs, and escapes the title", async () => {
    const html = await render((store) => {
      store.getState().dispatch(START);
    });

    expect(html).toContain("chapitre 1");
    expect(html).toContain("Mon &lt;manga&gt;");
    expect(html).toContain("Publier le chapitre");
    expect(html).toContain("Se reposer cette semaine");
    expect(html.match(/type="range"/g)).toHaveLength(5);
  });

  it("shows the estimated quality and the magazine with the player slotted in", async () => {
    const html = await render((store) => {
      store.getState().dispatch(START);
    });

    expect(html).toContain("Qualité estimée");
    expect(html).toContain("Rival");
    expect(html).toContain("Vous (estimation)");
  });

  it("shows the explanation of the last chapter", async () => {
    const html = await render((store) => {
      store.getState().dispatch(START);
      store.getState().dispatch(GOOD_CHAPTER);
    });

    expect(html).toContain("Dernier résultat");
    expect(html).toContain("Chapitre publié");
    expect(html).toContain("Qualité de base");
    expect(html).toContain("chapitre 2");
  });

  it("speaks English when the language is English", async () => {
    const html = await render(() => undefined, "en");

    expect(html).toContain("Start a new series");
    expect(html).toContain("January 1980 · week 1");
  });

  it("shows the bankruptcy screen with the stats and a way to start over", async () => {
    const html = await render((store) => {
      store.getState().dispatch(START);
      for (let week = 0; week < 12; week += 1) {
        store.getState().dispatch({ kind: "advanceWeek" });
      }
    });

    expect(html).toContain("Faillite");
    expect(html).toContain("Nouvelle partie");
  });

  it("tells the player that the magazine cancelled the series", async () => {
    const html = await render((store) => {
      store.getState().dispatch({ ...START, themeId: "comedy" });
      const worst = {
        kind: "produceChapter",
        sliders: { story: 0, art: 0, characters: 0, worldbuilding: 0, pacing: 0 },
      } as const;
      store.getState().dispatch(worst);
      store.getState().dispatch(worst);
      store.getState().dispatch(worst);
    });

    expect(html).toContain("a été arrêtée par le magazine");
    expect(html).toContain("Lancer une nouvelle série");
  });
});

describe("gameOverStats", () => {
  it("sums chapters over every series and reads the peak of fans from the history", () => {
    const store = createGameStore(1, TEST_CONTENT);
    store.getState().dispatch(START);
    store.getState().dispatch(GOOD_CHAPTER);
    store.getState().dispatch(GOOD_CHAPTER);

    const stats = gameOverStats(store.getState().game);

    expect(stats.weeks).toBe(2);
    expect(stats.chapters).toBe(2);
    expect(stats.peakFans).toBeGreaterThan(0);
  });

  it("is all zero for a game that has not started", () => {
    expect(gameOverStats(createGameStore(1, TEST_CONTENT).getState().game)).toEqual({
      weeks: 0,
      chapters: 0,
      peakFans: 0,
      money: 1000,
    });
  });
});

describe("ContentErrorScreen", () => {
  it("lists every problem found in the data", async () => {
    const i18n = await createI18n();

    const html = renderToStaticMarkup(
      createElement(
        I18nextProvider,
        { i18n },
        createElement(ContentErrorScreen, {
          errors: ["balance.jsonc:3:1: bad value.", "themes.jsonc: file is missing."],
        }),
      ),
    );

    expect(html).toContain("Impossible de charger les données du jeu");
    expect(html).toContain("balance.jsonc:3:1: bad value.");
    expect(html).toContain("themes.jsonc: file is missing.");
  });
});
