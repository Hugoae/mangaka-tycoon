// Must come before any Pixi renderer is created: it replaces the `new Function()` shader code
// that our Content Security Policy forbids (ADR 0009). The name is misleading, it needs no eval.
import "pixi.js/unsafe-eval";
import { Application, Sprite, Texture } from "pixi.js";

import { GAME_HEIGHT, GAME_WIDTH } from "../stage/integer-scale";
import type { GameStore } from "../store/game-store";
import { sceneViewOf } from "./scene-view";
import type { SceneView } from "./scene-view";

const COLOR = {
  wall: 0x2b2640,
  floor: 0x3d3355,
  desk: 0x8a5a3c,
  figure: 0xf0e8d8,
};

const FLOOR_Y = 240;
const FIGURE_START_X = 40;
const FIGURE_STEP_PIXELS = 12;

/** A coloured rectangle: placeholder art until real sprites exist (AGENTS.md section 6). */
function block(color: number, x: number, y: number, width: number, height: number): Sprite {
  const sprite = new Sprite(Texture.WHITE);
  sprite.tint = color;
  sprite.position.set(x, y);
  sprite.width = width;
  sprite.height = height;
  return sprite;
}

export interface GameScene {
  destroy(): void;
}

/**
 * Creates the pixel scene inside `host`. The scene only observes the store: it never calls the core
 * and holds no game rule (AGENTS.md 9.4, ADR 0014). Input goes through the React UI as commands.
 */
export async function createGameScene(host: HTMLElement, store: GameStore): Promise<GameScene> {
  const app = new Application();
  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    background: COLOR.wall,
    // Crisp pixels (ADR 0010): no anti-aliasing, whole-pixel positions, one device pixel per game pixel.
    antialias: false,
    roundPixels: true,
    resolution: 1,
    autoDensity: false,
  });
  host.appendChild(app.canvas);

  const floor = block(COLOR.floor, 0, FLOOR_Y, GAME_WIDTH, GAME_HEIGHT - FLOOR_Y);
  const desk = block(COLOR.desk, 24, FLOOR_Y - 24, 120, 24);
  const figure = block(COLOR.figure, FIGURE_START_X, FLOOR_Y - 64, 16, 40);
  app.stage.addChild(floor, desk, figure);

  const apply = (view: SceneView): void => {
    figure.x = FIGURE_START_X + view.figureStep * FIGURE_STEP_PIXELS;
  };
  apply(sceneViewOf(store.getState()));
  const unsubscribe = store.subscribe((state) => {
    apply(sceneViewOf(state));
  });

  return {
    destroy: () => {
      unsubscribe();
      app.destroy({ removeView: true }, { children: true });
    },
  };
}
