# Stripe + Supabase Full Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar los datos mock de `data.js` a Supabase, añadir pagos reales via Stripe Hosted Checkout, y notificaciones por email via Resend.

**Architecture:** Stripe Hosted Checkout + dos Supabase Edge Functions (`create-checkout-session` y `stripe-webhook`). El frontend HTML/JS vanilla llama a la Edge Function, que crea la sesión de Stripe. El webhook de Stripe dispara la segunda función para marcar el lote como vendido y enviar emails via Resend.

**Tech Stack:** HTML/CSS/JS vanilla, Supabase (JS client v2 ya cargado), Supabase Edge Functions (Deno + TypeScript), Stripe API v14, Resend API.

---

## Mapa de archivos

| Archivo | Acción | Qué hace |
|---|---|---|
| `supabase/functions/create-checkout-session/index.ts` | Crear | Edge Function: valida producto, crea orden y sesión Stripe |
| `supabase/functions/stripe-webhook/index.ts` | Crear | Edge Function: procesa pago exitoso, actualiza BD, envía emails |
| `ReStock-Producto/checkout-success.html` | Crear | Página de confirmación post-pago |
| `ReStock-Producto/data.js` | Modificar | Eliminar mocks; conservar helpers y constantes |
| `ReStock-Producto/shared.js` | Modificar | Eliminar referencia a `MOCK_CONVERSATIONS` |
| `ReStock-Producto/marketplace.html` | Modificar | Leer productos desde Supabase |
| `ReStock-Producto/producto.html` | Modificar | Leer producto desde Supabase + botón de compra |
| `ReStock-Producto/publicar.html` | Modificar | INSERT en Supabase al publicar |
| `ReStock-Producto/admin.html` | Modificar | Leer profiles, products, orders desde Supabase |
| `ReStock-Producto/perfil.html` | Modificar | Leer lotes propios y compras desde Supabase |

---

## Task 1: Schema Supabase — tablas + RLS + RPC

**Archivos:** Supabase SQL Editor (o MCP `apply_migration`)

- [ ] **Step 1: Aplicar migración de schema**

Ejecutar este SQL completo en el Supabase SQL Editor (dashboard → SQL Editor → New query):

```sql
-- ──────────────────────────────────────────────
-- 1. PROFILES (puede que ya exista; añadimos columnas faltantes)
-- ──────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text not null default '',
  city        text,
  type        text default 'comprador',
  is_admin    boolean default false,
  is_founder  boolean default false,
  rating      numeric(3,1) default 0,
  reviews     int default 0,
  created_at  timestamptz default now()
);

-- Añadir columnas si la tabla ya existía sin ellas
alter table profiles add column if not exists city text;
alter table profiles add column if not exists type text default 'comprador';
alter table profiles add column if not exists is_admin boolean default false;
alter table profiles add column if not exists is_founder boolean default false;
alter table profiles add column if not exists rating numeric(3,1) default 0;
alter table profiles add column if not exists reviews int default 0;

alter table profiles enable row level security;

drop policy if exists "Lectura pública" on profiles;
drop policy if exists "Edición propia" on profiles;
create policy "Lectura pública" on profiles for select using (true);
create policy "Edición propia" on profiles for update using (auth.uid() = id);

-- ──────────────────────────────────────────────
-- 2. PRODUCTS
-- ──────────────────────────────────────────────
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text not null,
  condition   text not null check (condition in ('A','B','C','D')),
  price       int not null,
  quantity    int not null,
  unit        text default 'unidades',
  description text,
  images      text[] default '{}',
  seller_id   uuid references profiles not null,
  active      boolean default true,
  sold        boolean default false,
  views       int default 0,
  created_at  timestamptz default now()
);

alter table products enable row level security;

drop policy if exists "Lectura pública" on products;
drop policy if exists "Inserción propia" on products;
drop policy if exists "Edición propia" on products;
create policy "Lectura pública"   on products for select using (true);
create policy "Inserción propia"  on products for insert with check (auth.uid() = seller_id);
create policy "Edición propia"    on products for update using (auth.uid() = seller_id);

-- ──────────────────────────────────────────────
-- 3. ORDERS
-- ──────────────────────────────────────────────
create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid references products not null,
  buyer_id          uuid references profiles not null,
  buyer_email       text not null,
  amount            int not null,
  stripe_session_id text unique,
  status            text default 'pending' check (status in ('pending','paid','failed')),
  created_at        timestamptz default now()
);

alter table orders enable row level security;

drop policy if exists "Lectura propia (comprador)" on orders;
drop policy if exists "Lectura propia (vendedor)" on orders;
create policy "Lectura propia (comprador)" on orders
  for select using (auth.uid() = buyer_id);
create policy "Lectura propia (vendedor)" on orders
  for select using (
    auth.uid() = (select seller_id from products where id = product_id)
  );

-- ──────────────────────────────────────────────
-- 4. RPC increment_views
-- ──────────────────────────────────────────────
create or replace function increment_views(product_id uuid)
returns void language sql security definer as $$
  update products set views = views + 1 where id = product_id;
$$;
```

- [ ] **Step 2: Verificar**

