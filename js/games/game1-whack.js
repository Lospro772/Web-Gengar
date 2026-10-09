/**
 * Minijuego 1: Atrapa a Gengar (Whack-a-Gengar / Reflejos) - Sistema Ultra-Respuesta
 */
class Game1Whack {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.gameTimer = null;
    this.spawnTimer = null;
    this.hideTimer = null;
    
    this.score = 0;
    this.targetScore = 10;
    this.timeLeft = 32;

    // Seguimiento del portal activo
    this.activePortal = -1;
    this.activeType = null; // 'gengar' | 'bomb'
    this.activeCaught = false;

    // Coyote time / Margen de perdón temporal (320ms tras esconderse)
    this.lastActivePortal = -1;
    this.lastActiveType = null;
    this.lastRetractTime = 0;
    this.lastHitTimestamp = 0;
  }

  start(container, onComplete) {
    this.cleanup();
    this.container = container;
    this.onComplete = onComplete;
    this.score = 0;
    this.timeLeft = 32;

    this.activePortal = -1;
    this.activeType = null;
    this.activeCaught = false;
    this.lastActivePortal = -1;
    this.lastActiveType = null;
    this.lastRetractTime = 0;
    this.lastHitTimestamp = 0;

    this.render();
    this.startGameLoop();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper whack-game">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">PUNTOS:</span> <span id="whack-score" class="hud-val">0</span> / ${this.targetScore}</div>
          <div class="hud-item"><span class="hud-label">TIEMPO:</span> <span id="whack-time" class="hud-val time-warn">${this.timeLeft}s</span></div>
        </div>
        <p class="game-instruction">¡Haz clic sobre Gengar cuando asome por los portales! (¡Evita las bombas de humo!)</p>
        
        <div class="whack-grid" id="whack-grid">
          ${Array(9).fill(0).map((_, i) => `
            <div class="portal-hole" data-idx="${i}" id="portal-hole-${i}">
              <div class="portal-ring"></div>
              <div class="portal-creature" id="portal-creature-${i}"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Vincular tanto pointerdown como click para compatibilidad con todos los navegadores y dispositivos
    const holes = this.container.querySelectorAll('.portal-hole');
    holes.forEach(hole => {
      const idx = parseInt(hole.dataset.idx, 10);

      const triggerHit = (e) => {
        // Evitar doble disparo rápido entre pointerdown y click
        const now = Date.now();
        if (now - this.lastHitTimestamp < 60) return;
        this.lastHitTimestamp = now;

        this.handleHit(idx, hole);
      };

      hole.addEventListener('pointerdown', triggerHit);
      hole.addEventListener('click', triggerHit);
    });
  }

  startGameLoop() {
    // Reloj principal
    this.gameTimer = setInterval(() => {
      this.timeLeft--;
      const timeEl = document.getElementById('whack-time');
      if (timeEl) timeEl.textContent = `${this.timeLeft}s`;

      if (this.timeLeft <= 0) {
        this.gameOver(false);
      }
    }, 1000);

    // Primer Gengar tras 400ms
    this.spawnTimer = setTimeout(() => {
      this.spawnNext();
    }, 400);
  }

  spawnNext() {
    if (this.timeLeft <= 0) return;

    // Escoger un portal aleatorio distinto al anterior si es posible
    let nextIdx = Math.floor(Math.random() * 9);
    if (nextIdx === this.activePortal) {
      nextIdx = (nextIdx + Math.floor(Math.random() * 8) + 1) % 9;
    }

    this.activePortal = nextIdx;
    this.activeCaught = false;

    // Probabilidad de bomba: 20% si ya tiene 3 o más puntos
    const isBomb = Math.random() < 0.20 && this.score >= 3;
    this.activeType = isBomb ? 'bomb' : 'gengar';

    const creatureEl = document.getElementById(`portal-creature-${nextIdx}`);
    if (!creatureEl) return;

    if (isBomb) {
      creatureEl.className = 'portal-creature creature-bomb show';
      creatureEl.innerHTML = `<span class="bomb-icon">💣</span><span class="bomb-smoke"></span>`;
    } else {
      creatureEl.className = 'portal-creature creature-gengar show';
      creatureEl.innerHTML = `
        <div class="mini-gengar">
          <div class="g-ears"></div>
          <div class="g-face">
            <div class="g-eyes"><span></span><span></span></div>
            <div class="g-smile"></div>
          </div>
        </div>
      `;
    }

    // Tiempo visible: cómodo y generoso (1400ms al inicio, bajando a 950ms con puntos altos)
    const stayDuration = Math.max(950, 1400 - this.score * 40);

    this.hideTimer = setTimeout(() => {
      this.retractCreature(nextIdx);
    }, stayDuration);
  }

  retractCreature(idx) {
    const creatureEl = document.getElementById(`portal-creature-${idx}`);
    if (!creatureEl) return;

    // Guardar información para "Coyote Time" (si el usuario clica justo cuando empieza a bajar)
    this.lastActivePortal = idx;
    this.lastActiveType = this.activeType;
    this.lastRetractTime = Date.now();

    creatureEl.classList.remove('show');

    // Limpieza tras la animación de descenso
    setTimeout(() => {
      if (!this.activeCaught && this.activePortal === idx) {
        this.activePortal = -1;
        this.activeType = null;
      }
      creatureEl.innerHTML = '';
      creatureEl.className = 'portal-creature';

      // Siguiente aparición tras breve pausa
      if (this.timeLeft > 0 && !this.activeCaught) {
        const nextPause = Math.max(250, 420 - this.score * 15);
        this.spawnTimer = setTimeout(() => this.spawnNext(), nextPause);
      }
    }, 200);
  }

  handleHit(idx, holeEl) {
    if (this.activeCaught) return;

    const isCurrent = (idx === this.activePortal);
    // Margen de perdón de 300ms tras esconderse
    const isJustRetracted = (idx === this.lastActivePortal && (Date.now() - this.lastRetractTime < 300));

    if (!isCurrent && !isJustRetracted) {
      // Clic en agujero vacío
      return;
    }

    const hitType = isCurrent ? this.activeType : this.lastActiveType;
    const targetPortal = isCurrent ? this.activePortal : this.lastActivePortal;

    this.activeCaught = true;
    clearTimeout(this.hideTimer);

    const creatureEl = document.getElementById(`portal-creature-${targetPortal}`);

    if (hitType === 'bomb') {
      // Bomba golpeada
      window.spectralAudio.playError();
      this.score = Math.max(0, this.score - 2);
      this.showPopText(holeEl, "-2 PUNTOS", "#ef4444");

      if (creatureEl) {
        creatureEl.className = 'portal-creature hit-bomb';
      }
    } else {
      // Gengar capturado
      window.spectralAudio.playBlip();
      this.score++;
      this.showPopText(holeEl, "+1 ¡ATRAPADO!", "#c084fc");

      if (creatureEl) {
        creatureEl.classList.add('hit');
      }
    }

    // Actualizar marcador
    const scoreEl = document.getElementById('whack-score');
    if (scoreEl) scoreEl.textContent = this.score;

    // Victoria
    if (this.score >= this.targetScore) {
      setTimeout(() => this.gameOver(true), 300);
      return;
    }

    // Desvanecer criatura golpeada y programar la siguiente
    setTimeout(() => {
      if (creatureEl) {
        creatureEl.className = 'portal-creature';
        creatureEl.innerHTML = '';
      }
      this.activePortal = -1;
      this.activeType = null;
      this.lastActivePortal = -1;

      if (this.timeLeft > 0) {
        this.spawnTimer = setTimeout(() => this.spawnNext(), 280);
      }
    }, 220);
  }

  showPopText(parent, text, color) {
    const pop = document.createElement('div');
    pop.className = 'pop-feedback';
    pop.textContent = text;
    pop.style.color = color;
    parent.appendChild(pop);
    setTimeout(() => pop.remove(), 750);
  }

  gameOver(won) {
    this.cleanup();
    if (won) {
      window.spectralAudio.playVictoryFanfare();
      if (this.onComplete) this.onComplete();
    } else {
      window.spectralAudio.playError();
      this.container.innerHTML += `
        <div class="game-overlay-fail">
          <h3>¡Tiempo agotado!</h3>
          <p>Gengar se desvaneció en las sombras entre risitas...</p>
          <button class="btn-spectral" id="retry-whack-btn">Intentar de nuevo</button>
        </div>
      `;
      document.getElementById('retry-whack-btn')?.addEventListener('click', () => {
        this.start(this.container, this.onComplete);
      });
    }
  }

  cleanup() {
    clearInterval(this.gameTimer);
    clearTimeout(this.spawnTimer);
    clearTimeout(this.hideTimer);

    for (let i = 0; i < 9; i++) {
      const el = document.getElementById(`portal-creature-${i}`);
      if (el) {
        el.className = 'portal-creature';
        el.innerHTML = '';
      }
    }
    this.activePortal = -1;
    this.activeType = null;
    this.activeCaught = false;
    this.lastActivePortal = -1;
    this.lastRetractTime = 0;
  }
}

window.Game1Whack = Game1Whack;
