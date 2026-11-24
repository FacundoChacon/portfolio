# Design

## Context

Ver `proposal.md` (Why). Estado actual que condiciona el enfoque:

- **Barra**: `src/utils/siteNav.js` declara `NAV_LINKS` con cinco enlaces y códigos fijos `01..05`. `SiteNav.jsx` deriva `SECTION_ORDER` de `NAV_LINKS` y marca el actual con `pickActiveSection` (scroll-spy con `IntersectionObserver`). Los encabezados de algunas secciones repiten su código a mano: `Stack.jsx` (`//04`, con un test que lo cruza con `NAV_LINKS`) y `Contact.jsx` (`05 {"//"}`, sin test de cruce).
- **Testimonios**: `src/data/testimonios.js` exporta hoy **un array vacío** y `Testimonials.jsx` devuelve `null` en ese caso (requisito "Sección oculta sin testimonios"). Es decir: en producción hoy no existe `#testimonios`.
- **Menú móvil**: `#mobile-nav` es un bloque dentro del `header` fijo, sin altura máxima ni desplazamiento. Cada destino mide 44px (`min-h-11`); por debajo de `sm` (640px) se suma "Armá tu web".
- **Origen**: `src/data/seo.js` exporta `SITE_URL = 'https://www.facucode.dev'` (sin barra) y `canonicalUrl('/')`; `scripts/lib/deploy-config.mjs` ya importa `resolveRouteMeta` de `seo.js` pero declara aparte `SITE_ORIGIN = 'https://www.facucode.dev/'` para `checkSitemap`.
- **og-image**: `public/og-image.png` es un PNG 1200×630 de 215 KB con la estética cyberpunk. `index.html` y `seo.js` lo referencian por URL absoluta y ya declaran `og:image:width/height/type`. No hay `playwright` en `package.json`; en la máquina hay navegadores de Playwright cacheados (`%LOCALAPPDATA%\ms-playwright`). Las fuentes del sitio vienen de `@fontsource-variable/noto-serif-display` (archivo `latin-wdth-normal`) y `@fontsource-variable/jetbrains-mono` (`latin-wght-normal`), referenciadas en `src/styles/fonts.css`.

## Goals / Non-Goals

**Goals:**
- Que la barra nunca apunte a un ancla inexistente y que los códigos visibles sean correlativos en cualquier estado de los datos.
- Una sola composición de "enlaces visibles de la home" consumida por la barra y por el encabezado de Contacto.
- Un único literal del origen del sitio en el código ejecutable (`src/data/seo.js`).
- Una og-image reproducible desde el repo, con colores tomados de `eva-tokens.js`, y un guard de formato/peso que corra en `npm run ci` sin navegador.

**Non-Goals:**
- Renderizar la og-image en CI o en el build de Vercel (el PNG se versiona; el render es manual).
- Cambiar el código decorativo del encabezado de Testimonios (`//RX`): es un código de "mensaje entrante", no un número de sección.
- Tocar `index.html` (los literales de la plantilla los reescribe el plugin de metadatos por ruta y ya los validan los tests existentes).
- Comparar píxeles de la og-image o validar su paleta sobre el PNG: la paleta se verifica sobre la plantilla.

## Decisions

### D1. Testimonios vacíos: el enlace se oculta y los códigos se renumeran

Se agrega a `siteNav.js` una función pura `visibleNavLinks(links, hiddenIds)` que filtra los ids ocultos y **reasigna los códigos por posición** (`01`, `02`, …). `NAV_LINKS` pasa a tener seis entradas con códigos `01..06` (testimonios `05`, contacto `06`), y un test exige que `visibleNavLinks(NAV_LINKS, [])` sea igual a `NAV_LINKS` (los códigos declarados no pueden divergir de los calculados).

La composición con los datos vive en un módulo nuevo `src/utils/homeNav.js`:
`HOME_NAV_LINKS = visibleNavLinks(NAV_LINKS, testimonios.length === 0 ? ['testimonios'] : [])`. Lo consumen `SiteNav.jsx` (enlaces de escritorio, menú móvil y `SECTION_ORDER` del scroll-spy) y `Contact.jsx` (código del encabezado). La condición "hay testimonios" queda en un solo lugar y es la misma que usa `Testimonials.jsx`.

