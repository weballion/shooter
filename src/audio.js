// A simple 4-chord retro loop (Am - F - C - G), each chord arpeggiated
// root/third/fifth/octave over 4 steps — the classic 8-bit game-music shape.
const MUSIC_PROGRESSION = [
  { bass: 110.0, lead: [220.0, 261.63, 329.63, 440.0] }, // Am
  { bass: 87.31, lead: [174.61, 220.0, 261.63, 349.23] }, // F
  { bass: 130.81, lead: [261.63, 329.63, 392.0, 523.25] }, // C
  { bass: 98.0, lead: [196.0, 246.94, 293.66, 392.0] }, // G
];
const MUSIC_STEP_DURATION = 0.16; // seconds per 16th-note step
const MUSIC_SCHEDULE_AHEAD = 0.1; // how far ahead (seconds) we schedule notes
const MUSIC_POLL_INTERVAL = 50; // ms between scheduler wake-ups

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
    this.musicPlaying = false;
    this.musicGain = null;
    this._musicStep = 0;
    this._musicNextTime = 0;
    this._musicTimeoutId = null;
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

  /** Looping chiptune-style background music. No-op if already playing. */
  startMusic() {
    if (this.musicPlaying) return;
    const ctx = this._context();
    this.musicPlaying = true;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 1;
    this.musicGain.connect(ctx.destination);
    this._musicStep = 0;
    this._musicNextTime = ctx.currentTime + 0.05;
    this._scheduleMusic();
  }

  stopMusic() {
    this.musicPlaying = false;
    clearTimeout(this._musicTimeoutId);
    if (this.musicGain) {
      this.musicGain.disconnect();
      this.musicGain = null;
    }
  }

  _scheduleMusic() {
    if (!this.musicPlaying) return;
    const ctx = this._context();

    while (this._musicNextTime < ctx.currentTime + MUSIC_SCHEDULE_AHEAD) {
      const chord = MUSIC_PROGRESSION[Math.floor(this._musicStep / 4) % MUSIC_PROGRESSION.length];
      const noteIndex = this._musicStep % 4;

      if (noteIndex === 0) {
        this._musicNote(chord.bass, MUSIC_STEP_DURATION * 3.8, 'square', 0.05, this._musicNextTime);
      }
      this._musicNote(chord.lead[noteIndex], MUSIC_STEP_DURATION * 0.85, 'square', 0.055, this._musicNextTime);

      this._musicNextTime += MUSIC_STEP_DURATION;
      this._musicStep++;
    }

    this._musicTimeoutId = setTimeout(() => this._scheduleMusic(), MUSIC_POLL_INTERVAL);
  }

  _musicNote(freq, duration, type, volume, startTime) {
    const ctx = this._context();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain).connect(this.musicGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}
