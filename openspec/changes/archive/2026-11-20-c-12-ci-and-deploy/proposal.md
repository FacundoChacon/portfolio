# Proposal

## Why

El sitio ya está en producción (Vercel, `www.facucode.dev`, deploy automático al pushear a `main`), pero el cierre del roadmap quedó pendiente: el CI solo corre `lint` + `build` (no ejecuta `verify:catalog`, `verify:testimonials` ni los tests de `node:test`), producción responde sin cabeceras de seguridad (solo HSTS por defecto de Vercel: falta CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y protección contra *framing*), `/sitemap.xml` devuelve el `index.html` de la SPA porque no existe un sitemap, y la documentación (KB, `CHANGES.md`, `.env.example`) sigue describiendo el sistema de precios eliminado el 2026-10-12 y preguntas abiertas que ya están resueltas. C-12 es el último change del roadmap: deja el pipeline como gate real, endurece la entrega HTTP y alinea la documentación con lo que efectivamente corre.

## What Changes

- **CI**: el workflow `.github/workflows/ci.yml` ejecuta `npm run ci` (lint + `verify:catalog` + `verify:testimonials` + `verify:deploy` + tests + build) en lugar de pasos separados de lint/build; mantiene las verificaciones de artefactos (`index.html`, `og:image` absoluto, assets públicos) y suma: el build emite el chunk diferido del configurador (`dist/assets/Configurador-*.js`), `dist/index.html` no lo referencia y `dist/sitemap.xml` existe. Se conservan las acciones pineadas por SHA y `permissions: contents: read`.
- **Cabeceras de seguridad** en `vercel.json` para todas las rutas: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (cámara, micrófono, geolocalización, pagos y USB deshabilitados), `X-Frame-Options: DENY` y una `Content-Security-Policy` calculada a partir de lo que el sitio carga realmente (`self`, Google Fonts, `connect-src` hacia `script.google.com` y `script.googleusercontent.com` para el envío del lead y su redirección). La CSP se despliega primero como `Content-Security-Policy-Report-Only`, se verifica en navegador real sin violaciones y se pasa a modo *enforcing* dentro del mismo change.
- **Verificación repetible de la configuración de deploy**: módulo puro `scripts/lib/deploy-config.mjs` (validación de `vercel.json`, de la CSP, del sitemap y de `robots.txt`) con tests `node:test`, y script `scripts/verify-deploy.mjs` expuesto como `npm run verify:deploy` e incluido en `npm run ci`.
- **Indexación**: nuevo `public/sitemap.xml` con solo `https://www.facucode.dev/` (`/configurador` se excluye: comparte canonical con la home); `public/robots.txt` agrega `Sitemap: https://www.facucode.dev/sitemap.xml`.
- **`.env.example`**: documenta `VITE_WEBHOOK_URL`, `VITE_WHATSAPP_NUMBER` (formato internacional sin `+`, `549…`) y `VITE_CONTACT_EMAIL` con comentarios y sin valores reales; elimina variables obsoletas.
- **Documentación**: KB sin precios vigentes (lo derogado queda marcado como histórico), P-01 cerrada por obsoleta, P-02/P-03/P-07 cerradas con las decisiones tomadas, `knowledge-base/README.md` actualizado; `CHANGES.md` con "Cómo usar" apuntando a `npm run ci`, bloqueantes externos y checklist de deploy actualizados, nota de los ajustes post-C-10 (fix-reintento-envio, webhook `text/plain` + timeout, rewrite de Vercel, WhatsApp) y C-12 marcado como completado al archivar.

Fuera de alcance: actualización de dependencias, integración del PDF al envío, nuevas funcionalidades, cambios en el Apps Script.

## Capabilities

### New Capabilities
- `integracion-continua`: el pipeline de CI como gate de calidad del repositorio (qué se ejecuta, qué artefactos del build se verifican y con qué permisos y pineo corre).
- `cabeceras-de-seguridad`: las cabeceras HTTP de seguridad con las que el hosting sirve todas las respuestas del sitio, incluida la política de contenido (CSP) y su verificación.
- `indexacion-del-sitio`: lo que el sitio expone a buscadores (`robots.txt`, `sitemap.xml`) y que esos archivos se sirven como estáticos y no como la SPA.

### Modified Capabilities
<!-- Ninguna: el fallback SPA (`navegacion-del-sitio`) ya está aplicado en `vercel.json` y no cambia; las specs del configurador no cambian de comportamiento. -->

## Impact

- **Archivos**: `.github/workflows/ci.yml`, `vercel.json`, `package.json` (script `verify:deploy` y `ci`), `public/robots.txt`, `public/sitemap.xml` (nuevo), `scripts/lib/deploy-config.mjs` (nuevo), `scripts/deploy-config.test.mjs` (nuevo), `scripts/verify-deploy.mjs` (nuevo), `.env.example`, `knowledge-base/*.md`, `CHANGES.md`.
- **Producción**: las cabeceras afectan a todas las respuestas de Vercel (también a los *preview deployments*). Una CSP mal calculada puede romper fuentes o el envío del lead: por eso el rollout es Report-Only → verificación → enforcing. El deploy requiere push a `main` (autorización del usuario).
- **Restricción futura**: si se integra el PDF al envío, `@react-pdf/renderer` compila WebAssembly (yoga-layout) y la CSP necesitará `'wasm-unsafe-eval'` en `script-src`; queda documentado en la KB.
- **Dependencias**: ninguna nueva.
- **Governance**: MEDIO (cabeceras con checkpoints antes de pasar la CSP a enforcing).
