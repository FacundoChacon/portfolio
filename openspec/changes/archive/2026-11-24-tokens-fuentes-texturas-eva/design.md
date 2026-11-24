# Design

## Context

Ver `proposal.md` (Why). Estado actual relevante:

- `tailwind.config.js` define `dark-*`, `accent-*`, `neon-*`, `muted-*` y las familias `sans` (Rajdhani → Inter → system-ui), `display` (Orbitron) y `mono` (JetBrains Mono). El configurador usa `accent-*`/`neon-*` ~55 veces.
- `index.html` carga Inter, JetBrains Mono (400/500), Orbitron (400–900) y Rajdhani (300–700) desde Google Fonts, con `preconnect` a `fonts.googleapis.com` y `fonts.gstatic.com`.
- `vercel.json` sirve una CSP en modo enforcing con `style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com`. `scripts/lib/deploy-config.mjs` (`checkCsp`) solo exige que esas directivas no tengan fuentes inseguras (`HARDENED_DIRECTIVES`), no que sean exactamente `'self'`.
- `src/index.css`: `html { scroll-behavior: smooth }` incondicional; `:focus-visible { outline: 2px solid #00ffc3 }`; `.reveal*` ya tiene fallback para movimiento reducido.
- `useReveal` usa `IntersectionObserver`; `src/utils/motion.js` expone `prefersReducedMotion(matchMediaImpl)` puro e inyectable.
- El build pasa por `routeHtmlPlugin` (`writeBundle`), que clona `dist/index.html` para cada ruta pública; `verify:build` (`checkBuiltPages`) prohíbe scripts inline, atributos `on*` y assets con ruta relativa.
- Tests: solo `node --test "scripts/**/*.test.mjs"` sobre lógica pura (sin Vitest ni DOM). Pesos de clase en uso: 400/500/600/700 (+ un `font-black`, que en Rajdhani cae al 700 igual que hoy). `font-light` no se usa.

Gobernanza: MEDIUM para tokens/fuentes/utilidades; la parte de CSP es seguridad y se describe exacta en D5.

## Goals / Non-Goals

**Goals:**
- Tokens `eva.*` de una sola fuente de verdad, consumidos por Tailwind, por variables CSS y por los tests de contraste.
- Cero peticiones a Google Fonts y CSP de estilos/fuentes limitada a `'self'` en este mismo change.
- Utilidades de textura/panel listas para que los changes de sección solo las apliquen.
- Cambio visual casi nulo: las secciones y el configurador se ven igual (salvo el tono del anillo de foco).

**Non-Goals:**
- Aplicar la paleta, la serif o las texturas a ninguna sección (changes 2–8).
- Eliminar Rajdhani, Orbitron, `accent-*`, `neon-*`, `GlitchText`, `.glass`, `.cyber-grid`, etc. (`limpieza-cyberpunk`).
- Cambiar scrollbar, `::selection` u otros estilos base cyberpunk.

## Decisions

### D1. Paleta `eva` como módulo JS compartido

`src/styles/eva-tokens.js` exporta `EVA_COLORS` (hex) y `EVA_CONTRAST_PAIRS` (pares texto/fondo con su nivel: `normal` ≥ 4.5, `large` ≥ 3, `ui` ≥ 3). `tailwind.config.js` (ESM) importa `EVA_COLORS` en `theme.extend.colors.eva`; los tests importan ambos. Se agregan variables CSS en `:root` (`--eva-orange: theme('colors.eva.orange')`, …) para que las texturas y el foco usen el mismo token sin duplicar hex.

| Token | Hex | Uso |
|---|---|---|
| `eva-black` | `#050505` | Fondo principal |
| `eva-panel` | `#100E0C` | Fondo de paneles (negro cálido) |
| `eva-line` | `#2B2620` | Divisores/bordes **decorativos** (no componente de UI: 1.35:1) |
| `eva-paper` | `#EDE6D6` | Texto principal |
| `eva-gray` | `#A39C8E` | Texto secundario |
| `eva-gray-dim` | `#6B655B` | Bordes de componentes de UI (≥ 3:1), nunca texto |
| `eva-orange` | `#FF7A1A` | Acento principal, etiquetas, bordes |
| `eva-red` | `#E8202A` | Alertas: solo texto grande o decoración |
| `eva-purple` | `#8A4FD8` | Acento secundario: solo texto grande o decoración |
| `eva-green` | `#3DFF7A` | Fósforo: estados OK, código, **anillo de foco** |

