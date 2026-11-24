# Design: logo-eva

> **Estado del boceto: PENDIENTE DE APROBACIÓN.** La geometría y los colores de D1–D3 salen de `bocetos/logo-completo.svg` y `bocetos/favicon.svg`. El apply NO arranca hasta que Facundo apruebe esos bocetos (o pida ajustes, que se hacen sobre los bocetos y no cambian specs ni tareas).

## Context

- Motivación: ver `proposal.md`. Requisitos: `specs/logotipo`, `specs/sistema-visual`, `specs/navegacion-del-sitio`, `specs/metadatos-por-ruta`.
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

### D1 — Geometría: barras rectas unidas en una silueta única

Cada trazo del dibujo neón se redibuja como **barra recta**: polígono cerrado de 4–8 vértices de ancho constante, sin puntas ni forma de rombo (pedido explícito de Facundo tras el primer boceto de "cuchillas"). El **relieve** es **una aleta continua por zona** (pedido de Facundo: "que sean continuas", no dientes de sierra): sobre UN lado de la barra, una **rampa** recta y suave (10.6°–17.4° respecto de la barra), una **meseta** paralela a la barra que ocupa la mayor parte de la aleta y un **cierre** perpendicular de vuelta a la línea base de la que partió; un trapecio largo y bajo fundido a la barra. Alto 0.45–0.5 × el ancho de la barra. Las zonas son las que Facundo pintó sobre el boceto (`logo-preview-edit-usuario.png` en el scratchpad de la sesión): `triangulo-lateral` (lado exterior, parte alta: t 0.04→0.40), `triangulo-interior` (bajo la diagonal: t 0.10→0.80), `triangulo-derecho` (lado interior, tramo bajo: t 0.60→0.92), `lomo` (lado inferior derecho, mitad alta: t 0.05→0.53), `reloj-diagonal` (lado izquierdo, tramo alto: t 0.03→0.37) y `reloj-base` (debajo, desde el extremo izquierdo donde llega el lomo: t 0→0.50). `chico-vertical` (lado exterior derecho del triángulo chico, `lado: -1`, t 0.20→0.77, alto 2.2 = 0.46 × ancho, rampa 14.5°): equilibra el peso de las aletas de la izquierda. **Aro**: una aleta continua en el borde exterior, arriba a la izquierda, lejos del triángulo alto: `{ lado: "exterior", inicio: 150°, rampa: 30°, meseta: 110°, alto: 3 }` (ángulos desde +x en sentido horario de pantalla; rampa recta de 150° a 180°, ~19° de inclinación; meseta concéntrica de radio 19.5 de 180° a 290°; cierre radial a 290°; alto = 0.51 × grosor del aro). Sin aletas: `reloj-superior`, `chico-superior`, `chico-inferior` y toda la variante simple (probadas una aleta en su lateral y otra en su aro: a 16 px se empastan y a 32 px el aro se lee abollado). Bocetos previos descartados: cuchillas afiladas, ensanche lineal, aletas en serie tipo sierra y barras con extremos que sobresalen de las uniones (pedido de Facundo: "que no se note esa separación por cada rectángulo").

**Uniones (sin costuras)**: las barras van de vértice compartido a vértice compartido, sin sobresalir. Cada extremo declara su corte: **inglete** con la barra que comparte el vértice (el corte es la bisectriz del ángulo entre ambas; los dos lados exteriores se encuentran en un único vértice agudo y los interiores en otro) o **T** sobre una barra anfitriona (el extremo se corta sobre el eje de la anfitriona y queda oculto dentro de su cuerpo). Ingletes: ápice (`triangulo-lateral`/`triangulo-derecho`), esquina derecha (`triangulo-derecho`/`lomo`), pie del lomo (`lomo`/`reloj-base`), vértice izquierdo del reloj (`reloj-superior`/`reloj-diagonal`), vértice inferior derecho (`reloj-diagonal`/`reloj-base`) y los tres vértices del triángulo chico. T: `triangulo-lateral` y `reloj-superior` terminan en el `lomo`; `triangulo-interior` va del `triangulo-lateral` al `lomo`. En la variante simple el triángulo es cerrado: tres ingletes.

