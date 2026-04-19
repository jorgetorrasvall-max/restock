// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Tabs (Solicitar / Tengo código)
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// Spots counter animation
const spotsBar = document.getElementById('spotsBar');
const spotsLeft = document.getElementById('spotsLeft');
const totalSpots = 10;
const usedSpots = 3;

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        spotsBar.style.width = ((usedSpots / totalSpots) * 100) + '%';
        spotsLeft.textContent = totalSpots - usedSpots;
      }, 300);
      observer.disconnect();
    }
  });
}, { threshold: 0.5 });

if (spotsBar) observer.observe(spotsBar);

// 20 alpha codes (RESTOCK-ALPHA-001 to 020)
const validCodes = Array.from({ length: 20 }, (_, i) =>
  'RESTOCK-ALPHA-' + String(i + 1).padStart(3, '0')
);

const codeForm = document.getElementById('codeForm');
const codeInput = document.getElementById('codeInput');
const codeResult = document.getElementById('codeResult');

if (codeForm) {
  codeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = codeInput.value.trim().toUpperCase();
    codeResult.className = 'code-result';
    if (validCodes.includes(val)) {
      codeResult.classList.add('success');
      codeResult.textContent = '✓ Código válido. ¡Bienvenido a ReStock! Te redirigiremos a la plataforma en breve.';
    } else {
      codeResult.classList.add('error');
      codeResult.textContent = '✗ Código no reconocido. Comprueba que está escrito correctamente (ej: RESTOCK-ALPHA-001).';
    }
  });
}

// Request form
const requestForm = document.getElementById('requestForm');
if (requestForm) {
  requestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = requestForm.querySelector('button[type=submit]');
    btn.textContent = '✓ Solicitud enviada — te contactamos en 24h';
    btn.disabled = true;
    btn.style.background = '#065f46';
    requestForm.querySelectorAll('input, select').forEach(el => el.disabled = true);
  });
}

// Fade-up on scroll
const fadeEls = document.querySelectorAll('.problem-card, .how-step, .benefit-card, .tier, .why-list li');
fadeEls.forEach(el => el.classList.add('fade-up'));

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

fadeEls.forEach(el => fadeObserver.observe(el));
