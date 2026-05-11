const CATEGORIES = [
  { id: 'moda', name: 'Moda y Ropa', icon: '👗' },
  { id: 'electronica', name: 'Electrónica', icon: '📱' },
  { id: 'cosmetica', name: 'Cosmética y Belleza', icon: '💄' },
  { id: 'hogar', name: 'Hogar y Decoración', icon: '🏠' },
  { id: 'deportes', name: 'Deportes', icon: '⚽' },
  { id: 'juguetes', name: 'Juguetes', icon: '🧸' },
  { id: 'alimentacion', name: 'Alimentación', icon: '🍎' },
  { id: 'otros', name: 'Otros', icon: '📦' },
];

const CONDITIONS = {
  A: { label: 'Nuevo con etiqueta', color: '#059669', bg: '#ecfdf5' },
  B: { label: 'Nuevo sin etiqueta', color: '#0284c7', bg: '#eff6ff' },
  C: { label: 'Buen estado', color: '#d97706', bg: '#fffbeb' },
  D: { label: 'Defecto visible', color: '#dc2626', bg: '#fef2f2' },
};

function getCommission(price) {
  if (price >= 1000) return { buyer: 3, seller: 3, total: 6 };
  if (price >= 500) return { buyer: 4, seller: 4, total: 8 };
  return { buyer: 5, seller: 5, total: 10 };
}

function getCategoryName(id) { return CATEGORIES.find(c => c.id === id)?.name || id; }
function getCategoryIcon(id) { return CATEGORIES.find(c => c.id === id)?.icon || '📦'; }

function daysAgo(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'ayer';
  return `hace ${diff} días`;
}

function formatPrice(n) { return n.toLocaleString('es-ES') + '€'; }

function stars(rating) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="${i < Math.floor(rating) ? 'star-full' : i < rating ? 'star-half' : 'star-empty'}">★</span>`
  ).join('');
}
