# Design

## Context

Ver `proposal.md` (Why) y la especificación de animación del usuario (geometría, movimiento, ciclo de vida) con sus **decisiones de integración vinculantes**: sección fijada y manejada por el scroll de la página (sin capturar la rueda), arrastre + flechas + Inicio, asentamiento al más cercano, título "03 // Proyectos" detrás, un único "Ver proyecto ↗" + lista accesible, "Más en GitHub" como link chico, los 5 proyectos reales, estética Eva, sin modal/`?gallery`/`postMessage`, carrusel actual como respaldo.

Estado actual (de `proyectos-scroll-horizontal`, implementado y commiteado, sin archivar):

- `src/components/Projects.jsx`: modos `pin | carousel | row` (`useModoProyectos`), pista `ul.proyectos-pista` desplazada con `translate3d` por `usePinHorizontal`, indicador "01 / 02" + barra, `ProyectoCard` y `ProyectosCierre`.
- `src/utils/proyectosScroll.js`: `scrollProgress`, `pagePosition` (mesetas + *smoothstep*), `progressForPage`, `scrollTopForPage`, `settleTarget`, `pinRangeVh/pinHeightVh`, `SETTLE_IDLE_MS = 150`, más funciones de paginación (`pageCount`, `ctaPlacement`, `trackItemCount`, `pageStride`, `trackOffset`, `pageOfItem`, `currentPage`, `layoutMode`).
- `usePinHorizontal`: medición cacheada (`top`, `range`) con `ResizeObserver` + `resize` + `pageshow` + `load`; `scroll` pasivo → un rAF; asentamiento cancelable (`wheel`, `touchstart`, `keydown`, `pointerdown`); `focusin` → `scrollTo({ behavior: 'instant' })`; salida de modo que devuelve el scroll al inicio de la sección.
- CSS en `src/index.css` por `[data-mode]`; sticky con `top: var(--eva-nav-h)` y alto `100svh − barra`, `overflow: clip`. `<main>` con `overflow-x-clip` (necesario para el sticky).
- `src/data/proyectos.js`: 5 proyectos con `image` (webp en `public/`, 1000×474, 1000×474, 1000×468, 1000×703, 1000×703; 14–138 KB), `imageWidth/Height`, `live?`, `repo?`; `GITHUB_PERFIL_URL`, `CONTACTO_ANCLA`.
- Navegación: `NAV_HEIGHT_PX = 70` (`src/utils/siteNav.js`), scroll-spy por `IntersectionObserver` sobre los `id` de sección; `html { scroll-padding-top }` de la navbar.
- CSP de producción (`vercel.json`): `script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' …`. Escribir `el.style.*` (CSSOM) está permitido.
- Tests: solo `node --test "scripts/**/*.test.mjs"`, sin DOM; los tests importan ESM de `src/`.
- `three@0.187.0` es la `latest` de npm (publicada 2026-10-30). Medido en este diseño: bundle con `esbuild --bundle --minify` de `{ WebGLRenderer, PerspectiveCamera, Scene, PlaneGeometry, ShaderMaterial, Mesh, TextureLoader, SRGBColorSpace, … }` = **522 KB min / ≈ 130 KB gz**, sin ninguna aparición de `eval(` ni `new Function`. Desde r163 Three.js solo soporta **WebGL 2**.

Gobernanza: **MEDIUM** (UI + interacción con scroll + nueva dependencia; sin datos de usuario ni seguridad). Las decisiones no obvias se muestran en la verificación (grupo 9).

## Goals / Non-Goals

**Goals:**
- Una sola fuente de verdad: **el scroll de la página**. Rueda, trackpad, teclado de página, arrastre, flechas, Inicio/Fin y foco terminan en una posición de scroll; el carrete solo la lee.
- Toda la matemática (mapeo scroll→fase y su inversa, curvado, transformaciones por card, amortiguación, dimensiones, recorte de texturas, SDF de esquinas, textos accesibles) en funciones puras con `node --test`; Three.js es un adaptador fino que aplica un "cuadro" ya calculado.
- 0 KB de Three.js en la carga inicial; un único rAF que se detiene fuera de pantalla y con la pestaña oculta; liberación completa.
- CSP sin cambios.

**Non-Goals:**
- Modal de vista previa, `?gallery`, `postMessage`, captions, contadores, flechas o botones visibles, datos demo o recursos de thepromptsfactory.com.
- Clic en una card lateral para traerla al frente (requeriría `Raycaster` y compite con el arrastre). Diferible.
- Capturas nuevas de los proyectos o imágenes dedicadas a WebGL (se reutilizan los webp; ver Open Questions).
- Archivar `proyectos-scroll-horizontal` (se hace antes, fuera de este change; ver Migration Plan).

## Decisions

### D1. Modos: `reel` | `carousel`

`projectsMode({ webgl2, short, supportsClip, failed })` (pura, en `proyectosScroll.js`) → `'carousel'` si `!webgl2 ∨ short ∨ !supportsClip ∨ failed`; si no, `'reel'`. Desaparecen `pin` y `row`.