**Ejes rectos**: las barras a menos de 4° de un eje se enderezan: `triangulo-lateral` (0.85° → exactamente vertical) en las dos variantes. `chico-vertical` (4.7°) y todas las demás son diagonales claras y conservan su ángulo; no hay barras casi horizontales. Los puntos de control salen de medir los trazos cian del original (el eco rosa del neón se traduce en la sombra desplazada, D3). El círculo es un **anillo de grosor casi constante** (dos círculos apenas excéntricos, `fill-rule="evenodd"`; el contorno exterior lleva la aleta del aro: `M` en el radio exterior, `L` de la rampa, `A` de la meseta, `L` radial y `A` de vuelta por el radio exterior).

- **Variante completa** (`viewBox="0 0 112 243"`, 11 trazos; el lienzo creció para alojar las puntas de los ingletes agudos): lateral vertical y lado derecho del triángulo alto (inglete en el ápice), diagonal interior (forma el triángulo interior con los lados), diagonal larga "lomo" (de la esquina derecha del triángulo al pie izquierdo de la X), borde superior + diagonal larga + base del reloj de arena, los tres lados del triángulo chico que apunta a la izquierda, y el anillo.
  Ids en orden de la definición: `triangulo-lateral`, `triangulo-derecho`, `triangulo-interior`, `lomo`, `reloj-superior`, `reloj-diagonal`, `reloj-base`, `chico-superior`, `chico-vertical`, `chico-inferior`, `anillo`.
- **Variante simple** (`viewBox="0 0 32 32"` en el favicon; recorte `4.5 0 22 32` sin fondo para la barra, 4 trazos): el triángulo alto cerrado con trazo proporcionalmente más grueso + el anillo, separado 1.8 unidades del lateral para que no se empaste a 16 px. Ids: `triangulo-lateral`, `triangulo-derecho`, `triangulo-base`, `anillo`.
- **Un trazo por barra en los datos, un `<path>` por capa al pintar**: los datos tienen un trazo por barra (los tests validan cada uno), pero al pintar todas las barras se concatenan en UN `<path>` por capa (todas tienen el mismo sentido de giro, así que `nonzero` da su unión) y el anillo va en otro `<path>` con `evenodd`. Con un `<path>` por barra el antialias deja costuras finas entre polígonos que se tocan en los ingletes.
- **Fuente única paramétrica**: `src/data/logo.js` exporta `LOGO_VARIANTES` con la geometría de `bocetos/geometria.json` copiada tal cual: por variante `viewBox` (+ `viewBoxSinFondo` en la simple), `sombra`, `filo` y `trazos`; cada barra es `{ id, desde, hasta, ancho, corteDesde, corteHasta, aletas: [{ lado, inicio, rampa, meseta, alto }] }` con `desde`/`hasta` en vértices compartidos o sobre el eje de la anfitriona y `corte*` = `{ tipo: "inglete" | "T", con: <id> }` (como máximo una; `inicio`, `rampa` y `meseta` en fracción del largo de la barra, `alto` en unidades del `viewBox`, `lado` 1 = normal `(-uy, ux)`) y el anillo `{ id, centro, radio, centroInterior, radioInterior }`. Una función pura `trazoPath(trazo, trazosPorId)` arma el `d` (lados paralelos al eje intersectados con la recta de corte de cada extremo: bisectriz del inglete o eje de la anfitriona en la T) (barras: solo `M L Z`, coordenadas a 0.1; anillo: dos arcos `a` con `evenodd`); así los tests validan las reglas de las aletas sobre los parámetros y no sobre polígonos. Los SVG de `bocetos/` son la salida de esos mismos parámetros. Cada trazo lleva un `id` legible para que los tests verifiquen la composición de cada variante.
- **Serializador puro**: `logoSvg({ variante, colores, fondo, conDimensiones })` en el mismo módulo devuelve el SVG como texto (lo usan la plantilla de `og-image` y el generador del favicon). El componente React no usa este string (sin `dangerouslySetInnerHTML`): mapea `trazos` a JSX.
- *Alternativas descartadas*: calcar el raster (prohibido por el pedido y pesado); fuente/ícono de terceros (no es el glifo); trazos con `stroke` + `stroke-width` variable (SVG no tiene ancho variable nativo ni admite aletas); trazos-hoja afilados en punta (primer boceto, rechazado por Facundo: demasiado rómbicos); ensanche lineal del ancho de la barra (segundo boceto) y aletas en serie tipo sierra (tercer boceto), ambos reemplazados por la aleta continua según el pedido de Facundo; `<use href="#id">` para no duplicar `d` (ids duplicados si el glifo aparece dos veces en la página; los `d` pesan ~1.5 KB).

