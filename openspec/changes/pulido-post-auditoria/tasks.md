# Tasks

> Strict TDD: en cada tarea con código, primero se escribe o cambia el test y se ve **RED** (`node --test <archivo>`), después el mínimo código hasta **GREEN** y recién ahí se refactoriza con los tests en verde. Tests en el estilo de `scripts/*.test.mjs` (`node:test` + `node:assert/strict`, funciones puras en `scripts/lib/` o `src/utils/`, guards de texto sobre los fuentes). `npm test` en verde al cerrar cada grupo, con un commit local por grupo. Gobernanza MEDIUM: las decisiones no obvias se informan en el resumen.

## 1. Red de seguridad

- [x] 1.1 Correr `npm run ci` sobre la rama `pulido-post-auditoria` sin cambios y anotar el conteo de tests. Si algo falla, se reporta como falla preexistente y no se corrige. Verificación: conteo y resultado en el resumen.

## 2. Origen único del sitio (D3)

- [x] 2.1 RED: en `scripts/deploy-config.test.mjs`, importar el módulo como espacio de nombres (`import * as deployConfig`) para no romper el resto del archivo, y agregar: `deployConfig.SITE_ORIGIN === \`${SITE_URL}/\`` (con `SITE_URL` de `src/data/seo.js`), y un guard de texto que lea `scripts/lib/deploy-config.mjs` y exija que no contenga `facucode.dev`. Verificación: `node --test scripts/deploy-config.test.mjs` falla en esos dos tests (constante no exportada y literal presente) y el resto sigue en verde.
- [x] 2.2 GREEN: en `scripts/lib/deploy-config.mjs`, importar `canonicalUrl` de `src/data/seo.js` y declarar `export const SITE_ORIGIN = canonicalUrl('/')`, borrando el literal. Verificación: `node --test scripts/deploy-config.test.mjs` en verde, incluidos los tests existentes de `checkSitemap` (URL relativa y otro host siguen fallando con "absoluta").
- [x] 2.3 TRIANGULATE: agregar un caso de `checkSitemap` con `https://facucode.dev/` (sin `www`) y otro con `http://www.facucode.dev/`, ambos rechazados como no absolutos del origen, para que el cambio de fuente no afloje la comparación. Verificación: tests en verde y `npm run verify:deploy` en verde.

## 3. Enlaces visibles de la barra (D1)

- [x] 3.1 RED: en `scripts/site-nav.test.mjs`, reemplazar el test de "5 destinos" por: `NAV_LINKS` tiene, en orden, `presentacion/Inicio`, `quien-soy/Quién soy`, `proyectos/Proyectos`, `stack/Stack`, `testimonios/Testimonios`, `contacto/Contáctame` con códigos `01..06`. Verificación: falla.
- [x] 3.2 GREEN: agregar `{ id: 'testimonios', label: 'Testimonios', code: '05' }` entre stack y contacto y pasar contacto a `'06'` en `src/utils/siteNav.js`. Verificación: `node --test scripts/site-nav.test.mjs` y `node --test scripts/stack-classes.test.mjs` en verde.
- [x] 3.3 RED: tests de `visibleNavLinks(links, hiddenIds)`: sin ocultos devuelve una lista igual a `NAV_LINKS` (códigos declarados = calculados); ocultando `testimonios` devuelve cinco enlaces con contacto `05`; ocultando un id del medio (`quien-soy`) renumera sin huecos; un id inexistente en `hiddenIds` no cambia nada; no muta `NAV_LINKS`. Verificación: falla porque la función no existe.
- [x] 3.4 GREEN → REFACTOR: implementar `visibleNavLinks` en `src/utils/siteNav.js` (pura, códigos con `padStart(2, '0')`, JSDoc como el resto del archivo). Verificación: `node --test scripts/site-nav.test.mjs` en verde después de cada paso.
- [x] 3.5 RED: nuevo test (en `scripts/site-nav.test.mjs`) de `src/utils/homeNav.js`: con los datos actuales (`src/data/testimonios.js` vacío) `HOME_NAV_LINKS` no incluye `testimonios`, termina en contacto `05` y todos sus ids existen como `id="…"` en los componentes de la home (`Hero`, `About`, `Projects`, `Stack`, `Contact`). Además, un caso que compone con un array no vacío (exportar una función `homeNavLinks(testimonios)` y que `HOME_NAV_LINKS` sea su resultado con los datos reales) e incluye `testimonios` `05` y contacto `06`. Verificación: falla porque el módulo no existe.
- [x] 3.6 GREEN: crear `src/utils/homeNav.js` con `homeNavLinks(testimonios)` y `HOME_NAV_LINKS`. Verificación: test de 3.5 en verde.

