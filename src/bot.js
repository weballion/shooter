import * as THREE from 'three';
import { moveWithCollision, isBlockedAt } from './collision.js';

// Spread across the back half of the arena, clear of pillars and each other.
export const SPAWN_POINTS = [
  new THREE.Vector3(0, 0, -15),
  new THREE.Vector3(-15, 0, -12),
  new THREE.Vector3(15, 0, -12),
  new THREE.Vector3(0, 0, -3),
];

export const RADIUS = 0.5;
const BODY_HEIGHT = 1.3;
const EYE_OFFSET = 1.6;
const MOVE_SPEED = 5;
const ENGAGE_RANGE = 16;
const COMFORT_DISTANCE = 8;
const FIRE_COOLDOWN = 0.6;
const MAX_HEALTH = 100;
const DAMAGE_PER_HIT = 20;
const LOOKAHEAD = 1.4;

/** Sci-fi visor mask mounted on the front of the head, facing local -Z. */
function buildFace() {
  const face = new THREE.Group();

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.32, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x05030a, roughness: 0.3, metalness: 0.5 })
  );
  plate.position.set(0, 0.85, -0.42);
  face.add(plate);

  const visorMaterial = new THREE.MeshStandardMaterial({
    color: 0x001a1f,
    emissive: new THREE.Color(0x8affff),
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.02), visorMaterial);
  visor.position.set(0, 0.9, -0.445);
  face.add(visor);

  const vent = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.02), visorMaterial);
  vent.position.set(0, 0.74, -0.445);
  face.add(vent);

  return face;
}

/**
 * A supplied photo/avatar, shown as a circular disc in place of the visor.
 * Pushed out to z=-0.52 (beyond the capsule's 0.45 max radius everywhere
 * along the disc's height) so the capsule's own opaque surface never
 * z-fights or clips it.
 */
function buildFaceImage(texture) {
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 24),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
  );
  disc.position.set(0, 0.85, -0.52);
  // CircleGeometry's front face normal is +Z by default; flip it to face
  // -Z (the bot's front) so the texture reads correctly, not mirrored.
  disc.rotation.y = Math.PI;
  return disc;
}

