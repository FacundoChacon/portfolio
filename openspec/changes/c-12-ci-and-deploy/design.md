# Design

## Context

Ver `proposal.md` (Why). Estado relevado antes de diseñar:

- **Hosting**: Vercel, proyecto `portfolio`, dominio `www.facucode.dev`, deploy automático al pushear a `main`. `vercel.json` solo tiene `rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]`. Vercel resuelve primero el filesystem y después los `rewrites`, así que un `public/sitemap.xml` se sirve como archivo y no como la SPA.
- **Lo que carga el sitio** (relevado en `index.html`, `src/` y `dist/`):
  - Scripts: solo `/assets/index-*.js` y chunks propios (`type="module"`, sin scripts inline en `dist/index.html`). Sin analytics ni scripts de terceros.
  - Estilos: `/assets/index-*.css` y la hoja de Google Fonts (`https://fonts.googleapis.com/css2?...`). Los `style={{...}}` de React se aplican vía CSSOM (`element.style`), que la CSP no bloquea; no hay `<style>` inyectados ni `dangerouslySetInnerHTML`.
  - Fuentes: `https://fonts.gstatic.com` (Inter, JetBrains Mono, Orbitron, Rajdhani). El CSS compilado no tiene `url(...)` propios.
  - Imágenes: todas locales (`/favicon.svg`, `*.webp`).
  - Conexiones: solo `fetch` al webhook (`VITE_WEBHOOK_URL`, Google Apps Script `https://script.google.com/macros/s/…/exec`), que responde 302 a `https://script.googleusercontent.com/...`; la CSP evalúa también el destino de la redirección.
  - Navegación externa: `mailto:`, `https://wa.me/...`, GitHub, LinkedIn y demos de proyectos son enlaces (`<a>`), no cargas: no los regula la CSP.
  - PDF: `@react-pdf/renderer` **no está integrado al envío** (`sendLead(payload, { pdf: null })`); su chunk no entra al build actual. Si se integra, `yoga-layout` compila WebAssembly embebido y requerirá `'wasm-unsafe-eval'`.
- **CI**: `.github/workflows/ci.yml` corre `npm run lint` y `npm run build` + verificación de artefactos en bash; acciones pineadas por SHA y `permissions: contents: read`. `package.json` ya define `ci` = lint + verify:catalog + verify:testimonials + test + build.
- **Tests**: `node --test "scripts/**/*.test.mjs"`, sin dependencias de test. Convención: lógica pura testeable, scripts `verify-*.mjs` que fallan con exit 1.

## Goals / Non-Goals

**Goals:**
- Que un único comando (`npm run ci`) sea el gate local y de CI, incluyendo la configuración de deploy.
- Cabeceras de seguridad con una CSP estricta sin `'unsafe-inline'` en scripts ni estilos, desplegada sin romper producción.
- Verificar la CSP en navegador real **sin generar leads reales**.
- Documentación (KB, `CHANGES.md`, `.env.example`) que describa el sistema vigente.

**Non-Goals:**
- Endpoint de reportes CSP (`report-uri`/`report-to`): no hay backend; las violaciones se observan en la consola durante la verificación.
- `Cross-Origin-Opener-Policy`/`COEP`, `HSTS preload`, quitar el `Access-Control-Allow-Origin: *` por defecto de Vercel (inocuo en un sitio estático público).
- Integrar el PDF, cambiar el Apps Script o actualizar dependencias.

## Decisions

### D1 — CI ejecuta `npm run ci` y conserva la verificación de artefactos en bash

Se reemplazan los pasos `Lint` y `Build` por un paso `Lint + verificaciones + tests + build` que corre `npm run ci`. La verificación de artefactos queda como paso aparte (necesita el `dist/` ya generado) y se extiende con:
- `sitemap.xml` en la lista de assets obligatorios.
- `compgen -G 'dist/assets/Configurador-*.js'` debe encontrar al menos un archivo (`::error::` si no).
- `dist/index.html` no debe contener `Configurador-` (la home no precarga el chunk).

*Alternativa descartada*: mover la verificación de artefactos a un script Node. Funciona, pero el bloque bash existente ya está probado en CI y el cambio es mínimo; se mantiene el estilo. Se renombra el job a `CI` / `name: Lint + verificaciones + tests + build`.

### D2 — Módulo puro + CLI para la configuración de deploy

