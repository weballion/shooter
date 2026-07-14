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

    this.endScreenEl = document.getElementById('end-screen');
    this.endTitleEl = document.getElementById('end-title');
    this.restartButtonEl = document.getElementById('restart-button');

    this.pauseScreenEl = document.getElementById('pause-screen');
    this.resumeButtonEl = document.getElementById('resume-button');

    this._hitMarkerTimeout = null;
    this._crosshairTimeout = null;

    this.enemyCount = DEFAULT_ENEMY_COUNT;
    this.countButtonEls = document.querySelectorAll('.count-btn');
    this.countButtonEls.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.enemyCount = parseInt(btn.dataset.count, 10);
        this._refreshCountButtons();
      });
    });
    this._refreshCountButtons();
  }

  _refreshCountButtons() {
    this.countButtonEls.forEach((btn) => {
      btn.classList.toggle('selected', parseInt(btn.dataset.count, 10) === this.enemyCount);
    });
  }

  getEnemyCount() {
    return this.enemyCount;
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

  onRestart(callback) {
    this.restartButtonEl.addEventListener('click', callback);
  }

  onResume(callback) {
    this.resumeButtonEl.addEventListener('click', callback);
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

  showEndScreen(playerWon) {
    this.endTitleEl.textContent = playerWon ? 'VICTORY' : 'DEFEAT';
    this.endTitleEl.className = playerWon ? 'victory' : 'defeat';
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
