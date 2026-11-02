/**
 * ===================================================================
 * MASTER APP CONTROLLER & SPA ROUTER
 * Handles Theme Toggle, Full 10 Requirements, and Student Metadata
 * ===================================================================
 */

import { soundEngine } from './audio.js';
import { particleEngine } from './particles.js';
import { storageManager } from './storage.js';
import { BubblesEngine } from './mode-bubbles.js';
import { KeyMagnetEngine } from './mode-keymagnet.js';

class TypingGameApp {
  constructor() {
    this.currentView = 'home'; // 'home' | 'bubbles' | 'keymagnet'
    this.currentDifficulty = 'easy';
    this.currentKeySet = 'all';
    this.isPaused = false;
    this.theme = 'dark';

    // Engines
    this.bubblesEngine = null;
    this.keyMagnetEngine = null;

    // DOM references
    this.dom = {};
  }

  init() {
    this.cacheDOMElements();
    this.initTheme();
    this.initAudioAndParticles();
    this.initEngines();
    this.bindEvents();
    this.bindGlobalKeyboard();
    this.renderHomeScores();

    this.showView('home');
  }

  cacheDOMElements() {
    this.dom.viewHome = document.getElementById('viewHome');
    this.dom.viewBubbles = document.getElementById('viewBubbles');
    this.dom.viewKeyMagnet = document.getElementById('viewKeyMagnet');

    // Theme & Audio Controls
    this.dom.btnThemeToggle = document.getElementById('btnThemeToggle');
    this.dom.btnMute = document.getElementById('btnMute');

    // HUD
    this.dom.gameHud = document.getElementById('gameHud');
    this.dom.hudModeTitle = document.getElementById('hudModeTitle');
    this.dom.hudDiffBadge = document.getElementById('hudDiffBadge');

    this.dom.hudScore = document.getElementById('hudScore');
    this.dom.hudHighScore = document.getElementById('hudHighScore');
    this.dom.hudCombo = document.getElementById('hudCombo');
    this.dom.hudHits = document.getElementById('hudHits');
    this.dom.hudErrors = document.getElementById('hudErrors');
    this.dom.hudAccuracy = document.getElementById('hudAccuracy');

    this.dom.hudLivesGroup = document.getElementById('hudLivesGroup');
    this.dom.hudLivesList = document.getElementById('hudLivesList');
    this.dom.hudMissesText = document.getElementById('hudMissesText');
    this.dom.hudTimerGroup = document.getElementById('hudTimerGroup');
    this.dom.hudTimer = document.getElementById('hudTimer');

    // Controls: Start, Pause, Restart, Reset, Exit (Requirement 3)
    this.dom.btnStart = document.getElementById('btnStart');
    this.dom.btnPause = document.getElementById('btnPause');
    this.dom.btnRestart = document.getElementById('btnRestart');
    this.dom.btnReset = document.getElementById('btnReset');
    this.dom.btnExit = document.getElementById('btnExit');

    // Modals
    this.dom.resultsModal = document.getElementById('resultsModal');
    this.dom.pauseModal = document.getElementById('pauseModal');

    // Debrief stats
    this.dom.debriefRank = document.getElementById('debriefRank');
    this.dom.debriefTitle = document.getElementById('debriefTitle');
    this.dom.debriefScore = document.getElementById('debriefScore');
    this.dom.debriefAccuracy = document.getElementById('debriefAccuracy');
    this.dom.debriefReaction = document.getElementById('debriefReaction');
    this.dom.debriefCombo = document.getElementById('debriefCombo');
    this.dom.debriefHits = document.getElementById('debriefHits');
    this.dom.debriefErrors = document.getElementById('debriefErrors');
    this.dom.debriefRecordNotice = document.getElementById('debriefRecordNotice');

    this.dom.btnPlayAgain = document.getElementById('btnPlayAgain');
    this.dom.btnModalMenu = document.getElementById('btnModalMenu');
    this.dom.btnResumeModal = document.getElementById('btnResumeModal');
    this.dom.btnRestartModal = document.getElementById('btnRestartModal');
    this.dom.btnQuitModal = document.getElementById('btnQuitModal');
  }