En Supabase dashboard → Table Editor, confirmar que existen las tablas `profiles`, `products`, `orders`. En SQL Editor ejecutar:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Resultado esperado: `orders`, `products`, `profiles` en la lista.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Supabase schema — products, orders, RLS, increment_views RPC"
```

---

## Task 2: Seed — datos iniciales

**Archivos:** Supabase SQL Editor

- [ ] **Step 1: Insertar sellers como auth.users y profiles**

Ejecutar en SQL Editor (usa service_role, bypasa RLS):

```sql
-- Insertar usuarios vendedores en auth.users
insert into auth.users (
  id, email, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role
) values
  ('a0000001-0000-0000-0000-000000000001', 'info@tiendamodabcn.com',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('a0000001-0000-0000-0000-000000000002', 'ventas@electropro.es',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('a0000001-0000-0000-0000-000000000003', 'stock@beauty.es',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('a0000001-0000-0000-0000-000000000004', 'info@toylot.es',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('a0000001-0000-0000-0000-000000000005', 'stock@sportstockbilbao.es',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('a0000001-0000-0000-0000-000000000006', 'info@homedecobilbao.es',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('a0000001-0000-0000-0000-000000000007', 'info@alimentosgranel.es',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('a0000001-0000-0000-0000-000000000008', 'info@packstocksevilla.es',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated')
on conflict (id) do nothing;

-- Insertar profiles correspondientes
insert into profiles (id, name, city, type, rating, reviews, created_at)
values
  ('a0000001-0000-0000-0000-000000000001', 'TiendaModa BCN',     'Barcelona', 'vendedor', 4.8, 12, '2025-11-01'),
  ('a0000001-0000-0000-0000-000000000002', 'ElectroPro Madrid',  'Madrid',    'vendedor', 4.9, 28, '2025-09-01'),
  ('a0000001-0000-0000-0000-000000000003', 'BeautyStock Valencia','Valencia', 'vendedor', 4.7,  9, '2026-01-01'),
  ('a0000001-0000-0000-0000-000000000004', 'ToyLot SL',          'Zaragoza',  'vendedor', 4.5,  6, '2026-02-01'),
  ('a0000001-0000-0000-0000-000000000005', 'SportStock Bilbao',  'Bilbao',    'vendedor', 4.6, 15, '2025-10-01'),
  ('a0000001-0000-0000-0000-000000000006', 'HomeDeco Bilbao',    'Bilbao',    'vendedor', 4.8, 11, '2025-12-01'),
  ('a0000001-0000-0000-0000-000000000007', 'AlimentosGranel SL', 'Murcia',   'vendedor', 4.4,  4, '2026-03-01'),
  ('a0000001-0000-0000-0000-000000000008', 'PackStock Sevilla',  'Sevilla',   'vendedor', 4.7,  8, '2025-12-01')
on conflict (id) do nothing;
```

- [ ] **Step 2: Insertar productos**

```sql
insert into products (title, category, condition, price, quantity, unit, description, images, seller_id, views, created_at)
values
  ('Lote 250 camisetas polo hombre', 'moda', 'B', 850, 250, 'unidades',
   'Lote de 250 camisetas polo para hombre, tallas M, L y XL (mix). Producto de temporada anterior sin etiqueta. Todo el género en perfecto estado de almacenaje. Ideal para reventa en tiendas físicas o eCommerce de moda.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Polo+Hombre+x250'],
   'a0000001-0000-0000-0000-000000000001', 143, '2026-04-10'),

  ('Lote 50 auriculares Bluetooth TWS', 'electronica', 'A', 1200, 50, 'unidades',
   'Auriculares TWS nuevos con etiqueta y caja original. Compatibles iOS/Android. Autonomía 6h + 18h con estuche de carga. Stock de liquidación por cambio de línea. CE certificado.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Auriculares+TWS+x50'],
   'a0000001-0000-0000-0000-000000000002', 287, '2026-04-12'),

  ('Lote 100 cremas hidratantes faciales', 'cosmetica', 'A', 320, 100, 'unidades',
   'Cremas hidratantes faciales 50ml, marca blanca de calidad. Nuevas con etiqueta. Lote de liquidación de almacén. Fecha de caducidad 2028. Apto piel sensible.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Cremas+x100'],
   'a0000001-0000-0000-0000-000000000003', 92, '2026-04-08'),

  ('Lote 200 juguetes infantiles surtidos', 'juguetes', 'B', 680, 200, 'unidades',
   'Stock sobrante campaña Navidad. Juguetes variados para 3-8 años. Sin caja original, producto en perfecto estado. Ideal para tiendas de barrio, mercadillos o eCommerce.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Juguetes+x200'],
   'a0000001-0000-0000-0000-000000000004', 175, '2026-04-05'),

  ('Lote 80 pares zapatillas deportivas', 'deportes', 'B', 1500, 80, 'pares',
   'Zapatillas deportivas running, tallas 38-46 (mix). Marca nacional sin caja. PVP original 55€/par, se vende a 18,75€/par. Rotación garantizada en cualquier canal.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Zapatillas+x80'],
   'a0000001-0000-0000-0000-000000000005', 312, '2026-04-14'),

  ('Lote 150 lámparas LED regulables', 'hogar', 'A', 420, 150, 'unidades',
   'Lámparas LED de escritorio con 3 modos de luz y regulación táctil. Nuevas con caja original. Stock por cambio de catálogo. Certificado CE.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Lamparas+LED+x150'],
   'a0000001-0000-0000-0000-000000000006', 88, '2026-04-11'),

  ('Lote 300 camisetas básicas mujer', 'moda', 'C', 480, 300, 'unidades',
   'Camisetas básicas mujer algodón 100%, tallas S/M/L. Pequeñas arrugas por almacenaje, sin defectos de calidad. Ideales para serigrafía, sublimación o reventa directa.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Camisetas+Mujer+x300'],
   'a0000001-0000-0000-0000-000000000001', 201, '2026-04-09'),

  ('Lote 60 tablets 10" Android', 'electronica', 'B', 2400, 60, 'unidades',
   'Tablets Android 10 pulgadas, 3GB RAM / 32GB. Sin caja original. Modelo descatalogado con 6 meses de garantía del vendedor. Perfectas para colegios y empresas.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Tablets+Android+x60'],
   'a0000001-0000-0000-0000-000000000002', 445, '2026-04-13'),

  ('Lote 500 botellas vidrio 750ml', 'alimentacion', 'A', 290, 500, 'unidades',
   'Botellas de vidrio reutilizables 750ml, tapón swing-top incluido. Nuevas sin contenido. Perfectas para hostelería, eventos o tiendas eco.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Botellas+Vidrio+x500'],
   'a0000001-0000-0000-0000-000000000007', 67, '2026-04-07'),

  ('Lote 120 mochilas escolares 20L', 'otros', 'A', 960, 120, 'unidades',
   'Mochilas escolares 20L, diseño neutro apto niño y niña. Nuevas con etiqueta. Campaña vuelta al cole cancelada. PVP 25€/ud, se vende a 8€/ud.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Mochilas+x120'],
   'a0000001-0000-0000-0000-000000000008', 134, '2026-04-15'),

  ('Lote 40 relojes smartwatch', 'electronica', 'A', 1800, 40, 'unidades',
   'Smartwatches con monitor cardíaco, GPS y notificaciones. Nuevos con caja. Compatible iOS y Android. Stock de modelo anterior por actualización de gama.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Smartwatch+x40'],
   'a0000001-0000-0000-0000-000000000002', 203, '2026-04-16'),

  ('Lote 180 pares calcetines deportivos', 'deportes', 'A', 180, 180, 'pares',
   'Calcetines deportivos algodón reforzado, talla única 36-46. Nuevos con etiqueta. Liquidación de temporada.',
   ARRAY['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Calcetines+x180'],
   'a0000001-0000-0000-0000-000000000005', 56, '2026-04-16');