- `scripts/lib/deploy-config.mjs` (puro, sin I/O): `parseCsp`, `checkCsp`, `checkVercelConfig`, `checkSitemap`, `checkRobots` y las constantes de valores exigidos. Cada `check*` devuelve `{ errors: string[], warnings: string[] }` (o lista de errores) para que el test pueda afirmar mensajes.
- `scripts/deploy-config.test.mjs`: tests `node:test` (entra solo en el glob de `npm test`).
- `scripts/verify-deploy.mjs`: lee `vercel.json`, `public/sitemap.xml` y `public/robots.txt`, imprime advertencias y sale con código 1 si hay errores. Script `verify:deploy` en `package.json`, agregado a `ci` después de `verify:testimonials`.

`scripts/lib/` evita que el módulo se confunda con un script ejecutable y no matchea el glob `*.test.mjs`. *Alternativa descartada*: ponerlo en `src/utils/` — es tooling de build, no código de la app, y no debe entrar al bundle.

Reglas que valida `checkVercelConfig`:
- Existe el rewrite SPA `/(.*)` → `/index.html`.
- Existe un bloque `headers` con `source: "/(.*)"` y las cabeceras exactas: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`; `Permissions-Policy` contiene `camera=()`, `microphone=()`, `geolocation=()`, `payment=()`, `usb=()`.
- CSP en `Content-Security-Policy` (ok) o solo en `Content-Security-Policy-Report-Only` (warning "CSP en modo reporte: no se aplica"); ninguna de las dos → error.
- `checkCsp`: `default-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`; `script-src` sin `'unsafe-inline'`, `'unsafe-eval'`, `*`, `http:`, `https:` ni `data:`; `connect-src` incluye `'self'`, `https://script.google.com`, `https://script.googleusercontent.com` y ningún comodín (`*` o `https://*...`); directivas duplicadas → error.
- `checkSitemap(xml, expected)` (esperado: solo la home): `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`, conjunto de `<loc>` igual al esperado, sin duplicados, todas `https://www.facucode.dev/...`. Parseo con regex (el archivo es nuestro y simple; sin dependencia XML).
- `checkRobots(txt, sitemapUrl)`: contiene `User-agent: *`, `Allow: /` y `Sitemap: <url absoluta>` (comparación por línea, tolerante a `\r\n`).

### D3 — CSP propuesta (borrador)

```
default-src 'self';
script-src 'self';
style-src 'self' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self' https://script.google.com https://script.googleusercontent.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none'
```

- Sin `'unsafe-inline'` en `style-src`: el build no emite `<style>` ni atributos `style` en HTML; React usa CSSOM. Si la verificación Report-Only muestra violaciones de `style-src`, se investiga la causa antes de relajar (y si hay que relajar, se documenta).
- Sin `upgrade-insecure-requests`: se ignora en Report-Only con un warning de consola que ensuciaría la verificación, y HSTS ya fuerza HTTPS.
- `frame-ancestors 'none'` + `X-Frame-Options: DENY`: mientras la CSP está en Report-Only, `frame-ancestors` no se aplica; `X-Frame-Options` protege desde el primer deploy y cubre navegadores viejos.
- El `connect-src` se fija a los hosts de Apps Script (decisión P-02), no a la URL completa: el path `/macros/s/<id>/exec` puede cambiar al redeployar el script sin tocar la CSP. Si se cambia de proveedor de webhook, hay que actualizar la CSP (queda en la KB §Seguridad).
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()` — solo features reconocidas por los navegadores actuales para no generar warnings "Unrecognized feature" en consola.

Todo en un único bloque `headers` con `source: "/(.*)"`, que Vercel aplica también a respuestas reescritas y a archivos estáticos.

### D4 — Rollout: verificación local enforcing → producción Report-Only → producción enforcing

1. **Local (antes de pushear)**: `vite build` con `VITE_WEBHOOK_URL=https://script.google.com/macros/s/TEST/exec` (URL ficticia explícita: imposible crear un lead real) + `vite preview`. Con Playwright, `page.route('**/*')` sobre el documento HTML agrega la CSP **enforcing** leída de `vercel.json` (`route.fetch()` + `route.fulfill` con la cabecera extra). Se recorre home → `/configurador` → pasos hasta revisión → envío con el webhook interceptado.
2. **Deploy 1 (push a `main`)**: cabeceras simples enforcing + CSP como `Content-Security-Policy-Report-Only`. Verificación en producción (`curl -I` + Playwright, ver D5). Cero mensajes `[Report Only]` en consola.
3. **Deploy 2**: se renombra la clave a `Content-Security-Policy` (mismo valor), `verify:deploy` deja de advertir, se re-verifica producción.

*Alternativa descartada*: enforcing directo. El paso local ya da alta confianza, pero producción es la única fuente real de cabeceras de Vercel y el costo de un deploy extra es bajo frente a romper el envío de leads. *Alternativa descartada*: verificar en un *preview deployment* — tienen Deployment Protection (login de Vercel) y `VITE_WEBHOOK_URL` solo está cargada en Production.

