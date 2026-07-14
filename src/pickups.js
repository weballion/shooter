import * as THREE from 'three';

// Spread across open floor, clear of pillars and bot/player spawn lines.
const PICKUP_POINTS = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(-10, 0, -4),
  new THREE.Vector3(10, 0, -4),
];

const HEAL_AMOUNT = 25;
const PICKUP_RADIUS = 1.1;
const RESPAWN_TIME = 15;
const BOB_HEIGHT = 0.15;
const BOB_SPEED = 2;
const SPIN_SPEED = 1.5;

function buildPickupMesh(position) {
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.35, 0),
    new THREE.MeshStandardMaterial({
      color: 0x003b1f,
      emissive: new THREE.Color(0x00ff9d),
      emissiveIntensity: 1.3,
      roughness: 0.3,
    })
  );
  mesh.position.copy(position);
  mesh.position.y = 1;

  const glow = new THREE.PointLight(0x00ff9d, 1, 6);
  mesh.add(glow);

  return mesh;
}

/** Glowing health pickups scattered around the arena; heal the player on contact. */
export class Pickups {
  constructor(scene) {
    this.scene = scene;
    this.items = PICKUP_POINTS.map((position) => ({ position, mesh: null, respawnTimer: 0 }));
  }

  /** (Re)spawns every pickup — call at the start of a round. */
  activate() {
    this.deactivate();
    for (const item of this.items) {
      item.mesh = buildPickupMesh(item.position);
      this.scene.add(item.mesh);
    }
  }

  deactivate() {
    for (const item of this.items) {
      if (item.mesh) {
        this.scene.remove(item.mesh);
        item.mesh = null;
      }
      item.respawnTimer = 0;
    }
  }

  /** Returns the amount healed this frame (0 if nothing was collected). */
  update(delta, player) {
    let healed = 0;
    const now = performance.now() * 0.001;

    for (const item of this.items) {
      if (item.mesh) {
        item.mesh.rotation.y += delta * SPIN_SPEED;
        item.mesh.position.y = 1 + Math.sin(now * BOB_SPEED + item.position.x) * BOB_HEIGHT;

        const dx = player.position.x - item.position.x;
        const dz = player.position.z - item.position.z;
        if (player.isAlive && !player.isFullHealth && Math.hypot(dx, dz) < PICKUP_RADIUS) {
          healed = HEAL_AMOUNT;
          this.scene.remove(item.mesh);
          item.mesh = null;
          item.respawnTimer = RESPAWN_TIME;
        }
      } else {
        item.respawnTimer -= delta;
        if (item.respawnTimer <= 0) {
          item.mesh = buildPickupMesh(item.position);
          this.scene.add(item.mesh);
        }
      }
    }

    return healed;
  }
}
