import * as THREE from 'three';
import { createArena } from './arena.js';
import { Player } from './player.js';
import { Bot, SPAWN_POINTS, RADIUS as BOT_RADIUS } from './bot.js';
import { InputManager } from './input.js';
import { HUD } from './hud.js';
import { Effects } from './effects.js';
import { DamageNumbers } from './damageNumbers.js';
import { SoundManager } from './audio.js';

const PLAYER_BOLT_COLOR = 0x00e5ff;
const BOT_BOLT_COLOR = 0xff2ec4;
const SURVIVAL_MAX_ROUND = SPAWN_POINTS.length;

/** Keeps bots from overlapping each other by pushing apart any pair that's too close. */
function separateBots(bots) {
  for (let i = 0; i < bots.length; i++) {
    for (let j = i + 1; j < bots.length; j++) {
      const a = bots[i];
      const b = bots[j];
      if (!a.isAlive || !b.isAlive) continue;

      const dx = b.position.x - a.position.x;
      const dz = b.position.z - a.position.z;
      const dist = Math.hypot(dx, dz);
      const minDist = BOT_RADIUS * 2;
      if (dist > 0 && dist < minDist) {
        const push = (minDist - dist) / 2;
        const nx = dx / dist;
        const nz = dz / dist;
        a.position.x -= nx * push;
        a.position.z -= nz * push;
        b.position.x += nx * push;
        b.position.z += nz * push;
      }
    }
  }
}

const container = document.getElementById('game-container');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const arena = createArena(scene);

const player = new Player();
let bots = [];
const input = new InputManager(renderer.domElement);
const hud = new HUD();
const effects = new Effects(scene);
const damageNumbers = new DamageNumbers(document.getElementById('damage-numbers'));
const sound = new SoundManager();

let state = 'START'; // 'START' | 'PLAYING' | 'PAUSED' | 'ROUND_TRANSITION' | 'ENDED'
let mode = 'NORMAL'; // 'NORMAL' | 'SURVIVAL'
let survivalRound = 1;
let carryHealth = true;

function spawnBots(count) {
  bots.forEach((b) => scene.remove(b.mesh));
  bots = SPAWN_POINTS.slice(0, count).map((point) => new Bot(scene, point));
}

/** Common "put the player and bots on the field and go" step for any round. */
function beginRound(enemyCount, fullReset) {
  if (fullReset) player.reset();
  else player.resetPosition();

  spawnBots(enemyCount);
  hud.setupEnemyHealthBars(bots.length);
  hud.updateHealth(player.health, bots.map((b) => b.health));
  hud.hideStartScreen();
  hud.hideEndScreen();
  hud.hidePauseScreen();
  hud.hideRoundTransition();
  hud.showHUD();
  if (!input.isTouch) input.requestPointerLock();
  sound.gameStart();
  state = 'PLAYING';
}

function startRound() {
  mode = 'NORMAL';
  beginRound(hud.getEnemyCount(), true);
}

function startSurvivalRun() {
  mode = 'SURVIVAL';
  survivalRound = 1;
  carryHealth = hud.getCarryHealth();
  beginRound(survivalRound, true);
}

function restartSurvivalRun() {
  survivalRound = 1;
  beginRound(survivalRound, true);
}

function exitToNormalMode() {
  mode = 'NORMAL';
  state = 'START';
  bots.forEach((b) => scene.remove(b.mesh));
  bots = [];
  if (document.pointerLockElement) document.exitPointerLock();
  hud.hideHUD();
  hud.hideEndScreen();
  hud.hidePauseScreen();
  hud.hideRoundTransition();
  hud.showStartScreen();
}

hud.onStart(startRound);
hud.onSurvivalStart(startSurvivalRun);
hud.onContinueRound(() => beginRound(survivalRound, !carryHealth));
hud.onExitSurvival(exitToNormalMode);
hud.onPauseMenu(exitToNormalMode);

function pauseRound() {
  state = 'PAUSED';
  hud.showPauseScreen();
  if (document.pointerLockElement) document.exitPointerLock();
}

