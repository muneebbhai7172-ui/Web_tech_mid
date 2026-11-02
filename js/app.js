/**
 * ===================================================================
 * MASTER APP CONTROLLER & SPA ROUTER
 * CSC336 Web Technologies - Lab Mid Project
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
    this.currentKeySet = 'home';
    this.isPaused = false;

    // Engines
    this.bubblesEngine = null;
    this.keyMagnetEngine = null;

    // DOM References
    this.dom = {};
  }

  init() {
    this.cacheDOMElements();
    this.initAudioAndParticles();
    this.initEngines();
    this.bindEvents();
    this.bindGlobalKeyboard();
    this.renderHomeScores();

    // Start on home view
    this.showView('home');
  }

  cacheDOMElements() {
    this.dom.viewHome = document.getElementById('viewHome');
    this.dom.viewBubbles = document.getElementById('viewBubbles');
    this.dom.viewKeyMagnet = document.getElementById('viewKeyMagnet');

    this.dom.gameHud = document.getElementById('gameHud');
    this.dom.hudScore = document.getElementById('hudScore');
    this.dom.hudHighScore = document.getElementById('hudHighScore');
    this.dom.hudCombo = document.getElementById('hudCombo');
    this.dom.hudLivesGroup = document.getElementById('hudLivesGroup');
    this.dom.hudLivesList = document.getElementById('hudLivesList');
    this.dom.hudTimerGroup = document.getElementById('hudTimerGroup');
    this.dom.hudTimer = document.getElementById('hudTimer');
    this.dom.hudAccuracy = document.getElementById('hudAccuracy');
    this.dom.hudReaction = document.getElementById('hudReaction');

    this.dom.btnMute = document.getElementById('btnMute');
    this.dom.btnPause = document.getElementById('btnPause');
    this.dom.btnRestart = document.getElementById('btnRestart');
    this.dom.btnExit = document.getElementById('btnExit');

    // Modals
    this.dom.resultsModal = document.getElementById('resultsModal');
    this.dom.pauseModal = document.getElementById('pauseModal');

    // Debrief Modal Stats
    this.dom.debriefRank = document.getElementById('debriefRank');
    this.dom.debriefTitle = document.getElementById('debriefTitle');
    this.dom.debriefScore = document.getElementById('debriefScore');
    this.dom.debriefAccuracy = document.getElementById('debriefAccuracy');
    this.dom.debriefReaction = document.getElementById('debriefReaction');
    this.dom.debriefCombo = document.getElementById('debriefCombo');
    this.dom.debriefRecordNotice = document.getElementById('debriefRecordNotice');

    this.dom.btnPlayAgain = document.getElementById('btnPlayAgain');
    this.dom.btnModalMenu = document.getElementById('btnModalMenu');
    this.dom.btnResumeModal = document.getElementById('btnResumeModal');
    this.dom.btnRestartModal = document.getElementById('btnRestartModal');
    this.dom.btnQuitModal = document.getElementById('btnQuitModal');
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
    // Sound Mute Toggle
    this.dom.btnMute?.addEventListener('click', () => {
      const isMuted = soundEngine.toggleMute();
      storageManager.saveSettings({ muted: isMuted });
      this.updateMuteIcon(isMuted);
    });

    // In-game HUD buttons
    this.dom.btnPause?.addEventListener('click', () => this.togglePause());
    this.dom.btnRestart?.addEventListener('click', () => this.restartCurrentMode());
    this.dom.btnExit?.addEventListener('click', () => this.exitToMenu());

    // Results Modal actions
    this.dom.btnPlayAgain?.addEventListener('click', () => {
      this.closeModal(this.dom.resultsModal);
      this.restartCurrentMode();
    });
    this.dom.btnModalMenu?.addEventListener('click', () => {
      this.closeModal(this.dom.resultsModal);
      this.exitToMenu();
    });

    // Pause Modal actions
    this.dom.btnResumeModal?.addEventListener('click', () => this.togglePause());
    this.dom.btnRestartModal?.addEventListener('click', () => {
      this.closeModal(this.dom.pauseModal);
      this.restartCurrentMode();
    });
    this.dom.btnQuitModal?.addEventListener('click', () => {
      this.closeModal(this.dom.pauseModal);
      this.exitToMenu();
    });

    // Mode Selection Start Buttons
    document.getElementById('btnStartBubbles')?.addEventListener('click', () => {
      soundEngine.playKeyClick();
      this.startMode('bubbles');
    });

    document.getElementById('btnStartKeyMagnet')?.addEventListener('click', () => {
      soundEngine.playKeyClick();
      this.startMode('keymagnet');
    });

    // Mobile virtual typing input listener
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

    // Pill selectors (Difficulty & KeySet)
    this.bindPillOptions();
  }

  bindPillOptions() {
    // Difficulty pills
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

    // KeySet pills for Mode B
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
      // Pause trigger via Escape key
      if (e.key === 'Escape' && this.currentView !== 'home') {
        this.togglePause();
        return;
      }

      if (this.isPaused) return;

      // Filter out non-character navigation keys
      if (e.key.length > 1 && e.key !== ' ') return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (this.currentView === 'bubbles' && this.bubblesEngine.isRunning) {
        this.bubblesEngine.handleKeyPress(e.key);
      } else if (this.currentView === 'keymagnet' && this.keyMagnetEngine.isRunning) {
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
    }
  }

  startMode(modeName) {
    this.closeAllModals();
    this.showView(modeName);

    const highScore = storageManager.getHighScore(modeName, this.currentDifficulty);
    this.dom.hudHighScore.textContent = highScore;

    if (modeName === 'bubbles') {
      this.dom.hudLivesGroup.style.display = 'flex';
      this.dom.hudTimerGroup.style.display = 'none';

      this.bubblesEngine.start(
        this.currentDifficulty,
        (results) => this.handleGameOver(results),
        (hudData) => this.updateBubblesHud(hudData)
      );
    } else if (modeName === 'keymagnet') {
      this.dom.hudLivesGroup.style.display = 'none';
      this.dom.hudTimerGroup.style.display = 'flex';

      this.keyMagnetEngine.start(
        this.currentDifficulty,
        this.currentKeySet,
        (results) => this.handleGameOver(results),
        (hudData) => this.updateKeyMagnetHud(hudData)
      );
    }
  }

  updateBubblesHud(data) {
    this.dom.hudScore.textContent = data.score;
    this.dom.hudCombo.textContent = `${data.combo}x`;
    this.dom.hudAccuracy.textContent = `${data.accuracy}%`;

    // Render 6 lives dots
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

    if (this.dom.hudReaction) {
      this.dom.hudReaction.textContent = `${data.avgReaction}ms`;
    }

    const liveKpmEl = document.getElementById('statLiveKpm');
    if (liveKpmEl) liveKpmEl.textContent = data.kpm;

    const liveReactionEl = document.getElementById('statLiveReaction');
    if (liveReactionEl) liveReactionEl.textContent = `${data.avgReaction}ms`;

    const liveAccuracyEl = document.getElementById('statLiveAccuracy');
    if (liveAccuracyEl) liveAccuracyEl.textContent = `${data.accuracy}%`;
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

  restartCurrentMode() {
    this.closeAllModals();
    this.isPaused = false;
    this.startMode(this.currentView);
  }

  exitToMenu() {
    this.closeAllModals();
    this.isPaused = false;
    this.bubblesEngine.reset();
    this.keyMagnetEngine.reset();
    this.showView('home');
  }

  handleGameOver(results) {
    const isNewRecord = storageManager.saveHighScore(results.mode, results.difficulty, results.score);

    this.dom.debriefRank.textContent = results.grade;
    this.dom.debriefTitle.textContent = results.score >= 800 ? 'MISSION ACCOMPLISHED' : 'SESSION TERMINATED';
    this.dom.debriefScore.textContent = results.score;
    this.dom.debriefAccuracy.textContent = `${results.accuracy}%`;
    this.dom.debriefCombo.textContent = `${results.maxCombo}x`;
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
    if (bEl) bEl.textContent = bestBubbles;

    const kEl = document.getElementById('homeBestKeyMagnet');
    if (kEl) kEl.textContent = bestKeyMagnet;
  }

  updateMuteIcon(isMuted) {
    if (this.dom.btnMute) {
      this.dom.btnMute.innerHTML = isMuted ? '🔇 Sound Off' : '🔊 Sound On';
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

// Boot application upon DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new TypingGameApp();
  app.init();
});
