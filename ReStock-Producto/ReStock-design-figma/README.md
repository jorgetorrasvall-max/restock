# ReStock · Design Specifications (Figma)

**Proyecto:** ReStock — Marketplace B2B del stock sobrante  
**Entorno:** Barcelona · España · 2026  
**Fase:** Beta por invitación  
**Fecha de entrega:** 18 abril 2026

---

## Archivos en Figma

| Archivo | Tipo | URL | Estado |
|---|---|---|---|
| **ReStock · Design System** | Figma Design | https://www.figma.com/design/XDjfjIu9Pm9pFtnw9yi7Sr | ✅ Completo |
| **ReStock · User Flows MVP** | FigJam | https://www.figma.com/board/UIsi7acGujhZHqMXaUNw2h | ✅ Completo |
| **ReStock · Wireframes MVP** | Figma Design | https://www.figma.com/design/IIRsrzlGIGEoRaW335IPYg | ✅ Completo |
| **ReStock · Mockups Hi-Fi MVP** | Figma Design | https://www.figma.com/design/WGcFxMUq61Ssf46hnxQxPw | 🟡 Parcial (Login OK · Dashboard/Mis Lotes pendientes por límite MCP) |

> Nota: los 4 archivos están creados en tu workspace personal de Figma (`Jorge Torras's team`). Puedes moverlos a una carpeta/project "ReStock-design-figma" manualmente desde la UI de Figma (click derecho → Move to project), o crear la carpeta desde Figma web y arrastrar los archivos.

---

## 1 · Design System — Contenido

**Páginas del archivo (3):**

- `📘 Cover` — Portada con branding, título v1.0 e índice
- `🎨 Foundations` — Colors, Typography, Spacing, Radius (con swatches visuales)
- `🧩 Components` — Biblioteca base de componentes

**Variables creadas:**
- **Colors** (41): Primary Navy (50–950), Accent Gold (50–900), Neutral Gray (0–950), Semantic (success/warning/error/info ×2)
- **Spacing** (12): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px
- **Radius** (6): sm=4, md=8, lg=12, xl=16, 2xl=24, full=9999
- **Text styles** (16): Display XL/L/M, Heading H1–H4, Body L/M/S, Label M/S, Button L/M, Caption, Overline — todas en Inter

**Componentes entregados:**

- Buttons — 5 variantes (Primary, Accent, Secondary, Ghost, Danger) × 3 tamaños × 4 estados (default, hover, focus, disabled) = 60 variantes visualizadas
- Inputs — default, filled, focus, error, disabled + Search input con icono + Textarea + Select/Dropdown
- Badges — success, warning, neutral, error, info, founder (pill shape)
- Tags — removable con close button
- Checkbox + Toggle (on/off)
- Cards — Stat cards (4 KPI examples), Lote cards (product), Basic card
- Navbar — logged state con logo, links, search, CTA Publicar, bell, avatar
- Sidebar — navegación vertical con ítem activo (fondo primary/50)
- Table — header + 5 filas con thumbnail, badges de estado, menú ⋯
- Modal — publicar lote con form fields y CTAs
- Alerts — 4 variantes (success, warning, error, info)
- Toast notification

---

## 2 · User Flows (FigJam)

3 flujos críticos del MVP:

1. **FLOW 01 — Onboarding & Acceso**  
   Landing → Solicitar acceso → ¿Tiene código? → Activar código → Crear cuenta (NIF+empresa) → Verificar email → Dashboard  
   (Rama: si no tiene código → Solicitar plaza → Email con código alpha → Activar)

2. **FLOW 02 — Vendedor · Publicar Lote**  
   Dashboard → + Publicar lote → Datos básicos → Imágenes (hasta 8) → Precio + tipo → Revisar → Pendiente revisión (24h) → Activo ✅  
   (Rama: Rechazado → Editar lote → re-revisar)

3. **FLOW 03 — Comprador · Descubrir + Negociar + Comprar**  
   Dashboard → Explorar → Filtros → Ficha de lote → Contactar vendedor → Negociar → Aceptar oferta → Pago Stripe → Confirmación + tracking → Valorar  
   (Rama: Pago KO → Reintentar o cambiar método)

**Leyenda visual:** Paso normal (blanco/navy) · Decisión (amarillo suave) · Éxito (verde) · Espera (amarillo) · Error/Rechazo (rojo suave).

