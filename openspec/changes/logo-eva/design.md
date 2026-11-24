# Design: logo-eva

> **Estado del boceto: PENDIENTE DE APROBACIÓN.** La geometría y los colores de D1–D3 salen de `bocetos/logo-completo.svg` y `bocetos/favicon.svg`. El apply NO arranca hasta que Facundo apruebe esos bocetos (o pida ajustes, que se hacen sobre los bocetos y no cambian specs ni tareas).

## Context

- Motivación: ver `proposal.md`. Requisitos: `specs/logotipo`, `specs/sistema-visual`, `specs/navegacion-del-sitio`, `specs/seccion-de-presentacion`, `specs/metadatos-por-ruta`.
- Referencia de forma: `public/simbolo.jpeg` (idéntico byte a byte al original de Facundo, 1600×1600, neón cian + eco rosa). Referencia de estilo: el lenguaje de trazo del título de Evangelion (solo el trazo; no se copia el logotipo, sus katakana ni su tipografía).
- Paleta: `src/styles/eva-tokens.js` es la fuente única; `EVA_BRAND_COLORS` + `brandBaseStyles()` ya establecieron el patrón "colores decorativos fuera de la jerarquía, llegan al CSS como variables vía `addBase`". `jerarquia-color.test.mjs` cuenta roles y prohíbe nombres de color (`eva-orange`, `eva-red`...) en componentes; `site-nav-classes.test.mjs` prohíbe hex literales en `NavBrand.jsx`; `legacy-guard` prohíbe la palabra `glow`.
- CSP de producción: `style-src 'self'`, sin `'unsafe-inline'` → nada de `style=""` ni `style={{}}`; los colores del SVG inline van por clases + variables CSS.
- Tests: `node --test "scripts/**/*.test.mjs"` (`node:test` + `node:assert/strict`, guards estáticos sobre el texto de los `.jsx` y funciones puras). **No hay Vitest/RTL en el repo**; las tareas siguen ese estilo. `npm run ci` es la compuerta completa.
- `NavBrand` usa `font-eva-display` y el guard de precarga (`font-preload.test.mjs`) exige que esa fuente se use en todas las rutas a través de la marca: el texto "FC" no puede desaparecer sin rehacer la precarga.

## Goals / Non-Goals

**Goals:**
- Una sola definición de la geometría (datos puros) consumida por React, por la plantilla de `og-image` y por el generador de favicon/ícono táctil.
- Cero dependencias nuevas; cero JS de animación; cero estilos inline.
- Favicon legible a 16 px; glifo de barra legible a 28 px.

**Non-Goals:**
- Borrar `public/simbolo.jpeg` o `public/screenshot.png`; tocar el CV/PDF (`cv.pdf`, `pdfDocument.js`) o el contenido del configurador.
- `favicon.ico`, manifest PWA o íconos de Android (sin pedido ni beneficio claro para un portfolio).
- Animaciones en bucle, trazado progresivo con `stroke-dasharray` u otros efectos (el usuario prefiere movimiento sutil y rechaza lo iridiscente).

## Decisions

### D1 — Geometría: barras rectas como polígonos rellenos, un `<path>` por trazo

Cada trazo del dibujo neón se redibuja como **barra recta**: polígono cerrado de 4–8 vértices con ancho casi constante y extremos cortados en escuadra (perpendiculares al eje), sin puntas ni forma de rombo (pedido explícito de Facundo tras el primer boceto de "cuchillas"). El **relieve** son **aletas**: salientes de bordes rectos en UN lado de la barra que suben en línea recta (72 % del tramo) y bajan en seco, tipo aleta de tiburón, de alto 0.66–1.04 × el ancho de su barra, ubicadas donde Facundo las pintó sobre el boceto anterior (`logo-preview-edit-usuario.png` en el scratchpad de la sesión): 3 en la parte alta del lado exterior de `triangulo-lateral`, 2 bajo `triangulo-interior`, 2 en el lado interior del tramo bajo de `triangulo-derecho`, 3 en el lado inferior derecho de la mitad alta de `lomo`, 3 en el lado izquierdo del tramo alto de `reloj-diagonal` y 3 bajo la mitad izquierda de `reloj-base` (la primera arranca en su extremo izquierdo, donde llega el lomo). Sin aletas: `reloj-superior`, el triángulo chico y el anillo. La variante simple no lleva aletas: probada una aleta en su lateral, a 16 px se empasta con el círculo. Las barras se prolongan un poco más allá de cada vértice para que las esquinas se cierren y los extremos asomen. Los puntos de control salen de medir los trazos cian del original (el eco rosa del neón se traduce en la sombra desplazada, D3). El círculo es un **anillo de grosor casi constante** (dos círculos apenas excéntricos, `fill-rule="evenodd"`).

