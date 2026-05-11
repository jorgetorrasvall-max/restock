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

function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

async function initNav() {
  const user = await getUser();
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const adminLink = document.getElementById('adminLink');
  const userBtn = document.getElementById('userBtn');
  const dropdown = document.getElementById('dropdownMenu');

  if (userAvatar) userAvatar.textContent = user ? user.name[0].toUpperCase() : '?';
  if (userName) userName.textContent = user ? user.name.split(' ')[0] : 'Entrar';

  if (!user && userBtn) {
    userBtn.onclick = () => window.location.href = 'login.html';
    return;
  }

  if (adminLink && user?.is_admin) adminLink.style.display = 'flex';

  if (userBtn && dropdown) {
    userBtn.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('open'); });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

}

function initNavSearch() {
  const input = document.getElementById('navSearch');
  if (!input) return;
  const q = getParam('q');
  if (q) input.value = q;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim())
      window.location.href = `marketplace.html?q=${encodeURIComponent(input.value.trim())}`;
  });
}

function initMobileNav() {
  const toggle = document.getElementById('mobileNavToggle');
  const menu = document.getElementById('mobileNavMenu');
  if (toggle && menu) toggle.addEventListener('click', () => menu.classList.toggle('open'));
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
  await initNav();
  initNavSearch();
  initMobileNav();
});
