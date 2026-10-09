/**
 * Minijuego 5: El Banquete Come-Sueños (Arcade Glotón de Cumpleaños)
 * Gengar devora tartas, dulces y orbes espectrales esquivando trampas.
 */
class Game5Banquet {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.score = 0;
    this.targetScore = 15;
    this.lives = 3;
    this.isPlaying = false;
    this.isGameOver = false;

    // Gengar jugador
    this.player = {
      x: 310,
      y: 350,
      width: 66,
      height: 60,
      vx: 0,
      speed: 7,
      mouthOpen: 0, // 0 cerrado, 1 totalmente abierto
      isStunned: false,
      stunTimer: 0
    };

    this.items = [];
    this.itemTimer = 0;
    this.floatingTexts = [];
    this.particles = [];
    this.keys = { left: false, right: false };
  }

  start(container, onComplete) {
    this.cleanup();
    this.container = container;
    this.onComplete = onComplete;
    this.score = 0;
    this.lives = 3;
    this.isPlaying = false;
    this.isGameOver = false;
    this.items = [];
    this.particles = [];
    this.floatingTexts = [];

    this.render();
    this.initCanvas();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper banquet-game">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">FESTÍN DEVORADO:</span> 
            <span id="banquet-score" class="hud-val">0</span> / ${this.targetScore}
          </div>
          <div class="hud-item">
            <span class="hud-label">ENERGÍA:</span> 
            <span id="banquet-lives" class="hud-val">💜 💜 💜</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">CONTROLES:</span> 
            <span class="hud-val">Ratón / Teclas A-D / Flechas</span>
          </div>
        </div>
        <p class="game-instruction">Mueve a Gengar para devorar las porciones de tarta y caramelos de cumpleaños. ¡Esquiva las Pokéballs y linternas!</p>

        <div class="flappy-canvas-wrap">
          <canvas id="banquet-canvas" width="620" height="420"></canvas>
          <div id="banquet-start-overlay" class="canvas-overlay">
            <div class="overlay-box">
              <span class="overlay-icon">🍰</span>
              <p>¡El estómago fantasmal de Gengar ruge de hambre!</p>
              <p>Atrapa <strong>${this.targetScore} dulces</strong> para satisfacerlo y romper el sello.</p>
              <button class="btn-spectral" id="btn-start-banquet">¡Comenzar el Banquete!</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-start-banquet')?.addEventListener('click', () => {
      this.beginGame();
    });
  }

  initCanvas() {
    this.canvas = document.getElementById('banquet-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height - 45;

    // Control de ratón / táctil
    this.handlePointerMove = (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : this.player.x);
      const targetX = (clientX - rect.left) * scaleX;
      this.player.x = Math.max(35, Math.min(this.canvas.width - 35, targetX));
    };

    this.handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
    };

    this.handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
    };

    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('touchmove', this.handlePointerMove, { passive: true });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    this.draw();
  }

  beginGame() {
    const overlay = document.getElementById('banquet-start-overlay');
    if (overlay) overlay.style.display = 'none';

    this.isPlaying = true;
    this.isGameOver = false;
    this.score = 0;
    this.lives = 3;
    this.items = [];
    this.floatingTexts = [];
    this.particles = [];
    this.updateHUD();

    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  updateHUD() {
    const scoreEl = document.getElementById('banquet-score');
    const livesEl = document.getElementById('banquet-lives');
    if (scoreEl) scoreEl.textContent = this.score;
    if (livesEl) {
      livesEl.textContent = '💜 '.repeat(Math.max(0, this.lives)).trim() || '💥 SIN ENERGÍA';
    }
  }

  loop() {
    if (!this.isPlaying) return;

    this.update();
    this.draw();

    if (!this.isGameOver) {
      this.animId = requestAnimationFrame(this.loop);
    }
  }

  update() {
    // Teclado
    if (this.keys.left) {
      this.player.x = Math.max(35, this.player.x - this.player.speed);
    }
    if (this.keys.right) {
      this.player.x = Math.min(this.canvas.width - 35, this.player.x + this.player.speed);
    }

    // Estado aturdido
    if (this.player.isStunned) {
      this.player.stunTimer--;
      if (this.player.stunTimer <= 0) {
        this.player.isStunned = false;
      }
    }

    // Generar nuevos objetos
    this.itemTimer++;
    if (this.itemTimer > 42) {
      this.itemTimer = 0;
      this.spawnItem();
    }

    // Detectar si hay comida cercana para abrir la boca de Gengar
    let closestItemDist = 999;
    this.items.forEach(item => {
      if (!item.isTrap) {
        const dx = Math.abs(item.x - this.player.x);
        const dy = this.player.y - item.y;
        if (dx < 45 && dy > 0 && dy < 90) {
          closestItemDist = Math.min(closestItemDist, dy);
        }
      }
    });
    this.player.mouthOpen = closestItemDist < 90 ? (1 - closestItemDist / 90) : 0;

    // Actualizar objetos que caen
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += item.speed;
      item.rotation += item.rotSpeed;

      // Colisión con Gengar
      const dist = Math.hypot(item.x - this.player.x, item.y - (this.player.y - 10));
      if (dist < 42) {
        this.catchItem(item);
        this.items.splice(i, 1);
        continue;
      }

      // Sale por la parte inferior
      if (item.y > this.canvas.height + 25) {
        this.items.splice(i, 1);
      }
    }

    // Partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // Textos flotantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 1.2;
      t.alpha -= 0.025;
      if (t.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  spawnItem() {
    const types = [
      { name: 'cake', emoji: '🎂', points: 1, isTrap: false, speed: 2.8, label: '+1 Tarta' },
      { name: 'candy', emoji: '🍬', points: 2, isTrap: false, speed: 3.2, label: '+2 Caramelo' },
      { name: 'berry', emoji: '🍓', points: 1, isTrap: false, speed: 2.9, label: '+1 Baya' },
      { name: 'dream', emoji: '💤', points: 1, isTrap: false, speed: 2.5, label: '+1 Sueño' },
      { name: 'pokeball', emoji: '🔴', points: -1, isTrap: true, speed: 3.5, label: '¡POKÉBALL! 💥' },
      { name: 'flashlight', emoji: '🔦', points: -1, isTrap: true, speed: 3.3, label: '¡LUZ! ⚡' }
    ];

    // Probabilidad de trampa ~25%
    const isTrap = Math.random() < 0.25;
    const pool = isTrap ? types.filter(t => t.isTrap) : types.filter(t => !t.isTrap);
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    this.items.push({
      ...chosen,
      x: Math.floor(Math.random() * (this.canvas.width - 90)) + 45,
      y: -25,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.08
    });
  }

  catchItem(item) {
    if (item.isTrap) {
      // Trampa comida
      this.lives--;
      this.player.isStunned = true;
      this.player.stunTimer = 35;
      window.spectralAudio?.playTrapHit?.();

      this.addFloatingText(this.player.x, this.player.y - 30, item.label, '#ef4444');
      this.spawnParticles(this.player.x, this.player.y, '#ef4444', 12);
      this.updateHUD();

      if (this.lives <= 0) {
        this.gameOver();
      }
    } else {
      // Dulce comido con éxito
      this.score += item.points;
      window.spectralAudio?.playChomp?.();

      const color = item.points > 1 ? '#fbbf24' : '#ec4899';
      this.addFloatingText(this.player.x, this.player.y - 30, item.label, color);
      this.spawnParticles(this.player.x, this.player.y - 10, color, 10);
      this.updateHUD();

      if (this.score >= this.targetScore) {
        this.win();
      }
    }
  }

  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({ x, y, text, color, alpha: 1.0 });
  }

  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        alpha: 1.0,
        radius: Math.random() * 3 + 2
      });
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fondo nocturno de la cripta de banquetes
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#0c021a');
    grad.addColorStop(0.7, '#1b0633');
    grad.addColorStop(1, '#2c0b4f');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Globos y luces decorativas tenues en el fondo
    this.ctx.fillStyle = 'rgba(236, 72, 153, 0.08)';
    this.ctx.beginPath();
    this.ctx.arc(80, 100, 45, 0, Math.PI * 2);
    this.ctx.arc(520, 130, 60, 0, Math.PI * 2);
    this.ctx.fill();

    // Suelo decorativo de baldosas púrpuras
    this.ctx.fillStyle = '#0a0314';
    this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);
    this.ctx.strokeStyle = '#a855f7';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(0, this.canvas.height - 20, this.canvas.width, 2);

    // Dibujar objetos que caen
    this.items.forEach(item => {
      this.ctx.save();
      this.ctx.translate(item.x, item.y);
      this.ctx.rotate(item.rotation);

      // Resplandor del objeto
      this.ctx.shadowColor = item.isTrap ? '#ef4444' : '#ec4899';
      this.ctx.shadowBlur = 12;

      this.ctx.font = '28px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(item.emoji, 0, 0);

      this.ctx.restore();
    });

    // Partículas
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Dibujar a Gengar glotón
    this.drawGengar(this.player.x, this.player.y, this.player.mouthOpen, this.player.isStunned);

    // Textos flotantes
    this.floatingTexts.forEach(t => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, t.alpha);
      this.ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      this.ctx.fillStyle = t.color;
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#000000';
      this.ctx.shadowBlur = 6;
      this.ctx.fillText(t.text, t.x, t.y);
      this.ctx.restore();
    });
  }

  drawGengar(x, y, mouthOpenRatio, isStunned) {
    this.ctx.save();
    this.ctx.translate(x, y);

    // Aura espectral
    this.ctx.shadowColor = isStunned ? '#ef4444' : '#a855f7';
    this.ctx.shadowBlur = 18;

    // Cuerpo redondo de Gengar
    this.ctx.fillStyle = isStunned ? '#581c87' : '#6b21a8';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 26, 0, Math.PI * 2);
    this.ctx.fill();

    // Orejas puntiagudas
    this.ctx.beginPath();
    this.ctx.moveTo(-18, -16);
    this.ctx.lineTo(-26, -34);
    this.ctx.lineTo(-10, -22);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(18, -16);
    this.ctx.lineTo(26, -34);
    this.ctx.lineTo(10, -22);
    this.ctx.closePath();
    this.ctx.fill();

    // Púas centrales
    this.ctx.beginPath();
    this.ctx.moveTo(-8, -24);
    this.ctx.lineTo(0, -35);
    this.ctx.lineTo(8, -24);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.shadowBlur = 0;

    // Ojos
    if (isStunned) {
      // Ojos en espiral o cruces si está aturdido
      this.ctx.strokeStyle = '#f87171';
      this.ctx.lineWidth = 3;
      [-12, 12].forEach(ox => {
        this.ctx.beginPath();
        this.ctx.moveTo(ox - 5, -8);
        this.ctx.lineTo(ox + 5, 2);
        this.ctx.moveTo(ox + 5, -8);
        this.ctx.lineTo(ox - 5, 2);
        this.ctx.stroke();
      });
    } else {
      // Ojos rojos traviesos de Gengar
      this.ctx.fillStyle = '#ef4444';
      // Ojo izquierdo
      this.ctx.beginPath();
      this.ctx.moveTo(-15, -9);
      this.ctx.lineTo(-4, -5);
      this.ctx.lineTo(-10, 3);
      this.ctx.closePath();
      this.ctx.fill();
      // Ojo derecho
      this.ctx.beginPath();
      this.ctx.moveTo(15, -9);
      this.ctx.lineTo(4, -5);
      this.ctx.lineTo(10, 3);
      this.ctx.closePath();
      this.ctx.fill();

      // Pupilas brillantes
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(-12, -6, 3, 3);
      this.ctx.fillRect(8, -6, 3, 3);
    }

    // Boca: se abre más si la comida está cerca
    const mouthHeight = 8 + (mouthOpenRatio * 16);
    this.ctx.fillStyle = mouthOpenRatio > 0.4 ? '#4c0519' : '#ffffff';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 8, 16, mouthHeight, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (mouthOpenRatio <= 0.4) {
      // Dientes en sonrisa típica
      this.ctx.strokeStyle = '#3b0764';
      this.ctx.lineWidth = 1.6;
      this.ctx.stroke();
      for (let d = -10; d <= 10; d += 5) {
        this.ctx.beginPath();
        this.ctx.moveTo(d, 8 - mouthHeight);
        this.ctx.lineTo(d, 8 + mouthHeight);
        this.ctx.stroke();
      }
    } else {
      // Dientes afilados alrededor de la boca abierta
      this.ctx.fillStyle = '#ffffff';
      [-10, -5, 0, 5, 10].forEach(tx => {
        this.ctx.beginPath();
        this.ctx.moveTo(tx - 2, 8 - mouthHeight + 1);
        this.ctx.lineTo(tx, 8 - mouthHeight + 6);
        this.ctx.lineTo(tx + 2, 8 - mouthHeight + 1);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(tx - 2, 8 + mouthHeight - 1);
        this.ctx.lineTo(tx, 8 + mouthHeight - 6);
        this.ctx.lineTo(tx + 2, 8 + mouthHeight - 1);
        this.ctx.fill();
      });
    }

    this.ctx.restore();
  }

  gameOver() {
    this.isGameOver = true;
    this.isPlaying = false;
    window.spectralAudio?.playError?.();

    const overlay = document.getElementById('banquet-start-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div class="overlay-box">
          <span class="overlay-icon">💥</span>
          <p>¡Gengar cayó en demasiadas trampas!</p>
          <p>Puntuación: ${this.score} / ${this.targetScore} dulces</p>
          <button class="btn-spectral" id="btn-restart-banquet">Reintentar Banquete</button>
        </div>
      `;
      document.getElementById('btn-restart-banquet')?.addEventListener('click', () => {
        this.beginGame();
      });
    }
  }

  win() {
    this.isPlaying = false;
    this.isGameOver = false;
    window.spectralAudio?.playVictoryFanfare?.();
    setTimeout(() => {
      if (this.onComplete) this.onComplete();
    }, 600);
  }

  cleanup() {
    this.isPlaying = false;
    this.isGameOver = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.canvas) {
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('touchmove', this.handlePointerMove);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}

window.Game5Banquet = Game5Banquet;
