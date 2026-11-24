# Design

## Context

La motivación está en `proposal.md`. El estado actual que condiciona el enfoque:

- `src/components/Projects.jsx` elige entre dos modos (`reel` | `carousel`) con `useModoProyectos`. El modo `reel` monta `Carrete3D.jsx` + `useCarrete.js` (393 líneas: scroll → fase, arrastre, teclado, foco, asentamiento, ciclo de vida), que importa con `import()` el adaptador `src/three/carreteEscena.js` (único importador de `three@0.187.0`). La matemática vive en `src/utils/carrete3d.js` y `src/utils/proyectosScroll.js`. El modo `carousel` usa `ProyectoCard.jsx` + `ProyectosCierre.jsx` y el encabezado "03 // Proyectos" que se conserva.
- Guardas existentes que el change toca: `scripts/proyectos-guard.test.mjs` (prohíbe `backdrop-` en los archivos de proyectos, exige `three` exacto, `Carrete3D`, `data-mode="reel"`, fragmentos de color de `ProyectoCard`), `scripts/sistema-visual.test.mjs:255-257` (`.carrete-enlace`, `.carrete-github`), `scripts/lib/chunk-check.mjs` + `scripts/verify-build.mjs` (exigen un chunk con `WebGLRenderer`), `scripts/carrete3d.test.mjs` (44 tests) y `scripts/proyectos-scroll.test.mjs`.
- `.eva-glass` (`src/index.css`): `background-color: rgb(16 14 12 / .8)`, `backdrop-filter: blur(8px)`, `@supports not` opaco **después** de la regla base; su contraste lo verifica `scripts/eva-glass.test.mjs`. La spec `paneles-de-cristal` exige cristal solo en paneles estáticos, nunca dentro de pistas desplazables, desenfoque ≤ 12px.
- CSP de `vercel.json`: `script-src 'self'; style-src 'self'; img-src 'self' data:`. Las variables CSS que React escribe vía `style` (CSSOM) no las bloquea la CSP; ya se usa así con `--pin-vh`.
- Tests: `node --test "scripts/**/*.test.mjs"` sin DOM ni jsdom. Los componentes se cubren con guardas estáticas del código fuente y con Playwright; la lógica, con módulos puros.
- `src/pages/Home.jsx` (`useAnclaDirecta`) resuelve `/#proyectos` con `scrollIntoView` + reajustes por `ResizeObserver`; no depende del carrete (solo un comentario lo menciona).

## Goals / Non-Goals

**Goals:**
- Toda la lógica de la ventana deslizante y de la física del líquido en funciones puras testeadas con `node --test`; los hooks solo conectan DOM ↔ funciones puras.
- Cero recursos externos, cero dependencias nuevas; se quita `three`.
- El líquido "respira" siempre que el panel está a la vista (ondulación ambiental suave y determinista); el costo se acota con una tasa de cuadros reducida (~30 fps) mientras no hay resortes excitados, y fuera de pantalla / pestaña oculta / movimiento reducido no hay bucle.
- Delta de spec archivable con OpenSpec 1.14 (MODIFIED con todos sus escenarios; REMOVED con Reason + Migration).

**Non-Goals:**
- No se cambian los datos de `src/data/proyectos.js` ni las imágenes de `public/`.
- No se cambian `seccion-de-stack`, `seccion-de-contacto` (change paralelo `colores-de-marca-hover`) ni `paneles-de-cristal`.
- Sin burbujas ni partículas en el líquido, sin autoplay del panel.
- Sin modo de respaldo alternativo: el panel es el mismo en todos los navegadores.

## Decisions

### D1. Estructura DOM y capas

```
<section id="proyectos" class="proyectos eva-hex-grid" aria-labelledby="proyectos-titulo">
  <header …>  ← encabezado "03 // Proyectos" actual (h2 #proyectos-titulo, eva-stripes), sin la pista "DESLIZÁ →"
  <div class="proyectos-panel eva-glass-panel" data-panel>    ← único elemento con cristal; estático; variante propia, más translúcida que .eva-glass
    <div class="proyectos-barra">                              ← barra superior (fuera del líquido), también de cristal
      <span class="eva-panel-label">SYS // ARCHIVO DE PROYECTOS</span>
      <p class="proyectos-indicador" aria-hidden="true">01–03 / 05</p> + segmentos
      <button aria-label="Proyecto anterior" aria-controls="proyectos-lista" aria-disabled>◀</button>
      <button aria-label="Proyecto siguiente" …>▶</button>
    </div>
    <p class="sr-only" aria-live="polite" aria-atomic="true">{anuncio}</p>
    <div class="lcl-tanque" aria-hidden="true"><canvas/></div>  ← z 0, tercio inferior
    <div class="proyectos-ventana">                            ← z 1, overflow: clip
      <ul id="proyectos-lista" class="proyectos-pista">        ← flex + translateX
        <li><div.proyecto-foil><article.proyecto-card/></div></li> × 5   ← ver D13
      </ul>
    </div>
  </div>
  <ProyectosCierre/>                                           ← franja debajo del panel
</section>
```

