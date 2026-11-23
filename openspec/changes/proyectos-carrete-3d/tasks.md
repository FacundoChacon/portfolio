# Tasks

> Strict TDD: en cada tarea de lógica pura, primero el test en rojo (`node --test "scripts/**/*.test.mjs"`), después el mínimo código, triangulación con los valores de `design.md` (D4/D10) y refactor con los tests en verde.
> **Orden de archivo**: `proyectos-scroll-horizontal` DEBE archivarse antes que este change (el delta usa MODIFIED/REMOVED sobre `seccion-de-proyectos`, que hoy solo existe dentro de ese change).

## 1. Preparación y dependencia

- [ ] 1.1 Confirmar que `hero-brutalista` está commiteado (comparten `src/index.css`) y correr la red de seguridad: `node --test "scripts/**/*.test.mjs"` todo en verde; anotar el total como línea base (fallas previas se reportan, no se corrigen)
- [ ] 1.2 `npm install three@0.187.0 --save-exact` y verificar que `package.json` tiene `"three": "0.187.0"` (sin `^`/`~`) y que `npm ls three` muestra 0.187.0

## 2. Mapeo scroll → fase (`src/utils/proyectosScroll.js`)

- [ ] 2.1 RED→GREEN: cambiar `PLATEAU_VH = 15` y `TRANSITION_VH = 45`; actualizar `scripts/proyectos-scroll.test.mjs` primero (`pinRangeVh(5) = 255`, `pinHeightVh(5) = 355`, `pinHeightVh(1) = 0`, `progressForPage(0|2|4, 5)` ≈ 0.02941 / 0.5 / 0.97059, mesetas y monotonía con 5 paradas, `settleTarget` con 5 paradas en meseta, transición y bordes) y verificar que pasa
- [ ] 2.2 RED→GREEN→TRIANGULATE: `smoothstepInverse(y)` (0→0, 0.5→0.5, 1→1, `smoothstepInverse(smoothstep(t)) ≈ t` para t = 0.1, 0.25, 0.9; clamp fuera de [0,1]) y `progressForPosition` / `scrollTopForPosition` (entero = centro de meseta; ida y vuelta `pagePosition(progressForPosition(p)) ≈ p` para p = 0.3, 1.5, 3.9; clamp en extremos); verificar con `node --test`
- [ ] 2.3 RED→GREEN: `projectsMode({ webgl2, short, supportsClip, failed })` → `'reel' | 'carousel'` con tabla completa (cada condición sola manda a `carousel`; todo bien → `reel`); borrar `layoutMode` y sus tests; verificar con `node --test`
- [ ] 2.4 Borrar `PER_PAGE`, `pageCount`, `ctaPlacement`, `trackItemCount`, `pageStride`, `trackOffset`, `pageOfItem`, `currentPage` y sus tests (D11), dejando `projectLabel`; verificar con `grep` que nada en `src/` los importa (tras el grupo 6) y que `node --test` sigue en verde

## 3. Geometría y movimiento puros (`src/utils/carrete3d.js`)