function resumeRound() {
  state = 'PLAYING';
  input.mouseDown = false; // avoid an instant shot from the click that resumed
  hud.hidePauseScreen();
  if (!input.isTouch) input.requestPointerLock();
}

hud.onResume(resumeRound);

window.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape') return;
  if (state === 'PLAYING') pauseRound();
  else if (state === 'PAUSED') resumeRound();
});

document.getElementById('touch-pause-button').addEventListener('click', () => {
  if (state === 'PLAYING') pauseRound();
  else if (state === 'PAUSED') resumeRound();
});

renderer.domElement.addEventListener('click', () => {
  if (state === 'PLAYING' && !input.isTouch) input.requestPointerLock();
});

window.addEventListener('resize', () => {
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function handleNormalRoundEnd(playerWon) {
  state = 'ENDED';
  hud.hideHUD();
  if (document.pointerLockElement) document.exitPointerLock();
  hud.setEndScreenCountSelectorVisible(true);
  hud.showEndScreen(playerWon ? 'VICTORY' : 'DEFEAT', playerWon ? 'victory' : 'defeat', null);
  hud.setRestartAction('RESTART', startRound);
  if (playerWon) sound.victory();
  else sound.defeat();
}

function handleSurvivalDefeat() {
  state = 'ENDED';
  hud.hideHUD();
  if (document.pointerLockElement) document.exitPointerLock();
  hud.setEndScreenCountSelectorVisible(false);
  hud.showEndScreen('DEFEAT', 'defeat', `Reached round ${survivalRound} of ${SURVIVAL_MAX_ROUND}`);
  hud.setRestartAction('RESTART', restartSurvivalRun);
  sound.defeat();
}

function handleSurvivalComplete() {
  state = 'ENDED';
  hud.hideHUD();
  if (document.pointerLockElement) document.exitPointerLock();
  hud.setEndScreenCountSelectorVisible(false);
  hud.showEndScreen('SURVIVED!', 'victory', `All ${SURVIVAL_MAX_ROUND} rounds cleared`);
  hud.setRestartAction('MENU', exitToNormalMode);
  sound.victory();
}

function handleSurvivalRoundCleared() {
  if (survivalRound >= SURVIVAL_MAX_ROUND) {
    handleSurvivalComplete();
    return;
  }
  survivalRound += 1;
  state = 'ROUND_TRANSITION';
  hud.hideHUD();
  if (document.pointerLockElement) document.exitPointerLock();
  hud.showRoundTransition(survivalRound, survivalRound);
}

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.1);

  if (state === 'PLAYING') {
    const playerShot = player.update(delta, input, arena, bots);
    if (playerShot) {
      hud.flashCrosshair();
      sound.playerShoot();
      effects.spawnBolt(playerShot.origin, playerShot.impactPoint, PLAYER_BOLT_COLOR, () => {
        if (playerShot.hitBot) {
          playerShot.hitBot.takeDamage(playerShot.damage);
          hud.showHitMarker();
          sound.hitConfirmed();
          const above = playerShot.hitBot.position.clone();
          above.y += 1.6;
          damageNumbers.spawn(above, playerShot.damage, '#ff2ec4');
        }
      });
    }

    for (const bot of bots) {
      const botShot = bot.update(delta, player, arena);
      if (botShot) {
        sound.botShoot();
        effects.spawnBolt(botShot.origin, botShot.impactPoint, BOT_BOLT_COLOR, () => {
          if (botShot.hit) {
            player.takeDamage(botShot.damage);
            sound.hitConfirmed();
          }
        });
      }
    }
    separateBots(bots);

    effects.update(delta);
    damageNumbers.update(delta, player.camera);

    hud.updateHealth(player.health, bots.map((b) => b.health));

    if (!player.isAlive) {
      if (mode === 'SURVIVAL') handleSurvivalDefeat();
      else handleNormalRoundEnd(false);
    } else if (bots.every((b) => !b.isAlive)) {
      if (mode === 'SURVIVAL') handleSurvivalRoundCleared();
      else handleNormalRoundEnd(true);
    }
  }

  renderer.render(scene, player.camera);
});
