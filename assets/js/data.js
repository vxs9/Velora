/* ==========================================================================
   ÁUREA — Configuración y catálogo inicial
   --------------------------------------------------------------------------
   EDITÁ ESTE ARCHIVO PARA PERSONALIZAR TU TIENDA (o usá el Panel del creador
   dentro de la página, que guarda los cambios en este navegador).

   - CONFIG.creatorEmail: el email que tiene acceso al Panel del creador.
   - CONFIG.currency: símbolo de moneda que se muestra en los precios.
   - CONFIG.checkoutUrl: cuando tengas tu link de pago general (Mercado Pago,
     Stripe o PayPal), pegalo acá y el botón "Pagar" llevará ahí.
   - PRODUCTS: catálogo inicial. Cada producto puede tener su propio
     "paymentLink" (link de pago individual) que tiene prioridad.
   ========================================================================== */

var CONFIG = {
  storeName: "Áurea",
  creatorEmail: "vicente.empres4@gmail.com",
  currency: "$",            // pesos chilenos
  checkoutUrl: "", // ej: "https://mpago.la/xxxxxx" o "https://buy.stripe.com/xxxxxx"
  contactEmail: "vicente.empres4@gmail.com",
  // Nota de envío que ven los clientes (la tienda despacha desde Batuco, RM):
  shippingNote: "📦 Envío a todo Chile: 1–2 días hábiles en la RM, 2–5 días en regiones."
};

/*
  Catálogo inicial de ejemplo, armado con categorías que funcionan muy bien
  en tiendas online chicas (alta demanda, buen margen, fácil de enviar).
  Reemplazá estos productos por los tuyos desde el Panel del creador.

  Campos:
    id          — único, no repetir
    name        — nombre del producto
    category    — categoría (arma los filtros automáticamente)
    price       — precio actual (número)
    oldPrice    — precio anterior (opcional; si existe, aparece en Ofertas)
    emoji       — ícono que se muestra si no hay imagen
    image       — URL de imagen (opcional, ej. https://...)
    desc        — descripción corta
    stock       — unidades disponibles (0 = agotado)
    paymentLink — link de pago individual (opcional)
    providerLink — link del proveedor (Temu/AliExpress/etc.); privado,
                   solo se ve en el Panel del creador
    rating      — valoración del producto (0 a 5). IMPORTANTE: los valores de
                  abajo son de EJEMPLO, típicos de estas categorías. Cuando
                  cargues tus productos reales, copiá la valoración real del
                  listing de tu proveedor (editable en el Panel del creador).
    ratingCount — cantidad de valoraciones que muestra ese listing
    cost        — costo por unidad pagado al proveedor (privado; se usa para
                  calcular las ganancias en el panel de Gestión)
*/
var PRODUCTS = [
  {
    id: "p1",
    cost: 12000,
    rating: 4.7,
    ratingCount: 2341,
    name: "Auriculares inalámbricos Pro",
    category: "Tecnología",
    price: 34999,
    oldPrice: 42999,
    emoji: "🎧",
    image: "",
    desc: "Cancelación de ruido, estuche de carga y 24 h de batería.",
    stock: 15,
    paymentLink: ""
  },
  {
    id: "p2",
    cost: 16000,
    rating: 4.6,
    ratingCount: 1876,
    name: "Smartwatch Serie S",
    category: "Tecnología",
    price: 45999,
    oldPrice: 0,
    emoji: "⌚",
    image: "",
    desc: "Monitor de ritmo cardíaco, sueño y notificaciones del celular.",
    stock: 10,
    paymentLink: ""
  },
  {
    id: "p3",
    cost: 6500,
    rating: 4.8,
    ratingCount: 3120,
    name: "Lámpara LED ambiente",
    category: "Hogar",
    price: 18999,
    oldPrice: 24999,
    emoji: "💡",
    image: "",
    desc: "Luz cálida regulable con control táctil. Transforma cualquier espacio.",
    stock: 20,
    paymentLink: ""
  },
  {
    id: "p4",
    cost: 5500,
    rating: 4.7,
    ratingCount: 1543,
    name: "Difusor aromático premium",
    category: "Hogar",
    price: 15999,
    oldPrice: 0,
    emoji: "🕯️",
    image: "",
    desc: "Difusor ultrasónico con luz suave. Incluye set de 3 esencias.",
    stock: 18,
    paymentLink: ""
  },
  {
    id: "p5",
    cost: 7500,
    rating: 4.6,
    ratingCount: 987,
    name: "Set de skincare esencial",
    category: "Cuidado personal",
    price: 21999,
    oldPrice: 27999,
    emoji: "🧴",
    image: "",
    desc: "Limpiador, sérum de vitamina C y crema hidratante. Rutina completa.",
    stock: 25,
    paymentLink: ""
  },
  {
    id: "p6",
    cost: 4500,
    rating: 4.8,
    ratingCount: 4215,
    name: "Botella térmica 750 ml",
    category: "Cuidado personal",
    price: 12999,
    oldPrice: 0,
    emoji: "🥤",
    image: "",
    desc: "Acero inoxidable, 12 h frío / 6 h calor. Diseño minimalista.",
    stock: 30,
    paymentLink: ""
  },
  {
    id: "p7",
    cost: 3500,
    rating: 4.7,
    ratingCount: 1298,
    name: "Collar minimalista bañado en oro",
    category: "Accesorios",
    price: 16999,
    oldPrice: 21999,
    emoji: "✨",
    image: "",
    desc: "Cadena fina con dije geométrico. Hipoalergénico, con estuche regalo.",
    stock: 12,
    paymentLink: ""
  },
  {
    id: "p8",
    cost: 5000,
    rating: 4.6,
    ratingCount: 856,
    name: "Billetera slim de cuero",
    category: "Accesorios",
    price: 14999,
    oldPrice: 0,
    emoji: "👜",
    image: "",
    desc: "Cuero genuino con protección RFID. Elegante y compacta.",
    stock: 16,
    paymentLink: ""
  },
  {
    id: "p9",
    cost: 3000,
    rating: 4.8,
    ratingCount: 2764,
    name: "Banda elástica fitness (set x5)",
    category: "Fitness",
    price: 9999,
    oldPrice: 13999,
    emoji: "💪",
    image: "",
    desc: "Cinco niveles de resistencia con bolsa de transporte y guía de rutinas.",
    stock: 40,
    paymentLink: ""
  },
  {
    id: "p10",
    cost: 6000,
    rating: 4.7,
    ratingCount: 1432,
    name: "Esterilla de yoga antideslizante",
    category: "Fitness",
    price: 17999,
    oldPrice: 0,
    emoji: "🧘",
    image: "",
    desc: "6 mm de espesor, material ecológico, con correa para llevarla.",
    stock: 14,
    paymentLink: ""
  }
];