- `webgl2`: indicio sincrónico `typeof WebGL2RenderingContext === 'function'` (barato, sin crear contexto). No garantiza que el contexto se cree (GPU en lista negra, `--disable-webgl`), por eso existe `failed`.
- `failed`: estado que el carrete pone en `true` si falla el `import()` del chunk, si `new WebGLRenderer` lanza (Three lanza "Error creating WebGL context") o ante `webglcontextlost`. Pegajoso durante la sesión de la página (no se reintenta).
- `short`: `(max-height: 599.98px)` en vivo (teléfono apaisado, zoom alto).
- `supportsClip`: `CSS.supports('overflow', 'clip')` una vez (sticky depende de `<main>` con `overflow-x: clip`).
- **Teléfonos y táctil ya no van al carrusel** (decisión del usuario: la spec original pide 77% en teléfono). **Movimiento reducido tampoco** (D8).

`useModoProyectos()` mantiene el estado inicial sincrónico y la suscripción a `matchMedia`; la salida de modo con el scroll dentro del tramo conserva el comportamiento actual (scroll instantáneo al inicio de la sección) — se mueve de `usePinHorizontal` a `useCarrete`.

Alternativa descartada: crear un contexto WebGL de prueba al montar para decidir el modo (gasta un contexto, tiempo de GPU en la carga inicial y no evita fallas posteriores).

### D2. Mapeo scroll → fase objetivo (sin vuelta en los extremos)

Se reutiliza la mecánica de mesetas de `proyectosScroll.js` con **paradas = proyectos** (N = 5) y nuevas constantes:

| Constante | Antes | Ahora | Motivo |
|---|---|---|---|
| `PLATEAU_VH` | 25 | **15** | 5 paradas: con 25/75 el tramo sería 525vh (scroll-jacking). |
| `TRANSITION_VH` | 75 | **45** | ≈ 4 muescas de rueda por giro a 900px de alto. |

`pinRangeVh(5) = 5·15 + 4·45 = 255`, `pinHeightVh(5) = 355` (spec: 300–400%). Por proyecto ≈ 60vh ≈ 540px a 900px.

- `target = pagePosition(scrollProgress({ scrollY, top, range }), N)` ∈ **[0, N−1]**, con mesetas enteras y *smoothstep* en las transiciones. **No hay vuelta**: al final del tramo `target = 4` y el pin se libera; al principio `target = 0`.
- La vista sí envuelve: cada card i se ubica en `relative = wrapRelative(i − phase, N)` ∈ [−N/2, N/2). Con `phase = 0`: relativos 0, 1, 2, −2, −1 → el quinto proyecto asoma a la izquierda (es un carrete). El salto de lado ocurre en |relative| = 2.5 (θ ≈ 1.83 rad), donde la card mira hacia atrás y está culada (D5): invisible.
- **Fase suavizada**: `phase` es estado del bucle (no de React): `phase = dampPhase(phase, target, dt)` con `phase += (target − phase)·(1 − e^(−13·dt))`, `dt = clampDt(Δt) ≤ 0.05 s`, más un tope de velocidad `MAX_PHASE_SPEED = 8` proyectos/s (equivalente al "clamp de impulso" de la spec: un salto de Inicio o del ancla no gira 4 cards en un cuadro) y *snap* cuando `|target − phase| < 1e-4`. El objetivo se lee en cada cuadro de `window.scrollY` + `top`/`range` cacheados (sin leer layout).
- **Proyecto al frente para la UI** (`frontIndex`): `round(target)` — no `round(phase)` — para que el enlace visible, el póster y la descripción accesible correspondan de inmediato a lo que el usuario pidió (importante para el foco: D7). Se escribe en el DOM solo cuando cambia.
- **Asentamiento**: se reutilizan `settleTarget(progress, N)` y `scrollTopForPage({ page, pages: N, top, range })` tal cual (con las constantes nuevas) y la misma capa cancelable de `usePinHorizontal` (temporizador de 150 ms tras el último `scroll`, cancelado por `wheel`/`touchstart`/`keydown`/`pointerdown`, sin asentar mientras haya un toque o arrastre activo). `behavior: 'smooth'` (o `'instant'` con movimiento reducido). La amortiguación de la fase se suma a la del scroll suave: el giro llega con una curva más suave, sin bucle (en la meseta `settleTarget` devuelve `null`).
- **Inversa para el arrastre** (nueva, pura): `smoothstepInverse(y) = 0.5 − sin(asin(1 − 2y)/3)` (forma cerrada de la inversa de `3t² − 2t³` en [0,1]); `progressForPosition(position, N)`: entero → centro de su meseta (= `progressForPage`), `k + f` → `(k·ciclo + PLATEAU + smoothstepInverse(f)·TRANSITION) / range`; `scrollTopForPosition({ position, pages, top, range })`.

Alternativas descartadas:
- Mapeo lineal progreso → fase sin mesetas: el proyecto nunca queda quieto; todo dependería del asentamiento JS (la capa frágil, ya discutido en el council del change anterior).
- Fase propia independiente del scroll (rueda capturada o arrastre que no mueve el scroll): dos fuentes de verdad que se desincronizan con el ancla, Atrás/Adelante, `pageshow` y el scroll-spy; el usuario lo descartó (sin capturar la rueda).
- Envolver la fase objetivo (vuelta infinita): un tramo de scroll finito no puede representar una fase sin fin, y el usuario saldría del pin en cualquier proyecto.

### D3. Arrastre, teclado y foco → `window.scrollTo`

