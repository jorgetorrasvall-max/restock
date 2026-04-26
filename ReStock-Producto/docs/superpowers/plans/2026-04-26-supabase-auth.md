# Supabase Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock localStorage auth with real Supabase Auth (email/password + Google OAuth) and a `profiles` table in Postgres.

**Architecture:** Supabase-js loaded via UMD CDN — no build step. A new `supabase-init.js` initializes the client as `_supabase` global. `shared.js` auth primitives become async. All platform pages add the two Supabase script tags and await auth calls. `data.js` is untouched — products stay mock.

**Tech Stack:** Supabase Auth, Supabase Postgres, `@supabase/supabase-js@2` via jsdelivr UMD CDN, vanilla JS, HTML.

**Spec:** `docs/superpowers/specs/2026-04-26-supabase-auth-design.md`

---

## Task 1: Supabase dashboard setup (manual)

**Files:**
- Create: `docs/superpowers/sql/001-profiles.sql` (reference copy)

- [ ] **Step 1: Create Supabase project**

  Go to [supabase.com](https://supabase.com) → New project.
  - Name: `restock`
  - Region: West EU (Frankfurt)
  - Save the **Project URL** and **anon public key** — needed in Task 2.

- [ ] **Step 2: Run profiles table SQL**

  Go to Supabase dashboard → SQL Editor → New query. Paste and run:

  ```sql
  CREATE TABLE public.profiles (
    id          uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name        text NOT NULL DEFAULT '',
    company     text NOT NULL DEFAULT '',
    city        text NOT NULL DEFAULT '',
    is_admin    boolean DEFAULT false,
    is_founder  boolean DEFAULT false,
    created_at  timestamptz DEFAULT now()
  );

  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Own profile read" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

  CREATE POLICY "Own profile update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
  ```

- [ ] **Step 3: Run trigger SQL**

  New query in SQL Editor:

  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.profiles (id, name, company, city)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'company', ''),
      COALESCE(NEW.raw_user_meta_data->>'city', '')
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

- [ ] **Step 4: Disable email confirmations**

  Dashboard → Authentication → Settings → "Enable email confirmations" → toggle OFF → Save.

- [ ] **Step 5: Enable Google OAuth**

  Dashboard → Authentication → Providers → Google → Enable.
  - Follow the prompt to create a Google OAuth app in [console.cloud.google.com](https://console.cloud.google.com):
    - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
  - Paste Client ID and Client Secret back into the Supabase Google provider form → Save.

- [ ] **Step 6: Save SQL reference file**

  Create `docs/superpowers/sql/001-profiles.sql` with the SQL from Steps 2 and 3 combined (for version control reference). Commit:

  ```bash
  git add docs/superpowers/sql/001-profiles.sql
  git commit -m "docs: add profiles table SQL reference"
  ```

---

## Task 2: Create `supabase-init.js`

**Files:**
- Create: `supabase-init.js`

- [ ] **Step 1: Create the file**

  Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` with the values from Task 1 Step 1.

  ```js
  // supabase-init.js
  const _supabase = window.supabase.createClient(
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  );
  ```

- [ ] **Step 2: Verify in browser console**

  Open any platform page locally. Open DevTools → Console. Run:
  ```js
  _supabase.auth.getSession().then(r => console.log(r))
  ```
  Expected: `{ data: { session: null }, error: null }`

- [ ] **Step 3: Commit**

  ```bash
  git add supabase-init.js
  git commit -m "feat: add Supabase client init"
  ```

---

## Task 3: Rewrite auth in `shared.js`

**Files:**
- Modify: `shared.js:1-18` (auth primitives), `shared.js:24-52` (initNav), `shared.js:80-84` (DOMContentLoaded)

- [ ] **Step 1: Replace auth primitives**

  Remove `getUser()`, `setUser()`, `logout()`, `requireAuth()` (lines 1–18). Replace with:

  ```js
  async function getUser() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return null;
    const { data: profile } = await _supabase
      .from('profiles').select('*').eq('id', session.user.id).single();
    return profile ? { ...profile, email: session.user.email } : null;
  }

  async function requireAuth() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return false; }
    return true;
  }

  async function logout() {
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
  }
  ```

- [ ] **Step 2: Make `initNav` async**

  Find `function initNav() {` and change it to `async function initNav() {`.

  Find the line `const user = getUser();` inside `initNav` and change it to:
  ```js
  const user = await getUser();
  ```

  The rest of `initNav` remains unchanged.

- [ ] **Step 3: Update DOMContentLoaded**

  Find the block at the bottom of `shared.js` (lines 80–84):
  ```js
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initNavSearch();
    initMobileNav();
  });
  ```

  Replace with:
  ```js
  document.addEventListener('DOMContentLoaded', async () => {
    await initNav();
    initNavSearch();
    initMobileNav();
  });
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add shared.js
  git commit -m "feat: rewrite shared.js auth to use Supabase async"
  ```

---

## Task 4: Add Supabase CDN to all platform pages

**Files:**
- Modify: `marketplace.html:172`, `producto.html:148`, `mensajes.html:122`, `perfil.html:147`, `publicar.html:197`, `admin.html:212`

Each platform page currently loads `data.js` then `shared.js`. Add the Supabase UMD CDN and `supabase-init.js` immediately before `data.js` in each file.

- [ ] **Step 1: `marketplace.html`**

  Find:
  ```html
  <script src="data.js"></script>
  <script src="shared.js"></script>
  ```
  Replace with:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script src="supabase-init.js"></script>
  <script src="data.js"></script>
  <script src="shared.js"></script>
  ```

