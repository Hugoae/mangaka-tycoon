import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { createI18n } from "./i18n/i18n";
import { Stage } from "./stage/stage";
import { createGameStore } from "./store/game-store";
import { GameStoreProvider } from "./store/store-context";
import "./styles.css";
import { App } from "./ui/app";

/** New-game seed. Entropy lives here, outside the core, which only ever receives the number. */
function pickSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

async function start(): Promise<void> {
  const container = document.getElementById("root");
  if (container === null) {
    throw new Error("The #root element is missing from index.html.");
  }

  const i18n = await createI18n();
  const store = createGameStore(pickSeed());

  createRoot(container).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <GameStoreProvider store={store}>
          <Stage>
            <App />
          </Stage>
        </GameStoreProvider>
      </I18nextProvider>
    </StrictMode>,
  );
}

void start();
