# Design

## Context

Ver `proposal.md` (Why). Estado actual y restricciones relevantes:

- `src/components/Projects.jsx` (273 líneas): array `projects` inline (5 proyectos, líneas 6–55), grilla `md:grid-cols-2 lg:grid-cols-3` con `useReveal`, card clickeable entera vía `after:absolute after:inset-0` en el enlace del título, `StatusBadge` con `animate-pulse` y `RepoButton` con estado React + `setInterval` + bloques `.repo-glitch-block` (CSS y `@keyframes repo-block-flicker` en `src/index.css`, solo usados acá). Bug menor: el `aria-label` dice "en vivo" aunque el destino sea el repositorio.
- `src/pages/Home.jsx:13`: `<main className="relative min-h-screen overflow-x-hidden bg-dark">`. `overflow-x: hidden` convierte a `<main>` en contenedor de scroll y **anula `position: sticky`** de cualquier descendiente. Ningún otro ancestro de la sección (App, `#root`, `body`, `html`) tiene `overflow`.
- `html { scroll-behavior: smooth }` (el change de tokens lo mueve a `no-preference`): `window.scrollTo({ behavior: 'auto' })` hereda ese smooth; para saltos inmediatos hay que pasar `behavior: 'instant'`.
- Navegación fija (`SiteNav`, `fixed top-0`, ~4.25rem de alto). `navbar-brutalista-glass` (propuesto en paralelo) la fija en 70px con `--eva-nav-h`, agrega `html { scroll-padding-top: calc(var(--eva-nav-h) + 1rem) }` y pone `id="contenido" tabIndex={-1}` en el `<main>` de `Home.jsx` (misma línea que toca este change). Router: `BrowserRouter`, sin `ScrollRestoration`.
- CSP `style-src 'self'` (sin `unsafe-inline`): escribir `el.style.transform` o la prop `style` de React es CSSOM y está permitido.
- Tests: solo `node --test "scripts/**/*.test.mjs"` sobre funciones puras (sin DOM). Los tests pueden importar ESM de `src/` (ya lo hacen con `src/utils/motion.js`).
- Imágenes de proyectos en `public/`: 1000×474 / 1000×468 / 1000×703 (webp).
- Dependencia: tokens y utilidades de `tokens-fuentes-texturas-eva` (D1, D3, D7, D8 de su design): `eva-black/panel/line/paper/gray/gray-dim/orange/red/purple/green`, `font-eva-display`, `.font-stretch-condensed`, `.eva-panel`, `.eva-panel-label`, `.eva-panel-code`, `.eva-tag`, `.eva-stripes`, `.eva-reveal`, `--eva-focus`.

Gobernanza: MEDIUM (UI + interacción con scroll; sin datos de usuario ni seguridad).

## Goals / Non-Goals

**Goals:**
- Recorrido horizontal fijado, corto y con paradas suaves en desktop; carrusel nativo en el resto; misma estructura DOM en ambos modos.
- Toda la matemática del recorrido en funciones puras testeables; el hook solo mide, escucha y escribe un `transform`.
- Cero renders de React por cuadro; cero librerías nuevas; cero violaciones de CSP.

**Non-Goals:**
- Animaciones CSS ligadas al scroll (`animation-timeline: scroll()`): mejora futura cuando Firefox lo soporte sin flag.
- Rediseñar otras secciones, unificar las URLs de GitHub de `Hero`/`Contact` en un módulo común, o borrar `GlitchText`/`accent-*` (eso es `limpieza-cyberpunk`).
- Navegación con flechas dentro de la pista o botones "anterior/siguiente" en desktop (el scroll vertical y Tab alcanzan; ver Open Questions).

## Decisions

### D1. Datos en `src/data/proyectos.js`

