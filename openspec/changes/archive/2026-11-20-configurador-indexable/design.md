# Design

## Context

Ver `proposal.md` (Why). Estado actual relevante:

- SPA React 18 + Vite 5 con un único `index.html` (título, description, `canonical` = home, `og:*` completos con `og:image` absoluta; **sin** `twitter:*`). Rutas: `/` (Home), `/configurador` (página lazy `src/pages/Configurador.jsx`), `*` → `<Navigate to="/" />`.
- Hosting Vercel. `vercel.json`: rewrite SPA `/(.*)` → `/index.html`, cabeceras globales y CSP enforcing (`script-src 'self'`, sin inline). Vercel resuelve primero el filesystem y después los rewrites (ya comprobado en C-12 con `robots.txt`/`sitemap.xml`). `trailingSlash` y `cleanUrls` no están definidos (defaults).
- Verificación: `scripts/verify-deploy.mjs` (corre **antes** del build dentro de `npm run ci`) valida `vercel.json`, `public/sitemap.xml` (contra `PUBLIC_PAGES = [home]`) y `robots.txt` con validadores puros de `scripts/lib/deploy-config.mjs`. El workflow de CI verifica artefactos de `dist/` con `grep` (incluido que `dist/index.html` no referencie el chunk `Configurador-`).
- Tests con `node:test` en `scripts/**/*.test.mjs`; ya importan módulos ESM de `src/` (p. ej. `src/utils/summary.js`). Sin DOM en los tests.
- Vite usa `base: '/'` (default): los assets del HTML se referencian con rutas absolutas (`/assets/...`), por lo que un HTML ubicado en un subdirectorio de `dist/` los resuelve igual.

## Goals / Non-Goals

**Goals:**
- Un HTML estático por página pública, generado en el build a partir del `dist/index.html` de Vite, con metadatos propios; mismos assets.
- Una sola fuente de verdad de los metadatos por ruta, consumida por el build, por la verificación y por el cliente.
- Que el build y la verificación fallen fuerte ante metadatos incompletos o inconsistentes con el sitemap.

**Non-Goals:**
- Prerender del contenido de la página (el `<body>` sigue siendo `<div id="root">`): Google renderiza JS; los scrapers solo necesitan el `<head>`.
- Cambiar la CSP, el rewrite SPA o cualquier otra cabecera.
- Precargar (`modulepreload`) el chunk del configurador desde su HTML: posible mejora de rendimiento futura, no necesaria para indexación.
- JSON-LD / datos estructurados (necesitaría un archivo externo o un hash en la CSP): idea futura.

## Decisions

### D1. Ruta de salida: `dist/configurador/index.html` (sin tocar `vercel.json`)

Evidencia (docs oficiales de Vercel, `vercel.json` → `trailingSlash`): con el valor por defecto (`undefined`) "visiting a path with or without a trailing slash will not redirect… both `/about` and `/about/` will serve the same content without redirecting". Sumado a que Vercel sirve el filesystem antes de los rewrites, `GET /configurador` y `GET /configurador/` devuelven `configurador/index.html` con 200 y sin redirección; el rewrite SPA sigue cubriendo las rutas sin archivo (`/foo`).

Alternativa considerada: `dist/configurador.html` + `"cleanUrls": true`. Está documentado explícitamente ("a static file named `about.html` will be served when visiting the `/about` path"), pero (a) cambia el ruteo global (308 de cualquier `*.html` a la ruta sin extensión, incluido `/index.html` → `/`, y hay que confirmar su interacción con el destino `/index.html` del rewrite SPA), (b) `/configurador/` no matchearía el archivo y caería en el rewrite → HTML de la home con canonical de la home, y (c) obliga a tocar `vercel.json` y su validador. Queda como **plan B** si la verificación en producción (D8) muestra que `/configurador` no sirve el HTML propio. El mapeo URL → archivo vive en una sola función (`routeOutputFile`) para que el cambio de plan sea local.

`/configurador/` (barra final) sirve el mismo documento, cuyo canonical es `https://www.facucode.dev/configurador`: Google consolida en la URL sin barra. React Router v7 ya matchea `/configurador/` con la ruta `/configurador`.

### D2. Generación dentro del build de Vite (plugin `closeBundle`), no como paso suelto de npm

Un plugin local en `vite.config.js` (`apply: 'build'`, hook `closeBundle`) lee `<outDir>/index.html` ya emitido por Vite y, para **cada** ruta de la fuente única (D3), escribe `<outDir>/<routeOutputFile(path)>` con `renderRouteHtml(template, meta)`. Reescribe también `dist/index.html` con los metadatos de la home, de modo que el HTML publicado siempre sale de la fuente única.

