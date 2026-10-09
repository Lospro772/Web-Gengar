/**
 * Configuración central de la Web de Cumpleaños de Gengar
 * Personalizado para TUKI 🎂👻
 */
window.GENGAR_CONFIG = {
  // Datos del cumpleañero
  friend: {
    name: "Tuki",
    nickname: "Tuki, Maestro Fantasma",
    age: 25,
    favoritePokemon: "Gengar",
  },

  // Mensaje especial y dedicatoria para la Bóveda Final
  birthdayLetter: {
    title: "¡FELIZ CUMPLEAÑOS, TUKI!",
    subtitle: "Has conquistado la Torre Sombría y superado todas las travesuras de Gengar",
    body: [
      "¡Muchísimas felicidades en tu día especial, Tuki! 🎂👻",
      "Espero que este nuevo año de vida venga cargado de momentos brutales, risas, partidazas y anécdotas inolvidables.",
      "Gracias por ser un amigo tan genial en todas las aventuras. ¡Disfruta a tope de tu regalo y de este día tan especial!",
    ],
    signature: "Con mucho cariño, tus amigos",
  },

  // Configuración de la sorpresa desbloqueada al abrir la Bóveda
  surpriseReward: {
    badge: "🎁 SIGUIENTE SORPRESA DESBLOQUEADA",
    title: "✨ ¡HAS DESBLOQUEADO LA SIGUIENTE SORPRESA! ✨",
    subtitle: "Has roto todos los sellos rúnicos de la Torre Sombría de Gengar",
    messages: [
      "¡Enhorabuena, Tuki! Has demostrado una astucia y habilidad increíbles superando cada uno de los 9 enigmas espectrales.",
      "La magia de Gengar ha quebrado el último sello... ¡pero la sorpresa definitiva te espera más allá de esta pantalla!",
      "👀 ¡Avisa ahora mismo a tus amigos para que te pasen el video secreto y la gran sorpresa que han preparado para ti!",
      "¡Diles que has completado la Torre al 100% para reclamar tu recompensa en este instante!"
    ],
    claimButtonText: "📣 ¡Avisar a mis Amigos para Recibir el Video!",
    secretCode: "TUKI-SOMBRA-2026",
    claimMessage: "¡Transmisión completada! Gengar les ha susurrado a tus amigos que ya eres digno del video secreto. ¡Pídeselo ya! 🎉😈"
  },

  // Preguntas del Quiz (Reto 5)
  quizQuestions: [
    {
      question: "¿Cuál es la combinación de tipos elemental de Gengar?",
      options: [
        "Fantasma / Veneno",
        "Fantasma / Siniestro",
        "Fantasma Puro",
        "Fantasma / Dragón"
      ],
      correctIndex: 0,
      gengarReactionCorrect: "¡Jejeje, acertaste! Sabes bien con qué veneno te estás metiendo...",
      gengarReactionWrong: "¡Buuu! ¿En serio? ¡Pensaba que me conocías mejor!",
    },
    {
      question: "¿Qué movimiento clásico usa Gengar para dejar a sus rivales dormidos y luego devorar sus sueños?",
      options: [
        "Rayo Confuso",
        "Hipnosis + Come Sueños",
        "Bola Sombra",
        "Mal de Ojo"
      ],
      correctIndex: 1,
      gengarReactionCorrect: "¡Exacto! ¡Espero que no te duermas en tu propia fiesta, Tuki!",
      gengarReactionWrong: "¡Error garrafal! ¡Te falta estudiar la Pokédex de Kanto!",
    },
    {
      question: "¿Por qué hoy es el día más legendario de todo el año?",
      options: [
        "Porque subió el precio del pan",
        "Porque Gengar aprendió un nuevo ataque",
        "¡Porque es el cumpleaños de Tuki, el más grande!",
        "Porque llovió en Pueblo Paleta"
      ],
      correctIndex: 2,
      gengarReactionCorrect: "¡¡CLARO QUE SÍ!! ¡Hoy se celebra el cumpleaños de Tuki a lo grande!",
      gengarReactionWrong: "¿Cómo que no es tu cumple, Tuki? ¡No te hagas el humilde!",
    },
    {
      question: "¿Qué objeto legendario se necesita para desatar el poder de Mega-Gengar en combate?",
      options: [
        "Piedra Noche",
        "Gengarita",
        "Baya Meloc",
        "Caramelo Raro"
      ],
      correctIndex: 1,
      gengarReactionCorrect: "¡¡BRUTAL!! ¡La Gengarita despierta el verdadero poder del tercer ojo!",
      gengarReactionWrong: "¡Error garrafal! ¡Con eso no vas a megaevolucionar a nadie!",
    }
  ],

  // Diálogos de Gengar adaptados para Tuki
  dialogues: {
    welcome: "¡Kekekeke! ¿Creías que tu regalo de cumpleaños te lo iba a dar en bandeja de plata, Tuki? ¡Bienvenido a mi Reino de las Sombras! Supera mis 9 pruebas o el regalo quedará atrapado en el vacío espectral para siempre...",
    challenge1_start: "Prueba 1: Mis sombras se mueven a la velocidad del rayo. ¡A ver esos reflejos, Tuki! ¡Atrápame 10 veces si puedes!",
    challenge1_win: "¡Vaya reflejos, Tuki! No está nada mal para un mortal. Has roto el 1er Sello.",
    challenge2_start: "Prueba 2: El Mundo Distorsión confunde la mente. Encuentra todas las parejas ocultas en las cartas.",
    challenge2_win: "¡Memoria prodigiosa, Tuki! El 2do Sello se ha disuelto en la niebla.",
    challenge3_start: "Prueba 3: Mi ataque Hipnosis tiene ritmo. Repite exactamente las secuencias de movimientos que haga.",
    challenge3_win: "¡Impresionante sentido del ritmo! El 3er Sello ha caído.",
    challenge4_start: "Prueba 4: La Torre Lavanda está llena de espíritus inquietos. ¡Ayúdame a volar y esquivar los obstáculos, Tuki!",
    challenge4_win: "¡Un vuelo digno de un maestro! Has desbloqueado el 4to Sello.",
    challenge5_start: "Prueba 5: ¡Mi estómago fantasmal ruge de hambre de fiesta! ¡Atrapa las tartas y dulces espectrales antes de que caigan!",
    challenge5_win: "¡Menudo festín, Tuki! Ese dulce estaba delicioso. El 5to Sello ha caído.",
    challenge6_start: "Prueba 6: Un muro de lápidas y runas mágicas bloquea el paso. ¡Haz rebotar la Bola Sombra y quiebra los bloques!",
    challenge6_win: "¡Poderoso rebote! Las lápidas se han hecho añicos. El 6to Sello se ha roto.",
    challenge7_start: "Prueba 7: Demuestra tu intelecto en el Quiz de la Cripta. ¿Conoces los secretos fantasma, Tuki?",
    challenge7_win: "¡Brillante sabiduría! El 7mo Sello ha sido destruido.",
    challenge8_start: "Prueba 8: El Candado Rúnico de Cristales protege el umbral supremo. ¡Demuestra tu puntería disparando Bolas Sombra!",
    challenge8_win: "¡Increíble puntería, Tuki! Los cristales han caído... ¡pero ahora viene mi enigma supremo!",
    challenge9_start: "EL RETO DEFINITIVO: El Altar de los Prismas Espectrales. ¡Usa tu intelecto para alinear la luz y romper el candado supremo!",
    challenge9_win: "¡¡NO PUEDE SER!! ¡Tuki ha descifrado el enigma del altar! ¡Todos mis 9 sellos han caído! ¡La Bóveda de tu Cumpleaños se abre ante ti!",
  }
};
