# ReStock · Especificaciones UI del Producto Completo

> Versión 1.0 · 22 abril 2026 · Jorge Torras
> Diseñado en Claude Design (Figma MCP) sobre los 4 archivos ya existentes del proyecto `ReStock-design-figma`.

---

## 1. Enlaces directos

### Archivos Figma del proyecto

| Archivo | Estado | URL |
|---|---|---|
| Design System | 100% (tokens + componentes) | https://www.figma.com/design/XDjfjIu9Pm9pFtnw9yi7Sr |
| User Flows (FigJam) | 100% base + diagrama producto completo | https://www.figma.com/design/UIsi7acGujhZHqMXaUNw2h |
| Wireframes MVP | 100% | https://www.figma.com/design/IIRsrzlGIGEoRaW335IPYg |
| **Mockups Hi-Fi · Producto completo** | **100% desktop + 5 mobile** | https://www.figma.com/design/WGcFxMUq61Ssf46hnxQxPw |

### Diagrama de flujos recién generado
- `ReStock · User Flows Producto Completo` (FigJam): https://www.figma.com/online-whiteboard/create-diagram/084d6757-7f06-4a97-ac52-6dc8da82ef39

---

## 2. Alcance de la entrega

Se ha completado la vista **producto completo** al nivel de mockup de alta fidelidad. La entrega anterior tenía solo Login desktop (33%). Ahora están cubiertas todas las pantallas núcleo del marketplace:

### Desktop (1440 × variable) · página `💻 Mockups · Desktop`

1. **M1 · Login / Acceso** (ya existía) — dos tabs *Tengo código* / *Solicitar acceso*, con panel izquierdo navy y formulario derecho.
2. **M2 · Landing / Home** — hero navy + oro, bloques *Problema*, *Cómo funciona*, *Comisiones por tramos* (3%/4%/5%), *Early Adopter* y footer.
3. **M3 · Marketplace / Explorar** — sidebar de filtros (categoría, estado A–D, precio, ciudad) + grid 3 columnas de `product-card` con badge de estado, precio, vendedor, ciudad y antigüedad.
4. **M4 · Detalle de producto** — galería izquierda + ficha derecha con precio grande, previsión de comisión, CTAs *Contactar* y *Comprar*, bloque de vendedor, specs técnicas y "Lotes similares".
5. **M5 · Publicar lote** — wizard de 5 pasos con barra de progreso, cards de *Información básica*, *Estado y cantidad* (selector A/B/C/D), *Precio* con preview de comisión en vivo y *Imágenes* (drop zone).
6. **M6 · Mensajes** — layout clásico chat: lista de conversaciones a la izquierda (con badge de no leídos), header con mini-card del producto, burbujas y barra de input con adjuntos.
7. **M7 · Perfil / Mi cuenta** — cover navy, avatar gold, badge `⭐ Fundador ReStock`, 4 KPIs, tabs *Mis lotes* / *Compras* / *Valoraciones* / *Configuración* y listado de lotes con acciones.
8. **M8 · Admin Panel** — solo `user.isAdmin`. 4 KPIs principales (Usuarios / Lotes / Códigos / GMV), tabla de usuarios, panel de códigos ALPHA con estado usado/libre y tabla de transacciones recientes.

### Mobile (375 × 812) · página `📱 Mockups · Mobile`

- **MM1 · Landing** — hero navy a pantalla completa con CTAs apilados y stats en fila.
- **MM2 · Marketplace** — barra sticky de búsqueda, chips de categoría, grid 2 columnas de product cards reducidas.
- **MM3 · Producto** — imagen 1:1, contenido scroll, sticky bottom bar con *Mensaje* + *Comprar {precio}*.
- **MM4 · Chat** — header con avatar y estado en línea, mini-card del producto en contexto, burbujas y *typing indicator*.
- **MM5 · Publicar (paso 2)** — selector de estado A/B/C/D como tarjetas verticales grandes, barra de progreso y navegación *Atrás / Siguiente*.

Todas las pantallas mobile comparten una **tab bar** con 5 items (Inicio · Explorar · **+ Publicar** destacado en gold · Mensajes · Perfil).

---

## 3. Sistema de diseño aplicado

Reutiliza 100% los tokens ya definidos en `design-tokens.json` del proyecto.

### Color

- **Navy** (primary) — `#1A3C6E` para marca, texto importante y CTAs secundarios.
- **Navy Dark** — `#122D54` para hero y fondos oscuros.
- **Gold** (accent) — `#E8A020` para CTA primario, badges destacados y highlights.
- **Gold Bg** — `#FEF8ED` fondo suave para estados seleccionados.
- **Escala neutral** — `gray-50` a `gray-900` (Tailwind-like) para texto y superficies.
- **Semántica de estado del lote**:
  - A Nuevo con etiqueta → verde `#059669` / bg `#ECFDF5`
  - B Nuevo sin etiqueta → azul `#0284C7` / bg `#EFF6FF`
  - C Buen estado → ámbar `#D97706` / bg `#FFFBEB`
  - D Defecto visible → rojo `#DC2626` / bg `#FEF2F2`