### D5 — Cómo se verifica `connect-src` sin crear leads reales

- **Intercepción**: `page.route('https://script.google.com/**', ...)` responde `200` con `{"ok":true}` (JSON) sin que el request salga a Internet. En Chromium la CSP se evalúa en el renderer **antes** de que el request llegue a la capa de red donde actúa `page.route`, así que un `connect-src` incorrecto sigue produciendo la violación aunque el request esté interceptado (Playwright solo omite la CSP con `bypassCSP: true`, que no se usa).
- **Control negativo obligatorio** (en la corrida local): repetir el envío con una CSP inyectada **sin** `https://script.google.com` en `connect-src` y confirmar que aparece la violación en consola y que el handler de la ruta no se invoca. Si el control negativo **no** produce violación, la intercepción no sirve como prueba y se pasa al plan B.
- **Salto de redirección**: se intenta que la ruta de `script.google.com` responda `302` con `Location: https://script.googleusercontent.com/macros/echo?test=1` y una segunda ruta sobre `script.googleusercontent.com` responda `200`. Si la versión de Playwright no sigue redirecciones de `route.fulfill`, el salto queda cubierto por `checkCsp` (unit) y por el plan B.
- **Plan B (opcional, requiere OK del usuario)**: desde la consola de producción (`browser_evaluate`), un `fetch` real `POST text/plain` al webhook con el cuerpo inválido `{"payload":{"contact":{}}}`. El guard v3 del Apps Script lo descarta por `source` (no escribe en la hoja ni envía email); el request sí recorre `script.google.com` → 302 → `script.googleusercontent.com` bajo la CSP de la página. Criterio: sin violaciones CSP en consola (la respuesta puede ser opaca o un error de negocio; no importa).
- Criterio de aceptación de cada corrida: `browser_console_messages` sin mensajes que contengan `Content Security Policy` / `Refused to` / `[Report Only]`, fuentes de Google aplicadas (`document.fonts.check('16px Orbitron')` → `true`) y pantalla de éxito del configurador tras el envío interceptado.

### D6 — Sitemap y robots

`public/sitemap.xml` estático con **solo la home** (`https://www.facucode.dev/`), sin `<lastmod>` (no hay proceso que lo mantenga actualizado; un `lastmod` viejo es peor que ninguno). `robots.txt` conserva `User-agent: *` / `Allow: /` y suma `Sitemap: https://www.facucode.dev/sitemap.xml`. Ambos se validan con `verify:deploy` y se agregan a la verificación de artefactos del CI. `/configurador` queda fuera: la SPA lo sirve con el `canonical` y `og:url` de la home, así que Google lo trataría como duplicado; se incorporará cuando exista metadata por ruta (fuera de alcance).

### D7 — `.env.example`

Se reescribe con las tres variables que el código usa (`VITE_WEBHOOK_URL`, `VITE_WHATSAPP_NUMBER`, `VITE_CONTACT_EMAIL`), comentarios en es-AR y valores de ejemplo ficticios: recordatorio de que `VITE_*` es público, formato de WhatsApp en dígitos internacionales sin `+` (`549` + característica + número), fallback de email si no se define, y que si se cambia de proveedor del webhook hay que actualizar `connect-src`. Se elimina cualquier variable que el código no lea (p. ej. `VITE_WHATSAPP_URL`, `VITE_APP_URL`). Nunca se leen ni copian `.env`/`.env.local`.

### D8 — Alineación de documentación: editar lo vigente, marcar lo derogado

- **KB**: lo que describe el sistema actual se corrige (README, 01 alcance, 02 arquitectura/servicios, 04 entidades y `LeadPayload` alineados con las specs `catalogo-del-configurador` y `webhook-integration`, 07 flujos, 08 patrones/estructura/testing/env vars/seguridad). Las reglas y decisiones de precios (RN-PR, RN-CO, DD-03, DD-04, SU-02, IN-01) **no se borran**: se marcan "Derogada (2026-10-12): el configurador no expone precios" para conservar la trazabilidad con los changes archivados C-03..C-10.
- **10_preguntas_abiertas.md**: P-01 cerrada por obsoleta; P-02 resuelta (Google Apps Script: hoja "Leads" + email, guard v3 con chequeo de `source`, límites de longitud, rate limit 3/h por email y 30/h global); P-03 resuelta (WhatsApp `5492615799062` vía `VITE_WHATSAPP_NUMBER`; email de respaldo `chaconfacu2006@gmail.com` como fallback del código); P-07 resuelta (Vercel + `rewrites`).
- **08 §Seguridad**: cabeceras/CSP vigentes, cómo actualizarlas (cambiar proveedor de webhook → `connect-src`; integrar PDF → `'wasm-unsafe-eval'`).
- **CHANGES.md**: los textos de C-03..C-10 quedan como registro histórico (ya cubiertos por la nota del 2026-10-12); se corrige "Cómo usar" (`npm run ci`), los bloqueantes externos, el scope de C-12 (checklist de deploy sin P-01) y se agrega una nota breve de los ajustes post-C-10 del 2026-11-20. El `[x]` de C-12 se marca al archivar.

