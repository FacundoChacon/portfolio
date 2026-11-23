# Design

## Context

Ver `proposal.md` (Why). Estado actual relevante:

- `src/components/Hero.jsx` (≈90 líneas): `section#presentacion` `min-h-screen pt-24`, fondo `cyber-grid` + dos manchas `blur-[120px]` (`accent-green`/`accent-pink`), grilla `md:grid-cols-2` con el retrato **primero en desktop** vía `order-*` (en móvil va después del texto: el orden visual y el del DOM difieren). Retrato `<img src="/profile.webp">` con tamaño fijo por CSS (`h-[420px] w-[340px] md:h-[520px] md:w-[440px] object-cover`), **sin** `width`/`height` ni `fetchpriority`; marco con degradado difuminado + `box-glow-cyan`; rótulo "// online". `h1` en `font-display` (Orbitron) con "Chacón" `text-glow-cyan animate-flicker`. CTA "Ver proyectos" (`#proyectos`) + íconos GitHub/LinkedIn con `aria-label`, `target="_blank" rel="noreferrer"`.
- `public/profile.webp`: 900×1600 (cabecera VP8), ~58 KB. Es el LCP en escritorio; en 375px el retrato queda debajo del texto y el LCP puede ser el `h1` o el párrafo.
- Tokens y utilidades disponibles (`tokens-fuentes-texturas-eva`): `eva-*` en Tailwind (`src/styles/eva-tokens.js`, `EVA_COLORS`, `EVA_CONTRAST_PAIRS`), variables `--eva-*`, `font-eva-display` (`"Noto Serif Display", Georgia, serif`), `.font-stretch-condensed` (75%) / `.font-stretch-extra-condensed` (62.5%), `.eva-hex-grid` (pseudo-elemento `z-index:-1`, color `var(--eva-hex-color, rgb(255 122 26 / 0.12))`), `.eva-stripes`, `.eva-panel`, `.eva-panel-label`, `.eva-panel-code`, `.eva-tag`, `.eva-reveal`, foco global `:focus-visible` con `--eva-focus`. Contraste: `scripts/lib/contrast.mjs` (`contrastRatio`, `checkContrastPairs`).
- Fuentes: `src/styles/fonts.css` declara Noto Serif Display variable (`wght` 100–900 y `wdth` 62.5–100%, un solo archivo `noto-serif-display-latin-wdth-normal.woff2`, ~76 KB), JetBrains Mono, Orbitron y Rajdhani (400–700, ~15 KB c/u). Precarga: `PRELOAD_FONT_STEMS = ['rajdhani-latin-400-normal']` → `fontPreloadPlugin` la inyecta en `index.html` y `routeHtmlPlugin` clona ese HTML a **todas** las rutas (`/` y `/configurador`); `verify-build.mjs` exige la precarga en cada página del sitemap.
- `navbar-brutalista-glass` (en implementación): barra fija de 70px (`--eva-nav-h`, `scroll-padding-top`), `NavBrand` con `font-eva-display` montado en la home **y** en la cabecera de `/configurador`; `blendOver(fgHex, bgHex, alpha)` ya está en `contrast.mjs` (su D6). `proyectos-scroll-horizontal`: cards brutalistas (`border-2`, sombra sólida `6px 6px 0 0` naranja, códigos `UNIT-0X` `aria-hidden`), sin `backdrop-filter`.
- Tests: `node --test "scripts/**/*.test.mjs"`, sin DOM. Guards estáticos sobre fuentes (`a11y-classes.test.mjs`, `sistema-visual.test.mjs`).

Gobernanza: LOW para estilos, datos y guards; MEDIUM para la precarga de fuente y el LCP (decisiones D3–D6 expuestas para revisión).

## Goals / Non-Goals

**Goals:**
- Hero brutalista construido solo con tokens/utilidades `eva` (cero hex en JSX, cero `accent-*`/`neon-*`/`dark-*`/`*glow*`/`flicker`/`blur`/`rounded*`).
- Orden del DOM = orden visual en todos los anchos.
- LCP no peor (+10% de margen) y CLS ≤ 0.1, medidos antes/después.
- Una sola precarga de fuente, la del título, sin advertencias en ninguna ruta.