Se mueve el array tal cual a `src/data/proyectos.js` como `PROYECTOS` (mismos campos: `title`, `status`, `description`, `tags`, `image`, `repo?`, `live?`) y se agregan `GITHUB_PERFIL_URL = 'https://github.com/FacundoChacon'` (la misma URL que usan `Hero.jsx:56` y `Contact.jsx:20`) y `CONTACTO_ANCLA = '#contacto'`. Se agrega `imageWidth`/`imageHeight` por proyecto (valores reales del webp) para reservar espacio y evitar CLS. Motivo: el test de datos y el test de paginación importan la misma fuente que el componente. Alternativa descartada: dejar el array en el JSX (no se puede importar desde `node --test` porque el archivo tiene JSX).

### D2. Card de cierre: rellena el hueco; si no hay hueco, va después de la pista

`ctaPlacement(n)` devuelve `'track'` si `n % 3 !== 0` o `n === 0`, y `'after'` si `n` es múltiplo de 3 (> 0).

- Con hueco (hoy: 5 → 3 + 2 + cierre), el cierre convierte una página "rota" en una completa: la última página nunca queda con espacio vacío, la pista siempre tiene páginas llenas y el desplazamiento de la última página es exactamente `(P−1) × paso`.
- Sin hueco (3, 6, 9…), agregarlo a la pista crearía una página entera para una sola card: +100svh de pin (el escenario de scroll-jacking que señaló el abogado del diablo del council) y una página casi vacía. En ese caso el cierre se renderiza como **franja** (mismo componente, variante horizontal) inmediatamente después del tramo fijado, en flujo normal. El enlace a GitHub/contacto sigue estando siempre presente.
- `n === 0`: la pista tiene solo el cierre (1 página → sin pin). Caso defensivo.

`trackItemCount(n) = ctaPlacement(n) === 'track' ? n + 1 : n`.

### D3. Funciones puras en `src/utils/proyectosScroll.js`

Constantes: `PER_PAGE = 3`, `PLATEAU_VH = 25`, `TRANSITION_VH = 75`, `SETTLE_IDLE_MS = 150`.

| Función | Contrato |
|---|---|
| `pageCount(items, perPage = 3)` | `ceil(items / perPage)`; `items` no entero, negativo o no finito → 0; `perPage < 1` → `RangeError`. 0→0, 1→1, 5→2, 6→2, 7→3. |
| `ctaPlacement(n, perPage = 3)` / `trackItemCount(n, perPage = 3)` | D2. |
| `pinRangeVh(pages)` | `pages × PLATEAU_VH + (pages − 1) × TRANSITION_VH` (tramo de scroll útil en vh). 2 → 125. |
| `pinHeightVh(pages)` | `pages < 2 ? 0 : 100 + pinRangeVh(pages)`. 2 → **225** (dentro de 200–250), 3 → 325. 0 = sin pin. |
| `scrollProgress({ scrollY, top, range })` | `clamp((scrollY − top) / range, 0, 1)`; `range ≤ 0` → 0. |
| `pagePosition(progress, pages)` | Índice fraccional de página en `[0, pages−1]` con mesetas (ver D4). `pages ≤ 1` → 0. |
| `pageStride(containerWidth, gap)` | `containerWidth + gap` (la card 4 cae exactamente donde estaba la 1). |
| `trackOffset(position, stride)` | `−position × stride`, devolviendo `0` (no `−0`) en la posición 0. |
| `progressForPage(page, pages)` | Progreso del **centro de la meseta** de `page` (clamp de `page`). P=2: 0 → 0.1, 1 → 0.9. P=3: 1 → 0.5. |
| `scrollTopForPage({ page, pages, top, range })` | `round(top + progressForPage × range)`. |
| `pageOfItem(index, perPage = 3)` | `floor(index / perPage)`. 2→0, 3→1, 5→1. |
| `currentPage(position)` | `round(position)` (indicador visual). |
| `settleTarget(progress, pages)` | Página destino si `pagePosition` es fraccional (en una transición); `null` en meseta, fuera del tramo o con `pages < 2`. Destino = `round(position)` (P=2: 0.3 → 0, 0.7 → 1). |
| `layoutMode({ pages, narrow, coarse, short, reducedMotion, supportsClip })` | `'carousel'` si `narrow ∨ coarse ∨ short ∨ reducedMotion ∨ ¬supportsClip`; si no, `'pin'` con `pages ≥ 2` y `'row'` con menos. |
| `projectLabel(index, total)` | `"Proyecto ${index+1} de ${total}"`. |

