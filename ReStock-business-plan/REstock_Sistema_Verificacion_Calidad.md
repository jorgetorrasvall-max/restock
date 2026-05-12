# REstock — Sistema de Verificación de Calidad y Antifraude

**Documento de diseño de sistema · Abril 2026**

---

## 1. Sistema de Verificación de Calidad (Core)

### El principio fundamental

La verificación en REstock no es un checkpoint — es una capa que envuelve toda la transacción. La diferencia con Wallapop o Vinted es que REstock opera en B2B: ambas partes son negocios con NIF, reputación comercial y motivación económica para repetir. Esto cambia radicalmente el diseño del sistema porque el fraude deliberado es menos frecuente, pero la **desalineación de expectativas** es más costosa (lotes de 500€+ vs una camiseta de 15€).

### Qué se verifica exactamente

| Dimensión | Qué se comprueba | Por qué importa |
|---|---|---|
| **Estado físico** | Clasificación A/B/C/D estandarizada (nuevo con etiqueta → defecto visible) | Elimina la subjetividad de "buen estado" |
| **Coherencia visual** | Las fotos corresponden a la categoría declarada | Evita fotos genéricas o de catálogo que no reflejan el producto real |
| **Cantidad real** | El número de unidades coincide con lo publicado | En lotes, el vendedor puede inflar la cantidad |
| **Autenticidad** | El producto es lo que dice ser (no réplica ni falsificación) | Crítico en moda, electrónica, cosmética |
| **Descripción textual** | La descripción no contradice las fotos ni la categoría | Detecta descripciones copiadas de otros listings o genéricas |

### Tres capas de verificación (híbrido progresivo)

**Capa 1 — Automatizada (100% de listings)**

Cada listing pasa por validación automática antes de publicarse:

- **Completitud obligatoria**: No se publica sin categoría A/B/C/D, 3 fotos mínimas (lote completo, detalle de unidad, etiqueta/defecto), descripción de mínimo 50 caracteres, y cantidad declarada.
- **Detección de fotos genéricas**: Comparación hash perceptual (pHash) contra base de datos de imágenes de catálogo comunes. Si la foto aparece en Google Images como imagen de stock o de producto del fabricante, se bloquea y se pide foto real. Implementación: API de Google Vision o servicio de reverse image search.
- **Coherencia texto-categoría**: Si el vendedor marca categoría "A — Nuevo con etiqueta" pero la descripción dice "ligero defecto" o "sin embalaje", se detecta la contradicción con NLP básico (keyword matching en fase inicial, modelo de clasificación de texto en fase posterior).
- **Detección de duplicados**: Si el mismo vendedor sube el mismo producto dos veces con fotos idénticas, se alerta.

**Capa 2 — Revisión manual selectiva (15-25% de listings)**

No todos los listings necesitan revisión humana. Se seleccionan por criterios de riesgo:

- Primer listing de un vendedor nuevo (siempre).
- Lotes con valor superior a 300€.
- Listings flaggeados por la capa automática (contradicciones, fotos sospechosas).
- Categorías de alto riesgo (electrónica, cosmética, marcas de lujo).
- Vendedores con historial de incidencias previas.

La revisión manual consiste en: verificar coherencia entre fotos, descripción y categoría. Tiempo estimado: 2-3 minutos por listing. En fase 0, esto lo hace Jorge. En fase 2+, un operador part-time.

**Capa 3 — Verificación física (solo casos específicos)**

Reservada exclusivamente para:

- Lotes superiores a 1.000€.
- Productos de marca premium donde la autenticidad es crítica.
- Disputas post-venta donde ambas partes presentan evidencia contradictoria.

En fase 0-1, la verificación física la hace el propio fundador aprovechando la concentración geográfica en Barcelona. En fase 2+, se puede externalizar a un servicio de inspección local (ver sección 5).

### Cómo evitar fraude específico