- **Cristal propio (feedback del usuario)**: el panel se leía casi opaco con `.eva-glass` (tinte 0.8, blur 8 px). Se crea `.eva-glass-panel` en `index.css` (junto a `.eva-glass`, que **no se toca**: la usan About/Testimonios y la cubre `eva-glass.test.mjs`): tinte `rgb(16 14 12 / 0.42)` (rango permitido 0.30–0.50), `backdrop-filter: blur(16px) saturate(1.4)` (rango 14–18 px), borde violeta translúcido (`rgb(155 92 240 / 0.35)`), reflejo especular en el borde superior (degradé claro 0.16 → 0 en el 40% superior), brillo interior (`inset` violeta) y sombra exterior. La barra (`.proyectos-barra`) es un segundo nivel de cristal: tinte claro 0.05, borde violeta 0.3, `blur(6px)`. El `@supports not (backdrop-filter…)` de `.eva-glass-panel` (fondo opaco `--eva-panel`, sin degradé) va **después** de la regla base. El `backdrop-` sigue prohibido en los componentes: el desenfoque vive solo en CSS. Contraste: `scripts/panel-guard.test.mjs` compone el tinte del panel y de la barra sobre la grilla hexagonal (peor fondo) y exige ≥ 4.5 para papel y violeta claro. Con el panel más transparente, las cards (que no son cristal) conservan su fondo propio 0.94 (D9): el peor caso de D9 (naranja/papel sólidos) no depende del panel.
- **Capas (veredicto del council)**: el `<canvas>` es **hijo** del panel de cristal, se pinta **encima** del fondo del panel y **debajo** de las cards. Si estuviera detrás del panel, el tinte al 80% lo taparía y un lienzo animado detrás de un `backdrop-filter` obliga a re-desenfocar en cada cuadro. Como hijo, el `backdrop-filter` del panel solo desenfoca la grilla hexagonal estática de la sección.
- La sección lleva `eva-hex-grid` siempre (antes solo en modo `reel`) para que el cristal tenga algo que desenfocar.
- **Componentes**: `Projects.jsx` (sección + encabezado + panel + cierre), `src/components/proyectos/PanelProyectos.jsx` (barra, anuncio, tanque y ventana), `ProyectoCard.jsx` (reescrito), `TanqueLCL.jsx` (contenedor + canvas), `ProyectosCierre.jsx` (franja).
- **Hooks**: `src/hooks/usePanelProyectos.js` (porVista, inicio, anuncio, handlers, foco, deslizar) y `src/hooks/useTanqueLCL.js` (bucle, observadores, eventos de puntero).

### D2. Cards por ancho: 1 / 2 / 3 con cortes en 640 y 1024 px

- `< 640px` → 1, `640–1023.98px` → 2, `≥ 1024px` → 3. A 375 se ve 1 card; a 768 (tablet vertical), 2 de ~330 px; a 1024 ya entran 3 de ~300 px con la foto legible. Se descartó 768 como corte de 2 cards porque entre 640 y 767 una sola card queda demasiado ancha y baja la densidad.
- **Fuente única**: `src/utils/panelProyectos.js` exporta `CORTES = { dos: 640, tres: 1024 }` y `porVistaParaAncho(ancho)`. El CSS define `--por-vista` con `@media (min-width: 640px)` / `(min-width: 1024px)` (primer pintado correcto, sin JS). El hook lee `matchMedia` con los mismos cortes. Una guarda comprueba que `index.css` usa exactamente esos valores.
- Al cambiar `porVista`, `inicio = clampInicio(inicio, total, porVista)`: la ventana queda completa (escenario "Ensanchar la ventana al final": 375 → 1440 con el 5 visible ⇒ inicio 4 → 2 ⇒ 3-4-5).

### D3. Ventana deslizante: sin vuelta, botones con `aria-disabled`

- Funciones puras en `src/utils/panelProyectos.js`:
  - `maxInicio(total, porVista) = max(0, total − porVista)`; `clampInicio(inicio, total, porVista)`.
  - `mover(inicio, delta, total, porVista)` → `clampInicio(inicio + delta, …)`; **sin vuelta**.
  - `ventanaVisible(total, inicio, porVista)` → índices `[i … i + porVista − 1]` (acotado: siempre completa; con `total ≤ porVista` → todos).
  - `puedeRetroceder` / `puedeAvanzar`; `hayNavegacion(total, porVista) = total > porVista`.
  - `inicioParaMostrar(indice, inicio, total, porVista)`: corrimiento mínimo para que `indice` quede dentro (foco por Tab).
- **Sin vuelta (disabled en extremos)**: con ventana de 3 sobre 5 proyectos, la vuelta desde 3-4-5 saltaría a 1-2-3 (un salto de dos, no "de a uno"), rompiendo el modelo mental de la ventana deslizante y el indicador; con 1 por vista la vuelta es menos chocante pero se mantiene la misma regla en todos los anchos para que el comportamiento sea uno solo. Los extremos visibles comunican "no hay más", y el cierre de GitHub queda justo debajo.
- **`aria-disabled="true"` en lugar de `disabled`**: un `<button disabled>` pierde el foco al llegar al extremo (el foco cae al `body`). Con `aria-disabled` el foco se queda, el lector anuncia "no disponible" y el handler ignora la activación. Estilo atenuado por `[aria-disabled="true"]`.
- `inicio` es estado de React (cambia solo por interacción, no por cuadro). El desplazamiento se aplica con dos variables CSS en `.proyectos-pista`: `--inicio` y `--por-vista`:
  - `li { flex: 0 0 calc((100% − (var(--por-vista) − 1) * var(--proyectos-gap)) / var(--por-vista)) }`
  - `transform: translateX(calc((100% + var(--proyectos-gap)) / var(--por-vista) * var(--inicio) * -1))` (el `%` de `translate` es el ancho de la pista = ancho de la ventana).
  - Transición `transform 320ms` solo bajo `@media (prefers-reduced-motion: no-preference)`; solo `transform` (composición), nunca `left`/`width`.