## 4. Barra y encabezado de Contacto consumen los enlaces visibles

- [x] 4.1 RED: en `scripts/site-nav-classes.test.mjs`, guard de texto: `SiteNav.jsx` importa `HOME_NAV_LINKS` de `../utils/homeNav`, deriva `SECTION_ORDER` de él y ya no itera `NAV_LINKS` directamente (los dos `.map` de enlaces usan `HOME_NAV_LINKS`). Verificación: falla.
- [x] 4.2 GREEN: cambiar `SiteNav.jsx` en consecuencia (escritorio, menú móvil y scroll-spy). Verificación: test de 4.1 en verde, `npm run lint` y `npm run build` en verde.
- [x] 4.3 RED: en `scripts/contacto.test.mjs`, guard de cruce como el de Stack: `Contact.jsx` no contiene el código literal `05 {"//"}`/`06 {"//"}` y toma el código de `HOME_NAV_LINKS` (`contacto`); y `HOME_NAV_LINKS.find(contacto).code` coincide con lo que muestra la barra. Verificación: falla.
- [x] 4.4 GREEN: en `Contact.jsx`, renderizar `{code} {"//"}` con el código de `HOME_NAV_LINKS`, conservando `aria-hidden` y clases. Verificación: test en verde y `npm run build` en verde.

## 5. Panel móvil alcanzable (D2)

- [x] 5.1 RED: en `scripts/site-nav-classes.test.mjs`: `src/index.css` define `.eva-mobile-nav` con `max-height: calc(100vh - var(--eva-nav-h))` antes de `max-height: calc(100dvh - var(--eva-nav-h))`, `overflow-y: auto` y `overscroll-behavior: contain`; y el elemento `id="mobile-nav"` de `SiteNav.jsx` usa la clase `eva-mobile-nav`. Triangular con un fixture de CSS sin el respaldo `100vh` que el helper debe rechazar. Verificación: falla.
- [x] 5.2 GREEN: agregar la clase en `src/index.css` (junto a las utilidades de la barra) y aplicarla a `#mobile-nav`. Verificación: test en verde, `npm run build` en verde.
- [x] 5.3 Verificación en navegador (integración de los grupos 3–5): `npm run build && npm run preview` y Playwright con dos estados de datos (los reales, vacíos, y una copia local temporal con un testimonio de prueba que **no** se commitea): (a) 1440×900: seis enlaces con testimonios, cinco sin ellos, códigos correlativos y encabezado de Contacto coincidente; scroll hasta Testimonios marca solo ese enlace con `aria-current="location"`; activar "Testimonios" deja el título visible bajo la barra. (b) 568×320 y 375×667 con el menú abierto: el panel no supera el viewport, en 568×320 se llega a "Contáctame" desplazando y con Tab el destino enfocado queda visible; en 375×667 no hace falta desplazar y cada destino mide ≥ 44px. Verificación: capturas y valores medidos (`getBoundingClientRect`) en el resumen, consola sin errores.

## 6. og-image: plantilla y lectura de PNG (D4, puro)