```

- [ ] **Step 3: Verificar seed**

```sql
select count(*) from products;
-- Resultado esperado: 12

select p.title, pr.name as seller
from products p join profiles pr on p.seller_id = pr.id
order by p.created_at;
-- Resultado esperado: 12 filas con título y nombre de vendedor
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: seed inicial — 12 productos + 8 sellers en Supabase"
```

---

## Task 3: Configurar secrets en Supabase

**Archivos:** Supabase Dashboard → Settings → Edge Functions → Secrets

- [ ] **Step 1: Añadir secrets**

En Supabase Dashboard → Project Settings → Edge Functions → Secrets, añadir:

```
STRIPE_SECRET_KEY         → sk_test_...   (usar test key ahora, live key en producción)
STRIPE_WEBHOOK_SECRET     → whsec_...     (se obtiene en Task 5 step 1)
RESEND_API_KEY            → re_...
SITE_URL                  → http://127.0.0.1:5500  (para desarrollo local; cambiar a dominio real en prod)
```

> **Nota:** `STRIPE_WEBHOOK_SECRET` se configura después de crear el webhook endpoint en el dashboard de Stripe (Task 5). Puedes añadirlo en ese momento.

- [ ] **Step 2: Verificar**

Los secrets no son visibles tras guardarlos — verificar que aparecen en la lista de nombre de secrets.

---

## Task 4: Edge Function — `create-checkout-session`

**Archivos:** `supabase/functions/create-checkout-session/index.ts`

- [ ] **Step 1: Inicializar directorio de funciones**

```bash
# En la raíz del repo (C:\Users\jorge\OneDrive\Escritorio\ReStock)
mkdir -p supabase/functions/create-checkout-session
```

- [ ] **Step 2: Crear la función**

Crear `supabase/functions/create-checkout-session/index.ts`:

```typescript
import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { product_id } = await req.json()
  if (!product_id) {
    return new Response(JSON.stringify({ error: 'product_id requerido' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, price, active, sold, seller_id')
    .eq('id', product_id)
    .single()

  if (productError || !product) {
    return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (!product.active || product.sold) {
    return new Response(JSON.stringify({ error: 'Lote no disponible' }), {
      status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Verificar que el comprador no sea el vendedor
  if (product.seller_id === user.id) {
    return new Response(JSON.stringify({ error: 'No puedes comprar tu propio lote' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      product_id,
      buyer_id: user.id,
      buyer_email: user.email,
      amount: product.price * 100,
      status: 'pending'
    })
    .select('id')
    .single()

  if (orderError || !order) {
    return new Response(JSON.stringify({ error: 'Error creando orden' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
  const siteUrl = Deno.env.get('SITE_URL')!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        unit_amount: product.price * 100,
        product_data: { name: product.title }
      },
      quantity: 1
    }],
    success_url: `${siteUrl}/ReStock-Producto/checkout-success.html?order=${order.id}`,
    cancel_url: `${siteUrl}/ReStock-Producto/producto.html?id=${product_id}`,
    metadata: { order_id: order.id, product_id }
  })

  await supabase
    .from('orders')
    .update({ stripe_session_id: session.id })
    .eq('id', order.id)

  return new Response(
    JSON.stringify({ url: session.url }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
```

- [ ] **Step 3: Deploy**

Via Supabase Dashboard → Edge Functions → Deploy new function → subir el archivo, o via MCP tool `deploy_edge_function` con el contenido del archivo.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/create-checkout-session/index.ts
git commit -m "feat: Edge Function create-checkout-session"
```

---

## Task 5: Edge Function — `stripe-webhook`

**Archivos:** `supabase/functions/stripe-webhook/index.ts`

- [ ] **Step 1: Configurar webhook en Stripe Dashboard**

En [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks → Add endpoint:
- Endpoint URL: `https://<tu-proyecto>.supabase.co/functions/v1/stripe-webhook`
- Events: seleccionar `checkout.session.completed`
- Copiar el `Signing secret` (whsec_...) → añadirlo como secret `STRIPE_WEBHOOK_SECRET` en Supabase (Task 3)

Para desarrollo local con Stripe CLI:
```bash
stripe listen --forward-to https://<tu-proyecto>.supabase.co/functions/v1/stripe-webhook
```

- [ ] **Step 2: Crear directorio**

```bash
mkdir -p supabase/functions/stripe-webhook
```

- [ ] **Step 3: Crear la función**

Crear `supabase/functions/stripe-webhook/index.ts`:

```typescript
import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'ReStock <noreply@restock.com>',
      to,
      subject,
      html
    })
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
  }
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('OK', { status: 200 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const { order_id, product_id } = session.metadata ?? {}

  if (!order_id || !product_id) {
    console.error('Missing metadata in session:', session.id)
    return new Response('Missing metadata', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Marcar orden como pagada
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', order_id)
    .select('buyer_email')
    .single()

  if (orderError) {
    console.error('Error updating order:', orderError)
    return new Response('DB error', { status: 500 })
  }

  // Marcar producto como vendido
  const { data: product, error: productError } = await supabase
    .from('products')
    .update({ sold: true, active: false })
    .eq('id', product_id)
    .select('title, price, seller_id')
    .single()

  if (productError) {
    console.error('Error updating product:', productError)
    return new Response('DB error', { status: 500 })
  }

  // Obtener email del vendedor
  const { data: sellerAuth } = await supabase.auth.admin.getUserById(product.seller_id)
  const sellerEmail = sellerAuth?.user?.email

  // Calcular comisión
  const commissionRate = product.price >= 1000 ? 3 : product.price >= 500 ? 4 : 5
  const sellerReceives = product.price - Math.round(product.price * commissionRate / 100)

  const resendKey = Deno.env.get('RESEND_API_KEY')!

  // Email al comprador
  await sendEmail(
    resendKey,
    order.buyer_email,
    'Tu compra en ReStock está confirmada',
    `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1A1A1A">
      <h2 style="font-size:20px;margin-bottom:8px">Compra confirmada</h2>
      <p style="color:#5C5C5C;margin-bottom:24px">Tu pago ha sido procesado correctamente.</p>
      <div style="background:#FDFBF7;border:1px solid #E8E4DC;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Lote comprado</p>
        <p style="font-size:16px;font-weight:600;margin:0 0 12px">${product.title}</p>
        <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Importe pagado</p>
        <p style="font-size:20px;font-weight:700;color:#1A3C6E;margin:0">${product.price.toLocaleString('es-ES')}€</p>
      </div>
      <p style="font-size:14px;color:#5C5C5C">El vendedor se pondrá en contacto contigo en breve para coordinar la entrega.</p>
      <p style="font-size:14px;color:#5C5C5C;margin-top:24px">Gracias por usar ReStock.</p>
    </div>
    `
  )

  // Email al vendedor
  if (sellerEmail) {
    await sendEmail(
      resendKey,
      sellerEmail,
      'Has vendido un lote en ReStock',
      `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1A1A1A">
        <h2 style="font-size:20px;margin-bottom:8px">¡Tienes una venta!</h2>
        <p style="color:#5C5C5C;margin-bottom:24px">Tu lote ha sido comprado en ReStock.</p>
        <div style="background:#FDFBF7;border:1px solid #E8E4DC;border-radius:8px;padding:20px;margin-bottom:24px">
          <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Lote vendido</p>
          <p style="font-size:16px;font-weight:600;margin:0 0 12px">${product.title}</p>
          <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Precio de venta</p>
          <p style="font-size:16px;margin:0 0 8px">${product.price.toLocaleString('es-ES')}€</p>
          <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Comisión ReStock (${commissionRate}%)</p>
          <p style="font-size:14px;margin:0 0 8px">-${(product.price - sellerReceives).toLocaleString('es-ES')}€</p>
          <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Recibirás</p>
          <p style="font-size:20px;font-weight:700;color:#1A3C6E;margin:0">${sellerReceives.toLocaleString('es-ES')}€</p>
        </div>
        <p style="font-size:14px;color:#5C5C5C">Comprador: <strong>${order.buyer_email}</strong></p>
        <p style="font-size:14px;color:#5C5C5C">Contacta con él para coordinar la entrega y recibir el pago en los próximos días hábiles.</p>
      </div>
      `
    )
  }

  return new Response('OK', { status: 200 })
})
```

- [ ] **Step 4: Deploy**

Via Supabase Dashboard → Edge Functions → Deploy, o MCP `deploy_edge_function`.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "feat: Edge Function stripe-webhook — marca vendido + emails Resend"
```

---

## Task 6: Fix `shared.js` — eliminar referencia a MOCK_CONVERSATIONS

**Archivos:** `ReStock-Producto/shared.js`

- [ ] **Step 1: Eliminar el bloque msgBadge de initNav**

En `ReStock-Producto/shared.js`, eliminar estas líneas (dentro de `initNav`):

```js
  const msgBadge = document.getElementById('msgBadge');
  if (msgBadge) {
    const unread = MOCK_CONVERSATIONS.reduce((s, c) => s + c.unread, 0);
    if (unread > 0) { msgBadge.textContent = unread; msgBadge.style.display = 'flex'; }
  }
```

- [ ] **Step 2: Verificar**

Abrir cualquier página de la plataforma en el navegador. No debe aparecer ningún error en consola relacionado con `MOCK_CONVERSATIONS`.

- [ ] **Step 3: Commit**

```bash
git add ReStock-Producto/shared.js
git commit -m "fix: eliminar referencia MOCK_CONVERSATIONS de shared.js"
```

---

## Task 7: Migrar `marketplace.html` a Supabase

**Archivos:** `ReStock-Producto/marketplace.html`

- [ ] **Step 1: Localizar el bloque de carga de productos**

Buscar en `marketplace.html` el bloque donde se llama a `PRODUCTS` (probablemente una función `render()` o similar que filtra y renderiza productos).

- [ ] **Step 2: Reemplazar la lógica de carga**

Sustituir la función que lee `PRODUCTS` con esta versión async que lee de Supabase. Añadir al final del `<script>` de la página, antes de la lógica de render:

```js
async function loadProducts() {
  let query = _supabase
    .from('products')
    .select('*, profiles(name, city, rating, reviews)')
    .eq('active', true)
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) { console.error('Error cargando productos:', error); return []; }
  return data;
}
```

- [ ] **Step 3: Reemplazar la función de render y filtros**

La función que actualmente filtra `PRODUCTS` en memoria debe cambiarse para filtrar el array ya cargado de Supabase. El patrón es: cargar todos al inicio, luego filtrar en cliente (igual que ahora pero con el array de Supabase). Reemplazar el bloque de inicialización principal del script:

```js
// Al inicio del script de la página, reemplazar la llamada a PRODUCTS con:
let ALL_PRODUCTS = [];

async function init() {
  ALL_PRODUCTS = await loadProducts();
  renderProducts();
  renderStats();
}

function renderProducts() {
  const state = getFilterState(); // función existente que lee los filtros del DOM
  let filtered = ALL_PRODUCTS;

  if (state.cat)    filtered = filtered.filter(p => p.category === state.cat);
  if (state.q)      filtered = filtered.filter(p => p.title.toLowerCase().includes(state.q.toLowerCase()));
  if (state.conds && state.conds.length < 4)
                    filtered = filtered.filter(p => state.conds.includes(p.condition));
  if (state.maxPrice) filtered = filtered.filter(p => p.price <= state.maxPrice);
  if (state.sort === 'price-asc')  filtered.sort((a,b) => a.price - b.price);
  if (state.sort === 'price-desc') filtered.sort((a,b) => b.price - a.price);

  const grid = document.getElementById('productsGrid');
  if (!filtered.length) {
    grid.innerHTML = '<p class="text-muted text-sm col-span-full text-center py-12">No hay lotes con esos filtros.</p>';
    return;
  }
  grid.innerHTML = filtered.map(p => productCard(p)).join('');
}

// Llamar al iniciar
document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 4: Actualizar la función `productCard` para usar seller embebido y badge SOLD**

La tarjeta de producto ahora recibe un objeto con `profiles` embebido (`p.profiles.name`, `p.profiles.city`). Actualizar los campos del seller y añadir el overlay SOLD:

```js
function productCard(p) {
  const cond = CONDITIONS[p.condition];
  const catObj = CATEGORIES.find(c => c.id === p.category);
  const soldOverlay = p.sold
    ? `<div class="absolute inset-0 bg-ink/60 flex items-center justify-center rounded-t-xl">
         <span class="text-white font-serif text-2xl font-semibold tracking-widest">SOLD</span>
       </div>`
    : '';
  return `
    <div class="group flex flex-col bg-white border border-warm rounded-xl overflow-hidden hover:border-navy/30 hover:shadow-sm transition-all duration-200">
      <a href="producto.html?id=${p.id}" class="relative aspect-[4/3] bg-warm overflow-hidden block">
        <img src="${p.images[0]}" alt="${p.title}"
             class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
        ${soldOverlay}
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
          <span class="text-xs text-muted">${p.profiles?.city || ''}</span>
        </div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 5: Verificar**

Abrir `marketplace.html` en el navegador. Deben aparecer los 12 productos del seed. Los filtros de categoría, condición y precio deben funcionar. No debe haber errores en consola.

- [ ] **Step 6: Commit**

```bash
git add ReStock-Producto/marketplace.html
git commit -m "feat: marketplace.html — carga productos desde Supabase + badge SOLD"
```

---

## Task 8: Migrar `producto.html` a Supabase + botón de compra

**Archivos:** `ReStock-Producto/producto.html`

- [ ] **Step 1: Reemplazar la carga del producto**

En el script de `producto.html`, reemplazar:

```js
const id = parseInt(getParam('id'));
const product = PRODUCTS.find(p => p.id === id);
```

Con:

```js
const productId = getParam('id');

async function loadProduct() {
  if (!productId) return null;
  const { data, error } = await _supabase
    .from('products')
    .select('*, profiles(id, name, city, rating, reviews, created_at)')
    .eq('id', productId)
    .single();
  if (error) { console.error(error); return null; }
  return data;
}
```

- [ ] **Step 2: Convertir el bloque principal a async y añadir estado SOLD**

Envolver la inicialización en una función async y añadir el manejo del estado SOLD. Reemplazar `(async () => { if (!product) { ... } else { ... } })()` con:

```js
(async () => {
  const product = await loadProduct();

  if (!product) {
    document.getElementById('notFound').classList.remove('hidden');
    return;
  }

  document.getElementById('productDetail').classList.remove('hidden');
  document.getElementById('breadcrumbTitle').textContent = product.title;
  document.title = product.title + ' — ReStock';

  const img = document.getElementById('productImg');
  img.src = product.images[0];
  img.alt = product.title;

  const cond = CONDITIONS[product.condition];
  const catObj = CATEGORIES.find(c => c.id === product.category);
  const condBadge = `<span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background:${cond.bg};color:${cond.color}">${cond.label}</span>`;
  const metaHtml = `
    ${condBadge}
    <span class="text-xs text-muted">${product.quantity} ${product.unit}</span>
    ${catObj ? `<span class="text-xs px-2 py-0.5 rounded-full bg-warm text-muted font-medium">${catObj.name}</span>` : ''}
  `;

  document.getElementById('productTitle').textContent = product.title;
  document.getElementById('productMeta').innerHTML = metaHtml;
  document.getElementById('productPrice').textContent = formatPrice(product.price);

  // Comisión
  const { rate, buyerTotal, sellerReceives } = getCommission(product.price);
  document.getElementById('commissionInfo').innerHTML = `
    <div class="flex justify-between text-sm">
      <span class="text-muted">Precio del lote</span>
      <span class="font-medium">${formatPrice(product.price)}</span>
    </div>
    <div class="flex justify-between text-sm">
      <span class="text-muted">Comisión ReStock (${rate}%)</span>
      <span class="font-medium text-gold">+${formatPrice(buyerTotal - product.price)}</span>
    </div>
    <div class="flex justify-between text-sm font-semibold border-t border-warm pt-2 mt-2">
      <span>Total a pagar</span>
      <span class="text-navy">${formatPrice(buyerTotal)}</span>
    </div>
  `;

  // CTA — estado SOLD o botón comprar
  const ctaHtml = product.sold
    ? `<div class="w-full py-3 px-4 rounded-md bg-warm text-center text-sm font-semibold text-muted">
         Este lote ya ha sido vendido
       </div>`
    : `<button id="btnComprar"
         class="w-full py-3 px-4 rounded-md bg-navy text-white text-sm font-semibold hover:bg-navy-dark transition-colors duration-150 cursor-pointer"
         onclick="handleComprar()">
         Comprar este lote
       </button>`;

  document.getElementById('desktopCTA').innerHTML = ctaHtml;
  if (document.getElementById('mobileCTA')) {
    document.getElementById('mobileCTA').innerHTML = ctaHtml;
  }

  // Seller card
  const seller = product.profiles;
  if (seller) {
    document.getElementById('sellerCard').innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-navy text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
          ${seller.name[0].toUpperCase()}
        </div>
        <div>
          <p class="text-sm font-semibold text-ink">${seller.name}</p>
          <p class="text-xs text-muted">${seller.city || ''} · ★ ${seller.rating} (${seller.reviews} reseñas)</p>
        </div>
      </div>
    `;
  }

  // Incrementar vistas
  await _supabase.rpc('increment_views', { product_id: productId });

  // Breadcrumb mobile
  if (document.getElementById('breadcrumbTitle')) {
    document.getElementById('breadcrumbTitle').textContent = product.title;
  }
})();

async function handleComprar() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  const btn = document.getElementById('btnComprar');
  if (btn) { btn.disabled = true; btn.textContent = 'Redirigiendo a pago…'; }

  const { data, error } = await _supabase.functions.invoke('create-checkout-session', {
    body: { product_id: productId }
  });

  if (error || !data?.url) {
    showToast('Error al iniciar el pago. Inténtalo de nuevo.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Comprar este lote'; }
    return;
  }

  window.location.href = data.url;
}
```

- [ ] **Step 3: Verificar**

Abrir `producto.html?id={uuid-de-un-producto}` (copiar un UUID de la tabla products en Supabase). El producto debe cargarse correctamente. El botón "Comprar este lote" debe aparecer. Si el usuario no está logueado y hace clic, debe redirigir a `login.html`.

- [ ] **Step 4: Commit**

```bash
git add ReStock-Producto/producto.html
git commit -m "feat: producto.html — carga desde Supabase + botón Stripe + badge SOLD"
```

---

## Task 9: Crear `checkout-success.html`

**Archivos:** `ReStock-Producto/checkout-success.html`

- [ ] **Step 1: Crear la página**

Crear `ReStock-Producto/checkout-success.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Compra confirmada — ReStock</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            serif: ['Newsreader', 'Georgia', 'serif'],
            sans: ['Inter', 'system-ui', 'sans-serif'],
          },
          colors: {
            paper: '#FDFBF7', navy: '#1A3C6E', 'navy-dark': '#142d54',
            gold: '#E8A020', 'gold-light': '#FEF3DC',
            ink: '#1A1A1A', muted: '#5C5C5C', warm: '#E8E4DC',
          }
        }
      }
    }
  </script>
  <style>
    * { font-family: 'Inter', system-ui, sans-serif; }
    .font-serif, h1, h2, h3 { font-family: 'Newsreader', Georgia, serif; }
  </style>
</head>
<body class="bg-paper text-ink antialiased min-h-screen flex flex-col">

  <header class="border-b border-warm bg-paper/95">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
      <a href="index.html" class="font-serif italic text-xl font-semibold text-navy hover:opacity-80 transition-opacity duration-150">ReStock</a>
    </div>
  </header>

  <main class="flex-1 flex items-center justify-center px-4 py-16">
    <div class="max-w-md w-full text-center">

      <div class="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6">
        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
      </div>

      <h1 class="font-serif text-3xl font-semibold text-ink mb-3">Compra confirmada</h1>
      <p class="text-muted text-sm mb-8">Tu pago ha sido procesado correctamente. Recibirás un email de confirmación en breve.</p>

      <div id="orderSummary" class="bg-white border border-warm rounded-xl p-6 text-left mb-8 hidden">
        <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Resumen de la compra</p>
        <p id="orderTitle" class="font-serif text-lg font-semibold text-ink mb-2"></p>
        <p id="orderAmount" class="font-serif text-2xl font-semibold text-navy"></p>
        <div class="border-t border-warm mt-4 pt-4">
          <p class="text-xs text-muted">El vendedor se pondrá en contacto contigo para coordinar la entrega.</p>
        </div>
      </div>

      <a href="marketplace.html"
         class="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-navy text-white text-sm font-medium hover:bg-navy-dark transition-colors duration-150">
        ← Explorar más lotes
      </a>
    </div>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script src="supabase-init.js"></script>
  <script src="data.js"></script>
  <script>
    (async () => {
      const orderId = new URLSearchParams(window.location.search).get('order');
      if (!orderId) return;

      const { data: order, error } = await _supabase
        .from('orders')
        .select('amount, products(title)')
        .eq('id', orderId)
        .single();

      if (!error && order) {
        document.getElementById('orderTitle').textContent = order.products?.title || '';
        document.getElementById('orderAmount').textContent =
          (order.amount / 100).toLocaleString('es-ES') + '€';
        document.getElementById('orderSummary').classList.remove('hidden');
      }
    })();
  </script>
</body>
</html>
```

- [ ] **Step 2: Verificar**

Abrir `checkout-success.html?order={uuid-de-una-orden-paid}` en el navegador. Debe mostrar el resumen de la orden.

- [ ] **Step 3: Commit**

```bash
git add ReStock-Producto/checkout-success.html
git commit -m "feat: checkout-success.html — página de confirmación post-pago"
```

---

## Task 10: Migrar `publicar.html` a Supabase

**Archivos:** `ReStock-Producto/publicar.html`

- [ ] **Step 1: Localizar el handler del formulario**

Buscar en `publicar.html` el `addEventListener('submit', ...)` o equivalente que maneja el envío.

- [ ] **Step 2: Reemplazar con INSERT a Supabase**

Reemplazar el handler existente con:

```js
document.getElementById('formPublicar').addEventListener('submit', async (e) => {
  e.preventDefault();

  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  const btn = document.getElementById('btnPublicar');
  btn.disabled = true;
  btn.textContent = 'Publicando…';

  const imageUrl = document.getElementById('imageUrl')?.value?.trim() ||
    `https://placehold.co/640x420/1A3C6E/FFFFFF?text=${encodeURIComponent(document.getElementById('title').value.trim().slice(0, 20))}`;

  const payload = {
    title:       document.getElementById('title').value.trim(),
    category:    document.getElementById('category').value,
    condition:   document.querySelector('input[name="condition"]:checked')?.value || 'A',
    price:       parseInt(document.getElementById('price').value, 10),
    quantity:    parseInt(document.getElementById('quantity').value, 10),
    unit:        document.getElementById('unit').value || 'unidades',
    description: document.getElementById('description').value.trim(),
    images:      [imageUrl],
    seller_id:   session.user.id,
  };

  const { data: product, error } = await _supabase
    .from('products')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    showToast('Error al publicar el lote. Inténtalo de nuevo.', 'error');
    btn.disabled = false;
    btn.textContent = 'Publicar lote';
    return;
  }

  window.location.href = `producto.html?id=${product.id}`;
});
```

> **Nota:** Los IDs de los campos (`title`, `category`, `price`, etc.) deben coincidir con los que ya existen en el HTML del formulario. Verificar y ajustar si difieren.

- [ ] **Step 3: Verificar**

Iniciar sesión y publicar un lote de prueba. Debe redirigir a `producto.html?id={nuevo-uuid}` y mostrar el lote correctamente.

- [ ] **Step 4: Commit**

```bash
git add ReStock-Producto/publicar.html
git commit -m "feat: publicar.html — INSERT en Supabase al publicar lote"
```

---

## Task 11: Migrar `admin.html` a Supabase

**Archivos:** `ReStock-Producto/admin.html`

- [ ] **Step 1: Reemplazar carga de usuarios**

Localizar donde `admin.html` lee `MOCK_USERS` y reemplazar con:

```js
async function loadAdminData() {
  const [usersRes, productsRes, ordersRes] = await Promise.all([
    _supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    _supabase.from('products').select('*, profiles(name)').order('created_at', { ascending: false }),
    _supabase.from('orders').select('*, products(title), profiles!orders_buyer_id_fkey(name)').order('created_at', { ascending: false })
  ]);

  return {
    users:    usersRes.data    || [],
    products: productsRes.data || [],
    orders:   ordersRes.data   || []
  };
}
```

- [ ] **Step 2: Actualizar las tablas del dashboard**

Donde se renderiza la tabla de usuarios, cambiar los campos `user.avatar` → `user.name[0].toUpperCase()`, `user.type` → `user.type`, `user.isAdmin` → `user.is_admin`, `user.isFounder` → `user.is_founder`.

Donde se renderiza la tabla de productos, cambiar `product.seller.name` → `product.profiles?.name`.

Añadir una nueva sección/tab de "Órdenes" que liste `orders` con columnas: lote comprado, comprador, importe, estado, fecha.

- [ ] **Step 3: Verificar**

Entrar como Jorge (admin) a `admin.html`. Las tablas de usuarios, productos y órdenes deben cargarse sin errores de consola.

- [ ] **Step 4: Commit**

```bash
git add ReStock-Producto/admin.html
git commit -m "feat: admin.html — carga usuarios, productos y órdenes desde Supabase"
```

---

## Task 12: Migrar `perfil.html` a Supabase

**Archivos:** `ReStock-Producto/perfil.html`

- [ ] **Step 1: Reemplazar carga de datos del perfil**

Localizar donde se carga la información del usuario actual y reemplazar datos mock con:

```js
async function loadProfileData() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  const [profileRes, myProductsRes, myOrdersRes] = await Promise.all([
    _supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    _supabase.from('products').select('*').eq('seller_id', session.user.id).order('created_at', { ascending: false }),
    _supabase.from('orders').select('*, products(title, price)').eq('buyer_id', session.user.id).order('created_at', { ascending: false })
  ]);

  return {
    profile:    profileRes.data,
    myProducts: myProductsRes.data || [],
    myOrders:   myOrdersRes.data   || []
  };
}
```

- [ ] **Step 2: Renderizar lotes publicados y compras**

Donde antes se mostraban datos mock, renderizar `myProducts` (lotes que el usuario ha publicado) y `myOrders` (lotes que ha comprado). Cada orden muestra: título del producto, importe, estado (`pending`/`paid`), fecha.

- [ ] **Step 3: Verificar**

Iniciar sesión y abrir `perfil.html`. Debe mostrar el nombre del usuario, sus lotes publicados y sus compras.

- [ ] **Step 4: Commit**

```bash
git add ReStock-Producto/perfil.html
git commit -m "feat: perfil.html — lotes propios y compras desde Supabase"
```

---

## Task 13: Limpiar `data.js`

**Archivos:** `ReStock-Producto/data.js`

- [ ] **Step 1: Eliminar los arrays mock**

Borrar de `data.js` los siguientes bloques completos:
- `const PRODUCTS = [...]`
- `const MOCK_USERS = [...]`
- `const MOCK_CONVERSATIONS = [...]`
- `const ALPHA_CODES = [...] `

Conservar intactos:
- `const CATEGORIES = [...]`
- `const CONDITIONS = {...}`
- `function getCommission(price) {...}`
- `function daysAgo(dateStr) {...}`
- `function formatPrice(n) {...}`

- [ ] **Step 2: Verificar**

Recargar todas las páginas. No debe haber errores de consola relacionados con variables undefined. El marketplace y producto deben seguir cargando desde Supabase.

- [ ] **Step 3: Commit**

```bash
git add ReStock-Producto/data.js
git commit -m "chore: data.js — eliminar mocks PRODUCTS, MOCK_USERS, MOCK_CONVERSATIONS, ALPHA_CODES"
```

---

## Task 14: Test end-to-end en modo test de Stripe

- [ ] **Step 1: Verificar que Stripe está en modo test**

En el dashboard de Stripe, confirmar que la `STRIPE_SECRET_KEY` configurada en Supabase es `sk_test_...` (no live).

- [ ] **Step 2: Flujo completo de compra**

1. Abrir `marketplace.html` → hacer clic en un lote
2. En `producto.html` → hacer clic en "Comprar este lote" (sin estar logueado → debe redirigir a login)
3. Iniciar sesión → volver al producto → hacer clic en "Comprar este lote"
4. Debe redirigir a la página de Stripe Checkout (stripe.com)
5. Usar tarjeta de test: `4242 4242 4242 4242`, cualquier fecha futura, cualquier CVC
6. Tras el pago exitoso → debe redirigir a `checkout-success.html?order=...`
7. La página de confirmación debe mostrar el nombre del lote y el importe

- [ ] **Step 3: Verificar webhook**

En Supabase SQL Editor:

```sql
-- Verificar que la orden existe y está en status 'paid'
select id, status, buyer_email, amount, created_at
from orders
order by created_at desc
limit 5;

-- Verificar que el producto está marcado como vendido
select id, title, sold, active
from products
where sold = true;
```

Resultado esperado: la orden tiene `status = 'paid'` y el producto tiene `sold = true`, `active = false`.

- [ ] **Step 4: Verificar emails**

En el dashboard de Resend, confirmar que se enviaron dos emails (comprador y vendedor) tras el pago.

- [ ] **Step 5: Verificar badge SOLD en marketplace**

Recargar `marketplace.html`. El lote comprado debe mostrar el overlay "SOLD" sobre la imagen.

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "feat: Stripe + Supabase migration complete — pagos reales, emails, badge SOLD"
```

---

## Checklist de variables de entorno

Antes de ir a producción, asegurarse de:

- [ ] Cambiar `STRIPE_SECRET_KEY` de `sk_test_...` a `sk_live_...`
- [ ] Crear un nuevo webhook endpoint en Stripe para producción y actualizar `STRIPE_WEBHOOK_SECRET`
- [ ] Actualizar `SITE_URL` al dominio real (ej: `https://restock.netlify.app`)
- [ ] Verificar dominio de email en Resend (el `from:` debe ser un dominio verificado)
