/**
 * ===================================================================
 * MODE A: BUBBLES (LETTER RECOGNITION ENGINE)
 * CSC336 Web Technologies - Lab Mid Project
 * ===================================================================
 */

import { soundEngine } from './audio.js';
import { particleEngine } from './particles.js';

export class BubblesEngine {
  constructor(arenaElement) {
    this.arena = arenaElement;
    this.activeBubbles = [];
    this.animFrameId = null;
    this.isRunning = false;
    this.isPaused = false;

    // Game Session Stats
    this.score = 0;
    this.misses = 0;
    this.maxMisses = 6;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctCount = 0;
    this.incorrectCount = 0;
    this.difficulty = 'easy';

    // Difficulty presets
    this.config = {
      easy: { minBubbles: 5, baseSpeed: 0.9, speedVar: 0.5, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
      medium: { minBubbles: 6, baseSpeed: 1.5, speedVar: 0.8, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' },
      hard: { minBubbles: 8, baseSpeed: 2.3, speedVar: 1.1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' }
    };

    this.onGameOver = null;
    this.onHudUpdate = null;
    this.spawnCounter = 0;
  }

  start(difficulty, onGameOver, onHudUpdate) {
    this.reset();
    this.difficulty = difficulty || 'easy';
    this.onGameOver = onGameOver;
    this.onHudUpdate = onHudUpdate;
    this.isRunning = true;
    this.isPaused = false;

    const preset = this.config[this.difficulty];
    for (let i = 0; i < preset.minBubbles; i++) {
      this.spawnBubble(true);
    }

    this.updateHud();
    this.loop();
  }

  reset() {
    this.stopAnimation();
    this.isRunning = false;
    this.isPaused = false;
    this.score = 0;
    this.misses = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctCount = 0;
    this.incorrectCount = 0;

    // Clear all DOM bubbles
    if (this.arena) {
      const existing = this.arena.querySelectorAll('.magma-bubble');
      existing.forEach(b => b.remove());
    }
    this.activeBubbles = [];
    this.updateHud();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
    }
  }

  stopAnimation() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  spawnBubble(staggered = false) {
    const preset = this.config[this.difficulty];
    const letter = preset.pool[Math.floor(Math.random() * preset.pool.length)];

    const arenaWidth = this.arena.clientWidth || 800;
    const arenaHeight = this.arena.clientHeight || 580;
    const padding = 50;

    // Position calculation
    const x = Math.random() * (arenaWidth - padding * 2) + padding;
    const y = staggered 
      ? arenaHeight - (Math.random() * (arenaHeight * 0.7)) 
      : arenaHeight + 30;

    // Dynamic progressive speed scaling with score
    const speedBoost = Math.min(1.5, Math.floor(this.score / 500) * 0.15);
    const speed = preset.baseSpeed + (Math.random() * preset.speedVar) + speedBoost;

    // Create DOM element
    const el = document.createElement('div');
    el.className = 'magma-bubble';
    if (letter === letter.toUpperCase() && letter !== letter.toLowerCase()) {
      el.classList.add('upper');
    }
    el.innerHTML = `<span class="bubble-letter">${letter}</span>`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    // Mobile tap support
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.handleBubbleClick(bubble);
    });

    this.arena.appendChild(el);

    const bubble = { letter, x, y, speed, el, id: Math.random() };
    this.activeBubbles.push(bubble);
    return bubble;
  }

  loop() {
    if (!this.isRunning) return;

    if (!this.isPaused) {
      this.updatePhysics();
    }

    this.animFrameId = requestAnimationFrame(() => this.loop());
  }

  updatePhysics() {
    const ceilingBoundary = 45; // Height of danger zone

    for (let i = this.activeBubbles.length - 1; i >= 0; i--) {
      const b = this.activeBubbles[i];
      b.y -= b.speed;
      b.el.style.top = `${b.y}px`;

      // Miss condition: bubble touches or crosses ceiling boundary
      if (b.y <= ceilingBoundary) {
        this.registerMiss(b, i);
      }
    }

    // Maintain minimum active bubble count
    const preset = this.config[this.difficulty];
    if (this.activeBubbles.length < preset.minBubbles) {
      this.spawnCounter++;
      if (this.spawnCounter % 15 === 0) {
        this.spawnBubble(false);
      }
    }
  }

  handleKeyPress(char) {
    if (!this.isRunning || this.isPaused) return;

    // Check if key matches any visible bubble (bottom-most bubble with matching char takes priority)
    let matchedIndex = -1;
    let highestY = -9999;

    for (let i = 0; i < this.activeBubbles.length; i++) {
      const b = this.activeBubbles[i];
      // Case-insensitive match for easy, exact match for medium/hard
      const matches = this.difficulty === 'easy'
        ? b.letter.toLowerCase() === char.toLowerCase()
        : b.letter === char;

      if (matches && b.y > highestY) {
        matchedIndex = i;
        highestY = b.y;
      }
    }

    if (matchedIndex !== -1) {
      // Correct keypress!
      const matchedBubble = this.activeBubbles[matchedIndex];
      this.popBubble(matchedBubble, matchedIndex);
    } else {
      // Incorrect keypress - apply penalty!
      this.registerIncorrectKey(char);
    }
  }

