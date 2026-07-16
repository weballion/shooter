import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { pickRandom } from './shuffle.js';

const MODEL_DIR = './assets/models/';

// One signature neon accent color per skin (used for its glow light and
// blended into its emissive self-glow — see bot.js) so each monster type
// reads as its own distinct "species" instead of all sharing one color.
const MODEL_FILES = [
  { file: 'monster1.glb', accentColor: 0x00e5ff }, // Robot Enemy — electric cyan
  { file: 'monster2.glb', accentColor: 0xaa33ff }, // Alien — violet
  { file: 'monster3.glb', accentColor: 0xff8c1a }, // Enemy Small (flyer) — amber
  { file: 'monster4.glb', accentColor: 0x39ff14 }, // Slime Enemy — acid green
];

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
      ({ file, accentColor }) =>
        new Promise((resolve) => {
          loader.load(
            MODEL_DIR + file,
            (gltf) => resolve({ scene: gltf.scene, animations: gltf.animations, accentColor }),
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
