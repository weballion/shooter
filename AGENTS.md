# Agent notes for this repo

Static-site 3D FPS (Three.js). Keep it that way — the constraints below are
deliberate, not oversights.

- **No build step.** Plain ES modules loaded directly by the browser via the
  `importmap` in `index.html`. Don't add a bundler/npm scripts/TypeScript
  build; the whole point is "clone it, run one static server, it works."
- **Three.js is vendored, not CDN-loaded.** `vendor/three/three.module.js` is
  a self-contained build copied in on purpose so the game runs with no
  internet connection. Don't point the importmap back at unpkg/CDN.
- **Audio is 100% synthesized** (`src/audio.js`, Web Audio oscillators/noise).
  No external audio files — keep it that way rather than adding assets.
- **Controls are fixed by design:** arrows move/strafe, mouse looks
  (pointer-lock), Space or left mouse fires, Escape pauses. On touch devices
  (`(pointer: coarse)`), `input.js` also drives the same state from an
  on-screen joystick + look-drag + fire/pause buttons — see `#touch-controls`
  in `index.html`. `player.js`/`main.js` don't know or care which source fed
  `InputManager`'s state. See
  `docs/superpowers/specs/2026-07-14-3d-fps-arena-design.md` for the full
  rationale behind these and other design choices.
- **Architecture:** `src/main.js` owns the state machine (START / PLAYING /
  PAUSED / ROUND_TRANSITION / ENDED) and wires together `arena.js`,
  `player.js`, `bot.js`, `input.js`, `hud.js`, `effects.js`,
  `damageNumbers.js`, `audio.js`, and the shared `collision.js` helper. Each
  module is single-purpose; prefer adding a focused module over growing
  `main.js`.
- **CSS gotcha:** utility classes like `.desktop-only`/`.touch-only` must be
  paired with their target class (e.g. `.controls-list.touch-only`) to win
  the cascade — a bare `.touch-only { display: none }` has the same
  specificity as `.controls-list { display: inline-block }` defined later in
  the file, and loses on source order alone. Bit this exact bug twice while
  building the touch controls; watch for it when adding new show/hide
  modifiers to existing components.

## Running / verifying changes

No test suite. To check a change actually works:

```bash
python3 -m http.server 8000   # from the repo root; file:// won't work (ES modules)
```

Then drive it with a headless browser (Playwright isn't a project
dependency — install `playwright-core` in a scratch dir and point
`chromium.launch({ executablePath: ... })` at a local Chrome install, or use
whatever headless-browser tooling is available). Note: pointer lock reliably
throws a benign `pageerror` under headless automation (synthetic clicks
aren't a "real" user gesture for that API) — that's an automation artifact,
not a bug, as long as keyboard/mouse-button input still drives the game.
