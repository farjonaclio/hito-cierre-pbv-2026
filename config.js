// Configuración de la app del hito de cierre PBV 2026.
// Después de desplegar el Apps Script, pega aquí la URL del despliegue (termina en /exec).
window.HITO_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbz9H4Mse2vCQO_Xcseis7P0nsPgppSsFCu5XPOVgnbuLduiGkIcMJkO01U7kYZ9lIW0Kw/exec",

  // Cada cuántos milisegundos se actualizan el tendedero y el tablero.
  REFRESH_MS: 6000,

  // Largo máximo de cada respuesta.
  MAX_CHARS: 160,

  // Minutos del reloj de cuenta regresiva en el proyector.
  TIEMPO_MIN: 3,

  // Tarjetas visibles por cuerda en el tendedero (las más recientes).
  MAX_TARJETAS_POR_TEMA: 12,

  TIENDAS: {
    envigado: { nombre: "Envigado", emoji: "🌸" },
    cali: { nombre: "Cali", emoji: "🌴" },
    bogota: { nombre: "Bogotá", emoji: "🏙️" }
  },

  TEMAS: [
    {
      id: "logro", num: 1, emoji: "🏆", titulo: "Logros 2026", sub: "Lo que pasó",
      pregunta: "¿Qué logramos juntos en 2026?",
      ayuda: "Piensa en un momento, un resultado o algo que te dio orgullo.",
      ejemplos: ["Ver a los niños felices en la actividad", "Vender en la feria y conseguir nuevos clientes", "Conocer a la comunidad del barrio"],
      color: "#0058A3", texto: "#FFFFFF"
    },
    {
      id: "mejora", num: 2, emoji: "🔧", titulo: "Retos y oportunidades de mejora", sub: "Lo que nos costó",
      pregunta: "¿Qué retos tuvimos y qué podemos mejorar?",
      ayuda: "Algo que casi no pasa o que podríamos hacer distinto.",
      ejemplos: ["Avisar las fechas con más tiempo", "Una mejor ubicación para la feria", "Que más coworkers puedan participar"],
      color: "#FFDB00", texto: "#111111"
    },
    {
      id: "sueno", num: 3, emoji: "🌱", titulo: "Así nos proyectamos 2027", sub: "Lo que queremos que pase",
      pregunta: "¿Qué queremos que pase en 2027?",
      ayuda: "Lo que sueñas para el próximo año del Plan Buen Vecino.",
      ejemplos: ["Llegar a más barrios", "Una feria en cada temporada", "Que las fundaciones propongan actividades"],
      color: "#2F8F5B", texto: "#FFFFFF"
    }
  ],

  ROLES: [
    { id: "Voluntario/a IKEA", emoji: "🙋" },
    { id: "Emprendedor/a", emoji: "🛍️" },
    { id: "Fundación o aliado", emoji: "🤝" },
    { id: "Equipo IKEA", emoji: "💙" },
    { id: "Equipo CliO", emoji: "📊" },
    { id: "Otro", emoji: "✨" }
  ],

  EXPERIENCIA: [
    { v: 1, emoji: "😞", txt: "Mala" },
    { v: 2, emoji: "🙁", txt: "Regular" },
    { v: 3, emoji: "😐", txt: "Normal" },
    { v: 4, emoji: "🙂", txt: "Buena" },
    { v: 5, emoji: "🤩", txt: "¡Excelente!" }
  ],

  // Texto de autorización para quienes ponen su nombre. Validar con el área legal antes de usar.
  AUTORIZACION:
    "Autorizo mostrar mi nombre en esta actividad y en su registro (Ley 1581 de 2012)."
};
