/* =========================================================================
   Impulsa — DATA LAYER
   -------------------------------------------------------------------------
   This is the ONLY file you need to edit to change the market data.
   Everything here is a curated, editable educational model (not live data).

   Each country has:
     - base:    baseline market attractiveness 0–100
     - monthly: 12 seasonal offsets (Jan..Dec) added to `base`
     - factors: the 5 weighted factors shown in the "How it works" section
     - note:    a short bilingual explanation

   The final Opportunity Index for a month =
        clamp( base + monthly[monthIndex], 40, 99 )
   ========================================================================= */

const REGIONS = [
  { id: "all",     en: "All regions",   es: "Todas las regiones" },
  { id: "na",      en: "North America", es: "Norteamérica" },
  { id: "latam",   en: "Latin America", es: "Latinoamérica" },
  { id: "europe",  en: "Europe",        es: "Europa" },
  { id: "asiapac", en: "Asia-Pacific",  es: "Asia-Pacífico" },
];

/* Seasonal offsets are indexed Jan(0) .. Dec(11).
   Northern-hemisphere business markets dip in mid-summer (Jul/Aug) and peak
   around new-year and Q4. Southern-hemisphere markets (AR, CL, BR, AU) are
   the opposite: their summer holidays fall in Dec–Feb, so they stay strong
   mid-year. India spikes near its fiscal year-end (Mar) and Diwali (Oct). */