| Tipo de fraude | Cómo funciona | Contramedida |
|---|---|---|
| **Fotos de catálogo** | Vendedor usa fotos del fabricante que no reflejan el estado real | Reverse image search + exigir foto con elemento identificativo (ej. nota escrita a mano visible en la foto) |
| **Inflación de cantidad** | Publica "50 unidades" pero solo envía 40 | Foto obligatoria del lote completo + conteo visible. En disputa, carga de prueba al vendedor |
| **Cambio de producto** | Publica producto A, envía producto B inferior | Fotos del listing se convierten en contrato implícito. Si no coincide, devolución con coste al vendedor |
| **Cuenta fantasma** | Crea múltiples cuentas para evadir historial negativo | Verificación de NIF/CIF al registrarse. Un NIF = una cuenta |
| **Shill bidding / autocompra** | Se compra a sí mismo para inflar métricas | Detección de transacciones entre cuentas vinculadas (mismo IP, misma dirección, mismo banco) |
| **Listings falsos para captar datos** | Publica producto inexistente para obtener datos de contacto de compradores | Los datos de contacto no se comparten hasta que hay transacción confirmada en plataforma |

---

## 2. Flujo Completo del Usuario

### Paso a paso: del listing a la entrega

```
VENDEDOR                    PLATAFORMA                    COMPRADOR
   │                            │                            │
   ├─ 1. Registro + NIF ───────►│                            │
   │                            ├─ Verifica NIF ─────────────┤
   │                            │                            │
   ├─ 2. Crea listing ─────────►│                            │
   │    - Categoría A/B/C/D     │                            │
   │    - 3 fotos obligatorias  │                            │
   │    - Descripción + cantidad│                            │
   │                            │                            │
   │                            ├─ 3. VERIFICACIÓN AUTO ─────┤
   │                            │    - Completitud ✓          │
   │                            │    - Fotos reales ✓         │
   │                            │    - Coherencia ✓           │
   │                            │                            │
   │                            ├─ 4. ¿Riesgo alto? ─────────┤
   │                            │    Sí → Revisión manual     │
   │                            │    No → Publicación directa │
   │                            │                            │
   │                            │◄── 5. Comprador compra ────┤
   │                            │                            │
   │                            ├─ 6. PAGO RETENIDO ─────────┤
   │                            │    (escrow 48-72h)          │
   │                            │                            │
   │◄── 7. Notificación envío ──┤                            │
   │                            │                            │
   ├─ 8. Envía producto ───────►│                            │
   │    + Foto del paquete       │                            │
   │                            │◄── 9. Comprador recibe ────┤
   │                            │                            │
   │                            ├─ 10. VENTANA INSPECCIÓN ───┤
   │                            │     48h para verificar      │
   │                            │     vs fotos del listing    │
   │                            │                            │
   │                            │    ¿Coincide?               │
   │                            │    Sí → Pago liberado       │
   │                            │    No → Disputa abierta     │
   │                            │                            │
   │◄── 11. Pago recibido ─────┤                            │
   │                            │                            │
   ├─ 12. Valoración mutua ────►│◄── 12. Valoración mutua ──┤
```

### Dónde interviene la verificación

| Punto del flujo | Tipo de verificación | Fricción añadida |
|---|---|---|
| Registro | NIF/CIF + email corporativo | Una vez. 2 minutos |
| Creación de listing | Automática (completitud + coherencia) | Integrada en el formulario. 0 fricción extra |
| Pre-publicación | Manual selectiva (solo alto riesgo) | Solo 15-25% de listings. Delay de 2-4 horas máximo |
| Post-compra/Pre-envío | Ninguna | — |
| Recepción | Ventana de inspección de 48h | Acción del comprador: confirmar o disputar |

### Puntos de fricción y cómo reducirlos

**Fricción 1: Las 3 fotos obligatorias**
Reducción: Guía visual inline que muestra exactamente qué foto tomar ("Foto 1: todo el lote junto", "Foto 2: primer plano de una unidad", "Foto 3: etiqueta o defecto más visible"). Placeholders con ejemplo real, no texto genérico.

**Fricción 2: La categoría A/B/C/D**
Reducción: Selector visual con imágenes de ejemplo para cada categoría, no solo texto. El vendedor ve "esto es A" con foto y "esto es C" con foto. Decisión en 5 segundos.

**Fricción 3: La ventana de inspección de 48h**
Reducción: Notificación proactiva al comprador ("Tu pedido ha llegado. ¿Todo correcto?") con botón de confirmación rápida. Si no responde en 48h, se asume conformidad y se libera el pago automáticamente.

**Fricción 4: Verificación de NIF en registro**
Reducción: Validación instantánea contra API de AEAT (si disponible) o formato de NIF. No pedir documentación adicional salvo que haya inconsistencia.

