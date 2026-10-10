/**
 * Motor de Audio Espectral de Gengar
 * Utiliza Web Audio API pura para sintetizar efectos retro con control de volumen maestro.
 */
class SpectralAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    
    // Cargar volumen persistido (por defecto 0.6 / 60%)
    const savedVol = localStorage.getItem('gengar_sound_volume');
    this.volume = savedVol !== null ? parseFloat(savedVol) : 0.6;
    this.muted = localStorage.getItem('gengar_sound_muted') === 'true';

    this.musicPlaying = false;
    this.musicInterval = null;
    this.initAudioContext = this.initAudioContext.bind(this);

    // Activar audio tras la primera interacción del usuario
    window.addEventListener('click', this.initAudioContext, { once: true });
    window.addEventListener('keydown', this.initAudioContext, { once: true });
    window.addEventListener('pointerdown', this.initAudioContext, { once: true });
  }

  initAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        const initialGain = this.muted ? 0 : this.volume;
        this.masterGain.gain.setValueAtTime(initialGain, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getMasterDestination() {
    this.initAudioContext();
    if (this.masterGain) return this.masterGain;
    return this.ctx ? this.ctx.destination : null;
  }

  /** Ajusta el volumen maestro (0.0 a 1.0) */
  setVolume(newVol) {
    this.volume = Math.max(0, Math.min(1, newVol));
    localStorage.setItem('gengar_sound_volume', this.volume);

    this.initAudioContext();
    if (this.masterGain && this.ctx) {
      const targetGain = this.muted ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    return this.volume;
  }

  getVolume() {
    return this.volume;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('gengar_sound_muted', this.muted);

    this.initAudioContext();
    if (this.masterGain && this.ctx) {
      const targetGain = this.muted ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    if (this.muted && this.musicPlaying) {
      this.stopAmbientMusic();
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /** Reproduce un tono con envolvente básica */
  playTone(freq, type = 'sine', duration = 0.2, gainValue = 0.15) {
    if (this.muted) return;
    const dest = this.getMasterDestination();
    if (!dest || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  /** Risa fantasmal de Gengar */
  playGengarLaugh() {
    if (this.muted) return;
    const dest = this.getMasterDestination();
    if (!dest || !this.ctx) return;

    const pitches = [550, 480, 400, 340, 290];
    pitches.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(freq - 70, this.ctx.currentTime + 0.12);

          gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.13);

          osc.connect(gain);
          gain.connect(dest);

          osc.start();
          osc.stop(this.ctx.currentTime + 0.14);
        } catch (e) {}
      }, idx * 95);
    });
  }

  /** Clic o toque en botón */
  playBlip() {
    this.playTone(880, 'square', 0.05, 0.05);
  }

  /** Sonido al voltear carta */
  playCardFlip() {
    this.playTone(420, 'triangle', 0.08, 0.08);
  }

  /** Sonido de acierto o match */
  playMatchSuccess() {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.2, 0.1), i * 70);
    });
  }

  /** Sonido de error */
  playError() {
    if (this.muted) return;
    this.playTone(220, 'sawtooth', 0.15, 0.12);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.25, 0.14), 110);
  }

  /** Salto o aleteo en Flappy Gengar */
  playFlap() {
    if (this.muted) return;
    const dest = this.getMasterDestination();
    if (!dest || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(580, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch (e) {}
  }

  /** Lanzamiento de Bola Sombra */
  playShadowBallShoot() {
    if (this.muted) return;
    const dest = this.getMasterDestination();
    if (!dest || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.21);
    } catch (e) {}
  }

  /** Ruptura de cristal / sello */
  playCrystalShatter() {
    if (this.muted) return;
    const freqs = [1200, 1600, 2100, 950];
    freqs.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.18, 0.12), idx * 25);
    });
  }

  /** Tono para Simón */
  playSimonTone(index, duration = 0.42) {
    const tones = [440, 554.37, 659.25, 830.61];
    this.playTone(tones[index] || 500, 'sine', duration, 0.18);
  }

  /** Mordisco / comer dulce (Banquete Come-Sueños) */
  playChomp() {
    if (this.muted) return;
    const dest = this.getMasterDestination();
    if (!dest || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(540, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.11);
    } catch (e) {}
  }

  /** Aturdimiento / trampa comida */
  playTrapHit() {
    if (this.muted) return;
    const dest = this.getMasterDestination();
    if (!dest || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {}
  }

  /** Rebote de bola en pala (Rebote Espectral) */
  playPaddleBounce() {
    if (this.muted) return;
    this.playTone(680, 'sine', 0.09, 0.18);
  }

  /** Ruptura de lápida / ladrillo sombrío */
  playBrickBreak() {
    if (this.muted) return;
    const freqs = [880, 1100, 1400];
    freqs.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'square', 0.08, 0.09), idx * 20);
    });
  }

  /** Recoger orbe / power-up */
  playPowerup() {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'triangle', 0.12, 0.12), i * 40);
    });
  }

  /** Rotación de espejo / prisma rúnico */
  playMirrorRotate() {
    if (this.muted) return;
    this.playTone(520, 'sine', 0.06, 0.16);
    setTimeout(() => this.playTone(780, 'triangle', 0.08, 0.14), 40);
  }

  /** Iluminación de cristal rúnico con el rayo */
  playCrystalIgnite() {
    if (this.muted) return;
    const chord = [880, 1108.73, 1318.51];
    chord.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sine', 0.25, 0.08), idx * 30);
    });
  }

  /** Resolución de cámara del altar */
  playChamberSolved() {
    if (this.muted) return;
    const arpeggio = [440, 554.37, 659.25, 880, 1108.73];
    arpeggio.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.28, 0.12), idx * 75);
    });
  }

  /** Fanfarria triunfal al superar un reto */
  playVictoryFanfare() {
    if (this.muted) return;
    const melody = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.15 },
      { f: 1046.50, d: 0.4 },
    ];
    let time = 0;
    melody.forEach(note => {
      setTimeout(() => {
        this.playTone(note.f, 'triangle', note.d, 0.18);
      }, time * 1000);
      time += note.d + 0.05;
    });
  }

  /** Soplido de velas de la tarta + campana mágica */
  playBlowCandles() {
    if (this.muted) return;
    const dest = this.getMasterDestination();
    if (!dest || !this.ctx) return;

    try {
      // Efecto soplido (frecuencia deslizante suave)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.41);

      // Chimes mágicos de deseo
      setTimeout(() => {
        const wishNotes = [784, 880, 1046, 1318];
        wishNotes.forEach((n, i) => {
          setTimeout(() => this.playTone(n, 'triangle', 0.3, 0.1), i * 80);
        });
      }, 350);
    } catch (e) {}
  }

  /** Efecto de sonido cinemático para la apertura del portal de bienvenida */
  playIntroPortal() {
    this.initAudioContext();
    if (this.muted) return;
    const dest = this.getMasterDestination();
    if (!dest || !this.ctx) return;

    try {
      // 1. Sub-bass rumble profundo (portal abriéndose)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(65, this.ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.6);

      subGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);

      subOsc.connect(subGain);
      subGain.connect(dest);
      subOsc.start();
      subOsc.stop(this.ctx.currentTime + 0.66);

      // 2. Chords mágicos ascendentes
      const portalArp = [329.63, 392.00, 493.88, 587.33, 659.25, 783.99, 987.77];
      portalArp.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.22, 0.08);
        }, idx * 60);
      });

      // 3. Risa maliciosa de Gengar
      setTimeout(() => {
        this.playGengarLaugh();
      }, 420);
    } catch (e) {}
  }

  /** Gran Fanfarria Final de Desbloqueo de Cumpleaños */
  playGrandVaultUnlock() {
    if (this.muted) return;
    this.playGengarLaugh();
    setTimeout(() => {
      const victoryNotes = [
        { f: 440.00, d: 0.2 },
        { f: 554.37, d: 0.2 },
        { f: 659.25, d: 0.2 },
        { f: 880.00, d: 0.35 },
        { f: 783.99, d: 0.2 },
        { f: 880.00, d: 0.6 }
      ];
      let delay = 0;
      victoryNotes.forEach(n => {
        setTimeout(() => this.playTone(n.f, 'square', n.d, 0.12), delay);
        delay += n.d * 1000 + 40;
      });
    }, 600);
  }

  /** Música ambiental retro de fondo (loop ligero y sutil) */
  startAmbientMusic() {
    if (this.muted || this.musicPlaying) return;
    this.initAudioContext();
    if (!this.ctx) return;
    this.musicPlaying = true;

    const ghostScale = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 440];
    let step = 0;

    this.musicInterval = setInterval(() => {
      if (this.muted || !this.musicPlaying) return;
      const note = ghostScale[step % ghostScale.length];
      if (step % 2 === 0) {
        this.playTone(note, 'sine', 0.22, 0.035);
      }
      step++;
    }, 450);
  }

  stopAmbientMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  toggleMusic() {
    if (this.musicPlaying) {
      this.stopAmbientMusic();
      return false;
    } else {
      this.startAmbientMusic();
      return true;
    }
  }
}

// Exportar instancia global
window.spectralAudio = new SpectralAudioEngine();