const COUNTRIES = [
  {
    code: "US", region: "na", flag: "🇺🇸",
    name: { en: "United States", es: "Estados Unidos" },
    base: 88,
    monthly: [10, 7, 6, 3, 2, -5, -12, -10, 10, 9, 11, 1],
    factors: { size: 98, power: 95, elearning: 92, culture: 96, },
    note: {
      en: "The world's largest sales-training market. Peaks at new-year kickoffs and the Q4 budget push; quiet in the summer holidays.",
      es: "El mayor mercado de formación en ventas del mundo. Sus picos son el arranque de año y el empuje presupuestario del Q4; se calma en las vacaciones de verano.",
    },
  },
  {
    code: "CA", region: "na", flag: "🇨🇦",
    name: { en: "Canada", es: "Canadá" },
    base: 79,
    monthly: [7, 5, 6, 1, 0, -5, -12, -11, 8, 7, 9, 2],
    factors: { size: 74, power: 88, elearning: 86, culture: 80 },
    note: {
      en: "Stable, high-trust market that mirrors the U.S. cycle. Strong digital adoption and English/French bilingual demand.",
      es: "Mercado estable y de alta confianza que sigue el ciclo de EE. UU. Fuerte adopción digital y demanda bilingüe inglés/francés.",
    },
  },
  {
    code: "MX", region: "latam", flag: "🇲🇽",
    name: { en: "Mexico", es: "México" },
    base: 82,
    monthly: [7, 6, 4, -3, 3, 1, -5, -4, 8, 7, 10, 9],
    factors: { size: 86, power: 70, elearning: 78, culture: 88 },
    note: {
      en: "The anchor of the Spanish-speaking market: huge, sales-driven and hungry for online training. The year-end 'aguinaldo' season lifts demand.",
      es: "El ancla del mercado hispanohablante: enorme, orientado a la venta y ávido de formación online. La temporada del aguinaldo a fin de año eleva la demanda.",
    },
  },
  {
    code: "CO", region: "latam", flag: "🇨🇴",
    name: { en: "Colombia", es: "Colombia" },
    base: 78,
    monthly: [6, 5, 5, -2, 4, 2, -3, -2, 7, 6, 8, 5],
    factors: { size: 74, power: 62, elearning: 74, culture: 84 },
    note: {
      en: "One of Latin America's fastest-growing e-learning hubs, with a young, entrepreneurial and highly sales-oriented workforce.",
      es: "Uno de los polos de e-learning de mayor crecimiento en Latinoamérica, con una fuerza laboral joven, emprendedora y muy orientada a la venta.",
    },
  },
  {
    code: "AR", region: "latam", flag: "🇦🇷",
    name: { en: "Argentina", es: "Argentina" },
    base: 72,
    monthly: [-13, -8, 7, 9, 7, 4, 3, 5, 8, 6, 1, -7],
    factors: { size: 70, power: 55, elearning: 80, culture: 82 },
    note: {
      en: "Southern-hemisphere market: quiet during the Dec–Feb summer break, then very active from autumn onward. Exceptional digital talent.",
      es: "Mercado del hemisferio sur: tranquilo en el verano de diciembre a febrero y muy activo desde el otoño. Talento digital excepcional.",
    },
  },
  {
    code: "CL", region: "latam", flag: "🇨🇱",
    name: { en: "Chile", es: "Chile" },
    base: 74,
    monthly: [-12, -7, 8, 9, 6, 5, 4, 5, 7, 5, 0, -6],
    factors: { size: 58, power: 72, elearning: 82, culture: 78 },
    note: {
      en: "Small but high-income and digitally advanced. Business ramps up strongly after the southern summer, mid-year is prime season.",
      es: "Pequeño pero de altos ingresos y muy digital. La actividad se dispara tras el verano austral; la mitad del año es su mejor temporada.",
    },
  },
  {
    code: "BR", region: "latam", flag: "🇧🇷",
    name: { en: "Brazil", es: "Brasil" },
    base: 81,
    monthly: [-11, -6, 6, 8, 6, 4, 3, 4, 7, 6, 2, -5],
    factors: { size: 90, power: 64, elearning: 76, culture: 86 },
    note: {
      en: "The giant of the south. Massive market that stays hot mid-year while the north is on holiday — often the top pick in winter months (Jun–Aug).",
      es: "El gigante del sur. Mercado enorme que se mantiene caliente a mitad de año mientras el norte descansa; suele ser el número uno en junio–agosto.",
    },
  },
  {
    code: "ES", region: "europe", flag: "🇪🇸",
    name: { en: "Spain", es: "España" },
    base: 80,
    monthly: [8, 6, 7, 3, 2, -4, -10, -14, 9, 8, 8, 4],
    factors: { size: 72, power: 80, elearning: 79, culture: 76 },
    note: {
      en: "The European gateway to Spanish content. Strong most of the year, but August almost shuts down — plan launches for September.",
      es: "La puerta europea al contenido en español. Fuerte casi todo el año, aunque agosto casi se paraliza: planifica los lanzamientos para septiembre.",
    },
  },
  {
    code: "GB", region: "europe", flag: "🇬🇧",
    name: { en: "United Kingdom", es: "Reino Unido" },
    base: 84,
    monthly: [8, 6, 7, 3, 2, -5, -9, -12, 9, 9, 9, 3],
    factors: { size: 80, power: 90, elearning: 88, culture: 85 },
    note: {
      en: "A premium English-language market with deep corporate training budgets and very high online-course adoption.",
      es: "Mercado premium en inglés, con presupuestos corporativos de formación sólidos y altísima adopción de cursos online.",
    },
  },
  {
    code: "DE", region: "europe", flag: "🇩🇪",
    name: { en: "Germany", es: "Alemania" },
    base: 76,
    monthly: [7, 6, 6, 2, 1, -4, -9, -12, 8, 8, 7, 3],
    factors: { size: 82, power: 92, elearning: 80, culture: 70 },
    note: {
      en: "Europe's economic engine. Buyers are methodical and value certification and proof — great for structured, credentialed programs.",
      es: "El motor económico de Europa. Los compradores son metódicos y valoran la certificación y la evidencia: ideal para programas estructurados y acreditados.",
    },
  },
  {
    code: "IN", region: "asiapac", flag: "🇮🇳",
    name: { en: "India", es: "India" },
    base: 83,
    monthly: [6, 8, 13, 3, 1, -3, -4, 2, 6, 12, 9, 2],
    factors: { size: 95, power: 50, elearning: 85, culture: 84 },
    note: {
      en: "A vast, fast-digitizing market. Demand surges before the March fiscal year-end and again around the Diwali season in October–November.",
      es: "Un mercado enorme y en plena digitalización. La demanda se dispara antes del cierre fiscal de marzo y de nuevo en la temporada de Diwali (octubre–noviembre).",
    },
  },
  {
    code: "AU", region: "asiapac", flag: "🇦🇺",
    name: { en: "Australia", es: "Australia" },
    base: 75,
    monthly: [-11, -6, 7, 8, 6, 4, 3, 5, 7, 6, 2, -6],
    factors: { size: 62, power: 90, elearning: 87, culture: 78 },
    note: {
      en: "High-income, English-speaking and digitally mature. Southern-hemisphere calendar keeps it strong during the northern summer lull.",
      es: "De altos ingresos, angloparlante y digitalmente maduro. Su calendario del hemisferio sur lo mantiene fuerte durante la pausa del verano boreal.",
    },
  },
];

