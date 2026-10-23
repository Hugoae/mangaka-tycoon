import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import { computeIntegerScale } from "./integer-scale";

function subscribeToResize(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
  };
}

const currentScale = (): number => computeIntegerScale(window.innerWidth, window.innerHeight);

/**
 * The 640x360 game area, scaled by a whole number and centred (ADR 0010). The scale is exposed to
 * CSS as `--scale`, so layouts are written in game pixels. Remaining space is a letterbox.
 */
export function Stage(props: { readonly scene?: ReactNode; readonly children: ReactNode }) {
  const scale = useSyncExternalStore(subscribeToResize, currentScale);
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Set through the CSSOM: a style *attribute* would need 'unsafe-inline' in the CSP.
    stageRef.current?.style.setProperty("--scale", String(scale));
  }, [scale]);

  return (
    <div className="viewport">
      <div className="stage" ref={stageRef}>
        {props.scene}
        <div className="overlay">{props.children}</div>
      </div>
    </div>
  );
}
