const FLOAT_DISTANCE = 1.2;
const DURATION = 0.9;

/**
 * Floating "-NN" text anchored to a 3D world position, projected to screen
 * space each frame so it tracks the target as the camera moves.
 */
export class DamageNumbers {
  constructor(container) {
    this.container = container;
    this.active = [];
  }

  spawn(worldPos, amount, color) {
    const el = document.createElement('div');
    el.className = 'damage-number';
    el.textContent = `-${amount}`;
    el.style.color = color;
    this.container.appendChild(el);
    this.active.push({ el, origin: worldPos.clone(), elapsed: 0 });
  }

  update(delta, camera) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const item = this.active[i];
      item.elapsed += delta;
      const t = item.elapsed / DURATION;
      if (t >= 1) {
        item.el.remove();
        this.active.splice(i, 1);
        continue;
      }

      const pos = item.origin.clone();
      pos.y += t * FLOAT_DISTANCE;
      const screen = pos.project(camera);

      if (screen.z > 1) {
        item.el.style.opacity = '0';
        continue;
      }

      const x = (screen.x * 0.5 + 0.5) * window.innerWidth;
      const y = (1 - (screen.y * 0.5 + 0.5)) * window.innerHeight;
      item.el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      item.el.style.opacity = String(1 - t);
    }
  }
}
