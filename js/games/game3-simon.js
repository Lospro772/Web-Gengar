/**
 * Minijuego 3: Hipnosis de Ritmo (Simón Dice con Ataques de Gengar)
 */
class Game3Simon {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.sequence = [];
    this.playerStep = 0;
    this.round = 1;
    this.targetRounds = 4;
    this.isShowingSequence = false;

    this.runes = [
      { name: "Bola Sombra", color: "#a855f7", icon: "🟣", class: "rune-purple" },
      { name: "Lengüetazo", color: "#ec4899", icon: "👅", class: "rune-pink" },
      { name: "Rayo Confuso", color: "#f59e0b", icon: "✨", class: "rune-amber" },
      { name: "Tinieblas", color: "#06b6d4", icon: "🌌", class: "rune-cyan" },
    ];
  }

  start(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.sequence = [];
    this.round = 1;
    this.playerStep = 0;
    this.isShowingSequence = false;

    this.render();
    setTimeout(() => this.nextRound(), 600);
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper simon-game">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">RONDA:</span> <span id="simon-round" class="hud-val">${this.round}</span> / ${this.targetRounds}</div>
          <div class="hud-item"><span id="simon-status" class="hud-val status-text">Gengar está preparando la hipnosis...</span></div>
        </div>
        <p class="game-instruction">Memoriza la secuencia de ataques que Gengar ilumina y repítela en el mismo orden.</p>

        <div class="simon-circle-board">
          <div class="simon-center-logo">
            <span class="simon-center-icon">👁️</span>
            <span class="simon-center-text">HIPNOSIS</span>
          </div>
          <div class="simon-pad-grid">
            ${this.runes.map((rune, idx) => `
              <button class="simon-pad ${rune.class}" id="simon-pad-${idx}" data-idx="${idx}">
                <span class="pad-icon">${rune.icon}</span>
                <span class="pad-label">${rune.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Listeners para los pads
    const pads = this.container.querySelectorAll('.simon-pad');
    pads.forEach(pad => {
      pad.addEventListener('click', () => {
        const idx = parseInt(pad.dataset.idx, 10);
        this.handlePlayerClick(idx);
      });
    });
  }

  nextRound() {
    this.playerStep = 0;
    const roundEl = document.getElementById('simon-round');
    if (roundEl) roundEl.textContent = this.round;

    // Añadir un nuevo movimiento a la secuencia
    this.sequence.push(Math.floor(Math.random() * 4));

    // Si es la ronda 1, añadimos 2 iniciales para que empiece con 3
    if (this.round === 1 && this.sequence.length === 1) {
      this.sequence.push(Math.floor(Math.random() * 4));
      this.sequence.push(Math.floor(Math.random() * 4));
    }

    this.playSequence();
  }

  playSequence() {
    this.isShowingSequence = true;
    const statusEl = document.getElementById('simon-status');
    if (statusEl) {
      statusEl.textContent = "👁️ Observa a Gengar...";
      statusEl.className = "hud-val status-text wait";
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i >= this.sequence.length) {
        clearInterval(interval);
        this.isShowingSequence = false;
        if (statusEl) {
          statusEl.textContent = "👉 ¡Tu turno! Repite la secuencia";
          statusEl.className = "hud-val status-text go";
        }
        return;
      }

      this.flashPad(this.sequence[i]);
      i++;
    }, 650);
  }

  flashPad(idx) {
    const pad = document.getElementById(`simon-pad-${idx}`);
    if (!pad) return;

    window.spectralAudio.playSimonTone(idx);
    pad.classList.add('active-flash');
    setTimeout(() => {
      pad.classList.remove('active-flash');
    }, 380);
  }

  handlePlayerClick(idx) {
    if (this.isShowingSequence) return;

    this.flashPad(idx);

    if (idx === this.sequence[this.playerStep]) {
      // Paso correcto
      this.playerStep++;

      if (this.playerStep >= this.sequence.length) {
        // Ronda completada con éxito
        if (this.round >= this.targetRounds) {
          window.spectralAudio.playVictoryFanfare();
          setTimeout(() => {
            if (this.onComplete) this.onComplete();
          }, 500);
        } else {
          this.round++;
          window.spectralAudio.playMatchSuccess();
          const statusEl = document.getElementById('simon-status');
          if (statusEl) statusEl.textContent = "¡Bien hecho! Siguiente ronda...";
          setTimeout(() => this.nextRound(), 900);
        }
      }
    } else {
      // Error
      window.spectralAudio.playError();
      const statusEl = document.getElementById('simon-status');
      if (statusEl) {
        statusEl.textContent = "¡Hipnosis fallida! Vuelve a intentar esta ronda...";
        statusEl.className = "hud-val status-text error";
      }

      // Reiniciar paso actual y repetir la misma secuencia
      this.playerStep = 0;
      setTimeout(() => this.playSequence(), 1100);
    }
  }

  cleanup() {
    this.isShowingSequence = false;
  }
}

window.Game3Simon = Game3Simon;