- **`overflow: clip`** en `.proyectos-ventana`: no es contenedor de scroll, así que el navegador no puede correr `scrollLeft` al enfocar una card fuera de vista y desincronizar el `translateX`. Respaldo `overflow: hidden` declarado antes; el handler de `focusin` además pone `scrollLeft = 0` por si el navegador no soporta `clip`.
- **Margen para el foil (D13)**: `.proyectos-ventana` lleva `padding-block: 1.5rem; margin-block: -1.5rem; padding-inline: 0.9rem; margin-inline: -0.9rem`: el área recortada crece lo que se levanta y gira una card (≈ 15 px a los lados, ≈ 20 px arriba/abajo) sin cambiar el layout. El margen horizontal (0.9 rem) es menor que el `gap` (1 rem), así las cards vecinas fuera de la ventana nunca asoman.
- Las cards fuera de la ventana **no** llevan `inert` ni `aria-hidden` (spec "Lista accesible"): siguen en el orden de Tab; `focusin` en la pista calcula el `li` y llama `inicioParaMostrar`.

### D4. Indicador y anuncio

- `etiquetaIndicador(inicio, porVista, total)` → `"01–03 / 05"` o `"03 / 05"` (con guion largo `–`, ceros a la izquierda). Visual, `aria-hidden`, más una barra de N segmentos (los visibles en violeta primario = estado activo).
- `anuncioVentana(inicio, porVista, total)` → `"Proyectos 2 a 4 de 5"` o `"Proyecto 3 de 5"`.
- El texto del `aria-live="polite"` se escribe **solo** en los handlers de interacción (botones, deslizar); arranca vacío, por eso cargar o redimensionar no anuncia. El foco por Tab tampoco anuncia (el lector ya lee la card enfocada).
- `projectLabel(index, total)` ("Proyecto X de N") se muda de `proyectosScroll.js` a `panelProyectos.js`.

### D5. Deslizar en táctil

- `direccionDeslizar({ dx, dy, umbral = 40 })` → `1` (dedo a la izquierda: avanza), `−1` o `0` (gesto corto o predominantemente vertical: `|dx| < umbral` o `|dx| ≤ |dy|`).
- Escuchas pasivas `pointerdown`/`pointerup`/`pointercancel` en la ventana, solo `pointerType === 'touch'`; `touch-action: pan-y` en la ventana: el scroll vertical es nativo y nunca se llama `preventDefault`. Sin arrastre que siga al dedo (la transición CSS hace el resto): más simple y sin conflicto con el scroll.

### D6. Card: contenido, foto-enlace y "Repo privado"

- Orden: foto (relación fija `aspect-ratio: 16 / 9`, `object-cover`, así las capturas 1000×474 y 1000×703 dan cards iguales) → barra con título + `StatusBadge` (se conservan `STATUS_LABELS` y `STATUS_CLASSES`: demo = secondary, live = tertiary) → descripción `line-clamp-3` (Tailwind 3.4 nativo; el texto completo sigue en el DOM) → etiquetas → acciones con `mt-auto` (alturas iguales: los `li` se estiran en el flex y la card es `h-full flex-col`).
- `etiquetasVisibles(tags, max = 3)` → `{ visibles, resto }`. Se renderizan las visibles y un chip `+N` `aria-hidden`; la lista completa va en un `sr-only` ("Tecnologías: …") para que el lector lea las seis.
- **Card entera enlazada (patrón "stretched link")**: un único `<a href={live} target="_blank" rel="noopener noreferrer" class="proyecto-enlace">` en el título, con `::after` absoluto `inset: 0` que cubre toda la card; la foto es un `<img alt="">` decorativo (no hay un segundo enlace). Nombre accesible: "{título} (abre el sitio en una pestaña nueva)". Sin enlaces anidados: el botón de repositorio (enlace o `disabled`) lleva `relative z-10` y queda por encima del `::after`, fuera del `<a>` de la demo. Si un proyecto no tuviera `live`, el título se renderiza sin enlace (hoy los 5 tienen). El anillo de foco se dibuja sobre la **card** (`.proyecto-card:has(.proyecto-enlace:focus-visible)`, `outline` aqua de 2 px con `outline-offset: -6px`), no sobre el título.
- `accesoRepositorio(project)` → `{ tipo: 'enlace', href }` | `{ tipo: 'privado' }`.
  - Enlace: `<a … rel="noopener noreferrer">` con ícono GitHub, "Repositorio" + `sr-only` "de {título} (abre en una pestaña nueva)".
  - Privado: `<button type="button" disabled>Repo privado</button>` gris (`border-eva-gray-dim text-eva-gray`, `cursor-not-allowed`), mismo alto que el enlace. `disabled` nativo: no es enlace, no entra en el orden de Tab, no se activa y el lector lo anuncia como no disponible. (A diferencia de las flechas, acá no importa perder el foco: nunca lo tiene.)
- **Colores por rol**: violeta (primary) para el marco del panel, el hover/foco de la card (`hover:border-eva-primary`, `focus-within:border-eva-primary`) y los estados activos (flechas, segmentos). El naranja (secondary) queda para el líquido, el badge "Demo" y las franjas. Se quitan las sombras naranjas desplazadas de la card actual. Las guardas de `jerarquia-color` en `proyectos-guard` se actualizan a estos fragmentos.