Alternativas: renombrar `accent-*` a la nueva paleta (rompe el configurador y obliga a tocar ~55 usos ahora; descartado); hex sueltos en `tailwind.config.js` (sin fuente única para los tests; descartado).

#### Tabla de contraste (WCAG 2.x, luminancia relativa, valores truncados a 2 decimales)

| Texto / indicador | sobre `eva-black` | sobre `eva-panel` | sobre `eva-line` | Nivel declarado |
|---|---|---|---|---|
| `eva-paper` | 16.39 | 15.49 | 12.05 | normal (AA y AAA) |
| `eva-gray` | 7.47 | 7.06 | 5.49 | normal |
| `eva-orange` | 7.81 | 7.38 | 5.74 | normal |
| `eva-green` | 15.31 | 14.47 | 11.26 | normal |
| `eva-red` | 4.53 | **4.28** | 3.33 | **large / decoración** (falla 4.5 sobre panel) |
| `eva-purple` | 4.06 | 3.84 | **2.99** | **large / decoración**, solo sobre black/panel |
| `eva-gray-dim` | 3.53 | 3.33 | 2.59 | `ui` (bordes de controles), nunca texto |
| `eva-black` sobre `eva-orange` | 7.81 | — | — | normal (etiquetas con fondo naranja) |
| `eva-black` sobre `eva-green` | 15.31 | — | — | normal |
| `eva-paper` sobre `eva-red` | 3.61 | — | — | large (botón de alerta) |
| `eva-paper` sobre `eva-purple` | 4.03 | — | — | large |

Referencia de convivencia con el sitio actual: `eva-green` sobre `dark` `#030303` = 15.50 y sobre `dark-card` `#111116` = 14.14 (foco en secciones aún no migradas). `EVA_CONTRAST_PAIRS` codifica exactamente las filas anteriores con su nivel; el test falla si alguna queda debajo de su umbral.

### D2. Helper de contraste puro en `scripts/lib/contrast.mjs`

`relativeLuminance(hex)` y `contrastRatio(a, b)` (fórmula WCAG 2.x, umbral sRGB 0.04045) más `checkContrastPairs(colors, pairs)` que devuelve errores legibles (`"eva-red sobre eva-panel: 4.28 < 4.5 (normal)"`). Vive en `scripts/lib` porque solo lo usa la verificación; no entra al bundle.

### D3. Tipografías: @fontsource, solo latin, mismos nombres de familia

