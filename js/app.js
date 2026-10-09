/**
 * Punto de entrada principal (app.js)
 */
document.addEventListener('DOMContentLoaded', () => {
  // Iniciar partículas de fondo
  window.bgCanvas = new SpectralBackground('spectral-bg-canvas');

  // Iniciar gestor de juego
  window.gameManager = new GameManager();
  window.gameManager.initUI();

  console.log("%c👻 ¡Web de Cumpleaños de Gengar lista! 👻", "color: #c084fc; font-size: 16px; font-weight: bold;");
});
