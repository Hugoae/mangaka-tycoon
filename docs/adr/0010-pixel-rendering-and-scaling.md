# 0010. 640x360 internal resolution and integer scaling

- Status: Accepted, pending verification in the Electron skeleton
- Date: 2026-10-23

## Context

A tycoon shows a lot of text and numbers. The game must stay pixel-perfect on any screen.
Windows display scaling (125%, 150%) makes `devicePixelRatio` fractional, so an "integer" CSS scale can land on fractional physical pixels and blur.

## Decision

- **Internal resolution 640x360** (16:9). It scales by exactly x2 on 1280x720, x3 on 1920x1080, x4 on 2560x1440 and x6 on 3840x2160,
  and fits x2 on 1366x768 laptops.
- **Integer scale factors only.** Remaining space is letterboxed and filled with a game pattern, not plain black.
- **Borderless fullscreen by default**, because a window title bar on a 1080p screen would force a smaller factor.
- Force a device scale factor of 1 with `app.commandLine.appendSwitch("force-device-scale-factor", "1")` in the main process,
  then compute the integer scale ourselves from the real screen size. The React UI is sized in "game pixels" multiplied by a `--scale` CSS variable.
- Nearest-neighbour filtering everywhere, `image-rendering: pixelated`, rounded positions, antialiasing off on the scene.

## Alternatives considered

- **480x270.** Bigger pixels, less art per screen, but only x2 on common laptops, leaving large borders. This is an art direction trade-off that remains Hugo's call.
- **Native resolution UI with a pixel look.** Loses the guarantee of crisp, aligned pixels.

## Consequences

- **Acceptance criterion for the Electron skeleton**: verify pixel-perfect rendering at 100%, 125% and 150% Windows scaling,
  with screenshots stored in the repository. If the switch does not behave as expected on Electron 44, this ADR must be revised.
- Layout is computed in game pixels, which makes UI design resolution-independent.
- Fonts must be pixel fonts rendered at integer multiples of their design size.
