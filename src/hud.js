import { DEFAULT_ARENA_THEME } from './themes.js';
import { DEFAULT_DIFFICULTY, getDifficulty } from './difficulty.js';

const DEFAULT_ENEMY_COUNT = 1;
const DEFAULT_CONTROL_SCHEME = 'arrows';
const DEFAULT_APPEARANCE = 'faces';

export class HUD {
  constructor() {
    this.hudEl = document.getElementById('hud');
    this.runInfoEl = document.getElementById('run-info');
    this.crosshairEl = document.getElementById('crosshair');
    this.hitMarkerEl = document.getElementById('hit-marker');
    this.playerFillEl = document.getElementById('player-health-fill');
    this.enemyListEl = document.getElementById('enemy-health-list');
    this.enemyFillEls = [];

    this.startScreenEl = document.getElementById('start-screen');
    this.startButtonEl = document.getElementById('start-button');
    this.survivalButtonEl = document.getElementById('survival-button');
    this.carryHealthCheckboxEl = document.getElementById('carry-health-checkbox');
    this.pickupsCheckboxEl = document.getElementById('pickups-checkbox');
    this.cameraShakeCheckboxEl = document.getElementById('camera-shake-checkbox');
    this.musicCheckboxEl = document.getElementById('music-checkbox');
    this.invertYCheckboxEl = document.getElementById('invert-y-checkbox');

    this.endScreenEl = document.getElementById('end-screen');
    this.endTitleEl = document.getElementById('end-title');
    this.endSubtitleEl = document.getElementById('end-subtitle');
    this.endEnemySelectorEl = document.getElementById('end-enemy-selector');
    this.restartButtonEl = document.getElementById('restart-button');

    this.pauseScreenEl = document.getElementById('pause-screen');
    this.resumeButtonEl = document.getElementById('resume-button');
    this.pauseMenuButtonEl = document.getElementById('pause-menu-button');

    this.roundScreenEl = document.getElementById('round-screen');
    this.roundTitleEl = document.getElementById('round-title');
    this.roundSubtitleEl = document.getElementById('round-subtitle');
    this.continueRoundButtonEl = document.getElementById('continue-round-button');
    this.exitSurvivalButtonEl = document.getElementById('exit-survival-button');

    this._hitMarkerTimeout = null;
    this._crosshairTimeout = null;

    this.enemyCount = DEFAULT_ENEMY_COUNT;
    this.countButtonEls = document.querySelectorAll('.count-btn');
    this.selectorLabelEls = document.querySelectorAll('.selector-label');
    this.countButtonEls.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.enemyCount = parseInt(btn.dataset.count, 10);
        this._refreshCountButtons();
      });
    });
    this._refreshCountButtons();

    this.arenaTheme = DEFAULT_ARENA_THEME;
    this.themeButtonEls = document.querySelectorAll('.theme-btn');
    this.themeButtonEls.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.arenaTheme = btn.dataset.theme;
        this._refreshThemeButtons();
      });
    });
    this._refreshThemeButtons();

    this.difficulty = DEFAULT_DIFFICULTY;
    this.difficultyButtonEls = document.querySelectorAll('.difficulty-btn');
    this.difficultyButtonEls.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.difficulty = btn.dataset.difficulty;
        this._refreshDifficultyButtons();
      });
    });
    this._refreshDifficultyButtons();

    this.controlScheme = DEFAULT_CONTROL_SCHEME;
    this.controlsButtonEls = document.querySelectorAll('.controls-btn');
    this.keyMoveFbEl = document.getElementById('key-move-fb');
    this.keyMoveLrEl = document.getElementById('key-move-lr');
    this.controlsButtonEls.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.controlScheme = btn.dataset.controls;
        this._refreshControlsButtons();
      });
    });
    this._refreshControlsButtons();

    // Bot appearance: custom face photos and monster models are mutually
    // exclusive, so this is one radio-style pair rather than two checkboxes.
    this.appearance = DEFAULT_APPEARANCE;
    this.appearanceButtonEls = document.querySelectorAll('.appearance-btn');
    this.appearanceButtonEls.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.appearance = btn.dataset.appearance;
        this._refreshAppearanceButtons();
      });
    });
    this._refreshAppearanceButtons();
  }

  _refreshCountButtons() {
    this.countButtonEls.forEach((btn) => {
      btn.classList.toggle('selected', parseInt(btn.dataset.count, 10) === this.enemyCount);
    });
    this.selectorLabelEls.forEach((label) => {
      label.textContent = `ENEMIES: ${this.enemyCount}`;
    });
  }

  _refreshThemeButtons() {
    this.themeButtonEls.forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.theme === this.arenaTheme);
    });
  }

  _refreshDifficultyButtons() {
    this.difficultyButtonEls.forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.difficulty === this.difficulty);
    });
  }

  _refreshControlsButtons() {
    this.controlsButtonEls.forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.controls === this.controlScheme);
    });
    const wasd = this.controlScheme === 'wasd';
    if (this.keyMoveFbEl) this.keyMoveFbEl.textContent = wasd ? 'W / S' : '↑ ↓';
    if (this.keyMoveLrEl) this.keyMoveLrEl.textContent = wasd ? 'A / D' : '← →';
  }

  _refreshAppearanceButtons() {
    this.appearanceButtonEls.forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.appearance === this.appearance);
    });
  }

  getEnemyCount() {
    return this.enemyCount;
  }

  getArenaTheme() {
    return this.arenaTheme;
  }

  getDifficulty() {
    return this.difficulty;
  }

  getControlScheme() {
    return this.controlScheme;
  }

  getCarryHealth() {
    return this.carryHealthCheckboxEl.checked;
  }

  getPickupsEnabled() {
    return this.pickupsCheckboxEl.checked;
  }

  getCameraShakeEnabled() {
    return this.cameraShakeCheckboxEl.checked;
  }

  getCustomFacesEnabled() {
    return this.appearance === 'faces';
  }

  getMonsterModelsEnabled() {
    return this.appearance === 'monsters';
  }

  getMusicEnabled() {
    return this.musicCheckboxEl.checked;
  }

  getInvertY() {
    return this.invertYCheckboxEl.checked;
  }

  /** (Re)builds one health-bar row per bot, in arena/spawn order. */
  setupEnemyHealthBars(count) {
    this.enemyListEl.innerHTML = '';
    this.enemyFillEls = [];
    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'health-row reverse';

      const label = document.createElement('span');
      label.className = 'health-label';
      label.textContent = count === 1 ? 'BOT' : `B${i + 1}`;

      const bar = document.createElement('div');
      bar.className = 'health-bar';
      const fill = document.createElement('div');
      fill.className = 'health-fill bot';
      bar.appendChild(fill);

      row.appendChild(label);
      row.appendChild(bar);
      this.enemyListEl.appendChild(row);
      this.enemyFillEls.push(fill);
    }
  }

  onStart(callback) {
    this.startButtonEl.addEventListener('click', callback);
  }

  onSurvivalStart(callback) {
    this.survivalButtonEl.addEventListener('click', callback);
  }

  onResume(callback) {
    this.resumeButtonEl.addEventListener('click', callback);
  }

  onPauseMenu(callback) {
    this.pauseMenuButtonEl.addEventListener('click', callback);
  }

  onContinueRound(callback) {
    this.continueRoundButtonEl.addEventListener('click', callback);
  }

  onExitSurvival(callback) {
    this.exitSurvivalButtonEl.addEventListener('click', callback);
  }

  showStartScreen() {
    this.startScreenEl.classList.remove('hidden');
  }

  hideStartScreen() {
    this.startScreenEl.classList.add('hidden');
  }

  showHUD() {
    this.hudEl.classList.remove('hidden');
  }

  /** Small always-visible reminder of the current run's mode/round/difficulty. */
  setRunInfo({ mode, enemyCount, round, maxRound }) {
    const diffLabel = getDifficulty(this.difficulty).label;
    this.runInfoEl.textContent =
      mode === 'SURVIVAL'
        ? `SURVIVAL · ROUND ${round}/${maxRound} · ${diffLabel}`
        : `NORMAL · ${enemyCount} ${enemyCount === 1 ? 'ENEMY' : 'ENEMIES'} · ${diffLabel}`;
  }

  hideHUD() {
    this.hudEl.classList.add('hidden');
  }

  /** `label`/`callback` replace whatever the restart button previously did. */
  setRestartAction(label, callback) {
    this.restartButtonEl.textContent = label;
    this.restartButtonEl.onclick = callback;
  }

  setEndScreenCountSelectorVisible(visible) {
    this.endEnemySelectorEl.classList.toggle('hidden', !visible);
  }

  showEndScreen(title, titleClass, subtitle) {
    this.endTitleEl.textContent = title;
    this.endTitleEl.className = titleClass;
    if (subtitle) {
      this.endSubtitleEl.textContent = subtitle;
      this.endSubtitleEl.classList.remove('hidden');
    } else {
      this.endSubtitleEl.classList.add('hidden');
    }
    this.endScreenEl.classList.remove('hidden');
  }

  hideEndScreen() {
    this.endScreenEl.classList.add('hidden');
  }

  showPauseScreen() {
    this.pauseScreenEl.classList.remove('hidden');
  }

  hidePauseScreen() {
    this.pauseScreenEl.classList.add('hidden');
  }

  showRoundTransition(roundNumber, enemyCount) {
    this.roundTitleEl.textContent = `ROUND ${roundNumber}`;
    this.roundSubtitleEl.textContent = `${enemyCount} ${enemyCount === 1 ? 'enemy' : 'enemies'} incoming`;
    this.roundScreenEl.classList.remove('hidden');
  }

  hideRoundTransition() {
    this.roundScreenEl.classList.add('hidden');
  }

  updateHealth(playerHealth, botHealths) {
    this.playerFillEl.style.width = `${Math.max(0, playerHealth)}%`;
    botHealths.forEach((health, i) => {
      if (this.enemyFillEls[i]) this.enemyFillEls[i].style.width = `${Math.max(0, health)}%`;
    });
  }

  flashCrosshair() {
    this.crosshairEl.classList.add('fire');
    clearTimeout(this._crosshairTimeout);
    this._crosshairTimeout = setTimeout(() => this.crosshairEl.classList.remove('fire'), 90);
  }

  showHitMarker() {
    this.hitMarkerEl.classList.add('show');
    clearTimeout(this._hitMarkerTimeout);
    this._hitMarkerTimeout = setTimeout(() => this.hitMarkerEl.classList.remove('show'), 150);
  }
}
