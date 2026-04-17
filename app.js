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
const remaining = totalSpots - usedSpots;

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        spotsBar.style.width = ((usedSpots / totalSpots) * 100) + '%';
        spotsLeft.textContent = remaining;
      }, 300);
      observer.disconnect();
    }
  });
}, { threshold: 0.5 });

if (spotsBar) observer.observe(spotsBar);

// Invitation code validation
const validCodes = [
  'RESTOCK-ALPHA-001', 'RESTOCK-ALPHA-002', 'RESTOCK-ALPHA-003',
  'RESTOCK-ALPHA-004', 'RESTOCK-ALPHA-005',
  'FOUNDER-001', 'FOUNDER-002', 'FOUNDER-003', 'FOUNDER-004',
  'FOUNDER-005', 'FOUNDER-006', 'FOUNDER-007', 'FOUNDER-008',
  'FOUNDER-009', 'FOUNDER-010',
];

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
      codeResult.textContent = '✓ Código válido. ¡Bienvenido a REstock! Te redirigiremos a la plataforma en breve.';
    } else {
      codeResult.classList.add('error');
      codeResult.textContent = '✗ Código no reconocido. Comprueba que está escrito correctamente.';
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
const fadeEls = document.querySelectorAll('.problem-card, .how-step, .benefit-card, .pricing-card, .why-list li');
fadeEls.forEach(el => el.classList.add('fade-up'));

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

fadeEls.forEach(el => fadeObserver.observe(el));