Alternativa considerada (sugerida inicialmente): `scripts/prerender-meta.mjs` encadenado en `"build": "vite build && node scripts/prerender-meta.mjs"`. Funciona si Vercel usa el script `build` de `package.json` (es lo que hace por defecto cuando existe), pero un override del Build Command en el dashboard o un `vite build` directo lo saltearían en silencio y publicarían `/configurador` con la metadata de la home. El plugin corre con cualquier forma de invocar el build. La lógica sigue siendo la misma y pura (D4); el plugin solo hace I/O. Si en el apply el plugin resultara problemático, el script post-build es un reemplazo directo con el mismo núcleo.

### D3. Fuente única de metadatos: `src/data/seo.js`

Módulo ESM sin dependencias (importable desde el cliente, desde `vite.config.js` y desde los scripts/tests de Node):

- `SITE_URL = 'https://www.facucode.dev'`, `OG_IMAGE = 'https://www.facucode.dev/og-image.png'`.
- `ROUTES`: lista de `{ path, title, description, socialTitle?, socialDescription? }` para `/` y `/configurador` (los `social*` caen en `title`/`description` si faltan; la home conserva sus textos actuales, que hoy difieren entre `description` y `og:description`).
- `canonicalUrl(path)` (home → `https://www.facucode.dev/`, resto sin barra final).
- `resolveRouteMeta(pathname)`: normaliza la barra final y devuelve la meta de la ruta, o la de la home para rutas desconocidas.
- `PUBLIC_PAGES` para la verificación se deriva de `ROUTES` (deja de estar hardcodeado en `verify-deploy.mjs`).

Alternativa: `scripts/lib/route-meta.mjs`. Se descarta porque el cliente no debería importar desde `scripts/`.

### D4. Núcleo puro de transformación: `scripts/lib/route-html.mjs`

- `renderRouteHtml(html, meta) → string`: reemplaza el valor de cada etiqueta gestionada — `<title>`, `meta[name=description]`, `link[rel=canonical]`, `og:url`, `og:title`, `og:description`, `og:image`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` — mediante una tabla de etiquetas (selector por `name`/`property`/`rel` + atributo a reemplazar), tolerante al orden de atributos. Exige **exactamente una** coincidencia por etiqueta: si falta o está repetida, lanza un `Error` que nombra la etiqueta (así falla el build). Escapa `& " < >` en los valores. No toca nada fuera de esas etiquetas (scripts, links de assets, CSP-safe por construcción).
- `extractHeadMeta(html)`: lectura inversa para la verificación (canonical, og:url, og:image, twitter:card, title, presencia de scripts inline).
- `routeOutputFile(path)`: `/` → `index.html`, `/configurador` → `configurador/index.html` (punto único de cambio para el plan B de D1).

Se descarta un parser HTML (dependencia nueva) y el reemplazo "por plantilla con placeholders" (dejaría `index.html` inválido en `npm run dev`). Regex acotadas a etiquetas propias y estables son suficientes y, con la regla de "exactamente una", fallan fuerte ante cambios de la plantilla.

### D5. Plantilla `index.html`

Se agregan `twitter:card`, `twitter:title`, `twitter:description` y `twitter:image` con los valores de la home, para que la plantilla contenga todas las etiquetas gestionadas (y `npm run dev` muestre algo coherente). Un test comprueba que la plantilla fuente acepta `renderRouteHtml` para todas las rutas.

### D6. Sincronización en el cliente

- `applyRouteMeta(doc, meta)` (puro respecto del DOM real: recibe un objeto con `title` y `querySelector`) actualiza `doc.title`, el `content` de la meta description y el `href` del canonical; si un elemento no existe no lo crea (el HTML servido siempre los trae). Testeable en `node:test` con un documento falso.
- Hook `useRouteMeta()` en `src/hooks/` que, con `useLocation().pathname`, ejecuta en un `useEffect` `applyRouteMeta(document, resolveRouteMeta(pathname))`. Se monta una sola vez en `App.jsx`. Sin scripts inline, sin dependencias nuevas (no `react-helmet`).
- No se sincronizan `og:*`/`twitter:*` en el cliente: los scrapers no ejecutan JS, sería código sin efecto.

### D7. Sitemap y verificación