/* ---- Courses --------------------------------------------------------- */
const COURSES = [
  {
    icon: "🚀", level: { en: "Beginner", es: "Principiante" },
    duration: { en: "6 weeks", es: "6 semanas" }, price: "$149",
    title: { en: "Fundamentals of Selling", es: "Fundamentos de la Venta" },
    desc: {
      en: "Master the mindset, the pitch and the psychology of a first 'yes'.",
      es: "Domina la mentalidad, el discurso y la psicología del primer 'sí'.",
    },
    points: {
      en: ["Prospecting & first contact", "Building trust fast", "Handling early objections"],
      es: ["Prospección y primer contacto", "Generar confianza rápido", "Manejo de objeciones iniciales"],
    },
  },
  {
    icon: "🎯", level: { en: "Intermediate", es: "Intermedio" },
    duration: { en: "8 weeks", es: "8 semanas" }, price: "$249",
    title: { en: "Consultative & B2B Selling", es: "Venta Consultiva y B2B" },
    desc: {
      en: "Sell solutions, not products. Win larger, longer business deals.",
      es: "Vende soluciones, no productos. Gana negocios más grandes y duraderos.",
    },
    points: {
      en: ["Discovery & needs analysis", "Value-based proposals", "Managing decision-makers"],
      es: ["Descubrimiento y análisis de necesidades", "Propuestas basadas en valor", "Gestión de decisores"],
    },
  },
  {
    icon: "🤝", level: { en: "Advanced", es: "Avanzado" },
    duration: { en: "6 weeks", es: "6 semanas" }, price: "$299",
    title: { en: "Closing & Negotiation Mastery", es: "Cierre y Negociación" },
    desc: {
      en: "Turn interest into signatures with confident, win-win closing.",
      es: "Convierte el interés en firmas con cierres seguros y de ganar-ganar.",
    },
    points: {
      en: ["Reading buying signals", "Price & terms negotiation", "Closing techniques that stick"],
      es: ["Leer señales de compra", "Negociación de precio y términos", "Técnicas de cierre que perduran"],
    },
  },
  {
    icon: "🌎", level: { en: "Specialization", es: "Especialización" },
    duration: { en: "5 weeks", es: "5 semanas" }, price: "$329",
    title: { en: "Cross-Border Selling", es: "Ventas Internacionales" },
    desc: {
      en: "Adapt your offer to each culture, currency and buying season.",
      es: "Adapta tu oferta a cada cultura, moneda y temporada de compra.",
    },
    points: {
      en: ["Reading the Opportunity Index", "Cultural selling styles", "Timing launches by market"],
      es: ["Leer el Índice de Oportunidad", "Estilos de venta por cultura", "Programar lanzamientos por mercado"],
    },
  },
];

/* ---- Helper: opportunity index for a country in a given month -------- */
function opportunityIndex(country, monthIndex) {
  const raw = country.base + country.monthly[monthIndex];
  return Math.max(40, Math.min(99, Math.round(raw)));
}