---

## 3. Modelos de Verificación Escalables

### Fase 0-1 (0 a 100 transacciones): Manual inteligente

- **Verificación de listings**: Jorge revisa manualmente los primeros 50-100 listings. Esto no es un cuello de botella, es una ventaja — aprendes exactamente qué tipo de fraude o error cometen los vendedores reales.
- **Fotos**: Revisión visual directa. ¿La foto parece real? ¿Hay incoherencia obvia?
- **Disputas**: Resolución personal y directa. Cada disputa es una lección.
- **Coste**: 0€. Tiempo del fundador.
- **Señal para escalar**: Cuando la revisión manual consume más de 2 horas diarias.

### Fase 2 (100 a 1.000 transacciones): Semi-automatizado

- **Reverse image search**: Integración con Google Vision API o TinEye API. Coste: ~1-3€ por cada 1.000 búsquedas. Detecta fotos robadas de catálogos.
- **Coherencia texto-imagen con IA**: Modelo de visión por computador (Google Vision o Claude Vision API) que analiza la foto y la compara con la categoría declarada. Ejemplo: si la foto muestra producto con embalaje roto pero la categoría es "A — Nuevo con etiqueta", se flaggea automáticamente.
- **NLP para descripciones**: Clasificador simple que detecta descripciones copiadas (n-gramas repetidos entre listings), lenguaje evasivo ("puede tener", "no garantizo"), o contradicciones con la categoría.
- **Operador part-time**: Una persona 10-15h/semana para revisar los listings flaggeados. Coste: ~400-600€/mes.

### Fase 3 (1.000+ transacciones): IA como primera línea

- **Modelo propio de clasificación de estado**: Entrenado con las fotos y categorías de los primeros 1.000+ listings verificados manualmente. El modelo asigna automáticamente la categoría probable y la compara con la declarada por el vendedor.
- **Detección de anomalías**: Modelo de detección de outliers que identifica vendedores con patrones inusuales (muchos listings en poco tiempo, categorías siempre "A" pero con disputas frecuentes, precios muy por debajo del mercado).
- **OCR para etiquetas**: Lectura automática de etiquetas en fotos para verificar marca, composición, origen, y comparar con la descripción.
- **Score de confianza automático por listing**: Cada listing recibe un score 0-100 basado en: coherencia foto-descripción, historial del vendedor, completitud, y resultado de checks automáticos. Solo los listings con score < 60 van a revisión humana.

### Cuándo intervienen humanos (regla general)

| Score del listing | Acción |
|---|---|
| 80-100 | Publicación automática inmediata |
| 60-79 | Publicación automática con monitoreo post-publicación |
| 40-59 | Revisión manual antes de publicar (delay 2-4h) |
| 0-39 | Bloqueo + notificación al vendedor para corregir |

---

## 4. Sistema de Reputación Avanzado

### Por qué las reseñas convencionales no sirven

El problema clásico: en Wallapop, el 95% de las reseñas son 5 estrellas porque solo valora quien tuvo buena experiencia. Las reseñas no discriminan entre un vendedor excelente y uno mediocre. Además, son fáciles de falsificar (autocompra + valoración positiva).

### Sistema de Trust Score (no reseñas)

En lugar de reseñas visibles tipo "5 estrellas — todo perfecto", REstock calcula un **Trust Score** compuesto por señales objetivas que el usuario no puede manipular directamente:

**Señales de comportamiento (peso: 40%)**

- **Ratio de disputas**: % de transacciones que acaban en disputa vs total. Un vendedor con 50 transacciones y 0 disputas es objetivamente más fiable que uno con 10 y 2.
- **Tiempo de envío**: Media de días entre confirmación de pedido y envío real. Consistencia importa más que velocidad.
- **Tasa de respuesta**: % de mensajes de compradores respondidos en <24h.
- **Coherencia de categorización**: % de transacciones donde la categoría declarada coincide con la percepción del comprador (medida post-venta con pregunta simple: "¿El estado coincidía con lo publicado?" Sí/No).

**Señales de identidad (peso: 30%)**

- **Verificación de NIF/CIF**: Confirmado = +15 puntos.
- **Antigüedad en la plataforma**: Más meses activo = más puntos (logarítmico, no lineal — no premia solo por existir).
- **Completitud de perfil**: Dirección verificada, foto de tienda, descripción de negocio.
- **Vinculación bancaria**: Cuenta bancaria verificada vía Stripe Connect.