Todo control explícito se traduce a una posición de scroll del tramo; el bucle lo ve como cualquier otro scroll.

- **Arrastre** (sobre el contenedor del lienzo): `pointerdown` (botón primario o toque) guarda `startPhase = target` y el punto; umbral de 4px antes de considerarlo arrastre (un clic no hace nada: no hay `click` handler, spec "Clic en una card"); `setPointerCapture`. En `pointermove`: `dragToPhase({ startPhase, dx, dy, pointerType, cardPx, count })` → `clamp(startPhase + avance/cardPx, 0, N−1)`, con avance = `−dx` (izquierda avanza) para todos y, **solo con mouse/lápiz**, `+dy` (abajo avanza) usando el eje dominante. `cardPx` = ancho en px de la card del frente (`cardWidthFraction(stageWidth) · stageWidth`): arrastrar un ancho de card = un proyecto. Se aplica `window.scrollTo({ top: scrollTopForPosition(...), behavior: 'instant' })` en el rAF siguiente (a lo sumo una vez por cuadro). Dentro del tramo el sticky no se mueve, así que el scroll programático solo hace girar el carrete. En `pointerup`: `scrollTo(scrollTopForPage(nearestStop(target)))` suave. `pointercancel` y `lostpointercapture`: liberar captura, terminar el arrastre y asentar (spec "la cancelación libera el puntero").
- **Táctil**: el contenedor tiene `touch-action: pan-y`. Un gesto vertical lo maneja el navegador (scroll nativo de la página → gira el carrete por D2) y emite `pointercancel`; un gesto horizontal llega como `pointermove` y arrastra. Por eso "arrastre vertical hacia abajo avanza" de la spec original queda solo para mouse: con el dedo, deslizar hacia abajo es *subir* la página (retrocede), que es lo nativo y esperable.
- **Teclado** (D7): solo con el foco en la lista de enlaces del carrete. `keyToStop(key, index, N)` (pura): `ArrowRight`/`ArrowDown` → `index + 1`, `ArrowLeft`/`ArrowUp` → `index − 1`, `Home` → 0, `End` → N−1; devuelve `null` en los extremos (Flecha abajo en el último, Flecha arriba en el primero) para **no** hacer `preventDefault` y dejar que la página siga (spec "Flecha en el extremo"). Si devuelve un índice: `preventDefault` y `links[i].focus()` → entra por el camino del foco.
- **Foco** (`focusin` en la lista): enlace `i` → si `round(target) !== i`, `window.scrollTo({ top: scrollTopForPage({ page: i, … }), behavior: 'instant' })` y actualización sincrónica de `frontIndex` (sin esperar al rAF) para que el enlace enfocado sea visible en el mismo cuadro. El giro visual lo anima la amortiguación (instantáneo con movimiento reducido). `instant` explícito por el `scroll-behavior: smooth` de `html`. El salto cae en el centro de una meseta: no dispara asentamiento.
- **Rueda**: nunca se escucha con `passive: false` ni se cancela; solo cancela el asentamiento (pasivo), como hoy.

### D4. Geometría y movimiento: funciones puras en `src/utils/carrete3d.js`

Sin Three.js ni DOM. Constantes con los valores de la spec:

`CAMERA = { fov: 65.7, z: 8.1, near: 0.1, far: 40 }`, `PLANE = { width: 2.38, height: 1.5771, segmentsX: 48, segmentsY: 24 }` (`halfWidth = 1.19`), `BEND_BASE = 0.30`, `BEND_MAX = 0.42`, `RIPPLE_AMP = 0.006`, `THETA_STEP = 0.73`, `PITCH_FACTOR = 0.52`, `Z_OFFSET = −0.28`, `ROT_X_STEP = −0.01`, `DAMPING_RATE = 13`, `DT_MAX = 0.05`, `MAX_PHASE_SPEED = 8`, `CARD_FRACTION = { desktop: 0.37, phone: 0.77 }`, y las de ajuste visual (iniciales, calibrables en la verificación sin tocar la spec): `RADIUS_K = 3.6`, `DEPTH_K = 1.6`, `FLEX_VELOCITY = 4` proyectos/s, `LEAN_K = 0.015`, `LEAN_MAX = 0.05`, `RIPPLE_SPEED = 0.8`, `CORNER_RADIUS = 0.07` (unidades del plano), `SHADE = 0.18`.