Nombres en inglés como `motion.js`; textos de UI en español. Todo sin DOM: el hook les pasa números.

### D4. Mecánica de paradas: mesetas en el mapeo + asentamiento cancelable

Dos capas, de la más robusta a la más frágil:

1. **Mesetas en el mapeo scroll → posición (determinístico, sin tocar el scroll del usuario).** El tramo útil (`range`, en px = `pinRangeVh × svh`) se divide en `P` mesetas de `PLATEAU_VH` y `P−1` transiciones de `TRANSITION_VH`. Dentro de una meseta la posición es entera (la página queda quieta); dentro de una transición avanza con *smoothstep* (`3t² − 2t³`), que llega a la meseta con velocidad cero: la "parada" se siente aunque el usuario siga scrolleando a ritmo constante. Para P=2 a 900px de alto (tramo ≈ 1125px + el alto de la barra, porque el sticky mide `100svh − barra`): meseta inicial ≈ 0–240px, transición ≈ 240–955px, meseta final ≈ 955–1195px. Las mesetas se expresan como fracción del tramo medido, así que escalan solas. Es la capa principal y se testea completa (bordes, simetría `0.5 → 0.5`, monotonía, clamp).
2. **Asentamiento al quedar quieto (mejora cancelable).** Tras cada `scroll` se reinicia un temporizador de `SETTLE_IDLE_MS`; al vencer, si `settleTarget(progress, P)` no es `null`, `window.scrollTo({ top: scrollTopForPage(...), behavior: 'smooth' })`. Cancelación: `wheel`, `touchstart`, `pointerdown` y `keydown` (pasivos) limpian el temporizador y el scroll suave nativo del navegador se interrumpe solo ante nueva entrada del usuario. No hay bucle: al llegar al centro de la meseta `settleTarget` devuelve `null`. Mientras haya un `pointerdown` sin `pointerup` (arrastre de la barra de scroll) no se asienta. También se evalúa tras un re-medido por resize (spec "alineada").

Alternativas descartadas:
- `scroll-snap-type: y mandatory/proximity` en `html` con puntos de anclaje dentro del tramo: afecta el scroll de **toda** la página, `mandatory` atrapa al usuario y `proximity` es inconsistente entre motores con contenido alto; además el brief lo prohíbe para el eje vertical.
- Saltar de página por evento `wheel` con `preventDefault` (scroll-jacking real): rompe trackpads, inercia y accesibilidad; requiere listener no pasivo.
- Mapeo lineal sin mesetas: la página nunca está quieta; todo dependería del asentamiento JS, que es la parte más frágil (council).

### D5. Hooks

**`useModoProyectos(pages)`** → `'pin' | 'carousel' | 'row'`. Estado inicial calculado sincrónicamente (inicializador de `useState`) para no pintar un modo y cambiar al siguiente cuadro. Suscribe `change` de cuatro `matchMedia`: `(max-width: 767.98px)`, `(pointer: coarse)`, `(max-height: 599.98px)` y `REDUCED_MOTION_QUERY` (de `motion.js`); `supportsClip = CSS.supports('overflow', 'clip')` una vez. `setState` solo cuando cambia el modo (no por cuadro). `short` cubre zoom alto y laptops apaisadas donde 3 cards no entran en `100svh`.

