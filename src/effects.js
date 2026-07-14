import * as THREE from 'three';

const BOLT_SPEED = 45; // units/sec
const SPARK_DURATION = 0.2;
const TRAIL_LENGTH_T = 0.15; // fraction of travel behind the bolt head
const FLASH_DURATION = 0.25;
const FRAGMENT_DURATION = 0.55;
const FRAGMENT_COUNT = 10;
const GRAVITY = 9.8;

/**
 * Manages transient visual-only scene objects: traveling shot bolts (with a
 * short tracer trail) and the impact spark left behind on arrival. Game
 * logic (hit/miss/damage) is decided by the caller; this only renders it.
 */
export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.bolts = [];
    this.sparks = [];
    this.flashes = [];
    this.fragments = [];
  }

  spawnBolt(from, to, color, onArrival) {
    const distance = from.distanceTo(to);
    const duration = Math.max(0.03, distance / BOLT_SPEED);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color })
    );
    head.position.copy(from);
    this.scene.add(head);

    const trailGeometry = new THREE.BufferGeometry().setFromPoints([from.clone(), from.clone()]);
    const trail = new THREE.Line(
      trailGeometry,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 })
    );
    this.scene.add(trail);

    this.bolts.push({ head, trail, from: from.clone(), to: to.clone(), color, elapsed: 0, duration, onArrival });
  }

  spawnSpark(position, color) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
    );
    mesh.position.copy(position);
    this.scene.add(mesh);
    this.sparks.push({ mesh, elapsed: 0 });
  }

  /** A destroyed-enemy burst: a bright flash plus a handful of tumbling fragments. */
  spawnExplosion(position, color) {
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 12, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
    );
    flash.position.copy(position);
    this.scene.add(flash);
    this.flashes.push({ mesh: flash, elapsed: 0 });

    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      const frag = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.14, 0.14),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
      );
      frag.position.copy(position);
      frag.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      const angle = Math.random() * Math.PI * 2;
      const upward = 2 + Math.random() * 2.5;
      const outward = 1.5 + Math.random() * 2.5;
      const velocity = new THREE.Vector3(Math.cos(angle) * outward, upward, Math.sin(angle) * outward);

      this.scene.add(frag);
      this.fragments.push({ mesh: frag, velocity, elapsed: 0 });
    }
  }

  update(delta) {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i];
      bolt.elapsed += delta;
      const t = Math.min(1, bolt.elapsed / bolt.duration);
      const pos = bolt.from.clone().lerp(bolt.to, t);
      bolt.head.position.copy(pos);

      const trailStart = bolt.from.clone().lerp(bolt.to, Math.max(0, t - TRAIL_LENGTH_T));
      bolt.trail.geometry.setFromPoints([trailStart, pos]);

      if (t >= 1) {
        this.scene.remove(bolt.head);
        this.scene.remove(bolt.trail);
        this.spawnSpark(bolt.to, bolt.color);
        if (bolt.onArrival) bolt.onArrival();
        this.bolts.splice(i, 1);
      }
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spark = this.sparks[i];
      spark.elapsed += delta;
      const t = spark.elapsed / SPARK_DURATION;
      if (t >= 1) {
        this.scene.remove(spark.mesh);
        this.sparks.splice(i, 1);
        continue;
      }
      spark.mesh.scale.setScalar(1 + t * 3);
      spark.mesh.material.opacity = 1 - t;
    }

    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const flash = this.flashes[i];
      flash.elapsed += delta;
      const t = flash.elapsed / FLASH_DURATION;
      if (t >= 1) {
        this.scene.remove(flash.mesh);
        this.flashes.splice(i, 1);
        continue;
      }
      flash.mesh.scale.setScalar(1 + t * 2.5);
      flash.mesh.material.opacity = 1 - t;
    }

    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const frag = this.fragments[i];
      frag.elapsed += delta;
      const t = frag.elapsed / FRAGMENT_DURATION;
      if (t >= 1) {
        this.scene.remove(frag.mesh);
        this.fragments.splice(i, 1);
        continue;
      }
      frag.velocity.y -= GRAVITY * delta;
      frag.mesh.position.addScaledVector(frag.velocity, delta);
      frag.mesh.rotation.x += delta * 6;
      frag.mesh.rotation.y += delta * 4;
      frag.mesh.material.opacity = 1 - t;
    }
  }
}