### Ajuste posterior del tanque: nivel 2/3, tope en fracción del panel y puntero sutil

Feedback del usuario, que reemplaza las cifras "del tanque de 1/3" del D7 (sigue valiendo la estructura): el canvas cubre **todo el panel** (`.lcl-tanque { inset: 0 }`, debajo de la ventana y de la barra) y el líquido llega a **2/3 del alto del panel** en calma (`NIVEL_LLENADO = 2 / 3`, la superficie queda a 1/3 desde arriba; el respaldo `data-lcl="estatico"` usa `inset: 33.333% 0 0`). Todas las alturas `h` están ahora en fracciones del alto del **panel**: `AMP_MAX = 0.09` (ninguna cresta pasa del 9% del panel sobre el nivel de reposo; la cresta más alta queda a 1 − 2/3 − 0.09 ≈ 24% desde arriba, y un test exige ≥ 20% para no invadir la barra "SYS // ARCHIVO DE PROYECTOS", que ocupa ≲ 14% del panel). La respiración ambiental no sube: `AMB_AMP = 0.017` (= 1.7% del panel, lo mismo que 0.05 del tanque anterior).
Puntero mucho más sutil: ganancia `0.05` por px/ms (≈ 40% del efecto anterior), tope por evento `IMPULSO_PUNTERO_MAX = 0.06` y tope acumulado por cuadro `IMPULSO_MAX = 0.3`, toque `0.18`, amortiguación `D = 3` (antes 2), `ENERGIA_REPOSO = 1e-6` (reescalada a las nuevas unidades). Se mantiene la propagación suave (laplaciano, líquido viscoso). Un barrido muy rápido (5 px/ms) llega a ≲ 50% del tope y un sacudón sostenido nunca lo pasa (tests en `scripts/lcl.test.mjs`). Un puntero quieto (eventos sintéticos al hacer scroll o moverse una card) no excita el líquido: solo cuenta si la fuerza es > 0. Tras un barrido el líquido vuelve a ~30 fps en ≈ 3.5 s.
Legibilidad: más de cada card queda sobre el líquido, pero el fondo propio 0.94 de la card (D9) se verificó contra naranja y papel sólidos (peor caso), que no dependen del nivel. Fuera de las cards, lo único que queda dentro del panel es la barra (etiqueta, indicador, flechas), que está **fuera** del rango del líquido (cresta más alta ≥ 20% desde arriba), y el margen inferior sin texto: ningún texto queda directamente sobre el líquido (test de despeje de la barra en `lcl.test.mjs`; el cierre está fuera del panel).

### D7. Tanque de LCL: Canvas 2D + resortes 1D (versión "enriquecida", veredicto del council 4/4)

Alternativas descartadas como técnica principal: shader WebGL (vuelve a meter un contexto GPU y su ciclo de vida, justo lo que se elimina), SVG `feTurbulence` (costoso de animar y sin respuesta física al puntero), CSS puro (no reacciona al cursor de forma creíble).

