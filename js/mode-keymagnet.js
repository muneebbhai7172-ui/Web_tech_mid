/**
 * ===================================================================
 * MODE B: KEYMAGNET (KEYBOARD PRECISION ENGINE)
 * CSC336 Web Technologies - Lab Mid Project
 * ===================================================================
 */

import { soundEngine } from './audio.js';
import { particleEngine } from './particles.js';

export class KeyMagnetEngine {
  constructor(keyboardContainer, targetBeaconElement) {
    this.container = keyboardContainer;
    this.targetBeacon = targetBeaconElement;
    this.targetCharEl = targetBeaconElement ? targetBeaconElement.querySelector('.target-key-char') : null;
    this.timeoutFillEl = document.querySelector('.target-timeout-fill');

    this.isRunning = false;
    this.isPaused = false;
    this.difficulty = 'easy';
    this.keySet = 'home'; // 'home' | 'top' | 'bottom' | 'numbers' | 'all'

    // Session stats
    this.score = 0;
    this.correctCount = 0;
    this.incorrectCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.responseTimes = []; // in milliseconds
    this.currentKeyStartTime = 0;

    // Timer and countdown
    this.sessionDuration = 60; // 60 seconds per round
    this.timeRemaining = 60;
    this.timerInterval = null;
    this.keyTimeoutId = null;
    this.keyTimeoutDuration = 2500; // ms per key

    // Key sets definition (JavaScript Arrays per assignment requirement)
    this.keySets = {
      home: ['A', 'S', 'D', 'F', 'J', 'K', 'L'],
      top: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      bottom: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
      numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      all: [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
      ]
    };

    this.currentTarget = '';
    this.onGameOver = null;
    this.onHudUpdate = null;
  }

  start(difficulty, keySet, onGameOver, onHudUpdate) {
    this.reset();
    this.difficulty = difficulty || 'easy';
    this.keySet = keySet || 'home';
    this.onGameOver = onGameOver;
    this.onHudUpdate = onHudUpdate;

    // Difficulty config
    if (this.difficulty === 'easy') {
      this.keyTimeoutDuration = 3500;
    } else if (this.difficulty === 'medium') {
      this.keyTimeoutDuration = 2200;
    } else {
      this.keyTimeoutDuration = 1400;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.timeRemaining = this.sessionDuration;

    this.renderKeyboard();
    this.nextTarget();
    this.startSessionTimer();
    this.updateHud();
  }

  reset() {
    this.stopTimers();
    this.isRunning = false;
    this.isPaused = false;
    this.score = 0;
    this.correctCount = 0;
    this.incorrectCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.responseTimes = [];
    this.currentTarget = '';

    if (this.targetCharEl) this.targetCharEl.textContent = '-';
    if (this.timeoutFillEl) this.timeoutFillEl.style.width = '100%';
    this.clearKeyHighlights();
    this.updateHud();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.currentKeyStartTime = performance.now();
    }
  }

  stopTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.keyTimeoutId) {
      clearTimeout(this.keyTimeoutId);
      this.keyTimeoutId = null;
    }
  }

  startSessionTimer() {
    this.timerInterval = setInterval(() => {
      if (!this.isRunning || this.isPaused) return;

      this.timeRemaining--;
      this.updateHud();

      if (this.timeRemaining <= 0) {
        this.endGame('timeout');
      }
    }, 1000);
  }

  nextTarget() {
    if (!this.isRunning) return;

    if (this.keyTimeoutId) {
      clearTimeout(this.keyTimeoutId);
      this.keyTimeoutId = null;
    }

    const set = this.keySets[this.keySet] || this.keySets.home;
    // Pick random key different from current
    let nextKey = set[Math.floor(Math.random() * set.length)];
    if (set.length > 1 && nextKey === this.currentTarget) {
      const filtered = set.filter(k => k !== this.currentTarget);
      nextKey = filtered[Math.floor(Math.random() * filtered.length)];
    }

    this.currentTarget = nextKey;
    if (this.targetCharEl) {
      this.targetCharEl.textContent = this.currentTarget;
    }

    this.highlightTargetKey(this.currentTarget);
    this.currentKeyStartTime = performance.now();

    // Visual timeout animation bar
    if (this.timeoutFillEl) {
      this.timeoutFillEl.style.transition = 'none';
      this.timeoutFillEl.style.width = '100%';
      void this.timeoutFillEl.offsetWidth; // Trigger reflow
      this.timeoutFillEl.style.transition = `width ${this.keyTimeoutDuration}ms linear`;
      this.timeoutFillEl.style.width = '0%';
    }

    // Set timeout for key miss
    this.keyTimeoutId = setTimeout(() => {
      if (this.isRunning && !this.isPaused) {
        this.handleKeyMiss();
      }
    }, this.keyTimeoutDuration);
  }

  handleKeyPress(char) {
    if (!this.isRunning || this.isPaused) return;

    const pressedKey = char.toUpperCase();
    const keycap = this.findKeycap(pressedKey);

    if (pressedKey === this.currentTarget) {
      // Correct precision hit!
      const elapsedMs = Math.round(performance.now() - this.currentKeyStartTime);
      this.responseTimes.push(elapsedMs);
      this.correctCount++;
      this.combo++;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      // Points: base + speed bonus
      const speedBonus = Math.max(0, Math.floor((this.keyTimeoutDuration - elapsedMs) / 15));
      const comboMultiplier = Math.min(4, 1 + Math.floor(this.combo / 5));
      const points = (50 + speedBonus) * comboMultiplier;
      this.score += points;

      soundEngine.playCorrect();
      if (this.combo > 0 && this.combo % 5 === 0) {
        soundEngine.playCombo();
      }

      if (keycap) {
        keycap.classList.add('correct-flash');
        setTimeout(() => keycap.classList.remove('correct-flash'), 180);
      }

      // Spark explosion at target beacon
      if (this.targetBeacon) {
        const rect = this.targetBeacon.getBoundingClientRect();
        particleEngine.emitBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20, '#10B981');
      }

      this.updateHud();
      this.nextTarget();
    } else {
      // Incorrect key pressed
      this.incorrectCount++;
      this.combo = 0;
      this.score = Math.max(0, this.score - 15);

      soundEngine.playError();

      if (keycap) {
        keycap.classList.add('error-flash');
        setTimeout(() => keycap.classList.remove('error-flash'), 220);
      }

      this.triggerScreenShake();
      this.updateHud();
    }
  }

  handleKeyMiss() {
    this.incorrectCount++;
    this.combo = 0;
    this.score = Math.max(0, this.score - 20);

    soundEngine.playError();
    this.triggerScreenShake();
    this.updateHud();
    this.nextTarget();
  }

  triggerScreenShake() {
    const main = document.querySelector('.app-container');
    if (main) {
      main.classList.remove('shake-screen');
      void main.offsetWidth;
      main.classList.add('shake-screen');
      setTimeout(() => main.classList.remove('shake-screen'), 350);
    }
  }

  renderKeyboard() {
    if (!this.container) return;

    // Full cyber mechanical keyboard layout
    const rows = [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    this.container.innerHTML = '';
    rows.forEach(rowKeys => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'keyboard-row';

      rowKeys.forEach(k => {
        const keycap = document.createElement('div');
        keycap.className = 'keycap';
        keycap.dataset.key = k;
        keycap.textContent = k;

        // Interactive touch/click support
        keycap.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          keycap.classList.add('pressed');
          this.handleKeyPress(k);
        });

        keycap.addEventListener('pointerup', () => keycap.classList.remove('pressed'));
        keycap.addEventListener('pointerleave', () => keycap.classList.remove('pressed'));

        rowDiv.appendChild(keycap);
      });

      this.container.appendChild(rowDiv);
    });
  }

  highlightTargetKey(key) {
    this.clearKeyHighlights();
    const keycap = this.findKeycap(key);
    if (keycap) {
      keycap.classList.add('is-target');
    }
  }

  clearKeyHighlights() {
    if (!this.container) return;
    const targets = this.container.querySelectorAll('.keycap.is-target');
    targets.forEach(t => t.classList.remove('is-target'));
  }

  findKeycap(char) {
    if (!this.container) return null;
    return this.container.querySelector(`.keycap[data-key="${char}"]`);
  }

  getAverageResponseTime() {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  updateHud() {
    if (this.onHudUpdate) {
      const total = this.correctCount + this.incorrectCount;
      const accuracy = total > 0 ? Math.round((this.correctCount / total) * 100) : 100;
      const avgReaction = this.getAverageResponseTime();
      const elapsedMinutes = (this.sessionDuration - this.timeRemaining) / 60;
      const kpm = elapsedMinutes > 0 ? Math.round(this.correctCount / elapsedMinutes) : 0;

      this.onHudUpdate({
        score: this.score,
        timeRemaining: this.timeRemaining,
        combo: this.combo,
        accuracy: accuracy,
        avgReaction: avgReaction,
        kpm: kpm,
        correctCount: this.correctCount,
        incorrectCount: this.incorrectCount
      });
    }
  }

  endGame(reason = 'timeout') {
    this.stopTimers();
    this.isRunning = false;
    soundEngine.playGameOver();

    const total = this.correctCount + this.incorrectCount;
    const accuracy = total > 0 ? Math.round((this.correctCount / total) * 100) : 0;
    const avgReaction = this.getAverageResponseTime();

    let grade = 'F';
    if (accuracy >= 95 && avgReaction < 600 && this.score >= 1200) grade = 'S';
    else if (accuracy >= 85 && avgReaction < 900 && this.score >= 800) grade = 'A';
    else if (accuracy >= 70 && this.score >= 500) grade = 'B';
    else if (accuracy >= 55) grade = 'C';

    if (this.onGameOver) {
      this.onGameOver({
        mode: 'keymagnet',
        difficulty: this.difficulty,
        keySet: this.keySet,
        score: this.score,
        grade: grade,
        accuracy: accuracy,
        avgReaction: avgReaction,
        maxCombo: this.maxCombo,
        correct: this.correctCount,
        incorrect: this.incorrectCount,
        reason: reason
      });
    }
  }
}