### D2 — Colores: `EVA_LOGO_COLORS` fuera de la jerarquía, variables `--eva-logo-*`

| Clave | Hex | vs black | vs panel | Uso |
|---|---|---|---|---|
| `fill` | `#FFC21A` | 12.60 | 11.91 | relleno amarillo saturado |
| `edge` | `#F0381E` | 5.13 | 4.85 | filo y sombra rojo anaranjado |

- `src/styles/eva-tokens.js` exporta `EVA_LOGO_COLORS` (fuera de `EVA_COLORS`, `EVA_THEME_COLORS` y `EVA_ROLES`; no genera clases de Tailwind) y `logoBaseStyles(colors = EVA_LOGO_COLORS)` → `{ ':root': { '--eva-logo-fill': hex, '--eva-logo-edge': hex } }`, registrada con un segundo `addBase` en `tailwind.config.js` (mismo patrón que `brandBaseStyles`).
- Umbrales (spec sistema-visual): relleno ≥ 4.5 y filo ≥ 3 contra `black` y `panel`; el test lo verifica con `checkContrastPairs`. El filo es distinto del naranja secundario `#FF7A1A` (1.52:1 entre sí, tono más rojo) para que el logo no se lea como "más naranja" de la jerarquía.
- Nombres: `fill`/`edge` y `--eva-logo-*` esquivan los nombres de color que bloquean `color-roles.mjs` (`orange`, `red`...) y la palabra `glow` del `legacy-guard`.
- *Alternativa descartada*: usar el violeta > naranja > agua del sitio (el usuario eligió amarillo + rojo); meter los colores en `EVA_COLORS` (rompería el conteo de jerarquía y generaría clases `eva-*`).

### D3 — Pintado en tres capas: silueta única con filo y sombra

El filo no puede ser un `stroke` por trazo (dibuja la línea interna en cada cruce y unión). Se pinta en **tres capas**, cada una con el mismo `<path>` de barras + el del anillo:

1. **Sombra**: `fill` y `stroke` = edge, `stroke-width` = 2 × filo, `transform="translate(s s)"`.
2. **Filo**: `fill` y `stroke` = edge, `stroke-width` = 2 × filo.
3. **Relleno**: `fill` = fill, **sin stroke**. Tapa la mitad interior de cada contorno y todas las líneas internas, así que del filo solo queda visible la franja exterior de la silueta unida (y de los huecos).

`filo` es el ancho visible del contorno (completo 0.55, simple 0.15 unidades; el `stroke-width` es el doble). `stroke-linejoin="miter"` con `stroke-miterlimit="2"`: las esquinas de cada polígono más agudas que 60° (las mitades de un inglete) se biselan en el contorno y no sacan púas fuera de la silueta; las esquinas de 90° de las aletas quedan vivas. En React los colores llegan por clases de `src/index.css` (`@layer components`): `.eva-logo-sombra` y `.eva-logo-filo { fill: var(--eva-logo-edge); stroke: var(--eva-logo-edge); stroke-linejoin: miter; stroke-miterlimit: 2 }`, `.eva-logo-relleno { fill: var(--eva-logo-fill); stroke: none }`; `stroke-width` y `transform` son atributos de presentación (no son `style`, la CSP los permite). En `logoSvg` (favicon, og-image) los mismos atributos van con hex, porque esos SVG se usan fuera de la hoja de estilos del sitio; su sincronía la garantiza el test de D6.

