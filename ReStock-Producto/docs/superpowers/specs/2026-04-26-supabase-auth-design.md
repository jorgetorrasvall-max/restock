# Supabase Auth Integration — Design Spec
**Date:** 2026-04-26  
**Scope:** Auth + user profiles (Approach B)  
**Status:** Approved

---

## Objetivo

Reemplazar el sistema de auth mock (`localStorage rs_user` + `MOCK_USERS`) por Supabase Auth real. Los usuarios podrán registrarse con email/contraseña o Google OAuth. Sus perfiles quedan guardados en Supabase. Los productos siguen viniendo de `data.js` como fallback — la migración de productos es un paso posterior independiente.

---

## Arquitectura general

- **Sin build step.** Supabase-js se carga vía CDN (`esm.sh`) como módulo ES. El resto del proyecto (HTML puro + Tailwind CDN) no cambia.
- **Supabase:** Auth activado + tabla `profiles` + Google OAuth configurado en el dashboard.
- **Seguridad:** anon key expuesta en cliente (diseño correcto para Supabase). Row Level Security (RLS) protege los datos a nivel de base de datos.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `supabase.js` | **Nuevo** — inicializa el cliente Supabase con URL + anon key |
| `shared.js` | `getUser()`, `requireAuth()`, `logout()` reescritos para Supabase session |
| `login.html` | Formulario real con tabs login/registro + botón Google |
| `data.js` | Sin cambios — sigue siendo fallback de productos |

---

## Base de datos

### Tabla `profiles`

```sql
CREATE TABLE profiles (
  id           uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name         text NOT NULL,
  company      text NOT NULL,
  city         text NOT NULL,
  is_admin     boolean DEFAULT false,
  is_founder   boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);
```

### Trigger de auto-creación

Cuando `auth.users` recibe un nuevo registro, un trigger inserta automáticamente la fila en `profiles` usando los `user_metadata` del signup:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, company, city)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'city'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### RLS policies

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Leer solo tu propio perfil
CREATE POLICY "Own profile read" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Editar solo tu propio perfil
CREATE POLICY "Own profile update" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

`INSERT` bloqueado desde cliente — solo el trigger puede crear perfiles.

### Asignación de admin

`is_admin = true` se asigna manualmente en el panel de Supabase para `jorgetorrasvall@gmail.com` tras el primer login. No hay flujo de código para esto.

---

## Flujo de autenticación

### Login (email/contraseña)
```
Usuario → login.html → supabase.auth.signInWithPassword()
→ sesión guardada en localStorage por Supabase
→ redirect a marketplace.html
```

### Login (Google OAuth)
```
Usuario → botón Google → supabase.auth.signInWithOAuth({ provider: 'google' })
→ redirect a Google → callback a login.html
→ Supabase restaura sesión → redirect a marketplace.html
→ Si perfil incompleto → redirect a perfil.html
```

### Registro (email/contraseña)
```
Usuario → tab "Crear cuenta" → rellena: email, pass, nombre, empresa, ciudad
→ supabase.auth.signUp({ email, password, options: { data: { name, company, city } } })
→ trigger crea fila en profiles automáticamente
→ **sin email de confirmación** (desactivar en Supabase dashboard: Settings → Auth → "Enable email confirmations" → off, recomendado para alpha)
→ redirect a marketplace.html
```

### Logout
```
supabase.auth.signOut() → redirect a index.html
```

---

## Cambios en `shared.js`

Las 4 funciones de auth se reescriben. `setUser()` se elimina — ya no se necesita, Supabase gestiona la sesión internamente. El resto del archivo (nav, toast, routing) no cambia.

```js
// shared.js — auth primitives (nuevas versiones)

async function getUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', session.user.id).single();
  return profile ? { ...profile, email: session.user.email } : null;
}

async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return false; }
  return true;
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}
```

**Impacto en páginas existentes:** todas las llamadas a `getUser()` pasan a ser `await getUser()` dentro de un bloque `DOMContentLoaded` async. Patrón estándar:

```js
document.addEventListener('DOMContentLoaded', async () => {
  await requireAuth();
  const user = await getUser();
  // resto de la página...
});
```

---

## `login.html` — estructura del formulario

Una sola página con dos tabs: **Entrar** y **Crear cuenta**.

**Tab Entrar:**
- Email + contraseña
- Botón "Entrar" → `signInWithPassword()`
- Separador "o"
- Botón "Continuar con Google" → `signInWithOAuth()`
- Link "¿No tienes cuenta?" → activa tab registro

**Tab Crear cuenta:**
- Email, contraseña
- Nombre completo, nombre de empresa
- Ciudad (campo libre)
- Botón "Crear cuenta" → `signUp()` con metadata
- Botón "Continuar con Google" → OAuth (pide datos restantes en `perfil.html`)

**Google OAuth — perfil incompleto:**  
Si el usuario entra con Google y `profiles` no tiene su fila aún (o los campos `name`/`company`/`city` están vacíos), se redirige a `perfil.html`. `perfil.html` detecta este estado comprobando `if (!user.company)` y muestra un formulario modal de "Completa tu perfil" bloqueante (no se puede cerrar sin rellenar). Al guardar, hace `UPDATE` en la tabla `profiles`.

---

## `supabase.js` — cliente

```js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://xxxx.supabase.co';      // reemplazar
const SUPABASE_ANON_KEY = 'eyJ...';                    // reemplazar

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Cargado antes de `shared.js` en todas las páginas de plataforma.

---

## Compatibilidad con `data.js`

`data.js` no se toca. El marketplace sigue leyendo `PRODUCTS` de `data.js`. La función `initNav()` en `shared.js` llama a `getUser()` (ahora async) para mostrar el avatar y el nombre real del usuario logueado. `MOCK_USERS` queda obsoleto pero no se elimina — es el fallback de datos de vendedor en las fichas de producto.

---

## Fuera de scope (siguiente iteración)

- Migración de productos a tabla Supabase
- Upload de imágenes a Supabase Storage
- Sistema de mensajería real
- Verificación de empresas
