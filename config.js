// Configuración de la app del hito de cierre PBV 2026.
// Después de desplegar el Apps Script, pega aquí la URL del despliegue (termina en /exec).
window.HITO_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbz9H4Mse2vCQO_Xcseis7P0nsPgppSsFCu5XPOVgnbuLduiGkIcMJkO01U7kYZ9lIW0Kw/exec",

  // Cada cuántos milisegundos se actualizan el tendedero y el resumen.
  REFRESH_MS: 6000,

  // Largo máximo de cada respuesta.
  MAX_CHARS: 160,

  // Tarjetas visibles por cuerda en el tendedero (las más recientes).
  MAX_TARJETAS_POR_TEMA: 12,

  // Momentos de la actividad, cada uno con su propio tiempo en el reloj del relator.
  // "tema" enlaza el momento con una cuerda del tendedero (se destaca mientras corre).
  // Los minutos son una propuesta: ajústalos según la agenda del hito.
  MOMENTOS: [
    { id: "responder", emoji: "📱", titulo: "Responder en el celular", min: 4 },
    { id: "logro", emoji: "🏆", titulo: "Conversemos: Logros 2026", min: 5, tema: "logro" },
    { id: "mejora", emoji: "🔧", titulo: "Conversemos: Retos y mejoras", min: 5, tema: "mejora" },
    { id: "sueno", emoji: "🌱", titulo: "Conversemos: 2027", min: 5, tema: "sueno" }
  ],

  TIENDAS: {
    envigado: { nombre: "Envigado", emoji: "🌸" },
    cali: { nombre: "Cali", emoji: "🌴" },
    bogota: { nombre: "Bogotá", emoji: "🏙️" }
  },

  TEMAS: [
    {
      id: "logro", num: 1, emoji: "🏆", titulo: "Logros 2026", corto: "Logros",
      pregunta: "¿Qué logramos juntos en 2026?",
      ayuda: "Un momento, un resultado o algo que te dio orgullo.",
      ejemplos: ["Ver a los niños felices en la actividad", "Vender en la feria y conseguir nuevos clientes", "Conocer a la comunidad del barrio"],
      color: "#0058A3", texto: "#FFFFFF"
    },
    {
      id: "mejora", num: 2, emoji: "🔧", titulo: "Retos y oportunidades de mejora", corto: "Retos",
      pregunta: "¿Qué retos tuvimos y qué podemos mejorar?",
      ayuda: "Algo que costó o que podríamos hacer distinto.",
      ejemplos: ["Avisar las fechas con más tiempo", "Una mejor ubicación para la feria", "Que más coworkers puedan participar"],
      color: "#FFDB00", texto: "#111111"
    },
    {
      id: "sueno", num: 3, emoji: "🌱", titulo: "Así nos proyectamos 2027", corto: "2027",
      pregunta: "¿Qué queremos que pase en 2027?",
      ayuda: "Lo que sueñas para el próximo año del Plan Buen Vecino.",
      ejemplos: ["Llegar a más barrios", "Una feria en cada temporada", "Que las fundaciones propongan actividades"],
      color: "#2F8F5B", texto: "#FFFFFF"
    }
  ],

  // El equipo CliO no participa como rol.
  ROLES: [
    { id: "Voluntario/a IKEA", emoji: "🙋" },
    { id: "Emprendedor/a", emoji: "🛍️" },
    { id: "Fundación o aliado", emoji: "🤝" },
    { id: "IKEA Colombia", emoji: "💙" },
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
