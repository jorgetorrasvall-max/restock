# ReStock — Rediseño completo desde cero

**Fecha:** 2026-04-23  
**Estado:** Aprobado · pendiente implementación  
**Scope:** Frontend estático completo (HTML/CSS/JS, sin framework, sin build step)

---

## 1. Decisiones de diseño validadas

Todas las decisiones fueron tomadas visualmente mediante el visual companion durante la sesión de brainstorming.

| Decisión | Elección | Alternativas descartadas |
|---|---|---|
| Dirección visual | Minimalista Clean | Profesional oscuro, Marketplace vivo, Premium Amber |
| Paleta | Navy Profesional | Índigo+Verde, Negro+Oro, Fintech Amber, Azul+Verde, Slate+Cyan |
| Tipografía | Inter (familia única) | Space Grotesk+DM Sans, Plus Jakarta Sans, Syne+DM Sans |
| Layout marketplace | Lista densa | Grid cards, Sidebar+Grid |
| Hero landing | Navy full (fondo oscuro) | Headline centrado blanco, Split izq/dcha |

---

## 2. Sistema de color

### Tokens

| Token | Hex | Uso |
|---|---|---|
| `--navy` | `#0F172A` | Hero bg, botones primarios, logo en plataforma |
| `--navy-mid` | `#1E293B` | Superficies elevadas en dark, borders oscuros |
| `--navy-light` | `#334155` | Borders oscuros, texto muted en dark |
| `--blue` | `#0369A1` | Acento principal, CTAs de conversión, barras de progreso |
| `--blue-sky` | `#38BDF8` | Highlights en hero oscuro (span de énfasis) |
| `--blue-pale` | `#DBEAFE` | Pills, badges, fondos de acento suave |
| `--blue-bg` | `#EFF6FF` | Chips activos, ghost buttons, hover states |
| `--white` | `#FFFFFF` | Cards, inputs, filas de lote |
| `--bg` | `#F8FAFC` | Fondo páginas de plataforma |
| `--bg-subtle` | `#F1F5F9` | Fondos de inputs, hover en filas |
| `--text` | `#0F172A` | Texto principal (mismo que navy) |
| `--muted` | `#64748B` | Subtítulos, metadatos, texto secundario |
| `--subtle` | `#94A3B8` | Texto placeholder, orig tachado |
| `--border` | `#E2E8F0` | Bordes de cards, inputs, separadores |
| `--border-light` | `#CBD5E1` | Bordes de botón secundario |
| `--discount` | `#FEF9C3` / `#854D0E` | Tag de descuento (bg / texto) |
| `--verified` | `#F0FDF4` / `#166534` | Tag verificado (bg / texto) |

### Contraste (WCAG)
- Blanco sobre `#0F172A` → 18.1:1 ✓ AAA
- `#0F172A` sobre blanco → 18.1:1 ✓ AAA
- `#0369A1` sobre blanco → 4.6:1 ✓ AA
- `#64748B` sobre blanco → 4.6:1 ✓ AA

---

## 3. Tipografía

**Fuente única: Inter** (Google Fonts)  
```
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
```

### Escala

| Nombre | Peso | Tamaño | Letter-spacing | Uso |
|---|---|---|---|---|
| Display | 900 | 48px desktop / 32px móvil | -1.5px | Headline hero principal |
| H1 | 800 | 32px | -0.8px | Títulos de sección landing |
| H2 | 700 | 22px | -0.5px | Títulos de página plataforma |
| H3 | 600 | 16px | -0.3px | Subtítulos, nombres de lote en detalle |
| Body | 400 | 14px | 0 | Texto corrido, descripciones |
| Body sm | 400 | 12px | 0 | Metadatos, filas de lista |
| Label | 600 | 10px | +1.2px | Labels uppercase (categoría, estado) |
| Micro | 400 | 9-10px | 0 | Precios tachados, porcentajes vendido |

---

## 4. Espaciado y layout

- **Base unit:** 4px
- **Escala:** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64
- **Max-width contenido:** 1200px
- **Padding lateral:** 24px (móvil) · 48px (tablet) · 64px (desktop)
- **Border-radius:** 6px (filas) · 8px (cards) · 10px (panels) · 99px (pills/chips)
- **Nav height:** 60px

### Breakpoints
| Nombre | Min-width | Cambio principal |
|---|---|---|
| Mobile | 375px | Lista densa → cards, nav → hamburger |
| Tablet | 768px | 2 columnas en grid |
| Desktop | 1024px | Layout completo |
| Wide | 1440px | Max-width contenido centrado |

---

## 5. Componentes

### 5.1 Navbar — dos modos

**Plataforma (fondo blanco):**
- Logo `restock` en negro 800
- Links: Marketplace · Mensajes · Perfil (color `--muted`)
- CTA derecha: botón negro `+ Publicar`
- Border bottom: `--border`
- Position: fixed top, z-index 50