**`usePinHorizontal({ enabled, pages, pinRef, trackRef, indicatorRef, barRef })`**, activo solo con `enabled` (modo `'pin'`):
- **Medición cacheada** (`measure()`): `top = pinRef.getBoundingClientRect().top + scrollY − stickyTop` (scroll en el que el sticky se pega bajo la barra), `range = pinRef.offsetHeight − sticky.offsetHeight`, `stride = pageStride(track.clientWidth, parseFloat(getComputedStyle(track).columnGap))`. Se re-mide con un `ResizeObserver` sobre `pinRef`, el contenedor sticky, la pista y `document.body` (contenido de arriba que cambia de alto: imágenes, fuentes con `swap`), y en `resize`. Nunca se lee layout en el handler de `scroll`.
- **Escritura por cuadro**: listener `scroll` `{ passive: true }` que agenda un único `requestAnimationFrame` (flag `pending`); en el cuadro: `progress → position → offset`, `track.style.transform = translate3d(Xpx,0,0)`, `bar.style.transform = scaleX(progress)` y, solo si cambió `currentPage`, `indicator.textContent = '02 / 02'`. Sin `setState`.
- **Inicialización**: `useLayoutEffect` mide y aplica desde `window.scrollY` antes del primer pintado (evita ver la página 1 cuando el navegador restauró el scroll a mitad del tramo); se repite en `pageshow` (restauración desde bfcache) y tras el primer callback del `ResizeObserver`. La restauración de scroll del navegador en `popstate` dispara `scroll` y entra por el camino normal. Nunca `pushState`/`replaceState`.
- **Foco** (`focusin` en la pista): `li[data-index]` → `pageOfItem`; si `|position − page| > 0.001`, `window.scrollTo({ top: scrollTopForPage(...), behavior: 'instant' })` y aplicación sincrónica del transform (sin esperar al rAF) para que el anillo de foco nunca quede fuera de vista. `instant` explícito por el `scroll-behavior: smooth` de `html`. El salto cae en el centro de una meseta, así que no dispara asentamiento.
- **Salida del modo** (`enabled` pasa a `false`, p. ej. el usuario activa movimiento reducido): limpia listeners, temporizador, `ResizeObserver` y `transform`; si el scroll estaba dentro del tramo fijado, lleva el scroll (instantáneo) al inicio de la sección para no dejar al usuario varias pantallas más abajo cuando el alto del tramo colapsa.

Alternativas descartadas: GSAP ScrollTrigger / `motion` (15–45 KB para un efecto; council), `IntersectionObserver` con umbrales (granularidad insuficiente para un desplazamiento continuo), `useState` del offset (re-render de 6 cards por cuadro).

### D6. Estructura DOM y CSS

```
<section id="proyectos" data-mode={mode} aria-labelledby="proyectos-titulo">
  <div class="proyectos-pin" ref={pinRef} style={{ '--pin-vh': pinHeightVh(P) }}>
    <div class="proyectos-sticky">
      <header> "02 // PROYECTOS" (h2) · indicador "01 / 02" + barra (aria-hidden) </header>
      <ul class="proyectos-pista" ref={trackRef}>
        <li data-index=0..N-1> <ProyectoCard …/> </li>
        {ctaPlacement === 'track' && <li data-index=N> <ProyectosCierre/> </li>}
      </ul>
    </div>
  </div>
  {ctaPlacement === 'after' && <ProyectosCierre variant="strip"/>}
</section>
```

CSS nuevo en `src/index.css` (`@layer components`, selectores por `data-mode` para no duplicar marcado):

