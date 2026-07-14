import * as THREE from 'three';
import { ARENA_THEMES, DEFAULT_ARENA_THEME } from './themes.js';

const ARENA_HALF_SIZE = 20;
const WALL_HEIGHT = 6;
const WALL_THICKNESS = 1;

function buildGridTexture(theme) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = theme.gridBg;
  ctx.fillRect(0, 0, size, size);

  const cells = 16;
  const step = size / cells;
  ctx.strokeStyle = theme.gridLine;
  ctx.lineWidth = 2;
  ctx.shadowColor = theme.gridGlow;
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
 * Builds the arena: floor, perimeter walls, and cover pillars/crates, using
 * the given theme's palette. Returns the half-size (for boundary logic
 * elsewhere), a flat list of collidable meshes (each carrying a precomputed
 * world-space Box3 in userData.box), and a dispose() that removes every
 * object this call added — call it before building a new theme into the
 * same scene.
 */
export function createArena(scene, themeKey = DEFAULT_ARENA_THEME) {
  const theme = ARENA_THEMES[themeKey] || ARENA_THEMES[DEFAULT_ARENA_THEME];
  const colliders = [];
  const ownedObjects = [];

  function own(obj) {
    scene.add(obj);
    ownedObjects.push(obj);
    return obj;
  }

  scene.background = new THREE.Color(theme.background);
  scene.fog = new THREE.Fog(theme.fogColor, theme.fogNear, theme.fogFar);

  own(new THREE.AmbientLight(theme.ambientColor, theme.ambientIntensity));
  own(new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, theme.hemiIntensity));

  // Floor
  const floorGeo = new THREE.PlaneGeometry(ARENA_HALF_SIZE * 2, ARENA_HALF_SIZE * 2);
  const floorMat = new THREE.MeshStandardMaterial({
    map: buildGridTexture(theme),
    emissive: new THREE.Color(theme.floorEmissive),
    emissiveIntensity: theme.floorEmissiveIntensity,
    roughness: 0.9,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  own(floor);

  // Ceiling glow (subtle, no collision)
  const ceilGeo = new THREE.PlaneGeometry(ARENA_HALF_SIZE * 2, ARENA_HALF_SIZE * 2);
  const ceilMat = new THREE.MeshBasicMaterial({ color: theme.ceilingColor, side: THREE.BackSide });
  const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = WALL_HEIGHT;
  own(ceiling);

  const wallMat = new THREE.MeshStandardMaterial({
    color: theme.wallColor,
    emissive: new THREE.Color(theme.wallEmissive),
    emissiveIntensity: theme.wallEmissiveIntensity,
    roughness: 0.6,
  });

  function addBox(width, height, depth, x, y, z, material) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    own(mesh);
    mesh.userData.box = new THREE.Box3().setFromObject(mesh);
    colliders.push(mesh);
    return mesh;
  }

  const s = ARENA_HALF_SIZE;
  addBox(s * 2 + WALL_THICKNESS * 2, WALL_HEIGHT, WALL_THICKNESS, 0, WALL_HEIGHT / 2, -s, wallMat);
  addBox(s * 2 + WALL_THICKNESS * 2, WALL_HEIGHT, WALL_THICKNESS, 0, WALL_HEIGHT / 2, s, wallMat);
  addBox(WALL_THICKNESS, WALL_HEIGHT, s * 2, -s, WALL_HEIGHT / 2, 0, wallMat);
  addBox(WALL_THICKNESS, WALL_HEIGHT, s * 2, s, WALL_HEIGHT / 2, 0, wallMat);

  // Cover pillars — glowing crates/columns scattered around the arena.
  const pillarMat = new THREE.MeshStandardMaterial({
    color: theme.pillarColor,
    emissive: new THREE.Color(theme.pillarEmissive),
    emissiveIntensity: theme.pillarEmissiveIntensity,
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

  // A few accent point lights for extra glow.
  for (let i = 0; i < 3; i++) {
    const light = new THREE.PointLight(theme.accentLights[i % theme.accentLights.length], 1.2, 25);
    light.position.set(
      (Math.random() - 0.5) * ARENA_HALF_SIZE * 1.5,
      3,
      (Math.random() - 0.5) * ARENA_HALF_SIZE * 1.5
    );
    own(light);
  }

  return {
    halfSize: ARENA_HALF_SIZE,
    colliders,
    dispose() {
      ownedObjects.forEach((obj) => scene.remove(obj));
    },
  };
}
