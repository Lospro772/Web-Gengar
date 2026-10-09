# 👻 El Reino Sombrío de Gengar - Web de Cumpleaños Interactiva

¡Bienvenido a la web de cumpleaños temática de **Gengar**! Una experiencia interactiva con estética de neón y sombras violetas donde el cumpleañero debe superar **8 minijuegos progresivos** para romper los sellos de la Torre Sombría y desbloquear su video regalo sorpresa.

---

## 🎮 Los 9 Retos de la Torre

1. **⚡ Sello #1: Atrapa a Gengar (*Whack-a-Gengar / Reflejos*)**
   - Gengar asoma por 9 portales oscuros. ¡Atrápalo 10 veces antes de que se agote el tiempo!
2. **👁️ Sello #2: Memoria del Más Allá (*Cartas 3D*)**
   - Tablero con 12 cartas 3D (Gastly, Haunter, Gengar, Mega-Gengar, G-Max Gengar y Bola Sombra).
3. **🔮 Sello #3: Hipnosis de Ritmo (*Simón Dice Espectral*)**
   - 4 ataques luminosos de Gengar (Bola Sombra, Lengüetazo, Rayo Confuso y Tinieblas).
4. **🦇 Sello #4: Flappy Gengar (*Arcade en la Torre Lavanda*)**
   - Controla a Gengar volando con Clic o Barra Espaciadora esquivando lápidas y torres espectrales a toda velocidad.
5. **🍰 Sello #5: El Banquete Come-Sueños (*Arcade Glotón*)**
   - Mueve a Gengar por la base para devorar tartas de cumpleaños, caramelos raros y orbes esquivando trampas.
6. **🧱 Sello #6: Rebote Espectral (*Rompe-Lápidas / Arkanoid*)**
   - Haz rebotar la Bola Sombra contra lápidas y cofres con power-ups de lengua larga, multiball y fuego fatuo.
7. **📜 Sello #7: El Quiz de la Cripta (*Trivia con Humor*)**
   - Preguntas sobre Pokémon y anécdotas con reacciones cómicas de Gengar ante fallos y aciertos.
8. **👑 Sello #8: Ruptura del Sello Sombrío (*Boss Battle - Puntería de Bola Sombra*)**
   - Apunta y dispara Bolas Sombra para quebrar los 5 cristales rúnicos del candado supremo esquivando escudos giratorios.
9. **🗝️ Sello #9: El Altar de los Prismas Espectrales (*Gran Enigma Final Cerebral*)**
   - El candado supremo de la cripta: 3 cámaras de deducción y física de luz. Coloca y gira espejos y prismas divisores para refractar el haz espectral y activar simultáneamente todos los cristales sagrados. *(Soluciones completas documentadas en [`SOLUCION_ENIGMA_PRISMAS.md`](file:///d:/Webs/WebGengar/SOLUCION_ENIGMA_PRISMAS.md))*.

---

## 🎁 El Gran Final: La Bóveda del Regalo

Al derrotar al Boss Final:
- ¡Lluvia de confeti de partículas y fanfarria triunfal!
- Se revela el cofre mítico abierto con Gengar, tarta y globos.
- **Reproductor de Video Temático:** Diseñado especialmente con el estilo de Gengar.
- **Carta de Felicitación:** Un pergamino con dedicatoria personal.

---

## ⚙️ Cómo Personalizar la Web para tu Amigo

Todo se configura fácilmente en el archivo **[`js/config.js`](file:///d:/Webs/WebGengar/js/config.js)**:

### 1. Cambiar el Nombre y Edad del Amigo
Edita la sección `friend`:
```javascript
friend: {
  name: "Carlos", // Pon aquí el nombre de tu amigo
  nickname: "Maestro Fantasma",
  age: 26,
}
```
*(También puedes cambiar el nombre en vivo pulsando el botón ✏️ junto a su nombre en la cabecera).*

### 2. Cambiar la Siguiente Sorpresa Desbloqueada
En `js/config.js`, edita la sección `surpriseReward`:
```javascript
surpriseReward: {
  badge: "🎁 SIGUIENTE SORPRESA DESBLOQUEADA",
  title: "✨ ¡HAS DESBLOQUEADO LA SIGUIENTE SORPRESA! ✨",
  subtitle: "Has roto todos los sellos rúnicos de la Torre Sombría de Gengar",
  messages: [
    "¡Enhorabuena, Tuki! Has demostrado una astucia y habilidad increíbles...",
    "La magia de Gengar ha quebrado el último sello...",
    "👀 ¡Avisa ahora mismo a tus amigos para que te pasen el video secreto!",
    "¡Diles que has completado la Torre al 100% para reclamar tu recompensa!"
  ],
  claimButtonText: "📣 ¡Avisar a mis Amigos para Recibir el Video!",
  secretCode: "TUKI-SOMBRA-2026",
  claimMessage: "¡Transmisión completada! Gengar les ha susurrado a tus amigos que ya eres digno del video secreto. ¡Pídeselo ya! 🎉😈"
}
```

### 3. Cambiar la Carta de Felicitación
Edita la sección `birthdayLetter` en `js/config.js`:
```javascript
birthdayLetter: {
  title: "¡FELIZ CUMPLEAÑOS, [NOMBRE]!",
  subtitle: "Has conquistado la Torre Sombría...",
  body: [
    "Tu mensaje personalizado aquí...",
    "Otra dedicatoria o recuerdo gracioso..."
  ],
  signature: "Con mucho cariño, [Tus Nombres]"
}
```

---

## 🔒 Sistema de Seguridad y Clave Maestra (Base de Datos SQLite)

Por defecto, **no hay ningún botón visible para saltarse los retos ni trucos en pantalla** para evitar que tu amigo se salte la experiencia.

Si como creador necesitas desbloquear los niveles o saltar un reto:
1. **Protección Local:** La contraseña maestra se almacena cifrada (`SHA-256` con *salt* criptográfico) en una base de datos local SQLite (`gengar_vault.db`). El archivo `.db` está **bloqueado a nivel de servidor** (código 403 Forbidden), por lo que nadie puede descargarlo ni ver la clave inspeccionando el código fuente o DevTools.
2. **Cómo abrir el panel secreto del creador:**
   - Haz **5 clics rápidos seguidos** sobre el avatar de Gengar en la cabecera, o bien haz clic sobre el ojo secreto 👁️ en el pie de página.
   - Se abrirá la ventana: *"SELLO SECRETO DEL CREADOR"*.
   - Introduce tu contraseña maestra. El servidor consultará SQLite en tiempo real y, si coincide, te permitirá:
     - *Completar el sello actual.*
     - *Desbloquear todos los 6 sellos y abrir la bóveda inmediatamente.*

### 🔑 Contraseña por Defecto y Cómo Cambiarla
* **Contraseña inicial:** `GengarMaestro2026!`
* **Cómo cambiar tu contraseña a cualquier otra:**
  Abre una terminal en la carpeta del proyecto y ejecuta:
  ```bash
  node set_password.js "TuNuevaContraseñaSuperSecreta"
  ```
  Esto actualizará el hash y la sal en la base de datos local al instante.