---

## 3 · Wireframes MVP

**Páginas (3):**

- `🖼 Wireframes · Desktop` — 3 pantallas a 1440×900 en escala de grises
  - M1 · Login / Acceso (split 50/50, form con tabs "Tengo código" / "Solicitar acceso")
  - M2 · Dashboard (navbar top, sidebar 240px, 4 KPIs, chart 740×300, panel actividad, strip de lotes)
  - M3 · Mis Lotes / Inventario (filtros + tabs de estado + tabla de 6 filas con thumbnail, badges, menú ⋯)
- `📱 Wireframes · Mobile` — 3 pantallas a 375×812
  - M1 Login (header hero + form compacto)
  - M2 Dashboard (2×2 KPIs + chart + lotes stacked + tab bar inferior)
  - M3 Mis Lotes (search + filter chips horizontales + cards stacked + tab bar)
- `📝 Annotations` — Notas de handoff para desarrollo

**Handoff notes cubren:** grid/breakpoints, navegación desktop vs mobile, componentes críticos, interacciones y estados, accesibilidad WCAG AA, contenidos y tono.

---

## 4 · Mockups Hi-Fi MVP

**Páginas (3):**

- `💻 Mockups · Desktop`
  - ✅ **M1 · Login** — HECHO. Hero navy con orbes de luz doradas, logo + brand con badge dorado, headline 64px "Liquida stock. Gana margen.", stats row, panel derecho con tabs segmentadas (activas con sombra), inputs con iconos, CTA gold con shadow, trust row (Stripe · NIF · 2 min)
  - 🟡 **M2 · Dashboard** — PENDIENTE (bloqueado por límite MCP)
  - 🟡 **M3 · Mis Lotes** — PENDIENTE (bloqueado por límite MCP)
- `📱 Mockups · Mobile` — Creada, vacía (pendiente)
- `📘 Cover` — Creada, vacía (pendiente)

### Trabajo pendiente (detallado)

Cuando se resetee la cuota MCP de Figma (~24h) o subas a Expert seat, quedan por construir:

**M2 Dashboard Hi-Fi:**
- Navbar blanco (logo navy + links + search pill + CTA gold + bell + avatar)
- Sidebar blanco con navegación (activo: fondo primary/50 + barra lateral gold)
- Card fundador gold en bottom sidebar con CTA
- Greeting + time filter pill (7d/30d/90d/Año)
- 4 KPI cards con icono en pill + delta badge (↑/↓ en verde/rojo) + valor en Inter Black 28px
- Chart card 752×320: Evolución de ventas con 14 barras navy + última barra gold
- Activity panel 344×320: 4 ítems con avatar circular coloreado
- Strip horizontal "Tus lotes activos" con 4 cards (thumb colored + title + qty + price gold + status pill)

**M3 Mis Lotes Hi-Fi:**
- Navbar + sidebar reutilizados
- Page header con título + breadcrumb
- Filter bar 1376×64 con search + 4 dropdowns (Categoría, Estado, Precio, País)
- Tabs de estado (Todos/Activos/Pendientes/Vendidos/Rechazados) con contadores
- Tabla full-width con 6 filas, thumbnails, badges de estado, menú contextual ⋯, y paginación abajo

**Mobile Hi-Fi:** 3 pantallas a 375×812 replicando wireframes con branding aplicado.

---

## 5 · Design Tokens (referencia rápida)

