# ✦ VELORA — Tienda online

Tienda online elegante, pensada para transmitir confianza y profesionalidad.
Construida desde cero, sin dependencias externas, y publicada gratis en GitHub Pages.

> Nombre elegido: **Velora** (antes Áurea). Si algún día querés cambiarlo,
> se hace en minutos.

---

## Qué incluye la tienda

| Función | Detalle |
|---|---|
| 🛍️ Catálogo | Con buscador, filtros por categoría y sección de Ofertas automática |
| 🛒 Carrito | Lateral, con cantidades, subtotal y persistencia (no se pierde al recargar) |
| ☰ Menú de 3 barritas | Con secciones: Inicio, Catálogo, Ofertas, Sobre nosotros, Contacto, Mi cuenta |
| 👤 Cuentas | Registro e inicio de sesión, con contraseñas protegidas criptográficamente |
| ⚙ Panel del creador | Solo visible para tu usuario: agregar, editar y borrar productos sin tocar código |
| 💳 Checkout | Formulario de compra + integración con links de pago (Mercado Pago / Stripe / PayPal) |
| 🔒 Privacidad | Política de privacidad incluida y defensas técnicas activas (ver abajo) |

## Tu usuario como creador

1. Entrá a la tienda y tocá **Entrar** (arriba a la derecha) → **Crear cuenta**.
2. Registrate con el email **pedidosvelora@gmail.com** (el que está configurado como creador).
3. Al iniciar sesión con ese email vas a ver el **⚙ Panel del creador** en el menú de 3 barritas,
   donde podés cargar tus productos: nombre, precio, precio anterior (para ofertas), stock,
   foto (URL), emoji y link de pago.

Los cambios del panel se guardan en tu navegador. Cuando tengas el catálogo definitivo,
usá **Exportar catálogo**, pasame el texto en el chat y lo dejo fijo en el sitio para que
lo vean todos los visitantes desde cualquier dispositivo.

> Para cambiar el email del creador: editá `creatorEmail` en `assets/js/data.js`.

---

## 💰 Cómo cobrar el dinero (y cuánto cuesta)

La buena noticia: **no necesitás poner dinero para empezar a cobrar**. Los procesadores
de pago no cobran por abrir la cuenta, solo una comisión cuando efectivamente vendés.

### Opción recomendada: links de pago (sin programación, sin servidor)

1. **Creá una cuenta gratis** en uno de estos (según tu país):
   - **Mercado Pago** — el más usado en Latinoamérica. Comisión aprox. **3,5 % – 6,5 %** por venta según cuándo quieras recibir el dinero.
   - **Stripe** — internacional, muy profesional. Comisión aprox. **2,9 % + US$ 0,30** por venta.
   - **PayPal** — bueno para ventas al exterior. Comisión aprox. **3,5 % – 5,4 %**.
2. **Qué te van a pedir:** documento de identidad, una cuenta bancaria (CBU/CVU/IBAN según país)
   para depositarte el dinero, y datos básicos. Si vendés como persona no hace falta tener empresa;
   más adelante, si crece, conviene registrarse como monotributista/autónomo para facturar.
3. **Generá un "link de pago"** desde la app o web del procesador (ellos lo hacen en 1 minuto:
   ponés nombre del producto y precio, te dan un link `https://mpago.la/...` o `https://buy.stripe.com/...`).
4. **Pegá ese link en tu tienda**: en el Panel del creador, editá el producto y completá el campo
   **Link de pago**. También podés poner un link general en `checkoutUrl` dentro de `assets/js/data.js`.
5. Listo: cuando alguien finaliza la compra, la tienda lo lleva a pagar a la plataforma segura
   y a vos te llega un email con el detalle del pedido (productos, total, datos de entrega).

### ¿Cuánto dinero necesito poner?

| Concepto | Costo |
|---|---|
| Hosting del sitio (GitHub Pages) | **$0** |
| Cuenta en Mercado Pago / Stripe / PayPal | **$0** (solo comisión por venta) |
| La tienda (este código) | **$0** |
| **Total obligatorio para arrancar** | **$0** |
| Dominio propio, ej. `velora.cl` (opcional, más profesional) | US$ 10–15 por año |
| Stock inicial de productos (si comprás para revender) | Depende de vos: se puede arrancar con poco (ej. US$ 100–200) o con dropshipping, sin stock |

---

## 📈 Qué conviene vender (productos "que pegan")

Criterio: alta demanda constante, buen margen, livianos de enviar y fáciles de fotografiar bien.
El catálogo de ejemplo ya viene cargado con estas categorías:

1. **Accesorios de tecnología** — auriculares inalámbricos, smartwatches, cargadores, fundas.
   Se venden todo el año y la gente los compra por impulso.
2. **Hogar y ambiente** — lámparas LED, difusores aromáticos, organizadores. Categoría estrella
   post-pandemia; muy buscada en redes.
3. **Cuidado personal / skincare** — sets de rutina facial, botellas térmicas. Alta recompra:
   el mismo cliente vuelve a comprar.
4. **Accesorios personales** — joyería minimalista, billeteras slim. Margen altísimo
   (se compra barato, se vende con 2–3× de ganancia) y sirven para regalo.
5. **Fitness** — bandas elásticas, esterillas de yoga. Picos en enero y antes del verano.

**Consejos para vender más:** empezá con pocas cosas (10–15 productos) bien elegidas y con
buenas fotos; mantené siempre alguna oferta activa (la sección Ofertas la arma sola cuando
un producto tiene precio anterior); y difundí el link de la tienda en Instagram/TikTok con
videos cortos mostrando el producto en uso — es el canal que más tráfico gratuito trae.

---

## 🔒 Defensa de la información personal

Defensas técnicas ya activas en el sitio:

- **Contraseñas nunca en texto plano**: se derivan con **PBKDF2 (100.000 iteraciones, SHA-256)
  y sal aleatoria única** por usuario. Ni siquiera el creador puede leerlas.
- **Los datos no salen del dispositivo del visitante**: cuentas y carrito viven solo en el
  navegador de cada persona. No hay base de datos central que pueda ser robada.
- **Las tarjetas nunca tocan la tienda**: el pago ocurre en Mercado Pago/Stripe/PayPal,
  plataformas certificadas **PCI-DSS** (el estándar de seguridad de la industria de tarjetas).
- **Content Security Policy estricta**: el navegador bloquea cualquier script externo o
  inyectado, la principal vía de robo de datos en tiendas online (ataques tipo Magecart).
- **Escapado de todo dato dinámico** al renderizar: previene ataques XSS.
- **Sin rastreadores**: cero cookies publicitarias, cero analítica de terceros, cero píxeles.
- **HTTPS obligatorio**: GitHub Pages sirve el sitio siempre cifrado.
- **Minimización de datos**: solo se pide lo imprescindible (nombre, email y, al comprar,
  teléfono y dirección). Menos datos guardados = menos datos que proteger.
- **Política de privacidad visible** en el menú y el pie de página, en lenguaje claro.

## Cómo se publica

Cada `push` a la rama `claude/ecommerce-app-rebuild-5gddvc` despliega automáticamente a
GitHub Pages (workflow en `.github/workflows/deploy.yml`). El repositorio debe estar en
**Público** para que Pages funcione gratis.

## Estructura del proyecto

```
index.html              → estructura de la página (una sola página, todas las secciones)
assets/css/styles.css   → diseño (paleta marfil / tinta / dorado)
assets/js/data.js       → configuración de la tienda + catálogo inicial (editable)
assets/js/app.js        → lógica: carrito, cuentas, panel del creador, checkout
```