**Física — `src/utils/lcl.js` (puro, sin DOM):**
- `resortesParaAncho(anchoCss)` → `clamp(round(ancho / 12), 24, 160)`: cantidad de resortes proporcional al ancho, con separación constante en px, así la velocidad de propagación no depende del viewport.
- `crearSuperficie(n)` → `{ h: Float64Array(n), v: Float64Array(n) }` (desplazamiento normalizado al alto del tanque).
- `paso(sup, dt)` con **subpasos fijos** de `SUBPASO = 1/120 s` y `dt` acotado a `DT_MAX = 0.05 s` (máximo 6 subpasos por cuadro; al reanudar tras una pausa no hay saltos): por resorte `a = −K·h − D·v`, integración semi-implícita (`v += a·dt; h += v·dt`), luego propagación a los vecinos con el laplaciano discreto (`PROPAGACION = c²`, una pasada por subpaso, ≈ 35 resortes/s) sobre `v`, bordes reflectantes (el vecino faltante es el propio resorte) y **tope de amplitud** `|h| ≤ AMP_MAX = 0.35` (35% del alto del tanque ≈ 12% del panel: la cresta nunca tapa la parte superior de las cards).
- `acumularImpulso(pendientes, x01, fuerza)` / `aplicarImpulsos(sup, pendientes)`: los eventos **acumulan** en un buffer y el impulso se aplica una vez por cuadro en el tick (no por evento); reparto coseno en un radio de ~3 resortes; `x01` fuera de [0, 1] se ignora; el total por cuadro se acota a `IMPULSO_MAX`.
- `impulsoDelPuntero({ dx, dy, dtMs })` → fuerza proporcional a la velocidad del puntero, acotada; 0 sin movimiento. `impulsoDeToque()` → impulso fijo moderado.
- `energia(sup)` = promedio por resorte de (h² + v²) (independiente de la cantidad de resortes).
- **Respiración ambiental (decisión del usuario, reemplaza al "bucle que duerme en reposo")**: `ondaAmbiental(x01, t, capa)` → suma de **2 senos lentos** por capa (`AMB_AMP = 0.05` del alto del tanque; períodos de ~7 s y ~11 s, número de onda y fase distintos por seno y por capa). Es función pura del tiempo (determinista, sin `Math.random`). Se **suma** a la simulación y el resultado se acota: toda capa cumple `|h| ≤ AMP_MAX = 0.35`. Como el ambiental es ≤ 0.05 (≈ 14% del tope), la cresta máxima del líquido, y por tanto el contraste del texto de la card del D9, no cambia.
- `shouldAnimate({ visible, hidden, reduced })` → `visible && !hidden && !reduced`. La energía **ya no** decide si hay bucle: decide a qué ritmo corre.
- `intervaloCuadro({ energy })` → `INTERVALO_AMBIENTAL_MS = 1000/30` si `energy ≤ ENERGIA_REPOSO` (solo ambiental: ~30 fps bastan para un movimiento de períodos de segundos) o `0` (todos los cuadros del navegador) si hay resortes excitados. `debeDibujar({ now, ultimo, energy })` → `ultimo == null || now − ultimo ≥ intervaloCuadro(energy) − 1` (1 ms de tolerancia por jitter del rAF). El rAF sigue pidiéndose en cada cuadro del navegador (callback casi vacío cuando se salta); lo que baja a ~30/s son los dibujos y pasos de simulación. Los cuadros saltados no dibujan ni simulan: `dt` se acumula hasta el siguiente cuadro dibujado (acotado por `DT_MAX`).
- `capasDeSuperficie(sup, t)` → 3 curvas: la principal (simulación + ambiental de la capa 0) y 2 secundarias derivadas (muestreo desplazado unos resortes, amplitud de la simulación ×0.6 y ×0.35, más su propia onda ambiental con fase y velocidad distintas por capa). Cada capa se acota a `AMP_MAX`. Con la superficie en reposo las 3 capas **no son planas**: ondulan con `t`; con `t` fijo son idénticas entre corridas.
- `dprAcotado(dpr)` → `clamp(dpr || 1, 1, 1.5)`: el líquido es suave, no necesita más resolución.
- Todo determinista (sin `Math.random`).
- **Burbujas (feedback del usuario)** — `src/utils/lclBurbujas.js` (puro): `crearRng(semilla)` (mulberry32, semilla inyectable; el hook usa una constante fija), `crearBurbujas(n, rng)` → pool fijo de `N_BURBUJAS = 10` en arreglos tipados (sin asignaciones por cuadro), `pasoBurbujas(b, dt)` y `xBurbuja(b, i)`. La altura `y` es la fracción de la columna de líquido (0 = fondo, 1 = superficie): la burbuja sube lento (0.08–0.2 columnas/s) con vaivén lateral de ≤ 1.2% del ancho, al llegar a 1 **renace abajo** con x/radio/velocidad nuevos del PRNG (el pool no crece), y el dibujo la ubica entre el fondo y la altura de la capa principal en ese x, por lo que sigue a la ola sin acoplarse a la simulación. `x` siempre en [0, 1]. Se mueven dentro del mismo bucle (ambiental ~30 fps / completo con ondas); con movimiento reducido el cuadro estático muestra el pool en su posición actual (sin bucle). El empuje del puntero sobre burbujas queda fuera (opcional, no se implementa).

**Dibujo — `useTanqueLCL` + `TanqueLCL.jsx`:**
- Contexto `2d` con `{ alpha: true }`; `ctx.setTransform(dpr, …)`; tamaño del canvas = caja CSS × DPR acotado; `ResizeObserver` con **debounce de 120 ms** recalcula resortes (re-muestreando las alturas) y tamaño.
- Arte (el riesgo principal es que parezca un "gráfico de ondas"): 3 capas de superficie translúcidas (las secundarias detrás, alfa 0.26 y 0.18), relleno de la principal con **degradé vertical ámbar** del color del rol secondary (alfa 0.38 en la superficie → 0.58 en el fondo: se ve a través y es más denso abajo, más un velo oscuro de profundidad al 30%), burbujas (relleno translúcido, borde fino y un brillo) y un **menisco** fino (1–1.5 px, papel al ≤ 50% sobre el naranja) siguiendo la cresta de la capa principal. Curva con `quadraticCurveTo` entre puntos medios (sin aristas).
- Color: se lee `EVA_THEME_COLORS.secondary` de `src/styles/eva-tokens.js` (no se escribe `#FF7A1A` ni el nombre del color en componentes; la guarda de jerarquía detecta nombres de color).
- **Eventos (una sola escucha)**: `pointermove` pasivo en el contenedor del panel (los eventos de las cards burbujean); el canvas tiene `pointer-events: none`. `x` relativo al panel → `x01` → índice de resorte. `pointerType === 'mouse'` → `impulsoDelPuntero`; `touch`/`pen` → `pointerdown` → `impulsoDeToque` (onda en el punto tocado). Nunca `preventDefault`. Si el bucle no corre (panel fuera de pantalla), el impulso solo se acumula en el buffer (acotado).
- **En reposo**: la superficie respira con la onda ambiental (sin interacción no hay ondas del cursor). Con movimiento reducido: un único cuadro con `t = 0`.

### D8. Ciclo de vida del líquido (patrón de D8/D9 del change archivado `proyectos-carrete-3d`)