| Función | Contrato |
|---|---|
| `clampDt(dt)` | `clamp(dt, 0, 0.05)`; no finito → 0. |
| `dampFactor(dt)` | `1 − e^(−13·clampDt(dt))`: 1/60 → ≈0.19480, 0.05 → ≈0.47795, 0.2 → igual que 0.05, 0 → 0. |
| `dampPhase(phase, target, dt, { reduced })` | `reduced` → `round(target)` (D8); si no, paso amortiguado con tope `MAX_PHASE_SPEED·dt` y *snap* < 1e-4. |
| `wrapRelative(index, phase, count)` | `((index − phase + count/2) mod count) − count/2` con módulo positivo → [−N/2, N/2). N=5, fase 0: 0,1,2,−2,−1; fase 4, índice 0 → 1; fase 2.5, índice 0 → −2.5 (incluido), índice 5 no existe. |
| `bendVertex(x, z, bend, halfWidth = 1.19)` | `angle = (x/hw)·bend; r = hw/bend; x' = sin(angle)·r; z' = z + (cos(angle) − 1)·r`; `bend` ≈ 0 → identidad (sin dividir por 0). (1.19, .30) → (≈1.17223, ≈−0.17717); (−0.595, .30) → (≈−0.59277, ≈−0.04454); (1.19, .42) → (≈1.15532, ≈−0.24625). |
| `deformPlane(flat, out, { bend, time, rippleAmp, height })` | Recorre las posiciones planas (Float32Array xyz) y escribe en `out`: `bendVertex` + ondulación vertical `z += rippleAmp·sin(2π·y/height + time·RIPPLE_SPEED)`. `rippleAmp = 0` → solo curvado. No modifica `flat`. |
| `bendForVelocity(v, reduced)` | `reduced` → `BEND_BASE`; si no, `BEND_BASE + (BEND_MAX − BEND_BASE)·clamp(|v|/FLEX_VELOCITY, 0, 1)`: 0 → .30, ≥4 → .42, 2 → .36. |
| `leanForVelocity(v, reduced)` | `reduced` → 0; si no, `clamp(v·LEAN_K, ±LEAN_MAX)`. |
| `cardWidthFraction(width)` | ≤ 480 → .77, ≥ 1024 → .37, interpolación lineal entre medio. |
| `trackDims({ width, height })` | Escala `s` tal que la card del frente ocupe `cardWidthFraction(width)` del ancho visible a su profundidad: `k = 2·tan(fov/2)·(width/height)`, `s = f·k·(CAMERA.z − Z_OFFSET) / (PLANE.width + f·k·DEPTH_K)`; devuelve `{ scale: s, radius: RADIUS_K·s, depth: DEPTH_K·s, pitch: PITCH_FACTOR·s }`. 1440×830 → s ≈ 1.874; 375×742 → s ≈ 1.323. Dimensiones ≤ 0 → `null`. |
| `cardTransform(relative, dims, lean = 0)` | `θ = relative·0.73`; `x = sin θ·radius`, `y = relative·pitch`, `z = cos θ·depth − 0.28`, `rotY = atan2(depth·sin θ, radius·cos θ)`, `rotX = relative·(−0.01) + lean`, `scale`. relative 0 → x 0, y 0, rotY 0; ±1 → x ±0.66687·R, y ±pitch, z 0.74517·D − 0.28, rotY ±≈0.3786 (con R/D = 3.6/1.6). |
| `isFacingCamera(rotY)` | `cos(rotY) > 0` (para no dibujar las de atrás; el culado de caras traseras del material lo garantiza igual). |
| `projectedWidthFraction(dims, viewport)` | Fracción del ancho de pantalla que ocupa la card del frente (para triangular `trackDims`: ≈ .37 a 1440 y 1280, ≈ .77 a 375, ± .01). |
| `coverUv(imageAspect, planeAspect, focusX = .5, focusY = .5)` | Recorte *cover* sin deformar: imagen más ancha → `scale = [planeAspect/imageAspect, 1]`, `offset = [(1 − sx)·focusX, 0]`; más alta → `[1, imageAspect/planeAspect]`. Plano 2.38/1.5771 ≈ 1.5091: 1000×474 → sx ≈ .7153, ox ≈ .1423; 1000×468 → sx ≈ .7063; 1000×703 → sy ≈ .9426, oy ≈ .0287; igual aspecto → identidad. |
| `roundedRectSdf(px, py, hx, hy, r)` | SDF de rectángulo redondeado (referencia del shader): < 0 dentro, 0 en el borde, > 0 fuera; esquina exacta → `> 0` con `r > 0`. |
| `reelFrame({ phase, prevPhase, dt, count, dims, time, reduced })` | Cuadro completo: velocidad `v = (phase − prevPhase)/dt` (0 si `dt = 0`), `bend`, `rippleAmp` (0 si `reduced`), y por card `{ relative, ...cardTransform, visible }`. Es lo único que el adaptador necesita. |
| `nearestStop(phase, count)` | `clamp(round(phase), 0, count − 1)`. |
| `dragToPhase(...)` / `keyToStop(...)` | D3. |
| `canvasLabel(project, index, total)` | `"Carrete de proyectos. Al frente: {título}, {estado}. {descripción} (proyecto {i+1} de {N})"`. |

Los textos de estado ("Demo", "En el mercado", "En curso") pasan a una constante exportada `STATUS_LABELS` en `src/data/proyectos.js`, que usan `ProyectoCard` y `canvasLabel` (misma fuente; sin cambiar los datos).

**Por qué el curvado va en CPU y no en el vertex shader**: las 5 cards comparten curvatura y ondulación (dependen de la velocidad global y del tiempo), así que basta **una** `PlaneGeometry` compartida de 49×25 = 1225 vértices, deformada con `deformPlane` cuando cambia `bend` o corre la ondulación (≈ 15 KB por cuadro a la GPU, < 0.1 ms de CPU). Así la función que se testea es exactamente la que corre en producción, y el shader queda solo de fragmento. Alternativa descartada: curvado en GLSL con una copia JS "de referencia" (dos implementaciones que pueden divergir sin que ningún test lo note).

### D5. Adaptador Three.js: `src/three/carreteEscena.js`

