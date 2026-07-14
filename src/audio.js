/**
 * All-synthesized sound effects (Web Audio oscillators/noise) so the game
 * stays a self-contained static site with no external audio assets to host.
 * The AudioContext is created lazily on first use, which in practice is
 * always in response to a user gesture (Start click, fire key), satisfying
 * browsers' autoplay-policy requirement.
 */
export class SoundManager {
  constructor() {
    this.ctx = null;
  }

  _context() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _tone({ freqStart, freqEnd, duration, type = 'sine', volume = 0.2, delay = 0 }) {
    const ctx = this._context();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t0 = ctx.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration);

    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  _noiseBurst({ duration, volume = 0.3, delay = 0 }) {
    const ctx = this._context();
    const size = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    const t0 = ctx.currentTime + delay;
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    source.connect(gain).connect(ctx.destination);
    source.start(t0);
    source.stop(t0 + duration + 0.02);
  }

  playerShoot() {
    this._tone({ freqStart: 900, freqEnd: 220, duration: 0.09, type: 'sawtooth', volume: 0.15 });
  }

  botShoot() {
    this._tone({ freqStart: 500, freqEnd: 150, duration: 0.12, type: 'square', volume: 0.12 });
  }

  hitConfirmed() {
    this._noiseBurst({ duration: 0.08, volume: 0.25 });
    this._tone({ freqStart: 1200, freqEnd: 800, duration: 0.06, type: 'triangle', volume: 0.2, delay: 0.01 });
  }

  pickupHeal() {
    this._tone({ freqStart: 500, freqEnd: 900, duration: 0.15, type: 'sine', volume: 0.18 });
  }

  gameStart() {
    this._tone({ freqStart: 220, freqEnd: 880, duration: 0.35, type: 'sine', volume: 0.2 });
  }

  victory() {
    [523, 659, 784, 1046].forEach((freq, i) =>
      this._tone({ freqStart: freq, freqEnd: freq, duration: 0.18, type: 'sine', volume: 0.2, delay: i * 0.14 })
    );
  }

  defeat() {
    [400, 340, 260, 180].forEach((freq, i) =>
      this._tone({ freqStart: freq, freqEnd: freq * 0.9, duration: 0.25, type: 'sawtooth', volume: 0.2, delay: i * 0.16 })
    );
  }
}
