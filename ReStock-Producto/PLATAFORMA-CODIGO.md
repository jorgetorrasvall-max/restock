# ReStock — Plataforma y código de referencia

## Arquitectura general

```
ReStock-Producto/
├── index.html          ← Landing page (usa styles.css + app.js, NO shared.js)
├── marketplace.html    ← Grid de lotes con filtros
├── login.html          ← Login + registro con invite code
├── producto.html       ← Detalle de producto
├── publicar.html       ← Formulario publicar lote
├── perfil.html         ← Perfil de usuario
├── mensajes.html       ← Chat entre usuarios
├── admin.html          ← Panel de administración
├── data.js             ← Mock data: PRODUCTS, MOCK_USERS, MOCK_CONVERSATIONS, ALPHA_CODES, CATEGORIES, CONDITIONS
├── shared.js           ← Auth utils: getUser, setUser, requireAuth, getParam, logout
├── app.js              ← Helpers globales
├── app.css             ← Variables CSS (--navy, --gold, --radius, --nav-h)
└── styles.css          ← Solo para index.html
```

---

## data.js — Estructura de datos

### PRODUCTS (item)
```js
{
  id: 1,
  title: "Lote 200 camisetas polo...",
  category: "moda",          // ID de CATEGORIES
  condition: "A",            // "A" | "B" | "C" | "D"
  price: 850,                // precio total en €
  quantity: 200,
  unit: "unidades",
  seller: {
    id: 1,
    name: "Textiles Martínez",
    city: "Barcelona",
    rating: 4.8,
    reviews: 23,
    avatar: "TM",            // 2 letras para el círculo
    since: "Mar 2024"
  },
  description: "...",
  images: ["https://..."],
  created: "2024-03-15",
  views: 142,
  active: true
}
```

### CONDITIONS
```js
{
  A: { label: "Nuevo con etiqueta", color: "#059669", bg: "#ECFDF5" },
  B: { label: "Nuevo sin etiqueta", color: "#0284c7", bg: "#EFF6FF" },
  C: { label: "Buen estado",        color: "#d97706", bg: "#FFFBEB" },
  D: { label: "Defecto visible",    color: "#dc2626", bg: "#FEF2F2" }
}
```

### CATEGORIES
```js
[
  { id: "moda",         name: "Moda y textil" },
  { id: "electronica",  name: "Electrónica" },
  { id: "hogar",        name: "Hogar y jardín" },
  { id: "alimentacion", name: "Alimentación" },
  { id: "deportes",     name: "Deportes" },
  { id: "juguetes",     name: "Juguetes" },
  { id: "belleza",      name: "Belleza y salud" },
  { id: "oficina",      name: "Oficina" },
]
```

### MOCK_USERS (item)
```js
{
  id: 0,
  name: "Jorge Torras",
  email: "jorgetorrasvall@gmail.com",
  password: "jorretorritas2026",
  city: "Barcelona",
  type: "Vendedor",
  avatar: "JT",
  isAdmin: true,
  isFounder: true,
  products: 3
}
```

### MOCK_CONVERSATIONS (item)
```js
{
  id: 1,
  productId: 1,
  with: { id: 2, name: "Carlos López", avatar: "CL" },
  lastMessage: "¿Está disponible el lote?",
  time: "10:32",
  unread: 2,
  messages: [
    { from: "them", text: "Hola, ¿está disponible?", time: "10:30" },
    { from: "me",   text: "Sí, aún disponible.",     time: "10:31" }
  ]
}
```

### ALPHA_CODES (item)
```js
{ code: "RESTOCK-ALPHA-001", used: true, usedBy: "email@example.com" }
// Códigos del 001 al 020. Primeros 3 marcados used: true.
```

### Funciones helpers en data.js
```js
getCommission(price)   // → { rate, buyerFee, sellerFee, buyerTotal, sellerReceives }
daysAgo(dateStr)       // → "hace 3 días" | "hace 1 mes" | etc.
formatPrice(n)         // → "1.250€"
```

---

## shared.js — Auth y utilidades