- Un único `requestAnimationFrame`; `last = null` al reanudar (el primer cuadro usa `dt = 0`) y `dt` acotado por `paso`.
- `IntersectionObserver` sobre el panel → `visible`; `visibilitychange` → `hidden`; `matchMedia(REDUCED_MOTION_QUERY)` con `change` → `reduced` (en vivo). Cada cambio re-evalúa `shouldAnimate`; si da `false`, `cancelAnimationFrame` y no hay bucle; si da `true`, hay un único rAF activo. Dentro del tick, `debeDibujar` salta cuadros del navegador cuando solo hay ambiental (~30 fps) y deja pasar todos si `energia > ENERGIA_REPOSO`. El reloj `t` es el tiempo acumulado de cuadros dibujados (no `Date.now()`): tras una pausa la onda continúa sin saltos.
- **Movimiento reducido**: se dibuja **un** cuadro estático (superficie con `t = 0`, degradé, menisco y burbujas en su posición actual), no se registra `pointermove`/`pointerdown` del líquido, no hay bucle. Al desactivar la preferencia se vuelven a registrar.
- **Sin contexto 2D** (`getContext` devuelve `null` o lanza): el contenedor recibe `data-lcl="estatico"` y el CSS pinta un degradé naranja equivalente (plan B, ver D11). Sin errores en consola.
- Limpieza al desmontar: `cancelAnimationFrame`, `disconnect` de ambos observadores, `removeEventListener` de todo, `clearTimeout` del debounce.

### D9. Legibilidad sobre el líquido y cristal

- El panel y la barra son cristal; las cards **no son cristal**: fondo propio semiopaco `rgb(16 14 12 / 0.94)` (tinte panel), **sin** `backdrop-filter`; así no violan "Cristal solo en paneles estáticos" (las cards se desplazan) y dejan ver un resplandor tenue del LCL.
- Contraste calculado con `scripts/lib/contrast.mjs` (`blendOver`) sobre los peores fondos: naranja sólido y papel sólido (cota superior del menisco). Con alfa 0.94: papel ≥ 13.8, gris ≥ 6.30, violeta claro ≥ 6.48, naranja ≥ 6.59, verde agua ≥ 13.19 (todos ≥ 4.5); fondo de card vs naranja ≈ 6.7 (≥ 3, límite del componente). Con 0.90 el gris sobre papel baja a 5.68: el margen es amplio pero la guarda fija 0.94 y falla si alguien baja la opacidad por debajo del umbral.
- La barra superior (etiqueta, indicador, flechas) está sobre el cristal, fuera del tanque: su contraste ya lo cubre `eva-glass.test.mjs`. Ningún texto queda directamente sobre el líquido.
- Los anillos de foco (verde agua; contra naranja solo 2.0:1) se dibujan **dentro** de la card: `outline-offset` negativo o padding interno ≥ ancho del anillo + offset en foto y botones. Se verifica en Playwright.
- **Reconciliación con la guarda `backdrop-`** (`proyectos-guard.test.mjs:61`): se mantiene que ningún archivo de `src/components/proyectos/*.jsx` ni `Projects.jsx` escriba `backdrop-`; el panel obtiene el cristal **solo** por la clase `eva-glass-panel` (cuyo CSS vive en `index.css`). La guarda se amplía: `eva-glass-panel` aparece exactamente en el contenedor del panel y nunca en `ProyectoCard.jsx`; la regla CSS de la card no declara `backdrop-filter`; el `@supports not` de `.eva-glass` sigue después de la base (ya cubierto por `eva-glass.test.mjs`).

### D10. Qué se elimina, qué se conserva

- **Se borran**: `src/components/proyectos/Carrete3D.jsx`, `src/three/carreteEscena.js` (y la carpeta), `src/utils/carrete3d.js`, `src/utils/proyectosScroll.js` (`projectLabel` se muda), `src/hooks/useCarrete.js`, `src/hooks/useModoProyectos.js`, `scripts/carrete3d.test.mjs`, `scripts/proyectos-scroll.test.mjs`; el CSS `.proyectos-pin`, `.carrete-*`, `[data-mode="reel"|"carousel"]`, `.proyectos-carrusel`; la dependencia `three` (`npm uninstall three`, actualiza `package-lock.json`).
- **Se adaptan**: `scripts/lib/chunk-check.mjs` + test pasan a exigir que **ningún** chunk contenga `WebGLRenderer` (guarda de regresión); `scripts/verify-build.mjs` deja de informar el "chunk 3D"; `scripts/sistema-visual.test.mjs` reemplaza las aserciones `.carrete-enlace`/`.carrete-github` por las del panel (flechas: borde `--eva-primary`, hover/activo violeta); `proyectos-guard.test.mjs` se reescribe (se conservan `overflow-x-clip` en `<main>`, sin `setInterval`, sin `aria-hidden`/`inert` en `li`/`article`, sin librerías de animación, sin `thepromptsfactory`/`postMessage`/`gallery`, sin `pushState`/`replaceState`).
- **Se conservan**: `src/data/proyectos.js`, `STATUS_LABELS`, `GITHUB_PERFIL_URL`, `CONTACTO_ANCLA`, el encabezado y `useReveal`, `ProyectosCierre` (pasa de card a franja horizontal: texto "Hay más en el archivo" + "Ver GitHub" + "Contactame"; se mantienen sus fragmentos de color), `useAnclaDirecta` en `Home.jsx` (solo se actualiza el comentario).
- Se quita la pista "DESLIZÁ →" del encabezado: las flechas visibles la reemplazan.

### D11. Plan B del líquido (rendimiento)

Si en la verificación de integración (Chrome DevTools, CPU ×4) el líquido (respirando en reposo y con el cursor) sostiene < 50 fps o > ~4 ms/cuadro de composición/pintado, se cambia a **plan B**: degradé CSS estático + una onda estática dibujada una vez (mismo aspecto que el cuadro de movimiento reducido), sin física ni bucle. El plan B reutiliza el camino `data-lcl="estatico"` de D8, así que no cambia la estructura ni las specs salvo los escenarios de ondas (que habría que revisar con el usuario).

