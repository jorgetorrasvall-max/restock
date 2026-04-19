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

const PRODUCTS = [
  {
    id: 1, title: 'Lote 250 camisetas polo hombre', category: 'moda', condition: 'B',
    price: 850, quantity: 250, unit: 'unidades',
    seller: { id: 1, name: 'TiendaModa BCN', city: 'Barcelona', rating: 4.8, reviews: 12, avatar: 'T', since: 'Nov 2025' },
    description: 'Lote de 250 camisetas polo para hombre, tallas M, L y XL (mix). Producto de temporada anterior sin etiqueta. Todo el género en perfecto estado de almacenaje. Ideal para reventa en tiendas físicas o eCommerce de moda.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Polo+Hombre+x250'],
    created: '2026-04-10', views: 143, active: true,
  },
  {
    id: 2, title: 'Lote 50 auriculares Bluetooth TWS', category: 'electronica', condition: 'A',
    price: 1200, quantity: 50, unit: 'unidades',
    seller: { id: 2, name: 'ElectroPro Madrid', city: 'Madrid', rating: 4.9, reviews: 28, avatar: 'E', since: 'Sep 2025' },
    description: 'Auriculares TWS nuevos con etiqueta y caja original. Compatibles iOS/Android. Autonomía 6h + 18h con estuche de carga. Stock de liquidación por cambio de línea. CE certificado.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Auriculares+TWS+x50'],
    created: '2026-04-12', views: 287, active: true,
  },
  {
    id: 3, title: 'Lote 100 cremas hidratantes faciales', category: 'cosmetica', condition: 'A',
    price: 320, quantity: 100, unit: 'unidades',
    seller: { id: 3, name: 'BeautyStock Valencia', city: 'Valencia', rating: 4.7, reviews: 9, avatar: 'B', since: 'Ene 2026' },
    description: 'Cremas hidratantes faciales 50ml, marca blanca de calidad. Nuevas con etiqueta. Lote de liquidación de almacén. Fecha de caducidad 2028. Apto piel sensible.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Cremas+x100'],
    created: '2026-04-08', views: 92, active: true,
  },
  {
    id: 4, title: 'Lote 200 juguetes infantiles surtidos', category: 'juguetes', condition: 'B',
    price: 680, quantity: 200, unit: 'unidades',
    seller: { id: 4, name: 'ToyLot SL', city: 'Zaragoza', rating: 4.5, reviews: 6, avatar: 'T', since: 'Feb 2026' },
    description: 'Stock sobrante campaña Navidad. Juguetes variados para 3-8 años. Sin caja original, producto en perfecto estado. Ideal para tiendas de barrio, mercadillos o eCommerce.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Juguetes+x200'],
    created: '2026-04-05', views: 175, active: true,
  },
  {
    id: 5, title: 'Lote 80 pares zapatillas deportivas', category: 'deportes', condition: 'B',
    price: 1500, quantity: 80, unit: 'pares',
    seller: { id: 5, name: 'SportStock Bilbao', city: 'Bilbao', rating: 4.6, reviews: 15, avatar: 'S', since: 'Oct 2025' },
    description: 'Zapatillas deportivas running, tallas 38-46 (mix). Marca nacional sin caja. PVP original 55€/par, se vende a 18,75€/par. Rotación garantizada en cualquier canal.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Zapatillas+x80'],
    created: '2026-04-14', views: 312, active: true,
  },
  {
    id: 6, title: 'Lote 150 lámparas LED regulables', category: 'hogar', condition: 'A',
    price: 420, quantity: 150, unit: 'unidades',
    seller: { id: 6, name: 'HomeDeco Bilbao', city: 'Bilbao', rating: 4.8, reviews: 11, avatar: 'H', since: 'Dic 2025' },
    description: 'Lámparas LED de escritorio con 3 modos de luz y regulación táctil. Nuevas con caja original. Stock por cambio de catálogo. Certificado CE.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Lamparas+LED+x150'],
    created: '2026-04-11', views: 88, active: true,
  },
  {
    id: 7, title: 'Lote 300 camisetas básicas mujer', category: 'moda', condition: 'C',
    price: 480, quantity: 300, unit: 'unidades',
    seller: { id: 1, name: 'TiendaModa BCN', city: 'Barcelona', rating: 4.8, reviews: 12, avatar: 'T', since: 'Nov 2025' },
    description: 'Camisetas básicas mujer algodón 100%, tallas S/M/L. Pequeñas arrugas por almacenaje, sin defectos de calidad. Ideales para serigrafía, sublimación o reventa directa.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Camisetas+Mujer+x300'],
    created: '2026-04-09', views: 201, active: true,
  },
  {
    id: 8, title: 'Lote 60 tablets 10" Android', category: 'electronica', condition: 'B',
    price: 2400, quantity: 60, unit: 'unidades',
    seller: { id: 2, name: 'ElectroPro Madrid', city: 'Madrid', rating: 4.9, reviews: 28, avatar: 'E', since: 'Sep 2025' },
    description: 'Tablets Android 10 pulgadas, 3GB RAM / 32GB. Sin caja original. Modelo descatalogado con 6 meses de garantía del vendedor. Perfectas para colegios y empresas.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Tablets+Android+x60'],
    created: '2026-04-13', views: 445, active: true,
  },
  {
    id: 9, title: 'Lote 500 botellas vidrio 750ml', category: 'alimentacion', condition: 'A',
    price: 290, quantity: 500, unit: 'unidades',
    seller: { id: 7, name: 'AlimentosGranel SL', city: 'Murcia', rating: 4.4, reviews: 4, avatar: 'A', since: 'Mar 2026' },
    description: 'Botellas de vidrio reutilizables 750ml, tapón swing-top incluido. Nuevas sin contenido. Perfectas para hostelería, eventos o tiendas eco.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Botellas+Vidrio+x500'],
    created: '2026-04-07', views: 67, active: true,
  },
  {
    id: 10, title: 'Lote 120 mochilas escolares 20L', category: 'otros', condition: 'A',
    price: 960, quantity: 120, unit: 'unidades',
    seller: { id: 8, name: 'PackStock Sevilla', city: 'Sevilla', rating: 4.7, reviews: 8, avatar: 'P', since: 'Dic 2025' },
    description: 'Mochilas escolares 20L, diseño neutro apto niño y niña. Nuevas con etiqueta. Campaña vuelta al cole cancelada. PVP 25€/ud, se vende a 8€/ud.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Mochilas+x120'],
    created: '2026-04-15', views: 134, active: true,
  },
  {
    id: 11, title: 'Lote 40 relojes smartwatch', category: 'electronica', condition: 'A',
    price: 1800, quantity: 40, unit: 'unidades',
    seller: { id: 2, name: 'ElectroPro Madrid', city: 'Madrid', rating: 4.9, reviews: 28, avatar: 'E', since: 'Sep 2025' },
    description: 'Smartwatches con monitor cardíaco, GPS y notificaciones. Nuevos con caja. Compatible iOS y Android. Stock de modelo anterior por actualización de gama.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Smartwatch+x40'],
    created: '2026-04-16', views: 203, active: true,
  },
  {
    id: 12, title: 'Lote 180 pares calcetines deportivos', category: 'deportes', condition: 'A',
    price: 180, quantity: 180, unit: 'pares',
    seller: { id: 5, name: 'SportStock Bilbao', city: 'Bilbao', rating: 4.6, reviews: 15, avatar: 'S', since: 'Oct 2025' },
    description: 'Calcetines deportivos algodón reforzado, talla única 36-46. Nuevos con etiqueta. Liquidación de temporada.',
    images: ['https://placehold.co/640x420/1A3C6E/FFFFFF?text=Calcetines+x180'],
    created: '2026-04-16', views: 56, active: true,
  },
];