Único módulo del proyecto que importa `three` (import estático con nombres: `WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, Mesh, ShaderMaterial, TextureLoader, SRGBColorSpace, LinearMipmapLinearFilter, LinearFilter`). API:

```
createCarreteEscena({ container, projects, onContextLost }) →
  { setSize(width, height, dpr), render(frame), dispose() }
```

- Crea **su propio `<canvas>`** (`aria-hidden="true"`) dentro de `container` y lo quita en `dispose()`. Así un remontaje (StrictMode en dev, cambio de modo) nunca reutiliza un canvas cuyo contexto se perdió con `forceContextLoss()`.
- `new WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'default' })`, `setClearColor(0x000000, 0)` (lienzo transparente sobre el fondo hex), `setPixelRatio(min(devicePixelRatio, 2))`. Lanza → lo captura `useCarrete` → `failed`.
- `PerspectiveCamera(65.7, aspect, 0.1, 40)` en z = 8.1; `setSize` actualiza `aspect` y la matriz de proyección.
- Una `PlaneGeometry(2.38, 1.5771, 48, 24)` compartida; se guarda la copia plana de posiciones; `render(frame)` llama `deformPlane` y marca `position.needsUpdate` solo si cambió algo.
- Un `ShaderMaterial` por card (`side: FrontSide` → caras traseras ocultas; `transparent: true`, `depthWrite: true`) con uniformes `uMap`, `uHasMap`, `uUvScale`, `uUvOffset` (de `coverUv` con `imageWidth/imageHeight` de los datos), `uAspect`, `uRadius`, `uBendMix` y `uShade`. Fragmento: SDF de rectángulo redondeado en espacio del plano con antialias por `fwidth`, `discard` si alpha < 0.002 (las esquinas transparentes no escriben profundidad y no tapan a las cards de atrás), sombreado de curvatura sutil `1 − SHADE·(2u − 1)²·bendMix`, color del panel Eva mientras no hay textura, `#include <colorspace_fragment>` para la conversión de salida. Orden correcto: Three ordena los transparentes de atrás hacia adelante; la profundidad resuelve los cruces.
- Texturas con `TextureLoader` (usa `<img>` same-origin: cumple `img-src 'self'`), `colorSpace = SRGBColorSpace`, mipmaps (WebGL 2 los admite en texturas no potencia de 2), anisotropía `min(8, max)`.
- `webglcontextlost` en el canvas → `onContextLost()` → modo respaldo.
- `dispose()`: `geometry.dispose()`, cada `material.dispose()` y `texture.dispose()`, `renderer.dispose()`, `renderer.forceContextLoss()`, quitar escucha y canvas.
- Escritura de `canvas.style` por Three = CSSOM: permitido por `style-src 'self'`.

**CSP**: los shaders son cadenas GLSL que compila el driver vía WebGL, no JavaScript: no requieren `'unsafe-eval'`. El bundle de `three@0.187.0` no contiene `eval(` ni `new Function` (verificado). `TextureLoader` no usa `fetch` (y aunque lo hiciera, `connect-src 'self'` lo cubre). No se agregan dominios.

### D6. Carga diferida y peso

- `useCarrete` crea un `IntersectionObserver` sobre la sección con `rootMargin: '0px 0px 40% 0px'` (dispara cuando la sección está a 0,4 viewports de entrar; con 150% la carga inicial a 1440×900 ya bajaba el chunk porque la sección arranca a ~1,8 viewports). Al primer cruce: `import('../three/carreteEscena.js')` (Vite genera un chunk separado con el adaptador + Three). Nunca se importa en modo `carousel`.
- Ningún otro archivo importa `three` ni el adaptador de forma estática (guarda estática, D10). Vite no agrega `modulepreload` para imports dinámicos al HTML.
- Peso: ≈ 522 KB min / **≈ 130 KB gz** (medición esbuild; Rollup ±5%); presupuesto **≤ 150 KB gz** para el chunk, verificado en `verify-build`. Texturas: 250 KB en total (los webp actuales), pedidas al crear la escena.
- **Mientras carga**: el escenario ya muestra título, enlaces, pista y un **póster** estático (`<img>` `aria-hidden`, la imagen del proyecto al frente, al tamaño de la card central) que se oculta tras el primer cuadro WebGL. Si el `import()` rechaza → `failed` → carrusel (spec "Falla de carga").

### D7. Estructura DOM, enlaces y accesibilidad

```
<section id="proyectos" data-mode="reel" aria-labelledby="proyectos-titulo" class="proyectos eva-hex-grid …">
  <div class="proyectos-pin" style="--pin-vh: 355">
    <div class="carrete-escenario" (sticky)>
      <h2 id="proyectos-titulo" class="carrete-titulo">  ← z-0, detrás del lienzo
        <span aria-hidden="true">03 //</span> <span>Proyectos</span>   (dos líneas)
      </h2>
      <div class="carrete-lienzo" role="img" aria-label={canvasLabel}>  ← z-10, el adaptador inserta el canvas; touch-action: pan-y
        <img class="carrete-poster" aria-hidden="true" …/>
      </div>
      <ul class="carrete-enlaces" aria-label="Proyectos">  ← z-20
        <li><a class="carrete-enlace" data-activo? href={live ?? repo} target="_blank" rel="noreferrer">
              Ver proyecto<span class="sr-only"> {título}: {demo|repositorio} (abre en una pestaña nueva)</span>
              <span aria-hidden="true"> ↗</span></a></li> ×5
      </ul>
      <a class="carrete-github" href={GITHUB_PERFIL_URL} target="_blank" rel="noreferrer">Más en GitHub<span class="sr-only"> (abre en una pestaña nueva)</span><span aria-hidden="true"> ↗</span></a>
      <p class="carrete-pista" aria-hidden="true">Scrolleá o arrastrá para explorar</p>
    </div>
  </div>
</section>
```