- [x] 6.1 RED: `scripts/og-image.test.mjs` con unitarios de `readPngInfo` de `scripts/lib/og-image.mjs`: un buffer sintético con firma PNG + `IHDR` de 1200×630 (`bitDepth` 8, `colorType` 2) devuelve esos valores; otro de 800×418 `colorType` 6 devuelve los suyos (triangulación); un buffer con firma inválida y uno truncado lanzan un error que dice "PNG". Verificación: falla porque el módulo no existe.
- [x] 6.2 GREEN: implementar `readPngInfo` y las constantes `OG_IMAGE_WIDTH`, `OG_IMAGE_HEIGHT`, `OG_IMAGE_MAX_BYTES` (`300 * 1024`). Verificación: unitarios en verde.
- [x] 6.3 RED: unitarios de `buildOgImageHtml({ colors: EVA_THEME_COLORS, fonts })` con data URLs de prueba: contiene una sola vez cada texto de `OG_IMAGE_TEXT` ("Facundo Chacón", "Desarrollador Full Stack Java / React", "facucode.dev"); declara el tamaño 1200×630; usa los hex de `black`, `primary`, `secondary` y `tertiary` de los tokens; los `@font-face` solo usan `src: url(data:font/woff2;base64,…)`; no contiene `http://` ni `https://`; `scanLegacy([{ path: 'og-image.html', source: html }], { rules: LEGACY_RULES, permitidos: [], pendientes: [] })` devuelve `[]`. Triangulación: con una paleta alterada (otro hex de `primary`) el HTML usa el hex nuevo y no el original. Verificación: falla.
- [x] 6.4 GREEN → REFACTOR: implementar `OG_IMAGE_TEXT` y `buildOgImageHtml` según la guía visual de D4 (fondo negro con grilla hexagonal tenue, marco primario, franja secundaria, dominio terciario, serif condensada + mono). Escapar los textos para HTML. Verificación: `node --test scripts/og-image.test.mjs` en verde después de cada paso.

## 7. og-image: render y archivo publicado

- [x] 7.1 Agregar `playwright` a `devDependencies` con versión exacta (sin `^`, la estable vigente) y el script `"og:image": "node scripts/render-og-image.mjs"`; **no** sumarlo a `ci`. Verificación: `npm install` sin errores, `npm ls playwright` muestra la versión exacta y `package-lock.json` actualizado; `npm run ci` no invoca el render.
- [x] 7.2 RED: en `scripts/og-image.test.mjs`, guard sobre el archivo real: `readPngInfo(readFileSync('public/og-image.png'))` da 1200×630 con `colorType` 2 o 6 y el tamaño en bytes es ≤ `OG_IMAGE_MAX_BYTES`, con un mensaje que nombra el peso real si falla. Como el PNG viejo ya cumple dimensiones y peso, la RED de este paso es un test adicional que exige que el archivo **no** sea el actual (hash SHA-256 del PNG cyberpunk listado como prohibido en el test). Verificación: falla con el PNG viejo.
- [x] 7.3 GREEN: crear `scripts/render-og-image.mjs` (lee los `woff2` `noto-serif-display-latin-wdth-normal` y `jetbrains-mono-latin-wght-normal` de `node_modules/@fontsource-variable/...`, arma data URLs, `buildOgImageHtml`, Chromium 1200×630 con `deviceScaleFactor: 1`, `setContent`, espera `document.fonts.ready`, captura a `public/og-image.png`, valida con `readPngInfo` y el tope de peso y sale con código ≠ 0 si no cumple; si el navegador no está instalado, el error indica `npx playwright install chromium`). Correr `npm run og:image`. Verificación: `node --test scripts/og-image.test.mjs` en verde y el peso final en el resumen.
- [x] 7.4 Revisión visual de `public/og-image.png` (abrirla y adjuntar la captura en el resumen): textos legibles a tamaño de preview (≈ 600×315), fuentes del sitio (no de reemplazo), sin restos cyberpunk, jerarquía violeta > naranja > agua. Si no convence, iterar sobre `buildOgImageHtml` manteniendo los tests en verde. Verificación: captura en el resumen.

## 8. Integración

- [x] 8.1 `npm run ci` completo en verde (lint, verificadores, tests, build y `verify:build`). Verificación: conteo de tests antes (1.1) y después en el resumen.
- [x] 8.2 Confirmar que el build publica el PNG nuevo en la misma URL y que los metadatos no cambiaron: `dist/og-image.png` es idéntico a `public/og-image.png` y `og:image`/`twitter:image` de `dist/index.html` y del HTML del configurador siguen en `https://www.facucode.dev/og-image.png`. Verificación: comparación de hash y salida de `grep` en el resumen.
- [x] 8.3 Dejar anotado en el resumen, como paso manual posterior al deploy, refrescar la preview con LinkedIn Post Inspector y Facebook Sharing Debugger, y que el enlace "Testimonios" no se verá en producción hasta que `src/data/testimonios.js` tenga datos. Verificación: nota presente en el resumen.