- `public/sitemap.xml` lista `https://www.facucode.dev/` y `https://www.facucode.dev/configurador` (sin `lastmod`, como hoy). `checkSitemap` no cambia de firma; cambia su conjunto esperado (`PUBLIC_PAGES` derivado de `ROUTES`) y los tests que fijaban "solo la home".
- Nuevo validador puro `checkBuiltPages(pages)` en `scripts/lib/deploy-config.mjs`: recibe `[{ url, file, html | null }]` y reporta, nombrando URL y archivo: HTML faltante, `canonical` u `og:url` ≠ URL, `og:image`/`twitter:image` no absolutas, `twitter:card` ausente, `<script>` sin `src` o atributos `on*`, assets con ruta relativa (protege la suposición de `base: '/'`).
- Nuevo CLI `scripts/verify-build.mjs` (`npm run verify:build`): lee `dist/sitemap.xml`, mapea cada `<loc>` con `routeOutputFile` y ejecuta `checkBuiltPages`. `ci` pasa a terminar en `… && npm run build && npm run verify:build`.
- `.github/workflows/ci.yml`: se suma `configurador/index.html` a la lista de archivos exigidos en `dist/` y se mantiene la comprobación de que `dist/index.html` no referencia `Configurador-` (el HTML del configurador hereda los mismos assets que la home).

### D8. Verificación en producción (la hace el orquestador tras el deploy)

1. `curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.facucode.dev/configurador` → `200` sin redirección.
2. `curl -sS https://www.facucode.dev/configurador | grep -E "<title>|canonical|og:(url|title|description)|twitter:"` → valores del configurador; ídem `/` → valores de la home.
3. `/configurador/` → 200 (o 308 a `/configurador`) con canonical `https://www.facucode.dev/configurador`; `/foo` → HTML de la home (fallback SPA).
4. `/sitemap.xml` lista ambas URLs; `curl -I` confirma que las cabeceras de seguridad y la CSP siguen en `/configurador`.
5. Playwright con query de cache-busting (`?v=<timestamp>`): abrir `/configurador` directo y navegar home ↔ configurador; 0 violaciones de CSP en consola y `document.title` cambia según la ruta.

Si el paso 1–2 devuelve los metadatos de la home: aplicar el plan B de D1 (`configurador.html` + `cleanUrls`) en un fix acotado.

### D9. Copy (es-AR, primera persona) — **confirmado por Facundo**

| Ruta | Campo | Texto |
|---|---|---|
| `/configurador` | title / og:title / twitter:title | Armá tu presupuesto web \| Facundo Chacón (40 caracteres) |
| `/configurador` | description / og:description / twitter:description | Elegí el tipo de sitio, sumá extras y pedime un presupuesto para tu página web. Te respondo por email. (≈102 caracteres) |
| `/` | title / og:title / twitter:title | sin cambios: "Facundo Chacón \| Desarrollador Full Stack Java / React" |
| `/` | description | sin cambios |
| `/` | og:description / twitter:description | sin cambios (texto actual de `og:description`) |
| ambas | og:image / twitter:image | `https://www.facucode.dev/og-image.png` (sin imagen nueva) |

## Risks / Trade-offs

- [Vercel no resuelve `/configurador` → `configurador/index.html` sin barra final] → Verificación D8 inmediata tras el deploy; plan B documentado (D1) con cambio localizado en `routeOutputFile` + `vercel.json`. El fallo no rompe nada: el visitante sigue viendo el configurador (fallback SPA), solo se pierde la metadata propia.
- [El build de Vercel no ejecuta la generación] → El plugin de Vite corre con cualquier comando de build (D2); D8 lo detecta igual.
- [Deriva entre `index.html` fuente y la fuente única] → El build reescribe también `dist/index.html` desde `ROUTES`; test de que la plantilla tiene cada etiqueta exactamente una vez.
- [Contenido duplicado `/configurador` vs `/configurador/`] → Mismo canonical sin barra en ambas.
- [Previews cacheadas en WhatsApp/LinkedIn/Facebook] → Paso manual opcional del dueño: LinkedIn Post Inspector / Facebook Sharing Debugger para refrescar.
- [Google tarda en reindexar] → Paso manual opcional: enviar el sitemap y pedir la inspección de `/configurador` en Google Search Console (fuera del repo).
- [Regex frágiles ante reformateos de la plantilla] → La regla "exactamente una coincidencia" convierte cualquier deriva en un build rojo, no en metadata silenciosamente vieja.
- [En `npm run dev`, abrir `/configurador` directo muestra la metadata de la home hasta que monta el hook] → Solo afecta al entorno local; el hook la corrige al montar.

## Migration Plan

1. Merge a `main` → deploy automático de Vercel.
2. Verificación D8 (orquestador).
3. Opcional/manual (Facundo): Search Console (sitemap + inspección de URL) y refresco de previews en LinkedIn/Facebook.
4. Rollback: revertir el commit (el sitemap vuelve a listar solo la home y desaparece `dist/configurador/index.html`; el rewrite SPA vuelve a cubrir `/configurador`). No hay datos ni configuración de hosting que migrar.

## Open Questions

- Ninguna: el copy del configurador (D9) fue confirmado por Facundo.
