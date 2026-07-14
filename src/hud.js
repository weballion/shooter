import { DEFAULT_ARENA_THEME } from './themes.js';

const DEFAULT_ENEMY_COUNT = 1;

export class HUD {
  constructor() {
    this.hudEl = document.getElementById('hud');
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
    this.customFacesCheckboxEl = document.getElementById('custom-faces-checkbox');

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

  getEnemyCount() {
    return this.enemyCount;
  }

  getArenaTheme() {
    return this.arenaTheme;
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
    return this.customFacesCheckboxEl.checked;
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