- **Variante completa** (`viewBox="0 0 104 232"`, 11 trazos): lateral vertical y lado derecho del triángulo alto (se cruzan en el ápice), diagonal interior (forma el triángulo interior con los lados), diagonal larga "lomo" (de la esquina derecha del triángulo al pie izquierdo de la X), borde superior + diagonal larga + base del reloj de arena, los tres lados del triángulo chico que apunta a la izquierda, y el anillo.
  Ids en orden de pintado (= orden de los `<path>` en `bocetos/logo-completo.svg`): `triangulo-lateral`, `triangulo-derecho`, `triangulo-interior`, `lomo`, `reloj-superior`, `reloj-diagonal`, `reloj-base`, `chico-superior`, `chico-vertical`, `chico-inferior`, `anillo`.
- **Variante simple** (`viewBox="0 0 32 32"` en el favicon; recorte `3 1 24 30` sin fondo para la barra, 4 trazos): los tres lados del triángulo alto con trazo proporcionalmente más grueso + el anillo. Ids: `triangulo-lateral`, `triangulo-derecho`, `triangulo-base`, `anillo`.
- **Un `<path>` por trazo**, no un único `d` con `evenodd`: con un único `d` los cruces se anulan y quedan huecos negros. Con trazos separados los cruces se funden y el filo del trazo de arriba marca el cruce (como las katakana superpuestas de la referencia).
- **Fuente única paramétrica**: `src/data/logo.js` exporta `LOGO_VARIANTES` con la geometría de `bocetos/geometria.json` copiada tal cual: por variante `viewBox` (+ `viewBoxSinFondo` en la simple), `sombra`, `filo` y `trazos`; cada barra es `{ id, desde, hasta, ancho, aletas: [{ lado, inicio, pico, fin, alto }] }` (`t` de 0 a 1 a lo largo de la barra, `lado` 1 = normal `(-uy, ux)`) y el anillo `{ id, centro, radio, centroInterior, radioInterior }`. Una función pura `trazoPath(trazo)` arma el `d` (barras: solo `M L Z`, coordenadas a 0.1; anillo: dos arcos `a` con `evenodd`); así los tests validan las reglas de las aletas sobre los parámetros y no sobre polígonos. Los SVG de `bocetos/` son la salida de esos mismos parámetros. Cada trazo lleva un `id` legible para que los tests verifiquen la composición de cada variante.
- **Serializador puro**: `logoSvg({ variante, colores, fondo, conDimensiones })` en el mismo módulo devuelve el SVG como texto (lo usan la plantilla de `og-image` y el generador del favicon). El componente React no usa este string (sin `dangerouslySetInnerHTML`): mapea `trazos` a JSX.
- *Alternativas descartadas*: calcar el raster (prohibido por el pedido y pesado); fuente/ícono de terceros (no es el glifo); trazos con `stroke` + `stroke-width` variable (SVG no tiene ancho variable nativo ni admite aletas); trazos-hoja afilados en punta (primer boceto, rechazado por Facundo: demasiado rómbicos); ensanche lineal del ancho de la barra (segundo boceto, reemplazado por aletas según el boceto pintado por Facundo); `<use href="#id">` para no duplicar `d` (ids duplicados si el glifo aparece dos veces en la página; los `d` pesan ~1.5 KB).

### D2 — Colores: `EVA_LOGO_COLORS` fuera de la jerarquía, variables `--eva-logo-*`

| Clave | Hex | vs black | vs panel | Uso |
|---|---|---|---|---|
| `fill` | `#FFC21A` | 12.60 | 11.91 | relleno amarillo saturado |
| `edge` | `#F0381E` | 5.13 | 4.85 | filo y sombra rojo anaranjado |

- `src/styles/eva-tokens.js` exporta `EVA_LOGO_COLORS` (fuera de `EVA_COLORS`, `EVA_THEME_COLORS` y `EVA_ROLES`; no genera clases de Tailwind) y `logoBaseStyles(colors = EVA_LOGO_COLORS)` → `{ ':root': { '--eva-logo-fill': hex, '--eva-logo-edge': hex } }`, registrada con un segundo `addBase` en `tailwind.config.js` (mismo patrón que `brandBaseStyles`).
- Umbrales (spec sistema-visual): relleno ≥ 4.5 y filo ≥ 3 contra `black` y `panel`; el test lo verifica con `checkContrastPairs`. El filo es distinto del naranja secundario `#FF7A1A` (1.52:1 entre sí, tono más rojo) para que el logo no se lea como "más naranja" de la jerarquía.
- Nombres: `fill`/`edge` y `--eva-logo-*` esquivan los nombres de color que bloquean `color-roles.mjs` (`orange`, `red`...) y la palabra `glow` del `legacy-guard`.
- *Alternativa descartada*: usar el violeta > naranja > agua del sitio (el usuario eligió amarillo + rojo); meter los colores en `EVA_COLORS` (rompería el conteo de jerarquía y generaría clases `eva-*`).