### D4 — Barra: el glifo va AL LADO de "FC", no lo reemplaza

`NavBrand` queda: `[glifo simple 28 px] FC //00` dentro del mismo `<Link to="/">`. Se conserva el texto "FC" porque (a) es la única aparición de `font-eva-display` en `/configurador` y sostiene la precarga de la fuente (reemplazarlo obliga a rehacer `font-preload`), (b) el nombre accesible "FC, ir al inicio" no cambia y (c) a 28 px el glifo solo identifica, no se lee como nombre. Componente nuevo `src/components/LogoEva.jsx`: `<LogoEva variante="simple|completo" className=... />` → `<svg aria-hidden="true" focusable="false" viewBox=...>` con `width`/`height` intrínsecos del `viewBox` y tamaño final por clases (`h-7 w-auto` en la barra). El `Link` pasa a `inline-flex items-center gap-2`. Altura de la barra (`NAV_HEIGHT_PX`, 70) intacta.

- *Alternativa descartada*: reemplazar "FC" por el glifo (rompe precarga y pierde lectura del nombre) o usar la variante completa en la barra (a 28 px sus 11 trazos se empastan; ver `logo-preview.png`).

### D5 — Hero: descartado por el usuario

El glifo completo grande en el hero se implementó y se probó (absoluto, entrada única `eva-boot`, sin solapes), pero al verlo el usuario pidió sacarlo. El hero queda exactamente como antes del change y `hero.test.mjs` tiene un guard que impide que vuelva a referenciar `LogoEva`. La variante `completo` se sigue usando en la imagen para compartir (D7).

### D6 — Favicon e ícono táctil generados desde la fuente única

- `public/favicon.svg` = `logoSvg({ variante: 'simple', colores: EVA_LOGO_COLORS, fondo: EVA_COLORS.black })` byte a byte (cuadrado negro 32×32, `rx="4"`). Un test compara el archivo con la salida del serializador y falla nombrando el archivo si se desincroniza.
- `public/apple-touch-icon.png` 180×180: el mismo SVG rasterizado con el Chromium de Playwright, sin esquinas redondeadas (iOS las aplica). `index.html` suma `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`; `renderRouteHtml` no toca links, así que `/configurador` lo hereda.
- Script manual `scripts/render-logo-assets.mjs` + `npm run logo:assets` (mismo patrón que `render-og-image.mjs`: escribe ambos archivos; no entra en `ci` ni en el build de Vercel; los archivos se versionan). Se reutiliza `readPngInfo` de `scripts/lib/og-image.mjs` para validar 180×180.

### D7 — og-image: glifo completo a la derecha de la tarjeta

`buildOgImageHtml({ colors, fonts, logoColors })` inserta `logoSvg({ variante: 'completo', colores: logoColors })` una sola vez, en un contenedor absoluto a la derecha (alto ~470 px dentro del marco, `right` ~96 px) que no se superpone con `.content` (se limita `.content` a la izquierda, `right: 380px`). `render-og-image.mjs` pasa `EVA_LOGO_COLORS`. Se regenera `public/og-image.png` (sigue ≤ 300 KB: el glifo son superficies planas, comprime bien).

### D8 — Tests (`node:test`) por capa

