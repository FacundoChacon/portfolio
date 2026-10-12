# Preguntas Abiertas

## Inconsistencias detectadas

### IN-01 — Precios del prototipo (USD) vs decisión final (ARS)
**Documento A dice**: el prototipo `constructor-de-presupuestos-web` usa USD (web 850, branding 620, etc.).
**Documento B dice**: la decisión DD-03 fija **precios fijos en ARS**.
**Impacto**: los valores del catálogo v1.0 son placeholders; si se publican sin revisar, se muestran precios erróneos.
**Resolución propuesta**: Facundo confirma la tabla de precios ARS antes del deploy (ver P-01).

### IN-02 — "Identidad de marca" vs catálogo de tipos de sitio
**Documento A dice**: el prototipo lista "Identidad de marca" y "Contenido estratégico" como *servicios*.
**Documento B dice**: el catálogo v1.0 define 7 *tipos de sitio*; branding/contenido pasan a **extras**.
**Impacto**: riesgo de duplicar conceptos.
**Resolución propuesta**: mantener tipos de sitio como servicio principal; identidad de marca queda como extra opcional en backlog (ver P-04).

## Preguntas abiertas (priorizadas)

| Prioridad | Pregunta | Bloquea | Decisor |
|-----------|----------|---------|---------|
| Alta (P-01) | ¿Los precios ARS del catálogo v1.0 son los definitivos? ¿Cuáles ajustar? | Deploy / exactitud pública | Facundo |
| Alta (P-02) | ¿Qué proveedor de webhook se usará (n8n self-hosted, n8n cloud, Zapier, Make)? ¿Quién provee la URL? | Integración real | Facundo |
| Alta (P-03) | ¿Cuál es el número de WhatsApp y el email de respaldo? | Modo degradado | Facundo |
| Media (P-04) | ¿"Identidad de marca" debe ser un extra o queda fuera de v1.0? | Catálogo | Facundo |
| Media (P-05) | ¿El auto-reply debe incluir el PDF o solo el email interno? | Flujo externo | Facundo |
| Media (P-06) | ¿Se persiste en Sheets, Notion o Airtable? | Flujo externo | Facundo |
| Media (P-07) | ¿Hosting destino (Vercel/Netlify/otro) y confirmación de fallback SPA? | Deploy | Facundo |
| Baja (P-08) | ¿Se ofrece "Descargar PDF" en la pantalla de éxito además del adjunto? | UX | Facundo |
| Baja (P-09) | ¿Analytics de embudo (ej. Vercel Analytics) para medir conversión? | Métricas | Facundo |
| Baja (P-10) | ¿Se agrega sección "Precios" también en la home (sin entrar al configurador)? | Marketing | Facundo |

## Notas para el roadmap

- **P-01 y P-03** bloquean el deploy pero **no** el desarrollo (se pueden usar placeholders).
- **P-02** es la única dependencia externa dura: sin URL de webhook, la US-008 queda en modo degradado (`mailto:`).
- El desarrollo del configurador puede avanzar en paralelo a la definición del webhook si se usa la abstracción `utils/webhook.js`.
