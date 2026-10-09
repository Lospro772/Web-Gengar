/**
 * Fondo Espectral Interactivo: Partículas y Niebla de Sombra de Gengar
 */
class SpectralBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000, radius: 140 };
    this.numParticles = 45;
    this.animationId = null;

    this.resize = this.resize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.animate = this.animate.bind(this);

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('mousemove', this.onMouseMove);

    // Crear partículas espectrales
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push(this.createParticle());
    }

    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  createParticle(fromBottom = false) {
    const isSpecial = Math.random() < 0.2; // 20% son orbes de sombra más grandes
    return {
      x: Math.random() * this.canvas.width,
      y: fromBottom ? this.canvas.height + 20 : Math.random() * this.canvas.height,
      radius: isSpecial ? Math.random() * 8 + 6 : Math.random() * 3.5 + 1.5,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -Math.random() * 0.9 - 0.3,
      alpha: Math.random() * 0.6 + 0.2,
      color: Math.random() < 0.75 
        ? 'rgba(168, 85, 247, ' // Púrpura neón
        : (Math.random() < 0.5 ? 'rgba(239, 68, 68, ' : 'rgba(236, 72, 153, '), // Carmesí / Rosa
      pulseSpeed: Math.random() * 0.03 + 0.01,
      angle: Math.random() * Math.PI * 2
    };
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Movimiento vertical flotante
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.angle) * 0.3;
      p.angle += p.pulseSpeed;

      // Interacción con ratón (repulsión suave)
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.mouse.radius) {
        const force = (1 - dist / this.mouse.radius) * 2;
        p.x -= (dx / dist) * force;
        p.y -= (dy / dist) * force;
      }

      // Reaparecer al salir de pantalla
      if (p.y < -20 || p.x < -20 || p.x > this.canvas.width + 20) {
        this.particles[i] = this.createParticle(true);
      }

      // Dibujar brillo espectral
      const currentAlpha = p.alpha * (0.7 + Math.sin(p.angle) * 0.3);
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.5);
      gradient.addColorStop(0, p.color + currentAlpha + ')');
      gradient.addColorStop(0.5, p.color + (currentAlpha * 0.4) + ')');
      gradient.addColorStop(1, p.color + '0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.animationId = requestAnimationFrame(this.animate);
  }
}

window.SpectralBackground = SpectralBackground;