- `[data-mode="pin"] .proyectos-pin { height: calc(var(--pin-vh) * 1vh); height: calc(var(--pin-vh) * 1svh); }` (doble declaración = fallback sin `svh`).
- `[data-mode="pin"] .proyectos-sticky { position: sticky; top: var(--eva-nav-h, 4.5rem); height: calc(100vh - var(--eva-nav-h, 4.5rem)); height: calc(100svh - var(--eva-nav-h, 4.5rem)); overflow: clip; display: flex; flex-direction: column; justify-content: center; }`. El sticky se pega **debajo** de la barra fija (no detrás), así el encabezado y las cards nunca quedan tapados y no hace falta `padding-top`. El hook mide `stickyTop = parseFloat(getComputedStyle(sticky).top)` y pasa a las funciones puras `top = sectionTop − stickyTop` y `range = pinHeight − stickyHeight`; las funciones puras no cambian. **`overflow: clip`, no `hidden`**: un contenedor `hidden` sigue siendo desplazable por programa y el navegador le cambiaría `scrollLeft` al enfocar una card fuera de vista, sumando un segundo desplazamiento al `transform`. Con `clip` (y `<main>` en `clip`) no hay contenedor que el foco pueda desplazar.
- `[data-mode="pin"] .proyectos-pista { display: flex; gap: var(--proyectos-gap, 1.5rem); will-change: transform; }` y `li { flex: 0 0 calc((100% - 2 * var(--proyectos-gap)) / 3); }`. **Sin `transition` en la pista** (pelearía con la escritura por cuadro); las transiciones de hover van en las cards.
- La pista no se recorta al ancho del contenedor: el sticky ocupa todo el ancho, así que en los márgenes laterales (≥ 64px a 1280px) se asoman la página siguiente/anterior, lo que comunica el movimiento horizontal.
- `[data-mode="carousel"] .proyectos-pista { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain; scroll-padding-inline: 1rem; gap: 1rem; padding-inline: 1rem; }`, `li { flex: 0 0 min(85vw, 26rem); scroll-snap-align: start; }`. Indicador "DESLIZÁ →" visible solo en este modo (decorativo, `aria-hidden`).
- `[data-mode="row"]`: grilla de hasta 3 columnas, sin pin.
- **Ancla `#proyectos`**: `navbar-brutalista-glass` (D5 de su design) define `:root { --eva-nav-h: 70px }` y `html { scroll-padding-top: calc(var(--eva-nav-h) + 1rem) }` para todas las secciones. Con eso el ancla deja el tope de la sección 16px por debajo del borde inferior de la barra: progreso 0 (acotado), primera página y encabezado completos, y el pin empieza 16px después. Por eso este change **no** suma `scroll-margin-top` cuando ese `scroll-padding-top` existe (se sumarían y la sección quedaría 86px más abajo). Si al aplicar este change la navbar aún no está aplicada, se agrega `#proyectos { scroll-margin-top: calc(var(--eva-nav-h, 4.5rem) + 1rem) }` como puente y se elimina cuando la navbar llegue (tarea 6.4). Es la forma que el brief pidió ("ancla con `scroll-margin-top`") adaptada a la decisión global de la navbar.
- `src/pages/Home.jsx`: `overflow-x-hidden` → `overflow-x-clip` (Tailwind 3.4 la trae). `clip` en un eje no fuerza `auto` en el otro (a diferencia de `hidden`), así que no crea contenedor de scroll y sticky funciona; sigue recortando los decorativos de Hero/Contact que hoy evita el `hidden`.
- Se borran `.repo-glitch-block`, `@keyframes repo-block-flicker` y su entrada en el bloque `prefers-reduced-motion` de `index.css`.

### D7. Card brutalista y accesibilidad