### D3 — Pintado: sombra desplazada + relleno con filo, por clases

Dos grupos: primero la **sombra** (todos los trazos, `fill: var(--eva-logo-edge)`, `transform="translate(s s)"`), encima el **relleno** (`fill: var(--eva-logo-fill)`, `stroke: var(--eva-logo-edge)`, `stroke-width` = filo, `paint-order: stroke`, `stroke-linejoin: miter`). En React los colores llegan por clases de `src/index.css` (`@layer components`): `.eva-logo-sombra { fill: var(--eva-logo-edge) }`, `.eva-logo-relleno { fill: var(--eva-logo-fill); stroke: var(--eva-logo-edge); paint-order: stroke; stroke-linejoin: miter }`; el `stroke-width` y el `transform` son atributos de presentación (no son `style`, la CSP los permite). En `logoSvg` (favicon, og-image) los colores van como atributos `fill`/`stroke` con hex, porque esos SVG se usan fuera de la hoja de estilos del sitio; su sincronía la garantiza el test de D6.

### D4 — Barra: el glifo va AL LADO de "FC", no lo reemplaza

`NavBrand` queda: `[glifo simple 28 px] FC //00` dentro del mismo `<Link to="/">`. Se conserva el texto "FC" porque (a) es la única aparición de `font-eva-display` en `/configurador` y sostiene la precarga de la fuente (reemplazarlo obliga a rehacer `font-preload`), (b) el nombre accesible "FC, ir al inicio" no cambia y (c) a 28 px el glifo solo identifica, no se lee como nombre. Componente nuevo `src/components/LogoEva.jsx`: `<LogoEva variante="simple|completo" className=... />` → `<svg aria-hidden="true" focusable="false" viewBox=...>` con `width`/`height` intrínsecos del `viewBox` y tamaño final por clases (`h-7 w-auto` en la barra). El `Link` pasa a `inline-flex items-center gap-2`. Altura de la barra (`NAV_HEIGHT_PX`, 70) intacta.

- *Alternativa descartada*: reemplazar "FC" por el glifo (rompe precarga y pierde lectura del nombre) o usar la variante completa en la barra (a 28 px sus 11 trazos se empastan; ver `logo-preview.png`).

### D5 — Hero: glifo completo grande, absoluto, entrada única con `eva-boot`

- Posición: `<LogoEva variante="completo">` como hijo directo de la `<section>` del hero, `pointer-events-none absolute` (fuera del flujo → no hay CLS posible) y `z-0` con el contenido existente en `relative z-10`.
- **≥ md**: alto ~`min(78vh, 640px)`, anclado a la izquierda del retrato (entre la columna de texto y la del retrato), asomando por detrás del marco del retrato; el panel de datos y el retrato quedan por encima.
- **< md**: alto `h-32` (128 px; ancho ≈ 57 px por la proporción 104:232), arriba a la derecha (`right-4`, a la altura de la etiqueta `01 // Presentación`), donde el nombre en 15vw no llega: "FACUNDO" en la serif extra condensada mide ~200 px de 375. El apply verifica con Playwright que la caja del glifo no intersecta la del `h1` a 320, 375 y 768 px y que no hay scroll horizontal (`overflow-x-clip` ya está en la sección).
- Movimiento: `motion-safe:animate-eva-boot` (el recorte por pasos que ya usa el hero, 0.36 s) con `motion-safe:[animation-delay:120ms]`; sin preferencia aparece una vez y queda quieto; con movimiento reducido no hay clase de animación activa. Cero keyframes nuevos y nada en bucle.
- LCP: un SVG inline no es candidato a LCP; el retrato sigue siendo el elemento LCP con `fetchpriority="high"`.
- *Alternativas descartadas*: glifo en el flujo (corre el contenido y complica el CLS), marca de agua con opacidad baja detrás del `h1` (baja el contraste del nombre sobre amarillo), trazado animado de los bordes (más JS/CSS y efecto más ruidoso que lo que pide el usuario).

### D6 — Favicon e ícono táctil generados desde la fuente única

- `public/favicon.svg` = `logoSvg({ variante: 'simple', colores: EVA_LOGO_COLORS, fondo: EVA_COLORS.black })` byte a byte (cuadrado negro 32×32, `rx="4"`). Un test compara el archivo con la salida del serializador y falla nombrando el archivo si se desincroniza.
- `public/apple-touch-icon.png` 180×180: el mismo SVG rasterizado con el Chromium de Playwright, sin esquinas redondeadas (iOS las aplica). `index.html` suma `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`; `renderRouteHtml` no toca links, así que `/configurador` lo hereda.
- Script manual `scripts/render-logo-assets.mjs` + `npm run logo:assets` (mismo patrón que `render-og-image.mjs`: escribe ambos archivos; no entra en `ci` ni en el build de Vercel; los archivos se versionan). Se reutiliza `readPngInfo` de `scripts/lib/og-image.mjs` para validar 180×180.

