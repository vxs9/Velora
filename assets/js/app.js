/* ==========================================================================
   ÁUREA — Lógica de la tienda
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
    reviews: "aurea_reviews"
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

  function addToCart(id) {
    var p = findProduct(id);
    if (!p || Number(p.stock) === 0) return;
    var qty = (state.cart[id] || 0) + 1;
    if (qty > Number(p.stock)) { toast("No hay más stock de este producto"); return; }
    state.cart[id] = qty;
    saveCart();
    renderCart();
    toast("✦ Agregado al carrito");
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
        ? "Bienvenido de nuevo a Áurea."
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

  function accountModal() {
    if (!state.session) { authModal("login"); return; }
    var u = getUserRecord();
    var p = (u && u.profile) || { location: "", phone: "", address: "" };
    openModal(
      "<h3>Mi cuenta</h3>" +
      "<p><strong>" + esc(state.session.name) + "</strong><br>" +
      '<span class="muted">' + esc(state.session.email) + "</span></p>" +
      (isCreator() ? '<p class="form-ok">✦ Sos el creador de la tienda.</p>' : "") +
      '<div style="background:var(--ivory);border-radius:10px;padding:.9rem 1rem;margin:.8rem 0;font-size:.9rem">' +
      "<div>📍 <strong>Ubicación:</strong> " + (p.location ? esc(p.location) : '<span class="muted">sin completar</span>') + "</div>" +
      "<div>📞 <strong>Teléfono:</strong> " + (p.phone ? esc(p.phone) : '<span class="muted">sin completar</span>') + "</div>" +
      "<div>🏠 <strong>Dirección de entrega:</strong> " + (p.address ? esc(p.address) : '<span class="muted">sin completar</span>') + "</div>" +
      "</div>" +
      '<p class="muted small">🔒 Por tu seguridad, nunca guardamos datos de tarjetas: el pago siempre se hace dentro de la plataforma certificada (Mercado Pago, Stripe o PayPal).</p>' +
      '<div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem">' +
      '<button class="btn btn-primary" id="accProfile">Editar mis datos</button>' +
      (isCreator() ? '<button class="btn btn-gold" id="accAdmin">Panel del creador</button>' : "") +
      '<button class="btn btn-outline" id="accLogout">Cerrar sesión</button>' +
      "</div>"
    );
    $("#accProfile").addEventListener("click", profileForm);
    var adminBtn = $("#accAdmin");
    if (adminBtn) adminBtn.addEventListener("click", adminPanel);
    $("#accLogout").addEventListener("click", function () {
      setSession(null);
      closeAll();
      toast("Sesión cerrada. ¡Hasta pronto!");
    });
  }

  function profileForm() {
    var u = getUserRecord();
    var p = (u && u.profile) || { location: "", phone: "", address: "" };
    openModal(
      "<h3>Mis datos</h3>" +
      '<p class="muted small">Se guardan en tu cuenta para que comprar sea más rápido: el checkout se completa solo.</p>' +
      '<form id="profileForm">' +
      '<input class="input" id="prLocation" placeholder="Ciudad y país (ej: Lima, Perú)" maxlength="80" value="' + esc(p.location) + '">' +
      '<input class="input" id="prPhone" type="tel" placeholder="Teléfono / WhatsApp" maxlength="30" value="' + esc(p.phone) + '">' +
      '<input class="input" id="prAddress" placeholder="Dirección de entrega" maxlength="160" value="' + esc(p.address) + '">' +
      '<button class="btn btn-primary btn-block" type="submit">Guardar</button>' +
      "</form>"
    );
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
      accountModal();
    });
  }

  /* ==========================================================================
     PANEL DEL CREADOR
     ========================================================================== */
  function adminPanel() {
    if (!isCreator()) { toast("Solo el creador puede entrar acá"); return; }
    var list = getProducts();
    openModal(
      "<h3>⚙ Panel del creador</h3>" +
      '<p class="muted small">Agregá, editá o quitá productos del catálogo. Los cambios se guardan en este navegador; para hacerlos permanentes para todos los visitantes, exportá el catálogo y pedime que lo suba al sitio.</p>' +
      '<div style="display:flex;gap:.6rem;flex-wrap:wrap;margin:1rem 0">' +
      '<button class="btn btn-gold btn-sm" id="admNew">＋ Nuevo producto</button>' +
      '<button class="btn btn-outline btn-sm" id="admExport">Exportar catálogo</button>' +
      '<button class="btn btn-outline btn-sm" id="admReset">Restaurar original</button>' +
      "</div>" +
      '<div class="admin-list">' +
      list.map(function (p) {
        return '<div class="admin-row"><span>' + esc(p.emoji || "🛍️") + " <strong>" + esc(p.name) + "</strong> · " +
          esc(money(p.price)) + " · stock " + Number(p.stock) +
          (p.providerLink ? ' · <a href="' + esc(p.providerLink) + '" target="_blank" rel="noopener noreferrer">proveedor ↗</a>' : "") +
          "</span>" +
          '<span class="actions">' +
          '<button class="btn btn-sm btn-outline" data-edit="' + esc(p.id) + '">Editar</button>' +
          '<button class="btn btn-sm btn-danger" data-del="' + esc(p.id) + '">✕</button>' +
          "</span></div>";
      }).join("") +
      "</div>" +
      '<div class="admin-note">💡 <strong>Para cobrar de verdad:</strong> creá tu cuenta gratis en Mercado Pago o Stripe, generá un "link de pago" por producto y pegalo en el campo "Link de pago" al editar cada producto. El botón de pagar del checkout llevará a tus clientes directo ahí. Los detalles están en el README del proyecto.</div>'
    );

    $("#admNew").addEventListener("click", function () { productForm(null); });
    $("#admExport").addEventListener("click", exportCatalog);
    $("#admReset").addEventListener("click", function () {
      if (confirm("¿Restaurar el catálogo original de ejemplo? Se perderán tus cambios de este navegador.")) {
        store.del(KEYS.products);
        renderCatalog(); renderCart();
        adminPanel();
        toast("Catálogo restaurado");
      }
    });
    $all("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { productForm(b.getAttribute("data-edit")); });
    });
    $all("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = findProduct(b.getAttribute("data-del"));
        if (p && confirm('¿Eliminar "' + p.name + '" del catálogo?')) {
          saveProducts(getProducts().filter(function (x) { return x.id !== p.id; }));
          delete state.cart[p.id];
          saveCart();
          renderCatalog(); renderCart();
          adminPanel();
          toast("Producto eliminado");
        }
      });
    });
  }

  function productForm(id) {
    var p = id ? findProduct(id) : {
      id: "p" + Math.floor(Math.random() * 1e9).toString(36),
      name: "", category: "", price: "", oldPrice: "", emoji: "🛍️",
      image: "", desc: "", stock: 10, paymentLink: ""
    };
    if (!p) return;
    openModal(
      "<h3>" + (id ? "Editar producto" : "Nuevo producto") + "</h3>" +
      '<form id="prodForm">' +
      '<input class="input" id="pfName" placeholder="Nombre" required maxlength="90" value="' + esc(p.name) + '">' +
      '<input class="input" id="pfCat" placeholder="Categoría (ej: Tecnología)" required maxlength="40" value="' + esc(p.category) + '">' +
      '<input class="input" id="pfPrice" type="number" min="0" step="0.01" placeholder="Precio" required value="' + esc(p.price) + '">' +
      '<input class="input" id="pfOld" type="number" min="0" step="0.01" placeholder="Precio anterior (opcional, para ofertas)" value="' + esc(p.oldPrice || "") + '">' +
      '<input class="input" id="pfStock" type="number" min="0" step="1" placeholder="Stock" required value="' + esc(p.stock) + '">' +
      '<input class="input" id="pfRating" type="number" min="0" max="5" step="0.1" placeholder="Valoración del producto (0 a 5, la del listing del proveedor)" value="' + esc(p.rating || "") + '">' +
      '<input class="input" id="pfRatingCount" type="number" min="0" step="1" placeholder="Cantidad de valoraciones del listing" value="' + esc(p.ratingCount || "") + '">' +
      '<input class="input" id="pfEmoji" placeholder="Emoji (si no hay foto)" maxlength="4" value="' + esc(p.emoji) + '">' +
      '<input class="input" id="pfImage" type="url" placeholder="URL de imagen (opcional, https://...)" value="' + esc(p.image) + '">' +
      '<input class="input" id="pfPay" type="url" placeholder="Link de pago (opcional, Mercado Pago/Stripe)" value="' + esc(p.paymentLink || "") + '">' +
      '<input class="input" id="pfProv" type="url" placeholder="Link del proveedor (privado, solo lo ves vos)" value="' + esc(p.providerLink || "") + '">' +
      '<textarea class="input" id="pfDesc" rows="3" placeholder="Descripción corta" required maxlength="200">' + esc(p.desc) + "</textarea>" +
      '<button class="btn btn-primary btn-block" type="submit">Guardar</button>' +
      "</form>"
    );
    $("#prodForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var img = $("#pfImage").value.trim();
      var pay = $("#pfPay").value.trim();
      var prov = $("#pfProv").value.trim();
      if (img && img.indexOf("https://") !== 0) { toast("La imagen debe empezar con https://"); return; }
      if (pay && pay.indexOf("https://") !== 0) { toast("El link de pago debe empezar con https://"); return; }
      if (prov && prov.indexOf("https://") !== 0) { toast("El link del proveedor debe empezar con https://"); return; }
      var next = {
        id: p.id,
        name: $("#pfName").value.trim(),
        category: $("#pfCat").value.trim(),
        price: Number($("#pfPrice").value) || 0,
        oldPrice: Number($("#pfOld").value) || 0,
        stock: Math.max(0, Math.floor(Number($("#pfStock").value) || 0)),
        rating: Math.max(0, Math.min(5, Number($("#pfRating").value) || 0)),
        ratingCount: Math.max(0, Math.floor(Number($("#pfRatingCount").value) || 0)),
        emoji: $("#pfEmoji").value.trim() || "🛍️",
        image: img,
        paymentLink: pay,
        providerLink: prov,
        desc: $("#pfDesc").value.trim()
      };
      var list = getProducts().slice();
      var idx = -1;
      for (var i = 0; i < list.length; i++) if (list[i].id === p.id) idx = i;
      if (idx === -1) list.push(next); else list[idx] = next;
      saveProducts(list);
      renderCatalog();
      renderCart();
      adminPanel();
      toast(id ? "Producto actualizado" : "Producto agregado al catálogo");
    });
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

    var orderCode = "AU-" + Math.floor(Math.random() * 900000 + 100000);
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

      state.cart = {};
      saveCart();
      renderCart();
      openModal(
        "<h3>¡Gracias por tu compra! ✦</h3>" +
        "<p>Tu pedido <strong>" + orderCode + "</strong> fue registrado.</p>" +
        '<p class="muted">' + (payLink
          ? "Completá el pago en la ventana que se abrió. Apenas se acredite, coordinamos la entrega por email o WhatsApp."
          : "Se abrió tu aplicación de correo con el detalle del pedido: envialo y la tienda te contactará para coordinar pago y entrega.") + "</p>" +
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
    if (addBtn) { addToCart(addBtn.getAttribute("data-add")); return; }

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
})();