- [ ] 3.1 RED→GREEN→TRIANGULATE en `scripts/carrete3d.test.mjs`: constantes de la spec (`CAMERA`, `PLANE`, `BEND_BASE/MAX`, `RIPPLE_AMP`, `THETA_STEP`, `PITCH_FACTOR`, `Z_OFFSET`, `ROT_X_STEP`, `DAMPING_RATE`, `DT_MAX`), `clampDt`, `dampFactor` (0, 1/60 ≈ 0.19480, 0.05 ≈ 0.47795, 0.2 = 0.05, negativo → 0) y `dampPhase` (converge, tope `MAX_PHASE_SPEED`, *snap* < 1e-4, `reduced` → `round(target)`); verificar con `node --test`
- [ ] 3.2 RED→GREEN→TRIANGULATE: `wrapRelative` (N=5: fase 0 → 0,1,2,−2,−1; fase 4 índice 0 → 1; fase 2.5 índice 0 → −2.5; fases fraccionales; rango semiabierto) y `nearestStop` (redondeo y clamp a [0, N−1]); verificar con `node --test`
- [ ] 3.3 RED→GREEN→TRIANGULATE: `bendVertex` ((1.19, .30) ≈ (1.17223, −0.17717); (−0.595, .30) ≈ (−0.59277, −0.04454); (1.19, .42) ≈ (1.15532, −0.24625); x = 0 → sin cambio; bend 0 → identidad sin NaN) y `deformPlane` (no muta la entrada; con `rippleAmp = 0` coincide con `bendVertex` vértice a vértice; con ripple la desviación máxima en z es ≤ 0.006); verificar con `node --test`
- [ ] 3.4 RED→GREEN→TRIANGULATE: `bendForVelocity` (0 → .30, 2 → .36, ≥ 4 y negativos simétricos → .42, `reduced` → .30) y `leanForVelocity` (signo, tope `LEAN_MAX`, `reduced` → 0); verificar con `node --test`
- [ ] 3.5 RED→GREEN→TRIANGULATE: `cardWidthFraction` (≤480 → .77, ≥1024 → .37, 752 → .57), `trackDims` y `projectedWidthFraction` (≈ .37 ± .01 a 1440×830 y 1280×650; ≈ .77 ± .01 a 375×742; dimensiones ≤ 0 → `null`); verificar con `node --test`
- [ ] 3.6 RED→GREEN→TRIANGULATE: `cardTransform` (relative 0 → x 0, y 0, z = depth − 0.28, rotY 0, rotX 0; ±1 → x ±0.66687·R, y ±pitch, rotY ±≈0.3786 con R/D 3.6/1.6, rotX ∓0.01; simetría; lean sumado a rotX) e `isFacingCamera` (|relative| = 2.5 → no visible); verificar con `node --test`
- [ ] 3.7 RED→GREEN→TRIANGULATE: `coverUv` (1000×474 → sx ≈ .7153, ox ≈ .1423; 1000×468 → sx ≈ .7063; 1000×703 → sy ≈ .9426, oy ≈ .0287; mismo aspecto → identidad; foco 0/1 en los bordes) y `roundedRectSdf` (centro < 0, borde recto = 0, vértice exacto > 0 con r > 0, fuera > 0); verificar con `node --test`
- [ ] 3.8 RED→GREEN: `reelFrame` (5 cards; en fase 0 son visibles las de relative 0, ±1 y la de 0 está al frente con mayor z; velocidad 0 con `dt = 0`; `reduced` → `rippleAmp = 0`, `bend = .30`, lean 0), `dragToPhase` (izquierda avanza, derecha retrocede, abajo avanza con mouse, abajo ignorado con toque, eje dominante, clamp en 0 y N−1) y `keyToStop` (flechas, Home → 0, End → N−1, `null` en Flecha arriba/izquierda del primero y abajo/derecha del último, teclas ajenas → `null`); verificar con `node --test`
- [ ] 3.9 RED→GREEN: `STATUS_LABELS` exportado desde `src/data/proyectos.js` ("Demo", "En el mercado", "En curso") y `canvasLabel(project, index, total)` (incluye título, estado, descripción y "proyecto 1 de 5"); `ProyectoCard` pasa a usar `STATUS_LABELS`; verificar `scripts/proyectos-data.test.mjs` y `scripts/carrete3d.test.mjs` en verde

## 4. Adaptador Three.js (`src/three/carreteEscena.js`)

- [ ] 4.1 RED: ampliar `scripts/proyectos-guard.test.mjs` con las guardas de D10 para el adaptador y la carga diferida (`three` exacto; solo `src/three/carreteEscena.js` importa `from 'three'`; ningún archivo de `src/` importa el adaptador de forma estática; el adaptador llama `dispose()` de geometría/materiales/texturas/renderer y `forceContextLoss`; sin `thepromptsfactory`, `postMessage` ni `gallery` en `src/`) y verificar que fallan
- [ ] 4.2 GREEN: implementar `createCarreteEscena({ container, projects, onContextLost })` según D5 (canvas propio `aria-hidden`, renderer transparente con DPR ≤ 2, cámara 65.7/0.1/40 en z 8.1, una `PlaneGeometry(2.38, 1.5771, 48, 24)` compartida deformada con `deformPlane`, `ShaderMaterial` por card con `FrontSide`, SDF de esquinas con `fwidth` + `discard`, sombreado de curvatura, `coverUv` con `imageWidth/imageHeight`, `#include <colorspace_fragment>`, texturas sRGB con mipmaps, `webglcontextlost` → `onContextLost`, `dispose()` completo) importando solo los nombres necesarios; verificar que las guardas de 4.1 pasan y que `npm run build` compila

