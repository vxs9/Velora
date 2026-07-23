# 🧭 VentaScope

**Sales Tutoring & Market Intelligence** — *Te enseñamos a vender, y te mostramos dónde y cuándo hacerlo.*

> Aplicación web bilingüe (Español / English) para vender cursos de tutoría en
> ventas, con un **Explorador de Mercados** que indica en qué país es el mejor
> "punto caliente" para vender según el mes del año.
>
> A bilingual (Spanish / English) web app for selling sales-tutoring courses,
> featuring a **Market Explorer** that shows which country is the hottest
> selling opportunity for each month of the year.

---

## 🇪🇸 Español

### ¿Qué hace?
- **Explorador de Mercados:** elige un mes y una región y la app calcula un
  **Índice de Oportunidad (0–100)** para 12 países y los ordena del mejor al peor.
- El índice **cambia automáticamente cada mes** según ciclos de negocio reales
  (cierre de año fiscal, temporadas, hemisferio norte/sur, festividades).
- **Detalle por país:** gráfico de tendencia de 12 meses + desglose de factores.
- **Cursos:** 4 programas de tutoría con niveles, precios y resultados.
- **Bilingüe:** botón `ES / EN` que traduce toda la interfaz (recuerda tu elección).
- **Secciones:** biografías del equipo, metodología transparente y formulario de contacto.

### Cómo ejecutarla
No necesita instalación ni servidor. Basta con abrir el archivo:

```
Abre index.html en cualquier navegador moderno.
```

Para publicarla gratis en internet con **GitHub Pages**:
1. Settings → Pages → Source: `Deploy from a branch`.
2. Branch: la rama de este proyecto, carpeta `/ (root)`.
3. En unos minutos tendrás una URL pública.

### Cómo editar los datos
Todo el contenido editable está en 3 archivos, sin tocar código complejo:

| Quiero cambiar… | Archivo |
|---|---|
| Países, índice por mes, factores, cursos | `assets/js/data.js` |
| Cualquier texto / traducción | `assets/js/i18n.js` |
| Colores y estilo | `assets/css/styles.css` |

**Para tu biografía y la de tu socio:** edita las claves `about.p1.*` y
`about.p2.*` en `assets/js/i18n.js` (versión en español **y** en inglés).

### ⚠️ Nota honesta sobre los datos
Los índices son un **modelo curado con fines educativos**, no datos financieros
en vivo. Obtener datos de mercado reales mes a mes requeriría una API de pago y
un servidor backend. El modelo actual es realista, **sí varía cada mes** y es
totalmente editable por ti en `data.js`.

---

## 🇬🇧 English

### What it does
- **Market Explorer:** pick a month and region; the app computes an
  **Opportunity Index (0–100)** for 12 countries and ranks them.
- The index **changes automatically each month** based on real business cycles
  (fiscal year-ends, seasons, northern/southern hemisphere, holidays).
- **Country detail:** 12-month trend chart + factor breakdown.
- **Courses:** 4 tutoring programs with levels, prices and outcomes.
- **Bilingual:** an `ES / EN` toggle translates the whole UI (choice is remembered).
- **Sections:** team bios, a transparent methodology and a contact form.

### How to run it
No build, no server needed — just open `index.html` in any modern browser.
To publish it for free, enable **GitHub Pages** (Settings → Pages → deploy from
this branch, root folder).

### How to edit the data
Everything lives in three files: `assets/js/data.js` (countries, monthly index,
courses), `assets/js/i18n.js` (all text & translations) and
`assets/css/styles.css` (look & feel). Team bios are the `about.p1.*` /
`about.p2.*` keys in `i18n.js`.

### ⚠️ Honest note about the data
The indices are a **curated educational model**, not live financial data. Real
month-by-month market data would need a paid API and a backend. The current
model is realistic, updates every month, and is fully editable in `data.js`.

---

## 📁 Structure

```
aplicacion-ingles/
├── index.html              # Page structure
├── assets/
│   ├── css/styles.css      # Warm design system
│   └── js/
│       ├── data.js         # ← EDIT: countries, indices, courses
│       ├── i18n.js         # ← EDIT: all text & translations (incl. bios)
│       └── app.js          # App logic (rendering, i18n, charts)
└── README.md
```

## 🎨 Brand
- **Name:** VentaScope
- **Slogan (ES):** *Te enseñamos a vender — y te mostramos dónde y cuándo hacerlo.*
- **Slogan (EN):** *We teach you to sell — and show you where and when to do it.*
- **Contact (fictional):** `hola@ventascope.com`

*Educational project — all data is illustrative.*