### D12. Tests (Strict TDD)

- `scripts/panel-proyectos.test.mjs`: `porVistaParaAncho`, `maxInicio`, `clampInicio`, `mover`, `ventanaVisible`, `puedeAvanzar/Retroceder`, `hayNavegacion`, `inicioParaMostrar`, `etiquetaIndicador`, `anuncioVentana`, `projectLabel`, `direccionDeslizar`, `etiquetasVisibles`, `accesoRepositorio` (con los 5 proyectos reales).
- `scripts/lcl.test.mjs`: estabilidad con `dt` grande (10 000 pasos con impulsos máximos → sin `NaN`, `|h| ≤ AMP_MAX`), decaimiento de energía hasta `shouldAnimate` falso, propagación a vecinos, simetría del impulso, bordes, determinismo (dos corridas iguales), acumulación de impulsos (dos eventos en un cuadro = un impulso sumado y acotado), `x01` fuera de rango, `resortesParaAncho`, `dprAcotado`, `impulsoDelPuntero`, `capasDeSuperficie` (actividad 0 ⇒ capas secundarias sin deriva), `shouldAnimate` (tabla completa).
- `scripts/proyectos-guard.test.mjs` (reescrito): guardas de D3, D6, D8, D9, D10 sobre el código fuente y `index.css` (cortes 640/1024, `overflow: clip`, transición solo con `no-preference`, `touch-action: pan-y`, `aria-live="polite"`, `aria-label` de flechas, `aria-disabled`, `rel="noopener noreferrer"` en todo `target="_blank"`, "Repo privado" como `<button … disabled>`, canvas `aria-hidden`, `IntersectionObserver` + `visibilitychange` + `cancelAnimationFrame` + `ResizeObserver` en `useTanqueLCL`, sin `preventDefault`, sin `three` en `package.json` ni en `src/`, archivos del carrete inexistentes, contraste de la card sobre el líquido).

### Razonamiento: "Reposo sin cuadros" (nombre heredado del spec principal)

El escenario conserva su nombre porque OpenSpec exige copiar tal cual los nombres de los escenarios de un requisito MODIFIED; su contenido cambió. Antes: el bucle dormía al calmarse las ondas. Ahora: **sin interacción el líquido respira** y el bucle sigue activo mientras el panel está visible, la pestaña visible y no hay movimiento reducido; el costo se acota bajando a ~30 fps cuando no hay resortes excitados. Dormir sigue siendo la regla para fuera de pantalla, pestaña oculta y movimiento reducido (un cuadro estático).

### D13. Tarjeta foil 2.5D

La card pasa a ser un enlace entero (D6) con un efecto de "foil" 2.5D solo con CSS y puntero, sin WebGL, sin imágenes externas (la foto y el texto no cambian).
- **Estructura**: `div.proyecto-foil` (envoltorio, `perspective: 1500px`, no se transforma: así `pointerleave` no se dispara al inclinarse la cara) > `article.proyecto-card` (cara: `overflow: clip`, `isolation: isolate`, fondo 0.94 de D9) con dos capas decorativas `aria-hidden` al final (`.foil-brillo`, `.foil-iris`, `position: absolute; inset: 0; pointer-events: none`), por encima de la foto y del texto. **Radio de borde**: se mantiene 0 (estética brutalista Eva, no el ~4% del modelo original); el recorte lo hace `overflow: clip` igual.
- **Transform** (orden fijo): `translateZ(var(--tz)) rotateX(var(--rx)) rotateY(var(--ry)) scale(var(--s))`, con transición `0.2s cubic-bezier(.22,1,.36,1)` solo bajo `prefers-reduced-motion: no-preference`. Activo: `rotateY = 13·sx°`, `rotateX = −9·sy°`, `translateZ 46px`, `scale 1.05`.
- **Matemática pura** (`src/utils/foil.js`, `scripts/foil.test.mjs`): `tiltDesdePuntero({ px, py, rect, vw, vh })` → `{ rx, ry, mxf }` con `sx = clamp((px − centroX) / (vw / 2), −1, 1)` y `sy` igual con `vh` (normalizado por el **viewport**, no por la card, a propósito: una card en el centro de la pantalla gira poco, una en el borde gira más); `mxf = clamp((px − left) / ancho, 0, 1)` es local a la card. `estadoReposo()`, `estadoActivo()`, `estadoEnfoque()` y `propiedadesCss()` completan el módulo.
- **Hook** (`src/hooks/useFoil.js`): `pointermove` pasivo en el envoltorio escribe las variables CSS directamente (`style.setProperty`), sin rAF ni animaciones propias (interpola la transición CSS) y recalcula `getBoundingClientRect()` en cada evento (responsive). Solo corre con `(hover: hover) and (pointer: fine)`, sin movimiento reducido y `pointerType !== 'touch'`. Reinicio (`removeProperty`) en `pointerleave`, `pointercancel`, `focusout` y `Escape`. Las cards fuera de la ventana están recortadas, así que no reciben puntero. Limpieza completa al desmontar.
- **Brillo cristalino (feedback del usuario: "muy arcoíris" → vidrio claro)**: sin ningún barrido de color. `.foil-brillo`: banda blanca a 102° (`transparent 36%, blanco/.2 46%, blanco/.45 50%, blanco/.2 54%, transparent 64%`), `background-size: 260% 100%`, `background-position-x: mxf·100%`, `mix-blend-mode: screen`, `opacity: .7·hover`. `.foil-iris`: velo helado casi incoloro a 115° (`blanco/0 0%, rgb(235 245 255 / .35) 40%, rgb(200 235 255 / .18) 55%, transparent 70%`), `mix-blend-mode: soft-light` (no `color-dodge`, que satura), `opacity: .35·hover`. Las capas no usan roles ni nombres de color (guarda). Sombra reactiva `drop-shadow(0 calc(8px + 26px·hover) calc(16px + 34px·hover) rgb(0 0 0 / calc(.28 + .32·hover)))`; borde interior violeta `.5·hover`, filo blanco de 1px `.25·hover`, resplandor violeta (18px·hover, .18·hover) y resplandor helado (24px·hover, .08·hover, solo blanco).
- **Adaptaciones decididas**: (1) sin controles de reproducción/pausa ni "demostración" de 5.2 s: la card es un enlace y Enter debe abrir el proyecto; (2) **teclado**: con `:focus-visible` en el enlace (`:has()`), la card queda levantada y estática (`--tz: 46px`, `--s: 1.05`, `--hover: 1`, `--mxf: .5`, sin giro) con el anillo aqua; las flechas no giran la card (chocarían con el scroll de la página); `Escape` marca `data-reposo` y vuelve al reposo; (3) **táctil**: sin giro al arrastrar (el deslizamiento horizontal ya corre la ventana, umbral 40 px), el efecto queda apagado con `pointerType: touch` y `touch-action: pan-y` se conserva; (4) el recorte de la ventana se amplía con padding/margin (D3); (5) los listeners solo se registran en cada card y solo reaccionan con puntero fino; nada corre fuera de pantalla porque no hay bucle, solo eventos; (6) **movimiento reducido**: `transform: none !important`, sin transiciones, capas `display: none`; el hover solo refuerza borde/filo; (7) **contraste**: la banda blanca y el velo reducen el contraste del texto de forma transitoria solo mientras el puntero está sobre la card; en reposo y con foco de teclado (sin brillo ni giro, solo elevación) el texto conserva las garantías verificadas en D9.