## 5. Modo y ciclo de vida (`useModoProyectos`, `useCarrete`)

- [ ] 5.1 Reescribir `useModoProyectos` para devolver `'reel' | 'carousel'` con `projectsMode` (indicio `WebGL2RenderingContext`, `(max-height: 599.98px)` en vivo, `overflow: clip`, `failed` recibido), estado inicial sincrónico; verificar con `npm run lint` y que `node --test` sigue en verde
- [ ] 5.2 RED: guardas estáticas de `useCarrete` en `scripts/proyectos-guard.test.mjs` (contiene `import('../three/carreteEscena.js')`; sin `passive: false` ni `preventDefault` en escuchas de `wheel`; sin `pushState`/`replaceState`; usa `cancelAnimationFrame` y `visibilitychange`) y verificar que fallan
- [ ] 5.3 GREEN: implementar `src/hooks/useCarrete.js` según D2, D3, D6, D8 y D9: medición cacheada (`ResizeObserver`, `resize`, `pageshow`, `load`), `IntersectionObserver` de precarga (`rootMargin: '0px 0px 150% 0px'`) con `import()` y bandera `cancelled`, `IntersectionObserver` de visibilidad, bucle rAF único con `dt` acotado y `last = null` al reanudar, render a demanda con movimiento reducido, asentamiento cancelable con `settleTarget`, arrastre con captura de puntero y `pointercancel`/`lostpointercapture`, teclado sobre la lista con `keyToStop`, `focusin` → `scrollTo` instantáneo + `frontIndex` sincrónico, escritura de `data-activo`, `aria-label` y póster solo al cambiar `frontIndex`, `failed` ante error de import/contexto, salida de modo al inicio de la sección y limpieza total; verificar con las guardas de 5.2 en verde y `npm run lint`
- [ ] 5.4 Borrar `src/hooks/usePinHorizontal.js` y verificar con `grep -r usePinHorizontal src` vacío y `npm run build` correcto

## 6. Componentes y estilos

- [ ] 6.1 RED: guardas de marcado en `scripts/proyectos-guard.test.mjs` para `src/components/proyectos/Carrete3D.jsx` (sin `UNIT-`, sin indicador `/ 0`, sin `aria-live`; contiene `role="img"`, "Ver proyecto", "Más en GitHub", "Scrolleá o arrastrá para explorar"; los enlaces externos con `target="_blank"` y `rel="noreferrer"`) y verificar que fallan
- [ ] 6.2 GREEN: crear `Carrete3D.jsx` con la estructura de D7 (título "03 // Proyectos" en dos líneas detrás del lienzo, contenedor `role="img"` con `touch-action: pan-y` y póster, lista de 5 enlaces "Ver proyecto ↗" con texto `sr-only`, enlace "Más en GitHub ↗", pista `aria-hidden`) y reescribir `Projects.jsx` con los modos `reel`/`carousel` (el carrusel reutiliza `ProyectoCard` y `ProyectosCierre` como última card); verificar guardas en verde y `npm run lint`
- [ ] 6.3 CSS en `src/index.css` (bloque de proyectos): `[data-mode="reel"]` con `.proyectos-pin` a `--pin-vh` (vh + svh), escenario sticky `top: var(--eva-nav-h)` / `100svh − barra` / `overflow: clip`, capas (título z-0, lienzo z-10, enlaces/pista z-20), enlaces superpuestos con solo `[data-activo]` y `:focus-visible` visibles y anillo `--eva-focus`, cursor `grab`/`grabbing`, pista abajo al centro; borrar el CSS de `pin`/`row`, indicador y barra; conservar `carousel`; verificar con `node --test` (guardas de clases/contraste existentes) y `npm run build`
- [ ] 6.4 Quitar la variante `strip` de `ProyectosCierre` si quedó sin uso y verificar con `grep` y `npm run lint`

## 7. Build y peso

