import * as THREE from 'three';
import { createArena } from './arena.js';
import { Player } from './player.js';
import { Bot } from './bot.js';
import { InputManager } from './input.js';
import { HUD } from './hud.js';
import { Effects } from './effects.js';
import { DamageNumbers } from './damageNumbers.js';

const PLAYER_BOLT_COLOR = 0x00e5ff;
const BOT_BOLT_COLOR = 0xff2ec4;

const container = document.getElementById('game-container');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const arena = createArena(scene);

const player = new Player();
const bot = new Bot(scene);
const input = new InputManager(renderer.domElement);
const hud = new HUD();
const effects = new Effects(scene);
const damageNumbers = new DamageNumbers(document.getElementById('damage-numbers'));

let state = 'START'; // 'START' | 'PLAYING' | 'ENDED'

function startRound() {
  player.reset();
  bot.reset();
  hud.updateHealth(player.health, bot.health);
  hud.hideStartScreen();
  hud.hideEndScreen();
  hud.showHUD();
  input.requestPointerLock();
  state = 'PLAYING';
}

hud.onStart(startRound);
hud.onRestart(startRound);

renderer.domElement.addEventListener('click', () => {
  if (state === 'PLAYING') input.requestPointerLock();
});

window.addEventListener('resize', () => {
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function endRound(playerWon) {
  state = 'ENDED';
  hud.hideHUD();
  hud.showEndScreen(playerWon);
  if (document.pointerLockElement) document.exitPointerLock();
}

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.1);

  if (state === 'PLAYING') {
    const playerShot = player.update(delta, input, arena, bot);
    if (playerShot) {
      hud.flashCrosshair();
      effects.spawnBolt(playerShot.origin, playerShot.impactPoint, PLAYER_BOLT_COLOR, () => {
        if (playerShot.hitBot) {
          bot.takeDamage(playerShot.damage);
          hud.showHitMarker();
          const above = bot.position.clone();
          above.y += 1.6;
          damageNumbers.spawn(above, playerShot.damage, '#ff2ec4');
        }
      });
    }

    const botShot = bot.update(delta, player, arena);
    if (botShot) {
      effects.spawnBolt(botShot.origin, botShot.impactPoint, BOT_BOLT_COLOR, () => {
        if (botShot.hit) player.takeDamage(botShot.damage);
      });
    }

    effects.update(delta);
    damageNumbers.update(delta, player.camera);

    hud.updateHealth(player.health, bot.health);

    if (!player.isAlive) {
      endRound(false);
    } else if (!bot.isAlive) {
      endRound(true);
    }
  }

  renderer.render(scene, player.camera);
});
