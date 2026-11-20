# Tasks

> Strict TDD: cada tarea de lógica sigue RED → GREEN → TRIANGULATE → REFACTOR con `node:test` (`npm run test`). Safety net: antes de tocar archivos existentes, correr sus tests y registrar el baseline.

## 1. Fuente única de metadatos por ruta (`src/data/seo.js`)

- [x] 1.1 RED: crear `scripts/seo.test.mjs` con tests que importan `src/data/seo.js` (aún inexistente): `ROUTES` contiene `/` y `/configurador`; `canonicalUrl('/')` = `https://www.facucode.dev/` y `canonicalUrl('/configurador')` = `https://www.facucode.dev/configurador`. Verificar que `npm run test` falla por el módulo faltante.
- [x] 1.2 GREEN + TRIANGULATE: implementar `src/data/seo.js` (`SITE_URL`, `OG_IMAGE`, `ROUTES`, `canonicalUrl`) con los textos de la home actuales y el copy del configurador de design.md D9 (copy confirmado por Facundo); sumar tests de reglas: título ≤ 60, descripción ≤ 155 (incluye `social*`), paths únicos, títulos y canonical distintos entre rutas, `OG_IMAGE` absoluta. Verificar `npm run test` verde.
- [x] 1.3 RED → GREEN → TRIANGULATE `resolveRouteMeta(pathname)`: `/configurador` y `/configurador/` → meta del configurador; `/` → home; `/foo` → home; los `social*` faltantes caen en `title`/`description`. Verificar `npm run test` verde.

## 2. Núcleo puro de transformación del HTML (`scripts/lib/route-html.mjs`)

- [x] 2.1 RED: crear `scripts/route-html.test.mjs` con una plantilla mínima de fixture que contenga todas las etiquetas gestionadas y un test de `renderRouteHtml(html, meta)` que espera title, description, canonical, `og:url`/`og:title`/`og:description`/`og:image` y `twitter:card`/`title`/`description`/`image` con los valores del configurador. Verificar que falla.
- [x] 2.2 GREEN + TRIANGULATE: implementar `renderRouteHtml` con la tabla de etiquetas de design.md D4; casos: meta de la home vs del configurador, orden de atributos distinto, scripts y links de assets intactos, idempotencia (aplicar dos veces = una). Verificar `npm run test` verde.
- [x] 2.3 RED → GREEN: errores fuertes — plantilla sin `link rel="canonical"` lanza un error que nombra `canonical`; `meta name="description"` duplicada lanza un error que nombra la etiqueta; triangular con otra etiqueta faltante (`twitter:card`). Verificar `npm run test` verde.
- [x] 2.4 RED → GREEN: escape de `& " < >` en title y description (el HTML resultante contiene `&amp;`, `&quot;`, `&lt;`, `&gt;` y `extractHeadMeta` devuelve el texto original). Verificar `npm run test` verde.
- [x] 2.5 RED → GREEN → TRIANGULATE `extractHeadMeta(html)` (title, canonical, og:url, og:image, twitter:card, twitter:image, scripts inline / atributos `on*`) y `routeOutputFile(path)` (`/` → `index.html`, `/configurador` y `/configurador/` → `configurador/index.html`). REFACTOR con tests verdes.

## 3. Plantilla `index.html`

- [x] 3.1 RED: test en `scripts/route-html.test.mjs` que lee `index.html` del repo y comprueba que `renderRouteHtml` funciona para cada ruta de `ROUTES` (hoy falla: faltan las etiquetas `twitter:*`).
- [x] 3.2 GREEN: agregar a `index.html` `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description` y `twitter:image` con los valores de la home. Verificar `npm run test` verde y que `npm run dev` sigue levantando la home.

## 4. Generación de los HTML por ruta en el build

- [x] 4.1 Agregar a `vite.config.js` un plugin local (`apply: 'build'`, hook `closeBundle`, resolviendo `outDir` en `configResolved`) que lee `<outDir>/index.html` y escribe, para cada ruta de `ROUTES`, `<outDir>/<routeOutputFile(path)>` con `renderRouteHtml` (incluida la reescritura de `dist/index.html` para la home). Verificar con `npm run build`: existe `dist/configurador/index.html` con canonical `https://www.facucode.dev/configurador`, `dist/index.html` conserva canonical de la home y sigue sin contener `Configurador-`, y ninguno tiene `<script>` sin `src`.
- [x] 4.2 Verificar el fallo fuerte: quitar temporalmente una etiqueta gestionada de `index.html`, correr `npm run build` y confirmar que termina con error que la nombra; restaurar la plantilla y confirmar build verde.

## 5. Sincronización de metadatos en la navegación del cliente

- [x] 5.1 RED: crear `scripts/route-meta-sync.test.mjs` con un documento falso (`title` + `querySelector` sobre un mapa de elementos) y tests de `applyRouteMeta(doc, meta)`: actualiza `title`, `content` de la description y `href` del canonical. Verificar que falla.
- [x] 5.2 GREEN + TRIANGULATE: implementar `applyRouteMeta` (en `src/utils/routeMeta.js` o junto a `seo.js`); casos: home → configurador → home, y documento sin canonical (no lanza ni crea elementos). Verificar `npm run test` verde.
- [x] 5.3 Crear `src/hooks/useRouteMeta.js` (`useLocation` + `useEffect` → `applyRouteMeta(document, resolveRouteMeta(pathname))`) y montarlo una vez en `src/App.jsx`. Verificar `npm run lint` verde y, en `npm run dev`, que el título de la pestaña cambia al usar el CTA "Armá tu web" y al volver a la home, y que `/foo` termina con la metadata de la home.