- [ ] **Step 2: `producto.html`**

  Same replacement at line 148.

- [ ] **Step 3: `mensajes.html`**

  Same replacement at line 122.

- [ ] **Step 4: `perfil.html`**

  Same replacement at line 147.

- [ ] **Step 5: `publicar.html`**

  Same replacement at line 197.

- [ ] **Step 6: `admin.html`**

  Same replacement at line 212.

- [ ] **Step 7: Commit**

  ```bash
  git add marketplace.html producto.html mensajes.html perfil.html publicar.html admin.html
  git commit -m "feat: add Supabase CDN script to all platform pages"
  ```

---

## Task 5: Update `getUser`/`requireAuth` calls to async in platform pages

**Files:**
- Modify: `marketplace.html`, `producto.html`, `mensajes.html`, `publicar.html`, `admin.html`

`shared.js` now provides async functions. Every call site that calls `getUser()` or `requireAuth()` must be inside an `async` function and use `await`.

- [ ] **Step 1: `marketplace.html`**

  Find the inline `<script>` after `shared.js`. Locate `const user = getUser();` (line ~194).

  The surrounding code calls this inside a regular function. Wrap the relevant function or block in `async` and add `await`:
  ```js
  // Before
  const user = getUser();
  // After
  const user = await getUser();
  ```
  Ensure the function containing this call is declared `async`. If it is a top-level statement (not inside a function), wrap it in an async IIFE:
  ```js
  (async () => {
    const user = await getUser();
    // ... rest of the code that uses user
  })();
  ```

- [ ] **Step 2: `producto.html`**

  Find the IIFE at line ~153:
  ```js
  (function() {
    const user = getUser();
  ```
  Change to async IIFE and await:
  ```js
  (async () => {
    const user = await getUser();
  ```
  Close with `})();` unchanged.

  Lines 223 and 287 also call `getUser()`. Check their context:
  - If inside an event listener callback, make that callback `async` and `await getUser()`.
  - Pattern: `button.addEventListener('click', async () => { const user = await getUser(); ... })`

- [ ] **Step 3: `mensajes.html`**

  Find lines 125–126:
  ```js
  requireAuth();
  const user = getUser();
  ```
  Replace with — these must be at the top of an async block:
  ```js
  await requireAuth();
  const user = await getUser();
  ```
  Wrap the enclosing block in `async` if needed. If these are top-level inside a `<script>`, wrap them:
  ```js
  (async () => {
    await requireAuth();
    const user = await getUser();
    // ... rest of the script
  })();
  ```

- [ ] **Step 4: `publicar.html`**

  Find lines 200, 203, 249, 271:
  - Line 200: `requireAuth();` → `await requireAuth();`
  - Line 203: `const user = getUser();` → `const user = await getUser();`
  - Line 249: `const user = getUser();` → `const user = await getUser();`
  - Line 271: `setUser(user);` — **delete this line entirely** (setUser is removed; product count update was mock-only)
  - Also delete line 270: `user.products = (user.products || 0) + 1;` (mock-only, no longer needed)

  Ensure all these are inside `async` functions. Same wrapping pattern as mensajes.html if top-level.

- [ ] **Step 5: `admin.html`**

  Find line 215: `const user = getUser();`

  Change to `const user = await getUser();` and ensure the enclosing function is `async`.

