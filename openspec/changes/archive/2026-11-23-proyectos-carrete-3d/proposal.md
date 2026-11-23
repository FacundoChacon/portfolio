# Proposal

## Why

La sección de proyectos (`proyectos-scroll-horizontal`) recorre las cards en páginas de a tres con un `translateX`: funciona, pero visualmente es otro carrusel. El usuario quiere que la sección sea la pieza de mayor impacto del portfolio: un **carrete 3D curvo** (Three.js) donde las capturas de los proyectos giran alrededor de un eje con profundidad cinematográfica, manejado por el mismo scroll de la página que hoy fija la sección, sin perder la accesibilidad, la estética Eva ni la seguridad (CSP estricta) que ya tiene el sitio.

## What Changes

- **BREAKING (visual/interacción)**: en navegadores con WebGL 2 la sección deja de ser una pista horizontal paginada y pasa a ser un **carrete 3D curvo** de los 5 proyectos reales sobre un lienzo WebGL transparente, encima del fondo Eva (negro + grilla hexagonal) y con un título grande "03 // Proyectos" detrás de las cards, parcialmente tapado por ellas.
- La sección sigue **fijada** (sticky bajo la barra): el **scroll vertical de la página** hace girar el carrete de un proyecto al siguiente con paradas por proyecto; no se captura la rueda. Se suman **arrastre** (mouse y dedo, este último solo horizontal), **flechas** (un proyecto) y **Inicio/Fin** cuando el foco está en el carrete; al soltar o quedarse quieto, se **asienta** en el proyecto más cercano. La fuente única de verdad sigue siendo el scroll de la página: arrastre, teclado y foco se traducen en un `scrollTo` al scroll de ese proyecto.
- Escenario limpio: sin captions, contadores, flechas ni botones visibles. Solo: un único enlace discreto **"Ver proyecto ↗"** del proyecto que está al frente, el enlace chico **"Más en GitHub ↗"** debajo del carrete y la pista sutil **"Scrolleá o arrastrá para explorar"** abajo al centro.
- Accesibilidad: lienzo con `role="img"` y descripción del proyecto al frente; lista accesible de enlaces (uno por proyecto) en la que solo el del proyecto al frente se ve; al llegar con Tab a otro enlace, el carrete gira hasta ese proyecto y el enlace se vuelve visible con su foco.
- **Movimiento reducido**: el carrete se mantiene pero sin movimiento autónomo (sin ondulación, sin flexión por velocidad, sin inercia): cambia de proyecto por corte, de forma instantánea.
- **Fallback**: sin WebGL 2, si el contexto falla o se pierde, si el chunk 3D no carga, con alto visible insuficiente o sin `overflow: clip`, se muestra el **carrusel nativo actual** (`ProyectoCard` + `ProyectosCierre`), con su contenido completo.
- Teléfonos también usan el carrete (card central ≈ 77% del ancho; los vecinos se recortan a los costados): el scroll vertical nativo sigue funcionando sobre el lienzo y el arrastre táctil es solo horizontal.
- Se **elimina** de `proyectos-scroll-horizontal`: la paginación de a tres, el desplazamiento `translateX` de la pista, el indicador "01 / 02" con barra, los modos `pin`/`row` y su CSS. Se **conserva**: datos (`src/data/proyectos.js`), mesetas + asentamiento del scroll (con nuevas constantes), ancla `#proyectos`, restauración de posición, salida segura de modo, `overflow-x-clip` en `<main>`, cards y cierre (ahora en el fallback).
- Nueva dependencia de producción **`three@0.187.0`** (versión exacta), cargada **solo bajo demanda** con `import()` dinámico cuando la sección se acerca al viewport, en un chunk separado (≈ 130 KB gz medidos con los imports necesarios; 0 KB en la carga inicial).
- Toda la geometría y el movimiento (curvado de vértices, transformaciones por card, envolvimiento del índice, amortiguación, dimensiones según viewport, recorte *cover* de texturas, esquinas redondeadas) en **funciones puras** testeadas con `node --test`, sin Three.js; Three.js queda como un adaptador fino.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `seccion-de-proyectos`: la presentación principal pasa de recorrido horizontal paginado a carrete 3D manejado por el scroll (nuevos requisitos de carrete, composición, controles, enlaces accesibles, ciclo de vida y carga diferida); se modifican contenido, cierre, asentamiento, fallback, estructura accesible, foco, ancla y rendimiento; se eliminan la paginación de a tres y el recorrido horizontal. **Nota**: esta capacidad la crea `proyectos-scroll-horizontal`, que está implementado pero no archivado; ese change debe archivarse **antes** de archivar este (el delta usa MODIFIED/REMOVED sobre sus requisitos).

## Impact

- **Código**: `src/components/Projects.jsx` (reescrito: modos `reel`/`carousel`), nuevos `src/components/proyectos/Carrete3D.jsx` (escenario, título, enlaces, pista), `src/hooks/useCarrete.js` (scroll→fase, arrastre, teclado, foco, asentamiento, ciclo de vida), `src/three/carreteEscena.js` (adaptador Three.js, único módulo que importa `three`, cargado con `import()`), `src/utils/carrete3d.js` (matemática pura nueva), `src/utils/proyectosScroll.js` (se generaliza y se borran funciones de paginación), `src/hooks/useModoProyectos.js` (nuevos criterios), `src/hooks/usePinHorizontal.js` (se elimina), CSS de proyectos en `src/index.css`.
- **Se reutilizan sin cambios de contrato**: `src/data/proyectos.js`, `ProyectoCard.jsx`, `ProyectosCierre.jsx` (solo en el fallback).
- **Tests**: `scripts/carrete3d.test.mjs` (nuevo), `scripts/proyectos-scroll.test.mjs` y `scripts/proyectos-guard.test.mjs` (actualizados), `scripts/proyectos-data.test.mjs` (sin cambios). `scripts/verify-build.mjs` verifica que `three` quede fuera del chunk de entrada.
- **Dependencias**: `three@0.187.0` (exacta, publicada el 2026-10-30). Sin librerías de animación.
- **Seguridad**: la CSP actual (`script-src 'self'`, `img-src 'self' data:`) alcanza: Three.js no usa `eval`/`new Function` (verificado en el bundle), los shaders son cadenas que compila WebGL (no JS), las texturas son las imágenes same-origin de `public/`. No se cargan recursos de terceros.
- **Navegación**: el `id="proyectos"`, el scroll-spy y el enlace "//03 Proyectos" siguen funcionando (la sección conserva su id y su tramo fijado).
- **Orden de archivo**: archivar `proyectos-scroll-horizontal` antes que este change.