```json
{
  "color": {
    "primary": {
      "50": "#EEF2F8", "100": "#D5DDEB", "200": "#ABBBD8",
      "300": "#8199C4", "400": "#5777B1", "500": "#3A5A98",
      "600": "#2C4A82", "700": "#1A3C6E", "800": "#152F57",
      "900": "#122D54", "950": "#0C1F3A"
    },
    "accent": {
      "50": "#FEF8ED", "100": "#FDEDD1", "200": "#FBD9A3",
      "300": "#F7C075", "400": "#EEAB47", "500": "#E8A020",
      "600": "#C7851B", "700": "#A16B17", "800": "#7F5413", "900": "#64420F"
    },
    "neutral": {
      "0": "#FFFFFF", "50": "#F9FAFB", "100": "#F3F4F6",
      "200": "#E5E7EB", "300": "#D1D5DB", "400": "#9CA3AF",
      "500": "#6B7280", "600": "#4B5563", "700": "#374151",
      "800": "#1F2937", "900": "#111827", "950": "#030712"
    },
    "semantic": {
      "success": { "500": "#10B981", "100": "#D1FAE5" },
      "warning": { "500": "#F59E0B", "100": "#FEF3C7" },
      "error":   { "500": "#EF4444", "100": "#FEE2E2" },
      "info":    { "500": "#3B82F6", "100": "#DBEAFE" }
    }
  },
  "spacing": {
    "1": 4, "2": 8, "3": 12, "4": 16, "5": 20, "6": 24,
    "8": 32, "10": 40, "12": 48, "16": 64, "20": 80, "24": 96
  },
  "radius": { "sm": 4, "md": 8, "lg": 12, "xl": 16, "2xl": 24, "full": 9999 },
  "typography": {
    "family": "Inter, -apple-system, sans-serif",
    "scale": {
      "display-xl": { "size": 88, "weight": 900, "lh": 96,  "ls": -2.5 },
      "display-l":  { "size": 64, "weight": 900, "lh": 72,  "ls": -2 },
      "display-m":  { "size": 48, "weight": 700, "lh": 56,  "ls": -1 },
      "h1":         { "size": 36, "weight": 700, "lh": 44,  "ls": -0.5 },
      "h2":         { "size": 28, "weight": 700, "lh": 36,  "ls": -0.25 },
      "h3":         { "size": 22, "weight": 600, "lh": 30 },
      "h4":         { "size": 18, "weight": 600, "lh": 26 },
      "body-l":     { "size": 18, "weight": 400, "lh": 28 },
      "body-m":     { "size": 16, "weight": 400, "lh": 24 },
      "body-s":     { "size": 14, "weight": 400, "lh": 20 },
      "button-l":   { "size": 16, "weight": 600, "lh": 24 },
      "caption":    { "size": 12, "weight": 400, "lh": 16 }
    }
  }
}
```

---

## 6 · Fuentes de identidad

La identidad se extrajo directamente de la landing actual `https://jorgetorrasvall-max.github.io/restock/` usando inspección del DOM. Principales hallazgos:

- **Navy primario** `#1A3C6E` — botón "Ir a la plataforma"
- **Navy profundo** `#122D54` — footer y fondo hero secondary
- **Gold accent** `#E8A020` — CTAs primarios "Entrar a la plataforma →" / "Activar código →"
- **Gray text** `#111827` — texto principal (Tailwind gray-900)
- **Gray surface** `#F9FAFB` — secciones alternas (Tailwind gray-50)
- **Inter** — tipografía con `-apple-system, sans-serif` como fallback
- **Radius base** 12px (variable `--radius`)

El diseño híbrido preserva la identidad navy+gold y evoluciona el sistema hacia una biblioteca completa con escalas, estados y componentes para la plataforma real (la landing es solo eso — landing — la plataforma aún no existe en web).

---

## 7 · Próximos pasos sugeridos (mis 30 años de experiencia hablan)

1. **Organización en Figma:** crea un Project "ReStock" y mueve los 4 archivos ahí (Figma UI → drafts → mover a project).
2. **Publicar Design System como Library:** en el archivo Design System, Assets panel → publicar. Luego suscribe los otros 3 archivos.
3. **Prioridad de construcción MVP:** Login → Dashboard → Publicar Lote → Explorar marketplace → Ficha de lote → Chat → Stripe checkout.
4. **Validación con early adopters ANTES de construir:** los 10 fundadores que tienes son oro para prototipar en Figma (modo prototype) y validar flujos antes de tocar código. Cada iteración de código cuesta 10× más que una de Figma.
5. **Métricas a instrumentar desde día 1:** time-to-first-publish, GMV por tramo de comisión, conversion landing→beta, retention a 30d, % negociaciones que terminan en compra.
6. **Decisión de negocio clave a validar con data:** ¿el 3% de comisión en lotes ≥1 000€ es suficiente para cubrir CAC? Mira B-Stock: promedian 8-12% blended en EEUU. Tu tramo más bajo puede ser diferenciador pero también una trampa si no consigues volumen.

Cuando quieras retomar, dime "continúa con los mockups" y en cuanto Figma me deje seguir, termino Dashboard y Mis Lotes.