- [ ] **Step 6: Verify in browser**

  Open `marketplace.html` locally. Open DevTools → Console. Expected: no errors. The nav should render (avatar shows `?` since no user is logged in yet).

- [ ] **Step 7: Commit**

  ```bash
  git add marketplace.html producto.html mensajes.html publicar.html admin.html
  git commit -m "feat: update auth calls to async/await across platform pages"
  ```

---

## Task 6: Fix user field references across platform pages

**Files:**
- Modify: `marketplace.html`, `producto.html`, `mensajes.html`, `publicar.html`, `perfil.html`

The new `profiles` table returns `{ id, name, company, city, is_admin, is_founder, email }`. The old mock had `avatar` (single letter) and `type` (role string). These no longer exist and must be replaced everywhere.

- [ ] **Step 1: Replace `user.avatar` with `user.name[0].toUpperCase()`**

  Find every occurrence of `${user.avatar}` in platform pages and replace with `${user.name[0].toUpperCase()}`:

  | File | Line | Old | New |
  |---|---|---|---|
  | `marketplace.html` | ~199 | `${user.avatar}` | `${user.name[0].toUpperCase()}` |
  | `producto.html` | ~158 | `${user.avatar}` | `${user.name[0].toUpperCase()}` |
  | `mensajes.html` | ~131 | `${user.avatar}` | `${user.name[0].toUpperCase()}` |
  | `publicar.html` | ~208 | `${user.avatar}` | `${user.name[0].toUpperCase()}` |
  | `perfil.html` | ~160 | `user.avatar` | `user.name[0].toUpperCase()` |

  Also fix `publicar.html:264` where `avatar: user.avatar` is used in the mock seller object:
  ```js
  // Before
  seller: { id: user.id, name: user.name, city: user.city, rating: 5.0, reviews: 0, avatar: user.avatar, since: 'Ahora' },
  // After
  seller: { id: user.id, name: user.name, city: user.city, rating: 5.0, reviews: 0, avatar: user.name[0].toUpperCase(), since: 'Ahora' },
  ```

- [ ] **Step 2: Remove `user.type` references in `perfil.html`**

  Find and delete the two lines in `perfil.html` that reference `user.type`:
  - The line containing `<span>${user.type}</span>` (~line 170) — delete the entire enclosing element or replace the span with an empty string.
  - The line `document.getElementById('accType').textContent = user.type;` (~line 179) — delete this line.

  If there is an `id="accType"` element in the HTML, either delete it or set its content to a static string like `'Comprador y Vendedor'`.

- [ ] **Step 3: Simplify `user.name.split('—')` references**

  In `marketplace.html:200` and `mensajes.html:132`, replace:
  ```js
  ${user.name.split('—')[0].trim()}
  ```
  with:
  ```js
  ${user.name}
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add marketplace.html producto.html mensajes.html publicar.html perfil.html
  git commit -m "fix: replace user.avatar and user.type mock fields with profiles-compatible values"
  ```

---

## Task 7: Rewrite `login.html`

**Files:**
- Modify: `login.html:131-262` (inline script + form HTML)