`ProyectoCard` (`<article>` dentro del `li`):
- Fondo `eva-panel`, borde 2px `eva-gray-dim` (≥ 3:1, componente de UI), sin radio, sombra sólida desplazada `6px 6px 0 0` en `eva-orange` (`shadow-[6px_6px_0_0_theme(colors.eva.orange)]`). Hover/`focus-within`: `translate(-2px,-2px)` + sombra 8px y borde `eva-orange`, con `motion-safe:transition-transform`. **Sin `backdrop-filter`** ni `blur` dentro de la pista.
- Cabecera tipo `.eva-panel-label`: `UNIT-01` (número con dos dígitos, `aria-hidden="true"` porque duplica el `sr-only`) y, a la derecha, `StatusBadge` con texto "DEMO" (`eva-orange`), "EN EL MERCADO" (`eva-green`) o "EN CURSO" (`eva-paper` sobre franja `.eva-stripes` decorativa). Sin `animate-pulse`.
- Imagen con `width`/`height` reales, `object-cover`, alto fijo y filtro de duotono sutil opcional (CSS `filter` sobre `img`, no `backdrop-filter`); `alt` igual que hoy.
- `<p class="sr-only">Proyecto X de N</p>` como primer hijo del `article`.
- Título `h3` en `font-eva-display font-stretch-condensed uppercase` que **contiene** el enlace principal (patrón heading > link, mejor para navegación por encabezados que el actual link > heading). Nombre accesible: texto visible + `<span class="sr-only">: ver demo (abre en una pestaña nueva)</span>` o ": ver repositorio …" según el destino (corrige el bug del `aria-label`). El enlace conserva `after:absolute after:inset-0` para que toda la card sea clickeable.
- Etiquetas con `.eva-tag`. Enlaces secundarios "DEMO" y "REPO" con `relative z-10` sobre el pseudo-elemento, también con texto `sr-only` de pestaña nueva.

**`RepoButton` reemplazado**: enlace `<a>` sin estado ni timers, icono `GithubIcon` + "REPO" en mono mayúscula, borde 2px; hover/foco **invierte** colores (fondo `eva-orange`, texto `eva-black` = 7.81:1) y aparece una sombra dura de 3px. Sin glitch, sin `setInterval`, sin `mix-blend-mode`. Se elimina `stopPropagation` (ya no hay `onClick` en la card que lo necesite: el área clickeable es un pseudo-elemento del enlace principal).

`ProyectosCierre`: `.eva-panel` con `.eva-panel-label` "SYS // FIN DEL REGISTRO" y `.eva-panel-code` "EOF", título "Hay más en el archivo", texto breve y dos acciones brutalistas: "Ver GitHub" (`GITHUB_PERFIL_URL`, pestaña nueva, `sr-only` de aviso) y "Contactame" (`#contacto`, misma pestaña). No es clickeable entero (tiene dos destinos). Variante `strip` (horizontal, ancho completo) para D2. Franjas `.eva-stripes` decorativas en el borde.

Encabezado de la sección: `h2` "Proyectos" en serif condensada con prefijo mono "02 //", divisor `.eva-stripes`, aplica `.eva-reveal` vía `useReveal` (solo el encabezado; nunca la pista).

### D8. Tests (Strict TDD, `node --test`)

- `scripts/proyectos-scroll.test.mjs`: todas las funciones de D3 con triangulación (5→2, 6→2, 7→3, 0, 1 páginas; `ctaPlacement` 0/3/5/6/7; progreso clamp antes/después/medio/`range ≤ 0`; mesetas y smoothstep P=2 y P=3, monotonía en un barrido de 0 a 1; `trackOffset` sin `−0`; `progressForPage`/`scrollTopForPage`; `pageOfItem`; `settleTarget` en meseta, transición y bordes; tabla de `layoutMode`; `projectLabel`).
- `scripts/proyectos-data.test.mjs`: los 5 títulos en orden, campos obligatorios, `status` válido, URLs `https://`, al menos uno de `live`/`repo`, la imagen existe en `public/` y sus `imageWidth/Height` coinciden con el webp (lectura de cabecera VP8 en el test o constante verificada a mano en la tarea), `GITHUB_PERFIL_URL` correcta, y escenario integrado `pageCount(trackItemCount(5)) === 2`.
- `scripts/proyectos-guard.test.mjs` (mismo patrón estático que `a11y-classes.test.mjs`): `<main>` de `Home.jsx` sin `overflow-x-hidden`/`overflow-hidden` y con `overflow-x-clip`; `Projects.jsx` y `src/components/proyectos/*.jsx` sin `backdrop-`, sin `aria-hidden` ni `inert` en `<li`/`<article`, sin `setInterval`; `index.css` sin `repo-glitch`; `package.json` sin `gsap`, `motion` ni `framer-motion`; los hooks sin `pushState`/`replaceState`.
- Los hooks y el DOM no se testean con unidad (no hay entorno DOM en el proyecto); se verifican con Playwright manual (tareas finales).