  handleBubbleClick(bubble) {
    const index = this.activeBubbles.indexOf(bubble);
    if (index !== -1) {
      this.popBubble(bubble, index);
    }
  }

  popBubble(bubble, index) {
    this.activeBubbles.splice(index, 1);
    this.correctCount++;
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    // Score calculation with combo multiplier
    const multiplier = Math.min(5, 1 + Math.floor(this.combo / 5));
    const points = 50 * multiplier;
    this.score += points;

    // Sound and particle effects
    soundEngine.playPop();
    if (this.combo > 0 && this.combo % 5 === 0) {
      soundEngine.playCombo();
    }

    const rect = bubble.el.getBoundingClientRect();
    particleEngine.emitBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 22, '#FF2A2A');
    this.showScorePopup(rect.left + rect.width / 2, rect.top, `+${points}`, 'plus');

    // Visual burst and DOM cleanup
    bubble.el.classList.add('popped');
    setTimeout(() => {
      if (bubble.el.parentNode) bubble.el.parentNode.removeChild(bubble.el);
    }, 250);

    // Spawn a replacement bubble
    setTimeout(() => {
      if (this.isRunning && !this.isPaused) {
        this.spawnBubble(false);
      }
    }, 200);

    this.updateHud();
  }

  registerMiss(bubble, index) {
    this.activeBubbles.splice(index, 1);
    this.misses++;
    this.combo = 0; // Combo reset on miss

    soundEngine.playError();
    this.triggerScreenShake();

    const rect = bubble.el.getBoundingClientRect();
    this.showScorePopup(rect.left + rect.width / 2, rect.top, 'MISS!', 'minus');

    bubble.el.classList.add('missed');
    setTimeout(() => {
      if (bubble.el.parentNode) bubble.el.parentNode.removeChild(bubble.el);
    }, 300);

    this.updateHud();

    // Check game over condition
    if (this.misses >= this.maxMisses) {
      this.endGame('miss_limit');
      return;
    }

    // Spawn replacement bubble
    setTimeout(() => {
      if (this.isRunning && !this.isPaused) {
        this.spawnBubble(false);
      }
    }, 300);
  }

  registerIncorrectKey(char) {
    this.incorrectCount++;
    this.combo = 0; // Combo reset on wrong key

    // Score penalty
    const penalty = 20;
    this.score = Math.max(0, this.score - penalty);

    soundEngine.playError();
    this.triggerScreenShake();

    // Show popup near arena center
    const rect = this.arena.getBoundingClientRect();
    this.showScorePopup(rect.left + rect.width / 2, rect.top + rect.height / 2, `-${penalty}`, 'minus');

    this.updateHud();
  }

  showScorePopup(x, y, text, type) {
    const popup = document.createElement('div');
    popup.className = `score-popup ${type}`;
    popup.textContent = text;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 750);
  }

  triggerScreenShake() {
    const main = document.querySelector('.app-container');
    if (main) {
      main.classList.remove('shake-screen');
      void main.offsetWidth; // Trigger reflow
      main.classList.add('shake-screen');
      setTimeout(() => main.classList.remove('shake-screen'), 350);
    }
  }

  updateHud() {
    if (this.onHudUpdate) {
      const accuracy = this.correctCount + this.incorrectCount > 0
        ? Math.round((this.correctCount / (this.correctCount + this.incorrectCount)) * 100)
        : 100;

      this.onHudUpdate({
        score: this.score,
        misses: this.misses,
        maxMisses: this.maxMisses,
        combo: this.combo,
        accuracy: accuracy,
        correctCount: this.correctCount,
        incorrectCount: this.incorrectCount
      });
    }
  }

  endGame(reason = 'completed') {
    this.stopAnimation();
    this.isRunning = false;
    soundEngine.playGameOver();

    const totalKeypresses = this.correctCount + this.incorrectCount;
    const accuracy = totalKeypresses > 0 
      ? Math.round((this.correctCount / totalKeypresses) * 100) 
      : 0;

    let grade = 'F';
    if (accuracy >= 95 && this.score >= 1200) grade = 'S';
    else if (accuracy >= 85 && this.score >= 800) grade = 'A';
    else if (accuracy >= 70 && this.score >= 500) grade = 'B';
    else if (accuracy >= 55) grade = 'C';

    if (this.onGameOver) {
      this.onGameOver({
        mode: 'bubbles',
        difficulty: this.difficulty,
        score: this.score,
        grade: grade,
        accuracy: accuracy,
        maxCombo: this.maxCombo,
        correct: this.correctCount,
        incorrect: this.incorrectCount,
        misses: this.misses,
        reason: reason
      });
    }
  }
}