**Non-Goals:**
- Borrar `cyber-grid`, `text-glow-*`, `box-glow-*`, `animate-flicker` ni keyframes globales (`limpieza-cyberpunk`).
- Precargar la imagen del retrato con `<link rel="preload" as="image">` (necesita HTML distinto por ruta; ver Open Questions).
- Cambiar textos de marketing (la descripción se conserva tal cual) o agregar acciones nuevas.
- Tocar `fonts.css`, el stack de `font-eva-display` ni la CSP.

## Decisions

### D1. Datos en `src/data/presentacion.js` (puro, testeable)

```js
export const PERFIL = { nombre: 'Facundo', apellido: 'Chacón', rol: 'Full Stack Developer', especialidad: 'Java / React' }
export const FICHA = [            // filas del panel de sistema, en orden
  { id: 'rol',       etiqueta: 'Rol',       valor: 'Full Stack Developer' },
  { id: 'stack',     etiqueta: 'Stack',     valor: 'Java 17 · Spring Boot · React' },
  { id: 'ubicacion', etiqueta: 'Ubicación', valor: 'Maipú, Mendoza, AR' },
  { id: 'estado',    etiqueta: 'Estado',    valor: 'Operativo · disponible', tono: 'ok' },
]
export const ENLACES_PERFIL = [
  { id: 'github',   label: 'GitHub',   href: 'https://github.com/FacundoChacon' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/facundo-chacon-61362735a' },
]
export const RETRATO = { src: '/profile.webp', width: 900, height: 1600, alt: 'Retrato de Facundo Chacón' }
export function nombreCompleto(perfil)   // `${nombre} ${apellido}` (trim de cada parte)
export function externalLinkProps()      // { target: '_blank', rel: 'noopener noreferrer' }
```

- El JSX itera `FICHA` y `ENLACES_PERFIL`; el test valida orden, ids, URLs `https://`, que el estado tenga texto (no solo color) y que `RETRATO.width/height` coincidan con la cabecera VP8 de `public/profile.webp`.
- `rel` pasa de `noreferrer` a `noopener noreferrer` (explícito; `noreferrer` ya implica `noopener`, pero el guard busca el par).
- Alternativa descartada: módulo compartido con `Contact` para las URLs. Los dos changes pueden aplicarse en paralelo y en cualquier orden; la unificación de URLs (también `GITHUB_PERFIL_URL` de proyectos) queda para `limpieza-cyberpunk`.

### D2. Composición asimétrica y orden del DOM

```
section#presentacion.eva-hex-grid.bg-eva-black (min-h-screen pt-24, relative, overflow-x-clip)
└ div.max-w-6xl grid md:grid-cols-12 gap-y-12 md:gap-x-8
  ├ div md:col-span-7  (columna de texto, primero en el DOM y en pantalla)
  │  ├ p aria-hidden  "01 // PRESENTACIÓN"                    (mono, eva-orange)
  │  ├ h1  <span block nowrap>Facundo</span><span block nowrap text-eva-orange>Chacón</span>
  │  ├ p   rol · especialidad                                  (mono uppercase, eva-paper)
  │  ├ p   descripción (texto actual)                          (eva-gray)
  │  └ div acciones: "Ver proyectos" (bloque naranja) + GitHub + LinkedIn (bloques con texto)
  └ div md:col-span-5 md:mt-16 (columna del retrato, desplazada hacia abajo = asimetría)
     ├ figure  marco duro + .eva-panel-label "REG // RETRATO" + .eva-panel-code "IMG-01" (aria-hidden)
     │         + franja vertical .eva-stripes a la derecha (aria-hidden)
     └ dl.eva-panel  ficha de sistema (label "SYS // FICHA", code "FC-01"), solapa el borde
                     inferior del retrato en md+ (`md:-mt-10 md:-ml-8`, z-10)
└ div.eva-stripes h-3 aria-hidden (franja de advertencia al pie de la sección)
```

