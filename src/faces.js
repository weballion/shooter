import * as THREE from 'three';

const FACE_DIR = './assets/faces/';
const FACE_COUNT = 10;
const FACE_FILES = Array.from({ length: FACE_COUNT }, (_, i) => `face${i + 1}.png`);

/**
 * Loads whichever face images actually exist in assets/faces/ (face1.png
 * .. face10.png). Missing files are skipped rather than treated as errors —
 * the game works fine with zero faces (bots fall back to the procedural
 * visor), so drop in as many or as few as you like.
 */
export async function loadFaceTextures() {
  const loader = new THREE.TextureLoader();
  const results = await Promise.all(
    FACE_FILES.map(
      (file) =>
        new Promise((resolve) => {
          loader.load(
            FACE_DIR + file,
            (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace;
              resolve(texture);
            },
            undefined,
            () => resolve(null) // missing/broken file — skip it
          );
        })
    )
  );
  return results.filter(Boolean);
}

/** Shuffles `textures` and returns `count` of them; repeats only if count exceeds the pool. */
export function pickRandomFaces(textures, count) {
  if (textures.length === 0) return [];

  const shuffled = [...textures];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(shuffled[i % shuffled.length]);
  }
  return picked;
}