- **Un solo enlace visible, cinco enfocables**: los cinco `a.carrete-enlace` comparten la misma posición (centrados debajo de la card del frente); todos son `sr-only` salvo el de `[data-activo]` (el `frontIndex`, D2), que se ve como "Ver proyecto ↗" discreto (mono, mayúsculas, `eva-paper` con subrayado/borde `eva-orange` en hover). `.carrete-enlace:focus-visible` también lo hace visible (red de seguridad si el foco llega antes de que cambie `data-activo`), con el anillo `--eva-focus`. Al hacer Tab a un enlace oculto, D3 lo lleva al frente → pasa a ser el visible y enfocado: nunca hay foco en algo invisible ni un "falso" enlace para el mouse. Orden de Tab: 5 enlaces → "Más en GitHub" → sección siguiente (sin trampa; Shift+Tab sale hacia "Quién soy").
- Nombre accesible con la etiqueta visible al principio ("Ver proyecto …"): cumple 2.5.3 *Label in Name*. La lista da "lista, 5 elementos".
- `role="img"` + `aria-label` en el contenedor (los hijos son presentacionales); se actualiza solo cuando cambia `frontIndex` (sin región viva: el scroll no "habla" en cada proyecto).
- Pista "Scrolleá o arrastrá para explorar": `aria-hidden` (instrucción para puntero; los lectores usan la lista), abajo al centro, mono xs, `eva-gray` sobre `eva-black` (par ya cubierto por el test de contraste, ≥ 4.5:1).
- "Más en GitHub ↗": link chico (mono xs) abajo a la derecha del escenario; en teléfono, centrado sobre la pista.
- Título: `font-eva-display font-stretch-condensed uppercase`, `clamp(3.5rem, 13vw, 12rem)`, `leading-[0.85]`, "03 //" en `eva-orange`, "Proyectos" en `eva-paper` (contraste completo aunque las cards lo tapen en parte). Es el `h2` real de la sección (navegación por encabezados intacta).
- Sin `UNIT-0X`, "01 / 05", barras de progreso ni flechas en el modo `reel` (guarda estática).
- Modo `carousel`: el marcado actual del carrusel (`ul.proyectos-pista` + `ProyectoCard` + `ProyectosCierre` como última card), con su encabezado actual y "DESLIZÁ →". `ProyectosCierre` ya no usa la variante `strip` (no hay páginas).

### D8. Movimiento reducido

`useCarrete` escucha `REDUCED_MOTION_QUERY` en vivo. Con `reduce`:
- `dampPhase` devuelve `round(target)`: el carrete cambia **por corte** al cruzar la mitad de cada transición; quieto en el resto (spec). Sin ondulación (`rippleAmp = 0`), `bend = BEND_BASE` fijo, `lean = 0`.
- **Sin bucle continuo**: render a demanda (un rAF agendado ante `scroll`, `resize`, foco, carga de textura o cambio de preferencia). Con todo quieto, cero cuadros.
- Asentamiento y saltos con `behavior: 'instant'`; el póster/lienzo aparece sin fundido.

Alternativa descartada: mandar movimiento reducido al carrusel (como el change anterior). La spec del usuario pide expresamente que la navegación explícita siga funcionando al instante sin movimiento autónomo; el corte sin giro no anima objetos grandes ligados al scroll (WCAG 2.3.3).

### D9. Ciclo de vida: `useCarrete`

Un solo hook (reemplaza a `usePinHorizontal`), activo con `mode === 'reel'`:

- **Medición cacheada** igual que hoy (`top`, `range`, ancho/alto del escenario) con `ResizeObserver` (pin, escenario, `document.body`), `resize`, `pageshow`, `load`. `setSize` del adaptador y `trackDims` en cada re-medición. Nunca se lee layout por cuadro.
- **Bucle único**: `tick(now)`: `dt = last === null ? 0 : clampDt((now − last)/1000)`; `last = now`; `time += dt` (el tiempo de ondulación solo avanza con cuadros: al reanudar no hay salto); `target` desde el scroll; `phase = dampPhase(…)`; `frame = reelFrame(…)`; `scene.render(frame)`; actualizar `frontIndex` en el DOM si cambió; reagendar si `running`.
- `running = visible ∧ !document.hidden ∧ !reduced ∧ sceneReady`. `visible` por un segundo `IntersectionObserver` sin margen sobre la sección. `visibilitychange`/salida de pantalla → `cancelAnimationFrame` y `last = null`. Reanudar → `last = null` (primer `dt = 0`).
- **Inicialización**: `useLayoutEffect` mide y fija `phase = target` desde `window.scrollY` (sin animar desde el primero al volver con Atrás o desde bfcache, spec "Ancla y restauración"); idem en `pageshow`.
- **Asentamiento, arrastre, teclado, foco**: D2/D3.
- **Limpieza** (desmontar, salir de `reel` o `failed`): cancelar rAF y temporizador, desconectar ambos `IntersectionObserver` y el `ResizeObserver`, quitar todas las escuchas, `scene.dispose()`. Bandera `cancelled` para el `import()` que resuelve después de desmontar (StrictMode): si resuelve tarde, no crea la escena.
- **Salida de modo con el scroll dentro del tramo**: scroll instantáneo al inicio de la sección (mismo comportamiento que hoy).
- Sin `setState` por cuadro; el único estado de React que cambia es `failed` (una vez) y el modo.

