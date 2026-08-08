/* ==========================================================================
   VELORA — Lógica de la tienda
   Carrito, cuentas de usuario, panel del creador, checkout y privacidad.
   Sin dependencias externas: todo corre en el navegador del visitante.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Almacenamiento seguro (localStorage puede fallar) ---------- */
  var store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    del: function (key) {
      try { localStorage.removeItem(key); } catch (e) { /* sin acceso */ }
    }
  };

  var KEYS = {
    products: "aurea_products",
    cart: "aurea_cart",
    users: "aurea_users",
    session: "aurea_session",
    reviews: "aurea_reviews",
    moves: "aurea_moves"
  };

  /* ---------- Utilidades ---------- */
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function money(n) {
    var num = Number(n) || 0;
    return CONFIG.currency + " " + num.toLocaleString("es-CL", { maximumFractionDigits: 2 });
  }

  /* Estrellas con relleno proporcional (ej: 4.7 pinta el 94% en dorado). */
  function starsHTML(rating) {
    var pct = Math.max(0, Math.min(5, Number(rating) || 0)) / 5 * 100;
    return '<span class="stars" aria-label="' + esc(rating) + ' de 5">' +
      '<span class="stars-bg">★★★★★</span>' +
      '<span class="stars-fg" style="width:' + pct + '%">★★★★★</span></span>';
  }

  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 2600);
  }

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  /* ---------- Catálogo (semilla + cambios del creador) ---------- */
  function getProducts() {
    var saved = store.get(KEYS.products, null);
    if (Array.isArray(saved) && saved.length) return saved;
    return PRODUCTS;
  }
  function saveProducts(list) { store.set(KEYS.products, list); }

  function findProduct(id) {
    var list = getProducts();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* ---------- Opiniones de clientes por producto ---------- */
  function getReviews(pid) {
    var all = store.get(KEYS.reviews, {});
    return Array.isArray(all[pid]) ? all[pid] : [];
  }

  function saveReviews(pid, list) {
    var all = store.get(KEYS.reviews, {});
    all[pid] = list;
    store.set(KEYS.reviews, all);
  }

  /* Valoración a mostrar: mezcla la del proveedor con las opiniones locales. */
  function displayRating(p) {
    var base = Number(p.rating) || 0;
    var baseCount = Math.max(0, Math.floor(Number(p.ratingCount) || 0));
    var local = getReviews(p.id);
    var count = baseCount + local.length;
    if (!count) return null;
    var sum = base * baseCount;
    for (var i = 0; i < local.length; i++) sum += Number(local[i].stars) || 0;
    return { rating: Math.round((sum / count) * 10) / 10, count: count };
  }

  /* ==========================================================================
     GESTIÓN: movimientos de stock (ventas / ingresos / ajustes) y ganancias
     --------------------------------------------------------------------------
     Cada movimiento: { date: "YYYY-MM-DD", id, name, type, qty, price, cost }
     type: "venta" (sale), "ingreso" (restock), "ajuste" (manual correction)
     ========================================================================== */
  function getMoves() { return store.get(KEYS.moves, []); }

  function addMove(m) {
    var list = getMoves();
    list.push(m);
    store.set(KEYS.moves, list);
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  /* % de stock restante respecto del último ingreso (baseline maxStock). */
  function stockPct(p) {
    var max = Number(p.maxStock) || Number(p.stock) || 0;
    if (!max) return 0;
    return Math.round((Number(p.stock) / max) * 100);
  }

  function lowStockProducts() {
    return getProducts().filter(function (p) {
      var max = Number(p.maxStock) || 0;
      return max > 0 && Number(p.stock) / max <= 0.30;
    });
  }

  function notifyLowStock() {
    if (!isCreator()) return;
    var low = lowStockProducts();
    if (low.length) {
      toast("⚠ Stock bajo (≤30%): " + low.map(function (p) { return p.name; }).join(", "));
    }
  }

  /* Registra una venta: baja stock y guarda el movimiento con precio y costo. */
  function recordSale(id, qty, silent) {
    var list = getProducts().slice();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        var p = list[i];
        if (p.maxStock == null) p.maxStock = Number(p.stock) || 0;
        var sold = Math.min(qty, Number(p.stock) || 0);
        if (sold <= 0) return;
        p.stock = Number(p.stock) - sold;
        saveProducts(list);
        addMove({
          date: today(), id: p.id, name: p.name, type: "venta",
          qty: sold, price: Number(p.price) || 0, cost: Number(p.cost) || 0
        });
        if (!silent) notifyLowStock();
        return;
      }
    }
  }

  /* Registra un ingreso de stock: sube stock y resetea la base del 30%. */
  function recordIntake(id, qty, newCost) {
    var list = getProducts().slice();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        var p = list[i];
        p.stock = (Number(p.stock) || 0) + qty;
        p.maxStock = Number(p.stock);
        if (newCost > 0) p.cost = newCost;
        saveProducts(list);
        addMove({
          date: today(), id: p.id, name: p.name, type: "ingreso",
          qty: qty, price: Number(p.price) || 0, cost: Number(p.cost) || 0
        });
        return;
      }
    }
  }

  /* ---------- Estado ---------- */
  var state = {
    category: "Todo",
    search: "",
    cart: store.get(KEYS.cart, {}),          // { productId: cantidad }
    session: store.get(KEYS.session, null)   // { email, name }
  };

  /* ==========================================================================
     CATÁLOGO Y OFERTAS
     ========================================================================== */
  function categories() {
    var cats = ["Todo"];
    getProducts().forEach(function (p) {
      if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category);
    });
    return cats;
  }

  function renderChips() {
    $("#categoryChips").innerHTML = categories().map(function (c) {
      return '<button class="chip' + (state.category === c ? " active" : "") +
        '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
    }).join("");
  }

  function cardHTML(p) {
    var media = p.image
      ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">'
      : esc(p.emoji || "🛍️");
    var tag = "";
    if (Number(p.stock) === 0) tag = '<span class="card-tag out">Agotado</span>';
    else if (p.oldPrice && Number(p.oldPrice) > Number(p.price)) {
      var off = Math.round((1 - Number(p.price) / Number(p.oldPrice)) * 100);
      tag = '<span class="card-tag">-' + off + "%</span>";
    }
    var priceHtml = '<span class="price">' +
      (p.oldPrice && Number(p.oldPrice) > Number(p.price)
        ? '<span class="old">' + esc(money(p.oldPrice)) + "</span>" : "") +
      esc(money(p.price)) + "</span>";
    var btn = Number(p.stock) === 0
      ? '<button class="btn btn-sm btn-outline" disabled>Sin stock</button>'
      : '<button class="btn btn-sm btn-gold" data-add="' + esc(p.id) + '">Agregar</button>';

    return '<article class="card">' +
      '<div class="card-media" data-view="' + esc(p.id) + '">' + tag + media + "</div>" +
      '<div class="card-body">' +
      '<span class="card-cat">' + esc(p.category) + "</span>" +
      '<h3 class="card-name" data-view="' + esc(p.id) + '">' + esc(p.name) + "</h3>" +
      (function () {
        var r = displayRating(p);
        return r
          ? '<div class="card-rating" data-view="' + esc(p.id) + '">' + starsHTML(r.rating) +
            ' <span class="muted small">' + esc(r.rating) + " · " +
            r.count.toLocaleString("es-CL") + " opiniones</span></div>"
          : "";
      })() +
      '<p class="card-desc">' + esc(p.desc) + "</p>" +
      '<div class="card-foot">' + priceHtml + btn + "</div>" +
      "</div></article>";
  }

  function renderCatalog() {
    var q = state.search.toLowerCase();
    var list = getProducts().filter(function (p) {
      var okCat = state.category === "Todo" || p.category === state.category;
      var okQ = !q || (p.name + " " + p.desc + " " + p.category).toLowerCase().indexOf(q) !== -1;
      return okCat && okQ;
    });
    $("#productGrid").innerHTML = list.map(cardHTML).join("");
    $("#noResults").hidden = list.length > 0;

    var offers = getProducts().filter(function (p) {
      return p.oldPrice && Number(p.oldPrice) > Number(p.price);
    });
    $("#offerGrid").innerHTML = offers.map(cardHTML).join("");
    $("#noOffers").hidden = offers.length > 0;

    renderChips();
  }

  /* ==========================================================================
     CARRITO
     ========================================================================== */
  function cartCount() {
    var n = 0;
    for (var id in state.cart) n += state.cart[id];
    return n;
  }

  function cartTotal() {
    var t = 0;
    for (var id in state.cart) {
      var p = findProduct(id);
      if (p) t += Number(p.price) * state.cart[id];
    }
    return t;
  }

  function saveCart() {
    store.set(KEYS.cart, state.cart);
    // Si hay sesión, el carrito también queda guardado en la cuenta.
    if (state.session) updateUserRecord({ cart: state.cart });
  }

  function addToCart(id, sourceEl) {
    var p = findProduct(id);
    if (!p || Number(p.stock) === 0) return;
    var qty = (state.cart[id] || 0) + 1;
    if (qty > Number(p.stock)) { toast("No hay más stock de este producto"); return; }
    state.cart[id] = qty;
    saveCart();
    renderCart();
    if (!flyToCart(sourceEl, p)) toast("✦ Agregado al carrito");
  }

  /* ==========================================================================
     ANIMACIÓN "VUELO AL CARRITO"
     --------------------------------------------------------------------------
     El producto vuela en arco hasta el carrito dejando una estela de
     destellos dorados ✦ (la marca de Velora), y el carrito pulsa al
     recibirlo. Es solo visual: no bloquea clics ni frena compras múltiples.
     Devuelve false si no pudo animar (ahí se muestra el toast clásico).
     ========================================================================== */
  function flyToCart(fromEl, p) {
    try {
      if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      var target = $("#btnCart");
      if (!fromEl || !fromEl.getBoundingClientRect || !target) return false;
      var a = fromEl.getBoundingClientRect();
      var b = target.getBoundingClientRect();
      if (!a.width || !b.width) return false;

      var sx = a.left + a.width / 2, sy = a.top + a.height / 2;
      var ex = b.left + b.width / 2, ey = b.top + b.height / 2;
      // Punto de control por encima de la recta: da la curva del arco.
      var cx = (sx + ex) / 2, cy = Math.min(sy, ey) - 130;
      var DUR = 700;

      function bez(t, p0, p1, p2) {
        return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
      }

      // Miniatura voladora del producto
      var el = document.createElement("div");
      el.className = "fly-item";
      el.innerHTML = p.image
        ? '<img src="' + esc(p.image) + '" alt="">'
        : esc(p.emoji || "🛍️");
      document.body.appendChild(el);

      var frames = [];
      for (var i = 0; i <= 20; i++) {
        var t = i / 20;
        frames.push({
          transform: "translate(" + bez(t, sx, cx, ex) + "px," + bez(t, sy, cy, ey) +
            "px) translate(-50%,-50%) scale(" + (1 - 0.68 * t) + ") rotate(" + t * 18 + "deg)",
          opacity: t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1
        });
      }
      el.animate(frames, { duration: DUR, easing: "linear" }).onfinish = function () { el.remove(); };

      // Estela de destellos ✦ a lo largo del arco
      for (var s = 1; s <= 4; s++) {
        (function (s) {
          var t = s / 5;
          var sp = document.createElement("span");
          sp.className = "fly-spark";
          sp.textContent = "✦";
          sp.style.left = bez(t, sx, cx, ex) + "px";
          sp.style.top = bez(t, sy, cy, ey) + "px";
          document.body.appendChild(sp);
          sp.animate([
            { transform: "translate(-50%,-50%) scale(0) rotate(0deg)", opacity: 0 },
            { transform: "translate(-50%,-50%) scale(1.1) rotate(45deg)", opacity: 1, offset: 0.4 },
            { transform: "translate(-50%,-50%) scale(0) rotate(90deg)", opacity: 0 }
          ], { duration: 460, delay: Math.max(0, DUR * t - 120), easing: "ease-out", fill: "backwards" })
            .onfinish = function () { sp.remove(); };
        })(s);
      }

      // El carrito "recibe" el producto: pulso + anillo dorado
      setTimeout(function () {
        target.classList.remove("cart-hit");
        void target.offsetWidth; // reinicia la animación si llegan varios seguidos
        target.classList.add("cart-hit");
        setTimeout(function () { target.classList.remove("cart-hit"); }, 550);
      }, DUR - 80);

      return true;
    } catch (e) { return false; }
  }

  function setQty(id, qty) {
    if (qty <= 0) delete state.cart[id];
    else {
      var p = findProduct(id);
      if (p && qty > Number(p.stock)) { toast("Stock máximo alcanzado"); return; }
      state.cart[id] = qty;
    }
    saveCart();
    renderCart();
  }

  function renderCart() {
    var n = cartCount();
    var badge = $("#cartBadge");
    badge.hidden = n === 0;
    badge.textContent = n;

    var itemsEl = $("#cartItems");
    var ids = Object.keys(state.cart);
    $("#cartEmpty").style.display = ids.length ? "none" : "flex";
    $("#cartSummary").hidden = !ids.length;

    itemsEl.innerHTML = ids.map(function (id) {
      var p = findProduct(id);
      if (!p) return "";
      var qty = state.cart[id];
      var thumb = p.image
        ? '<img src="' + esc(p.image) + '" alt="">'
        : esc(p.emoji || "🛍️");
      return '<div class="cart-item">' +
        '<div class="cart-thumb">' + thumb + "</div>" +
        "<div>" +
        '<div class="cart-item-name">' + esc(p.name) + "</div>" +
        '<div class="cart-item-price">' + esc(money(p.price)) + " c/u</div>" +
        '<div class="qty">' +
        '<button data-qty="-1" data-id="' + esc(id) + '" aria-label="Restar">−</button>' +
        "<span>" + qty + "</span>" +
        '<button data-qty="1" data-id="' + esc(id) + '" aria-label="Sumar">+</button>' +
        "</div></div>" +
        '<button class="cart-remove" data-remove="' + esc(id) + '">Quitar</button>' +
        "</div>";
    }).join("");

    $("#cartSubtotal").textContent = money(cartTotal());
  }

  /* ==========================================================================
     DRAWERS / OVERLAY / MODAL
     ========================================================================== */
  var overlay = $("#overlay");

  function openDrawer(id) {
    closeAll();
    $(id).classList.add("open");
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add("show"); });
    if (id === "#navDrawer") {
      $("#btnMenu").classList.add("open");
      $("#btnMenu").setAttribute("aria-expanded", "true");
    }
  }

  function closeAll() {
    $all(".drawer").forEach(function (d) { d.classList.remove("open"); });
    $("#btnMenu").classList.remove("open");
    $("#btnMenu").setAttribute("aria-expanded", "false");
    overlay.classList.remove("show");
    overlay.hidden = true;
    $("#modal").hidden = true;
  }

  function openModal(html) {
    closeAll();
    $("#modalBody").innerHTML = html;
    $("#modal").hidden = false;
  }

  /* ==========================================================================
     DETALLE DE PRODUCTO
     ========================================================================== */
  function viewProduct(id) {
    var p = findProduct(id);
    if (!p) return;
    var media = p.image
      ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">'
      : esc(p.emoji || "🛍️");
    var r = displayRating(p);
    var reviews = getReviews(p.id);

    var reviewsHTML = reviews.length
      ? reviews.map(function (rv, i) {
          return '<div class="review">' +
            '<div class="review-head">' +
            "<strong>" + esc(rv.name) + "</strong> " + starsHTML(rv.stars) +
            '<span class="muted small"> ' + esc(rv.date) + "</span>" +
            (isCreator() ? ' <button class="cart-remove" data-delreview="' + i + '">✕ borrar</button>' : "") +
            "</div>" +
            (rv.text ? '<p class="review-text">' + esc(rv.text) + "</p>" : "") +
            "</div>";
        }).join("")
      : '<p class="muted small">Todavía no hay opiniones en la tienda. ¡Sé el primero!</p>';

    var formHTML = state.session
      ? '<form id="reviewForm">' +
        '<div class="star-pick" id="starPick">' +
        [1, 2, 3, 4, 5].map(function (n) {
          return '<button type="button" class="star-btn" data-star="' + n + '">★</button>';
        }).join("") +
        '<span class="muted small" id="starLabel">Elegí tu puntuación</span></div>' +
        '<textarea class="input" id="reviewText" rows="2" maxlength="300" placeholder="Contanos qué te pareció (opcional)"></textarea>' +
        '<button class="btn btn-outline btn-sm" type="submit">Publicar opinión</button>' +
        "</form>"
      : '<button class="link-btn" id="reviewLogin">Iniciá sesión para dejar tu opinión</button>';

    openModal(
      '<div class="pd-media">' + media + "</div>" +
      '<span class="card-cat">' + esc(p.category) + "</span>" +
      "<h3>" + esc(p.name) + "</h3>" +
      (r ? '<div class="card-rating">' + starsHTML(r.rating) + ' <span class="muted small">' +
        esc(r.rating) + " · " + r.count.toLocaleString("es-CL") + " valoraciones de compradores</span></div>" : "") +
      "<p class='muted'>" + esc(p.desc) + "</p>" +
      '<p class="price" style="margin:.8rem 0">' +
      (p.oldPrice && Number(p.oldPrice) > Number(p.price)
        ? '<span class="old">' + esc(money(p.oldPrice)) + "</span>" : "") +
      esc(money(p.price)) + "</p>" +
      '<p class="muted small">' + (Number(p.stock) > 0
        ? "Stock disponible: " + Number(p.stock) + " unidades"
        : "Producto agotado por el momento") + "</p>" +
      '<p class="muted small">' + esc(CONFIG.shippingNote || "") + "</p>" +
      (Number(p.stock) > 0
        ? '<button class="btn btn-gold btn-block" style="margin-top:1rem" data-add="' + esc(p.id) + '">Agregar al carrito</button>'
        : "") +
      '<div class="reviews-block"><h3 style="font-size:1.1rem">Opiniones</h3>' +
      reviewsHTML + formHTML + "</div>"
    );

    // Borrado de opiniones (solo el creador)
    $all("[data-delreview]").forEach(function (b) {
      b.addEventListener("click", function () {
        var list = getReviews(p.id);
        list.splice(Number(b.getAttribute("data-delreview")), 1);
        saveReviews(p.id, list);
        renderCatalog();
        viewProduct(p.id);
        toast("Opinión eliminada");
      });
    });

    var loginBtn = $("#reviewLogin");
    if (loginBtn) loginBtn.addEventListener("click", function () { authModal("login"); });

    var form = $("#reviewForm");
    if (form) {
      var chosen = 0;
      var labels = ["Elegí tu puntuación", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];
      $all(".star-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          chosen = Number(btn.getAttribute("data-star"));
          $all(".star-btn").forEach(function (b2) {
            b2.classList.toggle("on", Number(b2.getAttribute("data-star")) <= chosen);
          });
          $("#starLabel").textContent = labels[chosen];
        });
      });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!chosen) { toast("Elegí cuántas estrellas le das"); return; }
        var list = getReviews(p.id).filter(function (rv) {
          return rv.email !== state.session.email; // una opinión por persona
        });
        list.unshift({
          name: state.session.name.split(" ")[0],
          email: state.session.email,
          stars: chosen,
          text: $("#reviewText").value.trim(),
          date: new Date().toLocaleDateString("es-CL")
        });
        saveReviews(p.id, list);
        renderCatalog();
        viewProduct(p.id);
        toast("¡Gracias por tu opinión! ✦");
      });
    }
  }

  /* ==========================================================================
     CUENTAS DE USUARIO (registro / inicio de sesión)
     --------------------------------------------------------------------------
     Las contraseñas NUNCA se guardan en texto plano: se derivan con PBKDF2
     (100.000 iteraciones, SHA-256) y una sal aleatoria única por usuario.
     Todo queda en el navegador de cada persona; nada viaja a servidores.
     ========================================================================== */
  function randomSalt() {
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function (b) {
      return ("0" + b.toString(16)).slice(-2);
    }).join("");
  }

  function hashPassword(password, salt) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"])
      .then(function (key) {
        return crypto.subtle.deriveBits(
          { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
          key, 256
        );
      })
      .then(function (bits) {
        return Array.prototype.map.call(new Uint8Array(bits), function (b) {
          return ("0" + b.toString(16)).slice(-2);
        }).join("");
      });
  }

  function isCreator() {
    return state.session && state.session.email === CONFIG.creatorEmail.toLowerCase();
  }

  /* Perfil del usuario: ubicación, teléfono, dirección y su carrito guardado. */
  function getUserRecord() {
    if (!state.session) return null;
    var users = store.get(KEYS.users, {});
    return users[state.session.email] || null;
  }

  function updateUserRecord(patch) {
    if (!state.session) return;
    var users = store.get(KEYS.users, {});
    var u = users[state.session.email];
    if (!u) return;
    for (var k in patch) u[k] = patch[k];
    store.set(KEYS.users, users);
  }

  function setSession(sess) {
    state.session = sess;
    if (sess) {
      store.set(KEYS.session, sess);
      // Recupera el carrito guardado en la cuenta y lo une con el actual.
      var u = getUserRecord();
      if (u && u.cart) {
        for (var id in u.cart) {
          if (!state.cart[id] && findProduct(id)) state.cart[id] = u.cart[id];
        }
        saveCart();
        renderCart();
      }
    } else {
      store.del(KEYS.session);
    }
    renderAccountUI();
  }

  function renderAccountUI() {
    var label = $("#accountLabel");
    var navAccount = $("#navAccount");
    if (state.session) {
      label.textContent = state.session.name.split(" ")[0];
      navAccount.textContent = "Mi cuenta (" + state.session.name.split(" ")[0] + ")";
    } else {
      label.textContent = "Entrar";
      navAccount.textContent = "Crear cuenta / Iniciar sesión";
    }
    $("#navAdminItem").hidden = !isCreator();
  }

  function authModal(mode) {
    var isLogin = mode === "login";
    openModal(
      "<h3>" + (isLogin ? "Iniciar sesión" : "Crear tu cuenta") + "</h3>" +
      '<p class="muted small">' + (isLogin
        ? "Bienvenido de nuevo a Velora."
        : "Solo pedimos lo mínimo para atenderte. Tu tarjeta nunca se guarda acá.") + "</p>" +
      '<form id="authForm">' +
      (isLogin ? "" : '<input class="input" type="text" id="authName" placeholder="Tu nombre" required maxlength="60">') +
      (isLogin ? "" : '<input class="input" type="text" id="authLocation" placeholder="Tu ciudad y país (ej: Lima, Perú)" required maxlength="80">') +
      '<input class="input" type="email" id="authEmail" placeholder="Email" required maxlength="120">' +
      '<input class="input" type="password" id="authPass" placeholder="Contraseña (mínimo 8 caracteres)" required minlength="8" maxlength="100">' +
      '<p class="form-error" id="authError" hidden></p>' +
      '<button class="btn btn-primary btn-block" type="submit">' + (isLogin ? "Entrar" : "Crear cuenta") + "</button>" +
      "</form>" +
      '<p class="auth-switch"><button class="link-btn" id="authSwitch">' +
      (isLogin ? "¿No tenés cuenta? Creá una" : "¿Ya tenés cuenta? Iniciá sesión") +
      "</button></p>"
    );

    $("#authSwitch").addEventListener("click", function () {
      authModal(isLogin ? "register" : "login");
    });

    $("#authForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("#authEmail").value.trim().toLowerCase();
      var pass = $("#authPass").value;
      var errEl = $("#authError");
      errEl.hidden = true;

      if (!isValidEmail(email)) { errEl.textContent = "Ingresá un email válido."; errEl.hidden = false; return; }

      var users = store.get(KEYS.users, {});

      if (isLogin) {
        var u = users[email];
        if (!u) { errEl.textContent = "No existe una cuenta con ese email en este dispositivo."; errEl.hidden = false; return; }
        hashPassword(pass, u.salt).then(function (hash) {
          if (hash !== u.hash) { errEl.textContent = "Contraseña incorrecta."; errEl.hidden = false; return; }
          setSession({ email: email, name: u.name });
          closeAll();
          toast("Hola de nuevo, " + u.name.split(" ")[0] + " ✦");
          // Al creador se le avisa apenas entra si hay productos al 30% o menos.
          setTimeout(notifyLowStock, 2800);
        });
      } else {
        var name = $("#authName").value.trim();
        if (name.length < 2) { errEl.textContent = "Ingresá tu nombre."; errEl.hidden = false; return; }
        if (users[email]) { errEl.textContent = "Ya existe una cuenta con ese email. Iniciá sesión."; errEl.hidden = false; return; }
        var location = $("#authLocation").value.trim();
        var salt = randomSalt();
        hashPassword(pass, salt).then(function (hash) {
          users[email] = {
            name: name, salt: salt, hash: hash, created: "",
            profile: { location: location, phone: "", address: "" },
            cart: {}
          };
          store.set(KEYS.users, users);
          setSession({ email: email, name: name });
          closeAll();
          toast("¡Cuenta creada! Bienvenido, " + name.split(" ")[0] + " ✦");
        });
      }
    });
  }

  /* ==========================================================================
     MI CUENTA — página completa (reemplaza a las demás secciones al abrirse)
     ========================================================================== */
  function accountModal() {
    if (!state.session) { authModal("login"); return; }
    showAccountPage();
  }

  function myReviews() {
    if (!state.session) return [];
    var all = store.get(KEYS.reviews, {});
    var out = [];
    for (var pid in all) {
      (all[pid] || []).forEach(function (rv) {
        if (rv.email === state.session.email) {
          var prod = findProduct(pid);
          out.push({ pid: pid, product: prod ? prod.name : "Producto", stars: rv.stars, text: rv.text, date: rv.date });
        }
      });
    }
    return out;
  }

  function showAccountPage() {
    if (!state.session) { authModal("login"); return; }
    renderAccountPage();
    closeAll();
    hideAdminPage();
    document.body.classList.add("account-open");
    $("#accountPage").hidden = false;
    window.scrollTo({ top: 0 });
    if (location.hash !== "#cuenta") {
      try { history.pushState(null, "", "#cuenta"); } catch (e) { /* file:// */ }
    }
  }

  function hideAccountPage() {
    document.body.classList.remove("account-open");
    $("#accountPage").hidden = true;
  }

  function renderAccountPage() {
    var u = getUserRecord();
    var p = (u && u.profile) || { location: "", phone: "", address: "" };
    var firstName = state.session.name.split(" ")[0];
    var initial = (state.session.name.charAt(0) || "✦").toUpperCase();
    var reviews = myReviews();
    var items = cartCount();

    var reviewsHTML = reviews.length
      ? reviews.map(function (r) {
          return '<div class="review-mini">' +
            "<div><strong>" + esc(r.product) + "</strong> " + starsHTML(r.stars) + "</div>" +
            (r.text ? '<p class="muted small">“' + esc(r.text) + "”</p>" : "") +
            '<span class="muted small">' + esc(r.date) + "</span></div>";
        }).join("")
      : '<p class="muted small">Todavía no dejaste opiniones. Cuando compres algo, contanos qué te pareció: ayudás a otros compradores ✦</p>';

    var creatorHTML = "";
    if (isCreator()) {
      var lows = lowStockProducts().length;
      creatorHTML =
        '<div class="account-card account-card-creator">' +
        "<h3>⚙ Herramientas del creador</h3>" +
        '<p class="muted small">' + getProducts().length + " productos en el catálogo · " +
        (lows ? '<strong style="color:#b0433f">' + lows + " con stock bajo ⚠</strong>" : "stock sano ✔") + "</p>" +
        '<div class="account-actions">' +
        '<button class="btn btn-gold btn-sm" id="apAdmin">Panel del creador</button>' +
        '<button class="btn btn-primary btn-sm" id="apDash">📊 Gestión y ganancias</button>' +
        "</div></div>";
    }

    $("#accountPage").innerHTML =
      '<div class="account-head">' +
      '<div class="avatar">' + esc(initial) + "</div>" +
      "<div>" +
      "<h2>Hola, " + esc(firstName) + " ✦</h2>" +
      '<p class="muted">' + esc(state.session.email) + "</p>" +
      (isCreator() ? '<span class="creator-badge">Creador de Velora</span>' : "") +
      "</div>" +
      '<button class="btn btn-outline btn-sm account-logout" id="apLogout">Cerrar sesión</button>' +
      "</div>" +

      '<div class="account-grid">' +

      '<div class="account-card">' +
      "<h3>📦 Mis datos de entrega</h3>" +
      '<p class="muted small">Se completan solos en cada compra, para que pagar te tome segundos.</p>' +
      '<form id="profileForm">' +
      '<label class="field-label">Ciudad y país</label>' +
      '<input class="input" id="prLocation" placeholder="Ej: Batuco, Chile" maxlength="80" value="' + esc(p.location) + '">' +
      '<label class="field-label">Teléfono / WhatsApp</label>' +
      '<input class="input" id="prPhone" type="tel" placeholder="+56 9 …" maxlength="30" value="' + esc(p.phone) + '">' +
      '<label class="field-label">Dirección de entrega</label>' +
      '<input class="input" id="prAddress" placeholder="Calle, número, comuna" maxlength="160" value="' + esc(p.address) + '">' +
      '<button class="btn btn-primary btn-sm" type="submit">Guardar cambios</button>' +
      "</form></div>" +

      '<div class="account-card">' +
      "<h3>🛒 Mi carrito</h3>" +
      (items
        ? "<p><strong>" + items + "</strong> producto" + (items > 1 ? "s" : "") + " esperándote · Subtotal <strong>" +
          esc(money(cartTotal())) + "</strong></p>"
        : '<p class="muted small">Tu carrito está vacío por ahora.</p>') +
      '<div class="account-actions">' +
      (items ? '<button class="btn btn-gold btn-sm" id="apCart">Ver mi carrito</button>' : "") +
      '<a class="btn btn-outline btn-sm" href="#catalogo" id="apCatalog">Ir al catálogo</a>' +
      "</div></div>" +

      '<div class="account-card">' +
      "<h3>✦ Mis opiniones</h3>" + reviewsHTML + "</div>" +

      '<div class="account-card">' +
      "<h3>🔒 Tu seguridad en Velora</h3>" +
      '<ul class="secure-list">' +
      "<li>Tu contraseña se guarda cifrada — nadie puede leerla, ni siquiera la tienda.</li>" +
      "<li>Nunca guardamos datos de tarjetas: el pago ocurre en plataformas certificadas.</li>" +
      "<li>Tus datos viven solo en tu dispositivo y podés borrarlos cuando quieras.</li>" +
      "</ul>" +
      '<button class="link-btn" id="apPrivacy">Leer la política de privacidad</button>' +
      "</div>" +

      creatorHTML +
      "</div>";

    // ---- Eventos de la página ----
    $("#profileForm").addEventListener("submit", function (e) {
      e.preventDefault();
      updateUserRecord({
        profile: {
          location: $("#prLocation").value.trim(),
          phone: $("#prPhone").value.trim(),
          address: $("#prAddress").value.trim()
        }
      });
      toast("Datos guardados ✦");
    });
    $("#apLogout").addEventListener("click", function () {
      setSession(null);
      hideAccountPage();
      toast("Sesión cerrada. ¡Hasta pronto!");
    });
    var apCart = $("#apCart");
    if (apCart) apCart.addEventListener("click", function () { openDrawer("#cartDrawer"); });
    $("#apCatalog").addEventListener("click", hideAccountPage);
    $("#apPrivacy").addEventListener("click", privacyModal);
    var apAdmin = $("#apAdmin");
    if (apAdmin) apAdmin.addEventListener("click", adminPanel);
    var apDash = $("#apDash");
    if (apDash) apDash.addEventListener("click", dashboard);
  }

  /* ==========================================================================
     PANEL DEL CREADOR — página completa con pestañas
     Vistas: "productos" (lista + formulario) y "gestion" (dashboard).
     ========================================================================== */
  function adminPanel() { showAdminPage("productos"); }

  function showAdminPage(view, editId) {
    if (!isCreator()) { toast("Solo el creador puede entrar acá"); return; }
    closeAll();
    hideAccountPage();
    renderAdminPage(view, editId);
    document.body.classList.add("admin-open");
    $("#adminPage").hidden = false;
    window.scrollTo({ top: 0 });
    var hash = view === "gestion" ? "#gestion" : "#panel";
    if (location.hash !== hash) {
      try { history.pushState(null, "", hash); } catch (e) { /* file:// */ }
    }
  }

  function hideAdminPage() {
    document.body.classList.remove("admin-open");
    $("#adminPage").hidden = true;
  }

  function renderAdminPage(view, editId) {
    var head =
      '<div class="account-head">' +
      '<div class="avatar">⚙</div>' +
      "<div><h2>Panel del creador</h2>" +
      '<p class="muted small">Los cambios se guardan en este navegador. Para fijarlos para todos los visitantes, exportá el catálogo y pasámelo en el chat.</p></div>' +
      '<button class="btn btn-outline btn-sm account-logout" id="admBackStore">← Volver a la tienda</button>' +
      "</div>" +
      '<div class="admin-tabs">' +
      '<button class="admin-tab' + (view !== "gestion" ? " active" : "") + '" id="tabProducts">🛍️ Productos</button>' +
      '<button class="admin-tab' + (view === "gestion" ? " active" : "") + '" id="tabDash">📊 Gestión y ganancias</button>' +
      "</div>";

    var body = view === "gestion" ? adminDashHTML()
      : (editId !== undefined ? adminFormHTML(editId) : adminProductsHTML());

    $("#adminPage").innerHTML = head + '<div id="adminBody">' + body + "</div>";

    $("#admBackStore").addEventListener("click", function () {
      hideAdminPage();
      try { history.pushState(null, "", "#inicio"); } catch (e) { /* file:// */ }
    });
    $("#tabProducts").addEventListener("click", function () { showAdminPage("productos"); });
    $("#tabDash").addEventListener("click", function () { showAdminPage("gestion"); });

    if (view === "gestion") wireAdminDash();
    else if (editId !== undefined) wireAdminForm(editId);
    else wireAdminProducts();
  }

  /* ---------- Vista: lista de productos ---------- */
  function adminProductsHTML() {
    var low = lowStockProducts();
    return (low.length
      ? '<div class="alert-low">⚠ <strong>Stock bajo:</strong> ' +
        low.map(function (p) { return esc(p.name) + " (" + stockPct(p) + "%)"; }).join(", ") + "</div>"
      : "") +
      '<div class="account-actions" style="margin-bottom:1.2rem">' +
      '<button class="btn btn-gold btn-sm" id="admNew">＋ Nuevo producto</button>' +
      '<button class="btn btn-outline btn-sm" id="admExport">Exportar catálogo</button>' +
      '<button class="btn btn-outline btn-sm" id="admReset">Restaurar original</button>' +
      "</div>" +
      '<div class="prod-list">' +
      getProducts().map(function (p) {
        var pct = stockPct(p);
        var isLow = Number(p.maxStock) > 0 && pct <= 30;
        var thumb = p.image
          ? '<img src="' + esc(p.image) + '" alt="">'
          : esc(p.emoji || "🛍️");
        return '<div class="prod-row' + (isLow ? " prod-low" : "") + '">' +
          '<div class="cart-thumb">' + thumb + "</div>" +
          '<div class="prod-info">' +
          "<strong>" + esc(p.name) + "</strong>" +
          '<span class="muted small">' + esc(p.category) + " · " + esc(money(p.price)) +
          (Number(p.cost) ? " · ganancia " + esc(money(Number(p.price) - Number(p.cost))) + "/ud." : "") + "</span>" +
          '<span class="small">Stock: <strong>' + Number(p.stock) + "</strong> (" + pct + "%)" +
          (isLow ? ' <span style="color:#b0433f">⚠ reponer</span>' : "") +
          (p.providerLink ? ' · <a href="' + esc(p.providerLink) + '" target="_blank" rel="noopener noreferrer">proveedor ↗</a>' : "") +
          "</span></div>" +
          '<div class="actions">' +
          '<button class="btn btn-sm btn-outline" data-edit="' + esc(p.id) + '">✏️ Editar</button>' +
          '<button class="btn btn-sm btn-danger" data-del="' + esc(p.id) + '">✕</button>' +
          "</div></div>";
      }).join("") +
      "</div>" +
      '<div class="admin-note">💡 <strong>Para cobrar de verdad:</strong> creá tu cuenta gratis en Mercado Pago, generá un "link de pago" por producto y pegalo en el campo "Link de pago" al editar cada producto. El botón de pagar del checkout llevará a tus clientes directo ahí.</div>';
  }

  function wireAdminProducts() {
    $("#admNew").addEventListener("click", function () { showAdminPage("productos", null); });
    $("#admExport").addEventListener("click", exportCatalog);
    $("#admReset").addEventListener("click", function () {
      if (confirm("¿Restaurar el catálogo original de ejemplo? Se perderán tus cambios de este navegador.")) {
        store.del(KEYS.products);
        renderCatalog(); renderCart();
        showAdminPage("productos");
        toast("Catálogo restaurado");
      }
    });
    $all("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { showAdminPage("productos", b.getAttribute("data-edit")); });
    });
    $all("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = findProduct(b.getAttribute("data-del"));
        if (p && confirm('¿Eliminar "' + p.name + '" del catálogo?')) {
          saveProducts(getProducts().filter(function (x) { return x.id !== p.id; }));
          delete state.cart[p.id];
          saveCart();
          renderCatalog(); renderCart();
          showAdminPage("productos");
          toast("Producto eliminado");
        }
      });
    });
  }

  /* ---------- Vista: formulario de producto (con etiquetas claras) ---------- */
  function field(label, hint, inputHTML) {
    return '<div class="form-field"><label class="field-label">' + label +
      (hint ? ' <span class="field-hint">' + hint + "</span>" : "") +
      "</label>" + inputHTML + "</div>";
  }

  function adminFormHTML(editId) {
    var p = editId ? findProduct(editId) : {
      id: "p" + Math.floor(Math.random() * 1e9).toString(36),
      name: "", category: "", price: "", oldPrice: "", emoji: "🛍️",
      image: "", desc: "", stock: 10, paymentLink: ""
    };
    if (!p) return adminProductsHTML();

    return '<form id="prodForm">' +
      '<h3 class="form-section-title">' + (editId ? "✏️ Editando: " + esc(p.name) : "＋ Nuevo producto") + "</h3>" +

      '<div class="form-card"><h4>Lo básico</h4><div class="form-grid">' +
      field("Nombre del producto", "",
        '<input class="input" id="pfName" required maxlength="90" placeholder="Ej: Auriculares inalámbricos Pro" value="' + esc(p.name) + '">') +
      field("Categoría", "arma los filtros del catálogo",
        '<input class="input" id="pfCat" required maxlength="40" placeholder="Ej: Tecnología" value="' + esc(p.category) + '">') +
      "</div>" +
      field("Descripción corta", "lo que ve el cliente bajo el nombre",
        '<textarea class="input" id="pfDesc" rows="2" required maxlength="200" placeholder="Ej: Cancelación de ruido y 24 h de batería.">' + esc(p.desc) + "</textarea>") +
      '<div class="form-grid">' +
      field("Emoji", "se muestra si no hay foto",
        '<input class="input" id="pfEmoji" maxlength="4" value="' + esc(p.emoji) + '">') +
      field("Foto (URL)", "opcional, debe empezar con https://",
        '<input class="input" id="pfImage" type="url" placeholder="https://…" value="' + esc(p.image) + '">') +
      "</div></div>" +

      '<div class="form-card"><h4>Precios</h4><div class="form-grid form-grid-3">' +
      field("Precio de venta", "lo que paga el cliente",
        '<input class="input" id="pfPrice" type="number" min="0" step="0.01" required value="' + esc(p.price) + '">') +
      field("Precio anterior", "opcional: si lo ponés, aparece tachado y el producto entra a Ofertas",
        '<input class="input" id="pfOld" type="number" min="0" step="0.01" value="' + esc(p.oldPrice || "") + '">') +
      field("Costo por unidad", "privado: lo que te costó, para calcular tu ganancia",
        '<input class="input" id="pfCost" type="number" min="0" step="0.01" value="' + esc(p.cost || "") + '">') +
      "</div></div>" +

      '<div class="form-card"><h4>Inventario</h4><div class="form-grid">' +
      field("Stock disponible", "unidades que tenés para vender; 0 = agotado",
        '<input class="input" id="pfStock" type="number" min="0" step="1" required value="' + esc(p.stock) + '">') +
      "</div></div>" +

      '<div class="form-card"><h4>Valoración del proveedor</h4><div class="form-grid">' +
      field("Estrellas (0 a 5)", "copiá la del listing donde lo comprás, ej: 4.7",
        '<input class="input" id="pfRating" type="number" min="0" max="5" step="0.1" value="' + esc(p.rating || "") + '">') +
      field("Cantidad de valoraciones", "ej: 2341",
        '<input class="input" id="pfRatingCount" type="number" min="0" step="1" value="' + esc(p.ratingCount || "") + '">') +
      "</div></div>" +

      '<div class="form-card"><h4>Links</h4><div class="form-grid">' +
      field("Link de pago", "Mercado Pago/Stripe; el checkout manda al cliente ahí",
        '<input class="input" id="pfPay" type="url" placeholder="https://mpago.la/…" value="' + esc(p.paymentLink || "") + '">') +
      field("Link del proveedor", "privado, solo lo ves vos en este panel",
        '<input class="input" id="pfProv" type="url" placeholder="https://aliexpress.com/…" value="' + esc(p.providerLink || "") + '">') +
      "</div></div>" +

      '<div class="account-actions">' +
      '<button class="btn btn-primary" type="submit">Guardar producto</button>' +
      '<button class="btn btn-outline" type="button" id="pfCancel">Cancelar</button>' +
      "</div></form>";
  }

  function wireAdminForm(editId) {
    var p = editId ? findProduct(editId) : null;
    var pid = p ? p.id : $("#prodForm") && null;
    $("#pfCancel").addEventListener("click", function () { showAdminPage("productos"); });
    $("#prodForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var img = $("#pfImage").value.trim();
      var pay = $("#pfPay").value.trim();
      var prov = $("#pfProv").value.trim();
      if (img && img.indexOf("https://") !== 0) { toast("La foto debe empezar con https://"); return; }
      if (pay && pay.indexOf("https://") !== 0) { toast("El link de pago debe empezar con https://"); return; }
      if (prov && prov.indexOf("https://") !== 0) { toast("El link del proveedor debe empezar con https://"); return; }
      var newStock = Math.max(0, Math.floor(Number($("#pfStock").value) || 0));
      var oldStock = p ? Number(p.stock) || 0 : 0;
      var next = {
        id: p ? p.id : "p" + Math.floor(Math.random() * 1e9).toString(36),
        name: $("#pfName").value.trim(),
        category: $("#pfCat").value.trim(),
        price: Number($("#pfPrice").value) || 0,
        cost: Number($("#pfCost").value) || 0,
        oldPrice: Number($("#pfOld").value) || 0,
        stock: newStock,
        // Si el stock sube (o el producto es nuevo), esa cifra pasa a ser la
        // base para el aviso del 30%; si baja o queda igual, se conserva.
        maxStock: newStock > oldStock ? newStock : ((p && Number(p.maxStock)) || newStock),
        rating: Math.max(0, Math.min(5, Number($("#pfRating").value) || 0)),
        ratingCount: Math.max(0, Math.floor(Number($("#pfRatingCount").value) || 0)),
        emoji: $("#pfEmoji").value.trim() || "🛍️",
        image: img,
        paymentLink: pay,
        providerLink: prov,
        desc: $("#pfDesc").value.trim()
      };
      // Registra el cambio de stock como movimiento de gestión.
      if (newStock !== oldStock) {
        addMove({
          date: today(), id: next.id, name: next.name,
          type: newStock > oldStock ? "ingreso" : "ajuste",
          qty: Math.abs(newStock - oldStock),
          price: next.price, cost: next.cost
        });
      }
      var list = getProducts().slice();
      var idx = -1;
      for (var i = 0; i < list.length; i++) if (list[i].id === next.id) idx = i;
      if (idx === -1) list.push(next); else list[idx] = next;
      saveProducts(list);
      renderCatalog();
      renderCart();
      showAdminPage("productos");
      toast(p ? "Producto actualizado ✦" : "Producto agregado al catálogo ✦");
    });
  }

  /* ==========================================================================
     VISTA GESTIÓN (pestaña del panel): stock, movimientos, ganancias, gráfico
     ========================================================================== */
  function dashboard() { showAdminPage("gestion"); }

  function adminDashHTML() {
    var moves = getMoves();
    var sales = moves.filter(function (m) { return m.type === "venta"; });

    // --- Totales ---
    var revenue = 0, profit = 0, units = 0;
    sales.forEach(function (m) {
      revenue += m.price * m.qty;
      profit += (m.price - m.cost) * m.qty;
      units += m.qty;
    });
    var stockValue = 0, stockUnits = 0;
    getProducts().forEach(function (p) {
      stockValue += (Number(p.cost) || 0) * (Number(p.stock) || 0);
      stockUnits += Number(p.stock) || 0;
    });

    // --- Ganancia por día (últimos 14 días) para el gráfico ---
    var days = [];
    var now = new Date();
    for (var d = 13; d >= 0; d--) {
      var dt = new Date(now.getTime() - d * 86400000);
      days.push(dt.toISOString().slice(0, 10));
    }
    var byDay = {};
    days.forEach(function (k) { byDay[k] = 0; });
    sales.forEach(function (m) {
      if (byDay[m.date] !== undefined) byDay[m.date] += (m.price - m.cost) * m.qty;
    });
    var maxDay = 0;
    days.forEach(function (k) { if (byDay[k] > maxDay) maxDay = byDay[k]; });

    // --- Incremento: última semana vs semana anterior ---
    var lastWeek = 0, prevWeek = 0;
    days.forEach(function (k, i) {
      if (i < 7) prevWeek += byDay[k]; else lastWeek += byDay[k];
    });
    var growth = prevWeek > 0
      ? Math.round(((lastWeek - prevWeek) / prevWeek) * 100)
      : (lastWeek > 0 ? 100 : 0);

    var chartHTML = '<div class="chart-bars">' + days.map(function (k, i) {
      var h = maxDay > 0 ? Math.max(2, Math.round(byDay[k] / maxDay * 100)) : 2;
      var label = k.slice(8, 10) + "/" + k.slice(5, 7);
      return '<div class="chart-col" title="' + esc(label + ": " + money(byDay[k])) + '">' +
        '<div class="bar" style="height:' + h + '%"></div>' +
        (i % 2 ? "" : '<span class="bar-label">' + esc(label) + "</span>") +
        "</div>";
    }).join("") + "</div>";

    // --- Tabla de stock con alerta al 30% ---
    var low = lowStockProducts();
    var soldById = {};
    sales.forEach(function (m) { soldById[m.id] = (soldById[m.id] || 0) + m.qty; });
    var stockRows = getProducts().map(function (p) {
      var pct = stockPct(p);
      var isLow = Number(p.maxStock) > 0 && pct <= 30;
      return '<tr' + (isLow ? ' class="row-low"' : "") + ">" +
        "<td>" + esc(p.emoji || "🛍️") + " " + esc(p.name) + "</td>" +
        '<td class="num">' + Number(p.stock) + "</td>" +
        '<td class="num">' + (soldById[p.id] || 0) + "</td>" +
        '<td class="num">' + pct + "%" + (isLow ? " ⚠" : "") + "</td>" +
        '<td class="num">' + esc(money((Number(p.price) - (Number(p.cost) || 0)))) + "</td>" +
        "</tr>";
    }).join("");

    // --- Últimos movimientos ---
    var lastMoves = moves.slice(-12).reverse().map(function (m) {
      var icon = m.type === "venta" ? "🔴 −" : (m.type === "ingreso" ? "🟢 +" : "🟠 −");
      return '<div class="move-row"><span>' + esc(m.date.slice(8, 10) + "/" + m.date.slice(5, 7)) +
        " · " + icon + m.qty + " · " + esc(m.name) + "</span><span>" +
        (m.type === "venta"
          ? "+" + esc(money((m.price - m.cost) * m.qty)) + " ganancia"
          : (m.type === "ingreso" ? "ingreso de stock" : "ajuste de stock")) + "</span></div>";
    }).join("") || '<p class="muted small">Todavía no hay movimientos. Se registran solos con cada compra, o a mano con los botones de arriba.</p>';

    return (low.length
      ? '<div class="alert-low">⚠ <strong>Reponer pronto:</strong> ' +
        low.map(function (p) { return esc(p.name) + " (" + stockPct(p) + "%)"; }).join(", ") +
        " — llegaron al 30% del stock o menos.</div>"
      : '<p class="form-ok">✔ Ningún producto bajo el 30% de stock.</p>') +
      '<div class="dash-tiles">' +
      '<div class="tile"><span>Ventas</span><strong>' + esc(money(revenue)) + "</strong></div>" +
      '<div class="tile"><span>Ganancia</span><strong>' + esc(money(profit)) + "</strong></div>" +
      '<div class="tile"><span>Unidades vendidas</span><strong>' + units + "</strong></div>" +
      '<div class="tile"><span>Stock actual (' + stockUnits + ' uds.)</span><strong>' + esc(money(stockValue)) + " invertidos</strong></div>" +
      "</div>" +
      '<div class="account-actions" style="margin-bottom:1rem">' +
      '<button class="btn btn-gold btn-sm" id="dashSale">➕ Registrar venta</button>' +
      '<button class="btn btn-primary btn-sm" id="dashIntake">📦 Registrar ingreso</button>' +
      '<button class="btn btn-outline btn-sm" id="dashCSV">⬇ Exportar a Excel</button>' +
      "</div>" +
      '<div class="form-card">' +
      "<h4>Ganancia por día (últimos 14 días)</h4>" +
      chartHTML +
      '<p class="muted small" style="margin-top:.6rem">Última semana: <strong>' + esc(money(lastWeek)) + "</strong> · Semana anterior: " +
      esc(money(prevWeek)) + " · Incremento: <strong>" + (growth >= 0 ? "+" : "") + growth + "%</strong></p>" +
      "</div>" +
      '<div class="form-card">' +
      "<h4>Stock por producto</h4>" +
      '<div class="table-wrap"><table class="dash-table"><thead><tr>' +
      "<th>Producto</th><th>Stock</th><th>Vendidos</th><th>Restante</th><th>Ganancia/ud.</th>" +
      "</tr></thead><tbody>" + stockRows + "</tbody></table></div></div>" +
      '<div class="form-card">' +
      "<h4>Últimos movimientos</h4>" + lastMoves +
      '<p class="muted small" style="margin-top:.8rem">💡 Las compras hechas en este navegador se registran solas. Los pedidos que te lleguen por email desde otros dispositivos, registralos con "➕ Registrar venta" para que el stock y las ganancias queden al día.</p>' +
      "</div>";
  }

  function wireAdminDash() {
    $("#dashSale").addEventListener("click", function () { moveForm("venta"); });
    $("#dashIntake").addEventListener("click", function () { moveForm("ingreso"); });
    $("#dashCSV").addEventListener("click", exportMovesCSV);
  }

  /* Formulario para registrar una venta o un ingreso de stock a mano. */
  function moveForm(type) {
    var isSale = type === "venta";
    var options = getProducts().map(function (p) {
      return '<option value="' + esc(p.id) + '">' + esc(p.name) + " (stock: " + Number(p.stock) + ")</option>";
    }).join("");
    openModal(
      "<h3>" + (isSale ? "➕ Registrar venta" : "📦 Registrar ingreso de stock") + "</h3>" +
      '<p class="muted small">' + (isSale
        ? "Usalo cuando te llegue un pedido por email o vendas por fuera de la página."
        : "Usalo cuando te llegue mercadería del proveedor. El aviso del 30% se calcula desde este nuevo total.") + "</p>" +
      '<form id="moveForm">' +
      '<select class="input" id="mvProduct">' + options + "</select>" +
      '<input class="input" id="mvQty" type="number" min="1" step="1" value="1" required placeholder="Cantidad">' +
      (isSale ? "" : '<input class="input" id="mvCost" type="number" min="0" step="1" placeholder="Nuevo costo por unidad (opcional)">') +
      '<button class="btn btn-primary btn-block" type="submit">Registrar</button>' +
      "</form>"
    );
    $("#moveForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var id = $("#mvProduct").value;
      var qty = Math.max(1, Math.floor(Number($("#mvQty").value) || 1));
      if (isSale) {
        var p = findProduct(id);
        if (!p || Number(p.stock) < qty) { toast("No hay stock suficiente para esa venta"); return; }
        recordSale(id, qty, true);
      } else {
        recordIntake(id, qty, Number($("#mvCost") ? $("#mvCost").value : 0) || 0);
      }
      renderCatalog();
      renderCart();
      dashboard();
      toast(isSale ? "Venta registrada ✦" : "Ingreso registrado ✦");
      notifyLowStock();
    });
  }

  /* Exporta los movimientos a CSV compatible con Excel en español (; y BOM). */
  function exportMovesCSV() {
    var rows = [["Fecha", "Tipo", "Producto", "Cantidad", "Precio unitario", "Costo unitario", "Total venta", "Ganancia"]];
    getMoves().forEach(function (m) {
      var isSale = m.type === "venta";
      rows.push([
        m.date, m.type, m.name, m.qty, m.price, m.cost,
        isSale ? m.price * m.qty : "", isSale ? (m.price - m.cost) * m.qty : ""
      ]);
    });
    rows.push([]);
    rows.push(["Stock actual", "", "", "", "", "", "", ""]);
    rows.push(["Producto", "Stock", "% restante", "Costo unitario", "Precio", "Ganancia por unidad", "", ""]);
    getProducts().forEach(function (p) {
      rows.push([p.name, p.stock, stockPct(p) + "%", p.cost || 0, p.price, (Number(p.price) - (Number(p.cost) || 0)), "", ""]);
    });
    var csv = "\uFEFF" + rows.map(function (r) {
      return r.map(function (c) {
        return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"';
      }).join(";");
    }).join("\r\n");
    var a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "velora-gestion-" + today() + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast("Archivo descargado: abrilo con Excel ✦");
  }

  function exportCatalog() {
    var json = JSON.stringify(getProducts(), null, 2);
    openModal(
      "<h3>Exportar catálogo</h3>" +
      '<p class="muted small">Copiá este texto y pasámelo en el chat para que actualice el catálogo del sitio publicado (así tus productos los ven todos los visitantes, en cualquier dispositivo).</p>' +
      '<textarea class="input" rows="12" readonly style="font-family:monospace;font-size:.78rem" id="exportArea">' + esc(json) + "</textarea>" +
      '<button class="btn btn-primary btn-block" style="margin-top:.8rem" id="copyExport">Copiar al portapapeles</button>'
    );
    $("#copyExport").addEventListener("click", function () {
      $("#exportArea").select();
      try { document.execCommand("copy"); toast("Catálogo copiado ✦"); }
      catch (e) { toast("Seleccioná el texto y copialo manualmente"); }
    });
  }

  /* ==========================================================================
     CHECKOUT
     ========================================================================== */
  function checkout() {
    var ids = Object.keys(state.cart);
    if (!ids.length) return;

    var lines = ids.map(function (id) {
      var p = findProduct(id);
      return p ? state.cart[id] + " × " + p.name + " — " + money(Number(p.price) * state.cart[id]) : "";
    }).filter(Boolean);

    var orderCode = "VL-" + Math.floor(Math.random() * 900000 + 100000);
    var total = cartTotal();

    // Autocompleta con los datos guardados en el perfil.
    var userRec = getUserRecord();
    var profile = (userRec && userRec.profile) || { location: "", phone: "", address: "" };
    var fullAddress = profile.address +
      (profile.location ? (profile.address ? ", " : "") + profile.location : "");

    // Link de pago: usa el del primer producto que tenga uno, o el general.
    var payLink = CONFIG.checkoutUrl || "";
    for (var i = 0; i < ids.length && !payLink; i++) {
      var p = findProduct(ids[i]);
      if (p && p.paymentLink) payLink = p.paymentLink;
    }

    openModal(
      "<h3>Finalizar compra</h3>" +
      '<p class="muted small">Pedido <strong>' + orderCode + "</strong> · " + esc(CONFIG.shippingNote || "") + "</p>" +
      '<div style="background:var(--ivory);border-radius:10px;padding:1rem;margin:.8rem 0">' +
      lines.map(function (l) { return '<div style="font-size:.9rem">' + esc(l) + "</div>"; }).join("") +
      '<div style="border-top:1px solid var(--gold-soft);margin-top:.6rem;padding-top:.6rem;display:flex;justify-content:space-between"><strong>Total</strong><strong>' + esc(money(total)) + "</strong></div>" +
      "</div>" +
      '<form id="checkoutForm">' +
      '<input class="input" id="coName" placeholder="Nombre y apellido" required maxlength="80" value="' + esc(state.session ? state.session.name : "") + '">' +
      '<input class="input" id="coEmail" type="email" placeholder="Email de contacto" required maxlength="120" value="' + esc(state.session ? state.session.email : "") + '">' +
      '<input class="input" id="coPhone" type="tel" placeholder="Teléfono / WhatsApp" required maxlength="30" value="' + esc(profile.phone) + '">' +
      '<input class="input" id="coAddress" placeholder="Dirección de entrega (calle, ciudad, país)" required maxlength="160" value="' + esc(fullAddress) + '">' +
      '<button class="btn btn-gold btn-block" type="submit">' +
      (payLink ? "Ir a pagar de forma segura" : "Confirmar pedido") + "</button>" +
      "</form>" +
      '<p class="muted small" style="margin-top:.8rem">🔒 Tus datos solo se usan para coordinar esta compra. ' +
      (payLink
        ? "El pago se procesa en una plataforma certificada (nunca vemos tu tarjeta)."
        : "Al confirmar, se abre un email con el detalle del pedido para coordinar el pago y la entrega con la tienda.") +
      "</p>"
    );

    $("#checkoutForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#coName").value.trim();
      var email = $("#coEmail").value.trim();
      var phone = $("#coPhone").value.trim();
      var address = $("#coAddress").value.trim();

      // Guarda los datos en el perfil para la próxima compra.
      if (state.session) {
        updateUserRecord({
          profile: { location: profile.location, phone: phone, address: address }
        });
      }

      var body = "PEDIDO " + orderCode + " — " + CONFIG.storeName + "\n\n" +
        lines.join("\n") + "\n\nTOTAL: " + money(total) + "\n\n" +
        "Cliente: " + name + "\nEmail: " + email + "\nTeléfono: " + phone + "\nEntrega: " + address;

      if (payLink) {
        // Abre el link de pago y avisa a la tienda por email con el detalle.
        window.open(payLink, "_blank", "noopener");
      }
      window.location.href = "mailto:" + encodeURIComponent(CONFIG.contactEmail) +
        "?subject=" + encodeURIComponent("Pedido " + orderCode + " · " + CONFIG.storeName) +
        "&body=" + encodeURIComponent(body);

      // Registra la venta: baja el stock y alimenta el panel de Gestión.
      ids.forEach(function (pid) { recordSale(pid, state.cart[pid], true); });
      notifyLowStock();
      renderCatalog();

      state.cart = {};
      saveCart();
      renderCart();
      openModal(
        "<h3>¡Gracias por tu compra! ✦</h3>" +
        "<p>Tu pedido <strong>" + orderCode + "</strong> fue registrado.</p>" +
        '<p class="muted">' + (payLink
          ? "Completá el pago en la ventana que se abrió. Apenas se acredite, coordinamos la entrega por email o WhatsApp."
          : "Se abrió tu aplicación de correo con el detalle del pedido: envialo y la tienda te contactará para coordinar pago y entrega.") + "</p>" +
        (!payLink && CONFIG.transferInfo
          ? '<div style="background:var(--ivory);border-left:3px solid var(--gold);border-radius:8px;padding:.9rem 1rem;margin-top:.8rem;font-size:.9rem">' +
            "<strong>💳 Pago por transferencia (total " + esc(money(total)) + "):</strong><br>" +
            esc(CONFIG.transferInfo) +
            '<br><span class="muted small">Poné el código ' + orderCode + " en el comentario de la transferencia.</span></div>"
          : "") +
        '<button class="btn btn-primary btn-block" data-close style="margin-top:1rem">Seguir explorando</button>'
      );
    });
  }

  /* ==========================================================================
     PRIVACIDAD
     ========================================================================== */
  function privacyModal() {
    openModal(
      "<h3>Privacidad y protección de datos</h3>" +
      '<p class="muted small">Última actualización: agosto 2026</p>' +
      "<p><strong>Recolectamos lo mínimo.</strong> Solo pedimos los datos imprescindibles para atenderte: nombre, email y, si comprás, teléfono y dirección de entrega. No pedimos documentos, ni fecha de nacimiento, ni nada que no haga falta.</p>" +
      "<p><strong>Tu tarjeta nunca pasa por nosotros.</strong> Los pagos se procesan en plataformas certificadas (Mercado Pago, Stripe o PayPal) que cumplen el estándar internacional PCI-DSS. Esta tienda jamás ve ni guarda números de tarjeta.</p>" +
      "<p><strong>Tus datos quedan en tu dispositivo.</strong> La cuenta que creás acá se guarda únicamente en tu propio navegador, protegida: la contraseña se transforma con un algoritmo criptográfico (PBKDF2 con sal aleatoria) y nunca se almacena en texto legible. No la enviamos a ningún servidor ni la compartimos con nadie.</p>" +
      "<p><strong>Sin rastreadores.</strong> Este sitio no usa cookies de publicidad, ni píxeles de seguimiento, ni analítica de terceros. Además, aplica una Política de Seguridad de Contenido (CSP) estricta que bloquea la ejecución de scripts externos.</p>" +
      "<p><strong>Tus derechos.</strong> Podés pedirnos en cualquier momento que eliminemos los datos de contacto que nos hayas enviado, escribiendo a " + esc(CONFIG.contactEmail) + ". Borrar los datos del navegador está en tus manos: limpiá los datos del sitio y desaparecen.</p>"
    );
  }

  /* ==========================================================================
     EVENTOS
     ========================================================================== */
  document.addEventListener("click", function (e) {
    var t = e.target;

    var addBtn = t.closest("[data-add]");
    if (addBtn) {
      // Origen visual del vuelo: la imagen de la tarjeta o del modal de detalle.
      var scope = addBtn.closest(".card") || addBtn.closest(".modal-card");
      var media = (scope && scope.querySelector(".card-media, .pd-media")) || addBtn;
      addToCart(addBtn.getAttribute("data-add"), media);
      return;
    }

    var viewBtn = t.closest("[data-view]");
    if (viewBtn) { viewProduct(viewBtn.getAttribute("data-view")); return; }

    var qtyBtn = t.closest("[data-qty]");
    if (qtyBtn) {
      var id = qtyBtn.getAttribute("data-id");
      setQty(id, (state.cart[id] || 0) + Number(qtyBtn.getAttribute("data-qty")));
      return;
    }

    var rmBtn = t.closest("[data-remove]");
    if (rmBtn) { setQty(rmBtn.getAttribute("data-remove"), 0); return; }

    var chip = t.closest(".chip");
    if (chip) { state.category = chip.getAttribute("data-cat"); renderCatalog(); return; }

    if (t.closest("[data-close]")) { closeAll(); return; }
    if (t === overlay) { closeAll(); return; }

    var navLink = t.closest("[data-nav]");
    if (navLink && navLink.getAttribute("href") !== "#") { closeAll(); }

    // Cualquier link a una sección de la tienda cierra las páginas completas.
    var sectionLink = t.closest('a[href^="#"]');
    if (sectionLink) {
      var href = sectionLink.getAttribute("href");
      if (href && href !== "#" && href !== "#cuenta" && href !== "#panel" && href !== "#gestion") {
        hideAccountPage();
        hideAdminPage();
      }
    }
  });

  window.addEventListener("hashchange", function () {
    if (location.hash === "#cuenta") {
      if (state.session) showAccountPage();
    } else if (location.hash === "#panel") {
      if (isCreator()) showAdminPage("productos");
    } else if (location.hash === "#gestion") {
      if (isCreator()) showAdminPage("gestion");
    } else {
      hideAccountPage();
      hideAdminPage();
    }
  });

  $("#btnMenu").addEventListener("click", function () {
    if ($("#navDrawer").classList.contains("open")) closeAll();
    else openDrawer("#navDrawer");
  });

  $("#btnCart").addEventListener("click", function () { openDrawer("#cartDrawer"); });
  $("#btnAccount").addEventListener("click", accountModal);
  $("#navAccount").addEventListener("click", function (e) { e.preventDefault(); accountModal(); });
  $("#navAdmin").addEventListener("click", function (e) { e.preventDefault(); adminPanel(); });
  $("#btnCheckout").addEventListener("click", checkout);
  $("#btnClearCart").addEventListener("click", function () {
    state.cart = {};
    saveCart();
    renderCart();
  });
  $("#navPrivacy").addEventListener("click", privacyModal);
  $("#footPrivacy").addEventListener("click", privacyModal);

  $("#searchInput").addEventListener("input", function (e) {
    state.search = e.target.value.trim();
    renderCatalog();
  });

  $("#contactForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#contactName").value.trim();
    var email = $("#contactEmail").value.trim();
    var msg = $("#contactMsg").value.trim();
    window.location.href = "mailto:" + encodeURIComponent(CONFIG.contactEmail) +
      "?subject=" + encodeURIComponent("Consulta de " + name + " · " + CONFIG.storeName) +
      "&body=" + encodeURIComponent(msg + "\n\n— " + name + " (" + email + ")");
    e.target.reset();
    toast("Se abrió tu correo para enviar el mensaje ✦");
  });

  /* ---------- Inicio ---------- */
  $("#year").textContent = new Date().getFullYear();
  renderCatalog();
  renderCart();
  renderAccountUI();
  // Si la página se abre directo en #cuenta/#panel/#gestion, restaura la vista.
  if (location.hash === "#cuenta" && state.session) showAccountPage();
  else if (location.hash === "#panel" && isCreator()) showAdminPage("productos");
  else if (location.hash === "#gestion" && isCreator()) showAdminPage("gestion");
})();
