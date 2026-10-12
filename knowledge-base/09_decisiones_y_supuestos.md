# Decisiones y Supuestos

## Decisiones documentadas

### DD-01 — Sin backend propio: frontend estático + webhook externo
**Decisión**: el configurador corre 100% en el navegador y envía el lead por POST a un webhook (n8n/Zapier/Make).
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

### DD-03 — Precios fijos en ARS
**Decisión**: todos los precios en pesos argentinos, fijos y editables en `data/configurador.js`.
**Contexto**: preferencia del dueño por facturar en moneda local.
**Alternativas consideradas**: USD, rangos "desde", doble moneda.
**Justificación**: simple de entender para el cliente local.
**Trade-offs aceptados**: los precios requieren actualización periódica por inflación (edición de datos + deploy).

### DD-04 — "Sistema a medida" a cotizar
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

### DD-07 — Estética: calculadora modular sobre la base cyber/neón del portfolio
**Decisión**: tomar el patrón de "tarjetas + total siempre visible" del concepto calculadora, con la paleta del portfolio.
**Justificación**: pedido explícito del dueño; combina lo visual del carrito con el flujo guiado del wizard.

## Supuestos inferidos

### SU-01 — Escala y operación
**Supuesto**: sitio de un freelance; pocas decenas de leads/mes; visitantes anónimos.
**Origen**: contexto del proyecto (portfolio personal).
**Riesgo si es falso**: si crece mucho, el webhook free puede tener límites.
**Cómo validar**: medir leads/mes y ajustar el plan del proveedor.

### SU-02 — Precios de referencia provisorios
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
**Supuesto**: Facundo tiene o puede crear una cuenta en n8n/Zapier/Make.
**Riesgo si es falso**: no hay destino para el POST.
**Cómo validar**: crear el webhook antes del deploy (ver `10_preguntas_abiertas.md`).

### SU-05 — Deploy en Vercel o Netlify
**Supuesto**: el hosting soporta SPA fallback nativo.
**Origen**: el `og:image` apunta a `facucode.dev` con CI en GitHub Actions.
**Riesgo si es falso**: `/configurador` daría 404 en recarga directa.
**Cómo validar**: probar recarga directa tras el deploy.
