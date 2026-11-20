# Preguntas Abiertas

## Inconsistencias detectadas

### IN-01 — Precios del prototipo (USD) vs decisión final (ARS) — Cerrada (obsoleta, 2026-10-12)
**Documento A dice**: el prototipo `constructor-de-presupuestos-web` usa USD (web 850, branding 620, etc.).
**Documento B dice**: la decisión DD-03 fija **precios fijos en ARS**.
**Estado**: cerrada por obsoleta. El 2026-10-12 se eliminó el sistema de precios: el configurador no expone importes y el presupuesto se confirma por email. Se conserva el registro por trazabilidad.

### IN-02 — "Identidad de marca" vs catálogo de tipos de sitio
**Documento A dice**: el prototipo lista "Identidad de marca" y "Contenido estratégico" como *servicios*.
**Documento B dice**: el catálogo define 7 *tipos de sitio*; branding/contenido pasan a **extras**.
**Impacto**: riesgo de duplicar conceptos.
**Resolución propuesta**: mantener tipos de sitio como servicio principal; identidad de marca queda como extra opcional en backlog (ver P-04).

## Preguntas abiertas (priorizadas)

| Prioridad | Pregunta | Estado | Decisor |
|-----------|----------|--------|---------|
| Alta (P-01) | ¿Los precios ARS del catálogo v1.0 son los definitivos? ¿Cuáles ajustar? | **Cerrada (obsoleta)**: los precios se eliminaron el 2026-10-12 | Facundo |
| Alta (P-02) | ¿Qué proveedor de webhook se usará? ¿Quién provee la URL? | **Resuelta**: Google Apps Script (hoja "Leads" + email al dueño), con guard v3 (chequeo de `source`), límites de longitud y rate limit de 3/h por email y 30/h global. La URL va en `VITE_WEBHOOK_URL` y sus hosts están fijados en la CSP | Facundo |
| Alta (P-03) | ¿Cuál es el número de WhatsApp y el email de respaldo? | **Resuelta**: WhatsApp `5492615799062` vía `VITE_WHATSAPP_NUMBER`; email de respaldo `chaconfacu2006@gmail.com` como fallback del código si no se define `VITE_CONTACT_EMAIL` | Facundo |
| Media (P-04) | ¿"Identidad de marca" debe ser un extra o queda fuera de v1.0? | Abierta | Facundo |
| Media (P-05) | ¿El auto-reply debe incluir el PDF o solo el email interno? | Abierta (hoy no hay auto-reply ni PDF integrado) | Facundo |
| Media (P-06) | ¿Se persiste en Sheets, Notion o Airtable? | **Resuelta**: Google Sheets (hoja "Leads") vía Apps Script | Facundo |
| Media (P-07) | ¿Hosting destino (Vercel/Netlify/otro) y confirmación de fallback SPA? | **Resuelta**: Vercel; el fallback SPA está aplicado con `rewrites` en `vercel.json` | Facundo |
| Baja (P-08) | ¿Se ofrece "Descargar PDF" en la pantalla de éxito además del adjunto? | Abierta (el PDF no está integrado) | Facundo |
| Baja (P-09) | ¿Analytics de embudo (ej. Vercel Analytics) para medir conversión? | Abierta | Facundo |
| Baja (P-10) | ¿Se agrega sección "Precios" también en la home (sin entrar al configurador)? | Cerrada (obsoleta): no hay precios | Facundo |

### Nota P-07 — Fallback SPA (resuelto)

El sitio usa `BrowserRouter` (URLs limpias). Para que una **recarga directa** de rutas internas como `/configurador` funcione en producción, el hosting reescribe todas las rutas a `/index.html`.

- **Vercel (aplicado)**: `rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]` en `vercel.json`. Vercel resuelve primero el filesystem, por lo que `public/robots.txt`, `public/sitemap.xml` y `dist/configurador/index.html` (HTML propio de `/configurador`, con su canonical) se sirven como archivos y no como la SPA.
- **Local**: `vite preview` ya aplica el fallback (`appType: 'spa'`).
- `npm run verify:deploy` falla en CI si se pierde el rewrite.

## Notas para el roadmap

- Las preguntas bloqueantes (P-01 a P-03 y P-07) están resueltas o cerradas; no queda bloqueante de deploy.
- Pendientes de producto (no bloquean): P-04, P-05, P-08 y P-09.
- Si se cambia de proveedor de webhook o se integra el PDF, hay que actualizar la CSP (ver `08_arquitectura_propuesta.md` §Seguridad).