  initTheme() {
    const settings = storageManager.getSettings();
    this.theme = settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);
    this.updateThemeButton();
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);
    storageManager.saveSettings({ theme: this.theme });
    this.updateThemeButton();
    soundEngine.playKeyClick();
  }

  updateThemeButton() {
    if (this.dom.btnThemeToggle) {
      this.dom.btnThemeToggle.innerHTML = this.theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
  }

  initAudioAndParticles() {
    particleEngine.init('particleCanvas');
    const settings = storageManager.getSettings();
    if (settings.muted) {
      soundEngine.setMuted(true);
      this.updateMuteIcon(true);
    }
  }

  initEngines() {
    const bubblesArena = document.getElementById('bubblesArena');
    this.bubblesEngine = new BubblesEngine(bubblesArena);

    const keyboardPanel = document.getElementById('cyberKeyboard');
    const targetBeacon = document.getElementById('targetBeacon');
    this.keyMagnetEngine = new KeyMagnetEngine(keyboardPanel, targetBeacon);
  }

  bindEvents() {
    // Theme toggle
    this.dom.btnThemeToggle?.addEventListener('click', () => this.toggleTheme());

    // Sound toggle
    this.dom.btnMute?.addEventListener('click', () => {
      const isMuted = soundEngine.toggleMute();
      storageManager.saveSettings({ muted: isMuted });
      this.updateMuteIcon(isMuted);
    });

    // Mandatory Controls: Start, Pause, Restart, Reset, Exit
    this.dom.btnStart?.addEventListener('click', () => this.startCurrentMode());
    this.dom.btnPause?.addEventListener('click', () => this.togglePause());
    this.dom.btnRestart?.addEventListener('click', () => this.restartCurrentMode());
    this.dom.btnReset?.addEventListener('click', () => this.resetCurrentMode());
    this.dom.btnExit?.addEventListener('click', () => this.exitToMenu());

    // Results modal
    this.dom.btnPlayAgain?.addEventListener('click', () => {
      this.closeModal(this.dom.resultsModal);
      this.restartCurrentMode();
    });
    this.dom.btnModalMenu?.addEventListener('click', () => {
      this.closeModal(this.dom.resultsModal);
      this.exitToMenu();
    });

    // Pause modal
    this.dom.btnResumeModal?.addEventListener('click', () => this.togglePause());
    this.dom.btnRestartModal?.addEventListener('click', () => {
      this.closeModal(this.dom.pauseModal);
      this.restartCurrentMode();
    });
    this.dom.btnQuitModal?.addEventListener('click', () => {
      this.closeModal(this.dom.pauseModal);
      this.exitToMenu();
    });

    // Start Mode Buttons from Home
    document.getElementById('btnStartBubbles')?.addEventListener('click', () => {
      soundEngine.playKeyClick();
      this.startMode('bubbles');
    });

    document.getElementById('btnStartKeyMagnet')?.addEventListener('click', () => {
      soundEngine.playKeyClick();
      this.startMode('keymagnet');
    });

    // Mobile input assist
    const mobileInput = document.getElementById('mobileInputBubbles');
    if (mobileInput) {
      mobileInput.addEventListener('input', (e) => {
        if (e.target.value) {
          const char = e.target.value.slice(-1);
          if (this.currentView === 'bubbles' && this.bubblesEngine.isRunning) {
            this.bubblesEngine.handleKeyPress(char);
          }
          e.target.value = '';
        }
      });
    }

    this.bindPillOptions();
  }

  bindPillOptions() {
    // Difficulty selection
    document.querySelectorAll('[data-difficulty-group]').forEach(group => {
      group.querySelectorAll('.pill-option').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.pill-option').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentDifficulty = btn.dataset.value;
          soundEngine.playKeyClick();
        });
      });
    });

    // Practice key set selection
    document.querySelectorAll('[data-keyset-group]').forEach(group => {
      group.querySelectorAll('.pill-option').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.pill-option').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentKeySet = btn.dataset.value;
          soundEngine.playKeyClick();
        });
      });
    });
  }

  bindGlobalKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentView !== 'home') {
        this.togglePause();
        return;
      }

      if (this.isPaused) return;
      if (e.key.length > 1 && e.key !== ' ') return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (this.currentView === 'bubbles') {
        if (!this.bubblesEngine.isRunning) {
          this.startCurrentMode();
        }
        this.bubblesEngine.handleKeyPress(e.key);
      } else if (this.currentView === 'keymagnet') {
        if (!this.keyMagnetEngine.isRunning) {
          this.startCurrentMode();
        }
        this.keyMagnetEngine.handleKeyPress(e.key);
      }
    });
  }

  showView(viewName) {
    this.currentView = viewName;
    this.dom.viewHome.classList.toggle('active', viewName === 'home');
    this.dom.viewBubbles.classList.toggle('active', viewName === 'bubbles');
    this.dom.viewKeyMagnet.classList.toggle('active', viewName === 'keymagnet');

    if (viewName === 'home') {
      this.dom.gameHud.style.display = 'none';
      this.renderHomeScores();
    } else {
      this.dom.gameHud.style.display = 'flex';
      this.updateHudStaticHeaders();
    }
  }

  updateHudStaticHeaders() {
    if (this.currentView === 'bubbles') {
      this.dom.hudModeTitle.textContent = 'Mode A: Magma Bubbles';
      this.dom.hudLivesGroup.style.display = 'flex';
      this.dom.hudTimerGroup.style.display = 'none';
    } else {
      this.dom.hudModeTitle.textContent = 'Mode B: KeyMagnet Forge';
      this.dom.hudLivesGroup.style.display = 'none';
      this.dom.hudTimerGroup.style.display = 'flex';
    }
    this.dom.hudDiffBadge.textContent = this.currentDifficulty.toUpperCase();
    this.dom.hudHighScore.textContent = storageManager.getHighScore(this.currentView, this.currentDifficulty);
  }

  startMode(modeName) {
    this.closeAllModals();
    this.showView(modeName);
    this.startCurrentMode();
  }

  startCurrentMode() {
    this.isPaused = false;
    this.dom.btnStart.style.display = 'none';
    this.dom.btnPause.style.display = 'inline-flex';

    if (this.currentView === 'bubbles') {
      this.bubblesEngine.start(
        this.currentDifficulty,
        (results) => this.handleGameOver(results),
        (hudData) => this.updateBubblesHud(hudData)
      );
    } else if (this.currentView === 'keymagnet') {
      this.keyMagnetEngine.start(
        this.currentDifficulty,
        this.currentKeySet,
        (results) => this.handleGameOver(results),
        (hudData) => this.updateKeyMagnetHud(hudData)
      );
    }
  }

  resetCurrentMode() {
    this.isPaused = false;
    this.closeAllModals();

    if (this.currentView === 'bubbles') {
      this.bubblesEngine.reset();
    } else if (this.currentView === 'keymagnet') {
      this.keyMagnetEngine.reset();
    }

    this.dom.btnStart.style.display = 'inline-flex';
    this.dom.btnPause.style.display = 'none';
    soundEngine.playKeyClick();
  }

  restartCurrentMode() {
    this.closeAllModals();
    this.startCurrentMode();
    soundEngine.playKeyClick();
  }

  updateBubblesHud(data) {
    this.dom.hudScore.textContent = data.score;
    this.dom.hudCombo.textContent = `${data.combo}x`;
    this.dom.hudAccuracy.textContent = `${data.accuracy}%`;
    this.dom.hudHits.textContent = data.correctCount;
    this.dom.hudErrors.textContent = data.incorrectCount;

    if (this.dom.hudMissesText) {
      this.dom.hudMissesText.textContent = `${data.misses} / ${data.maxMisses}`;
    }

    this.dom.hudLivesList.innerHTML = '';
    for (let i = 0; i < data.maxMisses; i++) {
      const dot = document.createElement('div');
      dot.className = `life-dot ${i < data.misses ? 'lost' : ''}`;
      this.dom.hudLivesList.appendChild(dot);
    }
  }

  updateKeyMagnetHud(data) {
    this.dom.hudScore.textContent = data.score;
    this.dom.hudCombo.textContent = `${data.combo}x`;
    this.dom.hudAccuracy.textContent = `${data.accuracy}%`;
    this.dom.hudTimer.textContent = `${data.timeRemaining}s`;
    this.dom.hudHits.textContent = data.correctCount;
    this.dom.hudErrors.textContent = data.incorrectCount;
  }

  togglePause() {
    if (this.currentView === 'home') return;

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      if (this.currentView === 'bubbles') this.bubblesEngine.pause();
      if (this.currentView === 'keymagnet') this.keyMagnetEngine.pause();
      this.openModal(this.dom.pauseModal);
    } else {
      if (this.currentView === 'bubbles') this.bubblesEngine.resume();
      if (this.currentView === 'keymagnet') this.keyMagnetEngine.resume();
      this.closeModal(this.dom.pauseModal);
    }
  }

  exitToMenu() {
    this.closeAllModals();
    this.isPaused = false;
    this.bubblesEngine.reset();
    this.keyMagnetEngine.reset();
    this.showView('home');
    soundEngine.playKeyClick();
  }

  handleGameOver(results) {
    const isNewRecord = storageManager.saveHighScore(results.mode, results.difficulty, results.score);

    this.dom.debriefRank.textContent = results.grade;
    this.dom.debriefTitle.textContent = results.score >= 800 ? 'MISSION COMPLETE' : 'SESSION TERMINATED';
    this.dom.debriefScore.textContent = results.score;
    this.dom.debriefAccuracy.textContent = `${results.accuracy}%`;
    this.dom.debriefCombo.textContent = `${results.maxCombo}x`;
    this.dom.debriefHits.textContent = results.correct;
    this.dom.debriefErrors.textContent = results.incorrect;
    this.dom.debriefReaction.textContent = results.avgReaction ? `${results.avgReaction}ms` : `${results.correct} Hits`;

    if (this.dom.debriefRecordNotice) {
      this.dom.debriefRecordNotice.style.display = isNewRecord ? 'block' : 'none';
    }

    this.openModal(this.dom.resultsModal);
  }

  renderHomeScores() {
    const bEasy = storageManager.getHighScore('bubbles', 'easy');
    const bMed = storageManager.getHighScore('bubbles', 'medium');
    const bHard = storageManager.getHighScore('bubbles', 'hard');
    const bestBubbles = Math.max(bEasy, bMed, bHard);

    const kEasy = storageManager.getHighScore('keymagnet', 'easy');
    const kMed = storageManager.getHighScore('keymagnet', 'medium');
    const kHard = storageManager.getHighScore('keymagnet', 'hard');
    const bestKeyMagnet = Math.max(kEasy, kMed, kHard);

    const bEl = document.getElementById('homeBestBubbles');
    if (bEl) bEl.textContent = `Best: ${bestBubbles}`;

    const kEl = document.getElementById('homeBestKeyMagnet');
    if (kEl) kEl.textContent = `Best: ${bestKeyMagnet}`;
  }

  updateMuteIcon(isMuted) {
    if (this.dom.btnMute) {
      this.dom.btnMute.innerHTML = isMuted ? '🔇 Muted' : '🔊 Sound';
      this.dom.btnMute.classList.toggle('active', !isMuted);
    }
  }

  openModal(modal) {
    if (modal) modal.classList.add('active');
  }

  closeModal(modal) {
    if (modal) modal.classList.remove('active');
  }

  closeAllModals() {
    this.closeModal(this.dom.resultsModal);
    this.closeModal(this.dom.pauseModal);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new TypingGameApp();
  app.init();
});
