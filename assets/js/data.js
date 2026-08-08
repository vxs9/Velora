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
  transferInfo: ""
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
    providerLink: "https://es.aliexpress.com/w/wholesale-auriculares-tws-bluetooth.html",
    colors: ["Negro","Blanco"],
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
    providerLink: "https://es.aliexpress.com/w/wholesale-smartwatch-mujer-hombre.html",
    colors: ["Negro","Rosa","Azul"],
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
    id: "p4",
    providerLink: "https://es.aliexpress.com/w/wholesale-difusor-aromas-ultrasonico.html",
    colors: ["Blanco","Beige"],
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
    providerLink: "https://es.aliexpress.com/w/wholesale-serum-vitamina-c-skincare-set.html",
    colors: [],
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
    providerLink: "https://es.aliexpress.com/w/wholesale-botella-termica-750ml-acero.html",
    colors: ["Negro","Blanco","Celeste"],
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
    providerLink: "https://es.aliexpress.com/w/wholesale-collar-chapado-oro-18k-mujer.html",
    colors: ["Dorado"],
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
    providerLink: "https://es.aliexpress.com/w/wholesale-billetera-rfid-slim-cuero.html",
    colors: ["Negro","Café"],
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
    providerLink: "https://es.aliexpress.com/w/wholesale-bandas-resistencia-set-5.html",
    colors: [],
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
    providerLink: "https://es.aliexpress.com/w/wholesale-esterilla-yoga-tpe-6mm.html",
    colors: ["Morado","Verde","Rosa"],
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
  },
  {
    id: "p11",
    providerLink: "https://vypmayorista.cl/producto/armaf-desodorante-mandarin-sky-hombre-200-ml/",
    colors: [],
    cost: 6500,
    rating: 4.8,
    ratingCount: 1856,
    name: "Armaf Mandarin Sky · Body Spray 200 ml",
    category: "Perfumería",
    price: 11990,
    oldPrice: 14990,
    emoji: "🍊",
    image: "",
    desc: "El viral de TikTok: la fragancia del perfume en formato desodorante. Inspirado en Scandal Pour Homme.",
    stock: 20,
    paymentLink: ""
  },
  {
    id: "p12",
    providerLink: "https://www.multimarcasmayorista.cl/marcas-1/lattafa",
    colors: [],
    cost: 15000,
    rating: 4.8,
    ratingCount: 5240,
    name: "Lattafa Yara EDP 100 ml",
    category: "Perfumería",
    price: 27990,
    oldPrice: 0,
    emoji: "🌸",
    image: "",
    desc: "El perfume árabe más vendido de Chile: dulce, cremoso y dura todo el día.",
    stock: 12,
    paymentLink: ""
  },
  {
    id: "p13",
    providerLink: "https://productosdelujo.cl/collections/lattafa-perfumes-arabes",
    colors: [],
    cost: 19000,
    rating: 4.7,
    ratingCount: 3115,
    name: "Lattafa Khamrah EDP 100 ml",
    category: "Perfumería",
    price: 34990,
    oldPrice: 39990,
    emoji: "🥃",
    image: "",
    desc: "Especiado y dulce, unisex. Uno de los árabes más pedidos para regalo.",
    stock: 10,
    paymentLink: ""
  }
];