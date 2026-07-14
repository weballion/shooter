import * as THREE from 'three';
import { createArena } from './arena.js';
import { Player } from './player.js';
import { Bot } from './bot.js';
import { InputManager } from './input.js';
import { HUD } from './hud.js';

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
    const playerFired = player.update(delta, input, arena, bot);
    if (playerFired !== null) {
      hud.flashCrosshair();
      if (playerFired) hud.showHitMarker();
    }

    bot.update(delta, player, arena);

    hud.updateHealth(player.health, bot.health);

    if (!player.isAlive) {
      endRound(false);
    } else if (!bot.isAlive) {
      endRound(true);
    }
  }

  renderer.render(scene, player.camera);
});
