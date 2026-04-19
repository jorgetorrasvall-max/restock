function getUser() {
  const u = localStorage.getItem('rs_user');
  return u ? JSON.parse(u) : null;
}

function setUser(user) {
  localStorage.setItem('rs_user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('rs_user');
  window.location.href = 'index.html';
}

function requireAuth() {
  if (!getUser()) { window.location.href = 'login.html'; return false; }
  return true;
}

function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function initNav() {
  const user = getUser();
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

  if (adminLink && user?.isAdmin) adminLink.style.display = 'flex';

  if (userBtn && dropdown) {
    userBtn.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('open'); });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  const msgBadge = document.getElementById('msgBadge');
  if (msgBadge) {
    const unread = MOCK_CONVERSATIONS.reduce((s, c) => s + c.unread, 0);
    if (unread > 0) { msgBadge.textContent = unread; msgBadge.style.display = 'flex'; }
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

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initNavSearch();
  initMobileNav();
});
