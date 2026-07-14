/**
 * Arena visual palettes. Only the environment (floor/walls/pillars/lighting/
 * fog) is themed — bot, HUD, and bolt colors stay fixed across themes since
 * they carry gameplay meaning (who's shooting whom).
 */
export const ARENA_THEMES = {
  neon: {
    label: 'NEON GRID',
    background: 0x03030a,
    fogColor: 0x03030a,
    fogNear: 15,
    fogFar: 55,
    ambientColor: 0x2a3a55,
    ambientIntensity: 0.9,
    hemiSky: 0x224466,
    hemiGround: 0x05030a,
    hemiIntensity: 0.6,
    gridBg: '#05060f',
    gridLine: 'rgba(0, 229, 255, 0.55)',
    gridGlow: 'rgba(0, 229, 255, 0.8)',
    floorEmissive: 0x0a2a33,
    floorEmissiveIntensity: 0.6,
    wallColor: 0x0d1230,
    wallEmissive: 0xff2ec4,
    wallEmissiveIntensity: 0.25,
    pillarColor: 0x101428,
    pillarEmissive: 0x00e5ff,
    pillarEmissiveIntensity: 0.5,
    accentLights: [0x00e5ff, 0xff2ec4, 0x7dfcff],
    ceilingColor: 0x030512,
  },

  // Stark black-and-cyan grid with amber accents, in the spirit of a
  // digital-arena light-cycle game — not any specific film's branding.
  circuit: {
    label: 'CIRCUIT',
    background: 0x000000,
    fogColor: 0x000000,
    fogNear: 18,
    fogFar: 60,
    ambientColor: 0x0a1a2a,
    ambientIntensity: 0.5,
    hemiSky: 0x0d3a4a,
    hemiGround: 0x000000,
    hemiIntensity: 0.5,
    gridBg: '#000000',
    gridLine: 'rgba(120, 235, 255, 0.85)',
    gridGlow: 'rgba(120, 235, 255, 1)',
    floorEmissive: 0x0d2a33,
    floorEmissiveIntensity: 0.8,
    wallColor: 0x030608,
    wallEmissive: 0xff7a1a,
    wallEmissiveIntensity: 0.35,
    pillarColor: 0x030608,
    pillarEmissive: 0x4dfcff,
    pillarEmissiveIntensity: 0.9,
    accentLights: [0x4dfcff, 0xff7a1a, 0xffffff],
    ceilingColor: 0x000000,
  },

  // Warm hangar-bay palette with a starfield-black ceiling — evokes a
  // space-opera hangar without copying any specific franchise's assets.
  deepspace: {
    label: 'DEEP SPACE',
    background: 0x05060c,
    fogColor: 0x05060c,
    fogNear: 20,
    fogFar: 65,
    ambientColor: 0x30281c,
    ambientIntensity: 0.7,
    hemiSky: 0x3a2f1e,
    hemiGround: 0x0a0a12,
    hemiIntensity: 0.55,
    gridBg: '#0a0806',
    gridLine: 'rgba(255, 196, 120, 0.5)',
    gridGlow: 'rgba(255, 196, 120, 0.8)',
    floorEmissive: 0x241a0a,
    floorEmissiveIntensity: 0.5,
    wallColor: 0x14100c,
    wallEmissive: 0xff4433,
    wallEmissiveIntensity: 0.3,
    pillarColor: 0x141210,
    pillarEmissive: 0x4488ff,
    pillarEmissiveIntensity: 0.55,
    accentLights: [0xff4433, 0x4488ff, 0xffcc88],
    ceilingColor: 0x05040a,
  },
};

export const DEFAULT_ARENA_THEME = 'neon';