Alternativas descartadas:
- *Mostrar siempre el enlace*: con los datos vacíos de hoy apuntaría a `#testimonios` inexistente (ancla rota, scroll-spy que nunca lo marca). Viola el objetivo.
- *Ocultar el enlace pero mantener códigos fijos* (`//04` → `//06`): deja un hueco visible en la secuencia de la barra y en el encabezado de Contacto, que es justamente el lenguaje de "códigos de sistema" de la estética Eva.
- *Que `siteNav.js` importe los datos*: rompería su carácter de lógica pura sin datos (hoy solo la consumen tests y la barra); un módulo de composición aparte es más barato de testear.

Consecuencia que hay que comunicar: **mientras `testimonios.js` siga vacío, en producción no se verá ningún cambio en la barra**. El enlace aparece solo al cargar testimonios reales.

### D2. Panel móvil acotado y desplazable con una clase de componente

Se agrega en `src/index.css` una clase `.eva-mobile-nav` con `max-height: calc(100vh - var(--eva-nav-h))`, seguida de `max-height: calc(100dvh - var(--eva-nav-h))` (mismo patrón de respaldo que ya usa el archivo con `100vh`/`100svh`), `overflow-y: auto` y `overscroll-behavior: contain`, y se aplica a `#mobile-nav`. Cálculo: con seis enlaces más "Armá tu web" el panel mide 7×44 + 24 = 332px, que sumados a los 70px de la barra superan los 320px de alto de un teléfono chico en horizontal (568×320); en 375×667 entra sin desplazar.

Alternativa descartada: utilidades arbitrarias de Tailwind (`max-h-[calc(100dvh-...)]`) — no permiten el respaldo en dos declaraciones y el guard de clases de la barra ya trabaja sobre `index.css`.

### D3. Origen del sitio desde `seo.js`

`deploy-config.mjs` exporta `SITE_ORIGIN = canonicalUrl('/')` (importado de `src/data/seo.js`, que ya devuelve `${SITE_URL}/` con la barra final que necesita `checkSitemap`). Se elimina el literal. Un test exige `SITE_ORIGIN === \`${SITE_URL}/\`` y otro, sobre el texto de `deploy-config.mjs`, que no contenga `facucode.dev`. Los tests existentes de `checkSitemap` (URL relativa, otro host) siguen siendo la red de no-regresión del comportamiento.

Alternativa descartada: importar `SITE_URL` y concatenar `/` en `deploy-config` — duplica la regla "la home lleva barra final" que ya encapsula `canonicalUrl`.

### D4. og-image: plantilla como función pura + render manual con Playwright

- `scripts/lib/og-image.mjs` (puro, sin I/O):
  - `OG_IMAGE_WIDTH = 1200`, `OG_IMAGE_HEIGHT = 630`, `OG_IMAGE_MAX_BYTES = 300 * 1024`.
  - `OG_IMAGE_TEXT = { name: 'Facundo Chacón', role: 'Desarrollador Full Stack Java / React', domain: 'facucode.dev' }`.
  - `buildOgImageHtml({ colors, fonts })`: devuelve el HTML completo de 1200×630. `colors` es `EVA_THEME_COLORS` (roles ya resueltos a hex: `black`, `paper`, `gray`, `primary`, `primary-light`, `secondary`, `tertiary`, `line`); `fonts` son data URLs `data:font/woff2;base64,…` de la serif de títulos y la mono. Sin `<title>` ni otro texto que repita nombre/rol/dominio, sin URLs `http(s)`.
  - `readPngInfo(buffer)`: valida la firma PNG y el chunk `IHDR` y devuelve `{ width, height, bitDepth, colorType }`; lanza un error con mensaje claro si no es PNG.