## Risks / Trade-offs

- [El asentamiento JS es la parte más frágil (council): trackpads con inercia, iOS] → es una capa opcional sobre las mesetas; en táctil no hay pin (carrusel), así que iOS no la ejecuta; se cancela ante cualquier entrada; si molesta en la verificación, se desactiva con una constante sin tocar la spec de mesetas.
- [`overflow: clip` sin soporte (Safari < 16)] → `supportsClip` falso → carrusel; `<main>` con `overflow-x-clip` cae a `visible` y podría aparecer scroll horizontal por los decorativos de Hero/Contact → verificar a 375px y 1440px que `document.documentElement.scrollWidth === innerWidth`; si aparece, agregar `overflow: hidden` a esos decorativos puntuales (no a `<main>`).
- [Cambio de modo con el scroll a mitad del tramo deja al usuario en otra sección] → D5 lleva el scroll al inicio de la sección al salir del pin.
- [`top` cacheado desactualizado si el contenido de arriba cambia sin cambiar el alto de `body`] → improbable; `ResizeObserver` sobre `body` + re-medición en `load`/`pageshow`.
- [`100svh` con la barra de URL de navegadores de escritorio que cambian alto] → `svh` es estable por definición; el `ResizeObserver` del sticky re-mide si cambia.
- [Cards que no entran en el alto disponible (pantallas de 600–700px de alto)] → `short` (< 600px) pasa a carrusel; entre 600 y 700px se ajusta el alto de imagen con `max-height` en vh; verificar a 1280×720.
- [Lazy-loading de imágenes de la página 2 dentro de una pista transformada] → imágenes sin `loading="lazy"` (como hoy) y con `decoding="async"`.
- [Conflictos de merge con `tokens-fuentes-texturas-eva` y `navbar-brutalista-glass` en `src/index.css` y en la línea del `<main>` de `Home.jsx`] → este change se aplica después de tokens; con la navbar comparte `--eva-nav-h` y su `scroll-padding-top`; la guarda de `Home.jsx` solo exige `overflow-x-clip` y la ausencia de `overflow-*-hidden`, sin fijar el resto de las clases ni el `id`.
- [Foco secuencial con `scroll-padding-top` global] → las cards del pin están dentro del sticky, verticalmente siempre visibles, así que el navegador no desplaza en vertical; el desplazamiento horizontal lo resuelve el `focusin` del hook.
- [Redundancia "UNIT-01" / "Proyecto 1 de 5"] → el código visual es `aria-hidden`; la card y sus controles nunca.

## Migration Plan

1. Aplicar después de `tokens-fuentes-texturas-eva` (usa sus clases y tokens). Merge en `rediseno-evangelion`; preview de Vercel con CSP de producción; recorrido Playwright (tareas 7.x).
2. Rollback: revertir el commit; los datos extraídos y `overflow-x-clip` no tienen estado persistente.
3. `limpieza-cyberpunk` ya no necesita ocuparse del `RepoButton` ni de `.repo-glitch-block`.

## Open Questions

- ¿Botones "anterior/siguiente" visibles en desktop para quien no usa rueda ni teclado (p. ej. solo mouse con barra de scroll)? Diferible: no cambia la spec actual y puede sumarse como requisito nuevo.
- Copy final del cierre ("Hay más en el archivo") y de las etiquetas de estado: ajustables en la verificación visual sin tocar la spec.