**Señales de actividad (peso: 30%)**

- **Volumen de transacciones completadas**: Más transacciones = más datos = más confianza (pero con techo — 50 transacciones y 500 tienen el mismo peso).
- **Diversidad de compradores**: Vender a 20 compradores distintos es más fiable que 20 transacciones con 3 compradores.
- **Recurrencia**: Compradores que vuelven a comprar al mismo vendedor es la señal más fuerte de calidad real.

### Cómo se muestra al usuario

El Trust Score NO se muestra como número. Se traduce en niveles visibles:

| Score interno | Nivel visible | Indicador |
|---|---|---|
| 85-100 | Vendedor Verificado Plus | Sello verde + badge |
| 65-84 | Vendedor Verificado | Sello verde |
| 40-64 | Vendedor Activo | Sin sello especial |
| 0-39 | Bajo observación | Alerta visible para compradores |

¿Por qué no mostrar el número? Porque un "73" no significa nada para el comprador y genera ansiedad en el vendedor. Los niveles son más accionables.

### Cómo evitar reseñas falsas

- **No hay reseñas abiertas de texto.** Solo la pregunta binaria post-transacción: "¿El estado coincidía con lo publicado?" Sí/No. Esto elimina el incentivo de escribir reseñas falsas elaboradas.
- **Solo puede valorar quien compró.** Verificado automáticamente por la plataforma.
- **Detección de autocompra.** Transacciones entre cuentas con mismo IP, misma dirección de envío, o misma cuenta bancaria se excluyen del cálculo de Trust Score.
- **Ponderación temporal.** Las últimas 20 transacciones pesan más que las primeras 20. Un vendedor que era bueno hace 6 meses pero ha empeorado ve reflejado el cambio.

---

## 5. Logística y Control Físico

### ¿Tiene sentido un centro de verificación?

**Respuesta corta: No. No en fase 0-2.**

Un centro de verificación (tipo StockX o The RealReal) implica:

- Alquiler de local (~800-1.500€/mes en Barcelona).
- Personal de inspección (~1.200-1.800€/mes por persona).
- Seguro de mercancía almacenada.
- Logística de doble envío: vendedor → centro → comprador.

Para un marketplace pre-revenue con lotes de 100-500€, el coste destruye el margen. El take rate de REstock es 8-12% al vendedor + 3-5% al comprador = 11-17% total. En un lote de 200€, eso es 22-34€. Un envío extra al centro de verificación cuesta 5-8€ y una inspección 3-5 minutos de trabajo. No cierra.

### Alternativas más eficientes

**Alternativa 1: Verificación fotográfica reforzada (fase 0-2)**
Ya descrita en la sección 1. Coste: 0€. Efectividad: cubre el 80-90% de los casos.

**Alternativa 2: Red de verificadores locales a demanda (fase 2-3)**
En lugar de un centro fijo, una red de verificadores freelance en Barcelona (y después en otras ciudades) que visitan la tienda del vendedor bajo demanda. Similar al modelo de inspección de Catawiki para arte y antigüedades.

- Se activa solo para lotes > 500€ o categorías de alto riesgo.
- El verificador hace fotos estandarizadas, confirma cantidad y estado, y sube un informe de 5 campos.
- Coste por verificación: 10-15€ (pagado por el vendedor como servicio opcional, o incluido para vendedores Premium).
- No requiere local fijo ni personal permanente.

**Alternativa 3: Centro de verificación ligero (fase 3+, solo si las métricas lo justifican)**
Un espacio compartido (coworking logístico) donde se inspeccionan solo los lotes de alto valor o las categorías con mayor tasa de disputa. No un almacén permanente, sino un punto de paso temporal. Solo tiene sentido cuando el GMV mensual supere los 50.000€ y la tasa de disputas en categorías específicas supere el 5%.

---

## 6. Modelo de Negocio de la Verificación

### Principio: La verificación básica es gratuita

La verificación automática (capa 1) y la categorización A/B/C/D son gratuitas y obligatorias para todos. Esto no es un upsell — es la infraestructura base que hace funcionar el marketplace. Cobrar por la verificación básica sería como cobrar por el candado de la puerta.

### Monetización de la verificación premium

