/**
 * Gestor Principal del Progreso y Vistas (GameManager)
 */
class GameManager {
  constructor() {
    this.totalStages = 9;
    this.completedStages = [];
    this.currentStage = 1;
    this.activeGameInstance = null;

    this.stagesConfig = [
      { id: 1, name: "Atrapa a Gengar", type: "Reflejos", classRef: window.Game1Whack, icon: "⚡" },
      { id: 2, name: "Memoria del Más Allá", type: "Cartas 3D", classRef: window.Game2Memory, icon: "👁️" },
      { id: 3, name: "Hipnosis de Ritmo", type: "Simón Dice", classRef: window.Game3Simon, icon: "🔮" },
      { id: 4, name: "Flappy Gengar", type: "Arcade Vuelo", classRef: window.Game4Flappy, icon: "🦇" },
      { id: 5, name: "El Banquete Come-Sueños", type: "Arcade Glotón", classRef: window.Game5Banquet, icon: "🍰" },
      { id: 6, name: "Rebote Espectral", type: "Rompe-Lápidas", classRef: window.Game6Breakout, icon: "🧱" },
      { id: 7, name: "El Quiz de la Cripta", type: "Trivia", classRef: window.Game5Quiz, icon: "📜" },
      { id: 8, name: "Ruptura del Sello Sombrío", type: "Boss Final", classRef: window.Game6Boss, icon: "👑" },
      { id: 9, name: "El Altar de los Prismas", type: "Enigma Cerebral", classRef: window.Game9Prisms, icon: "🗝️" },
    ];

    this.loadProgress();
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('gengar_completed_stages');
      if (saved) {
        this.completedStages = JSON.parse(saved);
      }
    } catch (e) {
      this.completedStages = [];
    }
  }

  saveProgress() {
    try {
      localStorage.setItem('gengar_completed_stages', JSON.stringify(this.completedStages));
    } catch (e) {}
  }

  isStageCompleted(stageId) {
    return this.completedStages.includes(stageId);
  }

  isStageUnlocked(stageId) {
    if (stageId === 1) return true;
    return this.completedStages.includes(stageId - 1);
  }

  isAllCompleted() {
    return this.completedStages.length >= this.totalStages;
  }

  initUI() {
    this.renderHeader();
    this.renderHub();
    this.attachGlobalListeners();
    this.setupInteractiveCake();
    this.setupTrainerCard();
    this.setupIntroScreen();

    if (this.isAllCompleted()) {
      this.openVaultView(false);
    } else {
      if (!this._introActive) {
        this.showGengarDialogue(window.GENGAR_CONFIG?.dialogues?.welcome);
      }
    }
  }

  renderHeader() {
    const friendName = window.GENGAR_CONFIG?.friend?.name || "Entrenador";
    const nameEl = document.getElementById('header-friend-name');
    if (nameEl) nameEl.textContent = friendName;

    this.updateSoundBtnIcon();
  }

  renderHub() {
    const runesContainer = document.getElementById('runes-grid');
    if (!runesContainer) return;

    runesContainer.innerHTML = '';

    this.stagesConfig.forEach(stage => {
      const isCompleted = this.isStageCompleted(stage.id);
      const isUnlocked = this.isStageUnlocked(stage.id);

      const card = document.createElement('div');
      card.className = `rune-card ${isCompleted ? 'completed' : (isUnlocked ? 'unlocked' : 'locked')}`;
      card.id = `rune-stage-${stage.id}`;

      card.innerHTML = `
        <div class="rune-seal-badge">
          <span class="rune-num">SELLO #${stage.id}</span>
          <span class="rune-status-icon">${isCompleted ? '✅' : (isUnlocked ? stage.icon : '🔒')}</span>
        </div>
        <div class="rune-body">
          <h4 class="rune-title">${stage.name}</h4>
          <span class="rune-type">${stage.type}</span>
        </div>
        <button class="btn-play-stage ${isCompleted ? 'btn-replay' : ''}" ${!isUnlocked ? 'disabled' : ''}>
          ${isCompleted ? 'Volver a Jugar' : (isUnlocked ? 'Desafiar Sello' : 'Bloqueado')}
        </button>
      `;

      card.querySelector('button')?.addEventListener('click', () => {
        if (isUnlocked) {
          this.launchStage(stage.id);
        }
      });

      runesContainer.appendChild(card);
    });

    // Actualizar barra de progreso del Hub
    const progressPercent = Math.min(100, Math.round((this.completedStages.length / this.totalStages) * 100));
    const bar = document.getElementById('hub-progress-fill');
    const label = document.getElementById('hub-progress-label');
    if (bar) bar.style.width = `${progressPercent}%`;
    if (label) label.textContent = `${this.completedStages.length} / ${this.totalStages} Sellos Rotos (${progressPercent}%)`;

    // Tarjeta del cofre en el Hub
    const vaultPreview = document.getElementById('vault-preview-card');
    if (vaultPreview) {
      if (this.isAllCompleted()) {
        vaultPreview.classList.add('ready-to-open');
        vaultPreview.querySelector('.vault-btn-open').textContent = "🎁 ¡Abrir Bóveda del Cumpleaños!";
      } else {
        vaultPreview.classList.remove('ready-to-open');
        vaultPreview.querySelector('.vault-btn-open').textContent = `🔒 Requiere los ${this.totalStages} Sellos (${this.completedStages.length}/${this.totalStages})`;
      }
    }
  }

  showGengarDialogue(text) {
    const dialogBox = document.getElementById('gengar-dialogue-text');
    if (!dialogBox) return;

    window.spectralAudio.playGengarLaugh();
    dialogBox.textContent = "";

    let i = 0;
    if (this._typeInterval) clearInterval(this._typeInterval);

    this._typeInterval = setInterval(() => {
      if (i < text.length) {
        dialogBox.textContent += text.charAt(i);
        if (i % 3 === 0) window.spectralAudio.playBlip();
        i++;
      } else {
        clearInterval(this._typeInterval);
      }
    }, 24);
  }

  launchStage(stageId) {
    this.currentStage = stageId;
    const stage = this.stagesConfig.find(s => s.id === stageId);
    if (!stage) return;

    const modal = document.getElementById('game-modal');
    const titleEl = document.getElementById('modal-stage-title');
    const arenaEl = document.getElementById('game-arena-content');

    if (titleEl) titleEl.textContent = `SELLO #${stage.id}: ${stage.name}`;
    arenaEl.innerHTML = '';
    modal.classList.add('open');

    // Diálogo de inicio
    const startDialogue = window.GENGAR_CONFIG?.dialogues?.[`challenge${stageId}_start`] || "¡Que empiece la prueba espectral!";
    this.showGengarDialogue(startDialogue);

    // Instanciar juego
    if (stage.classRef) {
      this.activeGameInstance = new stage.classRef();
      this.activeGameInstance.start(
        arenaEl,
        () => this.onStageWon(stageId)
      );
    }
  }

  onStageWon(stageId) {
    if (!this.completedStages.includes(stageId)) {
      this.completedStages.push(stageId);
      this.saveProgress();
    }

    const winDialogue = window.GENGAR_CONFIG?.dialogues?.[`challenge${stageId}_win`] || "¡Has superado este sello!";
    this.showGengarDialogue(winDialogue);

    const arenaEl = document.getElementById('game-arena-content');
    arenaEl.innerHTML = `
      <div class="stage-victory-banner">
        <div class="vic-icon">✨ 👻 ✨</div>
        <h2>¡SELLO #${stageId} ROTO CON ÉXITO!</h2>
        <p>El poder de las sombras retrocede ante tu maestría.</p>
        <div class="vic-buttons">
          <button class="btn-spectral" id="btn-next-step">
            ${this.isAllCompleted() ? '🎁 ¡ABRIR LA BÓVEDA DEL REGALO!' : (stageId < this.totalStages ? 'Siguiente Reto ➔' : 'Volver al Hub')}
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-next-step')?.addEventListener('click', () => {
      this.closeStageModal();
      this.renderHub();

      if (this.isAllCompleted()) {
        this.openVaultView(true);
      } else if (stageId < this.totalStages) {
        this.launchStage(stageId + 1);
      }
    });
  }

  closeStageModal() {
    if (this.activeGameInstance && this.activeGameInstance.cleanup) {
      this.activeGameInstance.cleanup();
    }
    this.activeGameInstance = null;
    const modal = document.getElementById('game-modal');
    modal.classList.remove('open');
  }

  skipCurrentStage() {
    // Función de ayuda / bypass para que el cumpleañero nunca se quede bloqueado
    if (this.currentStage) {
      this.onStageWon(this.currentStage);
    }
  }

  unlockAllStages() {
    this.completedStages = Array.from({ length: this.totalStages }, (_, i) => i + 1);
    this.saveProgress();
    this.renderHub();
    this.closeStageModal();
    this.openVaultView(true);
  }

  resetAllProgress() {
    if (confirm("¿Quieres reiniciar todos los sellos para jugar desde el principio?")) {
      this.completedStages = [];
      this.saveProgress();
      this.renderHub();
      document.getElementById('vault-view').classList.remove('active');
      document.getElementById('hub-view').classList.add('active');
      this.showGengarDialogue(window.GENGAR_CONFIG?.dialogues?.welcome);
    }
  }

  openVaultView(animate = true) {
    const hubView = document.getElementById('hub-view');
    const vaultView = document.getElementById('vault-view');

    hubView.classList.remove('active');
    vaultView.classList.add('active');

    window.spectralAudio.playGrandVaultUnlock();

    // Actualizar datos del cumpleañero en la bóveda
    const friend = window.GENGAR_CONFIG?.friend || {};
    const letter = window.GENGAR_CONFIG?.birthdayLetter || {};

    document.getElementById('vault-friend-name').textContent = friend.name || "Entrenador";
    document.getElementById('vault-letter-title').textContent = letter.title || "¡FELIZ CUMPLEAÑOS!";
    document.getElementById('vault-letter-subtitle').textContent = letter.subtitle || "";
    
    const bodyContainer = document.getElementById('vault-letter-body');
    if (bodyContainer && letter.body) {
      bodyContainer.innerHTML = letter.body.map(p => `<p>${p}</p>`).join('');
    }

    document.getElementById('vault-letter-signature').textContent = letter.signature || "";

    // Configurar tarjeta de la siguiente sorpresa desbloqueada
    this.setupSurpriseReward();

    // Configurar tarta interactiva y tarjeta de entrenador
    this.setupInteractiveCake();
    this.setupTrainerCard();

    // Lanzar confeti espectral
    this.launchConfetti();
  }

  setupSurpriseReward() {
    const rewardConfig = window.GENGAR_CONFIG?.surpriseReward || {};

    // Inyectar textos dinámicos
    const badgeEl = document.getElementById('vault-surprise-badge');
    const titleEl = document.getElementById('vault-surprise-title');
    const subtitleEl = document.getElementById('vault-surprise-subtitle');
    const messagesContainer = document.getElementById('vault-surprise-messages');
    const claimBtnText = document.getElementById('btn-claim-text');
    const secretCodeEl = document.getElementById('vault-secret-code');
    const claimAlertText = document.getElementById('claimed-alert-text');

    if (badgeEl && rewardConfig.badge) badgeEl.textContent = rewardConfig.badge;
    if (titleEl && rewardConfig.title) titleEl.textContent = rewardConfig.title;
    if (subtitleEl && rewardConfig.subtitle) subtitleEl.textContent = rewardConfig.subtitle;
    if (claimBtnText && rewardConfig.claimButtonText) claimBtnText.textContent = rewardConfig.claimButtonText;
    if (secretCodeEl && rewardConfig.secretCode) secretCodeEl.textContent = rewardConfig.secretCode;
    if (claimAlertText && rewardConfig.claimMessage) claimAlertText.textContent = rewardConfig.claimMessage;

    if (messagesContainer) {
      const messages = rewardConfig.messages || [
        "¡Enhorabuena, Tuki! Has demostrado una astucia y habilidad increíbles superando cada uno de los 9 enigmas espectrales.",
        "La magia de Gengar ha quebrado el último sello... ¡pero la sorpresa definitiva te espera más allá de esta pantalla!",
        "👀 ¡Avisa ahora mismo a tus amigos para que te pasen el video secreto y la gran sorpresa que han preparado para ti!",
        "¡Diles que has completado la Torre al 100% para reclamar tu recompensa en este instante!"
      ];

      const bullets = ['🔮', '⚡', '👀', '🎁', '✨'];
      messagesContainer.innerHTML = messages.map((msg, i) => `
        <div class="surprise-msg-item">
          <span class="surprise-msg-bullet">${bullets[i % bullets.length]}</span>
          <span class="surprise-msg-text">${msg}</span>
        </div>
      `).join('');
    }

    // Configurar botón para avisar a los amigos / reclamar
    const claimBtn = document.getElementById('btn-claim-surprise');
    const claimedBanner = document.getElementById('surprise-claimed-banner');

    if (claimBtn && !this._claimListenerAttached) {
      this._claimListenerAttached = true;
      claimBtn.addEventListener('click', () => {
        window.spectralAudio.playGengarLaugh();
        this.launchConfetti();

        if (claimedBanner) {
          claimedBanner.style.display = 'block';
          claimedBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }

    // Configurar botón de copiar código secreto
    const copyBtn = document.getElementById('btn-copy-secret-code');
    const copyToast = document.getElementById('code-copy-toast');
    const copyLabel = document.getElementById('copy-btn-label');

    if (copyBtn && !this._copyListenerAttached) {
      this._copyListenerAttached = true;
      copyBtn.addEventListener('click', async () => {
        const code = (secretCodeEl?.textContent || 'TUKI-SOMBRA-2026').trim();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(code);
          } else {
            const ta = document.createElement('textarea');
            ta.value = code;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
          }
          window.spectralAudio.playTone(880, 'sine', 0.15, 0.12);
          if (copyLabel) copyLabel.textContent = '¡Copiado!';
          if (copyToast) {
            copyToast.style.display = 'block';
            setTimeout(() => {
              copyToast.style.display = 'none';
              if (copyLabel) copyLabel.textContent = 'Copiar';
            }, 3000);
          }
        } catch (e) {
          alert(`Código secreto: ${code}`);
        }
      });
    }
  }

  launchConfetti() {
    // Confeti de partículas de celebración de Gengar
    const confettiColors = ['#a855f7', '#ec4899', '#ef4444', '#f59e0b', '#38bdf8', '#ffffff'];
    const container = document.getElementById('vault-view');

    for (let i = 0; i < 70; i++) {
      const c = document.createElement('div');
      c.className = 'confetti-piece';
      c.style.left = `${Math.random() * 100}%`;
      c.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      c.style.animationDelay = `${Math.random() * 2.5}s`;
      c.style.animationDuration = `${Math.random() * 2 + 3}s`;
      c.style.width = `${Math.random() * 8 + 6}px`;
      c.style.height = `${Math.random() * 14 + 8}px`;
      container.appendChild(c);

      setTimeout(() => c.remove(), 6000);
    }
  }

  attachGlobalListeners() {
    // Controlador de volumen gradual (slider + mute)
    const volumeSlider = document.getElementById('volume-slider');
    const volumeLabel = document.getElementById('volume-percent-label');
    const soundBtn = document.getElementById('btn-sound-toggle');

    if (volumeSlider) {
      const currentVol = Math.round(window.spectralAudio.getVolume() * 100);
      volumeSlider.value = window.spectralAudio.isMuted() ? 0 : currentVol;
      if (volumeLabel) volumeLabel.textContent = `${volumeSlider.value}%`;
    }

    // Botón de audio / mute
    soundBtn?.addEventListener('click', () => {
      const isMuted = window.spectralAudio.toggleMute();
      if (!isMuted && window.spectralAudio.getVolume() === 0) {
        window.spectralAudio.setVolume(0.5);
      }
      this.updateSoundBtnIcon();
      if (!isMuted) {
        window.spectralAudio.playTone(587.33, 'sine', 0.1, 0.1);
      }
    });

    // Slider de volumen en tiempo real
    volumeSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const normalized = Math.max(0, Math.min(100, val)) / 100;
      window.spectralAudio.setVolume(normalized);

      if (window.spectralAudio.isMuted() && val > 0) {
        window.spectralAudio.toggleMute();
      }

      this.updateSoundBtnIcon();

      if (val > 0) {
        this.previewVolumeTone();
      }
    });

    // Botón de música ambiental
    document.getElementById('btn-music-toggle')?.addEventListener('click', () => {
      const playing = window.spectralAudio.toggleMusic();
      const btn = document.getElementById('btn-music-toggle');
      if (btn) btn.classList.toggle('active', playing);
    });

    // Cerrar modal de juego
    document.getElementById('btn-close-modal')?.addEventListener('click', () => {
      this.closeStageModal();
    });

    // Abrir bóveda desde el card del Hub
    document.getElementById('btn-hub-open-vault')?.addEventListener('click', () => {
      if (this.isAllCompleted()) {
        this.openVaultView(true);
      } else {
        alert(`¡Aún te faltan sellos por romper! Llevas ${this.completedStages.length}/${this.totalStages}.`);
      }
    });

    // Botón de volver al Hub desde la Bóveda
    document.getElementById('btn-return-hub')?.addEventListener('click', () => {
      document.getElementById('vault-view').classList.remove('active');
      document.getElementById('hub-view').classList.add('active');
    });

    // Botón de Reinicio Total
    document.getElementById('btn-reset-progress')?.addEventListener('click', () => {
      this.resetAllProgress();
    });

    // Permitir cambiar el nombre del amigo en vivo si se desea
    document.getElementById('btn-edit-friend-name')?.addEventListener('click', () => {
      const current = window.GENGAR_CONFIG?.friend?.name || "";
      const newName = prompt("Introduce el nombre del cumpleañero:", current);
      if (newName && newName.trim()) {
        window.GENGAR_CONFIG.friend.name = newName.trim();
        this.renderHeader();
        const vName = document.getElementById('vault-friend-name');
        if (vName) vName.textContent = newName.trim();
        const cTag = document.querySelector('.cake-badge-tag');
        if (cTag) cTag.textContent = `${newName.trim().toUpperCase()} 🎂 2026`;
        const tcName = document.querySelector('.tcard-name');
        if (tcName) tcName.textContent = newName.trim().toUpperCase();
      }
    });

    // =========================================================================
    // ACCESO SECRETO DEL CREADOR (PROTEGIDO POR SQLITE LOCAL)
    // =========================================================================
    let avatarClicks = 0;
    let avatarClickTimer = null;

    const openCreatorModal = () => {
      const modal = document.getElementById('creator-auth-modal');
      const input = document.getElementById('creator-password-input');
      const feedback = document.getElementById('creator-auth-feedback');
      const panel = document.getElementById('creator-actions-panel');

      if (modal) modal.classList.add('open');
      if (input) {
        input.value = '';
        input.focus();
      }
      if (feedback) feedback.style.display = 'none';
      if (panel) panel.style.display = 'none';
      window.spectralAudio.playTone(300, 'sine', 0.2, 0.1);
    };

    // 5 clics seguidos en el avatar de Gengar abren la ventana secreta
    document.getElementById('header-avatar-secret-trigger')?.addEventListener('click', () => {
      avatarClicks++;
      clearTimeout(avatarClickTimer);
      avatarClickTimer = setTimeout(() => { avatarClicks = 0; }, 1800);

      if (avatarClicks >= 5) {
        avatarClicks = 0;
        openCreatorModal();
      }
    });

    // Clic en el ojo secreto del footer
    document.getElementById('secret-footer-trigger')?.addEventListener('click', () => {
      openCreatorModal();
    });

    // Cerrar modal del creador
    document.getElementById('btn-close-creator-modal')?.addEventListener('click', () => {
      document.getElementById('creator-auth-modal')?.classList.remove('open');
    });

    // Verificar contraseña en la base de datos local SQLite mediante POST /api/verify-bypass
    const verifyPassword = async () => {
      const input = document.getElementById('creator-password-input');
      const feedback = document.getElementById('creator-auth-feedback');
      const panel = document.getElementById('creator-actions-panel');
      const pwd = input ? input.value.trim() : '';

      if (!pwd) {
        if (feedback) {
          feedback.style.display = 'block';
          feedback.className = 'creator-feedback error';
          feedback.textContent = 'Debes ingresar una contraseña.';
        }
        return;
      }

      try {
        const res = await fetch('/api/verify-bypass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        });
        const data = await res.json();

        if (data.success) {
          window.spectralAudio.playMatchSuccess();
          if (feedback) {
            feedback.style.display = 'block';
            feedback.className = 'creator-feedback success';
            feedback.textContent = data.message;
          }
          if (panel) panel.style.display = 'block';
        } else {
          window.spectralAudio.playError();
          window.spectralAudio.playGengarLaugh();
          if (feedback) {
            feedback.style.display = 'block';
            feedback.className = 'creator-feedback error';
            feedback.textContent = data.message;
          }
          if (panel) panel.style.display = 'none';
        }
      } catch (err) {
        if (feedback) {
          feedback.style.display = 'block';
          feedback.className = 'creator-feedback error';
          feedback.textContent = 'Error al conectar con la base de datos local.';
        }
      }
    };

    document.getElementById('btn-verify-creator-pwd')?.addEventListener('click', verifyPassword);
    document.getElementById('creator-password-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verifyPassword();
    });

    // Acciones autorizadas por el creador
    document.getElementById('btn-creator-unlock-current')?.addEventListener('click', () => {
      document.getElementById('creator-auth-modal')?.classList.remove('open');
      const activeStage = this.currentStage || 1;
      this.onStageWon(activeStage);
    });

    document.getElementById('btn-creator-unlock-all')?.addEventListener('click', () => {
      document.getElementById('creator-auth-modal')?.classList.remove('open');
      this.unlockAllStages();
    });
  }

  previewVolumeTone() {
    if (this._volDebounce) clearTimeout(this._volDebounce);
    this._volDebounce = setTimeout(() => {
      window.spectralAudio.playTone(550, 'sine', 0.08, 0.08);
    }, 80);
  }

  updateSoundBtnIcon() {
    const btn = document.getElementById('btn-sound-toggle');
    const slider = document.getElementById('volume-slider');
    const label = document.getElementById('volume-percent-label');
    if (!btn) return;

    const isMuted = window.spectralAudio.isMuted();
    const vol = Math.round(window.spectralAudio.getVolume() * 100);

    if (slider) {
      slider.value = isMuted ? 0 : vol;
      slider.style.opacity = isMuted ? '0.5' : '1';
    }

    if (label) {
      label.textContent = isMuted ? '0%' : `${vol}%`;
    }

    if (isMuted || vol === 0) {
      btn.innerHTML = '🔇';
      btn.title = 'Sonido silenciado (clic para activar)';
    } else if (vol <= 45) {
      btn.innerHTML = '🔉';
      btn.title = `Sonido suave (${vol}%)`;
    } else {
      btn.innerHTML = '🔊';
      btn.title = `Sonido activo (${vol}%)`;
    }
  }

  /**
   * Interactividad de la Tarta de Cumpleaños de Tuki
   */
  setupInteractiveCake() {
    if (this._cakeInitialized) return;
    this._cakeInitialized = true;

    const btnBlow = document.getElementById('btn-blow-candles');
    const cakeContainer = document.getElementById('interactive-cake');
    const wishBanner = document.getElementById('cake-wish-banner');
    const candles = document.querySelectorAll('.cake-candle');

    if (!btnBlow || !cakeContainer) return;

    let blownOut = false;

    const blowOut = () => {
      blownOut = true;
      candles.forEach(c => c.classList.add('blown-out'));
      if (wishBanner) wishBanner.style.display = 'block';
      btnBlow.textContent = "🔥 ¡Reencender las Velas!";
      window.spectralAudio.playBlowCandles();
      this.launchConfetti();
    };

    const relight = () => {
      blownOut = false;
      candles.forEach(c => c.classList.remove('blown-out'));
      if (wishBanner) wishBanner.style.display = 'none';
      btnBlow.textContent = "💨 ¡Pedir un Deseo y Soplar las Velas!";
      window.spectralAudio.playTone(880, 'triangle', 0.18, 0.1);
    };

    btnBlow.addEventListener('click', () => {
      if (!blownOut) {
        blowOut();
      } else {
        relight();
      }
    });

    candles.forEach(candle => {
      candle.addEventListener('click', () => {
        candle.classList.toggle('blown-out');
        window.spectralAudio.playTone(400, 'sine', 0.08, 0.08);
        const allBlown = Array.from(candles).every(c => c.classList.contains('blown-out'));
        if (allBlown && !blownOut) {
          blowOut();
        } else if (!allBlown && blownOut) {
          blownOut = false;
          if (wishBanner) wishBanner.style.display = 'none';
          btnBlow.textContent = "💨 ¡Pedir un Deseo y Soplar las Velas!";
        }
      });
    });
  }

  /**
   * Efecto 3D y Guardado de Tarjeta Holográfica de Entrenador
   */
  setupTrainerCard() {
    if (this._cardInitialized) return;
    this._cardInitialized = true;

    const card = document.getElementById('holographic-trainer-card');
    const shine = document.getElementById('card-holo-shine');
    const downloadBtn = document.getElementById('btn-download-trainer-card');

    if (!card) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;

      if (shine) {
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        shine.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.22) 0%, rgba(236,72,153,0.18) 35%, rgba(6,182,212,0.18) 60%, transparent 80%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      if (shine) {
        shine.style.background = '';
      }
    });

    downloadBtn?.addEventListener('click', () => {
      this.exportTrainerCard();
    });
  }

  /**
   * Controlador de la Animación Cinemática de Entrada (El Despertar de Gengar)
   */
  setupIntroScreen() {
    const introScreen = document.getElementById('intro-screen');
    const btnStart = document.getElementById('btn-start-adventure');
    const btnSkip = document.getElementById('btn-skip-intro');
    const btnReplay = document.getElementById('btn-replay-intro');
    const nameHighlight = document.querySelector('.intro-name-highlight');

    if (!introScreen) return;

    this._introActive = true;
    const friendName = window.GENGAR_CONFIG?.friend?.name || "Tuki";
    if (nameHighlight) nameHighlight.textContent = friendName;

    // Entrar a la Torre Sombría (Efecto Portal Cinemático con Sonido)
    btnStart?.addEventListener('click', () => {
      window.spectralAudio.playIntroPortal();
      introScreen.classList.add('portal-active');
      document.querySelector('.app-container')?.classList.add('intro-reveal');

      setTimeout(() => {
        introScreen.classList.add('fade-out');
        setTimeout(() => {
          introScreen.style.display = 'none';
          this._introActive = false;
          if (!this.isAllCompleted()) {
            this.showGengarDialogue(window.GENGAR_CONFIG?.dialogues?.welcome);
          }
        }, 550);
      }, 750);
    });

    // Saltar Intro directo
    btnSkip?.addEventListener('click', () => {
      window.spectralAudio.playBlip();
      introScreen.classList.add('fade-out');
      setTimeout(() => {
        introScreen.style.display = 'none';
        this._introActive = false;
        if (!this.isAllCompleted()) {
          this.showGengarDialogue(window.GENGAR_CONFIG?.dialogues?.welcome);
        }
      }, 350);
    });

    // Revivir animación de entrada desde la cabecera
    btnReplay?.addEventListener('click', () => {
      introScreen.style.display = 'flex';
      introScreen.classList.remove('fade-out', 'portal-active');
      this._introActive = true;
      window.spectralAudio.playTone(330, 'sine', 0.2, 0.1);
      
      const stageContent = introScreen.querySelector('.intro-stage-content');
      if (stageContent) {
        const newClone = stageContent.cloneNode(true);
        stageContent.parentNode.replaceChild(newClone, stageContent);
        this.setupIntroScreen();
      }
    });
  }

  /**
   * Genera y descarga un lienzo con la Tarjeta Oficial de Cumpleaños de Tuki
   */
  exportTrainerCard() {
    const friendName = window.GENGAR_CONFIG?.friend?.name || "TUKI";
    const canvas = document.createElement('canvas');
    canvas.width = 880;
    canvas.height = 530;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo degradado espectral oscuro
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#130626');
    grad.addColorStop(0.45, '#220b45');
    grad.addColorStop(1, '#0c0217');
    ctx.fillStyle = grad;
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, canvas.width, canvas.height, 24);
    } else {
      ctx.rect(0, 0, canvas.width, canvas.height);
    }
    ctx.fill();

    // Borde exterior violeta
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#c084fc';
    if (ctx.roundRect) {
      ctx.stroke();
    } else {
      ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
    }

    // Borde interno dorado fino
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fbbf24';
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Encabezado
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 22px "Montserrat", sans-serif';
    ctx.fillText('LICENCIA OFICIAL DE ENTRENADOR POKÉMON', 40, 42);

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 16px "Montserrat", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('#0094 • REGIÓN DE KANTO', canvas.width - 40, 44);
    ctx.textAlign = 'left';

    // Línea divisoria de cabecera
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 75);
    ctx.lineTo(canvas.width - 40, 75);
    ctx.stroke();

    // Carga de la foto del avatar
    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.src = 'assets/gengar_avatar.jpg';

    const drawCardDetails = () => {
      // -------------------------------------------------------------
      // COLUMNA IZQUIERDA: MEDALLÓN CIRCULAR DE GENGAR
      // -------------------------------------------------------------
      const cx = 145;
      const cy = 175;
      const radius = 72;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      try {
        if (avatarImg.complete && avatarImg.naturalWidth > 0) {
          ctx.drawImage(avatarImg, cx - radius, cy - radius, radius * 2, radius * 2);
        } else {
          ctx.fillStyle = '#4c1d95';
          ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
          ctx.font = '70px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('😈', cx, cy);
        }
      } catch (e) {
        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      }
      ctx.restore();

      // Anillo exterior brillante
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#c084fc';
      ctx.stroke();

      // Anillo interior dorado fino
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();

      // Placa / Cápsula elegante centrada bajo el avatar (sin texto rojo)
      const tagW = 186;
      const tagH = 32;
      const tagX = cx - (tagW / 2);
      const tagY = cy + radius + 18;

      ctx.fillStyle = 'rgba(28, 12, 54, 0.9)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, tagW, tagH, 10);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.65)';
        ctx.stroke();
      } else {
        ctx.fillRect(tagX, tagY, tagW, tagH);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 13px "Montserrat", sans-serif';
      ctx.fillText('GENGAR 😈 COMPAÑERO', cx, tagY + (tagH / 2));

      // Subtítulo sutil bajo la placa
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 11px "Montserrat", sans-serif';
      ctx.fillText('VÍNCULO NIVEL 100', cx, tagY + tagH + 15);

      // -------------------------------------------------------------
      // COLUMNA DERECHA: DATOS DEL ENTRENADOR
      // -------------------------------------------------------------
      const tx = 270;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Nombre del Cumpleañero
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px "Montserrat", sans-serif';
      ctx.fillText(friendName.toUpperCase(), tx, 100);

      // Rango de Maestro
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 18px "Montserrat", sans-serif';
      ctx.fillText('★ MAESTRO ESPECTRAL DE CUMPLEAÑOS ★', tx, 150);

      // Líneas de Estadísticas
      ctx.font = '16px "Montserrat", sans-serif';

      ctx.fillStyle = '#c084fc';
      ctx.fillText('MISIÓN SUPERADA: ', tx, 185);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(`Torre Sombría de Gengar (${this.totalStages}/${this.totalStages} Sellos)`, tx + 165, 185);

      ctx.fillStyle = '#c084fc';
      ctx.fillText('HABILIDAD: ', tx, 212);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText('Cuerpo Maldito & Fiesta Legendaria', tx + 105, 212);

      ctx.fillStyle = '#c084fc';
      ctx.fillText('REGISTRO OFICIAL: ', tx, 239);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText('TUKI-GENGAR-2026', tx + 165, 239);

      // -------------------------------------------------------------
      // ESTUCHE OFICIAL DE MEDALLAS (LOS 8 SELLOS)
      // -------------------------------------------------------------
      const boxX = tx;
      const boxY = 275;
      const boxW = 570;
      const boxH = 175;

      ctx.fillStyle = 'rgba(18, 7, 36, 0.85)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.stroke();
      } else {
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);
      }

      // Título de la caja de medallas
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 13px "Montserrat", sans-serif';
      ctx.fillText(`MEDALLAS DE LOS ${this.totalStages} SELLOS CONQUISTADOS`, boxX + 18, boxY + 16);

      ctx.fillStyle = '#c084fc';
      ctx.textAlign = 'right';
      ctx.fillText('100% COMPLETADO ★★★', boxX + boxW - 18, boxY + 16);
      ctx.textAlign = 'left';

      // Datos de las 9 medallas con iconos y etiquetas limpias y sin superposiciones
      const medalsData = [
        { icon: '⚡', name: 'Rayo', seal: 'SELLO 1', color: '#fbbf24', border: '#f59e0b' },
        { icon: '👁️', name: 'Visión', seal: 'SELLO 2', color: '#c084fc', border: '#a855f7' },
        { icon: '🔮', name: 'Ritmo', seal: 'SELLO 3', color: '#ec4899', border: '#db2777' },
        { icon: '🦇', name: 'Vuelo', seal: 'SELLO 4', color: '#38bdf8', border: '#0284c7' },
        { icon: '🍰', name: 'Festín', seal: 'SELLO 5', color: '#f43f5e', border: '#e11d48' },
        { icon: '🧱', name: 'Rebote', seal: 'SELLO 6', color: '#a855f7', border: '#9333ea' },
        { icon: '📜', name: 'Enigma', seal: 'SELLO 7', color: '#34d399', border: '#059669' },
        { icon: '👑', name: 'Corona', seal: 'SELLO 8', color: '#fbbf24', border: '#d97706' },
        { icon: '🗝️', name: 'Altar', seal: 'SELLO 9', color: '#38bdf8', border: '#0284c7' },
      ];

      const step = boxW / medalsData.length;
      medalsData.forEach((medal, i) => {
        const slotX = boxX + (step * (i + 0.5));
        const badgeY = boxY + 74;
        const bRadius = 22;

        // Círculo base de la medalla
        ctx.beginPath();
        ctx.arc(slotX, badgeY, bRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(38, 16, 75, 0.9)';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = medal.border;
        ctx.stroke();

        // Anillo interno decorativo
        ctx.beginPath();
        ctx.arc(slotX, badgeY, bRadius - 3, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.stroke();

        // Icono de la medalla
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '22px sans-serif';
        ctx.fillText(medal.icon, slotX, badgeY + 1);

        // Nombre de la medalla (blanco, centrado y bien espaciado)
        ctx.font = 'bold 11px "Montserrat", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(medal.name, slotX, boxY + 118);

        // Etiqueta del Sello (#1..#6)
        ctx.font = 'bold 10px "Montserrat", sans-serif';
        ctx.fillStyle = medal.color;
        ctx.fillText(medal.seal, slotX, boxY + 138);
      });

      // -------------------------------------------------------------
      // PIE DE PÁGINA DE LA TARJETA
      // -------------------------------------------------------------
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '12px "Montserrat", sans-serif';
      ctx.fillText('CERTIFICADO OFICIAL DE CUMPLEAÑOS • TORRE SOMBRÍA', 40, canvas.height - 30);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px "Montserrat", sans-serif';
      ctx.fillText('🎂 EDICIÓN ESPECIAL 2026', canvas.width - 40, canvas.height - 30);

      // Disparar descarga del PNG generado
      try {
        const link = document.createElement('a');
        link.download = `Tarjeta_Entrenador_${friendName.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        window.spectralAudio.playTone(880, 'triangle', 0.2, 0.1);
      } catch (err) {
        console.error('Error al exportar la tarjeta:', err);
      }
    };

    if (avatarImg.complete) {
      drawCardDetails();
    } else {
      avatarImg.onload = drawCardDetails;
      avatarImg.onerror = drawCardDetails;
      setTimeout(drawCardDetails, 300);
    }
  }
}

window.GameManager = GameManager;
