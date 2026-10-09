/**
 * Minijuego 9: El Altar de los Prismas Espectrales (El Enigma de la Bóveda Suprema)
 * Puzzle cerebral de reflexión y refracción de rayos de luz espectral con espejos y prismas.
 */
class Game9Prisms {
  constructor() {
    this.container = null;
    this.onComplete = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    this.currentChamber = 0; // 0, 1, 2 (3 cámaras)
    this.totalChambers = 3;
    this.isPlaying = false;
    this.isChamberSolved = false;

    // Temporizador para el reto
    this.startTime = 0;
    this.elapsedSeconds = 0;
    this.timerInterval = null;

    // Dimensiones de la cuadrícula
    this.cols = 8;
    this.rows = 7;
    this.tileSize = 52;
    this.gridOffsetX = 102;
    this.gridOffsetY = 24;

    // Herramienta seleccionada ('mirror', 'splitter', 'remove')
    this.selectedTool = 'mirror';

    // Estado de la cámara actual
    this.grid = []; // celdas [c][r]
    this.emitter = { x: 0, y: 3, dx: 1, dy: 0 };
    this.crystals = [];
    this.portals = []; // { a: {x,y}, b: {x,y} }
    this.inventory = {
      mirror: 3,
      splitter: 1
    };

    // Trazado de rayos y partículas
    this.beamSegments = [];
    this.activeCrystalsCount = 0;
    this.particles = [];
    this.hoverTile = null;

    // Definición de las 3 Cámaras
    this.chambers = [
      // ==========================================
      // CÁMARA 1: El Sendero del Reflejo (~2 min)
      // ==========================================
      {
        name: "Cámara I: El Sendero del Reflejo",
        desc: "Divide el rayo espectral y guíalo hacia los dos cristales rúnicos.",
        hint: "Coloca el Prisma Divisor en la fila 3 (columna 2 o 3) para desviar un haz hacia arriba y dejar que el otro continúe hacia la derecha.",
        inventory: { mirror: 3, splitter: 1 },
        emitter: { x: 0, y: 3, dx: 1, dy: 0 },
        crystals: [
          { x: 4, y: 1, name: "Cristal Veneno", active: false },
          { x: 6, y: 5, name: "Cristal Sombra", active: false }
        ],
        obsidian: [
          { x: 3, y: 3 },
          { x: 4, y: 2 },
          { x: 5, y: 4 },
          { x: 2, y: 5 }
        ],
        portals: []
      },

      // ==========================================
      // CÁMARA 2: La Refracción Espectral (~3-4 min)
      // ==========================================
      {
        name: "Cámara II: La Refracción Espectral",
        desc: "Alimenta los 3 cristales distantes esquivando los monolitos oscuros.",
        hint: "Utiliza dos divisores: el primero para desviar el haz hacia la derecha y el segundo para bifurcar el rayo vertical en la parte superior.",
        inventory: { mirror: 4, splitter: 2 },
        emitter: { x: 1, y: 6, dx: 0, dy: -1 }, // Sube desde abajo
        crystals: [
          { x: 1, y: 0, name: "Cristal Mal de Ojo", active: false },
          { x: 6, y: 1, name: "Cristal Hipnosis", active: false },
          { x: 6, y: 5, name: "Cristal Tinieblas", active: false }
        ],
        obsidian: [
          { x: 1, y: 2 },
          { x: 3, y: 1 },
          { x: 4, y: 3 },
          { x: 4, y: 4 },
          { x: 5, y: 2 }
        ],
        portals: []
      },

      // ==========================================
      // CÁMARA 3: El Candado Supremo de la Bóveda (~4-6 min)
      // ==========================================
      {
        name: "Cámara III: El Candado Supremo de la Bóveda",
        desc: "El gran enigma de Gengar. Utiliza el portal de distorsión para activar los 4 cristales supremos.",
        hint: "¡El Portal Alfa teletransporta tu rayo al otro lado de la barrera de obsidiana! Divide el rayo antes del portal y bifurca de nuevo tras la salida.",
        inventory: { mirror: 5, splitter: 3 },
        emitter: { x: 3, y: 3, dx: -1, dy: 0 }, // Dispara hacia la izquierda desde el centro
        crystals: [
          { x: 1, y: 1, name: "Cristal Fantasma", active: false },
          { x: 6, y: 1, name: "Cristal Corona", active: false },
          { x: 1, y: 5, name: "Cristal Ectoplasma", active: false },
          { x: 6, y: 5, name: "Cristal Bóveda", active: false }
        ],
        obsidian: [
          { x: 4, y: 0 },
          { x: 4, y: 1 },
          { x: 4, y: 2 },
          { x: 4, y: 3 },
          { x: 4, y: 4 },
          { x: 4, y: 5 },
          { x: 4, y: 6 }
        ],
        portals: [
          { a: { x: 0, y: 3 }, b: { x: 7, y: 3 } } // Teletransporte de izquierda a derecha
        ]
      }
    ];
  }

