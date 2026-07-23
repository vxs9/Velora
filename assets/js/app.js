/* =========================================================================
   VentaScope — APP LOGIC
   Vanilla JS. No build step, no dependencies.
   ========================================================================= */

(function () {
  "use strict";

  // ---- State ----
  const state = {
    lang: localStorage.getItem("vs_lang") || detectLang(),
    month: new Date().getMonth(), // 0..11, defaults to the current month
    region: "all",
  };

  function detectLang() {
    const nav = (navigator.language || "es").toLowerCase();
    return nav.startsWith("en") ? "en" : "es";
  }

  // ---- Tiny helpers ----
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const t = (key) => (I18N[state.lang] && I18N[state.lang][key]) || key;
  const cname = (c) => c.name[state.lang];

  // Color on a warm amber -> hot red scale based on 40..99 index
  function heatColor(index) {
    const p = Math.max(0, Math.min(1, (index - 40) / 59));
    const hue = 45 - p * 45;   // 45 (amber) -> 0 (red)
    const light = 58 - p * 10; // slightly deeper when hotter
    return `hsl(${hue}, 90%, ${light}%)`;
  }

  // ============================ RENDERING ============================

  function rankedCountries() {
    const list = COUNTRIES
      .filter((c) => state.region === "all" || c.region === state.region)
      .map((c) => ({ c, index: opportunityIndex(c, state.month) }))
      .sort((a, b) => b.index - a.index);
    return list;
  }

  function averageIndex(list) {
    if (!list.length) return 0;
    return Math.round(list.reduce((s, x) => s + x.index, 0) / list.length);
  }

  // ---- Static text (elements with data-i18n) ----
  function applyStaticI18n() {
    $$("[data-i18n]").forEach((el) => {
      el.innerHTML = t(el.getAttribute("data-i18n"));
    });
    $$("[data-i18n-attr]").forEach((el) => {
      const attr = el.getAttribute("data-i18n-attr");
      const key = el.getAttribute("data-i18n-" + attr);
      if (key) el.setAttribute(attr, t(key));
    });
    document.documentElement.lang = state.lang;
    $$(".lang__btn").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.lang === state.lang)
    );
  }

  // ---- Month picker ----
  function renderMonths() {
    const wrap = $("#monthPicker");
    wrap.innerHTML = "";
    MONTHS[state.lang].forEach((m, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "month" + (i === state.month ? " is-active" : "");
      b.textContent = m;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", i === state.month ? "true" : "false");
      b.addEventListener("click", () => {
        state.month = i;
        renderMonths();
        renderMarket();
        renderHeroCard();
      });
      wrap.appendChild(b);
    });
  }

  // ---- Region chips ----
  function renderRegions() {
    const wrap = $("#regionPicker");
    wrap.innerHTML = "";
    REGIONS.forEach((r) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (r.id === state.region ? " is-active" : "");
      b.textContent = r[state.lang];
      b.addEventListener("click", () => {
        state.region = r.id;
        renderRegions();
        renderMarket();
      });
      wrap.appendChild(b);
    });
  }

  // ---- Hero card (best market of current month, always all-regions) ----
  function renderHeroCard() {
    const all = COUNTRIES
      .map((c) => ({ c, index: opportunityIndex(c, state.month) }))
      .sort((a, b) => b.index - a.index);
    const top = all[0];
    const card = $("#heroCard");
    card.innerHTML = `
      <span class="herocard__label">${t("hero.card.label")} · ${MONTHS_LONG[state.lang][state.month]}</span>
      <div class="herocard__flag">${top.c.flag}</div>
      <h3 class="herocard__name">${cname(top.c)}</h3>
      <div class="herocard__meter">
        <div class="herocard__bar" style="width:${top.index}%;background:${heatColor(top.index)}"></div>
      </div>
      <div class="herocard__index">
        <strong style="color:${heatColor(top.index)}">${top.index}</strong>
        <span>${t("hero.card.index")}</span>
      </div>
      <a href="#market" class="herocard__cta">${t("hero.card.cta")} →</a>
    `;
  }

  // ---- Market: spotlight + leaderboard ----
  function renderMarket() {
    const list = rankedCountries();
    const avg = averageIndex(list);

    // Spotlight
    const spot = $("#spotlight");
    if (list.length) {
      const top = list[0];
      const diff = top.index - avg;
      spot.innerHTML = `
        <span class="spotlight__tag">${t("market.best")}</span>
        <div class="spotlight__flag">${top.c.flag}</div>
        <h3 class="spotlight__name">${cname(top.c)}</h3>
        <p class="spotlight__note">${top.c.note[state.lang]}</p>
        <div class="spotlight__score">
          <div class="spotlight__num" style="color:${heatColor(top.index)}">${top.index}</div>
          <div class="spotlight__meta">
            <span>${t("market.index")}</span>
            <small>+${diff} ${t("market.vs")}</small>
          </div>
        </div>
        <button class="btn btn--ghost btn--sm" data-detail="${top.c.code}">${t("market.details")} →</button>
      `;
    } else {
      spot.innerHTML = "";
    }

    // Leaderboard
    const ol = $("#rankList");
    ol.innerHTML = "";
    list.forEach((item, i) => {
      const li = document.createElement("li");
      li.className = "rankrow";
      li.setAttribute("data-detail", item.c.code);
      li.innerHTML = `
        <span class="rankrow__pos">${i + 1}</span>
        <span class="rankrow__flag">${item.c.flag}</span>
        <span class="rankrow__body">
          <span class="rankrow__name">${cname(item.c)}</span>
          <span class="rankrow__meter">
            <span class="rankrow__bar" style="width:${item.index}%;background:${heatColor(item.index)}"></span>
          </span>
        </span>
        <span class="rankrow__index" style="color:${heatColor(item.index)}">${item.index}</span>
      `;
      ol.appendChild(li);
    });

    // Wire detail openers
    $$("[data-detail]").forEach((el) =>
      el.addEventListener("click", () => openModal(el.getAttribute("data-detail")))
    );
  }

  // ---- Courses ----
  function renderCourses() {
    const grid = $("#courseGrid");
    grid.innerHTML = "";
    COURSES.forEach((course) => {
      const el = document.createElement("article");
      el.className = "course";
      el.innerHTML = `
        <div class="course__top">
          <span class="course__icon">${course.icon}</span>
          <span class="course__level">${course.level[state.lang]}</span>
        </div>
        <h3 class="course__title">${course.title[state.lang]}</h3>
        <p class="course__desc">${course.desc[state.lang]}</p>
        <ul class="course__points">
          ${course.points[state.lang].map((p) => `<li>${p}</li>`).join("")}
        </ul>
        <div class="course__foot">
          <div class="course__meta">
            <span class="course__price">${course.price}</span>
            <span class="course__dur">${course.duration[state.lang]}</span>
          </div>
          <a href="#contact" class="btn btn--primary btn--sm">${t("courses.enroll")}</a>
        </div>
      `;
      grid.appendChild(el);
    });
  }

  // ---- Country detail modal (12-month SVG chart + factors) ----
  function openModal(code) {
    const c = COUNTRIES.find((x) => x.code === code);
    if (!c) return;

    const monthsData = c.monthly.map((_, i) => opportunityIndex(c, i));
    const maxV = Math.max(...monthsData);

    // Build SVG bar chart
    const W = 520, H = 190, pad = 26, n = 12;
    const bw = (W - pad * 2) / n;
    let bars = "";
    monthsData.forEach((v, i) => {
      const bh = ((v - 35) / (99 - 35)) * (H - pad - 30);
      const x = pad + i * bw + bw * 0.16;
      const y = H - 26 - bh;
      const w = bw * 0.68;
      const isNow = i === state.month;
      bars += `
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(2, bh).toFixed(1)}"
              rx="4" fill="${heatColor(v)}" opacity="${isNow ? 1 : 0.55}"
              stroke="${isNow ? "#3a2a1e" : "none"}" stroke-width="${isNow ? 1.6 : 0}"></rect>
        <text x="${(x + w / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle"
              class="chart__val" style="font-weight:${isNow ? 800 : 600}">${v}</text>
        <text x="${(x + w / 2).toFixed(1)}" y="${H - 9}" text-anchor="middle" class="chart__lbl">${MONTHS[state.lang][i]}</text>
      `;
    });
    const svg = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="12-month trend">${bars}</svg>`;

    const factorRows = [
      ["method.f1.t", c.factors.size],
      ["method.f2.t", c.factors.power],
      ["method.f3.t", c.factors.elearning],
      ["method.f4.t", c.factors.culture],
    ].map(([key, val]) => `
      <div class="frow">
        <span class="frow__label">${t(key)}</span>
        <span class="frow__meter"><span class="frow__bar" style="width:${val}%;background:${heatColor(val)}"></span></span>
        <span class="frow__val">${val}</span>
      </div>
    `).join("");

    const panel = $("#modalPanel");
    panel.innerHTML = `
      <button class="modal__close" data-close aria-label="${t("modal.close")}">✕</button>
      <div class="modal__header">
        <span class="modal__flag">${c.flag}</span>
        <div>
          <h3 class="modal__title">${cname(c)}</h3>
          <p class="modal__now">${t("modal.thismonth")}: <strong style="color:${heatColor(opportunityIndex(c, state.month))}">${opportunityIndex(c, state.month)}</strong> · ${MONTHS_LONG[state.lang][state.month]}</p>
        </div>
      </div>
      <p class="modal__note">${c.note[state.lang]}</p>
      <h4 class="modal__sub">${t("modal.trend")}</h4>
      ${svg}
      <h4 class="modal__sub">${t("modal.factors")}</h4>
      <div class="factors">${factorRows}</div>
    `;

    const modal = $("#countryModal");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    $$("[data-close]", modal).forEach((el) =>
      el.addEventListener("click", closeModal)
    );
  }

  function closeModal() {
    const modal = $("#countryModal");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  // ============================ EVENTS ============================

  function wireLanguage() {
    $$(".lang__btn").forEach((b) =>
      b.addEventListener("click", () => {
        state.lang = b.dataset.lang;
        localStorage.setItem("vs_lang", state.lang);
        renderAll();
      })
    );
  }

  function wireNav() {
    const toggle = $("#navToggle");
    const links = $("#navLinks");
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("#navLinks a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
    // Close modal on ESC / backdrop already wired per-open
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  function wireContact() {
    const form = $("#contactForm");
    const status = $("#contactStatus");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#cName").value.trim();
      const email = $("#cEmail").value.trim();
      const msg = $("#cMsg").value.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name || !emailOk || !msg) {
        status.textContent = t("contact.err");
        status.className = "contact__status is-err";
        return;
      }
      const subject = encodeURIComponent(`[VentaScope] ${name}`);
      const body = encodeURIComponent(`${msg}\n\n— ${name} (${email})`);
      window.location.href = `mailto:hola@ventascope.com?subject=${subject}&body=${body}`;
      status.textContent = t("contact.ok");
      status.className = "contact__status is-ok";
      form.reset();
    });
  }

  // ============================ BOOT ============================

  function renderAll() {
    applyStaticI18n();
    renderMonths();
    renderRegions();
    renderHeroCard();
    renderMarket();
    renderCourses();
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireLanguage();
    wireNav();
    wireContact();
    renderAll();
  });
})();
