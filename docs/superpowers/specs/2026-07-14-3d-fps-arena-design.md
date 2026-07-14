# 3D FPS Arena — Design Spec

Date: 2026-07-14

## Overview

A static website hosting a browser-based 3D first-person shooter. The player
fights a single computer-controlled opponent in a walled sci-fi neon arena.
No backend, no build step — plain Three.js loaded from a CDN as an ES module.

## Architecture

Static site: `index.html` + `style.css` + a handful of ES-module JS files.
Runs entirely client-side; can be opened directly or served from any static
file host.

```
index.html          — page shell, HUD overlay, canvas mount point
style.css           — HUD styling (health bars, crosshair, menus)
src/main.js         — scene setup, render loop, game state machine
src/arena.js        — builds the arena geometry/lighting
src/player.js       — player movement, camera, shooting, health
src/bot.js          — AI opponent: chase logic, shooting, health
src/input.js        — keyboard + mouse input handling
src/hud.js          — health bars, crosshair, victory/defeat screen
```

## Arena & Visuals

Sci-fi neon style. A walled arena (~40x40 units), dark floor and walls with
an emissive neon grid texture (cyan/magenta lines), ambient dim lighting, and
a scatter of glowing pillars/crates used as cover and to break sightlines
between player and bot. No post-processing (bloom) in v1 — emissive
materials alone convey the neon look; bloom can be added later without
architectural changes.

## Controls

- **Up / Down arrows** — move forward / backward in the direction the
  camera faces.
- **Left / Right arrows** — strafe left / right.
- **Mouse move** — look around (standard FPS mouselook, pointer-lock
  engaged on click into the canvas).
- **Space** — fire weapon.
- The player is confined to the arena via AABB collision checks against
  walls and props.

## Combat

- The player fires an instant-hit ray from the camera center on Space,
  gated by a fire-rate cooldown (~0.3s) to prevent full-auto spam.
  Firing triggers a crosshair flash/recoil kick; a confirmed hit gives
  additional visual feedback (e.g. hit marker flash).
- The bot fires using the same instant-hit ray logic from its own position
  whenever it has line-of-sight to the player and is within range, on a
  similar cooldown, with some aim inaccuracy applied so it is beatable.
- Both combatants start at 100 HP. Each confirmed hit deals a fixed 20 HP
  of damage. Current HP for both player and bot is shown via HUD health
  bars.

## AI Opponent

Aggressive chaser, implemented as a simple state machine:

- **Chase** — no line-of-sight to the player: move toward the player's
  last-known/current position. Basic steering avoids walls/props via a
  raycast-ahead check, steering around obstacles rather than pathfinding
  through them.
- **Engage** — has line-of-sight and is within range: stop closing past a
  comfort distance, strafe side-to-side, and fire.
- The bot uses the same arena collision as the player, so it cannot clip
  through walls or props.

## Win/Lose Flow

Single round, no respawns:

1. Start screen with instructions and a Start button.
2. Gameplay begins; both combatants at 100 HP.
3. First combatant to reach 0 HP ends the round.
4. Full-screen Victory or Defeat overlay is shown with a Restart button.
5. Restart resets both combatants' health and positions and begins a new
   round.

## Out of Scope (v1)

- Multiplayer / networking.
- Multiple bot opponents or difficulty levels.
- Weapon variety (single weapon only).
- Sound effects/music.
- Bloom/post-processing visual effects.
- Mobile/touch controls.
