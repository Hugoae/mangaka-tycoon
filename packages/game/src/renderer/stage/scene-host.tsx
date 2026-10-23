import { useEffect, useRef } from "react";

import { useGameStoreApi } from "../store/store-context";
import { createGameScene } from "../scene/game-scene";
import type { GameScene } from "../scene/game-scene";

/** Mounts the Pixi scene in a div and disposes it on unmount (ADR 0014). */
export function SceneHost() {
  const hostRef = useRef<HTMLDivElement>(null);
  const store = useGameStoreApi();

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) {
      return undefined;
    }

    // `init` is asynchronous: if React unmounts first (StrictMode does it on purpose), the scene
    // is destroyed as soon as it exists instead of leaking.
    let disposed = false;
    let scene: GameScene | null = null;
    void createGameScene(host, store).then((created) => {
      if (disposed) {
        created.destroy();
      } else {
        scene = created;
      }
    });

    return () => {
      disposed = true;
      scene?.destroy();
      scene = null;
    };
  }, [store]);

  return <div className="scene" ref={hostRef} />;
}
