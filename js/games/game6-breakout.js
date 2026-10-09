/**
 * Minijuego 6: Rebote Espectral: Rompe-Lápidas (Ghost Arkanoid / Brick Breaker)
 * Haz rebotar la Bola Sombra para quebrar el muro de lápidas y runas mágicas.
 */
class Game6Breakout {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.score = 0;
    this.targetBricksBroken = 18; // Con 18 lápidas rotas se disuelve el sello
    this.brokenCount = 0;
    this.lives = 3;
    this.isPlaying = false;
    this.isGameOver = false;

    // Paleta (lengua ectoplásmica)
    this.paddle = {
      x: 250,
      y: 380,
      width: 105,
      height: 14,
      speed: 8,
      isEnlarged: false,
      enlargeTimer: 0
    };

    // Bolas en juego (soporta multiball)
    this.balls = [];

    // Ladrillos
    this.bricks = [];
    this.rows = 4;
    this.cols = 8;
    this.brickWidth = 66;
    this.brickHeight = 22;
    this.brickPadding = 8;
    this.brickOffsetTop = 50;
    this.brickOffsetLeft = 20;

    // Power-ups y partículas
    this.powerups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.keys = { left: false, right: false };
  }

  start(container, onComplete) {
    this.cleanup();
    this.container = container;
    this.onComplete = onComplete;
    this.score = 0;
    this.brokenCount = 0;
    this.lives = 3;
    this.isPlaying = false;
    this.isGameOver = false;
    this.balls = [];
    this.powerups = [];
    this.particles = [];
    this.floatingTexts = [];

    this.render();
    this.initCanvas();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper breakout-game">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">LÁPIDAS QUEBRADAS:</span> 
            <span id="breakout-score" class="hud-val">0</span> / ${this.targetBricksBroken}
          </div>
          <div class="hud-item">
            <span class="hud-label">BOLAS DE SOMBRA:</span> 
            <span id="breakout-lives" class="hud-val">🔮 🔮 🔮</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">CONTROLES:</span> 
            <span class="hud-val">Ratón / Teclas A-D / Espacio</span>
          </div>
        </div>
        <p class="game-instruction">Mueve la barra espectral para rebotar la Bola Sombra contra las lápidas. ¡Atrapa los regalos para activar mejoras!</p>

        <div class="flappy-canvas-wrap">
          <canvas id="breakout-canvas" width="620" height="420"></canvas>
          <div id="breakout-start-overlay" class="canvas-overlay">
            <div class="overlay-box">
              <span class="overlay-icon">🧱</span>
              <p>Un muro de lápidas encantadas bloquea la cripta.</p>
              <p>Quiebra al menos <strong>${this.targetBricksBroken} bloques</strong> con tu Bola Sombra para abrir camino.</p>
              <button class="btn-spectral" id="btn-start-breakout">¡Lanzar Bola Sombra!</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-start-breakout')?.addEventListener('click', () => {
      this.beginGame();
    });
  }

  initCanvas() {
    this.canvas = document.getElementById('breakout-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
    this.paddle.y = this.canvas.height - 35;

    this.initBricks();
    this.resetBall();

    // Controles
    this.handlePointerMove = (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : this.paddle.x);
      const targetX = (clientX - rect.left) * scaleX - (this.paddle.width / 2);
      this.paddle.x = Math.max(10, Math.min(this.canvas.width - this.paddle.width - 10, targetX));
    };

    this.handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.code === 'Space' && !this.isPlaying && !this.isGameOver) {
        this.beginGame();
      }
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

  initBricks() {
    this.bricks = [];
    const colors = [
      { fill: '#c084fc', border: '#e879f9', name: 'Runa', hp: 1, type: 'rune' },
      { fill: '#7e22ce', border: '#a855f7', name: 'Lápida', hp: 1, type: 'tomb' },
      { fill: '#ec4899', border: '#f43f5e', name: 'Cristal', hp: 1, type: 'crystal' },
      { fill: '#06b6d4', border: '#22d3ee', name: 'Regalo', hp: 1, type: 'gift', hasPowerup: true }
    ];

    for (let c = 0; c < this.cols; c++) {
      this.bricks[c] = [];
      for (let r = 0; r < this.rows; r++) {
        const rowData = colors[r % colors.length];
        const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
        const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;

        this.bricks[c][r] = {
          x: brickX,
          y: brickY,
          status: 1,
          color: rowData.fill,
          border: rowData.border,
          type: rowData.type,
          hasPowerup: rowData.hasPowerup || (Math.random() < 0.2)
        };
      }
    }
  }

  resetBall() {
    this.balls = [{
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y - 12,
      vx: (Math.random() > 0.5 ? 1 : -1) * 3.5,
      vy: -4.2,
      radius: 8,
      isFire: false,
      fireTimer: 0,
      trail: []
    }];
  }

  beginGame() {
    const overlay = document.getElementById('breakout-start-overlay');
    if (overlay) overlay.style.display = 'none';

    this.isPlaying = true;
    this.isGameOver = false;
    this.brokenCount = 0;
    this.lives = 3;
    this.powerups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.initBricks();
    this.resetBall();
    this.updateHUD();

    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  updateHUD() {
    const scoreEl = document.getElementById('breakout-score');
    const livesEl = document.getElementById('breakout-lives');
    if (scoreEl) scoreEl.textContent = this.brokenCount;
    if (livesEl) {
      livesEl.textContent = '🔮 '.repeat(Math.max(0, this.lives)).trim() || '💥 SIN BOLAS';
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
    // Control por teclado
    if (this.keys.left) {
      this.paddle.x = Math.max(10, this.paddle.x - this.paddle.speed);
    }
    if (this.keys.right) {
      this.paddle.x = Math.min(this.canvas.width - this.paddle.width - 10, this.paddle.x + this.paddle.speed);
    }

    // Efecto de pala agrandada (lengua extendida)
    if (this.paddle.isEnlarged) {
      this.paddle.enlargeTimer--;
      if (this.paddle.enlargeTimer <= 0) {
        this.paddle.isEnlarged = false;
        this.paddle.width = 105;
      }
    }

    // Actualizar cada bola
    for (let bi = this.balls.length - 1; bi >= 0; bi--) {
      const b = this.balls[bi];

      // Trail
      b.trail.push({ x: b.x, y: b.y, alpha: 0.7 });
      if (b.trail.length > 8) b.trail.shift();

      b.x += b.vx;
      b.y += b.vy;

      // Temporizador de bola de fuego
      if (b.isFire) {
        b.fireTimer--;
        if (b.fireTimer <= 0) b.isFire = false;
      }

      // Rebote en paredes laterales
      if (b.x + b.radius > this.canvas.width - 10) {
        b.x = this.canvas.width - 10 - b.radius;
        b.vx = -Math.abs(b.vx);
        window.spectralAudio?.playPaddleBounce?.();
      } else if (b.x - b.radius < 10) {
        b.x = 10 + b.radius;
        b.vx = Math.abs(b.vx);
        window.spectralAudio?.playPaddleBounce?.();
      }

      // Rebote en techo
      if (b.y - b.radius < 10) {
        b.y = 10 + b.radius;
        b.vy = Math.abs(b.vy);
        window.spectralAudio?.playPaddleBounce?.();
      }

      // Rebote en la pala
      if (
        b.y + b.radius >= this.paddle.y &&
        b.y - b.radius <= this.paddle.y + this.paddle.height &&
        b.x >= this.paddle.x - 4 &&
        b.x <= this.paddle.x + this.paddle.width + 4 &&
        b.vy > 0
      ) {
        b.vy = -Math.abs(b.vy);

        // Cambiar ángulo según el punto de impacto en la pala
        const hitOffset = (b.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
        b.vx = hitOffset * 5.2;

        window.spectralAudio?.playPaddleBounce?.();
        this.spawnParticles(b.x, this.paddle.y, '#a855f7', 6);
      }

      // Colisión con ladrillos
      this.checkBrickCollisions(b);

      // Bola cae por abajo
      if (b.y - b.radius > this.canvas.height) {
        this.balls.splice(bi, 1);
      }
    }

    // Si se perdieron todas las bolas
    if (this.balls.length === 0) {
      this.lives--;
      this.updateHUD();
      window.spectralAudio?.playError?.();

      if (this.lives <= 0) {
        this.gameOver();
        return;
      } else {
        this.resetBall();
      }
    }

    // Actualizar power-ups cayendo
    for (let pi = this.powerups.length - 1; pi >= 0; pi--) {
      const p = this.powerups[pi];
      p.y += p.speed;

      // Colisión con la pala
      if (
        p.y + 12 >= this.paddle.y &&
        p.y - 12 <= this.paddle.y + this.paddle.height &&
        p.x >= this.paddle.x &&
        p.x <= this.paddle.x + this.paddle.width
      ) {
        this.applyPowerup(p.type);
        this.powerups.splice(pi, 1);
        continue;
      }

      if (p.y > this.canvas.height + 20) {
        this.powerups.splice(pi, 1);
      }
    }

    // Partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // Textos flotantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 1.1;
      t.alpha -= 0.025;
      if (t.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  checkBrickCollisions(ball) {
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const b = this.bricks[c][r];
        if (b.status === 1) {
          if (
            ball.x + ball.radius > b.x &&
            ball.x - ball.radius < b.x + this.brickWidth &&
            ball.y + ball.radius > b.y &&
            ball.y - ball.radius < b.y + this.brickHeight
          ) {
            // Golpe a ladrillo
            if (!ball.isFire) {
              ball.vy = -ball.vy;
            }

            b.status = 0;
            this.brokenCount++;
            window.spectralAudio?.playBrickBreak?.();
            this.spawnParticles(b.x + this.brickWidth / 2, b.y + this.brickHeight / 2, b.border, 12);
            this.updateHUD();

            // Soltar power-up si tiene
            if (b.hasPowerup) {
              this.spawnPowerup(b.x + this.brickWidth / 2, b.y + this.brickHeight / 2);
            }

            // Victoria si superó el objetivo
            if (this.brokenCount >= this.targetBricksBroken) {
              this.win();
              return;
            }
          }
        }
      }
    }
  }

  spawnPowerup(x, y) {
    const types = [
      { type: 'tongue', icon: '👅', label: '¡Super Lengua!' },
      { type: 'multiball', icon: '🔮', label: '¡Sombra Triple!' },
      { type: 'fire', icon: '🔥', label: '¡Fuego Fatuo!' }
    ];
    const chosen = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      x,
      y,
      speed: 2.2,
      ...chosen
    });
  }

  applyPowerup(type) {
    window.spectralAudio?.playPowerup?.();

    if (type === 'tongue') {
      this.paddle.isEnlarged = true;
      this.paddle.width = 145;
      this.paddle.enlargeTimer = 480; // ~8 segundos
      this.addFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 20, '👅 ¡Lengua Gigante!', '#ec4899');
    } else if (type === 'multiball') {
      const base = this.balls[0] || { x: this.paddle.x + 50, y: this.paddle.y - 15, vx: 3, vy: -4, radius: 8 };
      this.balls.push(
        { x: base.x, y: base.y, vx: -3.8, vy: -3.8, radius: 8, isFire: false, fireTimer: 0, trail: [] },
        { x: base.x, y: base.y, vx: 3.8, vy: -4.2, radius: 8, isFire: false, fireTimer: 0, trail: [] }
      );
      this.addFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 20, '🔮 ¡Triple Bola Sombra!', '#a855f7');
    } else if (type === 'fire') {
      this.balls.forEach(b => {
        b.isFire = true;
        b.fireTimer = 360; // ~6 segundos
      });
      this.addFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 20, '🔥 ¡Fuego Fatuo Perforante!', '#f59e0b');
    }
  }

  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({ x, y, text, color, alpha: 1.0 });
  }

  spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 3.5 + 1;
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

    // Fondo espectral
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#090314');
    grad.addColorStop(0.6, '#18072e');
    grad.addColorStop(1, '#250a44');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Borde de la arena
    this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(8, 8, this.canvas.width - 16, this.canvas.height - 16);

    // Dibujar ladrillos
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const b = this.bricks[c][r];
        if (b.status === 1) {
          this.ctx.save();
          this.ctx.fillStyle = b.color;
          this.ctx.strokeStyle = b.border;
          this.ctx.lineWidth = 2;

          this.ctx.shadowColor = b.border;
          this.ctx.shadowBlur = 8;

          // Dibujar ladrillo redondeado
          if (this.ctx.roundRect) {
            this.ctx.beginPath();
            this.ctx.roundRect(b.x, b.y, this.brickWidth, this.brickHeight, 6);
            this.ctx.fill();
            this.ctx.stroke();
          } else {
            this.ctx.fillRect(b.x, b.y, this.brickWidth, this.brickHeight);
            this.ctx.strokeRect(b.x, b.y, this.brickWidth, this.brickHeight);
          }

          // Icono especial si es de regalo
          if (b.hasPowerup) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🎁', b.x + this.brickWidth / 2, b.y + this.brickHeight / 2);
          }

          this.ctx.restore();
        }
      }
    }

    // Dibujar power-ups cayendo
    this.powerups.forEach(p => {
      this.ctx.save();
      this.ctx.font = '22px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = '#ec4899';
      this.ctx.shadowBlur = 10;
      this.ctx.fillText(p.icon, p.x, p.y);
      this.ctx.restore();
    });

    // Dibujar estela y bolas de sombra
    this.balls.forEach(b => {
      // Estela
      b.trail.forEach(t => {
        this.ctx.save();
        this.ctx.fillStyle = b.isFire ? 'rgba(249, 115, 22, 0.4)' : 'rgba(168, 85, 247, 0.35)';
        this.ctx.beginPath();
        this.ctx.arc(t.x, t.y, b.radius * 0.75, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });

      // Bola
      this.ctx.save();
      this.ctx.shadowColor = b.isFire ? '#f97316' : '#c084fc';
      this.ctx.shadowBlur = 16;
      this.ctx.fillStyle = b.isFire ? '#ea580c' : '#7e22ce';
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Centro brillante
      this.ctx.fillStyle = b.isFire ? '#fed7aa' : '#f3e8ff';
      this.ctx.beginPath();
      this.ctx.arc(b.x - 2, b.y - 2, b.radius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Dibujar pala de Gengar (lengua / plataforma ectoplásmica)
    this.ctx.save();
    this.ctx.shadowColor = this.paddle.isEnlarged ? '#ec4899' : '#a855f7';
    this.ctx.shadowBlur = 16;

    // Cuerpo de la pala
    const paddleGrad = this.ctx.createLinearGradient(this.paddle.x, 0, this.paddle.x + this.paddle.width, 0);
    paddleGrad.addColorStop(0, '#581c87');
    paddleGrad.addColorStop(0.5, this.paddle.isEnlarged ? '#db2777' : '#9333ea');
    paddleGrad.addColorStop(1, '#581c87');
    this.ctx.fillStyle = paddleGrad;

    if (this.ctx.roundRect) {
      this.ctx.beginPath();
      this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 8);
      this.ctx.fill();
      this.ctx.strokeStyle = this.paddle.isEnlarged ? '#f472b6' : '#c084fc';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    } else {
      this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    }
    this.ctx.restore();

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

  gameOver() {
    this.isGameOver = true;
    this.isPlaying = false;
    window.spectralAudio?.playError?.();

    const overlay = document.getElementById('breakout-start-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div class="overlay-box">
          <span class="overlay-icon">💥</span>
          <p>¡Se disiparon todas las Bolas Sombra!</p>
          <p>Lápidas quebradas: ${this.brokenCount} / ${this.targetBricksBroken}</p>
          <button class="btn-spectral" id="btn-restart-breakout">Reintentar Reto</button>
        </div>
      `;
      document.getElementById('btn-restart-breakout')?.addEventListener('click', () => {
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

window.Game6Breakout = Game6Breakout;
