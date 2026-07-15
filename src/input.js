const JOYSTICK_MAX_RADIUS = 45; // px the knob can travel from its origin
const JOYSTICK_DEADZONE = 10; // px before any direction registers
const JOYSTICK_COMPONENT_THRESHOLD = 0.3; // fraction of full tilt needed per axis

export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;
    this.keys = new Set();
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    this.pointerLocked = false;
    this.mouseDown = false;
    this.isTouch = window.matchMedia('(pointer: coarse)').matches;
    this.controlScheme = 'arrows'; // 'arrows' | 'wasd'

    this._touch = { forward: false, backward: false, left: false, right: false };
    this._touchFireIds = new Set();
    this._joystickTouchId = null;
    this._joystickOrigin = { x: 0, y: 0 };
    this._lookTouchId = null;
    this._lookLast = { x: 0, y: 0 };

    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseDown = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
    });

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

    this._setupTouchControls();
  }

  _setupTouchControls() {
    const joystickZone = document.getElementById('touch-joystick-zone');
    const joystickKnob = document.getElementById('touch-joystick-knob');
    const lookZone = document.getElementById('touch-look-zone');
    const fireButton = document.getElementById('touch-fire-button');
    if (!joystickZone || !joystickKnob || !lookZone || !fireButton) return;

    joystickZone.addEventListener('touchstart', (e) => {
      if (this._joystickTouchId !== null) return;
      const touch = e.changedTouches[0];
      this._joystickTouchId = touch.identifier;
      this._joystickOrigin = { x: touch.clientX, y: touch.clientY };
      joystickKnob.style.left = `${touch.clientX}px`;
      joystickKnob.style.top = `${touch.clientY}px`;
      joystickKnob.classList.add('active');
      e.preventDefault();
    }, { passive: false });

    joystickZone.addEventListener('touchmove', (e) => {
      const touch = [...e.changedTouches].find((t) => t.identifier === this._joystickTouchId);
      if (!touch) return;

      const dx = touch.clientX - this._joystickOrigin.x;
      const dy = touch.clientY - this._joystickOrigin.y;
      const distance = Math.hypot(dx, dy);

      const clamped = Math.min(distance, JOYSTICK_MAX_RADIUS);
      const angle = Math.atan2(dy, dx);
      joystickKnob.style.left = `${this._joystickOrigin.x + Math.cos(angle) * clamped}px`;
      joystickKnob.style.top = `${this._joystickOrigin.y + Math.sin(angle) * clamped}px`;

      if (distance < JOYSTICK_DEADZONE) {
        this._touch.forward = this._touch.backward = this._touch.left = this._touch.right = false;
      } else {
        const nx = dx / distance;
        const ny = dy / distance;
        this._touch.forward = ny < -JOYSTICK_COMPONENT_THRESHOLD;
        this._touch.backward = ny > JOYSTICK_COMPONENT_THRESHOLD;
        this._touch.left = nx < -JOYSTICK_COMPONENT_THRESHOLD;
        this._touch.right = nx > JOYSTICK_COMPONENT_THRESHOLD;
      }
      e.preventDefault();
    }, { passive: false });

    const releaseJoystick = (e) => {
      const touch = [...e.changedTouches].find((t) => t.identifier === this._joystickTouchId);
      if (!touch) return;
      this._joystickTouchId = null;
      this._touch.forward = this._touch.backward = this._touch.left = this._touch.right = false;
      joystickKnob.classList.remove('active');
    };
    joystickZone.addEventListener('touchend', releaseJoystick);
    joystickZone.addEventListener('touchcancel', releaseJoystick);

    lookZone.addEventListener('touchstart', (e) => {
      if (this._lookTouchId !== null) return;
      const touch = e.changedTouches[0];
      this._lookTouchId = touch.identifier;
      this._lookLast = { x: touch.clientX, y: touch.clientY };
      e.preventDefault();
    }, { passive: false });

    lookZone.addEventListener('touchmove', (e) => {
      const touch = [...e.changedTouches].find((t) => t.identifier === this._lookTouchId);
      if (!touch) return;
      this.lookDeltaX += touch.clientX - this._lookLast.x;
      this.lookDeltaY += touch.clientY - this._lookLast.y;
      this._lookLast = { x: touch.clientX, y: touch.clientY };
      e.preventDefault();
    }, { passive: false });

    const releaseLook = (e) => {
      const touch = [...e.changedTouches].find((t) => t.identifier === this._lookTouchId);
      if (!touch) return;
      this._lookTouchId = null;
    };
    lookZone.addEventListener('touchend', releaseLook);
    lookZone.addEventListener('touchcancel', releaseLook);

    fireButton.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) this._touchFireIds.add(t.identifier);
      e.preventDefault();
    }, { passive: false });

    const releaseFire = (e) => {
      for (const t of e.changedTouches) this._touchFireIds.delete(t.identifier);
    };
    fireButton.addEventListener('touchend', releaseFire);
    fireButton.addEventListener('touchcancel', releaseFire);
  }

  requestPointerLock() {
    this.domElement.requestPointerLock();
  }

  setControlScheme(scheme) {
    this.controlScheme = scheme;
  }

  get moveForward() {
    const key = this.controlScheme === 'wasd' ? 'KeyW' : 'ArrowUp';
    return this.keys.has(key) || this._touch.forward;
  }

  get moveBackward() {
    const key = this.controlScheme === 'wasd' ? 'KeyS' : 'ArrowDown';
    return this.keys.has(key) || this._touch.backward;
  }

  get strafeLeft() {
    const key = this.controlScheme === 'wasd' ? 'KeyA' : 'ArrowLeft';
    return this.keys.has(key) || this._touch.left;
  }

  get strafeRight() {
    const key = this.controlScheme === 'wasd' ? 'KeyD' : 'ArrowRight';
    return this.keys.has(key) || this._touch.right;
  }

  get firing() {
    return this.keys.has('Space') || this.mouseDown || this._touchFireIds.size > 0;
  }

  /** Returns accumulated look movement (mouse or touch-drag) since last call and resets it. */
  consumeLookDelta() {
    const delta = { x: this.lookDeltaX, y: this.lookDeltaY };
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    return delta;
  }
}
