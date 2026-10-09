/**
 * Minijuego 6: Ruptura del Sello Sombrío (Boss Final - Puntería de Bola Sombra)
 */
class Game6Boss {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.crystals = [];
    this.shields = [];
    this.projectiles = [];
    this.particles = [];
    this.shatteredCount = 0;
    this.totalCrystals = 5;

    this.aimAngle = -Math.PI / 2;
    this.cannonX = 240;
    this.cannonY = 320;
    this.centerX = 240;
    this.centerY = 150;
    this.orbitRadius = 90;
    this.shieldRadius = 60;
    this.orbitAngle = 0;
    this.shieldAngle = 0;

    this.isWon = false;
  }

  start(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.shatteredCount = 0;
    this.isWon = false;
    this.projectiles = [];
    this.particles = [];

    this.render();
    this.initCanvas();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper boss-game">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">CRISTALES DESTRUIDOS:</span> <span id="boss-score" class="hud-val">0</span> / ${this.totalCrystals}</div>
          <div class="hud-item"><span class="hud-label">OBJETIVO:</span> <span class="hud-val boss-warn">¡Rompe los 5 Sellos!</span></div>
        </div>
        <p class="game-instruction">Apunta con el ratón y haz clic para disparar Bolas Sombra. ¡Esquiva las barreras giratorias y destruye los 5 cristales!</p>

        <div class="boss-canvas-wrap">
          <canvas id="boss-canvas" width="480" height="360"></canvas>
          <div class="boss-controls-bar">
            <button class="btn-spectral btn-shoot" id="btn-shoot-shadowball">🔮 ¡Lanzar Bola Sombra! (Espacio / Clic)</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-shoot-shadowball')?.addEventListener('click', () => {
      this.shoot();
    });
  }

  initCanvas() {
    this.canvas = document.getElementById('boss-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.cannonX = this.canvas.width / 2;
    this.cannonY = this.canvas.height - 28;
    this.centerX = this.canvas.width / 2;
    this.centerY = 140;

    // Inicializar 5 cristales en órbita
    this.crystals = [];
    for (let i = 0; i < this.totalCrystals; i++) {
      this.crystals.push({
        baseAngle: (i * (Math.PI * 2)) / this.totalCrystals,
        alive: true,
        radius: 14,
        shatterProgress: 0
      });
    }

    // Inicializar 2 escudos giratorios que bloquean
    this.shields = [
      { baseAngle: 0, arcLength: 0.9 },
      { baseAngle: Math.PI, arcLength: 0.9 }
    ];

    // Escuchar movimiento de ratón para apuntar
    this.onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      this.aimAngle = Math.atan2(mouseY - this.cannonY, mouseX - this.cannonX);
    };

    this.onCanvasClick = () => this.shoot();

    this.onKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.shoot();
      }
    };

    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('click', this.onCanvasClick);
    window.addEventListener('keydown', this.onKeyDown);

    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  shoot() {
    if (this.isWon) return;
    window.spectralAudio.playShadowBallShoot();

    const speed = 7.5;
    this.projectiles.push({
      x: this.cannonX + Math.cos(this.aimAngle) * 25,
      y: this.cannonY + Math.sin(this.aimAngle) * 25,
      vx: Math.cos(this.aimAngle) * speed,
      vy: Math.sin(this.aimAngle) * speed,
      radius: 9,
      alive: true
    });
  }

  loop() {
    this.update();
    this.draw();

    if (!this.isWon) {
      this.animId = requestAnimationFrame(this.loop);
    }
  }

  update() {
    this.orbitAngle += 0.022; // Giro de cristales
    this.shieldAngle -= 0.028; // Giro inverso de escudos

    // Actualizar proyectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Colisión con límites
      if (p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Colisión con escudos
      const distToCenter = Math.hypot(p.x - this.centerX, p.y - this.centerY);
      if (Math.abs(distToCenter - this.shieldRadius) < 12) {
        const ballAngle = (Math.atan2(p.y - this.centerY, p.x - this.centerX) + Math.PI * 2) % (Math.PI * 2);

        let hitShield = false;
        for (const s of this.shields) {
          const sAngle = (s.baseAngle + this.shieldAngle) % (Math.PI * 2);
          const normSAngle = (sAngle + Math.PI * 2) % (Math.PI * 2);

          let diff = Math.abs(ballAngle - normSAngle);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;

          if (diff < s.arcLength / 2) {
            hitShield = true;
            break;
          }
        }

        if (hitShield) {
          // Rebote / destrucción en escudo
          window.spectralAudio.playTone(320, 'square', 0.08, 0.08);
          this.createSparks(p.x, p.y, '#ec4899', 8);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Colisión con cristales
      for (const c of this.crystals) {
        if (!c.alive) continue;
        const curAngle = c.baseAngle + this.orbitAngle;
        const cx = this.centerX + Math.cos(curAngle) * this.orbitRadius;
        const cy = this.centerY + Math.sin(curAngle) * this.orbitRadius;

        const dist = Math.hypot(p.x - cx, p.y - cy);
        if (dist < p.radius + c.radius) {
          // ¡Cristal impactado y destruido!
          c.alive = false;
          this.shatteredCount++;
          window.spectralAudio.playCrystalShatter();
          this.createSparks(cx, cy, '#a855f7', 22);
          this.projectiles.splice(i, 1);

          const scoreEl = document.getElementById('boss-score');
          if (scoreEl) scoreEl.textContent = this.shatteredCount;

          if (this.shatteredCount >= this.totalCrystals) {
            this.win();
          }
          break;
        }
      }
    }

    // Actualizar chispas / partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.035;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  createSparks(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3.5 + 1.5,
        color,
        life: 1
      });
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fondo oscuro con aura
    this.ctx.fillStyle = '#0a0418';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Núcleo Central: Candado de Gengar
    this.drawCore();

    // Dibujar Escudos Giratorios
    this.drawShields();

    // Dibujar Cristales en Órbita
    this.drawCrystals();

    // Dibujar Proyectiles
    this.drawProjectiles();

    // Dibujar Partículas
    this.drawParticles();

    // Dibujar Cañón / Lanzador
    this.drawCannon();
  }

  drawCore() {
    this.ctx.save();
    // Brillo del núcleo
    const grad = this.ctx.createRadialGradient(this.centerX, this.centerY, 10, this.centerX, this.centerY, 45);
    grad.addColorStop(0, '#7e22ce');
    grad.addColorStop(0.7, '#3b0764');
    grad.addColorStop(1, 'rgba(15, 6, 29, 0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, 45, 0, Math.PI * 2);
    this.ctx.fill();

    // Círculo del candado
    this.ctx.fillStyle = '#2e1065';
    this.ctx.strokeStyle = '#c084fc';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, 30, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Ojos y sonrisa de Gengar en el centro
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillRect(this.centerX - 12, this.centerY - 8, 7, 5);
    this.ctx.fillRect(this.centerX + 5, this.centerY - 8, 7, 5);

    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY + 5, 12, 0, Math.PI);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawShields() {
    this.shields.forEach(s => {
      const angle = s.baseAngle + this.shieldAngle;
      this.ctx.save();
      this.ctx.strokeStyle = '#ec4899';
      this.ctx.lineWidth = 6;
      this.ctx.lineCap = 'round';
      this.ctx.shadowColor = '#f43f5e';
      this.ctx.shadowBlur = 10;

      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, this.shieldRadius, angle - s.arcLength / 2, angle + s.arcLength / 2);
      this.ctx.stroke();
      this.ctx.restore();
    });
  }

  drawCrystals() {
    this.crystals.forEach(c => {
      if (!c.alive) return;
      const angle = c.baseAngle + this.orbitAngle;
      const x = this.centerX + Math.cos(angle) * this.orbitRadius;
      const y = this.centerY + Math.sin(angle) * this.orbitRadius;

      this.ctx.save();
      this.ctx.translate(x, y);

      // Brillo del cristal
      this.ctx.shadowColor = '#c084fc';
      this.ctx.shadowBlur = 12;

      // Forma de rombo/cristal
      this.ctx.fillStyle = '#a855f7';
      this.ctx.strokeStyle = '#f3e8ff';
      this.ctx.lineWidth = 2;

      this.ctx.beginPath();
      this.ctx.moveTo(0, -c.radius);
      this.ctx.lineTo(c.radius, 0);
      this.ctx.lineTo(0, c.radius);
      this.ctx.lineTo(-c.radius, 0);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Runa central
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    });
  }

  drawProjectiles() {
    this.projectiles.forEach(p => {
      this.ctx.save();
      this.ctx.shadowColor = '#d946ef';
      this.ctx.shadowBlur = 15;

      const pGrad = this.ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.radius);
      pGrad.addColorStop(0, '#ffffff');
      pGrad.addColorStop(0.4, '#c026d3');
      pGrad.addColorStop(1, '#581c87');

      this.ctx.fillStyle = pGrad;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawParticles() {
    this.particles.forEach(pt => {
      this.ctx.save();
      this.ctx.globalAlpha = pt.life;
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawCannon() {
    this.ctx.save();
    // Base del cañón
    this.ctx.fillStyle = '#1e1136';
    this.ctx.strokeStyle = '#a855f7';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.cannonX, this.cannonY + 10, 24, Math.PI, 0);
    this.ctx.fill();
    this.ctx.stroke();

    // Tubo / Guía de disparo apuntando
    const length = 26;
    const nx = this.cannonX + Math.cos(this.aimAngle) * length;
    const ny = this.cannonY + Math.sin(this.aimAngle) * length;

    this.ctx.strokeStyle = '#c084fc';
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(this.cannonX, this.cannonY);
    this.ctx.lineTo(nx, ny);
    this.ctx.stroke();

    // Orbe cargado en la punta
    this.ctx.fillStyle = '#ec4899';
    this.ctx.shadowColor = '#f43f5e';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.arc(nx, ny, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  win() {
    this.isWon = true;
    window.spectralAudio.playGrandVaultUnlock();

    // Explosión masiva final
    this.createSparks(this.centerX, this.centerY, '#ffffff', 40);
    this.createSparks(this.centerX, this.centerY, '#a855f7', 40);
    this.draw();

    setTimeout(() => {
      if (this.onComplete) this.onComplete();
    }, 1000);
  }

  cleanup() {
    this.isWon = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.onMouseMove);
      this.canvas.removeEventListener('click', this.onCanvasClick);
    }
    window.removeEventListener('keydown', this.onKeyDown);
  }
}

window.Game6Boss = Game6Boss;