  start(container, onComplete) {
    this.cleanup();
    this.container = container;
    this.onComplete = onComplete;
    this.currentChamber = 0;
    this.isPlaying = false;
    this.isChamberSolved = false;
    this.elapsedSeconds = 0;

    this.render();
    this.initCanvas();
    this.loadChamber(this.currentChamber);
  }

  render() {
    this.container.innerHTML = `
      <div class="game-wrapper prisms-game">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">CÁMARA:</span> 
            <span id="prism-chamber-name" class="hud-val">1 / 3</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">CRISTALES ACTIVOS:</span> 
            <span id="prism-crystals-count" class="hud-val">0 / 2</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">TIEMPO:</span> 
            <span id="prism-timer" class="hud-val">00:00</span>
          </div>
        </div>

        <p class="game-instruction" id="prism-chamber-desc">
          Coloca y gira los espejos y prismas de obsidiana para guiar el rayo espectral hacia todos los cristales a la vez.
        </p>

        <div class="flappy-canvas-wrap prisms-canvas-wrap">
          <canvas id="prisms-canvas" width="620" height="420"></canvas>
          <div id="prisms-start-overlay" class="canvas-overlay">
            <div class="overlay-box">
              <span class="overlay-icon">🗝️</span>
              <h3 style="color:#ffffff; font-size:1.3rem;">EL ALTAR DE LOS PRISMAS ESPECTRALES</h3>
              <p>El Candado Supremo de la Bóveda de Gengar requiere ingenio y deducción.</p>
              <p>Resuelve las <strong>3 cámaras rúnicas</strong> guiando la luz hacia los cristales sagrados.</p>
              <button class="btn-spectral" id="btn-start-prisms">¡Comenzar el Enigma!</button>
            </div>
          </div>
        </div>

        <!-- Barra de Herramientas e Inventario -->
        <div class="prisms-toolbar">
          <div class="inventory-group">
            <button class="tool-btn active" id="tool-mirror" data-tool="mirror">
              <span class="tool-icon">🪞</span>
              <span class="tool-name">Espejo (90°)</span>
              <span class="tool-badge" id="badge-mirror">x3</span>
            </button>
            <button class="tool-btn" id="tool-splitter" data-tool="splitter">
              <span class="tool-icon">🔮</span>
              <span class="tool-name">Prisma Divisor</span>
              <span class="tool-badge" id="badge-splitter">x1</span>
            </button>
            <button class="tool-btn tool-remove" id="tool-remove" data-tool="remove">
              <span class="tool-icon">✖</span>
              <span class="tool-name">Quitar Pieza</span>
            </button>
          </div>

          <div class="actions-group">
            <button class="btn-spectral btn-secondary btn-mini" id="btn-hint-gengar" title="Pedir una pista a Gengar">
              💡 Pista
            </button>
            <button class="btn-spectral btn-secondary btn-mini" id="btn-reset-chamber" title="Reiniciar cámara actual">
              🔄 Reiniciar
            </button>
          </div>
        </div>

        <div class="prisms-help-hint">
          <span>💡 <em>Haz clic sobre una pieza colocada para rotarla 90°. Haz clic derecho o usa "Quitar" para devolverla al inventario.</em></span>
        </div>
      </div>
    `;

    document.getElementById('btn-start-prisms')?.addEventListener('click', () => {
      this.beginPuzzle();
    });

    // Tool selector
    const toolBtns = this.container.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedTool = btn.dataset.tool;
      });
    });

    // Pista de Gengar
    document.getElementById('btn-hint-gengar')?.addEventListener('click', () => {
      const ch = this.chambers[this.currentChamber];
      if (ch && ch.hint) {
        window.spectralAudio?.playGengarLaugh?.();
        alert(`👻 GENGAR TE SUSURRA:\n\n"${ch.hint}"`);
      }
    });

    // Reiniciar cámara
    document.getElementById('btn-reset-chamber')?.addEventListener('click', () => {
      this.loadChamber(this.currentChamber);
    });
  }

  initCanvas() {
    this.canvas = document.getElementById('prisms-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Click handler en el canvas
    this.handleCanvasClick = (e) => {
      if (!this.isPlaying || this.isChamberSolved) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const tile = this.getTileAt(mx, my);
      if (!tile) return;

      this.onTileClicked(tile.c, tile.r, e.button === 2);
    };

    // Prevenir menú contextual para clic derecho (usado para quitar pieza)
    this.handleContextMenu = (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const tile = this.getTileAt(mx, my);
      if (tile) {
        this.removePieceAt(tile.c, tile.r);
      }
    };

    this.handleMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      this.hoverTile = this.getTileAt(mx, my);
    };

    this.canvas.addEventListener('click', this.handleCanvasClick);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
  }

  getTileAt(x, y) {
    if (
      x < this.gridOffsetX ||
      x >= this.gridOffsetX + this.cols * this.tileSize ||
      y < this.gridOffsetY ||
      y >= this.gridOffsetY + this.rows * this.tileSize
    ) {
      return null;
    }
    const c = Math.floor((x - this.gridOffsetX) / this.tileSize);
    const r = Math.floor((y - this.gridOffsetY) / this.tileSize);
    return { c, r };
  }

  loadChamber(index) {
    this.currentChamber = index;
    this.isChamberSolved = false;
    const ch = this.chambers[index];

    // Clonar inventario
    this.inventory = { ...ch.inventory };
    this.emitter = { ...ch.emitter };
    this.crystals = ch.crystals.map(cr => ({ ...cr, active: false }));
    this.portals = ch.portals || [];

    // Inicializar rejilla vacía
    this.grid = [];
    for (let c = 0; c < this.cols; c++) {
      this.grid[c] = [];
      for (let r = 0; r < this.rows; r++) {
        this.grid[c][r] = null;
      }
    }

    // Colocar obsidiana
    ch.obsidian.forEach(obs => {
      this.grid[obs.x][obs.y] = { type: 'obsidian' };
    });

    // Colocar emisor
    this.grid[this.emitter.x][this.emitter.y] = {
      type: 'emitter',
      dx: this.emitter.dx,
      dy: this.emitter.dy
    };

    // Colocar cristales
    this.crystals.forEach(cr => {
      this.grid[cr.x][cr.y] = { type: 'crystal', ref: cr };
    });

    // Colocar portales si existen
    this.portals.forEach(port => {
      this.grid[port.a.x][port.a.y] = { type: 'portal', target: port.b, id: 'A' };
      this.grid[port.b.x][port.b.y] = { type: 'portal', target: port.a, id: 'B' };
    });

    this.updateHUD();
    this.recalculateLaser();
  }

  beginPuzzle() {
    const overlay = document.getElementById('prisms-start-overlay');
    if (overlay) overlay.style.display = 'none';

    this.isPlaying = true;
    this.startTime = Date.now();
    this.loadChamber(0);

    // Iniciar reloj
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isPlaying) return;
      this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      const mins = String(Math.floor(this.elapsedSeconds / 60)).padStart(2, '0');
      const secs = String(this.elapsedSeconds % 60).padStart(2, '0');
      const timerEl = document.getElementById('prism-timer');
      if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    }, 1000);

    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  updateHUD() {
    const ch = this.chambers[this.currentChamber];
    const nameEl = document.getElementById('prism-chamber-name');
    const descEl = document.getElementById('prism-chamber-desc');
    const badgeMirror = document.getElementById('badge-mirror');
    const badgeSplitter = document.getElementById('badge-splitter');

    if (nameEl) nameEl.textContent = `${this.currentChamber + 1} / ${this.totalChambers}`;
    if (descEl && ch) descEl.textContent = ch.desc;
    if (badgeMirror) badgeMirror.textContent = `x${this.inventory.mirror}`;
    if (badgeSplitter) badgeSplitter.textContent = `x${this.inventory.splitter}`;

    this.updateCrystalCountHUD();
  }

  updateCrystalCountHUD() {
    const countEl = document.getElementById('prism-crystals-count');
    if (countEl) {
      countEl.textContent = `${this.activeCrystalsCount} / ${this.crystals.length}`;
    }
  }

  onTileClicked(c, r, isRightClick = false) {
    if (isRightClick || this.selectedTool === 'remove') {
      this.removePieceAt(c, r);
      return;
    }

    const current = this.grid[c][r];

    // Si ya hay una pieza colocada por el jugador (espejo o divisor), girarla 90°
    if (current && (current.type === 'mirror' || current.type === 'splitter')) {
      current.rotation = (current.rotation + 1) % 4;
      window.spectralAudio?.playMirrorRotate?.();
      this.spawnSparkles(
        this.gridOffsetX + c * this.tileSize + this.tileSize / 2,
        this.gridOffsetY + r * this.tileSize + this.tileSize / 2,
        '#a855f7'
      );
      this.recalculateLaser();
      return;
    }

    // Si la celda está ocupada por obstáculos o emisor, no hacer nada
    if (current) return;

    // Intentar colocar la pieza seleccionada del inventario
    if (this.selectedTool === 'mirror' && this.inventory.mirror > 0) {
      this.inventory.mirror--;
      this.grid[c][r] = {
        type: 'mirror',
        rotation: 0 // 0: /, 1: \, 2: /, 3: \ (con distintas facetas)
      };
      window.spectralAudio?.playMirrorRotate?.();
      this.updateHUD();
      this.recalculateLaser();
    } else if (this.selectedTool === 'splitter' && this.inventory.splitter > 0) {
      this.inventory.splitter--;
      this.grid[c][r] = {
        type: 'splitter',
        rotation: 0 // 4 direcciones de desvío
      };
      window.spectralAudio?.playMirrorRotate?.();
      this.updateHUD();
      this.recalculateLaser();
    }
  }

  removePieceAt(c, r) {
    const item = this.grid[c][r];
    if (!item) return;

    if (item.type === 'mirror') {
      this.grid[c][r] = null;
      this.inventory.mirror++;
      window.spectralAudio?.playBlip?.();
      this.updateHUD();
      this.recalculateLaser();
    } else if (item.type === 'splitter') {
      this.grid[c][r] = null;
      this.inventory.splitter++;
      window.spectralAudio?.playBlip?.();
      this.updateHUD();
      this.recalculateLaser();
    }
  }

  // ==========================================
  // MOTOR DE CÁLCULO DE LÁSER (RAYCASTER 2D)
  // ==========================================
  recalculateLaser() {
    this.beamSegments = [];
    // Resetear cristales
    this.crystals.forEach(cr => { cr.active = false; });

    // Cola de haces inicial desde el emisor
    const rayQueue = [{
      x: this.emitter.x,
      y: this.emitter.y,
      dx: this.emitter.dx,
      dy: this.emitter.dy,
      color: '#c084fc',
      steps: 0
    }];

    const maxSteps = 45;

    while (rayQueue.length > 0) {
      const ray = rayQueue.shift();
      let cx = ray.x;
      let cy = ray.y;
      let cdx = ray.dx;
      let cdy = ray.dy;
      let steps = ray.steps;

      while (steps < maxSteps) {
        steps++;
        const nextX = cx + cdx;
        const nextY = cy + cdy;

        // Fuera de la cuadrícula
        if (nextX < 0 || nextX >= this.cols || nextY < 0 || nextY >= this.rows) {
          this.beamSegments.push({
            x1: cx, y1: cy,
            x2: nextX, y2: nextY,
            color: ray.color
          });
          break;
        }

        const cell = this.grid[nextX][nextY];

        // Segmento de haz trazado
        this.beamSegments.push({
          x1: cx, y1: cy,
          x2: nextX, y2: nextY,
          color: ray.color
        });

        cx = nextX;
        cy = nextY;

        if (!cell) {
          // Celda vacía, continúa adelante
          continue;
        }

        // 1. Choca con Obsidiana
        if (cell.type === 'obsidian') {
          break;
        }

        // 2. Choca con Cristal
        if (cell.type === 'crystal') {
          cell.ref.active = true;
          break;
        }

        // 3. Choca con Portal de Distorsión
        if (cell.type === 'portal') {
          const dest = cell.target;
          // Continúa el rayo desde la salida del portal con la misma dirección
          cx = dest.x;
          cy = dest.y;
          this.spawnSparkles(
            this.gridOffsetX + cx * this.tileSize + this.tileSize / 2,
            this.gridOffsetY + cy * this.tileSize + this.tileSize / 2,
            '#38bdf8'
          );
          continue;
        }

        // 4. Choca con Espejo Rúnico
        if (cell.type === 'mirror') {
          // Rotaciones:
          // 0: Espejo Slash '/'
          // 1: Espejo Backslash '\'
          // 2: Espejo Slash '/'
          // 3: Espejo Backslash '\'
          const isSlash = (cell.rotation % 2 === 0);

          if (isSlash) {
            // '/' -> incoming [1,0] -> [0,-1]; incoming [0,1] -> [-1,0]; incoming [-1,0] -> [0,1]; incoming [0,-1] -> [1,0]
            const oldDx = cdx;
            cdx = -cdy;
            cdy = -oldDx;
          } else {
            // '\' -> incoming [1,0] -> [0,1]; incoming [0,1] -> [1,0]; incoming [-1,0] -> [0,-1]; incoming [0,-1] -> [-1,0]
            const oldDx = cdx;
            cdx = cdy;
            cdy = oldDx;
          }
          continue;
        }

        // 5. Choca con Prisma Divisor
        if (cell.type === 'splitter') {
          // El prisma divisor deja pasar un rayo recto y desvía una rama a 90°
          // Rotaciones determinan la desviación:
          // rot 0: divide hacia la derecha
          // rot 1: divide hacia la izquierda
          // rot 2: divide hacia atrás-derecha
          // rot 3: divide hacia atrás-izquierda
          let splitDx = 0;
          let splitDy = 0;

          if (cell.rotation === 0) {
            // Rama lateral gira a la derecha (+90°)
            splitDx = -cdy;
            splitDy = cdx;
          } else if (cell.rotation === 1) {
            // Rama lateral gira a la izquierda (-90°)
            splitDx = cdy;
            splitDy = -cdx;
          } else if (cell.rotation === 2) {
            // Rama lateral 45° inversa
            splitDx = -cdx;
            splitDy = -cdy;
          } else {
            splitDx = cdy;
            splitDy = cdx;
          }

          // Añadir rama bifurcada a la cola
          rayQueue.push({
            x: cx,
            y: cy,
            dx: splitDx,
            dy: splitDy,
            color: '#ec4899',
            steps: steps
          });

          // El rayo original continúa recto
          continue;
        }
      }
    }

    // Contar cristales activos
    this.activeCrystalsCount = this.crystals.filter(c => c.active).length;
    this.updateCrystalCountHUD();

    // Comprobar victoria de la cámara
    if (this.activeCrystalsCount === this.crystals.length && !this.isChamberSolved) {
      this.onChamberCompleted();
    }
  }

  onChamberCompleted() {
    this.isChamberSolved = true;
    window.spectralAudio?.playChamberSolved?.();

    // Chispas en cada cristal
    this.crystals.forEach(cr => {
      this.spawnSparkles(
        this.gridOffsetX + cr.x * this.tileSize + this.tileSize / 2,
        this.gridOffsetY + cr.y * this.tileSize + this.tileSize / 2,
        '#34d399',
        18
      );
    });

    setTimeout(() => {
      if (this.currentChamber + 1 < this.totalChambers) {
        // Siguiente cámara
        this.loadChamber(this.currentChamber + 1);
      } else {
        // ¡Victoria final de los 9 sellos!
        this.win();
      }
    }, 1400);
  }

  spawnSparkles(x, y, color = '#ec4899', count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        alpha: 1.0,
        color,
        radius: Math.random() * 3 + 2
      });
    }
  }

  loop() {
    if (!this.isPlaying) return;

    this.update();
    this.draw();

    this.animId = requestAnimationFrame(this.loop);
  }

  update() {
    // Actualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fondo oscuro con gradiente
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#070210');
    grad.addColorStop(0.7, '#15062a');
    grad.addColorStop(1, '#220840');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dibujar celdas de la cuadrícula
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const x = this.gridOffsetX + c * this.tileSize;
        const y = this.gridOffsetY + r * this.tileSize;

        // Fondo de la loseta de piedra
        this.ctx.fillStyle = (c + r) % 2 === 0 ? 'rgba(23, 9, 45, 0.7)' : 'rgba(15, 6, 32, 0.7)';
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

        // Borde fino de runas
        this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);

        // Celda bajo el cursor
        if (this.hoverTile && this.hoverTile.c === c && this.hoverTile.r === r && this.isPlaying) {
          this.ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
          this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        }
      }
    }

    // Dibujar elementos estáticos y colocados
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const cell = this.grid[c][r];
        if (!cell) continue;

        const x = this.gridOffsetX + c * this.tileSize;
        const y = this.gridOffsetY + r * this.tileSize;
        const cx = x + this.tileSize / 2;
        const cy = y + this.tileSize / 2;

        if (cell.type === 'obsidian') {
          // Bloque de obsidiana sólida
          this.ctx.fillStyle = '#0f051d';
          this.ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
          this.ctx.strokeStyle = '#4c1d95';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);

          // Runa de piedra
          this.ctx.fillStyle = '#6b21a8';
          this.ctx.font = 'bold 16px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('⬛', cx, cy);
        } else if (cell.type === 'emitter') {
          // Emisor de rayo espectral (Orbe de Gengar)
          this.ctx.save();
          this.ctx.shadowColor = '#c084fc';
          this.ctx.shadowBlur = 16;
          this.ctx.fillStyle = '#9333ea';
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, 18, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = '16px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('👁️', cx, cy);
          this.ctx.restore();
        } else if (cell.type === 'crystal') {
          // Cristal rúnico
          const isActive = cell.ref.active;
          this.ctx.save();
          this.ctx.shadowColor = isActive ? '#34d399' : '#ec4899';
          this.ctx.shadowBlur = isActive ? 22 : 8;

          this.ctx.fillStyle = isActive ? '#10b981' : '#831843';
          this.ctx.beginPath();
          // Forma de rombo de cristal
          this.ctx.moveTo(cx, cy - 18);
          this.ctx.lineTo(cx + 14, cy);
          this.ctx.lineTo(cx, cy + 18);
          this.ctx.lineTo(cx - 14, cy);
          this.ctx.closePath();
          this.ctx.fill();

          this.ctx.strokeStyle = isActive ? '#a7f3d0' : '#f43f5e';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();

          // Núcleo brillante si está activo
          if (isActive) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.restore();
        } else if (cell.type === 'portal') {
          // Portal de distorsión
          this.ctx.save();
          this.ctx.shadowColor = '#38bdf8';
          this.ctx.shadowBlur = 18;
          this.ctx.fillStyle = '#0284c7';
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, 16, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = '16px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('🌀', cx, cy);
          this.ctx.restore();
        } else if (cell.type === 'mirror') {
          // Espejo Rúnico de 90°
          this.ctx.save();
          this.ctx.translate(cx, cy);

          // Fondo del soporte de espejo
          this.ctx.fillStyle = 'rgba(88, 28, 135, 0.8)';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#c084fc';
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();

          // Superficie reflectante diagonal según rotación
          const isSlash = (cell.rotation % 2 === 0);
          this.ctx.strokeStyle = '#38bdf8';
          this.ctx.lineWidth = 4;
          this.ctx.shadowColor = '#38bdf8';
          this.ctx.shadowBlur = 10;
          this.ctx.beginPath();
          if (isSlash) {
            this.ctx.moveTo(-14, 14);
            this.ctx.lineTo(14, -14);
          } else {
            this.ctx.moveTo(-14, -14);
            this.ctx.lineTo(14, 14);
          }
          this.ctx.stroke();

          this.ctx.restore();
        } else if (cell.type === 'splitter') {
          // Prisma Divisor
          this.ctx.save();
          this.ctx.translate(cx, cy);

          this.ctx.shadowColor = '#f43f5e';
          this.ctx.shadowBlur = 12;
          this.ctx.fillStyle = '#be123c';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#fda4af';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();

          // Símbolo de bifurcación
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = '14px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('🔮', 0, 0);

          this.ctx.restore();
        }
      }
    }

    // Dibujar haces de luz espectral (LÁSER NEÓN)
    this.ctx.save();
    this.beamSegments.forEach(seg => {
      const x1 = this.gridOffsetX + seg.x1 * this.tileSize + this.tileSize / 2;
      const y1 = this.gridOffsetY + seg.y1 * this.tileSize + this.tileSize / 2;
      const x2 = this.gridOffsetX + seg.x2 * this.tileSize + this.tileSize / 2;
      const y2 = this.gridOffsetY + seg.y2 * this.tileSize + this.tileSize / 2;

      // Resplandor exterior
      this.ctx.strokeStyle = seg.color;
      this.ctx.lineWidth = 5.5;
      this.ctx.shadowColor = seg.color;
      this.ctx.shadowBlur = 18;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();

      // Núcleo blanco brillante central
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.8;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    });
    this.ctx.restore();

    // Dibujar partículas
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Marco exterior de la arena
    this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(6, 6, this.canvas.width - 12, this.canvas.height - 12);
  }

  win() {
    this.isPlaying = false;
    if (this.timerInterval) clearInterval(this.timerInterval);

    window.spectralAudio?.playVictoryFanfare?.();
    setTimeout(() => {
      if (this.onComplete) this.onComplete();
    }, 700);
  }

  cleanup() {
    this.isPlaying = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleCanvasClick);
      this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    }
  }
}

window.Game9Prisms = Game9Prisms;
