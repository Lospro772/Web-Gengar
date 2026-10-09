/**
 * Minijuego 2: Memoria del Más Allá (Parejas 3D de Fantasmas)
 */
class Game2Memory {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.lockBoard = false;

    this.cardTypes = [
      { id: 'gastly', name: 'Gastly', icon: '🔮', desc: 'Gas Tóxico' },
      { id: 'haunter', name: 'Haunter', icon: '👻', desc: 'Manos Fantasma' },
      { id: 'gengar', name: 'Gengar', icon: '😈', desc: 'Sombra Traviesa' },
      { id: 'mega', name: 'Mega-Gengar', icon: '👁️', desc: 'Tercer Ojo' },
      { id: 'gigantamax', name: 'G-Max Gengar', icon: '🌋', desc: 'Boca Gigante' },
      { id: 'shadowball', name: 'Bola Sombra', icon: '🟣', desc: 'Ataque Letal' }
    ];
  }

  start(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.matchedPairs = 0;
    this.moves = 0;
    this.flippedCards = [];
    this.lockBoard = false;

    // Duplicar y barajar
    const deck = [...this.cardTypes, ...this.cardTypes]
      .sort(() => Math.random() - 0.5)
      .map((item, index) => ({ ...item, uniqueId: index }));

    this.cards = deck;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper memory-game">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">PAREJAS:</span> <span id="mem-pairs" class="hud-val">0</span> / 6</div>
          <div class="hud-item"><span class="hud-label">MOVIMIENTOS:</span> <span id="mem-moves" class="hud-val">0</span></div>
        </div>
        <p class="game-instruction">Encuentra las 6 parejas espectrales para disipar la niebla del Mundo Distorsión.</p>

        <div class="memory-grid">
          ${this.cards.map(card => `
            <div class="memory-card" data-id="${card.id}" data-uid="${card.uniqueId}">
              <div class="card-inner">
                <div class="card-front">
                  <div class="card-icon">${card.icon}</div>
                  <div class="card-name">${card.name}</div>
                  <div class="card-sub">${card.desc}</div>
                </div>
                <div class="card-back">
                  <div class="card-back-rune">⚡</div>
                  <div class="card-back-text">GENGAR</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Asignar listeners
    const cardEls = this.container.querySelectorAll('.memory-card');
    cardEls.forEach(card => {
      card.addEventListener('click', () => this.handleCardClick(card));
    });
  }

  handleCardClick(cardEl) {
    if (this.lockBoard) return;
    if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

    window.spectralAudio.playCardFlip();
    cardEl.classList.add('flipped');
    this.flippedCards.push(cardEl);

    if (this.flippedCards.length === 2) {
      this.moves++;
      const movesEl = document.getElementById('mem-moves');
      if (movesEl) movesEl.textContent = this.moves;

      this.checkMatch();
    }
  }

  checkMatch() {
    const [card1, card2] = this.flippedCards;
    const isMatch = card1.dataset.id === card2.dataset.id;

    if (isMatch) {
      window.spectralAudio.playMatchSuccess();
      card1.classList.add('matched');
      card2.classList.add('matched');
      this.matchedPairs++;

      const pairsEl = document.getElementById('mem-pairs');
      if (pairsEl) pairsEl.textContent = this.matchedPairs;

      this.flippedCards = [];

      if (this.matchedPairs === 6) {
        setTimeout(() => this.win(), 500);
      }
    } else {
      this.lockBoard = true;
      window.spectralAudio.playError();

      setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        this.flippedCards = [];
        this.lockBoard = false;
      }, 900);
    }
  }

  win() {
    window.spectralAudio.playVictoryFanfare();
    if (this.onComplete) this.onComplete();
  }

  cleanup() {
    this.flippedCards = [];
    this.lockBoard = false;
  }
}

window.Game2Memory = Game2Memory;
