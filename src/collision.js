/**
 * Shared circle-vs-box collision used by both the player and the bot so
 * they interact with arena walls/pillars identically.
 */

function collidesAt(x, z, radius, colliders, ignore) {
  for (const c of colliders) {
    if (c === ignore) continue;
    const box = c.userData.box;
    const closestX = Math.max(box.min.x, Math.min(x, box.max.x));
    const closestZ = Math.max(box.min.z, Math.min(z, box.max.z));
    const dx = x - closestX;
    const dz = z - closestZ;
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}

/**
 * Attempts to move `position` (a THREE.Vector3, mutated in place) by
 * (dx, dz), sliding along walls by resolving each axis independently.
 * Also clamps to the arena's outer bounds as a safety net.
 */
export function moveWithCollision(position, dx, dz, radius, colliders, halfSize) {
  const margin = halfSize - radius - 0.05;

  const nextX = position.x + dx;
  if (!collidesAt(nextX, position.z, radius, colliders)) {
    position.x = Math.max(-margin, Math.min(margin, nextX));
  }

  const nextZ = position.z + dz;
  if (!collidesAt(position.x, nextZ, radius, colliders)) {
    position.z = Math.max(-margin, Math.min(margin, nextZ));
  }

  return position;
}

export function isBlockedAt(x, z, radius, colliders) {
  return collidesAt(x, z, radius, colliders);
}