| Servicio | Precio | Quién paga | Cuándo tiene sentido |
|---|---|---|---|
| **Sello "Verificado Plus"** | Incluido en suscripción Premium (15-25€/mes) | Vendedor | Cuando el vendedor quiere diferenciarse y generar más confianza |
| **Inspección física a demanda** | 10-15€ por inspección | Vendedor (o comprador si la solicita) | Lotes > 500€ o categorías sensibles |
| **Seguro de transacción** | 2-3% del valor del lote | Comprador (opcional) | Cuando el comprador quiere protección total contra incoherencia |
| **Informe de mercado con métricas de calidad** | Incluido en Premium | Vendedor | Vendedores recurrentes que quieren entender qué categorías y estados se venden mejor |

### Qué estaría dispuesto a pagar el usuario

Esto hay que validarlo, pero la hipótesis basada en benchmarks de marketplaces B2B:

- **El vendedor paga por visibilidad y credibilidad.** Un sello de verificación que aumenta su tasa de conversión un 20-30% justifica 15-25€/mes si hace más de 3-4 transacciones mensuales.
- **El comprador paga por seguridad en lotes grandes.** Un seguro del 2-3% en un lote de 1.000€ son 20-30€. Comparado con el riesgo de recibir 40 unidades en lugar de 50, es una decisión racional.
- **Nadie paga por verificación básica.** Si la cobras, los vendedores migran a WhatsApp/Telegram donde es gratis (y pierdes la transacción y la comisión).

### Proyección de ingresos por verificación (año 2)

Asumiendo 3.000 usuarios activos y 400K€ GMV (según proyección existente):

| Fuente | Cálculo | Ingreso estimado |
|---|---|---|
| Suscripciones Premium | 5% de vendedores × 20€/mes × 12 meses | ~3.600€/año |
| Inspecciones físicas | 50 inspecciones/año × 12€ | ~600€/año |
| Seguro de transacción | 10% de transacciones × ticket medio 200€ × 2.5% | ~2.000€/año |
| **Total verificación** | | **~6.200€/año** |

No es un revenue driver principal en año 2, pero sí una fuente incremental que crece con el GMV y contribuye al moat.

---

## 7. Ventaja Competitiva Real

### Por qué este sistema es difícil de copiar

**1. La base de datos de coherencia foto-categoría es un activo propietario**

Cada listing verificado manualmente alimenta el modelo de IA. Después de 5.000 listings, REstock tiene un dataset único de fotos de stock sobrante categorizadas que ningún competidor tiene. Esto no se compra — se construye transacción a transacción. Un nuevo entrante empieza con cero datos.

**2. El Trust Score se entrena con señales que requieren actividad real**

No puedes simular 6 meses de historial de transacciones, ratio de disputas, y recurrencia de compradores. Un competidor puede copiar la interfaz, pero no el grafo de confianza entre usuarios.

**3. La red de verificadores locales es un activo operativo**

Si en fase 2-3 REstock tiene 15-20 verificadores freelance en Barcelona, Madrid y Valencia, eso es una infraestructura humana que tarda meses en replicar y requiere conocimiento local.

### Por qué sería 10x mejor que Wallapop para B2B

| Dimensión | Wallapop | REstock |
|---|---|---|
| **Verificación de estado** | Ninguna. El vendedor pone lo que quiere | Clasificación A/B/C/D obligatoria + coherencia foto-texto verificada |
| **Identidad del vendedor** | Anónima. Email y ya | NIF/CIF verificado. Negocio real con dirección |
| **Protección al comprador** | Envío con Wallapop Envíos (básica) | Escrow + ventana de inspección + seguro opcional |
| **Reputación** | Estrellas manipulables | Trust Score basado en señales objetivas no manipulables |
| **Datos de mercado** | Ninguno | El vendedor sabe qué categorías y estados tienen más demanda |
| **Especialización** | Generalista (bicicletas, muebles, todo) | Solo stock sobrante B2B. Cada feature está diseñada para este caso |

La ventaja no es una feature individual — es que todo el sistema está diseñado para un solo caso de uso. Wallapop no puede replicar esto sin crear un producto separado.

---

## 8. Riesgos Críticos

### Cómo pueden romper el sistema los usuarios

**Riesgo 1: El vendedor profesional del fraude**