**Landing (fondo navy):**
- Logo `restock` en blanco 800
- Links: Cómo funciona · Comisiones · Early Adopter (color `--navy-light`)
- CTA derecha: botón azul `Ir a la plataforma →`
- Sin border

### 5.2 Botones

| Variante | Background | Color | Border | Uso |
|---|---|---|---|---|
| Primary | `#0F172A` | `#fff` | — | CTAs principales (Entrar, Publicar) |
| Accent | `#0369A1` | `#fff` | — | Conversión (Contactar vendedor) |
| Secondary | `#fff` | `#0F172A` | `--border-light` 1.5px | Alternativo (Cómo funciona) |
| Ghost | `#EFF6FF` | `#0369A1` | — | Terciario (+ Publicar lote) |
| Small | `#0F172A` | `#fff` | — | Listas densas (Ver →) |

Todos: `border-radius: 7px` · `font-weight: 600` · `transition: opacity 150ms`  
Hover: `opacity: 0.85` · `cursor: pointer`

### 5.3 Fila de lote (componente core)

```
[thumbnail 36px] [nombre + meta + barra progreso]  [precio / tachado]  [Ver →]
```

- Thumbnail: 36×36px, border-radius 6px, fondo `#EFF6FF`
- Nombre: Inter 600 12px `--text`
- Tags inline: discount (amarillo), verified (verde), new (azul)
- Meta: Inter 400 10px `--subtle` (categoría · ciudad · condición)
- Barra progreso: 3px alto, fondo `--bg-subtle`, fill `--blue`, ancho = % vendido
- Texto progreso: 9px `--blue` 600 (ej: "60% vendido · 80 restantes")
- Precio: Inter 700 14px `--text`
- Precio orig: 10px tachado `--subtle`
- CTA "Ver lote →": botón small negro
- Border: 1px `--border` · border-radius 8px
- Hover: border-color `--blue` · transition 150ms
- cursor: pointer en toda la fila

### 5.4 Chips de categoría

- Default: bg `#fff` · border `--border` · text `--text` 500 11px · border-radius 99px · padding 4px 12px
- Activo: bg `--blue-bg` · border `--blue` · text `--blue` 600
- Hover: border-color `--blue` · cursor pointer · transition 150ms

### 5.5 Badges y tags

| Tipo | BG | Text | Uso |
|---|---|---|---|
| Pill estado | `--blue-pale` | `#1D4ED8` 600 | Fase beta, Verificado |
| Discount | `#FEF9C3` | `#854D0E` 700 | -40%, -32% |
| Verified | `#F0FDF4` | `#166534` 600 | ✓ Certificado |
| New | `--blue-bg` | `--blue` 600 | Nuevo |

### 5.6 Inputs

- Background: `--bg` (`#F8FAFC`)
- Border: 1.5px `--border` · border-radius 7px · padding 9px 14px
- Font: Inter 400 12px
- Placeholder: `--subtle`
- Focus: border-color `--blue` · outline none
- Label: Inter 600 11px `--text` · margin-bottom 5px

### 5.7 Buscador

- Igual que input + icono SVG lupa a la izquierda (Heroicons, color `--subtle`)
- Width 100% en móvil

---

## 6. Páginas

### 6.1 index.html — Landing

**Secciones en orden:**
1. **Nav** — modo dark (navy)
2. **Hero** — fondo navy, headline display 900, span `--blue-sky`, pill "Fase beta", 2 CTAs (primario negro / secundario ghost), stats row (3 métricas)
3. **Preview marketplace** — lista de 3-4 lotes reales, card flotante sobre fondo navy
4. **Cómo funciona** — 3 pasos con iconos SVG, fondo blanco
5. **Early Adopter / Founders** — beneficios, código alpha, fondo `--bg`
6. **Comisiones** — tabla de tramos (3%/4%/5%), fondo blanco
7. **CTA final** — fondo navy, headline + botón primario
8. **Footer** — links, contacto, copyright

### 6.2 marketplace.html

- Nav blanco fijo
- Buscador full-width
- Row de chips de categoría (scroll horizontal en móvil)
- Lista densa de lotes (componente 5.3)
- Paginación simulada: mostrar los primeros 20 lotes de `data.js`, botón "Ver más" que añade 10 más al DOM
- Estado vacío si no hay resultados (ilustración SVG + texto)

### 6.3 producto.html

- Nav blanco
- Breadcrumb: Marketplace → Categoría → Nombre
- Galería / imagen principal (placeholder con emoji grande si no hay foto)
- Nombre lote, tags, precio destacado, precio original tachado
- Barra progreso % vendido, prominente
- Info del lote: unidades totales, mínimo, condición, ciudad
- CTA "Contactar vendedor" → botón azul accent, tamaño grande
- Sección info del vendedor: nombre, fecha registro, badge Fundador si aplica
- Lotes relacionados: 3 filas del mismo vendedor o misma categoría

### 6.4 publicar.html

