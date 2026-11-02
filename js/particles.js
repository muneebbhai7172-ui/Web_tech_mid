/**
 * ===================================================================
 * CANVAS PARTICLE ENGINE (LAVA EMBERS & BURST EFFECTS)
 * ===================================================================
 */

class ParticleEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.embers = [];
    this.sparks = [];
    this.animId = null;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', () => this.resize());

    // Initialize ambient background lava embers
    this.embers = [];
    const emberCount = Math.min(50, Math.floor(window.innerWidth / 30));
    for (let i = 0; i < emberCount; i++) {
      this.embers.push(this.createEmber(true));
    }

    this.startLoop();
  }

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  createEmber(randomY = false) {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : this.height + 10,
      radius: Math.random() * 2.5 + 1,
      speedY: Math.random() * 0.8 + 0.3,
      speedX: (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.7 + 0.2,
      fadeRate: Math.random() * 0.004 + 0.002,
      color: Math.random() > 0.3 ? '#FF2A2A' : '#FFAA00'
    };
  }

  emitBurst(x, y, count = 20, color = '#FF3838') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.04 + 0.02,
        color: color
      });
    }
  }

  startLoop() {
    if (this.animId) cancelAnimationFrame(this.animId);

    const loop = () => {
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  update() {
    // Update ambient embers
    for (let i = 0; i < this.embers.length; i++) {
      const e = this.embers[i];
      e.y -= e.speedY;
      e.x += e.speedX;
      e.alpha -= e.fadeRate;

      if (e.y < -10 || e.alpha <= 0) {
        this.embers[i] = this.createEmber(false);
      }
    }

    // Update burst sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.12; // gravity
      s.alpha -= s.decay;

      if (s.alpha <= 0) {
        this.sparks.splice(i, 1);
      }
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render embers
    for (let i = 0; i < this.embers.length; i++) {
      const e = this.embers[i];
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = e.color;
      this.ctx.globalAlpha = e.alpha;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = e.color;
      this.ctx.fill();
    }

    // Render sparks
    for (let i = 0; i < this.sparks.length; i++) {
      const s = this.sparks[i];
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = s.color;
      this.ctx.globalAlpha = Math.max(0, s.alpha);
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = s.color;
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}

export const particleEngine = new ParticleEngine();

