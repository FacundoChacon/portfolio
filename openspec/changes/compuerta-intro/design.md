# Design

## Context

La motivación está en `proposal.md` (Why). Estado de `main` (17d0f65) que condiciona el enfoque:

- **Sitio CSR puro.** `index.html` trae `<div id="root"></div>` y `body.bg-eva-black`. Antes de que React monte, el visitante ve solo el fondo negro: no hay página que se pueda "asomar" antes de la compuerta. Sin JavaScript no se ve nada del sitio.
- **CSP de producción** (`vercel.json`): `script-src 'self'; style-src 'self'`. No admite scripts inline sin hash ni atributos `style`. Las clases arbitrarias de Tailwind (`[animation-delay:120ms]`) sí funcionan, porque se compilan al CSS.
- **Entrada del hero** (`useEscrituraHero.js`):
  - Calcula su estado inicial de forma síncrona: `fin` con movimiento reducido o si ya corrió en esta carga, y `estadoEn(0)` en cualquier otro caso.
  - Corre con rAF desde `performance.now()` del efecto.
  - Escucha `keydown` en `window` y `focusin` en la sección para completarse.
  - Tiene un flag de módulo de una ejecución por carga.
  - Duración ≈ 3,13 s.
  - LCP medido en `hero-escritura`: retrato en 768–1920 (pintado bajo un obturador desde el primer cuadro) y párrafo en 375, que se reporta cuando pinta su primer carácter.
- **Glifo**:
  - `LogoEva` pinta las tres capas con clases `eva-logo-*` (colores por `--eva-logo-*`), con `aria-hidden` y `focusable="false"`.
  - La variante completa mide 112×243 en el viewBox, una relación de 0,46: es vertical.
  - Guards vigentes: el hero no puede usar el glifo (`hero.test.mjs`) y ningún archivo puede escribir los hex del logo (`logotipo.test.mjs`).
- **Guards que restringen dónde van las animaciones**:
  - `limpieza-cyberpunk.test.mjs` fija que `tailwind.config.js` solo declara los keyframes `evaBoot` y `evaObturador`.
  - El de `hero.test.mjs` prohíbe timers y `style` en el hook de escritura.
- **Fuentes**:
  - La de títulos es Noto Serif Display variable (ancho 62,5–100 %), autoalojada y **precargada** (`PRELOAD_FONT_STEMS`), con `font-display: swap`.
  - La mono (JetBrains Mono) no se precarga.
  - El cuerpo usa la fuente del sistema.
  - La marca de la barra usa `font-eva-display font-stretch-condensed font-black uppercase`.
- **Capas**: la barra es `fixed z-50`, y el salto al contenido es `z-[60]` cuando tiene el foco.
- **Barras de desplazamiento**: en Chromium miden 6 px (`::-webkit-scrollbar`). `html` tiene `scroll-padding-top` y `scroll-behavior: smooth` sin movimiento reducido.
- **Entrada por ancla**: `Home.useAnclaDirecta` resuelve `/#id` en la primera carga con `resolveHashTarget` y `shouldApplyHash`.
- **Tests**: solo `node --test` (no hay Vitest ni RTL y no se agregan) y Playwright 1.65 desde el scratchpad.

## Goals / Non-Goals

**Goals:**
- Que la intro sea fiel al boceto del usuario (junta con el símbolo, "FACU CODE" debajo, apertura arriba/abajo) y que el hero se escriba recién cuando la compuerta se abre.
- Que la página real no pague la intro: sin destello previo, sin CLS, LCP dentro de los límites vigentes, CSP intacta y sin dependencias.
- Que la lógica (decisión, sesión, fases, salto) sea pura y testeable con `node --test`, y que hook y componente queden finos.

**Non-Goals:**
- Mostrar la intro en `/configurador` o en otras rutas.
- Cambiar la geometría, las variantes o los colores del glifo, o sus recursos derivados (favicon, ícono táctil, `og-image`).
- Cambiar la secuencia interna de la escritura del hero, sus textos o su layout.
- Una intro sin JavaScript (no hay sitio sin JavaScript) o una versión "suave" para movimiento reducido.
- Recordar la intro entre pestañas o entre sesiones (`localStorage`). El usuario eligió una vez por sesión.