function buildMesh(spawnPosition, faceTexture) {
  const geometry = new THREE.CapsuleGeometry(0.45, BODY_HEIGHT, 4, 8);
  const material = new THREE.MeshStandardMaterial({
    color: 0x220a2a,
    emissive: new THREE.Color(0xff2ec4),
    emissiveIntensity: 0.9,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(spawnPosition);
  mesh.position.y = BODY_HEIGHT / 2 + 0.45;
  mesh.add(faceTexture ? buildFaceImage(faceTexture) : buildFace());

  const glow = new THREE.PointLight(0xff2ec4, 0.8, 6);
  glow.position.set(0, 0.6, 0);
  mesh.add(glow);

  return mesh;
}

/** Steers a desired movement direction around obstacles directly ahead. */
function steerAround(position, dir, colliders) {
  const aheadX = position.x + dir.x * LOOKAHEAD;
  const aheadZ = position.z + dir.z * LOOKAHEAD;
  if (!isBlockedAt(aheadX, aheadZ, RADIUS, colliders)) return dir;

  const perp = new THREE.Vector3(-dir.z, 0, dir.x);
  for (const sign of [1, -1]) {
    const steered = new THREE.Vector3(dir.x + perp.x * sign, 0, dir.z + perp.z * sign);
    if (steered.lengthSq() === 0) continue;
    steered.normalize();
    const sx = position.x + steered.x * LOOKAHEAD;
    const sz = position.z + steered.z * LOOKAHEAD;
    if (!isBlockedAt(sx, sz, RADIUS, colliders)) return steered;
  }
  return perp.normalize();
}

export class Bot {
  constructor(scene, spawnPosition, faceTexture) {
    this.mesh = buildMesh(spawnPosition, faceTexture);
    scene.add(this.mesh);
    this.health = MAX_HEALTH;
    this.state = 'CHASE';
    this.strafeSign = 1;
    this.strafeTimer = 0;
    this.fireTimer = 0;
    this.raycaster = new THREE.Raycaster();
  }

  get isAlive() {
    return this.health > 0;
  }

  get position() {
    return this.mesh.position;
  }

  _eyePosition() {
    const eye = this.position.clone();
    eye.y += EYE_OFFSET - 0.6;
    return eye;
  }

  _hasLineOfSight(playerCameraPos, arena) {
    const from = this._eyePosition();
    const to = playerCameraPos.clone();
    const dir = to.clone().sub(from);
    const distance = dir.length();
    dir.normalize();

    this.raycaster.set(from, dir);
    this.raycaster.far = distance;
    const hits = this.raycaster.intersectObjects(arena.colliders, false);
    return hits.length === 0;
  }

  update(delta, player, arena) {
    if (!this.isAlive) return null;

    if (this.fireTimer > 0) this.fireTimer -= delta;

    const toPlayer = new THREE.Vector3(
      player.position.x - this.position.x,
      0,
      player.position.z - this.position.z
    );
    const distance = toPlayer.length();
    const dirToPlayer = distance > 0.0001 ? toPlayer.clone().normalize() : new THREE.Vector3(0, 0, 1);

    const losClear = player.isAlive && this._hasLineOfSight(player.camera.position, arena);
    this.state = losClear && distance <= ENGAGE_RANGE ? 'ENGAGE' : 'CHASE';

    // Face the player (matches three.js's -Z-forward convention; see player.js).
    this.mesh.rotation.y = Math.atan2(dirToPlayer.x, dirToPlayer.z) + Math.PI;

    let moveDir = null;
    if (this.state === 'ENGAGE') {
      this.strafeTimer -= delta;
      if (this.strafeTimer <= 0) {
        this.strafeTimer = 1 + Math.random();
        this.strafeSign *= -1;
      }
      const perp = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x).multiplyScalar(this.strafeSign);

      if (distance > COMFORT_DISTANCE + 1.5) {
        moveDir = dirToPlayer.clone().add(perp.clone().multiplyScalar(0.4)).normalize();
      } else if (distance < COMFORT_DISTANCE - 1.5) {
        moveDir = dirToPlayer.clone().negate().add(perp.clone().multiplyScalar(0.4)).normalize();
      } else {
        moveDir = perp;
      }
    } else {
      moveDir = steerAround(this.position, dirToPlayer, arena.colliders);
    }

    const step = MOVE_SPEED * delta;
    moveWithCollision(this.position, moveDir.x * step, moveDir.z * step, RADIUS, arena.colliders, arena.halfSize);
    this.mesh.position.y = BODY_HEIGHT / 2 + 0.45;

    let shot = null;
    if (this.state === 'ENGAGE' && this.fireTimer <= 0) {
      this.fireTimer = FIRE_COOLDOWN;
      shot = this._fireAt(player, distance);
    }

    return shot; // null = did not fire; otherwise { origin, impactPoint, hit, damage }
  }

  /**
   * Accuracy tapers off with distance so the bot is beatable at range. Hit
   * outcome is decided immediately; damage is applied by the caller once the
   * visual bolt arrives. Misses aim near, not at, the player.
   */
  _fireAt(player, distance) {
    const accuracy = Math.max(0.15, 0.85 - distance / (ENGAGE_RANGE * 1.5));
    const hit = Math.random() < accuracy;
    const origin = this._eyePosition();
    const impactPoint = player.camera.position.clone();
    if (!hit) {
      impactPoint.x += (Math.random() - 0.5) * 2.4;
      impactPoint.y += (Math.random() - 0.3) * 1.6;
      impactPoint.z += (Math.random() - 0.5) * 2.4;
    }
    return { origin, impactPoint, hit, damage: DAMAGE_PER_HIT };
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }
}