### Tipografía

`Inter` (400, 500, 600, 700, 800, 900). Escala: `display-xl 88/96`, `display-l 64/72`, `display-m 48/56`, `h1 36/44`, `h2 28/36`, `h3 22/30`, `body-m 16/24`, `body-s 14/20`, `caption 12/16`, `overline 11/16 tracking +1.5`.

### Layout

- Grid desktop `1280px` max-width, padding lateral `80px`.
- Grid mobile 2 columnas con gutter `9px`, padding lateral `16px`.
- Altura fija de nav `64px` (app) / `64px` (público) / `56px` (mobile).
- Radios: `8px` botones/inputs, `10-12px` cards, `16px` cards grandes, `24px` hero blocks.
- Sombra `0 2px 16px rgba(0,0,0,0.08)` para cards estándar, elevada `0 8px 32px rgba(0,0,0,0.12)`.

### Componentes reutilizables vistos en los mockups

`AppNav`, `PublicNav`, `SearchBar`, `UserDropdown`, `ProductCard`, `ConditionBadge`, `CommissionPreviewBox`, `SellerCard`, `ChatBubble`, `ChatListItem`, `ProgressWizard`, `StatusChip`, `MobileTabBar`.

---

## 4. Flujos principales (diagrama generado)

El FigJam `ReStock · User Flows Producto Completo` documenta los cinco flujos críticos del marketplace:

1. **Onboarding / acceso** — Landing → ¿código alpha? → Registro o solicitar acceso → Perfil con NIF → Marketplace.
2. **Vender** — Marketplace → +Publicar → wizard 5 pasos → Lote publicado → Mis lotes.
3. **Comprar** — Marketplace → Filtrar → Detalle → (Contactar vía chat ↔ ) → Comprar → Pago Stripe → Orden confirmada → Valoración.
4. **Mensajería** — Disponible tanto desde la nav (💬 Mensajes) como desde la CTA *Contactar vendedor* en el detalle. Alimenta al flujo de compra.
5. **Admin** — Usuarios · Códigos ALPHA · Transacciones · KPIs/GMV.

---

## 5. Decisiones de diseño destacadas

- **Navy + Gold como jerarquía de acción**. Navy = marca/confianza; Gold = acción que genera dinero (publicar, comprar, activar código). Nunca al revés.
- **Comisión siempre visible en contexto**. El `CommissionPreviewBox` aparece tanto al publicar ("Tú recibes 816€") como al ver el detalle ("Comisión 4% · 48€"). No hay letra pequeña.
- **Estado del lote como lenguaje principal**. Los badges A/B/C/D se repiten idénticos en marketplace, detalle, publicar y perfil, para que el usuario construya mentalmente la escala en segundos.
- **Badge de Fundador persistente**. `⭐ Fundador ReStock` se muestra en el perfil, en las conversaciones y en la fila de usuario del admin. Es un activo de confianza.
- **Mobile con publish destacado**. La tab bar eleva el botón + en oro como acción central, reflejando que la aplicación vive del ciclo *publicar ⇄ vender*.
- **Admin gated y minimal**. El panel admin solo aparece si `user.isAdmin === true` (ya implementado en `shared.js`). La jerarquía visual es distinta (engranaje, fondo más sobrio) para dejar claro que es una vista interna.

---

## 6. Pendientes / próximos pasos sugeridos

- **Estados de error y vacío** — onboarding con código inválido, marketplace sin resultados, chat sin conversaciones, perfil sin lotes.
- **Pantalla de pago Stripe embebida** — checkout dentro del flow de compra, todavía pendiente en hi-fi.
- **Post-venta** — confirmación de orden, tracking, valoración mutua, gestión de disputas.
- **Dashboard vendedor** — analítica de sus lotes (vistas/día, conversión a mensaje, ratio de cierre).
- **Tablet / 1024px** — actualmente solo desktop y mobile; para iPad vale con reflow del desktop a 2 columnas.
- **Publicar Library del Design System** — en Figma, menú Assets → *Publish library* sobre el archivo Design System, para que los demás archivos consuman tokens y componentes oficiales.

---

## 7. Guía rápida de uso para el equipo

1. **Diseño** → `Mockups Hi-Fi MVP` (archivo ya 100% desktop + mobile clave).
2. **Implementación front** → Los mockups siguen 1:1 la arquitectura actual en `ReStock-Producto/*.html`; cada frame Mxx tiene homólogo directo en su `.html`.
3. **Nuevas pantallas** → Partir de los tokens de `design-tokens.json` y de los componentes ya dibujados en los frames existentes (copiar + pegar + adaptar).
4. **Handoff dev** → Desde Figma, `Inspect` sobre cualquier nodo da medidas y CSS listo; los colores ya mapean a las variables `--navy`, `--gold`, etc., del `app.css`.