## Risks / Trade-offs

- [El líquido parece un "gráfico de ondas"] → capas con deriva distinta, degradé ámbar, menisco, sin línea dura; revisión visual en Playwright a 1440 con capturas.
- [Bucle continuo en reposo] → ~30 fps con solo ambiental, canvas solo del tercio inferior, se detiene fuera de pantalla/pestaña oculta/reduced; si el perfil CPU ×4 no alcanza → plan B (D11).
- [Foil: `mix-blend-mode` + `filter: drop-shadow` en una cara 3D] → solo se activa con puntero fino y un `pointermove` pasivo; medido con CPU ×4 en el perfil (no hubo tareas largas); si diera problemas, bastaría quitar la capa `soft-light`.
- [Canvas a pantalla completa del panel] → mismo costo de comandos de dibujo (≈ 0.6–0.9 ms por dibujo con CPU ×4); DPR ≤ 1.5; ~30 fps en reposo.
- [Costo de pintado del canvas grande en pantallas 4K] → DPR ≤ 1.5, el canvas solo cubre el tercio inferior (la superficie en calma queda al 68% de su alto, asomando bajo las cards gracias al margen inferior del panel de 4.5 rem), el bucle corre a ~30 fps con solo ambiental y solo mientras el panel está visible; plan B (D11) si no alcanza.
- [`overflow: clip` sin soporte (Safari < 16)] → respaldo `overflow: hidden` + `scrollLeft = 0` en `focusin`.
- [`aria-disabled` no impide la activación por sí solo] → el handler consulta `puedeAvanzar/Retroceder`; guarda estática + Playwright.
- [Cards fuera de la ventana alcanzables con el cursor virtual del lector sin evento de foco] → se acepta: siguen siendo legibles (spec "Lista accesible"); con Tab la ventana se corre.
- [Desincronía entre cortes CSS y JS] → constante única + guarda que compara `index.css` con `CORTES`.
- [Conflicto con el change paralelo `colores-de-marca-hover` en `src/index.css` y tests de color] → este change solo toca el bloque de proyectos de `index.css` y las guardas de proyectos; integrar con `npm run ci` después de que ambos estén en `main`.
- [Archivo de la spec] → el `## Purpose` de `seccion-de-proyectos` sigue hablando de "paginados de a tres"; OpenSpec no lo actualiza al archivar.

## Migration Plan

1. Implementar en la rama `proyectos-panel-lcl` siguiendo `tasks.md` (TDD); `npm run ci` en verde.
2. Verificación en navegador (Playwright 1440×900, 768×1024, 375×667, movimiento reducido) y de rendimiento (CPU ×4); decidir plan B si corresponde.
3. Merge a `main` → deploy de Vercel. Rollback: revertir el merge (vuelve el carrete y `three`).
4. Al archivar: `openspec archive proyectos-panel-lcl`, y después editar a mano el `## Purpose` de `openspec/specs/seccion-de-proyectos/spec.md` para describir el panel de comando (OpenSpec no lo toca).

## Open Questions

- (Resuelta por el usuario) Respiración ambiental: **activada**. Bucle continuo mientras el panel es visible, ~30 fps con solo ambiental; ver D7/D8 y "Reposo sin cuadros".
- Textos finales de la barra ("SYS // ARCHIVO DE PROYECTOS") y del cierre: ajustables en el apply sin cambiar specs.