## Decisions

### D1. La compuerta es una capa de React en el primer commit, no un script inline

`CompuertaIntro` se renderiza en `Home`, en el **mismo primer commit** que la página. La decisión de mostrarla es síncrona (inicializador de estado), así que el primer cuadro con contenido ya trae la compuerta cerrada encima y no hay destello de la página. Antes de ese commit no hay página que destellar: el `#root` está vacío sobre `bg-eva-black`.

Alternativas:
- **Script inline en `index.html`** que pinte la compuerta antes de React: la CSP lo bloquea. Hacerlo pasar obliga a agregar un `sha256-…` a `script-src` (cabeceras de seguridad) y a mantenerlo sincronizado. Además no aporta nada, porque no hay contenido previo que tapar.
- **Script externo `public/compuerta.js` en el `<head>`**: lo permite `'self'`, pero bloquea el parseo, duplica la lógica fuera del bundle y no tiene una ventaja visible por lo mismo.
- **Compuerta como condición de render** (no montar la página hasta abrir): demora el LCP y la descarga del retrato. Se rechaza por la spec.

Sin JavaScript, `index.html` no contiene compuerta (guard estático), así que se cumple sin código extra.

### D2. Estado compartido: proveedor en `Home` con hijos estables

`useCompuerta()` vive en un `CompuertaProvider` que envuelve `<SiteNav/>` y `<main>…</main>` en `Home`. Como el proveedor recibe sus hijos por `children`, un cambio de fase solo vuelve a renderizar a los consumidores del contexto (`CompuertaIntro` y `Hero`) y no a About, Projects ni las demás secciones. Hay ~4 cambios de fase.

La compuerta y el hero leen **la misma fuente**, así que la desaparición de la compuerta y el reinicio de la escritura caen en el mismo commit y el mismo cuadro (D5).

Alternativa: `useSyncExternalStore` sobre un store de módulo. Funciona igual, pero suma una mini-API propia sin necesidad.

### D3. Cuándo se muestra: función pura más una decisión por carga

En `src/utils/compuerta.js`, sin DOM:

```
debeMostrarCompuerta({ reducedMotion, rutaDeEntrada, hash, sesion }) → boolean
```

Devuelve `true` solo si se cumplen todas estas condiciones:
- `!reducedMotion`.
- `rutaDeEntrada === '/'`.
- `resolveHashTarget(hash) === null`: reutiliza la regla de anclas existente, así que un `#` vacío o inválido no cuenta como ancla.
- `sesion.disponible && !sesion.vista`.

**Ruta de entrada.** `rutaDeEntrada` es `location.pathname` capturado al evaluar el módulo del hook, que se importa en el arranque porque `Home` no es diferido. Así, entrar por `/configurador` y navegar después a `/` no la muestra: la ruta de entrada sigue siendo `/configurador`.

**Una decisión por carga.** El hook la calcula una sola vez por carga y la guarda en una variable de módulo (`decisionDeEstaCarga`). Por eso:
- El doble inicializador de `StrictMode` recibe la misma respuesta.
- Un segundo montaje de `Home` por navegación SPA, con la compuerta ya consumida (`consumida = true` al abrirse o saltarse), no la repite.

**Ancla.** Entrar con ancla **no gasta** la vez de la sesión: el flag significa "ya la vio". Lo fija la spec ("Recarga sin ancla después de entrar por una").

### D4. Flag de sesión: se marca al decidir y, si el almacenamiento falla, no hay compuerta

Funciones puras con el almacenamiento inyectado:
- `leerSesion(storage)` devuelve `{ disponible, vista }`. Si `getItem` lanza, devuelve `disponible: false`.
- `marcarSesion(storage)` devuelve `boolean` y nunca lanza.