- [ ] **Step 1: Add Supabase script tags in `<head>`**

  After the Tailwind CDN `<script>` tag (line 10), add:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script src="supabase-init.js"></script>
  ```

- [ ] **Step 2: Remove alpha code field from register form**

  Find and delete the entire `<div>` block containing `regCode` input (the "Código de invitación" field) and its label/hint paragraph — approximately lines 179–184 in the current file.

- [ ] **Step 3: Remove role selector from register form**

  Find the `<div>` containing `<select id="regType">` (the Rol field). Delete that `<div>` entirely — the city input's parent `<div class="grid grid-cols-2 gap-3">` becomes a single-column layout. Change it to a plain `<div>`:
  ```html
  <div>
    <label for="regCity" class="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Ciudad</label>
    <input type="text" id="regCity" placeholder="Barcelona…" autocomplete="address-level2"
      class="w-full px-3.5 py-2.5 rounded-md border border-warm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy/40 transition-colors duration-150" />
  </div>
  ```

- [ ] **Step 4: Replace "Acceso privado" button with Google button in login form**

  Find the `<button id="demoBtn">` block. Replace it with:
  ```html
  <button type="button" id="googleLoginBtn" class="w-full py-2.5 rounded-md border border-warm text-sm font-medium text-ink hover:bg-warm/40 transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2">
    <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
    Continuar con Google
  </button>
  ```

  Also add the same Google button at the bottom of the register form, after the submit button:
  ```html
  <div class="flex items-center gap-3">
    <div class="flex-1 h-px bg-warm"></div>
    <span class="text-xs text-muted">o</span>
    <div class="flex-1 h-px bg-warm"></div>
  </div>
  <button type="button" id="googleRegisterBtn" class="w-full py-2.5 rounded-md border border-warm text-sm font-medium text-ink hover:bg-warm/40 transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2">
    <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
    Continuar con Google
  </button>
  ```

- [ ] **Step 5: Replace the inline `<script>` entirely**

  Find the `<script>` block starting at line ~199 (after `<script src="data.js">`). Replace the entire `<script>` block (from `<script>` to `</script>`) with:

  ```html
  <script>
    (async () => {
      const { data: { session } } = await _supabase.auth.getSession();
      if (session) { window.location.href = 'marketplace.html'; return; }
    })();

    function showLogin() {
      document.getElementById('loginForm').classList.add('active');
      document.getElementById('registerForm').classList.remove('active');
      document.getElementById('tabLogin').className = 'flex-1 py-2.5 text-sm font-semibold bg-navy text-white transition-colors duration-150 cursor-pointer';
      document.getElementById('tabRegister').className = 'flex-1 py-2.5 text-sm font-medium text-muted hover:bg-warm/40 transition-colors duration-150 cursor-pointer';
    }
    function showRegister() {
      document.getElementById('registerForm').classList.add('active');
      document.getElementById('loginForm').classList.remove('active');
      document.getElementById('tabRegister').className = 'flex-1 py-2.5 text-sm font-semibold bg-navy text-white transition-colors duration-150 cursor-pointer';
      document.getElementById('tabLogin').className = 'flex-1 py-2.5 text-sm font-medium text-muted hover:bg-warm/40 transition-colors duration-150 cursor-pointer';
    }

    document.getElementById('loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPwd').value;
      const err = document.getElementById('loginError');
      const btn = e.submitter;
      btn.disabled = true;
      btn.textContent = 'Entrando…';
      const { error } = await _supabase.auth.signInWithPassword({ email, password });
      if (error) {
        err.textContent = 'Email o contraseña incorrectos.';
        err.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Entrar →';
        return;
      }
      window.location.href = 'marketplace.html';
    });

    document.getElementById('registerForm').addEventListener('submit', async e => {
      e.preventDefault();
      const name    = document.getElementById('regName').value.trim();
      const company = document.getElementById('regCompany').value.trim();
      const email   = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPwd').value;
      const city    = document.getElementById('regCity').value.trim() || 'España';
      const err = document.getElementById('regError');
      const btn = e.submitter;
      btn.disabled = true;
      btn.textContent = 'Creando cuenta…';
      const { error } = await _supabase.auth.signUp({
        email,
        password,
        options: { data: { name, company, city } },
      });
      if (error) {
        err.textContent = error.message;
        err.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Crear cuenta →';
        return;
      }
      window.location.href = 'marketplace.html';
    });

    async function signInWithGoogle() {
      await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/login.html' },
      });
    }

    document.getElementById('googleLoginBtn').addEventListener('click', signInWithGoogle);
    document.getElementById('googleRegisterBtn').addEventListener('click', signInWithGoogle);
  </script>
  ```

  Also remove the `<script src="data.js"></script>` line — `login.html` no longer needs `data.js` (no MOCK_USERS used).

- [ ] **Step 6: Verify login flow in browser**

  Open `login.html` locally. Test:
  1. Enter wrong email/password → error message appears, button re-enables.
  2. Open DevTools → Network — verify no calls to Supabase fail with config errors.
  3. (Full test after Netlify deploy — Google OAuth requires HTTPS.)

- [ ] **Step 7: Commit**

  ```bash
  git add login.html
  git commit -m "feat: rewrite login.html with Supabase Auth — email + Google OAuth"
  ```

---

## Task 8: `perfil.html` — incomplete profile modal for Google OAuth users

**Files:**
- Modify: `perfil.html` (add modal HTML + detection logic)

- [ ] **Step 1: Add modal HTML**

  Find the opening `<body>` tag in `perfil.html`. Immediately after it, add:

  ```html
  <!-- Complete profile modal (Google OAuth users) -->
  <div id="completeProfileModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-7">
      <h2 class="font-serif text-xl font-semibold text-ink mb-1">Completa tu perfil</h2>
      <p class="text-sm text-muted mb-5">Necesitamos un par de datos más para activar tu cuenta.</p>
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Nombre completo *</label>
          <input id="cpName" type="text" placeholder="Tu nombre" class="w-full px-3.5 py-2.5 rounded-md border border-warm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy/40" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Empresa *</label>
          <input id="cpCompany" type="text" placeholder="Nombre de tu empresa" class="w-full px-3.5 py-2.5 rounded-md border border-warm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy/40" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Ciudad</label>
          <input id="cpCity" type="text" placeholder="Barcelona…" class="w-full px-3.5 py-2.5 rounded-md border border-warm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy/40" />
        </div>
        <div id="cpError" class="hidden px-3.5 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"></div>
        <button id="cpSave" class="w-full py-2.5 rounded-md bg-navy text-white font-semibold text-sm hover:bg-navy-dark transition-colors duration-150 cursor-pointer">
          Guardar y continuar →
        </button>
      </div>
    </div>
  </div>
  ```

- [ ] **Step 2: Add detection + save logic**

  In `perfil.html`, find the inline `<script>` block (after `shared.js`). Find the lines:
  ```js
  requireAuth();
  const user = getUser();
  ```
  Replace with:
  ```js
  await requireAuth();
  const user = await getUser();

  if (!user.company) {
    document.getElementById('completeProfileModal').classList.remove('hidden');
  }
  ```

  Then add the save handler. At the end of the same `<script>` block, before the closing `</script>`, add:
  ```js
  document.getElementById('cpSave').addEventListener('click', async () => {
    const name    = document.getElementById('cpName').value.trim();
    const company = document.getElementById('cpCompany').value.trim();
    const city    = document.getElementById('cpCity').value.trim() || 'España';
    const err     = document.getElementById('cpError');
    if (!name || !company) {
      err.textContent = 'Nombre y empresa son obligatorios.';
      err.classList.remove('hidden');
      return;
    }
    const { data: { session } } = await _supabase.auth.getSession();
    const { error } = await _supabase
      .from('profiles')
      .update({ name, company, city })
      .eq('id', session.user.id);
    if (error) {
      err.textContent = 'Error al guardar. Inténtalo de nuevo.';
      err.classList.remove('hidden');
      return;
    }
    document.getElementById('completeProfileModal').classList.add('hidden');
    showToast('Perfil completado');
  });
  ```

  Ensure the enclosing script block is wrapped in an async IIFE or the calls to `requireAuth()`/`getUser()` are at the top of an `async` function, since they are now async.

- [ ] **Step 3: Commit**

  ```bash
  git add perfil.html
  git commit -m "feat: perfil.html detects incomplete Google OAuth profile and shows completion modal"
  ```

---

## Task 9: Push to Netlify and E2E verification

**Files:** none

- [ ] **Step 1: Push to main**

  ```bash
  git push origin main
  ```

  Netlify auto-deploys from main. Wait ~30 seconds for deploy to complete.

- [ ] **Step 2: Set admin manually in Supabase**

  After first login with `jorgetorrasvall@gmail.com`:
  - Supabase dashboard → Table Editor → `profiles` → find your row → set `is_admin = true` → Save.

- [ ] **Step 3: Test email/password registration**

  On `https://earnest-crisp-aa4ab3.netlify.app/login.html`:
  1. Click "Registrarse" tab.
  2. Fill all fields with a real email you can access.
  3. Click "Crear cuenta →".
  4. Expected: redirect to `marketplace.html`, nav shows your initial.
  5. Check Supabase dashboard → Authentication → Users — your user appears.
  6. Check Table Editor → `profiles` — your row appears with name, company, city.

- [ ] **Step 4: Test login**

  1. Click your nav avatar → Cerrar sesión.
  2. Go back to `login.html`.
  3. Enter the same email + password.
  4. Expected: redirect to `marketplace.html`.

- [ ] **Step 5: Test Google OAuth**

  1. Click "Continuar con Google" on the login tab.
  2. Complete Google OAuth flow.
  3. Expected: redirect back to `marketplace.html`.
  4. If profile was empty: redirect to `perfil.html` and modal appears.
  5. Fill modal → Save → modal closes.
  6. Check Supabase `profiles` table — row updated.

- [ ] **Step 6: Test protected pages**

  Log out. Try navigating directly to `mensajes.html` and `publicar.html`.
  Expected: immediate redirect to `login.html`.

- [ ] **Step 7: Commit verification note**

  ```bash
  git commit --allow-empty -m "chore: Supabase Auth E2E verified on production"
  ```