const ALPHA_CODES = Array.from({ length: 20 }, (_, i) => ({
  code: 'RESTOCK-ALPHA-' + String(i + 1).padStart(3, '0'),
  used: i < 3,
  usedBy: i < 3 ? ['test@demo.com', 'amigo@demo.com', 'beta@demo.com'][i] : null,
}));

const MOCK_USERS = [
  { id: 0, name: 'Jorge Torras', email: 'jorgetorrasvall@gmail.com', avatar: 'J', city: 'Barcelona', type: 'Ambos', isAdmin: true, isFounder: true, products: 0 },
  { id: 1, name: 'TiendaModa BCN', email: 'info@tiendamodabcn.com', avatar: 'T', city: 'Barcelona', type: 'Vendedor', isAdmin: false, isFounder: true, products: 2 },
  { id: 2, name: 'ElectroPro Madrid', email: 'ventas@electropro.es', avatar: 'E', city: 'Madrid', type: 'Ambos', isAdmin: false, isFounder: false, products: 4 },
  { id: 3, name: 'BeautyStock Valencia', email: 'stock@beauty.es', avatar: 'B', city: 'Valencia', type: 'Vendedor', isAdmin: false, isFounder: false, products: 1 },
  { id: 4, name: 'ToyLot SL', email: 'info@toylot.es', avatar: 'T', city: 'Zaragoza', type: 'Vendedor', isAdmin: false, isFounder: false, products: 1 },
  { id: 5, name: 'SportStock Bilbao', email: 'sport@bilbao.es', avatar: 'S', city: 'Bilbao', type: 'Ambos', isAdmin: false, isFounder: false, products: 2 },
];

const MOCK_CONVERSATIONS = [
  {
    id: 1, productId: 2,
    with: { id: 2, name: 'ElectroPro Madrid', avatar: 'E' },
    lastMessage: '¿Podéis hacer envío a Valencia?', time: 'hace 2h', unread: 2,
    messages: [
      { from: 'them', text: 'Hola, me interesa el lote de auriculares. ¿Sigue disponible?', time: '10:00' },
      { from: 'me', text: 'Sí, todavía disponible. ¿Cuántas unidades necesitas?', time: '10:15' },
      { from: 'them', text: '¿Podéis hacer envío a Valencia?', time: '10:30' },
    ],
  },
  {
    id: 2, productId: 5,
    with: { id: 5, name: 'SportStock Bilbao', avatar: 'S' },
    lastMessage: 'Perfecto, hacemos el pedido esta semana.', time: 'ayer', unread: 0,
    messages: [
      { from: 'them', text: '¿Podéis separar 20 pares talla 42?', time: 'ayer 15:00' },
      { from: 'me', text: 'No, el lote es completo. El MOQ es el lote entero.', time: 'ayer 15:30' },
      { from: 'them', text: 'Perfecto, hacemos el pedido esta semana.', time: 'ayer 16:00' },
    ],
  },
  {
    id: 3, productId: 8,
    with: { id: 2, name: 'ElectroPro Madrid', avatar: 'E' },
    lastMessage: 'Te mandamos la factura proforma mañana.', time: 'hace 3 días', unread: 0,
    messages: [
      { from: 'me', text: 'Me interesa el lote de tablets. ¿Tienen garantía?', time: 'hace 3 días' },
      { from: 'them', text: 'Sí, 6 meses de garantía del vendedor. ¿Necesitas factura proforma?', time: 'hace 3 días' },
      { from: 'me', text: 'Sí por favor.', time: 'hace 3 días' },
      { from: 'them', text: 'Te mandamos la factura proforma mañana.', time: 'hace 3 días' },
    ],
  },
];

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