- **Títulos: Noto Serif Display variable** (`@fontsource-variable/noto-serif-display`). Verificado en el paquete 5.3.0: expone `wdth.css` con `font-stretch: 62.5% 100%` y `font-weight: 100 900` en un único archivo `noto-serif-display-latin-wdth-normal.woff2` (~76 KB). El eje de ancho existe → no hace falta el plan B (Libre Caslon Condensed, que solo llega a 700 y no es variable).
- **Etiquetas/código: JetBrains Mono variable** (`@fontsource-variable/jetbrains-mono`, `latin-wght-normal`, ~40 KB, 100–800).
- **Rajdhani y Orbitron se autoalojan ya** (`@fontsource/rajdhani` latin 400/500/600/700, ~15 KB c/u; `@fontsource-variable/orbitron` latin wght, ~12 KB). Justificación: es la opción que minimiza roturas — mismas familias y pesos que hoy, sin depender de un tercero — y es la única que permite endurecer la CSP en este change. Mantenerlas en Google obligaría a dejar la CSP abierta hasta `limpieza-cyberpunk` y a mantener dos mecanismos de carga en paralelo. El costo (dos dependencias que luego se borran) es menor. **Inter no se autoaloja**: solo era fallback de Rajdhani; con Rajdhani local el fallback pasa a `system-ui` (el stack de Tailwind no se toca).
- **Mecanismo**: `src/styles/fonts.css` declara `@font-face` propios, solo subset latin, con los **mismos `font-family` que hoy** (`'Rajdhani'`, `'Orbitron'`, `'JetBrains Mono'`) y `'Noto Serif Display'`, apuntando a los `.woff2` de los paquetes; Vite los copia a `dist/assets/` con hash. Así `fontFamily.sans/display/mono` de Tailwind siguen igual y nada cambia visualmente. Para Rajdhani se pueden importar directamente `@fontsource/rajdhani/latin-{400,500,600,700}.css` (ya son latin-only y declaran `'Rajdhani'`). `font-display: swap` en todas (igual que el `display=swap` actual). `src/main.jsx` importa `./styles/fonts.css` antes de `./index.css`.
  - Se descartan los `wght.css`/`wdth.css` de los paquetes variables porque declaran familias `'… Variable'` (obligaría a tocar Tailwind) e incluyen todos los subsets (cirílico, griego, vietnamita…), que Vite copiaría a `dist/` aunque no se descarguen.
  - **Resultado del spike 3.1 (apply)**: el especificador de paquete en `url()` funciona; Vite emite `/assets/<nombre>-<hash>.woff2`. No hace falta el fallback. Tampoco hizo falta el fallback de D4: `ctx.bundle` en `transformIndexHtml` (`order: 'post'`) sí trae los `.woff2`.
  - Resolución de `url()`: primero `url('@fontsource-variable/…/files/….woff2')` (Vite resuelve especificadores de paquete en `url()` de CSS); si el spike de la tarea 3.1 muestra que no, se usa ruta relativa a `node_modules`. En ambos casos el resultado en `dist` es `/assets/<nombre>-<hash>.woff2`.
- **Tailwind**: nueva familia `fontFamily['eva-display'] = ['"Noto Serif Display"', 'Georgia', 'serif']`; la mono reutiliza `font-mono`. Tailwind 3 no trae `font-stretch`, así que se agregan en `@layer utilities` `.font-stretch-condensed { font-stretch: 75% }` y `.font-stretch-extra-condensed { font-stretch: 62.5% }`. Ninguna clase nueva se usa todavía.

### D4. Precarga de la fuente principal en el build

- La fuente "principal del primer render" **hoy** es Rajdhani 400 (texto de cuerpo de la home y del configurador). Precargar Noto Serif Display ahora sería un error: ninguna sección la usa todavía y Chrome advierte "preloaded but not used". Por eso la precarga se parametriza con una constante `PRELOAD_FONT_STEMS = ['rajdhani-latin-400-normal']` en `scripts/lib/font-preload.mjs`; el change `hero-brutalista` la cambiará a `noto-serif-display-latin-wdth-normal` cuando el título la use.
- `font-preload.mjs` exporta funciones puras: `findFontAssets(fileNames, stems)` (empareja `assets/<stem>-<hash>.woff2`; error si falta o hay más de uno) y `fontPreloadTags(hrefs)` (descriptores `{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href, crossorigin: true }, injectTo: 'head' }`). Un plugin `fontPreloadPlugin()` usa `transformIndexHtml` (`order: 'post'`, solo build) con `ctx.bundle` para inyectarlos en `index.html`; `routeHtmlPlugin` ya clona ese HTML a `/configurador/index.html`, así que ambas páginas heredan la precarga. `crossorigin` es obligatorio en precargas de fuentes (si no, el navegador la descarga dos veces). No hay atributos `on*` ni scripts.
- Alternativa descartada: copiar los `.woff2` a `public/fonts/` con nombre fijo y precargar a mano en `index.html` (duplica binarios en el repo, pierde el hash para caché inmutable y desacopla la versión del paquete).

### D5. CSP endurecida (seguridad — cambio exacto)