### D10. Tests (Strict TDD, `node --test`)

- `scripts/carrete3d.test.mjs` (nuevo): cada función de D4 con triangulación usando los valores de la spec y los de referencia de la tabla (curvado con .30/.42/0, puntos ±halfWidth y centro; `wrapRelative` en fases 0, 2.5, 4 y fraccionales, rango semiabierto; `dampFactor` en 0, 1/60, 0.05, 0.2 y negativo; `dampPhase` convergente, tope de velocidad, *snap*, `reduced`; `cardTransform` en 0/±1/±2, simetría, `rotY` > π/2 para |relative| = 2.5 → no visible; `trackDims` con `projectedWidthFraction` ≈ .37 a 1440×830 y 1280×650, ≈ .77 a 375×742, `null` con 0; `coverUv` en los tres aspectos reales y el igual; `roundedRectSdf` dentro/borde/esquina/fuera; `deformPlane` no muta la entrada y con `rippleAmp = 0` coincide con `bendVertex`; `reelFrame` con 5 cards: 3 visibles de frente en fase 0, `rippleAmp` 0 con `reduced`; `dragToPhase` izquierda/derecha/abajo con mouse/abajo con toque (ignorado)/clamp en extremos; `keyToStop` incluidos los `null` de los extremos; `canvasLabel` con "proyecto 1 de 5" y "En el mercado").
- `scripts/proyectos-scroll.test.mjs` (actualizado): nuevas constantes (`pinRangeVh(5) = 255`, `pinHeightVh(5) = 355`, `pinHeightVh(1) = 0`), mesetas/monotonía con 5 paradas, `progressForPage(0|2|4, 5)` = 0.02941 / 0.5 / 0.97059, `settleTarget` con 5 paradas, `smoothstepInverse` (0, 0.5, 1 y `smoothstep(t)` → `t` para varios `t`), `progressForPosition`/`scrollTopForPosition` (entero = meseta; ida y vuelta con `pagePosition`), tabla de `projectsMode`; se borran los tests de las funciones de paginación eliminadas.
- `scripts/proyectos-guard.test.mjs` (actualizado, estático): `three` exacto `0.187.0` en `dependencies` (sin `^`/`~`); solo `src/three/carreteEscena.js` importa `from 'three'`; `useCarrete.js` contiene `import('../three/carreteEscena.js')` y ningún `src/` importa el adaptador estáticamente; el adaptador contiene `dispose()` de geometría, material, textura y renderer y `forceContextLoss`; ningún archivo de `src/` contiene `thepromptsfactory`, `postMessage` ni `?gallery`; `Carrete3D.jsx` sin `UNIT-`, sin indicador "/ 0", sin `aria-live`; ningún `addEventListener('wheel'` con `passive: false` ni `preventDefault` en un manejador de rueda; sin `pushState`/`replaceState`; se mantienen las guardas vigentes (`overflow-x-clip` en `<main>`, sin `gsap`/`motion`/`framer-motion`, sin `aria-hidden`/`inert` en `<li`/`<article`, sin `backdrop-` en la sección). Se quita la guarda de `repo-glitch` solo si ya no aplica (se conserva si sigue siendo válida).
- `scripts/proyectos-data.test.mjs`: sin cambios (más `STATUS_LABELS` cubre los tres estados).
- `scripts/verify-build.mjs` (+ su lógica testeable en `scripts/lib/`): el chunk de entrada no contiene `WebGLRenderer`; existe un chunk que sí, ≤ 150 KB gz.
- DOM, WebGL y hooks: verificación manual con Playwright (grupo 9), como en el change anterior.

### D11. Qué se elimina y qué se conserva de `proyectos-scroll-horizontal`

- **Se elimina**: `usePinHorizontal.js`; en `proyectosScroll.js` `PER_PAGE`, `pageCount`, `ctaPlacement`, `trackItemCount`, `pageStride`, `trackOffset`, `pageOfItem`, `currentPage`, `layoutMode`; indicador "01 / 02" + barra; CSS `[data-mode="pin"]` y `[data-mode="row"]` (pista con `translate3d`, `will-change`, columnas de a tres); variante `strip` de `ProyectosCierre` si queda sin uso.
- **Se conserva**: `src/data/proyectos.js`; `ProyectoCard` y `ProyectosCierre` (respaldo); CSS `[data-mode="carousel"]`; `scrollProgress`, `pagePosition`, `progressForPage`, `scrollTopForPage`, `settleTarget`, `pinRangeVh`, `pinHeightVh`, `projectLabel`, `SETTLE_IDLE_MS`; la técnica de medición/`pageshow`/salida de modo; `.proyectos-pin` con `--pin-vh`; sticky `top: var(--eva-nav-h)`, alto `100svh − barra`, `overflow: clip`; `overflow-x-clip` en `<main>`; ancla con el `scroll-padding-top` de la navbar.