- [ ] 7.1 RED→GREEN: agregar a la lógica testeable de `scripts/lib/` (con test en `scripts/`) una verificación de chunks: el chunk de entrada no contiene `WebGLRenderer` y existe un chunk que sí, de ≤ 150 KB gz; conectarla a `scripts/verify-build.mjs`; verificar con `npm run build && npm run verify:build` y anotar el peso gz real del chunk
- [ ] 7.2 Correr `npm run ci` completo y verificar que pasa (lint, verificaciones, tests, build, verify:build)

## 8. Documentación del change

- [ ] 8.1 Actualizar `design.md` con los valores finales calibrados (`RADIUS_K`, `DEPTH_K`, `CORNER_RADIUS`, `SHADE`, tamaño del título) y el peso gz medido en 7.1, y verificar que `openspec validate proyectos-carrete-3d --strict` sigue válido

## 9. Verificación manual (Playwright, `npm run build && npm run preview` con la CSP de producción o preview de Vercel)

- [ ] 9.1 1440×900 y 1280×720: tres cards visibles y curvas (frente ≈ 37%, derecha más alta, izquierda girando), esquinas redondeadas, título "03 // Proyectos" parcialmente tapado, capturas sin deformar y legibles, sin captions/contadores/flechas; capturas de pantalla en fase 0 y fase 2
- [ ] 9.2 Scroll → fase: la rueda avanza proyecto por proyecto con mesetas, no hay vuelta en los extremos, el pin se libera tras el quinto; detenerse a mitad de giro asienta en el más cercano; una nueva rueda cancela el asentamiento
- [ ] 9.3 Arrastre con mouse (izquierda y abajo avanzan; soltar asienta; `pointercancel` simulado libera), clic sin arrastre no abre nada; Flechas, Inicio y Fin con el foco en la lista; Flecha abajo en el último deja scrollear la página
- [ ] 9.4 Teclado: Tab por los 5 enlaces gira el carrete hasta cada proyecto y el enlace visible es el enfocado con su anillo; Shift+Tab vuelve; Tab sale a "Más en GitHub" y a la sección siguiente; "Ver proyecto ↗" apunta al `live`/`repo` del proyecto al frente; el `aria-label` del lienzo describe el proyecto al frente (snapshot de accesibilidad)
- [ ] 9.5 375×812 (táctil emulado): card del frente ≈ 77%, vecinas recortadas a los costados, deslizar vertical sobre el lienzo desplaza la página, arrastre horizontal gira y asienta, sin desbordamiento horizontal (`document.documentElement.scrollWidth === innerWidth`) a 375, 1280 y 1440
- [ ] 9.6 Movimiento reducido emulado: cambios por corte, sin ondulación ni flexión, cero cuadros con todo quieto (contador de `requestAnimationFrame` instrumentado con `browser_evaluate`); activar la preferencia en vivo no pierde el proyecto al frente
- [ ] 9.7 Sin WebGL (Chromium con `--disable-webgl` o `HTMLCanvasElement.prototype.getContext` → `null` antes de cargar) y con el chunk bloqueado por red: aparece el carrusel de respaldo con las 5 cards y el cierre, sin pin y sin errores; ventana < 600 px de alto → carrusel sin quedar varias pantallas más abajo
- [ ] 9.8 Ciclo de vida: con la sección fuera de pantalla (en Contacto) y con la pestaña oculta, el contador de rAF no avanza; al volver continúa sin salto; al pasar a respaldo no quedan rAF ni escuchas (`getEventListeners` / contador)
- [ ] 9.9 Red y consola: en la carga inicial no se pide el chunk de Three; se pide al acercarse a la sección; `#proyectos` directo carga y muestra el póster mientras tanto; consola sin violaciones de CSP ni errores; ningún pedido a otro dominio; Atrás/Adelante y bfcache restauran el proyecto correcto; el nav marca "Proyectos" durante el tramo y "Stack" al salir

## 10. Cierre

- [ ] 10.1 Archivar primero `proyectos-scroll-horizontal` (crea `openspec/specs/seccion-de-proyectos/spec.md`) y recién después este change; verificar con `openspec validate proyectos-carrete-3d --strict` que ya no aparece el aviso "target spec does not exist"
