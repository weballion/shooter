# Bot Monster Models — Design Spec

Date: 2026-07-16

## Overview

Bots are currently rendered as a magenta capsule with a flat procedural
visor (or an optional user-supplied face photo disc). This feature adds an
opt-in toggle that swaps the capsule for one of a handful of low-poly 3D
monster models (with walk/attack animations), matching a retro-shooter
aesthetic (DOOM-era demons). Off by default; existing capsule/photo
behavior is unchanged when the toggle is off.

## Assets & Licensing

- Source: Quaternius "Ultimate Monsters Bundle" (CC0 1.0 Universal —
  https://poly.pizza/bundle/Ultimate-Monsters-Bundle-5oyGWAmOB6, mirrored
  from https://quaternius.com). Free for any use, including commercial,
  no attribution required.
- Pick 3–4 low-poly, humanoid-ish demon/monster models from the bundle
  that read well at bot scale and fit the neon-arena tone.
- Unlike `assets/faces/*.png` (gitignored, user-supplied, potentially
  real photos), these are redistributable CC0 assets — they are
  **committed to the repo**, not gitignored.
- Store as `assets/models/monster1.glb` .. `monster4.glb` (self-contained
  binary glTF — embed textures in the .glb so no loose texture files are
  needed). Add `assets/models/LICENSE.txt` recording the source URL and
  CC0 license for provenance, even though attribution isn't legally
  required.
- New vendored Three.js addons (currently only core `three.module.js` is
  vendored): `vendor/three/addons/loaders/GLTFLoader.js` and
  `vendor/three/addons/utils/SkeletonUtils.js`, copied from the same
  Three.js release as the vendored core, added to the `index.html`
  importmap. No CDN references, consistent with the existing
  vendoring policy. If any chosen model uses Draco compression, either
  re-export without it or additionally vendor `DRACOLoader.js` — verified
  during implementation once the actual files are in hand.

## Module: `src/monsterModels.js`

Mirrors `src/faces.js`'s structure:

- `loadMonsterModels()` — loads each of the (up to 4) `.glb` files via
  `GLTFLoader`, in parallel, skipping missing/broken files rather than
  throwing (same resilience as `loadFaceTextures()`). Returns an array of
  `{ scene, animations, scale }`, where `scale` is a precomputed uniform
  scale factor (derived from each model's bounding-box height at
  implementation time) so all monsters render at a consistent height
  regardless of the source model's native scale.
- A shared `pickRandom(items, count)` shuffle-and-pick helper is
  extracted (used identically today only inside `faces.js` as
  `pickRandomFaces`) into a small shared util so `faces.js` and
  `monsterModels.js` both call the same function instead of duplicating
  the shuffle logic.

## `src/bot.js` changes

- `buildMesh(spawnPosition, faceTexture, monsterModel)` gains a third,
  mutually-exclusive-with-`faceTexture` optional parameter (callers pass
  one or the other, never both — the round-setup code in `main.js`
  decides which mode is active before constructing bots).
- When `monsterModel` is supplied:
  - Clone the template via `SkeletonUtils.clone(monsterModel.scene)` —
    plain `Object3D.clone()` does not correctly share/rebind skeletons
    for skinned animated meshes across multiple bot instances, so the
    dedicated clone util is required.
  - Apply `monsterModel.scale` and reposition so the model's feet sit at
    the bot's existing ground offset, matching today's capsule footprint.
  - Skip `buildFace()` / `buildFaceImage()` entirely — no photo disc is
    attached in model mode.
  - Keep the existing `PointLight` glow attached to the bot group, so
    models still read as "neon arena" enemies rather than plain low-poly
    imports.
- New `THREE.AnimationMixer` per bot instance (`this.mixer`), only
  created in model mode:
  - Actions resolved by a simple case-insensitive substring match against
    clip names for `idle`, `walk`, and `attack` (exact clip names to be
    confirmed once the real files are inspected; fall back to "first
    available clip" as idle if no match is found, so an unfamiliar
    naming scheme degrades gracefully instead of crashing).
  - Default: idle loops. When `Bot.update()` computes a non-null
    `moveDir` (bot is actually moving this frame), crossfade to the walk
    action; crossfade back to idle when it stops.
  - On `_fireAt()` (the bot actually taking a shot), play the attack
    action once (non-looping), then return to the previous
    walk/idle state.
  - `Bot.update(delta, ...)` calls `this.mixer.update(delta)` each frame
    when present.
- Facing/orientation: keep the existing
  `mesh.rotation.y = atan2(...) + PI` logic. Some source models may not
  have their rest-pose "forward" aligned the same way the capsule does;
  if a monster appears to walk backwards, add a per-model constant
  rotation offset (analogous to the existing `rotation.y = Math.PI` fix
  already applied to the face-photo disc) — confirmed visually during
  implementation, not guessable in advance.
- Collision is unaffected: `collision.js` operates on `RADIUS` and
  `position` only, never on mesh geometry, so swapping the visual mesh
  changes nothing about hit-detection or movement blocking.
- Bot death is unchanged: instant `scene.remove(mesh)` plus the existing
  explosion particle effect. No death animation in v1 — the current
  removal + explosion already reads fine and matches the neon aesthetic;
  playing a death clip first is out of scope for this pass.

## UI toggle

- New checkbox in `.options-row` on the start screen, following the
  existing pattern exactly:
  ```html
  <label class="checkbox-toggle">
    <input type="checkbox" id="monster-models-checkbox" />
    <span>Monster models</span>
  </label>
  ```
  Unchecked (off) by default.
- `hud.js`: `this.monsterModelsCheckboxEl = document.getElementById('monster-models-checkbox');`
  and `getMonsterModelsEnabled() { return this.monsterModelsCheckboxEl.checked; }`,
  matching the `get<Thing>Enabled()` naming convention used by the other
  boolean toggles.
- `main.js`: monster models are loaded once at startup alongside the
  existing `loadFaceTextures()` call (both are awaited before the game
  becomes interactive, same as today). At round start
  (`beginRound()`), if `hud.getMonsterModelsEnabled()` is true **and**
  at least one model loaded successfully, each bot is constructed with a
  random model (via the shared `pickRandom` helper) instead of a face
  texture. Otherwise, existing behavior is untouched: bots get a random
  face texture (or none) exactly as today.
- No persistence — consistent with every other toggle in the game
  (no `localStorage` usage anywhere currently); the checkbox resets to
  unchecked on page reload like the rest.

## Non-goals for v1

- No death animation / ragdoll.
- No per-monster distinct sounds — existing synthesized hit/fire audio
  is unaffected by the mesh swap.
- No UI for picking a specific monster per bot — always a random pick
  from the small bundled pool, mirroring how face photos are randomly
  assigned today.
- Monster models and face photos are mutually exclusive per the toggle;
  no combined "monster body + user photo face" mode.