`vercel.json`, valor de `Content-Security-Policy`:

```
ANTES:  default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://script.google.com https://script.googleusercontent.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
DESPUÉS: default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://script.google.com https://script.googleusercontent.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

Solo cambian `style-src` y `font-src` (se quitan los dos hosts de Google). No se agrega `'unsafe-inline'`: los estilos `style={}` de React se aplican vía CSSOM y no los bloquea `style-src`; la CSS del build es un archivo de `'self'`. Las fuentes del build son archivos `.woff2` > 4 KB, así que Vite no las inlinea como `data:` (que `font-src 'self'` bloquearía); la verificación de build lo detectaría porque la precarga no encontraría el asset.

`scripts/lib/deploy-config.mjs`: `REQUIRED_CSP` pasa a exigir además `'style-src': ["'self'"]` y `'font-src': ["'self'"]` (coincidencia exacta, mismo mecanismo y mensajes que `default-src`). `HARDENED_DIRECTIVES` conserva `style-src`/`font-src` (el test existente de fuentes inseguras sigue pasando: ahora hay dos errores por caso) e `img-src` con `data:`. `scripts/deploy-config.test.mjs`: el fixture `CSP_OK` pasa a la nueva CSP y se agregan casos RED (Google en `style-src`, Google en `font-src`, directiva faltante). Spec: delta de `cabeceras-de-seguridad`. Docs: línea CSP de `knowledge-base/08_arquitectura_propuesta.md`.

Rollback: revertir `vercel.json` + `REQUIRED_CSP` + `index.html` en un solo commit (no hay estado persistente).

### D6. Verificación post-build de fuentes

`extractHeadMeta` (en `scripts/lib/route-html.mjs`) suma `preloads: [{ href, as, type, crossorigin }]` y `externalOrigins` (hosts de cualquier `href`/`src` absoluto). `checkBuiltPages(pages, { preloadStems, assetExists })` agrega: por página, una precarga `as=font`/`type=font/woff2`/`crossorigin` por cada stem con `href` que empiece por `/assets/<stem>-` y termine en `.woff2`; `assetExists(href)` verdadero (inyectado: `verify-build.mjs` pasa `existsSync` sobre `dist/`, los tests un `Set`); y ningún `fonts.googleapis.com` / `fonts.gstatic.com`. Parámetros con valores por defecto para no romper llamadas existentes.

### D7. Texturas y paneles (CSS en `src/index.css`, `@layer components`)

- **Grilla hexagonal** `.eva-hex-grid`: `::before` absoluto con `mask-image: url("data:image/svg+xml,…")` (SVG de un hexágono en celda repetible, contorno 1px) y `background-color: var(--eva-hex-color, rgb(255 122 26 / .12))`, `pointer-events: none`, `z-index: -1` con `isolation: isolate` en el contenedor (así el texto queda encima sin tocar el `position` de los hijos). Máscara + color permite variar el tono con una variable sin regenerar el SVG. `data:` en `mask-image` cae bajo `img-src`, que ya permite `data:`. Alternativa descartada: archivo en `public/` (una petición más y color fijo).
- **Franjas de advertencia** `.eva-stripes` (`repeating-linear-gradient(-45deg, var(--eva-stripe-a) 0 10px, var(--eva-stripe-b) 10px 20px)`), con variantes `.eva-stripes-red`; uso decorativo (bandas, bordes), nunca detrás de texto.
- **Panel de sistema** `.eva-panel` (fondo `eva-panel`, borde 1px `eva-orange/40`, sin radio, `position: relative`), `.eva-panel-label` (cápsula superior izquierda: mono, mayúsculas, `text-[11px]` tracking amplio, fondo `eva-orange`, texto `eva-black` = 7.81:1) y `.eva-panel-code` (superior derecha, mono, `eva-gray`). Los textos de label/código son contenido real (legibles por lectores), la decoración no.
- **Etiqueta** `.eva-tag` (mono, mayúsculas, borde `eva-gray-dim`, texto `eva-paper`). La `.tag` actual no se toca.
- Por estar en `@layer components`, Tailwind las purga mientras ninguna plantilla las use: costo cero en el CSS de producción hasta que una sección las adopte (la verificación visual de las utilidades se hace en `npm run dev` con una página de prueba temporal que **no** se commitea).

### D8. Foco y movimiento

- `:focus-visible { outline: 2px solid var(--eva-focus); outline-offset: 2px; }` con `--eva-focus: theme('colors.eva.green')`. Verde en vez de naranja: el naranja va a ser el color de bordes y etiquetas, así que un anillo naranja no se distinguiría del estado normal; además `#3DFF7A` es casi el mismo tono que el `#00ffc3` actual (cambio visual mínimo en el configurador). Con `outline-offset` el anillo se dibuja sobre el fondo circundante (negro/panel: ≥ 14:1), no sobre el relleno del control.
- `scroll-behavior: smooth` se mueve dentro de `@media (prefers-reduced-motion: no-preference)`.
- Revelado: `.eva-reveal` (opacity + `translateY(16px)`, `transition` solo de `opacity`/`transform`) y `.eva-reveal.is-visible`; bajo `prefers-reduced-motion: reduce` queda visible y sin transición. `useReveal` extrae la decisión inicial a una función pura `shouldRevealImmediately({ reducedMotion, hasIntersectionObserver })` (en `src/utils/motion.js`, testeable) y, si devuelve `true`, marca visible sin crear el observer. Las `.reveal*` existentes no cambian.
- Guard estático `scripts/sistema-visual.test.mjs` (mismo patrón que `a11y-classes.test.mjs`): `scroll-behavior: smooth` solo dentro del bloque `no-preference`; `.eva-reveal` tiene override en `reduce`; `:focus-visible` usa `var(--eva-focus)`; `index.html` no referencia Google Fonts; `tailwind.config.js` mantiene `accent-*`/`neon-*` y expone `eva`.

