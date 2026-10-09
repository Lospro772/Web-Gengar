/**
 * Minijuego 5: El Quiz de la Cripta (Trivia Espectral Interactiva)
 */
class Game5Quiz {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.currentIndex = 0;
    this.questions = [];
  }

  start(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.currentIndex = 0;
    this.questions = window.GENGAR_CONFIG?.quizQuestions || [];

    this.render();
  }

  render() {
    const q = this.questions[this.currentIndex];
    if (!q) {
      this.win();
      return;
    }

    this.container.innerHTML = `
      <div class="game-wrapper quiz-game">
        <div class="game-hud">
          <div class="hud-item"><span class="hud-label">PREGUNTA:</span> <span class="hud-val">${this.currentIndex + 1}</span> / ${this.questions.length}</div>
          <div class="hud-item"><span class="hud-label">TIPO:</span> <span class="hud-val">Conocimiento Fantasma</span></div>
        </div>

        <div class="quiz-card">
          <div class="quiz-question-badge">🔮 ENIGMA #${this.currentIndex + 1}</div>
          <h3 class="quiz-question-text">${q.question}</h3>

          <div class="quiz-reaction" id="quiz-reaction" style="display: none;"></div>

          <div class="quiz-options-grid">
            ${q.options.map((opt, i) => `
              <button class="quiz-opt-btn" data-opt-idx="${i}">
                <span class="opt-letter">${String.fromCharCode(65 + i)}</span>
                <span class="opt-text">${opt}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Listeners para las opciones
    const buttons = this.container.querySelectorAll('.quiz-opt-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.optIdx, 10);
        this.handleAnswer(idx, btn);
      });
    });
  }

  handleAnswer(selectedIdx, btnEl) {
    const q = this.questions[this.currentIndex];
    const reactionEl = document.getElementById('quiz-reaction');

    if (selectedIdx === q.correctIndex) {
      // Correcto
      window.spectralAudio.playMatchSuccess();
      btnEl.classList.add('correct');

      if (reactionEl) {
        reactionEl.style.display = 'block';
        reactionEl.className = 'quiz-reaction reaction-correct';
        reactionEl.innerHTML = `<span>😈</span> ${q.gengarReactionCorrect}`;
      }

      // Desactivar botones momentáneamente
      const buttons = this.container.querySelectorAll('.quiz-opt-btn');
      buttons.forEach(b => b.disabled = true);

      setTimeout(() => {
        this.currentIndex++;
        if (this.currentIndex >= this.questions.length) {
          this.win();
        } else {
          this.render();
        }
      }, 1600);
    } else {
      // Incorrecto
      window.spectralAudio.playError();
      btnEl.classList.add('wrong');
      btnEl.disabled = true;

      if (reactionEl) {
        reactionEl.style.display = 'block';
        reactionEl.className = 'quiz-reaction reaction-wrong';
        reactionEl.innerHTML = `<span>👻</span> ${q.gengarReactionWrong}`;
      }
    }
  }

  win() {
    window.spectralAudio.playVictoryFanfare();
    if (this.onComplete) this.onComplete();
  }

  cleanup() {
    this.currentIndex = 0;
  }
}

window.Game5Quiz = Game5Quiz;