## Calibración final (verificada en Playwright, grupo 9)

- `RADIUS_K = 3.6`, `DEPTH_K = 1.6` (sin cambios: 1440×900 y 1280×720 muestran 3 cards, frente ≈ 37%; 375×812 frente ≈ 77%), `CORNER_RADIUS = 0.07`, `SHADE = 0.18`, `FLEX_VELOCITY = 4`, `LEAN_K = 0.015`, `LEAN_MAX = 0.05`, `RIPPLE_SPEED = 0.8`.
- `trackDims` mide los **bordes curvados** de la card del frente (con el borde en `bendVertex(1.19, 0, 0.30)`): `s = f·k·(CAMERA.z − Z_OFFSET) / (2·xe + f·k·(DEPTH_K + ze))`. La fórmula de D4 (con `PLANE.width`) daba ≈ 34% en vez de 37% porque ignoraba la curvatura. `projectedWidthFraction` proyecta esos mismos bordes.
- Título: `clamp(4rem, 18vw, 17rem)` en escritorio; en < 768 px `24vw` y subido (`padding-bottom: 56%`) para que se lea sobre la card.
- Peso medido: chunk 3D 130.5 KB gz (≈ 128 KB según `verify:build`), entrada 73.7 → 74.6 KB gz.

## Risks / Trade-offs

- [Peso: +130 KB gz de JS] → solo bajo demanda, en chunk aparte, nunca en respaldo; presupuesto verificado en build. Alternativa a futuro: WebGL crudo (≈ 10 KB) si el peso molesta, sin cambiar la spec.
- [Headless/CI sin GPU (SwiftShader) o `failIfMajorPerformanceCaveat`] → no se usa `failIfMajorPerformanceCaveat` (rompería la verificación en Playwright y en equipos modestos funcionales); si el rendimiento por software resulta malo, se evalúa en la verificación.
- [Asentamiento en iOS con inercia] → se cancela con `touchstart`, no corre con un toque activo y espera 150 ms sin `scroll`; si molesta en la verificación, se desactiva para `pointer: coarse` con una constante (las mesetas siguen dando paradas).
- [Tramo de 355vh percibido como "scroll atrapado"] → la rueda nunca se cancela, las mesetas son cortas y las constantes son ajustables dentro de 300–400% sin tocar la spec.
- [Recorte *cover* de capturas 2.11:1 en una card 1.51:1: se pierde ≈ 29% del ancho] → foco centrado por defecto; ver Open Questions.
- [Nitidez: webp de 1000px en una card de ≈ 533 css px a DPR 2 (≈ 1066 px)] → leve reescalado; mipmaps + anisotropía; si se ve borroso, nuevas capturas (Open Questions).
- [Foco en un enlace `sr-only` antes de que cambie `data-activo`] → `focusin` actualiza `frontIndex` sincrónicamente y `:focus-visible` lo hace visible igual.
- [El navegador desplaza la página al enfocar un enlace cuando la sección no está fijada] → el `focusin` corrige con `scrollTo` instantáneo al scroll del proyecto (mismo patrón ya verificado en el change anterior).
- [Pérdida de contexto WebGL (GPU reiniciada, muchas pestañas)] → respaldo para la sesión; sin reintentos que puedan ciclar.
- [Scroll-spy: la sección ocupa 355vh] → sigue marcando "Proyectos" mientras está fijada, que es lo correcto; verificar que "Stack" se marque al salir.
- [Conflictos con `hero-brutalista` (en curso en el mismo árbol) en `src/index.css`] → el CSS del carrete va en el bloque de proyectos existente; aplicar después de que `hero-brutalista` esté commiteado.
- [Cambios entre `three` minor con API rota] → versión exacta fijada; actualizar es un cambio explícito.

## Migration Plan

1. **Antes de aplicar**: `proyectos-scroll-horizontal` commiteado (ya lo está) y, **antes de archivar este change**, archivar `proyectos-scroll-horizontal` (crea `openspec/specs/seccion-de-proyectos/spec.md`, sobre la que operan los MODIFIED/REMOVED de este delta; `openspec validate --strict` ya avisa que el archivo lo rechazaría sin esa base).
2. Aplicar en `rediseno-evangelion` después de `hero-brutalista` (comparten `src/index.css`). `npm install three@0.187.0 --save-exact`.
3. Preview de Vercel con la CSP de producción y recorrido Playwright (grupo 9).
4. **Rollback**: revertir el commit (vuelve el recorrido horizontal; `three` sale de `package.json`). Sin estado persistente.

## Open Questions

- ¿Foco horizontal por proyecto para el recorte *cover* (p. ej. `coverFocus` opcional en los datos) si alguna captura pierde contenido clave a los costados? Se decide en la verificación visual; no cambia la spec.
- ¿Capturas nuevas a 1600px (o 3:2) para mayor nitidez a DPR 2? Solo si la verificación muestra textos borrosos; no cambia la spec ni las tareas de código.
- Ajuste fino de `RADIUS_K`, `DEPTH_K`, `CORNER_RADIUS`, `SHADE` y del tamaño del título en la verificación (la spec fija el resultado: 3 visibles, ≈ 37%/77%, título parcialmente tapado).
