import * as THREE from 'three';
import { moveWithCollision } from './collision.js';

const START_POSITION = new THREE.Vector3(0, 0, 15);
const EYE_HEIGHT = 1.6;
const RADIUS = 0.5;
const MOVE_SPEED = 6;
const MOUSE_SENSITIVITY = 0.0022;
const FIRE_COOLDOWN = 0.3;
const MAX_HEALTH = 100;
const DAMAGE_PER_HIT = 20;

export class Player {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    this.position = START_POSITION.clone();
    this.yaw = 0; // three.js cameras face -Z by default, which points at the bot's spawn
    this.pitch = 0;
    this.health = MAX_HEALTH;
    this.fireTimer = 0;
    this.raycaster = new THREE.Raycaster();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();

    this._syncCamera();
  }

  reset() {
    this.position.copy(START_POSITION);
    this.yaw = 0;
    this.pitch = 0;
    this.health = MAX_HEALTH;
    this.fireTimer = 0;
    this._syncCamera();
  }

  get isAlive() {
    return this.health > 0;
  }

  _syncCamera() {
    this.camera.position.set(this.position.x, EYE_HEIGHT, this.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  update(delta, input, arena, bot) {
    const look = input.consumeLookDelta();
    this.yaw -= look.x * MOUSE_SENSITIVITY;
    this.pitch -= look.y * MOUSE_SENSITIVITY;
    const maxPitch = Math.PI / 2 - 0.05;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    // Matches three.js's camera convention (looks down local -Z at yaw 0).
    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    let dx = 0;
    let dz = 0;
    if (input.moveForward) {
      dx += this._forward.x;
      dz += this._forward.z;
    }
    if (input.moveBackward) {
      dx -= this._forward.x;
      dz -= this._forward.z;
    }
    if (input.strafeRight) {
      dx += this._right.x;
      dz += this._right.z;
    }
    if (input.strafeLeft) {
      dx -= this._right.x;
      dz -= this._right.z;
    }

    const len = Math.hypot(dx, dz);
    if (len > 0) {
      const step = (MOVE_SPEED * delta) / len;
      dx *= step;
      dz *= step;
      moveWithCollision(this.position, dx, dz, RADIUS, arena.colliders, arena.halfSize);
    }

    this._syncCamera();

    if (this.fireTimer > 0) {
      this.fireTimer -= delta;
    }

    let firedHit = null;
    if (input.firing && this.fireTimer <= 0 && this.isAlive) {
      this.fireTimer = FIRE_COOLDOWN;
      firedHit = this._fire(arena, bot);
    }

    return firedHit; // null = did not fire, true = fired & hit, false = fired & missed
  }

  _fire(arena, bot) {
    this.raycaster.set(this.camera.position, this.camera.getWorldDirection(new THREE.Vector3()));
    const targets = bot && bot.isAlive ? [bot.mesh, ...arena.colliders] : [...arena.colliders];
    const hits = this.raycaster.intersectObjects(targets, false);
    if (hits.length > 0 && bot && hits[0].object === bot.mesh) {
      bot.takeDamage(DAMAGE_PER_HIT);
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }
}
