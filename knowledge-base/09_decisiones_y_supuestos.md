# Decisiones y Supuestos

## Decisiones documentadas

### DD-01 — Sin backend propio: frontend estático + webhook externo
**Decisión**: el configurador corre 100% en el navegador y envía el lead por POST a un webhook (Google Apps Script).
**Contexto**: el portfolio ya es estático (Vite → `dist/`) y no tiene API ni DB.
**Alternativas consideradas**: (a) backend propio Node/Express + DB; (b) backend Java/Spring Boot + MySQL.
**Justificación**: cero costo de infraestructura, sin mantenimiento de servidor, coherente con el CI actual.
**Trade-offs aceptados**: dependencia de un servicio externo; los leads no viven en infra propia.

### DD-02 — Router con fallback SPA
**Decisión**: incorporar `react-router-dom` y exponer `/configurador` como ruta real.
**Contexto**: hoy no hay router; el sitio es single-page con anclas `#`.
**Alternativas consideradas**: hash routing (`#/configurador`), multi-page Vite, modal.
**Justificación**: URLs limpias y patrón estándar; Vercel/Netlify resuelven el fallback por defecto.
**Trade-offs aceptados**: se agrega una dependencia y se debe garantizar el fallback en el hosting.

### DD-03 — Precios fijos en ARS — Derogada (2026-10-12)
**Estado**: Derogada (2026-10-12): el configurador no expone precios; se conserva por trazabilidad con los changes archivados C-03 a C-10.
**Decisión**: todos los precios en pesos argentinos, fijos y editables en `data/configurador.js`.
**Contexto**: preferencia del dueño por facturar en moneda local.
**Alternativas consideradas**: USD, rangos "desde", doble moneda.
**Justificación**: simple de entender para el cliente local.
**Trade-offs aceptados**: los precios requieren actualización periódica por inflación (edición de datos + deploy).

### DD-04 — "Sistema a medida" a cotizar — Derogada (2026-10-12)
**Estado**: Derogada (2026-10-12): el configurador no expone precios; se conserva por trazabilidad con los changes archivados C-03 a C-10.
**Decisión**: el comodín no tiene precio fijo; se muestra "A cotizar" y no suma al total.
**Contexto**: un sistema a medida no puede estimarse con un catálogo fijo.
**Justificación**: evita comprometer un precio incorrecto y fuerza la conversación.
**Trade-offs aceptados**: el lead del comodín no trae cifra; requiere cierre manual.

### DD-05 — Hosting/dominio con disclaimer, sin monto
**Decisión**: el extra Hosting+Dominio es `$0`, solo gestión técnica; el costo monetario es del cliente.
**Contexto**: cuestión de propiedad/titularidad del dominio y la cuenta.
**Justificación**: protege al dueño de cargar costos que no le corresponden.
**Trade-offs aceptados**: hay que ser explícito en el copy y el PDF para evitar malentendidos.

### DD-06 — PDF generado en el cliente
**Decisión**: `@react-pdf/renderer` en el navegador, cargado dinámicamente.
**Alternativas consideradas**: generar el PDF en el webhook/backend.
**Justificación**: sin backend; descarga inmediata; datos personales no salen del navegador hasta el envío.
**Trade-offs aceptados**: bundle extra (lazy) y posible variación de render entre navegadores.

### DD-07 — Estética: Evangelion brutalista (calculadora modular con la paleta eva)
**Decisión**: el sitio y el configurador usan la estética Evangelion: fondo negro, naranja de acento, serif condensada, paneles con etiquetas en mono y texturas hexagonales. El configurador conserva el patrón de "tarjetas + resumen siempre visible" del concepto calculadora.
**Justificación**: pedido explícito del dueño. Reemplaza la base cyber/neón original (rediseño completado y limpiado en `limpieza-cyberpunk`); la estética vieja queda vedada por un guard en los tests.
**Histórico**: la versión original de esta decisión usaba la paleta cyber/neón (verde `#00ffc3` y magenta `#ff6eff`); ya no existe en el código, salvo en el PDF del presupuesto (ver P-11).

### DD-08 — Fuente de cuerpo: pila del sistema
**Decisión**: `font-sans` es la pila de fuentes del sistema operativo (`EVA_FONT_SANS`). Se retiran Orbitron y Rajdhani.
**Alternativas consideradas**: JetBrains Mono para todo (ancho fijo, borra la jerarquía de etiquetas), Noto Serif Display (corte display: se degrada a 14-16 px), Inter o Noto Sans autoalojada (+25-50 KB y un swap en todo el cuerpo).
**Justificación**: 0 KB, sin swap ni CLS, mejor `hinting` a tamaños chicos en cada plataforma y cercana a la Helvetica de la interfaz de NERV. La identidad la dan la serif condensada y la mono.
**Trade-offs aceptados**: la sans varía entre plataformas; se reportaron los cortes de línea distintos al migrar desde Rajdhani (condensada) y se verificaron sin desbordes a 1440 y 375 px.

## Supuestos inferidos

### SU-01 — Escala y operación
**Supuesto**: sitio de un freelance; pocas decenas de leads/mes; visitantes anónimos.
**Origen**: contexto del proyecto (portfolio personal).
**Riesgo si es falso**: si crece mucho, el webhook free puede tener límites.
**Cómo validar**: medir leads/mes y ajustar el plan del proveedor.

### SU-02 — Precios de referencia provisorios — Derogada (2026-10-12)
**Estado**: Derogada (2026-10-12): el configurador no expone precios; se conserva por trazabilidad con los changes archivados C-03 a C-10.
**Supuesto**: los 7 precios de servicio y 8 de extras son **placeholders** plausibles en ARS.
**Origen**: inferidos del prototipo USD de "estudio norte", convertidos a magnitudes ARS.
**Riesgo si es falso**: se muestran precios incorrectos al público.
**Cómo validar**: Facundo confirma/edita cada valor en `data/configurador.js` antes del deploy.

### SU-03 — WhatsApp/email de respaldo
**Supuesto**: hay un número de WhatsApp y email operativos para el modo degradado.
**Origen**: `Contact.jsx` ya expone `chaconfacu2006@gmail.com`.
**Riesgo si es falso**: el fallback no sirve.
**Cómo validar**: confirmar `VITE_WHATSAPP_NUMBER`.

### SU-04 — Proveedor de webhook disponible
**Supuesto**: Facundo puede publicar un Google Apps Script como webhook (cumplido: es el proveedor en uso).
**Riesgo si es falso**: no hay destino para el POST.
**Cómo validar**: crear el webhook antes del deploy (ver `10_preguntas_abiertas.md`).

### SU-05 — Deploy en Vercel
**Supuesto**: el hosting soporta SPA fallback (cumplido: Vercel con `rewrites` en `vercel.json`).
**Origen**: el `og:image` apunta a `facucode.dev` con CI en GitHub Actions.
**Riesgo si es falso**: `/configurador` daría 404 en recarga directa.
**Cómo validar**: probar recarga directa tras el deploy.
