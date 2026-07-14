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

function hexToCss(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

/** Sci-fi armor plating: an irregular panel grid with glowing seams and rivets. */
function drawPanelsPattern(ctx, size, base, line, glow) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const cols = 4;
  const rows = 4;
  const cellW = size / cols;
  const cellH = size / rows;

  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 8;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const inset = 6;
      const x = c * cellW + inset;
      const y = r * cellH + inset;
      const w = cellW - inset * 2;
      const h = cellH - inset * 2;
      ctx.strokeRect(x, y, w, h);

      // Rivets at the panel's corners.
      ctx.shadowBlur = 4;
      ctx.fillStyle = glow;
      for (const [rx, ry] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
        ctx.beginPath();
        ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 8;

      // Occasional diagonal accent inside the panel.
      if (Math.random() < 0.4) {
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, y + h * 0.8);
        ctx.lineTo(x + w * 0.5, y + h * 0.2);
        ctx.stroke();
      }
    }
  }
}

/** PCB-style traces: branching walks between pads, plus a couple of "chip" blocks. */
function drawCircuitPattern(ctx, size, base, line, glow) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = line;
  ctx.fillStyle = line;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 6;

  const step = size / 16;
  const traceCount = 10;
  for (let i = 0; i < traceCount; i++) {
    let x = Math.round(Math.random() * 16) * step;
    let y = Math.round(Math.random() * 16) * step;
    const segments = 3 + Math.floor(Math.random() * 4);
    ctx.beginPath();
    ctx.moveTo(x, y);
    let horizontal = Math.random() < 0.5;
    for (let s = 0; s < segments; s++) {
      const dist = (1 + Math.floor(Math.random() * 3)) * step;
      if (horizontal) x += Math.random() < 0.5 ? dist : -dist;
      else y += Math.random() < 0.5 ? dist : -dist;
      x = Math.max(0, Math.min(size, x));
      y = Math.max(0, Math.min(size, y));
      ctx.lineTo(x, y);
      horizontal = !horizontal;
    }
    ctx.stroke();

    // Pad at the trace's end.
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // A couple of "chip" blocks with pin lines.
  for (let i = 0; i < 2; i++) {
    const cw = step * 2.5;
    const ch = step * 1.6;
    const cx = step * (2 + Math.random() * 10);
    const cy = step * (2 + Math.random() * 10);
    ctx.strokeRect(cx, cy, cw, ch);
    for (let p = 0; p < 4; p++) {
      const px = cx + (p + 0.5) * (cw / 4);
      ctx.beginPath();
      ctx.moveTo(px, cy);
      ctx.lineTo(px, cy - step * 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, cy + ch);
      ctx.lineTo(px, cy + ch + step * 0.4);
      ctx.stroke();
    }
  }
}

/** Industrial hangar plating: banded seams, rivets, and a hazard-stripe trim. */
function drawHangarPattern(ctx, size, base, line, glow) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 6;

  const bands = 3;
  const bandH = size / bands;
  for (let b = 1; b < bands; b++) {
    const y = b * bandH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const seams = 4;
  const seamW = size / seams;
  for (let s = 1; s < seams; s++) {
    const x = s * seamW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  ctx.fillStyle = glow;
  ctx.shadowBlur = 3;
  for (let b = 0; b < bands; b++) {
    for (let s = 0; s < seams; s++) {
      ctx.beginPath();
      ctx.arc(s * seamW + (s === 0 ? 10 : 0), b * bandH + (b === 0 ? 10 : 0), 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Hazard-stripe trim along the bottom edge.
  ctx.shadowBlur = 0;
  const stripeH = size * 0.05;
  const stripeY = size - stripeH;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, stripeY, size, stripeH);
  ctx.clip();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, stripeY, size, stripeH);
  ctx.fillStyle = line;
  const stripeW = stripeH * 1.4;
  for (let x = -stripeH; x < size + stripeH; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, stripeY + stripeH);
    ctx.lineTo(x + stripeW, stripeY);
    ctx.lineTo(x + stripeW * 1.6, stripeY);
    ctx.lineTo(x + stripeW * 0.6, stripeY + stripeH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

const SURFACE_PATTERNS = {
  panels: drawPanelsPattern,
  circuit: drawCircuitPattern,
  hangar: drawHangarPattern,
};

/**
 * Builds a themed detail texture for walls/pillars: a dark base with bright
 * glowing lines. Used as both `map` (so the panel reads even under flat
 * ambient light) and `emissiveMap` (so only the bright lines actually glow,
 * not the whole surface).
 */
function buildSurfaceTexture(theme) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Lines are drawn neutral white, not theme-tinted: the same texture is
  // reused as both wall and pillar emissiveMap, and each material supplies
  // its own emissive color, so a colored mask here would multiply wrong.
  const draw = SURFACE_PATTERNS[theme.pattern] || drawPanelsPattern;
  draw(ctx, size, hexToCss(theme.wallColor), '#ffffff', '#ffffff');

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
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

  const wallTexture = buildSurfaceTexture(theme);
  wallTexture.repeat.set(10, 1.5);

  const wallMat = new THREE.MeshStandardMaterial({
    color: theme.wallColor,
    map: wallTexture,
    emissive: new THREE.Color(theme.wallEmissive),
    emissiveIntensity: theme.wallEmissiveIntensity,
    emissiveMap: wallTexture,
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
  const pillarTexture = wallTexture.clone();
  pillarTexture.needsUpdate = true;
  pillarTexture.repeat.set(1.2, 1.8);

  const pillarMat = new THREE.MeshStandardMaterial({
    color: theme.pillarColor,
    map: pillarTexture,
    emissive: new THREE.Color(theme.pillarEmissive),
    emissiveIntensity: theme.pillarEmissiveIntensity,
    emissiveMap: pillarTexture,
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
