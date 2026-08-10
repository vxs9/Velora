/* ==========================================================================
   VELORA — Configuración y catálogo inicial
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
  storeName: "Velora",
  creatorEmail: "pedidosvelora@gmail.com",
  currency: "$",            // pesos chilenos
  checkoutUrl: "", // ej: "https://mpago.la/xxxxxx" o "https://buy.stripe.com/xxxxxx"
  contactEmail: "pedidosvelora@gmail.com",
  // Nota de envío que ven los clientes (la tienda despacha desde Batuco, RM):
  shippingNote: "📦 Envío a todo Chile: 1–2 días hábiles en la RM, 2–5 días en regiones.",
  // Datos para pago por transferencia bancaria. Completalos y se mostrarán
  // al cliente al confirmar el pedido. Dejalo en "" para ocultar la opción.
  // Ejemplo: "Banco Estado · CuentaRUT · N° 12345678 · RUT 12.345.678-9 ·
  //           A nombre de Juan Pérez · Enviá el comprobante a pedidosvelora@gmail.com"
  transferInfo: "",
  // Promoción de lanzamiento: código de descuento y % que rebaja.
  // Cambiá el código cuando quieras; dejá promoCode en "" para apagarla.
  promoCode: "VELORA10",
  promoPct: 10,
  promoBanner: "🎁 10% OFF en tu primera compra con el código VELORA10 · Envío a todo Chile",
  // Garantía que se muestra al pagar (genera confianza en tienda nueva):
  guaranteeNote: "✔ Garantía Velora: si tu producto llega con cualquier problema, lo cambiamos o te devolvemos tu dinero.",
  // Usuario de Instagram (sin @). Aparece en el pie de página y en Contacto.
  instagram: "velora.perfumes.cl"
};

/*
  Catálogo enfocado en lo que Velora realmente va a tener en stock:
  perfumes árabes (proveedor: M Perfumes, catálogo de WhatsApp), Tubbees,
  y la línea de crecimiento capilar (la "necesidad": caída del pelo).

  Los costos de perfumería son los del catálogo de M Perfumes menos el
  descuento mayorista de $3.000; ajustalos con la factura real al comprar.

  Campos:
    id          — único, no repetir
    name        — nombre del producto
    category    — categoría (arma los filtros automáticamente)
    price       — precio actual (número)
    oldPrice    — precio anterior (opcional; si existe, aparece en Ofertas)
    emoji       — ícono que se muestra si no hay foto
    image       — URL de imagen (opcional, ej. https://...)
    desc        — descripción corta
    stock       — unidades disponibles (0 = agotado)
    paymentLink — link de pago individual (opcional)
    providerLink — link del proveedor; privado, solo en el Panel del creador
    rating      — valoración del producto (0 a 5), la del mercado/listing
    ratingCount — cantidad de valoraciones de referencia
    cost        — costo por unidad (privado; calcula las ganancias en Gestión)
    colors      — variantes de color (opcional)
    barcode     — código de barras para el escáner de stock (opcional)
*/
var PRODUCTS = [
  /* ---------- PERFUMERÍA (proveedor: M Perfumes · wa.me/c/56978792710) ---------- */
  {
    id: "p20",
    name: "Set Lattafa Yara · EDP 100 ml + Spray 200 ml",
    category: "Perfumería",
    price: 32990,
    oldPrice: 0,
    cost: 22990,
    rating: 4.8,
    ratingCount: 5240,
    emoji: "🎁",
    image: "",
    desc: "El perfume árabe más vendido de Chile en set de regalo: dulce, cremoso y dura todo el día.",
    stock: 2,
    colors: [],
    paymentLink: "",
    providerLink: "https://wa.me/c/56978792710"
  },
  {
    id: "p21",
    name: "Set Lattafa Asad · EDP 100 ml + Spray 200 ml",
    category: "Perfumería",
    price: 30990,
    oldPrice: 0,
    cost: 21990,
    rating: 4.8,
    ratingCount: 2140,
    emoji: "🎁",
    image: "",
    desc: "El favorito de los hombres en formato regalo: intenso, elegante y con presencia.",
    stock: 2,
    colors: [],
    paymentLink: "",
    providerLink: "https://wa.me/c/56978792710"
  },
  {
    id: "p13",
    name: "Lattafa Khamrah EDP 100 ml",
    category: "Perfumería",
    price: 30990,
    oldPrice: 0,
    cost: 22990,
    rating: 4.7,
    ratingCount: 3115,
    emoji: "🥃",
    image: "",
    desc: "Especiado y dulce, unisex. Uno de los árabes más pedidos para regalo.",
    stock: 0,
    colors: [],
    paymentLink: "",
    providerLink: "https://wa.me/c/56978792710"
  },
  {
    id: "p28",
    name: "Lattafa Qaed Al Fursan Untamed EDP 90 ml",
    category: "Perfumería",
    price: 21990,
    oldPrice: 0,
    cost: 13990,
    rating: 4.7,
    ratingCount: 1900,
    emoji: "🐎",
    image: "",
    desc: "Frutal ahumado con piña y maderas: presencia total a precio imbatible.",
    stock: 1,
    colors: [],
    paymentLink: "",
    providerLink: "https://wa.me/c/56978792710"
  },
  {
    id: "p29",
    name: "French Avenue Vulcan Sable EDP 100 ml",
    category: "Perfumería",
    price: 35990,
    oldPrice: 0,
    cost: 26990,
    rating: 4.8,
    ratingCount: 1300,
    emoji: "🐍",
    image: "",
    desc: "Nicho árabe premium: dulce especiado con caramelo y cuero. Elegancia pura.",
    stock: 1,
    colors: [],
    paymentLink: "",
    providerLink: "https://wa.me/c/56978792710"
  },
  {
    id: "p30",
    name: "Lattafa Bade'e Al Oud Honor & Glory EDP 100 ml",
    category: "Perfumería",
    price: 28990,
    oldPrice: 0,
    cost: 20990,
    rating: 4.7,
    ratingCount: 2600,
    emoji: "🏆",
    image: "",
    desc: "Blanco y dorado, elegante total: oud cremoso con dulzor suave. Unisex y adictivo.",
    stock: 1,
    colors: [],
    paymentLink: "",
    providerLink: "https://wa.me/c/56978792710"
  },
  {
    id: "p22",
    name: "Lattafa Asad EDP 100 ml",
    category: "Perfumería",
    price: 26990,
    oldPrice: 0,
    cost: 18990,
    rating: 4.8,
    ratingCount: 3900,
    emoji: "🦁",
    image: "",
    desc: "El #1 masculino de Lattafa: café, pimienta y ámbar. Compliment magnet.",
    stock: 2,
    colors: [],
    paymentLink: "",
    providerLink: "https://wa.me/c/56978792710"
  },
  {
    id: "p23",
    name: "Lattafa Mayar EDP 100 ml",
    category: "Perfumería",
    price: 30990,
    oldPrice: 0,
    cost: 22990,
    rating: 4.7,
    ratingCount: 1820,
    emoji: "🌺",
    image: "",
    desc: "Floral frutal femenino, elegante y fresco. El segundo favorito de las clientas.",
    stock: 0,
    colors: [],
    paymentLink: "",
    providerLink: "https://wa.me/c/56978792710"
  },
  {
    id: "p24",
    name: "Set Lattafa Eclaire · EDP 100 ml + Spray 200 ml",
    category: "Perfumería",
    price: 37990,
    oldPrice: 0,
    cost: 27990,
    rating: 4.7,
    ratingCount: 960,
    emoji: "🍮",
    image: "",
    desc: "Caramelo y vainilla cremosa: el dulce viral de TikTok en set de regalo.",
    stock: 1,
    colors: [],
    paymentLink: "",
    providerLink: "https://wa.me/c/56978792710"
  },
  {
    id: "p25",
    name: "Tubbees Body Spray · aromas dulces",
    category: "Perfumería",
    price: 8990,
    oldPrice: 0,
    cost: 5000,
    rating: 4.6,
    ratingCount: 740,
    emoji: "🍭",
    image: "",
    desc: "Los sprays virales que huelen a postre: Cookies & Cream, Candy Pop, Bubble Gum y más.",
    stock: 12,
    colors: [],
    paymentLink: "",
    providerLink: "https://wa.me/c/56978792710"
  },
  {
    id: "p11",
    name: "Armaf Mandarin Sky · Body Spray 200 ml",
    category: "Perfumería",
    price: 11990,
    oldPrice: 14990,
    cost: 6500,
    rating: 4.8,
    ratingCount: 1856,
    emoji: "🍊",
    image: "",
    desc: "El viral de TikTok: la fragancia del perfume en formato desodorante. Inspirado en Scandal Pour Homme.",
    stock: 0,
    colors: [],
    paymentLink: "",
    providerLink: "https://vypmayorista.cl/producto/armaf-desodorante-mandarin-sky-hombre-200-ml/"
  },

  /* ---------- CUIDADO CAPILAR (la necesidad: caída y crecimiento del pelo) ---------- */
  {
    id: "p26",
    name: "Aceite de Romero para Crecimiento Capilar",
    category: "Cuidado capilar",
    price: 9990,
    oldPrice: 12990,
    cost: 2000,
    rating: 4.7,
    ratingCount: 3240,
    emoji: "🌿",
    image: "",
    desc: "El viral #1 contra la caída del pelo: fortalece, estimula crecimiento y da brillo. Uso diario.",
    stock: 10,
    colors: [],
    paymentLink: "",
    providerLink: "https://es.aliexpress.com/w/wholesale-aceite-romero-crecimiento-cabello.html"
  },
  {
    id: "p27",
    name: "Kit Crecimiento Capilar · aceite + derma roller + cepillo",
    category: "Cuidado capilar",
    price: 21990,
    oldPrice: 0,
    cost: 5500,
    rating: 4.8,
    ratingCount: 1560,
    emoji: "🌱",
    image: "",
    desc: "La rutina completa: aceite de romero, derma roller capilar y cepillo masajeador de cuero cabelludo.",
    stock: 8,
    colors: [],
    paymentLink: "",
    providerLink: "https://es.aliexpress.com/w/wholesale-derma-roller-capilar.html"
  },

  /* ---------- COMPLEMENTO DE REGALO ---------- */
  {
    id: "p7",
    name: "Collar minimalista bañado en oro",
    category: "Accesorios",
    price: 16999,
    oldPrice: 21999,
    cost: 3500,
    rating: 4.7,
    ratingCount: 1298,
    emoji: "✨",
    image: "",
    desc: "Cadena fina con dije geométrico. Hipoalergénico, con estuche regalo.",
    stock: 0,
    colors: ["Dorado"],
    paymentLink: "",
    providerLink: "https://es.aliexpress.com/w/wholesale-collar-chapado-oro-18k-mujer.html"
  }
];