- `scripts/render-og-image.mjs` (I/O, **no** forma parte de `ci`): lee los dos `woff2` de `node_modules/@fontsource-variable/...` (los mismos archivos que `src/styles/fonts.css`), arma las data URLs, llama a `buildOgImageHtml`, abre Chromium de Playwright con viewport 1200×630 y `deviceScaleFactor: 1`, `page.setContent`, espera `document.fonts.ready`, captura a `public/og-image.png` y al final valida con `readPngInfo` y el tope de peso (sale con código ≠ 0 si no cumple). Script npm: `"og:image": "node scripts/render-og-image.mjs"`.
- `scripts/og-image.test.mjs` (corre en `npm test`): unitarios de `readPngInfo` con buffers sintéticos, unitarios de `buildOgImageHtml` (textos una vez, colores desde los tokens, sin `http`, `@font-face` solo con `data:`, sin tokens de la estética anterior vía `scanLegacy` + `LEGACY_RULES`, triangulación con una paleta alterada) y el guard sobre el archivo real `public/og-image.png` (1200×630, `colorType` 2 o 6, ≤ 300 KB).

Composición visual (guía para el apply, coherente con la jerarquía primario > secundario > terciario): fondo `black` con grilla hexagonal tenue en violeta, marco/borde `primary`, franja de advertencia `secondary` (patrón de `.eva-stripes`), etiqueta mono tipo `SYS // FICHA`, nombre en serif condensada pesada en mayúsculas (`paper`, apellido en `primary-light`), rol en mono `gray`/`paper` y dominio en mono `tertiary` con prompt `>`. Inspirarse en el Hero, no copiar su DOM.

Dependencia: `playwright` como `devDependency` con **versión exacta** (sin `^`), la estable vigente al momento del apply. El paquete `playwright` no descarga navegadores al instalarse, así que `npm ci` en Vercel no cambia de costo relevante; para renderizar en otra máquina hace falta `npx playwright install chromium` una vez (el script lo indica si falla el lanzamiento).

Alternativas descartadas:
- *Plantilla `.html` estática con colores escritos a mano*: duplica la paleta y no cumple el escenario "Cambio en la paleta".
- *Fuentes por `file://` o servidor local*: `setContent` corre en `about:blank` y no puede leer `file://` de forma fiable; las data URLs hacen la plantilla autocontenida.
- *Usar el MCP de Playwright o una captura manual del navegador*: no es reproducible ni versionable.
- *Satori/resvg o sharp*: otra dependencia nativa/pesada y otro motor de layout distinto al del sitio; Chromium renderiza las mismas fuentes variables (eje `wdth`) que el sitio.
- *Render en CI*: haría depender `npm run ci` y el build de Vercel de un navegador; el PNG versionado + guard es suficiente.

## Risks / Trade-offs

- [El enlace nuevo no se ve en producción hasta que haya testimonios] → Se documenta en el resumen del apply; los tests cubren ambos estados con la función pura.
- [El render depende de la versión de Chromium: re-renderizar puede producir un PNG distinto byte a byte] → No se compara por hash; el guard valida dimensiones, formato y peso, y la revisión visual es manual (tarea explícita).
- [La og-image puede superar 300 KB si la textura es muy densa] → El script falla al final con el peso real; se baja la densidad/opacidad de la textura o se reduce el área con ruido. Fondos planos comprimen bien en PNG.
- [Caché de previews en redes (WhatsApp, LinkedIn, X) siguen mostrando la imagen vieja] → Misma URL a propósito (no cambia metadatos); tarea manual posterior al deploy de refrescar con los depuradores de cada red (LinkedIn Post Inspector, Facebook Sharing Debugger).
- [`100dvh` no soportado en navegadores viejos] → Respaldo `100vh` declarado antes.
- [Renumerar códigos cambia el `05` del encabezado de Contacto según los datos] → Es el comportamiento buscado; queda cubierto por test de cruce Contacto ↔ barra.

## Migration Plan

1. Merge de la rama con el PNG nuevo versionado; Vercel publica `/og-image.png` en la misma URL.
2. Después del deploy, refrescar la preview en los depuradores de las redes (manual, fuera de CI).
3. Rollback: revertir el commit; no hay datos ni configuración de hosting involucrados.