- `scripts/logotipo.test.mjs` (nuevo): datos de `LOGO_VARIANTES` (ids y cantidad de trazos por variante, simple ≤ 5 trazos, puntos dentro del `viewBox`), reglas de aletas sobre los parámetros (como máximo una por barra, `inicio + rampa + meseta ≤ 1`, `meseta > rampa`, ángulo de rampa ≤ 25°, `0.3·ancho ≤ alto ≤ 0.7·ancho`, una en cada una de las siete barras con zona + una en el aro, ninguna en `reloj-superior`, `chico-superior`, `chico-inferior` ni en la variante simple; aro: un solo tramo, rampa 25°–35° de arco con inclinación ≤ 25°, meseta 90°–120°, `0.3·grosor ≤ alto ≤ 0.7·grosor`), uniones (cada `corte*` apunta a una barra existente; en un inglete ambas barras comparten el vértice y se referencian entre sí; en una T el extremo cae sobre el eje de la anfitriona; ningún extremo libre), ejes rectos (barras a < 4° de un eje exactamente alineadas), `trazoPath` (solo `M L Z` en barras, en el anillo `M L A L A Z` (meseta concéntrica de radio `radio + alto`) + el círculo interior, 4 + 4 vértices por aleta, los dos polígonos de un inglete comparten los puntos del corte), `logoSvg` (tres capas sombra/filo/relleno con un `<path>` de barras + uno de anillo cada una, relleno sin `stroke`, `stroke-width` = 2 × filo; la misma técnica es obligatoria en `LogoEva.jsx`, en la plantilla de `og-image` y en el favicon, todos vía `LOGO_VARIANTES`; colores inyectados, sin `<image>`/`gradient`/`filter`/`animate`, triangulación con colores falsos), `EVA_LOGO_COLORS` + contraste + `logoBaseStyles` + plugin de `tailwind.config.js`, guard de hex del logo fuera de `eva-tokens.js`/`public/`, `favicon.svg` sincronizado, `apple-touch-icon.png` 180×180 y declarado en `index.html`, guard estático de `LogoEva.jsx` (`aria-hidden="true"`, `focusable="false"`, sin `style`, clases `eva-logo-*`).
- Se extienden `site-nav-classes.test.mjs` (NavBrand monta `<LogoEva variante="simple"`, conserva `FC`, `navCode(BRAND_CODE)` y `sr-only`), `hero.test.mjs` (guard: el Hero NO referencia el logo) y `og-image.test.mjs` (glifo exactamente una vez, colores del logo de la fuente única, triangulación cambiando `logoColors`).

## Risks / Trade-offs

- [El boceto no convence a Facundo] → los ajustes se hacen en los SVG de `bocetos/` antes del apply; specs y tareas no cambian porque los tests verifican estructura (variantes, trazos, reglas de aletas, colores), no coordenadas exactas.
- [Glifo tapa el `h1` en anchos intermedios (md justo en 768 px)] → verificación de cajas con Playwright en 320/375/768/1024/1440 como tarea explícita.
- [El filo rojo de 0.15 unidades se pierde a 16 px] → aceptado: a 16 px se lee la silueta amarilla sobre negro; el filo y la sombra suman a partir de 32 px.
- [Safari viejo ignora el favicon SVG] → el `apple-touch-icon.png` cubre la pantalla de inicio de iOS; en pestañas, Safari cae al ícono genérico, igual que hoy.
- [`core.autocrlf` convierte `public/favicon.svg` a CRLF en Windows y la comparación byte a byte con `logoSvg` (LF) falla] → el test normaliza finales de línea (`\r\n` → `\n`) antes de comparar, o se agrega `*.svg text eol=lf` a `.gitattributes`; decidir en la tarea 7.1.
- [Puntas largas en los ingletes muy agudos (ápice ~31°, vértice izquierdo del reloj ~30°, unos 12 unidades)] → aceptado: es el vértice agudo que pidió Facundo; el lienzo se agrandó para no recortarlas.
- [Antialias: a 4× de zoom puede verse un hilo apenas más claro en la punta de algún inglete] → invisible a 640 px; si molestara, se calcula la unión real de los polígonos de un triángulo cerrado (sin dependencias).
- [Desincronización entre bocetos, `logo.js` y `public/`] → el boceto deja de ser fuente cuando se copia a `logo.js`; desde ahí la verdad es `logo.js` y los tests de D6/D7 atan los derivados.

## Migration Plan

1. Aprobación del boceto (bloqueante).
2. Apply por grupos de `tasks.md` (tokens → geometría → componente → barra → favicon/ícono → og-image → integración).
3. Rollback: revertir el merge; `favicon.svg` y `og-image.png` vuelven a la versión anterior desde git. No hay datos ni migraciones.

## Open Questions

- Ninguna que cambie specs o tareas. El desplazamiento de la sombra se afina en el checkpoint visual del apply.