Clave: `facucode.compuerta`, valor `vista`. El acceso a `globalThis.sessionStorage` también va dentro de `try`, porque el *getter* lanza `SecurityError` con cookies bloqueadas.

**Se marca al decidir mostrarla**, antes del primer cuadro, y no al terminar. Así, una recarga a mitad de la intro no la repite (spec). La escritura sirve además como prueba: si `setItem` lanza (cuota, Safari privado antiguo), la decisión pasa a **no mostrar**.

**Default seguro: sin almacenamiento, sin compuerta.** Si no se puede recordar, la intro se repetiría en cada recarga, y eso contradice el pedido explícito del usuario y molesta en cada visita. La intro es decorativa y saltearla no le quita nada al contenido. La alternativa "mostrar una vez por carga" se rechaza por esa repetición.

**Semántica de `sessionStorage`.** Es por pestaña: una pestaña nueva es una sesión nueva y una pestaña duplicada hereda el flag. Recargar, volver o adelantar en la misma pestaña lo conservan. Lo aceptó el usuario.

### D5. El hero "listo" bajo la compuerta cerrada, en espera durante la apertura y libre al abrirse

`estadoHeroSegunCompuerta(fase)` (pura) traduce la fase de la compuerta a un modo del hero:

| Compuerta | Modo del hero | Qué renderiza el hero |
|---|---|---|
| `armado`, `lectura`, `retiro` (cerrada) | `lista` | Estado **final** (texto completo, retrato sin obturador), sin listeners ni rAF y sin marcar la ejecución |
| `apertura` | `en-espera` | `estadoEn(0)`: todo reservado y transparente, obturador puesto, rAF detenido |
| `abierta`, saltada o sin compuerta | `libre` | La escritura de siempre, con `t0` en este momento |

`useEscrituraHero(linea, seccionRef, modo = 'libre')` suma ese tercer parámetro. Con `libre` y sin compuerta se comporta exactamente como hoy.

**Por qué el hero arranca en `lista` y no vacío.** Por el LCP:
- En 375 el candidato es el párrafo, que se reporta cuando pinta su primer carácter. Si el hero esperara vacío detrás de la compuerta, el LCP móvil de la primera visita pasaría de ~0,9 s a ~2,9 s. Eso rompe el límite vigente (base + 1 s) y empeora un Core Web Vital para cada primera visita, incluida la de Lighthouse.
- Con el hero pintado (tapado) desde el primer cuadro, el LCP queda en el primer cuadro, igual que el retrato tapado por el obturador. Lo midió `hero-escritura`: un elemento tapado por otro reporta en el primer cuadro.
- Cuando el texto vuelve a transparente y se reescribe, Chromium no emite una entrada nueva para un bloque ya registrado.

**Por qué no se ve el truco.** Las hojas son opacas y cubren toda la pantalla. El paso `lista` → `en-espera` ocurre en el mismo commit en que empieza la apertura, cuando la abertura mide 0 px. Al saltar con la compuerta cerrada, el paso `lista` → `libre` (escritura en `t = 0`) cae en el mismo commit que la desaparición de la compuerta (D2). En ningún caso el visitante ve el hero completo antes de la escritura.

**Por qué esperar a que termine la apertura.** El usuario pidió que la escritura "arranque después de que se abran las puertas". Durante los 500 ms de apertura se ve el hero vacío (fondo, grilla y franja inferior) a través de la abertura: una página a la espera de escribirse.

**Spike antes de integrar (tarea 1.3)** para medir tres cosas:
1. Que el LCP del párrafo en 375 y del retrato en 1440 caiga en el primer cuadro con el hero `lista` bajo una capa opaca.
2. Que pasar a transparente y reescribir **no** genere una entrada de LCP nueva.
3. Que el CLS siga ≤ 0,1.

Si falla el punto 2, la alternativa es el "texto fantasma" de `hero-escritura` (D4 de aquel change). Como cambia cómo se ve la escritura, se consulta al usuario antes de aplicarla y no se decide sola.

