# ReStock — Integración Stripe + Migración Supabase

**Fecha:** 2026-05-10
**Scope:** Pagos reales con Stripe Checkout + migración completa de productos a Supabase

---

## Contexto

ReStock es un marketplace B2B de liquidación de stock. El frontend es HTML/CSS/JS vanilla, sin framework ni build step. La autenticación ya usa Supabase. Los datos de productos están actualmente en `data.js` (mock).

**Modelo de negocio de pagos:** ReStock cobra el total al comprador via Stripe y paga al vendedor manualmente. No se usa Stripe Connect.

---

## Decisiones clave

- **Stripe Hosted Checkout** (no Payment Element embebido): más seguro, menos código, PCI compliance out-of-the-box.
- **Supabase Edge Functions** como backend: necesario para mantener `STRIPE_SECRET_KEY` fuera del cliente.
- **Migración completa** de `PRODUCTS` y `MOCK_USERS` a Supabase: necesaria para que la Edge Function tenga acceso autoritativo al precio.
- **Resend** para emails transaccionales.
- **Stripe webhooks** para garantizar que el lote se marca como vendido incluso si el navegador falla tras el pago.

---

## Flujo completo

```
[producto.html]
    │ click "Comprar este lote" (usuario autenticado)
    ▼
[Edge Function: create-checkout-session]
    │ verifica producto activo y no vendido
    │ crea orden en `orders` (status: pending)
    │ crea Stripe Checkout Session
    ▼
[Stripe Hosted Checkout]
    │ comprador introduce tarjeta
    ▼
[Stripe → POST webhook]
    ▼
[Edge Function: stripe-webhook]
    │ verifica firma del webhook
    │ orders → status: paid
    │ products → sold: true, active: false
    │ Resend → email confirmación al comprador
    │ Resend → email aviso al vendedor
    ▼
[checkout-success.html?order={order_id}]
    Confirmación con resumen de compra
```

---

## Schema Supabase

### `profiles`
Amplía `auth.users`. Se crea automáticamente al registrarse via trigger.

```sql
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text not null,
  city        text,
  type        text default 'comprador',   -- 'comprador' | 'vendedor'
  is_admin    boolean default false,
  is_founder  boolean default false,
  rating      numeric(3,1) default 0,
  reviews     int default 0,
  created_at  timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
create policy "Lectura pública" on profiles for select using (true);
create policy "Edición propia" on profiles for update using (auth.uid() = id);
```

### `products`
Migración completa desde `data.js`. Fuente de verdad del precio.

```sql
create table products (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text not null,
  condition   text not null check (condition in ('A','B','C','D')),
  price       int not null,            -- en €
  quantity    int not null,
  unit        text default 'unidades',
  description text,
  images      text[] default '{}',    -- array de URLs
  seller_id   uuid references profiles not null,
  active      boolean default true,
  sold        boolean default false,
  views       int default 0,
  created_at  timestamptz default now()
);

-- RLS
alter table products enable row level security;
create policy "Lectura pública" on products for select using (true);
create policy "Inserción propia" on products for insert with check (auth.uid() = seller_id);
create policy "Edición propia" on products for update using (auth.uid() = seller_id);
```

### `orders`

```sql
create table orders (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid references products not null,
  buyer_id          uuid references profiles not null,
  buyer_email       text not null,
  amount            int not null,      -- en céntimos (Stripe)
  stripe_session_id text unique,
  status            text default 'pending' check (status in ('pending','paid','failed')),
  created_at        timestamptz default now()
);

-- RLS
alter table orders enable row level security;
create policy "Lectura propia (comprador)" on orders for select using (auth.uid() = buyer_id);
create policy "Lectura propia (vendedor)" on orders for select using (
  auth.uid() = (select seller_id from products where id = product_id)
);
-- Las Edge Functions usan service_role key y bypasean RLS
```

---

## Edge Functions

### `create-checkout-session`

**Trigger:** llamada desde `producto.html` al hacer clic en "Comprar"
**Auth:** requiere usuario autenticado (JWT en header)

```
POST /functions/v1/create-checkout-session
Body: { product_id: string }
Header: Authorization: Bearer {jwt}   ← buyer_id y buyer_email se extraen del JWT

Lógica:
1. Extrae buyer_id y buyer_email del JWT (supabase.auth.getUser())
2. Lee producto de Supabase por product_id
3. Verifica: product.active === true AND product.sold === false
   → si no, devuelve 409 Conflict
4. Crea registro en `orders` con status: 'pending'
5. Crea Stripe Checkout Session:
   - mode: 'payment'
   - line_items: [{ price_data: { currency: 'eur', unit_amount: price * 100, product_data: { name: title } } }]
   - success_url: {SITE_URL}/checkout-success.html?order={CHECKOUT_SESSION_ID}
   - cancel_url: {SITE_URL}/producto.html?id={product_id}
   - metadata: { order_id, product_id }
6. Actualiza orders → stripe_session_id
7. Devuelve { url: session.url }
```