```js
getUser()              // → objeto user de localStorage o null
setUser(user)          // → guarda en localStorage
logout()               // → limpia localStorage, redirige a login.html
requireAuth()          // → si no hay user, redirige a login.html
getParam(key)          // → URLSearchParams.get(key)
showToast(msg, type)   // → toast temporal (type: 'success'|'error')
```

---

## Patrones de código recurrentes

### Comisión en producto.html
```js
const rate = product.price >= 1000 ? 3 : product.price >= 500 ? 4 : 5;
const sellerFee = Math.round(product.price * rate / 100);
const sellerReceives = product.price - sellerFee;
```

### Tarjeta de producto (HTML)
```html
<div class="group flex flex-col bg-white border border-warm rounded-xl overflow-hidden hover:border-navy/30 hover:shadow-sm transition-all duration-200">
  <a href="producto.html?id=${p.id}" class="aspect-[4/3] bg-warm overflow-hidden block">
    <img src="${p.images[0]}" alt="${p.title}"
         class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
  </a>
  <div class="p-4 flex flex-col flex-1">
    <a href="producto.html?id=${p.id}"
       class="font-serif text-base font-semibold text-ink hover:text-navy transition-colors duration-150 leading-snug line-clamp-2 mb-2">
      ${p.title}
    </a>
    <div class="flex items-center gap-2 mb-3">
      <span class="text-xs px-2 py-0.5 rounded-full font-medium"
            style="background:${cond.bg};color:${cond.color}">${cond.label}</span>
      <span class="text-xs text-muted">${p.quantity} ${p.unit}</span>
    </div>
    <div class="mt-auto flex items-center justify-between">
      <span class="font-serif text-lg font-semibold text-navy">${formatPrice(p.price)}</span>
    </div>
  </div>
</div>
```

### Nav auth (páginas plataforma)
```js
const user = getUser();
document.getElementById('navAuth').innerHTML = user ? `
  <a href="mensajes.html" class="text-sm text-muted hover:text-ink ...">Mensajes</a>
  <a href="perfil.html" class="flex items-center gap-2 cursor-pointer group">
    <div class="w-7 h-7 rounded-full bg-navy text-white text-xs font-semibold flex items-center justify-center">${user.avatar}</div>
    <span class="text-sm text-muted group-hover:text-ink ... hidden lg:block">${user.name.split('—')[0].trim()}</span>
  </a>
  <a href="publicar.html" class="px-4 py-2 rounded-md bg-navy text-white text-sm font-medium hover:bg-navy-dark ...">Publicar lote</a>
` : `
  <a href="login.html" class="text-sm text-muted hover:text-ink ...">Iniciar sesión</a>
  <a href="login.html" class="px-4 py-2 rounded-md bg-navy text-white text-sm font-medium hover:bg-navy-dark ...">Registrarse</a>
`;
```

### Guard admin
```js
requireAuth();
const user = getUser();
if (!user || !user.isAdmin) window.location.href = 'login.html';
```

### Filtro de productos (marketplace)
```js
let filtered = PRODUCTS.filter(p => p.active);
if (state.cat)    filtered = filtered.filter(p => p.category === state.cat);
if (state.q)      filtered = filtered.filter(p => p.title.toLowerCase().includes(state.q.toLowerCase()));
if (state.conds.length < 4) filtered = filtered.filter(p => state.conds.includes(p.condition));
if (state.maxPrice) filtered = filtered.filter(p => p.price <= state.maxPrice);
if (state.sort === 'price-asc')  filtered.sort((a,b) => a.price - b.price);
if (state.sort === 'price-desc') filtered.sort((a,b) => b.price - a.price);
if (state.sort === 'recent')     filtered.sort((a,b) => b.id - a.id);
```

---

## Google Fonts — URL exacta usada en todas las páginas

```html
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

---

## Repositorio

- **GitHub**: `https://github.com/jorgetorrasvall-max/restock.git`
- **Branch principal**: `main`
- **Último commit del rediseño**: `cd25803` — "Redesign v3: Editorial system — Newsreader + Inter, paper background, Navy + Gold"