### D7 — og-image: glifo completo a la derecha de la tarjeta

`buildOgImageHtml({ colors, fonts, logoColors })` inserta `logoSvg({ variante: 'completo', colores: logoColors })` una sola vez, en un contenedor absoluto a la derecha (alto ~470 px dentro del marco, `right` ~96 px) que no se superpone con `.content` (se limita `.content` a la izquierda, `right: 380px`). `render-og-image.mjs` pasa `EVA_LOGO_COLORS`. Se regenera `public/og-image.png` (sigue ≤ 300 KB: el glifo son superficies planas, comprime bien).

### D8 — Tests (`node:test`) por capa

- `scripts/logotipo.test.mjs` (nuevo): datos de `LOGO_VARIANTES` (ids y cantidad de trazos por variante, simple ≤ 5 trazos, puntos dentro del `viewBox`), reglas de aletas sobre los parámetros (un solo `lado` por barra, `0 ≤ inicio < pico < fin ≤ 1`, sin superposición, `0.5·ancho ≤ alto ≤ 1.2·ancho`, ninguna en `anillo`/`chico-*`/variante simple, presentes en las cinco zonas), `trazoPath` (solo `M L Z` en barras, `a` en el anillo, cantidad de vértices = 4 + 3 por aleta), `logoSvg` (estructura, colores inyectados, sin `<image>`/`gradient`/`filter`/`animate`, triangulación con colores falsos), `EVA_LOGO_COLORS` + contraste + `logoBaseStyles` + plugin de `tailwind.config.js`, guard de hex del logo fuera de `eva-tokens.js`/`public/`, `favicon.svg` sincronizado, `apple-touch-icon.png` 180×180 y declarado en `index.html`, guard estático de `LogoEva.jsx` (`aria-hidden="true"`, `focusable="false"`, sin `style`, clases `eva-logo-*`).
- Se extienden `site-nav-classes.test.mjs` (NavBrand monta `<LogoEva variante="simple"`, conserva `FC`, `navCode(BRAND_CODE)` y `sr-only`), `hero.test.mjs` (Hero monta `<LogoEva variante="completo"`, `absolute`, `pointer-events-none`, animación solo `motion-safe:`) y `og-image.test.mjs` (glifo exactamente una vez, colores del logo de la fuente única, triangulación cambiando `logoColors`).

## Risks / Trade-offs

- [El boceto no convence a Facundo] → los ajustes se hacen en los SVG de `bocetos/` antes del apply; specs y tareas no cambian porque los tests verifican estructura (variantes, trazos, reglas de aletas, colores), no coordenadas exactas.
- [El amarillo grande del hero compite con la jerarquía violeta > naranja > agua y con el retrato] → el glifo no cuenta en la jerarquía por spec, pero el apply hace una captura a 1440 y 375 px y la presenta como checkpoint visual; si pesa demasiado se baja el tamaño en ≥ md (decisión de tamaño, no de spec).
- [Glifo tapa el `h1` en anchos intermedios (md justo en 768 px)] → verificación de cajas con Playwright en 320/375/768/1024/1440 como tarea explícita.
- [El filo rojo de 0.3 unidades se pierde a 16 px] → aceptado: a 16 px se lee la silueta amarilla sobre negro; el filo y la sombra suman a partir de 32 px.
- [Safari viejo ignora el favicon SVG] → el `apple-touch-icon.png` cubre la pantalla de inicio de iOS; en pestañas, Safari cae al ícono genérico, igual que hoy.
- [`core.autocrlf` convierte `public/favicon.svg` a CRLF en Windows y la comparación byte a byte con `logoSvg` (LF) falla] → el test normaliza finales de línea (`\r\n` → `\n`) antes de comparar, o se agrega `*.svg text eol=lf` a `.gitattributes`; decidir en la tarea 7.1.
- [Desincronización entre bocetos, `logo.js` y `public/`] → el boceto deja de ser fuente cuando se copia a `logo.js`; desde ahí la verdad es `logo.js` y los tests de D6/D7 atan los derivados.

## Migration Plan

1. Aprobación del boceto (bloqueante).
2. Apply por grupos de `tasks.md` (tokens → geometría → componente → barra → hero → favicon/ícono → og-image → integración).
3. Rollback: revertir el merge; `favicon.svg` y `og-image.png` vuelven a la versión anterior desde git. No hay datos ni migraciones.

## Open Questions

- Ninguna que cambie specs o tareas. El tamaño exacto del glifo en el hero (≥ md) y el desplazamiento de la sombra se afinan en el checkpoint visual del apply.
