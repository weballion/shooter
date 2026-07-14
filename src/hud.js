export class HUD {
  constructor() {
    this.hudEl = document.getElementById('hud');
    this.crosshairEl = document.getElementById('crosshair');
    this.hitMarkerEl = document.getElementById('hit-marker');
    this.playerFillEl = document.getElementById('player-health-fill');
    this.botFillEl = document.getElementById('bot-health-fill');

    this.startScreenEl = document.getElementById('start-screen');
    this.startButtonEl = document.getElementById('start-button');

    this.endScreenEl = document.getElementById('end-screen');
    this.endTitleEl = document.getElementById('end-title');
    this.restartButtonEl = document.getElementById('restart-button');

    this.pauseScreenEl = document.getElementById('pause-screen');
    this.resumeButtonEl = document.getElementById('resume-button');

    this._hitMarkerTimeout = null;
    this._crosshairTimeout = null;
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

  updateHealth(playerHealth, botHealth) {
    this.playerFillEl.style.width = `${Math.max(0, playerHealth)}%`;
    this.botFillEl.style.width = `${Math.max(0, botHealth)}%`;
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
