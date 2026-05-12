# Resumen de sesiones — ReStock

## Estado actual del proyecto

ReStock es un marketplace B2B estático (HTML + Tailwind CDN, sin build step). Desplegado en Netlify desde GitHub `main`.

**URL:** `https://earnest-crisp-aa4ab3.netlify.app`

---

## Historial de trabajo

### 1. Rediseño completo (v3 — "Editorial")
8 páginas reescritas con design system: Newsreader + Inter, paleta paper/navy/gold. Commits `489bd46`→`cd25803`.

### 2. Marketplace editorial
`marketplace.html` rediseñado: feed asimétrico con "Destacados", "Recién publicado", "Vendedores". Sin sidebar de filtros. Búsqueda en tiempo real. Commit `cd25803`.

### 3. Supabase Auth (sesión actual — completo)
Se sustituyó el mock localStorage por autenticación real con Supabase.

**Lo implementado (8 commits, en `main`):**
- `supabase-init.js` — cliente Supabase (proyecto `qztkvrbctzwhxqpqccst`)
- `shared.js` — `getUser/requireAuth/logout` reescritas como async con Supabase
- 6 páginas de plataforma — CDN Supabase añadido, scripts wrapeados en `async IIFE`
- `login.html` — registro + login con email/password + Google OAuth (UI lista)
- `perfil.html` — modal "Completa tu perfil" si falta `company`; fix `is_admin`/`is_founder`
- SQL en `docs/superpowers/sql/001-profiles.sql` — tabla `profiles` + RLS + trigger

**Setup Supabase dashboard pendiente del usuario:**
- [ ] "Confirm email" → OFF (Authentication → Sign In / Providers)
- [ ] Tras primer login con `jorgetorrasvall@gmail.com`: poner `is_admin = true` en Table Editor
- [ ] Google OAuth (opcional, requiere Google Cloud Console)

---

## Próximos pasos

- Testear registro/login en producción
- Conectar `publicar.html` a Supabase Storage (imágenes) + tabla `products`
- Tab "Guardados" en perfil — implementar favoritos reales