- En móvil todo apila en el orden del DOM (texto → retrato → ficha); se eliminan los `order-*` (1.3.2/2.4.3: orden de lectura = orden visual).
- El retrato pasa a la derecha en escritorio. La asimetría la dan el `col-span-7/5`, el desplazamiento vertical de la columna del retrato, el solapamiento de la ficha y la franja vertical, sin `transform` (no afecta layout ni hit-testing).
- `bg-eva-black` explícito en la sección (el `<main>` usa `bg-dark` #030303): los pares de contraste se calculan contra `eva-black`.
- `overflow-x-clip` en la sección para que los solapamientos negativos nunca generen scroll horizontal (sin crear contenedor de scroll: no rompe `sticky` de otras secciones).
- `pt-24` (96px) se mantiene: supera los 70px de la barra.

### D3. Retrato: LCP y CLS

- `<img src={RETRATO.src} width={900} height={1600} alt=… fetchpriority="high" decoding="async" className="block aspect-[4/5] w-full object-cover" />` dentro de un contenedor `max-w-[440px]` (móvil `max-w-[320px] mx-auto`). El tamaño final lo fija el CSS (ancho de columna + `aspect-[4/5]`), así que el recuadro existe antes de que llegue un solo byte; los atributos `width`/`height` son los intrínsecos reales (no inventados) para que el UA tenga relación de aspecto aun si el CSS fallara.
- `fetchpriority` en minúscula: React 18.3 no reconoce `fetchPriority` (camelCase, React 19) y lo advertiría; el atributo en minúscula se pasa tal cual al DOM.
- Sin `loading="lazy"` (el guard lo prohíbe). Sin filtros CSS, sin `opacity:0` ni animación sobre el `<img>`: un elemento con opacidad 0 no es candidato a LCP hasta que se vuelve visible, y animarlo retrasaría el LCP.
- Marco: `border-2 border-eva-orange bg-eva-panel shadow-[10px_10px_0_0_var(--eva-purple)]` (sombra sólida decorativa; la frontera la identifica el borde naranja, 7.81:1 sobre negro). Sin degradado sobre la foto.
- Alternativa descartada: `<picture>` con versión 440px para móvil. Ahorraría bytes, pero requiere generar assets nuevos; se evalúa solo si la medición (D6) muestra regresión.

### D4. Título estable ante el swap de fuente (CLS por construcción)

- `h1` en `font-eva-display font-stretch-extra-condensed font-black uppercase leading-[0.86] tracking-tight`, texto real "Facundo Chacón" (las mayúsculas son CSS, el nombre accesible no cambia).
- Cada parte en `<span className="block whitespace-nowrap">`: siempre exactamente 2 líneas. Con `line-height` sin unidad, el alto de cada línea es `font-size × 0.86` sea cual sea la fuente (Georgia de respaldo o Noto): el swap no cambia el alto del `h1` ni mueve lo que sigue.
- Tamaño calculado para que **la fuente de respaldo** (Georgia bold, sin eje de ancho: `font-stretch` se ignora, ≈5.3em para "FACUNDO") quepa en la columna: `text-[15vw] md:text-[9vw] xl:text-[7.25rem]` (≈56px a 375px; ≈69px a 768px; 116px a ≥1280px). Con Noto condensada el texto ocupa ~60% de ese ancho; se acepta el aire sobrante a cambio de no desbordar durante el swap.
- Alternativa descartada: fallback con `size-adjust`/`ascent-override` (`@font-face` local de Georgia ajustada). Es la técnica "fina" para CLS de fuentes, pero obliga a tocar `fonts.css` y el stack de `font-eva-display` que fija `sistema-visual.test.mjs` (dueño: change de tokens), y el ancho condensado no se puede imitar con `size-adjust` sin achicar el alto. Las líneas fijas resuelven el CLS sin tocar la base.

### D5. Precarga: `PRELOAD_FONT_STEMS = ['noto-serif-display-latin-wdth-normal']` (reemplaza a Rajdhani)

Opciones evaluadas:

| Opción | Pro | Contra |
|---|---|---|
| A. Solo Rajdhani (status quo) | 15 KB | El título enorme del hero (y posible LCP en móvil) se pinta con Georgia y cambia de forma al llegar Noto; la precarga apunta a una familia que se retira en `limpieza-cyberpunk`. |
| B. Rajdhani + Noto | Ambas a tiempo | ~91 KB de alta prioridad compitiendo con el JS (que es quien descubre el `<img>`, renderizado en cliente) → riesgo directo de empeorar el LCP. |
| **C. Solo Noto (elegida)** | Una precarga; cubre el elemento más visible del primer render y el posible LCP de móvil; la familia que queda tras la limpieza | 76 KB vs 15 KB: más bytes tempranos (se mide en D6). Rajdhani (texto de cuerpo chico) hace swap sin precarga: impacto visual menor y sin CLS relevante en párrafos de ancho fijo. |
| D. Precarga distinta por ruta | Precisión | `routeHtmlPlugin` clona una sola plantilla; requiere extender `renderRouteHtml` y `verify:build`. Fuera de alcance para una ganancia marginal. |

- **"Preloaded but not used" en `/configurador`**: no ocurre porque `NavBrand` (`font-eva-display`) se renderiza en la cabecera del configurador desde el primer render (`navbar-brutalista-glass`). Un guard lo asegura: `Configurador.jsx` importa y monta `NavBrand` y `NavBrand.jsx` contiene `font-eva-display`; si alguien lo quita, el test falla antes de que aparezca la advertencia en producción.
- Coherencia stem ↔ CSS: función pura nueva `missingFontStems(fontsCss, stems)` en `font-preload.mjs` (stems cuyo `<stem>.woff2` no aparece en ningún `url()` de `fonts.css`); el test exige `[]` para `PRELOAD_FONT_STEMS`. `findFontAssets` ya garantiza en build que el archivo con hash exista y sea único; `verify:build` ya verifica cada página sin cambios de código.
- Plan B (si D6 muestra regresión de LCP > 10% atribuible a la precarga): volver a la opción A y documentarlo; el título sigue sin CLS gracias a D4. La spec `sistema-visual` se cumple con cualquiera de las dos.

### D6. Protocolo de medición (antes/después)

- Build de producción local: `npm run build && npm run preview` (puerto 4173). Playwright, contexto nuevo por corrida (caché fría), 5 corridas por viewport (1440×900 y 375×812), CDP: `Emulation.setCPUThrottlingRate {rate: 4}` y `Network.emulateNetworkConditions {latency: 150, downloadThroughput: 1.6 Mbps/8, uploadThroughput: 750 Kbps/8}`.
- En la página: `PerformanceObserver` con `buffered: true` para `largest-contentful-paint` (último `startTime`, `element.tagName`/`currentSrc`) y `layout-shift` (suma de `value` sin `hadRecentInput`), leídos tras `load` + 3 s.
- **Baseline antes de tocar código** (tarea 1.2), registrada en `tasks.md` junto a la tarea. Aceptación: mediana de LCP ≤ baseline × 1.10 en cada viewport; CLS ≤ 0.1. En 1440 el elemento LCP debe ser el `<img>` de `profile.webp`.
- Chequeo extra de D4: una corrida a 375 y 768 bloqueando el `.woff2` de Noto (`page.route(/noto-serif-display.*\.woff2/, r => r.abort())`): `document.documentElement.scrollWidth === innerWidth` y alto del `h1` igual al de la corrida con fuente.

### D7. Movimiento

- Keyframe nuevo en `tailwind.config.js`: `evaBoot` (`0%: clip-path: inset(0 100% 0 0)` → `100%: clip-path: inset(0 0 0 0)`) y animación `'eva-boot': 'evaBoot 0.36s steps(6, end) both'`: barrido escalonado tipo terminal. `clip-path` no altera layout (sin CLS) ni la caja de hit-testing.
- Se aplica solo con `motion-safe:animate-eva-boot` a la franja del pie, la ficha y el grupo de acciones, con retardos `motion-safe:[animation-delay:120ms|240ms]` (total ≤ 0.6 s). Con `reduce`, Tailwind no emite la animación: estado final desde el primer frame. **Nunca** en el `<img>` ni en el `h1`.
- Hover de bloques: `motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5` + sombra más larga, `motion-safe:transition-[transform,box-shadow,color,background-color] motion-safe:duration-150`; con `reduce`, solo cambio instantáneo de color/sombra (mismo criterio que la navbar D3). Las mismas clases con `focus-visible:` para que el estado de teclado sea igual de visible que el de hover (más el anillo verde global).
- Alternativa descartada: `useReveal` + `.eva-reveal` (IntersectionObserver). El hero ya está en pantalla al cargar: el observer solo agrega un frame de `opacity:0` y JS en el camino crítico.

### D8. Acciones (bloques duros)

- "Ver proyectos": `<a href="#proyectos">` `border-2 border-eva-orange bg-eva-orange text-eva-black font-mono text-sm font-bold uppercase tracking-[0.2em] px-6 py-3 shadow-[6px_6px_0_0_var(--eva-purple)]` + `ArrowDown` `aria-hidden`. Hover/foco: sombra `8px 8px` y traslación `motion-safe`.
- GitHub / LinkedIn: bloques con ícono + texto visible ("GitHub", "LinkedIn") + `<span className="sr-only"> (se abre en una pestaña nueva)</span>`; `border-2 border-eva-gray-dim bg-eva-black text-eva-paper`, hover/foco `border-eva-orange text-eva-orange shadow-[4px_4px_0_0_var(--eva-orange)]`. Se reemplaza `aria-label` por texto visible (2.5.3: el nombre accesible empieza con la etiqueta visible). `min-h-11` (44px).
- Sin clases de foco propias que anulen el anillo global (`a11y-classes.test.mjs`).

### D9. Contraste

Pares de la sección (declarados en el test como `HERO_CONTRAST_PAIRS` y evaluados con `checkContrastPairs`): `paper/black`, `gray/black`, `orange/black` (normal); `black/orange` (CTA, normal); `paper/panel`, `gray/panel`, `green/panel`, `orange/panel` (ficha, normal); `gray-dim/black` (borde de acción, `ui`). Todos ya cumplen en la tabla del change de tokens; el test documenta cuáles usa el hero y falla si un token cambia.

Texto sobre la grilla hex: el test extrae el alpha del fallback de `--eva-hex-color` en `src/index.css`, compone `blendOver(EVA_COLORS.orange, EVA_COLORS.black, alpha)` y verifica `paper`, `gray` y `orange` ≥ 4.5 sobre esa mezcla. Triangulación: con alpha 0.6 el `gray` cae a ≈2.2 (falla) → protege contra subir la opacidad de la grilla. `blendOver(fgHex, bgHex, alpha)` (color `fg` con opacidad `alpha` sobre `bg`) ya lo agregó `navbar-brutalista-glass` (D6) a `scripts/lib/contrast.mjs`; se reutiliza sin cambios. El guard prohíbe redefinir `--eva-hex-color` en `Hero.jsx`.

Prohibidos en `Hero.jsx` como color de texto: `text-eva-red`, `text-eva-purple` (solo texto grande en la tabla), `text-eva-gray-dim` (nunca texto). Rojo y violeta quedan para decoración (sombras, franjas).

### D10. Tests (Strict TDD, `node --test`)

- `scripts/hero.test.mjs`:
  - Datos: `nombreCompleto(PERFIL) === 'Facundo Chacón'` y triangulación con otras entradas/espacios; `FICHA` con ids `rol, stack, ubicacion, estado` en orden, `estado` con `tono: 'ok'` y valor textual no vacío; `ENLACES_PERFIL` `https://` y ids únicos; `externalLinkProps()` exacto; `RETRATO.width/height` = cabecera VP8 de `public/profile.webp` (lector de 10 líneas en el test).
  - Guard de `Hero.jsx` (helper `findForbiddenTokens` de `scripts/lib/class-guard.mjs`): prohíbe `accent-`, `neon-`, tokens `*-dark`/`dark-*`, `glow`, `glitch`/`GlitchText`, `flicker`, `cyber-grid`, `blur-`, `backdrop-`, `rounded`, clase `font-display` (no `font-eva-display`), `text-white`, `text-gray-\d`, hex literales, `loading="lazy"`, `order-`, `--eva-hex-color`, `text-eva-red|purple|gray-dim`, cualquier `animate-*` sin `motion-safe:` y cualquier `hover:*translate*` sin `motion-safe:`. Exige `id="presentacion"`, exactamente un `<h1`, `font-eva-display`, `font-stretch-`, `whitespace-nowrap`, `eva-hex-grid`, `eva-stripes`, `eva-panel-label`, `fetchpriority="high"`, `aria-hidden`, `sr-only`, uso de `RETRATO`/`FICHA`/`ENLACES_PERFIL`/`externalLinkProps`.
  - Un solo `h1` en la home: ningún otro componente montado en `Home.jsx` contiene `<h1`.
  - Contraste (D9).
  - Animación: `tailwind.config.js` define `animation['eva-boot']` con `evaBoot` y el keyframe usa solo `clip-path` (sin `top/left/width/height/margin`).
- `scripts/lib/class-guard.mjs` + `scripts/class-guard.test.mjs`: `findForbiddenTokens(source, rules)` → `[{ rule, match }]`, puro, con reglas regex; tests de detección, de no falsos positivos (`font-eva-display` no dispara `font-display`; `motion-safe:animate-x` no dispara la regla de animación) y de variantes (`hover:`, `md:`). Lo crea el primero de `hero-brutalista`/`contacto-brutalista` que se aplique; el segundo lo reutiliza.
- `scripts/font-preload.test.mjs`: la expectativa de `PRELOAD_FONT_STEMS` pasa a Noto; `missingFontStems` (presente → `[]`, ausente → `[stem]`, `latin-ext` no cuenta); `missingFontStems(fonts.css, PRELOAD_FONT_STEMS)` → `[]`; guard de uso por ruta (Hero y `NavBrand` usan `font-eva-display`; `Configurador.jsx` monta `NavBrand`).
- `scripts/a11y-classes.test.mjs`: suma `src/components/Hero.jsx` a los archivos inspeccionados.

## Risks / Trade-offs

- [La precarga de 76 KB compite con el bundle JS que descubre el `<img>` (render en cliente) y empeora el LCP] → medición D6 con baseline; plan B de D5 (volver a Rajdhani) si supera +10%.
- [`NavBrand` aún no montado en `/configurador` cuando se aplique este change (navbar en curso)] → tarea 1.1 lo verifica; el guard de D10 falla si falta. Si la navbar se retrasa, este change espera o mantiene Rajdhani.
- [El `h1` dimensionado para Georgia se ve "chico" con Noto condensada en pantallas anchas] → `xl:text-[7.25rem]` y ajuste visual en la verificación; la regla es "nunca desbordar con el respaldo", no un tamaño exacto.
- [Solapamiento de la ficha sobre el retrato tapa parte de la foto en md] → se solapa solo el borde inferior (40px) y en escritorio; en móvil no hay solapamiento.
- [Conflictos en `tailwind.config.js` / `a11y-classes.test.mjs` con otros changes del rediseño] → cambios aditivos (una animación, un archivo en una lista); se resuelven en merge sin pisar entradas ajenas.
- [`overflow-x-clip` sin soporte (Safari < 16)] → cae a `visible`; la verificación a 375px controla `scrollWidth`; si aparece scroll, se reducen los márgenes negativos en ese ancho.

## Migration Plan

1. Aplicar después de `tokens-fuentes-texturas-eva` y `navbar-brutalista-glass` en `rediseno-evangelion`.
2. `npm run ci` verde (incluye `verify:build` con la nueva precarga) y medición D6.
3. Preview de Vercel: recorrido Playwright de `/` y `/configurador/` con la CSP de producción; consola sin advertencias de precarga ni violaciones de CSP.
4. Rollback: revertir el commit (sin estado persistente; la constante de precarga vuelve a Rajdhani con el revert).

## Open Questions

- ¿Precargar `profile.webp` solo en la home (`<link rel="preload" as="image" fetchpriority="high">`)? Es la mejora de LCP más grande disponible (el `<img>` hoy se descubre recién al ejecutar React), pero requiere HTML por ruta (opción D de D5). Candidato a un change de rendimiento aparte; no cambia esta spec.
- Copy exacto de la ficha ("Operativo · disponible", stack listado) y de los rótulos ("REG // RETRATO", "SYS // FICHA"): ajustables en la verificación visual sin tocar la spec.