### `stripe-webhook`

**Trigger:** POST de Stripe tras pago exitoso
**Auth:** verificación de firma con `STRIPE_WEBHOOK_SECRET`

```
POST /functions/v1/stripe-webhook

Evento manejado: checkout.session.completed

Lógica:
1. Verifica firma del webhook con stripe.webhooks.constructEvent()
   → si falla, devuelve 400 (no procesar)
2. Extrae order_id y product_id de event.data.object.metadata
3. Actualiza orders SET status = 'paid' WHERE id = order_id
4. Actualiza products SET sold = true, active = false WHERE id = product_id
5. Obtiene buyer_email de la orden
6. Obtiene seller_email: JOIN products → profiles WHERE profiles.id = seller_id
7. Envía email al comprador via Resend:
   - Asunto: "Tu compra en ReStock está confirmada"
   - Contenido: nombre del lote, precio, instrucciones de contacto
8. Envía email al vendedor via Resend:
   - Asunto: "Has vendido un lote en ReStock"
   - Contenido: nombre del lote, precio recibido (menos comisión), datos del comprador
```

### Variables de entorno (Supabase secrets)

```
STRIPE_SECRET_KEY         → sk_live_...
STRIPE_WEBHOOK_SECRET     → whsec_...
RESEND_API_KEY            → re_...
SITE_URL                  → https://restock.com  (usado en success_url y cancel_url)
SUPABASE_URL              → https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY → eyJ...
```

---

## Cambios en el frontend

### `data.js`
Se eliminan: `PRODUCTS`, `MOCK_USERS`, `MOCK_CONVERSATIONS`, `ALPHA_CODES`
Se mantienen: `formatPrice()`, `daysAgo()`, `getCommission()`, `CATEGORIES`, `CONDITIONS`

### `marketplace.html`
- Carga productos con `supabase.from('products').select('*, profiles(name, city, rating, reviews)').eq('active', true)`
- Los filtros (categoría, condición, precio, búsqueda) se aplican con `.eq()`, `.ilike()`, `.lte()`
- Lotes con `sold: true` muestran overlay "SOLD" sobre la imagen

### `producto.html`
- Carga producto con `supabase.from('products').select('*, profiles(*)').eq('id', id).single()`
- Incrementa `views` con `.rpc('increment_views', { product_id: id })`
  ```sql
  -- Función RPC necesaria en Supabase
  create or replace function increment_views(product_id uuid)
  returns void language sql security definer as $$
    update products set views = views + 1 where id = product_id;
  $$;
  ```
- Si `sold: true`: muestra banner "SOLD", deshabilita botón de compra
- Botón "Comprar este lote":
  ```js
  async function handleComprar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }
    const btn = document.getElementById('btnComprar');
    btn.disabled = true;
    btn.textContent = 'Redirigiendo a pago…';
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { product_id: productId, buyer_email: user.email }
    });
    if (error) { showToast('Error al iniciar el pago', 'error'); btn.disabled = false; return; }
    window.location.href = data.url;
  }
  ```

### `checkout-success.html` (página nueva)
- Lee `?order=` de la URL
- Consulta `orders JOIN products` para mostrar: nombre del lote, precio pagado
- Mensaje: "Tu compra está confirmada. El vendedor se pondrá en contacto contigo en breve."
- Link de vuelta al marketplace

### `publicar.html`
- Al enviar el formulario: `supabase.from('products').insert({ ...formData, seller_id: user.id })`
- Redirige a `producto.html?id={newProduct.id}` tras publicar

### `admin.html`
- Usuarios: `supabase.from('profiles').select('*')`
- Productos: `supabase.from('products').select('*, profiles(name)')`
- Órdenes: `supabase.from('orders').select('*, products(title), profiles(name)')`

### `perfil.html`
- Mis lotes publicados: `supabase.from('products').select('*').eq('seller_id', user.id)`
- Mis compras: `supabase.from('orders').select('*, products(title)').eq('buyer_id', user.id)`

---

## Seeding inicial

Los datos de `PRODUCTS` y `MOCK_USERS` se migran a Supabase con un script de seed ejecutado una vez desde el dashboard de Supabase.

Los `ALPHA_CODES` **no se migran**: siguen en `data.js` ya que solo se usan en el registro y no intervienen en el flujo de pagos. Se migrarán en una fase posterior si se necesita gestión dinámica desde admin.

---

## Orden de implementación

1. Schema Supabase (migrations)
2. Seed de datos iniciales
3. Edge Function `create-checkout-session`
4. Edge Function `stripe-webhook`
5. Migrar `marketplace.html` a Supabase
6. Migrar `producto.html` a Supabase + botón de compra
7. Crear `checkout-success.html`
8. Migrar `publicar.html` a Supabase
9. Migrar `admin.html` a Supabase
10. Migrar `perfil.html` a Supabase
11. Limpiar `data.js`
12. Tests end-to-end en modo test de Stripe