- Nav blanco
- Form en columna única, max-width 600px centrado
- Campos: nombre, categoría (select), condición, precio/ud, unidades, mínimo, ciudad, descripción, fotos (input file UI, sin upload real — prototipo)
- Preview card del lote en tiempo real (sidebar en desktop, debajo en móvil)
- CTA "Publicar lote" → botón primario negro, full-width
- Validación visible inline (border rojo + mensaje)

### 6.5 mensajes.html

- Split layout: lista conversaciones (280px) · chat (flex 1)
- Lista: avatar inicial, nombre, último mensaje truncado, timestamp
- Chat: burbujas (yo: navy · otro: `--bg`) · input footer fijo con botón enviar
- Responsive: en móvil, lista primero, chat al tap

### 6.6 login.html

- Centrado vertical y horizontal, max-width 400px
- Logo `restock` grande arriba
- Form: email + contraseña + botón primario
- Link "¿No tienes cuenta? Usa tu código alpha"
- Input código alpha (aparece si hace clic en el link)
- Fondo `--bg`

### 6.7 perfil.html

- Nav blanco
- Header: nombre, email, badge Fundador (si aplica), fecha registro
- Stats: lotes publicados, ventas realizadas, compras
- Grid de lotes propios (filas de lista densa)
- Botón "Cerrar sesión" ghost rojo

### 6.8 admin.html

- Solo acceso si `user.isAdmin === true`
- Nav con badge "Admin" en rojo
- Tabla de usuarios, tabla de lotes, panel de códigos alpha
- Acciones: ver, desactivar, exportar CSV

---

## 7. Reglas del sistema

### Siempre
- SVG icons únicamente (Heroicons o Lucide). **Nunca emojis como iconos** (solo en previews/thumbnails de lote)
- `cursor: pointer` en todos los elementos clickables
- Transiciones: `150ms ease` para colores, borders, opacity
- `200ms ease` para transforms
- Focus ring visible: `outline: 2px solid #0369A1; outline-offset: 2px`
- `prefers-reduced-motion`: desactivar todas las transiciones/animaciones
- Contraste mínimo 4.5:1 para todo texto
- Imágenes: `alt` descriptivo en todas

### Nunca
- Gradientes de color en ningún elemento
- Sombras decorativas pesadas (máximo `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`)
- Más de una familia tipográfica (solo Inter)
- Verde como color de acento principal
- Emojis como iconos de UI (solo en thumbnails de lotes como placeholder)
- Bordes redondeados excesivos (máximo 10px en panels, 99px solo en pills)

### CSS variables (app.css)
```css
:root {
  --navy:         #0F172A;
  --navy-mid:     #1E293B;
  --navy-light:   #334155;
  --blue:         #0369A1;
  --blue-sky:     #38BDF8;
  --blue-pale:    #DBEAFE;
  --blue-bg:      #EFF6FF;
  --white:        #FFFFFF;
  --bg:           #F8FAFC;
  --bg-subtle:    #F1F5F9;
  --text:         #0F172A;
  --muted:        #64748B;
  --subtle:       #94A3B8;
  --border:       #E2E8F0;
  --border-light: #CBD5E1;
  --radius-sm:    6px;
  --radius:       8px;
  --radius-lg:    10px;
  --radius-pill:  99px;
  --nav-h:        60px;
  --shadow-sm:    0 1px 3px rgba(0,0,0,0.08);
  --transition:   150ms ease;
}
```

---

## 8. Arquitectura de archivos (sin cambios)

```
ReStock-Producto/
├── index.html          landing page
├── marketplace.html    lista de lotes
├── producto.html       detalle de lote
├── publicar.html       formulario publicar
├── mensajes.html       chat
├── perfil.html         perfil de usuario
├── login.html          autenticación
├── admin.html          panel admin
├── styles.css          solo para index.html
├── app.css             todas las páginas de plataforma
├── data.js             datos mock (no cambia la estructura)
├── shared.js           auth, getParam (no cambia)
└── app.js              lógica de plataforma
```

**Dos CSS separados se mantienen:** `styles.css` (landing) y `app.css` (plataforma). Ambos se reescriben desde cero con el nuevo sistema de variables.

---

## 9. Checklist pre-entrega

- [ ] No emojis como iconos (solo Heroicons/Lucide SVG inline)
- [ ] `cursor: pointer` en todos los elementos clickables
- [ ] Hover states en todas las filas, botones y links (150ms)
- [ ] Focus ring visible en inputs y botones (outline azul)
- [ ] Texto mínimo 16px en móvil
- [ ] Sin scroll horizontal en ningún breakpoint
- [ ] Nav fija sin tapar contenido (padding-top = `--nav-h`)
- [ ] Contraste 4.5:1 mínimo en todo texto
- [ ] `prefers-reduced-motion` implementado
- [ ] `alt` en todas las imágenes
- [ ] Responsive verificado en 375px, 768px, 1024px, 1440px
- [ ] `data.js` y `shared.js` sin modificaciones estructurales
- [ ] Variables CSS definidas en `:root` de cada archivo CSS
