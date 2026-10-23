import { StrictMode } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { loadContent } from "./content/load-content";
import { createI18n } from "./i18n/i18n";
import { pickSeed } from "./random-seed";
import { SceneHost } from "./stage/scene-host";
import { Stage } from "./stage/stage";
import { createGameStore } from "./store/game-store";
import { GameStoreProvider } from "./store/store-context";
import "./styles.css";
import { App } from "./ui/app";
import { ContentErrorScreen } from "./ui/content-error-screen";

async function start(): Promise<void> {
  const container = document.getElementById("root");
  if (container === null) {
    throw new Error("The #root element is missing from index.html.");
  }

  const i18n = await createI18n();
  const loaded = await loadContent();

  const screen: ReactNode = loaded.ok ? (
    <GameStoreProvider store={createGameStore(pickSeed(), loaded.content)}>
      <GameStage />
    </GameStoreProvider>
  ) : (
    <Stage>
      <ContentErrorScreen errors={loaded.errors} />
    </Stage>
  );

  createRoot(container).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>{screen}</I18nextProvider>
    </StrictMode>,
  );
}

function GameStage() {
  return (
    <Stage scene={<SceneHost />}>
      <App />
    </Stage>
  );
}

void start();
