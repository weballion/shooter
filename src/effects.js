import * as THREE from 'three';

const BOLT_SPEED = 45; // units/sec
const SPARK_DURATION = 0.2;
const TRAIL_LENGTH_T = 0.15; // fraction of travel behind the bolt head

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
  }
}
