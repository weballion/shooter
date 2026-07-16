import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { pickRandom } from './shuffle.js';

const MODEL_DIR = './assets/models/';
const MODEL_COUNT = 4;
const MODEL_FILES = Array.from({ length: MODEL_COUNT }, (_, i) => `monster${i + 1}.glb`);

/**
 * Loads whichever monster models actually exist in assets/models/
 * (monster1.glb .. monster4.glb). Missing/broken files are skipped rather
 * than treated as errors, mirroring loadFaceTextures() — the game works
 * fine with zero models loaded (bots fall back to the procedural capsule).
 *
 * Rendered at each model's own native scale (Quaternius characters ship
 * pre-calibrated to real-world-ish size with the origin at the feet) —
 * deliberately not auto-scaled from a measured bounding box. THREE.Box3
 * doesn't account for a SkinnedMesh's actual bone-driven pose, so it
 * reports a wildly wrong height for these rigs; trusting the source
 * scale is far more reliable than "correcting" from that measurement.
 */
export async function loadMonsterModels() {
  const loader = new GLTFLoader();
  const results = await Promise.all(
    MODEL_FILES.map(
      (file) =>
        new Promise((resolve) => {
          loader.load(
            MODEL_DIR + file,
            (gltf) => resolve({ scene: gltf.scene, animations: gltf.animations }),
            undefined,
            () => resolve(null) // missing/broken file — skip it
          );
        })
    )
  );
  return results.filter(Boolean);
}

/** Shuffles `models` and returns `count` of them; repeats only if count exceeds the pool. */
export function pickRandomMonsterModels(models, count) {
  return pickRandom(models, count);
}
