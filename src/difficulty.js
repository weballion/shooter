/**
 * Bot difficulty tiers. Higher tiers move faster, notice the player from
 * farther away, close in tighter, reload quicker, and aim better (both a
 * higher base accuracy and a higher floor at long range).
 */
export const DIFFICULTY_LEVELS = [
  {
    key: 'rookie',
    label: '1 ROOKIE',
    moveSpeed: 4,
    engageRange: 10,
    comfortDistance: 10,
    fireCooldown: 1.1,
    accuracyBase: 0.45,
    accuracyFloor: 0.08,
  },
  {
    key: 'regular',
    label: '2 REGULAR',
    moveSpeed: 4.5,
    engageRange: 12,
    comfortDistance: 9,
    fireCooldown: 0.9,
    accuracyBase: 0.6,
    accuracyFloor: 0.12,
  },
  {
    key: 'veteran',
    label: '3 VETERAN',
    moveSpeed: 5,
    engageRange: 14,
    comfortDistance: 8,
    fireCooldown: 0.7,
    accuracyBase: 0.72,
    accuracyFloor: 0.16,
  },
  {
    key: 'elite',
    label: '4 ELITE',
    moveSpeed: 5.5,
    engageRange: 16,
    comfortDistance: 7,
    fireCooldown: 0.55,
    accuracyBase: 0.8,
    accuracyFloor: 0.2,
  },
  {
    key: 'nightmare',
    label: '5 NIGHTMARE',
    moveSpeed: 6,
    engageRange: 18,
    comfortDistance: 6,
    fireCooldown: 0.4,
    accuracyBase: 0.9,
    accuracyFloor: 0.25,
  },
];

export const DEFAULT_DIFFICULTY = 'nightmare';

export function getDifficulty(key) {
  return DIFFICULTY_LEVELS.find((d) => d.key === key) || DIFFICULTY_LEVELS.find((d) => d.key === DEFAULT_DIFFICULTY);
}