## Risks / Trade-offs

- [La CSP bloquea algo no relevado (p. ej. un recurso de una librería en un camino poco usado)] → Report-Only en producción antes de enforcing; recorrido completo del configurador; rollback inmediato revirtiendo `vercel.json` o con *Instant Rollback* de Vercel.
- [Intercepción de Playwright no prueba la CSP si el navegador la evaluara después de la ruta] → control negativo obligatorio (D5); plan B con POST inválido aprobado por el usuario.
- [El POST inválido del plan B consume cuota del rate limit global o genera ruido] → solo con OK explícito, una única vez; el guard rechaza por `source` antes de escribir.
- [Cambiar de proveedor de webhook o integrar el PDF rompe el envío en silencio] → documentado en KB 08 §Seguridad y en `.env.example`; `verify:deploy` exige los hosts actuales, así que un cambio deliberado obliga a tocar el validador y sus tests.
- [Preview deployments de Vercel con la toolbar (`vercel.live`) bloqueada por la CSP] → aceptado: no afecta producción ni la funcionalidad.
- [`X-Frame-Options: DENY` impide embeber el sitio (p. ej. vistas previas en iframes de terceros)] → aceptado: las previews sociales usan `og:image`, no iframes.
- [Documentación extensa por editar] → cambios mínimos y factuales; lo derogado se marca en lugar de reescribirse.

## Migration Plan

1. Implementar y verificar localmente (`npm run ci` + verificación Playwright local, D4.1/D5).
2. Commit + push a `main` (requiere autorización del usuario) → Deploy 1 (CSP Report-Only). Verificar producción.
3. Commit + push del cambio a enforcing → Deploy 2. Re-verificar producción.
4. Rollback: revertir el commit de `vercel.json` (o volver la clave a `-Report-Only`) y pushear; en emergencia, *Instant Rollback* al deployment anterior desde el dashboard de Vercel.

## Decisiones resueltas (2026-11-20)

- **Rollout de la CSP en dos deploys**: Deploy 1 = cabeceras simples enforcing + CSP como `Content-Security-Policy-Report-Only`; Deploy 2 = renombrar la clave a `Content-Security-Policy`. `vercel.json` queda en el estado del Deploy 1.
- **KB y precios**: las reglas y decisiones de precios se marcan "Derogada (2026-10-12)" (se conserva el historial) y se corrige todo lo que describe el sistema vigente.
- **Plan B** (POST inválido real al Apps Script): fuera del alcance del agente de implementación; lo ejecuta el orquestador con OK del usuario.
- **`.env.example`**: el agente no tiene permiso de lectura; la tarea 6.1 queda a decisión del usuario.
- **Intercepción de la redirección**: `route.fulfill` con `302` hacia `script.googleusercontent.com` no quedó interceptado (el navegador siguió la redirección a la red real). La verificación local usa `200` directo sobre `script.google.com`; el salto de la redirección queda cubierto por `checkCsp` (unit) y por el plan B.

### D9 — Resultado de la revisión independiente (2026-11-20)

Cambios aplicados tras la revisión:

- **CSP**: `checkCsp` rechaza esquemas desnudos (`https:`, `http:`, `wss:`, `data:`...) además de `*` y `esquema://*` en `connect-src`; `script-src` suma `blob:` y `'unsafe-hashes'`; `style-src`, `img-src` y `font-src` se validan (sin `'unsafe-inline'`/`'unsafe-eval'`/`'unsafe-hashes'`, comodines ni esquemas desnudos; única excepción: `data:` en `img-src`, que el sitio usa).
- **Cabeceras**: `checkVercelConfig` compara las claves sin distinguir mayúsculas (Vercel lo hace así).
- **Sitemap**: solo la home (ver D6).
- **Aceptado sin cambios**: el rollout Report-Only queda **sin `report-uri`/`report-to`** (no hay endpoint de reportes ni se quiere agregar uno). El riesgo lo cubre el recorrido de producción de la tarea 9.3, que incluye el `ErrorStep`, los enlaces de WhatsApp y `mailto:` y la descarga de `cv.pdf`, revisando la consola en busca de violaciones.