## Risks / Trade-offs

- [Vite no resuelve el especificador de paquete en `url()`] → spike en 3.1; fallback a ruta relativa a `node_modules`. El resultado se valida con `verify:build`.
- [`ctx.bundle` sin el `.woff2` en `transformIndexHtml`] → `findFontAssets` lanza y el build falla (no pasa silencioso); fallback: inyectar la precarga en `routeHtmlPlugin.writeBundle(_, bundle)`, que ya reescribe todos los HTML.
- [Fallback de glifos: caracteres fuera del subset latin de Rajdhani hoy caían a Inter de Google y ahora caen a `system-ui`] → el contenido es español (cubierto por latin, U+0000–00FF); revisión visual en 5.x.
- [Noto Serif Display pesa ~76 KB con el eje `wdth`] → no se precarga hasta que la use el hero; `font-display: swap`; solo subset latin. Trade-off aceptado frente a la versión `wght` (~41 KB) que no condensa.
- [CSP más estricta bloquea algo no inventariado (p. ej. un `<link>` externo olvidado)] → tests de `index.html` y de `checkBuiltPages`, y recorrido manual con la consola abierta sobre `vite preview` y sobre el preview de Vercel antes de mergear.
- [Rajdhani/Orbitron agregan dependencias que se borran en `limpieza-cyberpunk`] → documentado en ese change; son ~75 KB en `dist` y solo se descargan los pesos usados.
- [`.eva-*` purgadas no se pueden revisar en el build de producción] → verificación en dev con página de prueba no commiteada.

## Migration Plan

1. Merge en `rediseno-evangelion`; deploy de preview en Vercel; recorrido manual (home + `/configurador` + envío de lead) con consola abierta, verificando cero violaciones de CSP y cero peticiones a Google.
2. Rollback: revertir el commit (CSP, `index.html` y fuentes vuelven juntos).
3. `hero-brutalista` cambia `PRELOAD_FONT_STEMS`; `limpieza-cyberpunk` elimina `@fontsource/rajdhani`, `@fontsource-variable/orbitron`, sus `@font-face` y los tokens `accent-*`/`neon-*`.
