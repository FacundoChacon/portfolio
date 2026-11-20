# Proposal

## Why

`https://www.facucode.dev/configurador` hoy no es indexable ni compartible: la SPA sirve el mismo `index.html` para todas las rutas, así que Google ve el `<link rel="canonical">` de la home y lo trata como duplicado, y los scrapers de previews (WhatsApp, LinkedIn, Facebook, X), que no ejecutan JavaScript, muestran el título y la descripción del portfolio en vez de los del configurador. Por eso en C-12 se sacó `/configurador` del sitemap. El configurador es la página que convierte visitas en pedidos de presupuesto: tiene que poder encontrarse en Google y compartirse con una preview correcta.

## What Changes

- Cada página pública (`/` y `/configurador`) pasa a tener **su propio documento HTML estático generado en el build**, con `<title>`, meta description, `canonical` = su propia URL, `og:url`/`og:title`/`og:description` y etiquetas `twitter:*` propias. Mismo JS/CSS de la app, sin scripts inline (la CSP no cambia).
- Los metadatos por ruta se declaran **en un único lugar** del código y se reutilizan en el build y en el cliente.
- La home suma etiquetas `twitter:*` (hoy no tiene).
- Al navegar dentro de la SPA (home ↔ configurador) el **título de la pestaña, la description y el canonical se actualizan** según la ruta.
- **`sitemap.xml` vuelve a listar `https://www.facucode.dev/configurador`** junto a la home. **BREAKING** respecto del requisito vigente de `indexacion-del-sitio` (que exige "exactamente la home").
- La verificación del repositorio se extiende: además del sitemap en `public/`, después del build se comprueba que cada URL del sitemap tiene su HTML construido con `canonical` y `og:url` iguales a esa URL.
- Copy del configurador (es-AR, primera persona), **confirmado por Facundo**: título "Armá tu presupuesto web | Facundo Chacón" y descripción "Elegí el tipo de sitio, sumá extras y pedime un presupuesto para tu página web. Te respondo por email.". `og:image` reutiliza `/og-image.png`.

Fuera de alcance: SSR o migración a un framework, imágenes OG nuevas, datos estructurados (JSON-LD queda como idea futura: requeriría un archivo externo o un hash en la CSP), y el alta del sitemap en Google Search Console (paso manual del dueño, fuera del repo).

## Capabilities

### New Capabilities
- `metadatos-por-ruta`: metadatos de cada página pública (título, descripción, canonical, Open Graph y Twitter) disponibles sin ejecutar JavaScript en el HTML que sirve el hosting, y sincronizados durante la navegación del lado del cliente.

### Modified Capabilities
- `indexacion-del-sitio`: el sitemap lista la home y el configurador (cada URL listada debe declarar su propio canonical); `/configurador` deja de servirse con el fallback SPA porque tiene su propio HTML.
- `integracion-continua`: la secuencia de `npm run ci` incluye una verificación posterior al build, y la verificación de artefactos exige el HTML de cada página pública con su canonical.

## Impact

- **Código**: `index.html` (etiquetas `twitter:*`), `vite.config.js` (hook de build que genera los HTML por ruta), nuevo módulo de metadatos por ruta en `src/data/`, nuevo núcleo puro de transformación en `scripts/lib/`, `src/App.jsx` (sincronización de metadatos al navegar).
- **Verificación**: `scripts/lib/deploy-config.mjs` y `scripts/verify-deploy.mjs` (PUBLIC_PAGES), nuevo `verify:build`, tests `node:test` nuevos y actualizados (`scripts/deploy-config.test.mjs`), `package.json` (`ci`), `.github/workflows/ci.yml` (verificación de artefactos).
- **Contenido público**: `public/sitemap.xml`.
- **Hosting**: sin cambios en `vercel.json` (Vercel sirve el archivo estático antes del rewrite SPA). Requiere verificación en producción tras el deploy.
- **Sin dependencias nuevas.**
