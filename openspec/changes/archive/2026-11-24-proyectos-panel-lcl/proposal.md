# Proposal

## Why

El carrete 3D de proyectos (Three.js, sección fijada manejada por el scroll) es vistoso pero pesado y poco directo: obliga a scrollear varias pantallas para ver cinco proyectos, depende de WebGL 2 con un carrusel de respaldo aparte, descarga ~130 KB gz de `three` y deja la foto, el repositorio y los datos de cada proyecto escondidos detrás de un único enlace "Ver proyecto". El usuario quiere un **panel de comando** plano, legible y rápido de recorrer, con un detalle Eva propio: un tanque de **LCL** naranja que reacciona al cursor.

## What Changes

- **BREAKING (visual/interacción)**: se reemplaza el carrete 3D por un **panel de comando** de cristal (`.eva-glass`, marco violeta) con **cards rectangulares planas** (sin curvatura, sin inclinación, sin profundidad). En escritorio se ven 3 cards lado a lado; en tablet 2 y en teléfono 1.
- **Navegación de a un proyecto**: botones ◀ ▶ que corren una ventana deslizante de a una card (1-2-3 → 2-3-4 → 3-4-5), siempre con ventanas completas, deshabilitados en los extremos (sin vuelta), con indicador de posición ("01–03 / 05") y anuncio cortés por `aria-live`. Deslizar en horizontal en pantallas táctiles también mueve de a uno. La sección deja de fijarse: el scroll vertical es el normal de la página.
- **Tanque de LCL**: un líquido naranja (rol secundario) llena el tercio inferior del panel, detrás de las cards, dibujado en **Canvas 2D** con una simulación 1D de resortes en un módulo puro y testeado. El cursor genera ondas; en táctil, un toque genera una onda. El bucle duerme cuando el líquido está quieto, fuera de pantalla o con la pestaña oculta; con movimiento reducido se dibuja un único cuadro estático.
- **Cada card** muestra foto, título, estado, descripción recortada a 3 líneas y hasta 3 etiquetas más "+N". La **foto** abre la demo en una pestaña nueva; un botón **"Repositorio"** abre el repo y, si el proyecto no tiene repo público, se muestra un botón gris deshabilitado **"Repo privado"** (no es un enlace).
- **Se elimina el carrete 3D completo**: `Carrete3D.jsx`, `src/three/carreteEscena.js`, `src/utils/carrete3d.js`, `src/hooks/useCarrete.js`, `src/hooks/useModoProyectos.js`, `src/utils/proyectosScroll.js`, sus tests, su CSS, la verificación del chunk 3D y la dependencia **`three`**. Desaparecen los modos `reel`/`carousel`, el tramo fijado, el asentamiento y el carrusel de respaldo.
- Se **conservan**: `id="proyectos"`, el ancla del nav, el encabezado "03 // Proyectos" existente, el deep-link `/#proyectos`, los datos de `src/data/proyectos.js` y `ProyectosCierre` (pasa a ser una franja debajo del panel con "Ver GitHub" y "Contactame").

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `seccion-de-proyectos`: se reemplazan los requisitos del carrete 3D, del tramo fijado y del carrusel de respaldo (REMOVED con migración) por los del panel de comando: cards planas, cantidad de cards por ancho, navegación de a uno con indicador y anuncio, deslizamiento táctil, contenido y accesos de cada card ("Repo privado"), lista accesible, foco, cierre, tanque de LCL, legibilidad sobre el líquido, movimiento reducido, ancla y ausencia de motor 3D. Se modifican "Rendimiento del recorrido" y "Ciclo de vida de la animación" (ahora del líquido).

## Impact

- **Código**: `src/components/Projects.jsx` (reescrito, sin modos), nuevos `src/components/proyectos/PanelProyectos.jsx` y `TanqueLCL.jsx`, `ProyectoCard.jsx` (reescrito), `ProyectosCierre.jsx` (franja), nuevos `src/hooks/usePanelProyectos.js` y `src/hooks/useTanqueLCL.js`, nuevos módulos puros `src/utils/panelProyectos.js` y `src/utils/lcl.js`; CSS de proyectos en `src/index.css`; comentario de `src/pages/Home.jsx`.
- **Se borran**: `src/components/proyectos/Carrete3D.jsx`, `src/three/`, `src/utils/carrete3d.js`, `src/utils/proyectosScroll.js`, `src/hooks/useCarrete.js`, `src/hooks/useModoProyectos.js`, `scripts/carrete3d.test.mjs`, `scripts/proyectos-scroll.test.mjs`.
- **Tests**: nuevos `scripts/panel-proyectos.test.mjs` y `scripts/lcl.test.mjs`; reescrito `scripts/proyectos-guard.test.mjs`; ajustados `scripts/sistema-visual.test.mjs` (aserciones `.carrete-*`), `scripts/chunk-check.test.mjs` + `scripts/lib/chunk-check.mjs` + `scripts/verify-build.mjs` (pasan a garantizar que ningún chunk contiene Three.js). `scripts/proyectos-data.test.mjs` sin cambios.
- **Dependencias**: se quita `three` (`npm uninstall three`). Sin dependencias nuevas.
- **Rendimiento**: la carga diferida de ~130 KB gz desaparece; el líquido es un `<canvas>` 2D con bucle que duerme en reposo y DPR acotado.
- **Seguridad**: la CSP (`script-src 'self'; style-src 'self'; img-src 'self' data:`) alcanza sin cambios: Canvas 2D no carga recursos y las imágenes son del propio origen.
- **Specs**: solo `seccion-de-proyectos`. No se tocan `seccion-de-stack` ni `seccion-de-contacto` (las modifica el change paralelo `colores-de-marca-hover`). `paneles-de-cristal` no cambia: el panel es estático y las cards no son cristal.
