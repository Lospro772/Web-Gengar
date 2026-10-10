/**
 * Minijuego 4: Flappy Gengar (Huida de la Torre Lavanda) - Versión Ampliada y Accesible
 */
class Game4Flappy {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.score = 0;
    this.targetScore = 10; // 10 puertas cruzadas para escapar
    this.isPlaying = false;
    this.isDead = false;

    // Física suave y equilibrada para un control accesible y cómodo
    this.gengar = {
      x: 110,
      y: 200,
      radius: 22,
      vy: 0,
      gravity: 0.27,    // Gravedad espectral suave y controlable
      jump: -5.2,       // Impulso suave y reactivo
      rotation: 0
    };

    this.pillars = [];
    this.pillarTimer = 0;
    this.pillarGap = 195;    // Hueco amplio y accesible
    this.pillarSpeed = 1.85; // Velocidad reducida (antes 2.75) para mayor disfrute y control
    this.trail = [];         // Estela de partículas espectrales
  }

  start(container, onComplete) {
    this.cleanup();
    this.container = container;
    this.onComplete = onComplete;
    this.score = 0;
    this.isPlaying = false;
    this.isDead = false;
    this.pillars = [];
    this.trail = [];

    this.render();
    this.initCanvas();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper flappy-game flappy-game-large">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">PUERTAS CRUZADAS:</span> <span id="flappy-score" class="hud-val">0</span> / ${this.targetScore}</div>
          <div class="hud-item"><span class="hud-label">CONTROLES:</span> <span class="hud-val">Clic / Barra Espaciadora</span></div>
        </div>
        <p class="game-instruction">Haz que Gengar levite entre las torres espectrales. ¡Cruza ${this.targetScore} puertas para escapar!</p>

        <div class="flappy-canvas-wrap">
          <canvas id="flappy-canvas" width="620" height="420"></canvas>
          <div id="flappy-start-overlay" class="canvas-overlay">
            <div class="overlay-box">
              <span class="overlay-icon">👻</span>
              <p>Haz clic o pulsa Espacio para empezar a volar</p>
              <button class="btn-spectral" id="btn-start-flappy">¡Comenzar Vuelo!</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-start-flappy')?.addEventListener('click', () => {
      this.beginFlight();
    });
  }

  initCanvas() {
    this.canvas = document.getElementById('flappy-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.gengar.y = this.canvas.height / 2;
    this.gengar.vy = 0;

    // Input handlers
    this.handleInput = (e) => {
      if (e.type === 'keydown' && e.code !== 'Space') return;
      if (e.type === 'keydown') e.preventDefault();

      if (!this.isPlaying && !this.isDead) {
        this.beginFlight();
        return;
      }

      if (this.isPlaying && !this.isDead) {
        this.gengar.vy = this.gengar.jump;
        window.spectralAudio.playFlap();
      }
    };

    window.addEventListener('keydown', this.handleInput);
    this.canvas.addEventListener('pointerdown', this.handleInput);

    // Dibujar frame inicial
    this.draw();
  }

  beginFlight() {
    const overlay = document.getElementById('flappy-start-overlay');
    if (overlay) overlay.style.display = 'none';

    this.isPlaying = true;
    this.isDead = false;
    this.score = 0;
    this.pillars = [];
    this.pillarTimer = 55;
    this.trail = [];
    this.gengar.y = this.canvas.height / 2;
    this.gengar.vy = this.gengar.jump;

    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  loop() {
    if (!this.isPlaying) return;

    this.update();
    this.draw();

    if (!this.isDead) {
      this.animId = requestAnimationFrame(this.loop);
    }
  }

  update() {
    // Gravedad y velocidad
    this.gengar.vy += this.gengar.gravity;
    this.gengar.y += this.gengar.vy;

    // Inclinación suave
    this.gengar.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.gengar.vy * 0.07));

    // Estela de sombras
    this.trail.push({ x: this.gengar.x, y: this.gengar.y, alpha: 0.6, radius: 10 });
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].x -= this.pillarSpeed;
      this.trail[i].alpha -= 0.035;
      if (this.trail[i].alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }

    // Colisión con suelo y techo (con margen seguro)
    if (this.gengar.y + this.gengar.radius >= this.canvas.height - 18) {
      this.die();
      return;
    }
    if (this.gengar.y - this.gengar.radius <= 0) {
      this.gengar.y = this.gengar.radius;
      this.gengar.vy = 0;
    }

    // Generar pilares a un ritmo dinámico y equilibrado
    this.pillarTimer++;
    if (this.pillarTimer > 125) {
      this.pillarTimer = 0;
      const minH = 50;
      const maxH = this.canvas.height - this.pillarGap - minH - 25;
      const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;

      this.pillars.push({
        x: this.canvas.width + 30,
        topHeight: topH,
        bottomY: topH + this.pillarGap,
        width: 58,
        passed: false
      });
    }

    // Actualizar pilares
    for (let i = this.pillars.length - 1; i >= 0; i--) {
      const p = this.pillars[i];
      p.x -= this.pillarSpeed;

      // Puerta cruzada con éxito
      if (!p.passed && p.x + p.width < this.gengar.x) {
        p.passed = true;
        this.score++;
        window.spectralAudio.playMatchSuccess();
        const scoreEl = document.getElementById('flappy-score');
        if (scoreEl) scoreEl.textContent = this.score;

        if (this.score >= this.targetScore) {
          this.win();
          return;
        }
      }

      // Colisión perdonable (margen de perdón de 8px para que sea agradable)
      const gx = this.gengar.x;
      const gy = this.gengar.y;
      const gr = this.gengar.radius - 8;

      if (gx + gr > p.x && gx - gr < p.x + p.width) {
        if (gy - gr < p.topHeight || gy + gr > p.bottomY) {
          this.die();
          return;
        }
      }

      // Eliminar pilares que salieron de pantalla
      if (p.x + p.width < -40) {
        this.pillars.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fondo oscuro con gradiente
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#0a0316');
    grad.addColorStop(0.6, '#1a0730');
    grad.addColorStop(1, '#2c0c4a');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Gran luna espectral de fondo
    this.ctx.fillStyle = 'rgba(236, 72, 153, 0.18)';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width - 90, 80, 52, 0, Math.PI * 2);
    this.ctx.fill();

    // Estela de Gengar
    this.trail.forEach(t => {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(168, 85, 247, ${t.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Dibujar pilares (Torres de la Torre Lavanda)
    this.pillars.forEach(p => {
      // Pilar superior
      this.ctx.fillStyle = '#1c0a38';
      this.ctx.strokeStyle = '#a855f7';
      this.ctx.lineWidth = 2.5;

      this.ctx.fillRect(p.x, 0, p.width, p.topHeight);
      this.ctx.strokeRect(p.x, 0, p.width, p.topHeight);

      // Remate del pilar superior
      this.ctx.fillStyle = '#6b21a8';
      this.ctx.fillRect(p.x - 5, p.topHeight - 16, p.width + 10, 16);

      // Pilar inferior
      this.ctx.fillStyle = '#1c0a38';
      this.ctx.fillRect(p.x, p.bottomY, p.width, this.canvas.height - p.bottomY);
      this.ctx.strokeRect(p.x, p.bottomY, p.width, this.canvas.height - p.bottomY);

      // Remate del pilar inferior
      this.ctx.fillStyle = '#6b21a8';
      this.ctx.fillRect(p.x - 5, p.bottomY, p.width + 10, 16);

      // Llama espectral decorativa en el centro de las torres
      this.ctx.fillStyle = '#ec4899';
      this.ctx.shadowColor = '#f43f5e';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(p.x + p.width / 2, p.topHeight - 22, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    // Suelo de piedra mística
    this.ctx.fillStyle = '#0f0520';
    this.ctx.fillRect(0, this.canvas.height - 18, this.canvas.width, 18);
    this.ctx.strokeStyle = '#a855f7';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, this.canvas.height - 18, this.canvas.width, 1);

    // Dibujar a Gengar
    this.drawGengar(this.gengar.x, this.gengar.y, this.gengar.rotation);
  }

  drawGengar(x, y, rotation) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);

    // Resplandor sombrío
    this.ctx.shadowColor = '#a855f7';
    this.ctx.shadowBlur = 16;

    // Cuerpo redondo de Gengar (un poco más grande y nítido)
    this.ctx.fillStyle = '#6b21a8';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
    this.ctx.fill();

    // Orejas puntiagudas
    this.ctx.beginPath();
    this.ctx.moveTo(-16, -14);
    this.ctx.lineTo(-22, -28);
    this.ctx.lineTo(-9, -19);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(16, -14);
    this.ctx.lineTo(22, -28);
    this.ctx.lineTo(9, -19);
    this.ctx.closePath();
    this.ctx.fill();

    // Púas en la espalda
    this.ctx.beginPath();
    this.ctx.moveTo(-8, -20);
    this.ctx.lineTo(0, -29);
    this.ctx.lineTo(8, -20);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.shadowBlur = 0;

    // Ojos rojos rasgados de Gengar
    this.ctx.fillStyle = '#ef4444';
    // Ojo izquierdo
    this.ctx.beginPath();
    this.ctx.moveTo(-13, -6);
    this.ctx.lineTo(-4, -3);
    this.ctx.lineTo(-9, 4);
    this.ctx.closePath();
    this.ctx.fill();
    // Ojo derecho
    this.ctx.beginPath();
    this.ctx.moveTo(13, -6);
    this.ctx.lineTo(4, -3);
    this.ctx.lineTo(9, 4);
    this.ctx.closePath();
    this.ctx.fill();

    // Brillos de las pupilas
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-10, -3, 2.5, 2.5);
    this.ctx.fillRect(7, -3, 2.5, 2.5);

    // Gran sonrisa de dientes afilados
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(0, 6, 13, 0.1, Math.PI - 0.1);
    this.ctx.closePath();
    this.ctx.fill();

    // Líneas de los dientes
    this.ctx.strokeStyle = '#3b0764';
    this.ctx.lineWidth = 1.6;
    this.ctx.stroke();
    for (let d = -8; d <= 8; d += 4) {
      this.ctx.beginPath();
      this.ctx.moveTo(d, 6);
      this.ctx.lineTo(d, 18);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  die() {
    this.isDead = true;
    this.isPlaying = false;
    window.spectralAudio.playError();

    const overlay = document.getElementById('flappy-start-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div class="overlay-box">
          <span class="overlay-icon">💥</span>
          <p>¡Gengar rozó una torre!</p>
          <p>Puntuación: ${this.score} / ${this.targetScore}</p>
          <button class="btn-spectral" id="btn-restart-flappy">Reintentar Vuelo</button>
        </div>
      `;
      document.getElementById('btn-restart-flappy')?.addEventListener('click', () => {
        this.beginFlight();
      });
    }
  }

  win() {
    this.isPlaying = false;
    window.spectralAudio.playVictoryFanfare();
    setTimeout(() => {
      if (this.onComplete) this.onComplete();
    }, 600);
  }

  cleanup() {
    this.isPlaying = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.handleInput);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.handleInput);
    }
  }
}

window.Game4Flappy = Game4Flappy;
