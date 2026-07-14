import * as THREE from 'three';

const ARENA_HALF_SIZE = 20;
const WALL_HEIGHT = 6;
const WALL_THICKNESS = 1;

function buildGridTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#05060f';
  ctx.fillRect(0, 0, size, size);

  const cells = 16;
  const step = size / cells;
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(0, 229, 255, 0.8)';
  ctx.shadowBlur = 6;

  for (let i = 0; i <= cells; i++) {
    const p = i * step;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Builds the arena: floor, perimeter walls, and cover pillars/crates.
 * Returns the half-size (for boundary logic elsewhere) and a flat list of
 * collidable meshes, each carrying a precomputed world-space Box3 in
 * userData.box for movement collision and raycasting.
 */
export function createArena(scene) {
  const colliders = [];

  scene.background = new THREE.Color(0x03030a);
  scene.fog = new THREE.Fog(0x03030a, 15, 55);

  scene.add(new THREE.AmbientLight(0x2a3a55, 0.9));
  const hemiLight = new THREE.HemisphereLight(0x224466, 0x05030a, 0.6);
  scene.add(hemiLight);

  // Floor
  const floorGeo = new THREE.PlaneGeometry(ARENA_HALF_SIZE * 2, ARENA_HALF_SIZE * 2);
  const floorMat = new THREE.MeshStandardMaterial({
    map: buildGridTexture(),
    emissive: new THREE.Color(0x0a2a33),
    emissiveIntensity: 0.6,
    roughness: 0.9,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Ceiling glow (subtle, no collision)
  const ceilGeo = new THREE.PlaneGeometry(ARENA_HALF_SIZE * 2, ARENA_HALF_SIZE * 2);
  const ceilMat = new THREE.MeshBasicMaterial({ color: 0x030512, side: THREE.BackSide });
  const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = WALL_HEIGHT;
  scene.add(ceiling);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x0d1230,
    emissive: new THREE.Color(0xff2ec4),
    emissiveIntensity: 0.25,
    roughness: 0.6,
  });

  function addBox(width, height, depth, x, y, z, material) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    mesh.userData.box = new THREE.Box3().setFromObject(mesh);
    colliders.push(mesh);
    return mesh;
  }

  const s = ARENA_HALF_SIZE;
  addBox(s * 2 + WALL_THICKNESS * 2, WALL_HEIGHT, WALL_THICKNESS, 0, WALL_HEIGHT / 2, -s, wallMat);
  addBox(s * 2 + WALL_THICKNESS * 2, WALL_HEIGHT, WALL_THICKNESS, 0, WALL_HEIGHT / 2, s, wallMat);
  addBox(WALL_THICKNESS, WALL_HEIGHT, s * 2, -s, WALL_HEIGHT / 2, 0, wallMat);
  addBox(WALL_THICKNESS, WALL_HEIGHT, s * 2, s, WALL_HEIGHT / 2, 0, wallMat);

  // Cover pillars — glowing neon crates/columns scattered around the arena.
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x101428,
    emissive: new THREE.Color(0x00e5ff),
    emissiveIntensity: 0.5,
    roughness: 0.5,
  });

  const pillarLayout = [
    [-8, 2, -8, 1.6, 4, 1.6],
    [8, 2, -8, 1.6, 4, 1.6],
    [-8, 1.5, 8, 1.6, 3, 1.6],
    [8, 1.5, 8, 1.6, 3, 1.6],
    [0, 1.5, -9, 2.2, 3, 2.2],
    [0, 1.2, 9, 2.4, 2.4, 2.4],
    [-13, 1.2, 0, 1.8, 2.4, 1.8],
    [13, 1.2, 0, 1.8, 2.4, 1.8],
  ];

  for (const [x, y, z, w, h, d] of pillarLayout) {
    addBox(w, h, d, x, y, z, pillarMat);
  }

  // A few accent point lights for extra neon glow.
  const accentColors = [0x00e5ff, 0xff2ec4, 0x7dfcff];
  for (let i = 0; i < 3; i++) {
    const light = new THREE.PointLight(accentColors[i % accentColors.length], 1.2, 25);
    light.position.set(
      (Math.random() - 0.5) * ARENA_HALF_SIZE * 1.5,
      3,
      (Math.random() - 0.5) * ARENA_HALF_SIZE * 1.5
    );
    scene.add(light);
  }

  return { halfSize: ARENA_HALF_SIZE, colliders };
}