Un vendedor con NIF real registra su negocio legítimo, hace 10 transacciones impecables para construir Trust Score alto, y en la transacción 11 envía producto de calidad inferior en un lote de 2.000€.

*Por qué es peligroso*: Pasa todos los filtros automáticos porque tiene historial limpio. El comprador pierde dinero y confianza.

*Mitigación*: El escrow retiene el pago 48-72h. El seguro de transacción cubre al comprador. El vendedor pierde todo su Trust Score acumulado, y con NIF verificado no puede crear otra cuenta. La pérdida para el vendedor (reputación destruida + posible bloqueo permanente) supera la ganancia del fraude único. Pero no elimina el riesgo al 100%.

**Riesgo 2: El comprador que abusa de las disputas**

Un comprador sistemáticamente abre disputas falsas alegando que el producto "no coincide", forzando devoluciones con coste al vendedor. Usa el sistema de protección como herramienta de fraude inverso.

*Por qué es peligroso*: Si REstock siempre favorece al comprador en disputas, los vendedores pierden confianza y abandonan la plataforma.

*Mitigación*: Tracking del ratio de disputas del comprador. Si un comprador abre disputas en más del 15% de sus compras, se activa revisión manual de sus futuras disputas. Trust Score aplica también a compradores, no solo vendedores.

**Riesgo 3: Migración fuera de plataforma**

Vendedor y comprador se conectan en REstock, pero cierran la transacción por WhatsApp para evitar la comisión. REstock pierde el ingreso y la capacidad de verificar.

*Por qué es peligroso*: Es el riesgo existencial de todo marketplace. Si el 30%+ de las transacciones migran fuera, el modelo no funciona.

*Mitigación parcial*: Los datos de contacto no se comparten hasta que hay transacción pagada en plataforma. El escrow y la protección solo funcionan dentro de REstock. Pero siendo honestos: si dos negocios locales se conocen, es imposible impedir que se salten la plataforma. La defensa real es que el coste de la comisión (8-12%) sea menor que el valor del servicio (verificación + protección + comodidad). Si no lo es, el modelo tiene un problema de pricing, no de tecnología.

**Riesgo 4: Categorías que destruyen confianza**

Si REstock permite cualquier categoría de producto y un comprador recibe un lote de cosmética caducada o electrónica que no funciona, una sola experiencia mala en una categoría de riesgo destruye la confianza en toda la plataforma.

*Mitigación*: Restringir categorías en fase 0-1 a las de menor riesgo: ropa, calzado, hogar, juguetes, librería. No aceptar electrónica, cosmética ni alimentación hasta tener el sistema de verificación maduro. Cada categoría nueva se abre con protocolo de verificación específico, no genérico.

**Riesgo 5: Volumen insuficiente para entrenar IA**

Si REstock no alcanza las 1.000+ transacciones verificadas, los modelos de IA de la fase 3 no tienen datos suficientes para ser útiles. Te quedas atrapado en verificación manual indefinidamente.

*Mitigación*: Aceptar que la IA es fase 3, no fase 1. Diseñar el sistema manual de fase 0-1 para que capture datos estructurados (categoría, fotos etiquetadas, resultado de disputa) que alimentarán los modelos futuros. Cada revisión manual es un dato de entrenamiento si se captura bien.

---

## Hoja de Ruta de Implementación

| Fase | Sistema de verificación | Inversión |
|---|---|---|
| **Fase 0** (0-50 transacciones) | Categoría A/B/C/D + 3 fotos obligatorias + revisión manual de todo por Jorge + escrow básico con Stripe | 0€ (tiempo del fundador) |
| **Fase 1** (50-200 transacciones) | + Detección de fotos genéricas (pHash) + Trust Score v1 (ratio disputas + antigüedad) + ventana de inspección 48h | ~50-100€/mes (API costs) |
| **Fase 2** (200-1.000 transacciones) | + Google Vision para coherencia foto-categoría + operador part-time para revisión + red de 3-5 verificadores locales freelance | ~600-800€/mes |
| **Fase 3** (1.000+ transacciones) | + Modelo propio de clasificación + NLP para descripciones + Trust Score v2 con señales avanzadas + seguro de transacción | ~1.500-2.500€/mes |

---

*La verificación no es un departamento. Es el producto. Si REstock verifica mejor que nadie, todo lo demás — adquisición, retención, pricing power — se resuelve solo.*
