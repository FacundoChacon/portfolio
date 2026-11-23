# Proposal

## Why

La sección Proyectos es hoy una grilla estática de 5 cards con estética cyberpunk (degradados, brillo neón, botón "Repo" con glitch por `setInterval`), justo lo que el rediseño inspirado en Evangelion quiere dejar atrás (engram #181/#182). Es el tercer change del rediseño (después de `tokens-fuentes-texturas-eva` y `navbar-brutalista-glass`) y el council (engram #183) ya fijó la técnica: un recorrido horizontal fijado (pin) de 3 proyectos por "página" en desktop, carrusel nativo en mobile y con movimiento reducido, sin librerías de animación.

## What Changes

- Proyectos pasa a un **recorrido horizontal fijado** en desktop: la sección se fija (`position: sticky`, `100svh`) y el scroll vertical desplaza horizontalmente una pista de cards (`translateX`) en **páginas de 3**, con un pin corto (~225svh para 2 páginas) y **paradas suaves** por página (mesetas en el mapeo scroll→desplazamiento + asentamiento cancelable al quedar quieto el scroll). Sin `scroll-snap` obligatorio en el eje vertical.
- En mobile (`< 768px`, `pointer: coarse`, viewport bajo) y con `prefers-reduced-motion: reduce` (reaccionando al cambio en vivo): **sin pin**; carrusel nativo `overflow-x: auto` + `scroll-snap-type: x mandatory`, cards de ~85vw con la siguiente asomando.
- **Card de cierre "Más en GitHub / Contactame"** con aspecto de panel de sistema: completa el hueco de la última página cuando la cantidad de proyectos no es múltiplo de 3 (hoy 5 → 3+2+cierre). Si es múltiplo de 3 no se agrega a la pista: se muestra como franja después de la pista (no se alarga el pin por una sola card).
- **Accesibilidad**: `ul/li` en orden de fuente, todas las cards siempre en el DOM y accesibles (sin `aria-hidden`/`inert`), texto `sr-only` "Proyecto X de N", foco en una card fuera de pantalla → `window.scrollTo` a su página, ancla `#proyectos` compensada por la barra fija (el `scroll-padding-top` global de `navbar-brutalista-glass`, o `scroll-margin-top` como puente si la navbar aún no está aplicada) y sección fijada debajo de la barra, offset inicializado desde `scrollY` al montar y en `pageshow`, sin `pushState` por página.
- **Estética brutalista eva**: bordes duros, sombras sólidas desplazadas, unidades numeradas ("UNIT-01"), títulos en la serif condensada de los tokens, etiquetas `.eva-tag`, sin `backdrop-filter` dentro de la pista animada.
- **Se reemplaza el `RepoButton` con glitch** (estado + `setInterval` + `.repo-glitch-block`) por un enlace brutalista sin JS; se borran su CSS y keyframes. El `StatusBadge` pasa a la paleta eva, con texto (no solo color) y sin pulso.
- Los datos de los proyectos se extraen a `src/data/proyectos.js` sin cambiar títulos, textos, imágenes, enlaces ni estados.
- `src/pages/Home.jsx`: `<main>` pasa de `overflow-x-hidden` a `overflow-x-clip` (el `hidden` rompe `position: sticky`).
- Lógica de paginación, progreso, desplazamiento y página destino en **funciones puras** (`src/utils/proyectosScroll.js`) testeadas con `node --test`; dos hooks propios (modo de presentación por `matchMedia` y pin con listener pasivo + rAF + `ResizeObserver`). Sin GSAP ni `motion`.

## Capabilities

### New Capabilities
- `seccion-de-proyectos`: presentación de los proyectos del portfolio en la home — paginación de a 3, recorrido horizontal fijado en desktop, carrusel nativo en mobile/movimiento reducido, card de cierre hacia GitHub/contacto, accesibilidad por teclado y lector de pantalla, y restauración de posición.

### Modified Capabilities
<!-- Ninguna: el ancla #proyectos y la navegación por secciones de `navegacion-del-sitio` siguen cumpliéndose tal como están escritas; `sistema-visual` (del change de tokens) solo se consume. -->

## Impact

- **Código**: `src/components/Projects.jsx` (reescritura), nuevos `src/components/proyectos/ProyectoCard.jsx` y `ProyectosCierre.jsx`, `src/data/proyectos.js`, `src/utils/proyectosScroll.js`, `src/hooks/useModoProyectos.js`, `src/hooks/usePinHorizontal.js`, `src/pages/Home.jsx` (una clase), `src/index.css` (se quita CSS del glitch de "Repo"; se agregan las clases de la sección).
- **Tests**: `scripts/proyectos-scroll.test.mjs`, `scripts/proyectos-data.test.mjs`, `scripts/proyectos-guard.test.mjs` (todos dentro de `npm run test`).
- **Dependencias**: ninguna nueva. Depende de `tokens-fuentes-texturas-eva` (colores `eva-*`, `font-eva-display`, `.font-stretch-condensed`, `.eva-panel*`, `.eva-tag`, `.eva-stripes`, `--eva-focus`, `scroll-behavior` condicionado). Convive con `navbar-brutalista-glass` (usa su `--eva-nav-h` para el `top` del sticky y su `scroll-padding-top` global para el ancla; ambos tocan la línea del `<main>` de `Home.jsx`).
- **CSP**: sin cambios; el `transform` y la variable de alto se escriben por CSSOM (`el.style`/prop `style`), permitido con `style-src 'self'`.
- **Fuera de alcance**: otras secciones, el configurador, borrar `GlitchText`/tokens `accent-*` (queda para `limpieza-cyberpunk`), animaciones CSS ligadas al scroll (`animation-timeline`) como mejora futura.