Trade-off explícito, igual que en `hero-escritura`: la métrica no captura que el contenido se ve recién a los ~2 s. Es una demora artística pedida por el usuario y solo en la primera visita de la sesión. El contenido está descargado y pintado desde el inicio.

Alternativas:
- **Hero vacío bajo la compuerta**: es más simple, pero el LCP móvil queda en ~2,9 s. Se rechaza por la spec.
- **Escritura que corre detrás de la compuerta**: el usuario lo descartó explícitamente.
- **No montar el hero hasta abrir**: demora la descarga del retrato. Se rechaza.

### D6. Composición visual

**Capa**: `fixed inset-0 z-[70]`, por encima de la barra (`z-50`) y del salto al contenido (`z-[60]`). Lleva `aria-hidden="true"` y `data-compuerta={fase}`.

**Hojas**:
- Dos `div`: el superior en `top-0 h-1/2` y el inferior en `top-1/2 h-1/2`.
- Color: `bg-eva-panel` (#100E0C), un tono apenas más claro que la página (#050505). Así, al separarse, se leen como dos objetos sólidos y no como "negro sobre negro".
- Sin textura ni etiquetas extra: movimiento y ruido mínimos, como pide el gusto del usuario.

**Junta (la línea del boceto)**:
- En el borde de contacto, cada hoja lleva una franja de peligro `eva-stripes` (naranja `eva-secondary` sobre negro, el mismo patrón diagonal de las franjas del sitio) de 8 px. Juntas forman una banda de 16 px centrada en la mitad de la pantalla.
- La banda se interrumpe con un hueco del ancho del glifo más 24 px a cada lado: es el "--- símbolo ---" del boceto. Cada hoja arma su franja con dos tramos (izquierda y derecha del hueco), así la franja viaja con su hoja al abrir.
- El naranja es el color de las franjas que acompañan al violeta en la jerarquía (`sistema-visual`). No se usan los colores del logo fuera del glifo: la spec los limita a variables del logotipo.

**Glifo**:
- `LogoEva variante="completo"` dentro de un `span` envoltorio. El envoltorio es el que se anima, no el `<svg>`, para que el SVG del glifo siga "sin animaciones" (spec `logotipo`).
- Va en la capa raíz, no en una hoja, centrado sobre la junta: la mitad arriba y la mitad abajo, como en el boceto.
- Alto: `h-28` (112 px, 52 px de ancho) en móvil y `md:h-40` (160 px, 74 px de ancho) desde 768 px.
- Con tres capas, filo y sombra, igual que en la barra.

**"FACU CODE"**:
- Va en la hoja inferior, centrado, a 24 px por debajo del pie del glifo: `pt` = mitad del alto del glifo + 24 px, por breakpoint.
- Tipografía: `font-eva-display font-stretch-condensed font-black uppercase tracking-[0.2em]`, la de la marca de la barra, en `text-3xl` en móvil y `md:text-5xl`.
- "FACU" va en `text-eva-paper` y "CODE" en `text-eva-primary-light`, como el nombre y el apellido del hero.
- `whitespace-nowrap`. En 375 mide unos 230 px y entra sin cortarse.

**Qué hace el símbolo al abrirse (decisión)**: **se recoge hacia la junta**, como un cerrojo que se suelta. El envoltorio pasa de `clip-path: inset(0)` a `inset(50% 0 50% 0)` en 200 ms con `steps(4)`: el glifo se cierra en una línea sobre la junta y desaparece justo antes de que las hojas se muevan. El hueco de la franja queda vacío un instante y después las hojas se separan. Por qué:
- **Partirlo con las hojas** (mitad superior con la hoja de arriba): corta el glifo en dos y muestra una costura en su silueta. Eso contradice la regla "sin costuras visibles" que el usuario cuidó en `logo-eva`.
- **Que viaje entero con una hoja**: el glifo está a caballo de la junta, así que asomaría cortado por el borde de la otra hoja, o habría que moverlo antes y romper la composición del boceto.
- **Fundido de opacidad**: más blando y menos "mecánico" que el barrido en pasos que ya usa el sitio (`eva-boot`, obturador).

**"FACU CODE" se va con la hoja inferior**, porque está impreso en ella. Es lo más literal al boceto y no necesita una animación propia.

Las dos decisiones visuales (recogerse vs. alternativas y colores del texto) quedan como ítems del **checkpoint visual** del usuario.

### D7. Línea de tiempo y constantes

Constantes en `src/utils/compuerta.js` (`TIEMPOS_COMPUERTA`, congelado y ajustable):

| Tramo | Qué se ve | Inicio | Duración | Fin | Fase JS |
|---|---|---|---|---|---|
| Junta | Las franjas se trazan desde el hueco hacia los bordes (`clip-path`, `steps(6)`) | 0 | 300 | 300 | `armado` |
| Glifo | Barrido `eva-boot` (`clip-path` izq→der, `steps(6)`) | 200 | 360 | 560 | `armado` |
| Texto | Barrido `eva-boot` de "FACU CODE" | 480 | 360 | 840 | `armado` |
| Lectura | Quieto | 840 | 460 | 1300 | `lectura` |
| Retiro | El glifo se recoge hacia la junta (`steps(4)`) | 1300 | 200 | 1500 | `retiro` |
| Apertura | La hoja superior sube −100 % y la inferior baja +100 % (`transform`, `cubic-bezier(0.7, 0, 0.84, 0)`, ease-in: arranca pesada y acelera) | 1500 | 500 | 2000 | `apertura` |
| **Total** | | | | **2000 ms** (spec ≤ 2200) | `abierta` |

Funciones puras:
- `crearLineaCompuerta(tiempos)`: devuelve tramos con inicio y fin, fases y total, y valida que no haya solapes de fase ni totales mayores a 2200.
- `faseCompuerta(t, linea)`: devuelve `'armado' | 'lectura' | 'retiro' | 'apertura' | 'abierta'`.
- `estadoHeroSegunCompuerta(fase)`: ver D5.

**Reloj.** `t0` es el *timestamp* del **primer** rAF, no el de `performance.now()` al montar. Si la pestaña se abrió en segundo plano, rAF no corre: la intro empieza cuando el visitante mira la pestaña, en vez de "terminar" sin que nadie la vea. El progreso sale del tiempo transcurrido, así que los cuadros perdidos no la estiran.

### D8. Animación: CSS por fase y JS solo para las fases

El movimiento lo hace CSS y React solo cambia `data-compuerta` y clases. Nunca `style`, por la CSP.

- **Keyframes en `src/index.css`** (`compuerta-junta`, `compuerta-retiro`, `compuerta-hoja-arriba`, `compuerta-hoja-abajo`), todos dentro de `@media (prefers-reduced-motion: no-preference)`. El barrido del glifo y del texto reutiliza `evaBoot` (`motion-safe:animate-eva-boot` con `[animation-delay:…]`). **No van en `tailwind.config.js`**, porque el guard de `limpieza-cyberpunk` fija la lista de keyframes de Tailwind en `evaBoot` y `evaObturador`. Cambiar esa lista sería tocar un guard ajeno sin necesidad.
- **Selectores por fase**:
  - `.compuerta[data-compuerta="retiro"] .compuerta-simbolo { animation: compuerta-retiro 200ms steps(4, end) forwards }`.
  - `[data-compuerta="apertura"] .compuerta-hoja-superior { animation: compuerta-hoja-arriba 500ms cubic-bezier(…) forwards }`, y el equivalente para la hoja inferior.
- **Fuente de verdad de los tiempos.** Las duraciones y demoras del CSS **reflejan** `TIEMPOS_COMPUERTA`, y un guard (`scripts/compuerta.test.mjs` con `css-rules.mjs`) compara cada valor del CSS con la constante. El fin de la intro lo marca el reloj JS (fase `abierta`) y no `animationend`, que no dispara si la animación no corre.
- Solo se anima `transform` y `clip-path`, nada que provoque *layout*.

### D9. Salto: qué eventos, en qué objetivo y sin clic fantasma

| Gesto | Escucha | Por qué |
|---|---|---|
| Clic o toque | `click` sobre la capa de la compuerta | Ver abajo |
| Cualquier tecla | `keydown` en `window` | Mismo objetivo que el listener de la escritura (ver abajo) |
| Rueda | `wheel` en `window` (pasivo) | |
| Desplazamiento táctil | `touchmove` en `window` (pasivo) | |
| Movimiento reducido en caliente | `change` de `matchMedia(REDUCED_MOTION_QUERY)` | |

**Por qué `click` y no `pointerdown` ni `touchstart`.** Si la capa desaparece en `pointerdown` o `touchstart`, el `pointerup` y el `click` sintetizado del toque caen sobre lo que había debajo (por ejemplo "Ver proyectos") y lo activan. Con `click`, la secuencia completa ocurre sobre la capa y recién después la capa se quita. Un toque sin arrastre genera ese `click`. Un arrastre genera `touchmove`, que salta, y el resto del gesto desplaza la página, que ya está liberada (es lo esperado: "desplazarse la abre").

**Salto instantáneo.** La transición `saltar` (reductor puro `transicionCompuerta(estado, accion)`, con acciones `cuadro(t)`, `saltar` y `movimiento-reducido`) pasa a `abierta` sin animación de cierre, y la capa se desmonta en ese commit.

**La tecla que salta no completa la escritura.**
- La escritura registra su `keydown` en `window` al pasar a `libre`. Si ese efecto se ejecuta dentro del mismo despacho del evento (React 18 vacía los efectos de un evento discreto de forma síncrona), el DOM no invoca listeners agregados al mismo objetivo durante su despacho, porque la lista se copia antes de invocar.
- Por eso el `keydown` de la compuerta va en `window` y no en `document`: si estuviera en `document`, el evento llegaría a `window` después, con el listener nuevo ya registrado.
- Como defensa extra, la escritura ignora eventos con `timeStamp` anterior a su `t0`.
- Playwright lo verifica (tarea 6.2).

**Movimiento reducido.** El listener de `matchMedia` quita la compuerta en el cuadro siguiente. El hero pasa a `libre` y, con la preferencia ya activa, su propio listener lo deja en `fin`.

### D10. Bloqueo de desplazamiento sin salto de diseño

Mientras la fase es `armado`, `lectura` o `retiro`, un `useLayoutEffect` (antes del primer pintado) agrega `compuerta-cerrada` a `document.documentElement`, y lo quita al empezar la apertura o al saltar:

```css
html.compuerta-cerrada { overflow: hidden; scrollbar-gutter: stable; }
```

`scrollbar-gutter: stable` reserva el canal de la barra mientras `overflow` está oculto. El ancho del contenido no cambia al bloquear ni al liberar y no hay CLS (lo mide el spike 1.4). En móvil las barras son superpuestas y no ocupan canal.

Alternativas:
- **`body { position: fixed }` con `top` negativo**: necesita `style` inline, que la CSP prohíbe.
- **`overflow: hidden` solo**: hace desaparecer la barra y desplaza el contenido 6 px.
- **Sin bloqueo** (confiar en que rueda y gestos saltan): la barra de desplazamiento se puede arrastrar, y el autoscroll con el botón del medio no dispara `wheel`.

El primer gesto que salta no desplaza la página porque llega con el bloqueo puesto. Desde el siguiente, desplaza normalmente.

### D11. Accesibilidad

- **Capa decorativa**: `aria-hidden="true"`, sin elementos enfocables, sin `tabIndex` y sin roles. "FACU CODE" no se duplica en `sr-only` porque no es contenido. `inert` no hace falta (no hay nada enfocable) y React 18 no lo tipa.
- **Foco libre**: no se mueve ni se retiene. La página debajo sigue en el árbol de accesibilidad, así que un lector de pantalla puede recorrerla mientras dura la intro.
- **Tab**: es una tecla, así que salta la compuerta y el foco cae en el primer elemento (el salto al contenido), visible.

### D12. Fuentes: no se espera a nada

La intro solo usa Noto Serif Display, que es la fuente precargada del primer render. No usa la mono, que no está precargada.

No se espera a `document.fonts.ready`. Esperar demoraría la intro sin límite claro, y "FACU CODE" aparece recién a los 480 ms, cuando la fuente precargada en general ya llegó. Si no llegó, se muestra con Georgia y hace *swap* dentro de la capa fija. Como el texto está centrado, el cambio de ancho cuenta como un desplazamiento mínimo y entra en la medición de CLS de la tarea 6.4.

### D13. Verificación

- **`node --test`** (`scripts/compuerta.test.mjs`):
  - Funciones puras: línea de tiempo, fases, decisión, sesión con almacenamiento falso que lanza, reductor y modo del hero.
  - Guards estáticos: componente, CSS, `Home`, `index.html`, `vercel.json` y `package.json`.
  - `hero.test.mjs` actualiza el guard del hook (tercer parámetro, sin timers ni `style`).
- **Playwright sobre el build** (`vite preview`), con la CSP de `vercel.json` inyectada como cabecera con `page.route` (patrón de `hero-escritura`):
  - Cuadros clave en 1440×900 y 375×812.
  - Comportamiento por sesión y entrada.
  - Saltos sin clic fantasma.
  - Accesibilidad, LCP y CLS.
  - Video `recordVideo`.
  - Los scripts y los resultados quedan en el scratchpad.

## Risks / Trade-offs

- [Chromium emite una entrada de LCP nueva al reescribir un bloque ya pintado] → Lo decide el spike 1.3 antes de integrar. Si pasa, se consulta al usuario entre el "texto fantasma" y aceptar el LCP móvil más alto solo en la primera visita, lo que obligaría a ajustar la spec.
- [La métrica LCP no refleja que el contenido se ve a los ~2 s] → Es aceptado y explícito (D5). Es la intro pedida, solo en la primera visita de la sesión, y saltable con cualquier gesto.
- [Clic fantasma en táctiles] → Se salta con `click` y no con `touchstart`/`pointerdown` (D9). Playwright lo verifica con `hasTouch`.
- [`scrollbar-gutter` no soportado (Safari < 17)] → Ahí la barra es superpuesta en macOS/iOS y no hay canal que reservar. En navegadores sin soporte y con barra clásica, el salto de 6 px queda acotado y medido.
- [La intro molesta en visitas repetidas] → Una vez por sesión, salto con cualquier gesto, ~2 s.
- [Pestaña abierta en segundo plano] → El reloj arranca en el primer rAF (D7). Las animaciones CSS del armado pueden haber terminado al volver, y la compuerta se ve armada y sigue con lectura, retiro y apertura.
- [Las constantes de JS y CSS se desincronizan] → Lo impide el guard de D8.
- [Un segundo montaje de `Home` por SPA repite la intro] → Lo impide la decisión cacheada por carga más `consumida` (D3).
- [La tecla que salta completa la escritura] → Listener en el mismo objetivo más la defensa por `timeStamp` (D9). Hay un escenario de spec y una verificación con Playwright.
- [El *swap* de fuente mueve "FACU CODE"] → Es un desplazamiento mínimo dentro de la capa, medido en el CLS (D12).

## Migration Plan

1. Línea de base y spikes en `main` (LCP/CLS, hero `lista` bajo una capa opaca, bloqueo con `scrollbar-gutter`).
2. Lógica pura (`compuerta.js`) y modo del hero en `escritura.js`, con tests.
3. Hook de escritura con modo, componente y CSS de la compuerta, proveedor en `Home`.
4. Verificación integrada, cuadros y video, `npm run ci` y checkpoint visual del usuario.

Rollback: la compuerta entra en commits propios. Revertir `Home.jsx` (sin proveedor ni compuerta) deja el hero en modo `libre`, que es el comportamiento actual.
