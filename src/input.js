export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;
    this.keys = new Set();
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    this.pointerLocked = false;

    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.domElement;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked) return;
      this.lookDeltaX += e.movementX || 0;
      this.lookDeltaY += e.movementY || 0;
    });

    // Prevent the page from scrolling when arrow keys / space are used.
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
  }

  requestPointerLock() {
    this.domElement.requestPointerLock();
  }

  get moveForward() {
    return this.keys.has('ArrowUp');
  }

  get moveBackward() {
    return this.keys.has('ArrowDown');
  }

  get strafeLeft() {
    return this.keys.has('ArrowLeft');
  }

  get strafeRight() {
    return this.keys.has('ArrowRight');
  }

  get firing() {
    return this.keys.has('Space');
  }

  /** Returns accumulated mouse movement since last call and resets it. */
  consumeLookDelta() {
    const delta = { x: this.lookDeltaX, y: this.lookDeltaY };
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    return delta;
  }
}