## 6. Sitemap e indexación

- [x] 6.1 Safety net: correr `npm run test` y registrar el baseline de `scripts/deploy-config.test.mjs`.
- [x] 6.2 RED: actualizar `scripts/deploy-config.test.mjs` — el conjunto esperado pasa a ser home + configurador (derivado de `ROUTES`): sitemap con ambas URLs es válido; sitemap solo con la home reporta "falta … /configurador"; se reemplaza el test "/configurador listado es inesperado". Verificar que `npm run verify:deploy` falla con el `public/sitemap.xml` actual una vez actualizado `PUBLIC_PAGES`.
- [x] 6.3 GREEN: derivar `PUBLIC_PAGES` en `scripts/verify-deploy.mjs` de `ROUTES` + `canonicalUrl`, y agregar `https://www.facucode.dev/configurador` a `public/sitemap.xml`. Verificar `npm run verify:deploy` y `npm run test` verdes.

## 7. Verificación del build

- [x] 7.1 RED: tests de `checkBuiltPages(pages)` en `scripts/deploy-config.test.mjs`: caso válido (home + configurador) sin errores; HTML faltante nombra URL y archivo esperado; canonical u `og:url` distinto nombra URL y valor encontrado. Verificar que fallan.
- [x] 7.2 GREEN + TRIANGULATE: implementar `checkBuiltPages` en `scripts/lib/deploy-config.mjs` reutilizando `extractHeadMeta`; sumar casos: `og:image`/`twitter:image` relativas, `twitter:card` ausente, `<script>` inline o atributo `on*`, asset con ruta relativa. Verificar `npm run test` verde.
- [x] 7.3 Crear `scripts/verify-build.mjs` (lee `dist/sitemap.xml`, mapea cada `<loc>` con `routeOutputFile`, corre `checkBuiltPages`, sale con código 1 ante errores), agregar `"verify:build"` a `package.json` y encadenarlo al final de `"ci"` (`… && npm run build && npm run verify:build`). Verificar `npm run ci` verde.
- [x] 7.4 Verificar que el gate se pone en rojo: borrar `dist/configurador/index.html` tras un build y correr `npm run verify:build` → falla nombrando `/configurador`; reconstruir y confirmar verde.
- [x] 7.5 En `.github/workflows/ci.yml`, sumar `configurador/index.html` a la lista de archivos exigidos en `dist/` (mensaje que nombra el archivo) manteniendo los chequeos existentes (chunk `Configurador-*.js`, `dist/index.html` sin `Configurador-`, `og:image` absoluta). Verificar que el YAML sigue con acciones pineadas por SHA y `contents: read`.

## 8. Documentación

- [x] 8.1 Actualizar `knowledge-base/08_arquitectura_propuesta.md` (HTML por ruta generado en el build, fuente única `src/data/seo.js`, `verify:build`) y la línea de `knowledge-base/10_preguntas_abiertas.md` sobre el filesystem antes del rewrite (ahora también `configurador/index.html`); actualizar el checklist de deploy de `CHANGES.md` (sitemap con ambas URLs + verificación de metadatos de `/configurador`). Verificar que los textos citan rutas y comandos existentes.

## 9. Integración y verificación final

- [x] 9.1 Correr `npm run ci` completo en limpio (lint, verificaciones, tests, build, `verify:build`) y confirmar verde.
- [x] 9.2 (Orquestador, tras el deploy a producción) Ejecutar la verificación D8 de design.md: `curl` de `/configurador` (200 sin redirección, título/canonical/`og:*`/`twitter:*` del configurador), `/` (metadata de la home), `/configurador/` (canonical sin barra), `/foo` (fallback SPA), `/sitemap.xml` (ambas URLs), cabeceras/CSP con `curl -I`, y recorrido Playwright con `?v=<timestamp>` sin violaciones de CSP y con `document.title` sincronizado. Si `/configurador` devuelve la metadata de la home, aplicar el plan B de D1. _(pendiente: orquestador, tras el deploy)_ — _Hecho (commit 249bc2b): /configurador y /configurador/ → 200 sin redirect con title, canonical y og:url propios; / y /foo con meta de la home; twitter:card en todas; CSP enforcing y X-Frame-Options en /configurador; sitemap con las 2 URLs; Playwright con cache-busting: h1 del configurador, título sigue a la ruta en navegación SPA (ida y vuelta), 1 solo canonical, 0 violaciones de CSP, 0 errores. Plan B no necesario._
- 9.3 (nota, fuera del repo) (Manual, Facundo — fuera del repo, opcional) Confirmar el copy de D9; enviar el sitemap y pedir la inspección de `https://www.facucode.dev/configurador` en Google Search Console; refrescar la preview en LinkedIn Post Inspector / Facebook Sharing Debugger. _(pendiente: manual del usuario)_ — _Copy confirmado por Facundo. Envío del sitemap a Search Console y refresco de previews: acción opcional del usuario, no bloquea el cierre._
