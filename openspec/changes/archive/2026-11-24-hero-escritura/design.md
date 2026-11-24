# Design

## Context

Ver `proposal.md` (Why). Estado medido el 2026-11-24 sobre `main` (ab81b87), con `npm run build` + `vite preview` y Playwright (Chromium 1.65). Las capturas están en el scratchpad de la sesión (`hero-gap-antes-*.png`, `hero-gap-opcion-*.png`, `hero-gap-despues-simulado-*.png`, `contact-gap-antes-*.png`, `contact-gap-opcion-*.png`).

**Hero hoy** (`src/components/Hero.jsx`):
- `section.min-h-screen.flex` con una grilla `content-center`, `pt-24` en la sección y `pb-16` en la grilla.
- Columna izquierda en `md:col-span-7`. Columna derecha en `md:col-span-5 md:mt-16`, con el retrato `aspect-[4/5]` (máx. 440 px) y debajo la ficha `.eva-panel` con `md:-mt-10`.

| Ancho×alto | Alto sección | Fin acciones | Fin col. derecha | Hueco | Retrato |
|---|---|---|---|---|---|
| 375×812 (apilado) | 1435 | 619 | 1359 | n/a | 320×399 |
| 768×1024 | 1024 | 700 | 836 | 136 | 281×351 |
| 1024×768 | 873 | 568 | 797 | 229 | 388×484 |
| 1280×800 | 938 | 609 | 862 | 253 | 440×549 |
| 1440×900 | 938 | 609 | 862 | 253 | 440×549 |
| 1920×1080 | 1080 | 680 | 933 | 253 | 440×549 |

**Causa raíz del hueco del hero.** La columna derecha mide 64 (`md:mt-16`) + 549 (retrato 4:5 a 440 px) + 193 − 40 (ficha apilada que solo se solapa 40 px) = **702 px**. La izquierda, en cambio, termina a los **513 px**. Como la fila de la grilla toma el alto de la columna más alta, quedan ~250 px vacíos debajo de las acciones. La sección supera la pantalla (938 en 1440×900) y, en 1920, `min-h-screen` + `content-center` reparte el sobrante arriba y abajo. No es un problema de `items-stretch` (alinear distinto no cambia el alto de la fila) ni del padding: el alto lo pone el apilado retrato + ficha + desplazamiento.

**Contáctame hoy** (`src/components/Contact.jsx`): desde `lg` es una grilla de 12 columnas. El panel `lg:col-span-5` mide 406 px (483 en 1024) y la `ul` de canales `lg:col-span-7` es `grid content-start`. Los tres canales de 72 px terminan en 256 px, así que el hueco bajo los links es de **150 px** (1280–1920) y **227 px** (1024). En 375 y 768 está apilado y no hay hueco. **Causa**: el mismo patrón que el hero, columnas de alto desigual en una grilla. Acá la columna corta es la derecha y su contenido se pega arriba (`content-start`).

**LCP medido hoy**:
- Retrato `IMG` en 768–1920 (≈140–150 ms).
- Párrafo `P` en 375 (≈116 ms; el retrato está debajo del pliegue).
- CLS 0,001–0,018.

**Experimento de LCP** (Chromium, página aislada, revelado a los 1500 ms):

| Técnica para ocultar | LCP reportado |
|---|---|
| Bloque de texto entero con `color: transparent` / `visibility:hidden` / `opacity:0` | al revelar (≈1500 ms) |
| Bloque con un tramo visible y el resto `color: transparent` | primer frame, **con el tamaño del bloque completo** |
| `<img>` tapada por un `div` encima | primer frame |
| `<img>` con `opacity:0` o `clip-path: inset(0 100% 0 0)` | al revelar (≈1500 ms) |

**Restricciones**:
- CSP `style-src 'self'` (`vercel.json`): sin atributos `style` en el HTML.
- Sitio CSR puro: `dist/index.html` trae `<div id="root"></div>` y `route-html` solo reescribe metadatos.
- Tests con `node --test` (no hay Vitest ni RTL instalados y no se agregan).
- Guard global `sistema-visual`: prohíbe `glitch`, `flicker` y `scan`.
- Spec vigente "Sin efectos intermitentes".
- Precedente de cursor: `.eva-cursor` de Testimonios parpadea 3 veces y queda fijo.

## Goals / Non-Goals

**Goals:**
- Que el hueco bajo las acciones del hero y bajo los canales de contacto sea ≤ 96 px y ≤ 16 px respectivamente desde 768/1024 px, sin achicar el retrato ni cambiar el layout móvil.
- Que la entrada escrita sea fiel al pedido (izq→der, retrato, ficha der→izq) y no cueste accesibilidad, SEO, CLS ni LCP de escritorio.
- Que la lógica de tiempo sea pura y testeable con `node --test`, y el hook quede fino.

**Non-Goals:**
- Animar Contáctame u otras secciones.
- Revivir `texto-animado` o cualquier revuelto de caracteres.
- Agregar prerender del cuerpo de la página (SSR/SSG).
- Rediseñar el hero: se conservan composición, colores, tipografías y contenido.

## Decisions

### D1. Hueco del hero: ficha superpuesta al retrato, sin desplazamiento, alto por contenido

Se elige **R1**. Medido con estilos inyectados (`opciones3.mjs`):
- Se quita `md:mt-16` de la columna derecha.
- La ficha pasa de `md:-mt-10` a `md:-mt-24 lg:-mt-36`: se superpone 96 px al retrato en tablet y 144 px en escritorio, siempre sobre la camisa.
- Se quita `min-h-screen` de la sección. `flex`, `flex-1` y `content-center` quedan sin efecto y salen.

| Ancho | Alto sección (antes→después) | Hueco | Tapa del retrato |
|---|---|---|---|
| 768 | 1024→680 | 136→16 | 96 px (27 %) |
| 1024 | 873→705 | 229→61 | 144 px (30 %) |
| 1280/1440/1920 | 938/938/1080→770 | 253→85 | 144 px (26 %) |
| 375 | 1435→1435 | apilado, sin cambios | — |

El retrato conserva 440×549 y su proporción 4:5. Los 85 px que quedan son el voladizo de la ficha, que ya existía y equilibra la sombra del CTA.

Alternativas medidas:
- **A — solo superponer la ficha** (sin tocar `mt-16` ni `min-h`): el hueco queda en 141 px. No alcanza.
- **B — retrato 1:1 + ficha superpuesta**: hueco de 32 px, pero achica el retrato a 440×440 y la ficha tapa el 35 % de un encuadre ya recortado. Cambia la imagen más que R1.
- **D — retrato 1:1 sin superponer**: hueco de 81 px, con el mismo costo que B y la ficha igual de baja.
- **E — retrato 5:6 + superponer**: hueco de 119 px. No alcanza.
- **Ficha en la columna izquierda, bajo las acciones**: es un rediseño que el usuario no pidió y alarga la columna izquierda.
- **Mantener `min-h-screen`**: con el contenido arreglado, en 1440×900 la sección seguiría midiendo 900 y centraría el contenido. Quedarían ~200 px vacíos bajo las acciones y el "hero más grande de lo que debería" seguiría.
- **Solapar con el alto exacto de la ficha** (`-mt-[alto]`): en 768 la ficha mide 253 px porque sus valores se parten en dos líneas y taparía el 60 % del retrato. Por eso se usan márgenes fijos por breakpoint.

### D2. Hueco de Contáctame: canales en filas iguales que llenan el alto del panel

Se elige **X1**: en la `ul`, `lg:auto-rows-fr lg:content-stretch` (la base `content-start` se mantiene para móvil y tablet) y `lg:h-full` en cada enlace. En 1024–1920 los canales miden 148/122 px en vez de 72 y el hueco baja de 227/150 a **0**. El contenido interno ya está centrado verticalmente (`flex-col justify-center` e `items-center` en código, ícono e indicador), así que se ve como una botonera más alta (captura `contact-gap-opcion-X1_canales_estirados-1440.png`).

Es la misma regla que en el hero: **las dos columnas terminan juntas**. Solo cambia qué columna cede: en el hero se acorta la alta (superposición) y en contacto se estira la corta. No hay una utilidad común que valga la pena extraer: son dos clases por componente.

Alternativas:
- **X2/X3 — centrar la lista** (`lg:content-center` o `lg:items-center`): parte el hueco en dos de 75 px. Sigue habiendo espacio vacío, ahora arriba y abajo.
- **Achicar el panel** (sacar la franja o el padding): gana unos 40 px de 150 y empobrece el motivo visual.
- **Agregar un cuarto elemento** (CV u otro canal): cambia el contenido y la spec "Canales de contacto".

### D3. Modelo de escritura: dos tramos del mismo texto, capa visual oculta y copia `sr-only`

Cada texto escrito se renderiza así:

```
<Elemento>
  <span class="sr-only">{texto completo}</span>
  <span aria-hidden="true">{tramo visible}<span class="text-transparent …cursor">{tramo reservado}</span></span>
</Elemento>
```

En der→izq el orden se invierte: primero el tramo reservado y después el visible. El tramo reservado existe desde el primer render con su ancho real, así que los cortes de línea son los finales y ningún carácter se mueve (CLS ≈ 0).

Los lectores de pantalla leen solo la copia `sr-only`. El `h1` conserva su `aria-label`, y el kicker y los códigos ya son `aria-hidden`. El HTML renderizado contiene el texto completo dos veces (copia accesible y capa visual), lo que es inocuo para indexar. La partición usa puntos de código (`Array.from`) para no cortar "ó" ni "·".

Alternativas:
- **Un `<span>` por carácter**: cientos de nodos y re-render por carácter, sin ninguna ventaja.
- **`clip-path`/`width` en pasos de `ch`**: solo sirve para monoespaciadas de una línea. El nombre es serif condensada y el párrafo es multilínea.
- **`visibility:hidden` en el tramo reservado**: oculta también para tecnologías de asistencia y demora el LCP igual que un bloque transparente.
- **Animar el ancho del contenedor**: re-wrap y CLS.

### D4. LCP: el retrato se pinta desde el primer frame bajo un obturador y el texto se reserva transparente

**Retrato (LCP en 768–1920).** La `<img>` no recibe ninguna clase de animación, opacidad ni recorte: el test existente se reescribe para seguir protegiéndolo. En fases A y B un **obturador** decorativo (`aria-hidden`, dentro de la `figure`) tapa la tarjeta completa: borde, etiquetas, sombra y franja. Durante la fase A, la `figure` queda por debajo de la grilla hexagonal: la sección ya es `isolation: isolate` y la grilla es su `::before` con `z-index:-1`, así que la `figure` va con `z-index` menor. El obturador es del color de fondo, de modo que se ve el fondo con su grilla y no un rectángulo negro. En la fase B el obturador se retira con un barrido en pasos (el mismo lenguaje de `eva-boot`) y al terminar la `figure` vuelve a su capa normal.

Medido: una imagen tapada reporta LCP en el primer frame. Por lo tanto, el LCP de escritorio no cambia (spec: ≤ anterior + 10 %).

**Plan B**, si la capa bajo la grilla diera problemas visuales: obturador del color del panel con el marco visible ("tarjeta en espera"). El LCP sigue igual. Lo decide la tarea de spike (2.x).

**Texto (LCP en 375 = párrafo).** Con el tramo reservado en `text-transparent`, el bloque se reporta cuando pinta su **primer** carácter y con su tamaño completo. El LCP móvil pasa a ser el instante en que empieza a escribirse el párrafo. La línea de tiempo (D5) lo pone en ~0,81 s, de ahí el límite de la spec: ≤ anterior + 1 s.

Alternativas:
- **"Texto fantasma"**: el tramo reservado se ve tenue, por ejemplo `eva-gray-dim` al 15 %, en vez de transparente. El LCP queda en el primer frame y la estética de "formulario que se completa" calza con Eva, pero el texto ya se ve antes de escribirse y el pedido pierde la sorpresa. Queda como plan B si la medición móvil supera el límite.
- **Color casi transparente (alfa 0,01) para engañar al LCP**: se rechaza. Es invisible a propósito para manipular la métrica.
- **Retrato con `opacity`/`clip-path`**: se rechaza por lo medido (LCP ≈ revelado).

Trade-off explícito: en escritorio la métrica LCP no captura que el retrato se ve recién a ~1,9 s. Es una demora artística pedida por el usuario, no una carga lenta: la imagen está descargada y pintada desde el inicio.

### D5. Línea de tiempo y constantes

La duración es fija por segmento, no por carácter: el párrafo (~190 caracteres) iría lentísimo a la velocidad del nombre. Constantes en `src/utils/escritura.js`, ajustables:

| Segmento | Dirección | Duración | Inicio aprox. |
|---|---|---|---|
| Kicker "01 // Presentación" | izq→der | 160 ms | 0 |
| Nombre (Facundo, Chacón) | izq→der | 320 ms | 190 |
| Subtítulo | izq→der | 240 ms | 540 |
| Descripción | izq→der | 700 ms | 810 |
| Acciones (`eva-boot` existente) | — | 360 ms | 1510 |
| Fase B: obturador + marco de la ficha | — | 300 ms | 1870 |
| Fase C: 4 filas × 240 ms (valor y etiqueta) | der→izq | 960 ms | 2170 |
| **Total** | | | **≈ 3,13 s** (spec ≤ 3,5 s) |

Hay pausas de 30 ms entre segmentos de la fase A. El progreso se calcula por tiempo transcurrido (`performance.now()` en cada frame), no por ticks. Así los frames perdidos no ralentizan la escritura y una pestaña en segundo plano salta al estado correspondiente al volver.

Helpers puros (sin DOM, con `node --test`):
- `crearLineaDeTiempo(segmentos, ms)`: devuelve inicio y fin de cada segmento, fases y total.
- `caracteresVisibles(t, segmento)`: entero de 0 a largo, con recorte.
- `partirTexto(texto, visibles, direccion)`: devuelve `{ visible, reservado }` por puntos de código.
- `faseEn(t, linea)`: `'a' | 'acciones' | 'b' | 'c' | 'fin'`.
- `estadoEn(t, linea)`: fase y visibles por id.
- `mismoEstado(a, b)`: evita re-renders sin cambios.
- `debeAnimar({ reducedMotion, yaEjecutada })`.

Los textos del kicker y de la descripción pasan a `src/data/presentacion.js` (`KICKER`, `DESCRIPCION`) para que los segmentos se armen desde datos y los tests cuenten caracteres reales.

### D6. Hook `useEscrituraHero` y ciclo de vida

- **Estado inicial síncrono** (inicializador de `useState`): con `prefersReducedMotion()` en verdadero, o si la escritura ya se ejecutó en esta carga, arranca en `fin`. El primer render ya es el final y no hay destello.
- **Una sola vez por carga**: un flag a nivel de módulo (`escrituraEjecutada`) se marca al terminar o al completar. Si se vuelve a montar el Hero por navegación SPA, arranca en `fin`.
- **Bucle**: `requestAnimationFrame` calcula `estadoEn(now - t0)` y hace `setState` solo si `!mismoEstado`. `t0` va en un `ref` para que el doble efecto de `StrictMode` en desarrollo no reinicie la escritura, y el cleanup cancela el rAF.
- **Completar**: `keydown` en `window` y `focusin` en la sección pasan a `fin` y cancelan el rAF. Lo mismo pasa con `change` de `matchMedia(REDUCED_MOTION_QUERY)` a verdadero. Los listeners se quitan al terminar.
- **Salida**: el hook devuelve `{ fase, visibles(id) }`. La sección expone `data-escritura={fase}` para el CSS.

No se testea con RTL porque no está instalado y no se agrega. La lógica vive en los helpers puros y el comportamiento integrado se verifica con Playwright (tarea 7).

### D7. Fases en el DOM sin estilos inline (CSP)

Todo se resuelve con clases de Tailwind y selectores sobre `data-escritura`. React solo cambia texto y clases, nunca `style`.
- **Acciones**: `opacity-0` hasta la fase `acciones`, después `motion-safe:animate-eva-boot`. No se usa `visibility` para que sigan siendo enfocables: el foco completa la entrada (D6).
- **Ficha**: `opacity-0` hasta la fase B, después `eva-boot` para el marco, y en la fase C las filas en der→izq. Por fila se escribe primero el valor (`dd`) desde su extremo derecho y después la etiqueta (`dt`). No se usa `visibility` en contenedores porque ocultaría también la copia `sr-only`.
- **Etiquetas de la ficha**: se escriben también (recomendado). El usuario citó "Rol Full Stack Developer…" con la etiqueta, y una fila que se llena entera hacia la izquierda lee como un registro que se completa. La alternativa "solo valores" queda a una constante de distancia.
- **Cursor**: es un pseudo-elemento `::before` absoluto, en la posición estática del segundo tramo. Por eso no ocupa espacio ni cambia cortes de línea. Bloque sólido en `eva-primary-light`, **sin parpadeo** (la spec prohíbe parpadeos periódicos; el `.eva-cursor` de Testimonios es otra sección). Solo aparece en el segmento que se está escribiendo y desaparece al terminarlo. En der→izq queda a la izquierda del tramo revelado.
- **Obturador**: keyframe nuevo `evaObturador` (`clip-path: inset(0 0 0 0)` → `inset(0 0 0 100%)`, `steps(6)`), siempre detrás de `motion-safe:`. Con movimiento reducido el obturador no se renderiza.
- La franja inferior conserva su `eva-boot` actual.

### D8. Verificación medida

Playwright sobre el build, con la CSP de `vercel.json` inyectada como cabecera vía `page.route` (patrón de `limpieza-cyberpunk` 8.1):
- Huecos en 375/768/1024/1280/1440/1920 para el hero y el contacto.
- LCP y CLS en 1440 y 375, con y sin movimiento reducido, comparados con la línea de base de `main`.
- Consola sin violaciones de CSP.
- Árbol de accesibilidad (`page.accessibility.snapshot()` / `ariaSnapshot`) durante la fase A, sin fragmentos.
- Volver a `/` por SPA sin reescritura, y Tab durante la entrada que completa todo.
- Video `.webm` con `recordVideo` en 1440×900 y 375×812, guardado en el scratchpad para que el usuario lo revise.

## Risks / Trade-offs

- [El LCP de escritorio no refleja cuándo se ve el retrato] → Es aceptado y explícito (D4). La imagen se descarga y pinta desde el inicio, y la demora es la animación pedida.
- [El LCP móvil sube hasta ~0,8 s] → Está acotado en la spec (≤ +1 s) y medido. El plan B es el "texto fantasma" (D4).
- [La `figure` bajo la grilla con `z-index` negativo interfiere con clics o sombras] → La `figure` no tiene elementos interactivos. El spike 2.x lo valida visualmente y, si falla, se usa el plan B "tarjeta en espera".
- [El cursor absoluto queda al final de la línea anterior en un corte] → Es un efecto menor y transitorio. No afecta el layout porque está fuera de flujo.
- [3 s de entrada se sienten largos en visitas repetidas] → Corre una vez por carga, cualquier tecla o foco la completa y las constantes son ajustables.
- [El `focusin` en un botón aún transparente] → Completa la entrada en el mismo frame, así que el foco nunca queda sobre algo invisible.
- [La copia `sr-only` duplicada se interpreta como texto oculto] → Es un patrón estándar de accesibilidad, con el mismo texto visible al terminar.
- [La superposición de la ficha tapa más retrato si cambia la foto] → El test de datos ya valida las dimensiones de `RETRATO`. Si cambia la proporción, hay que revisar el margen.
- [Canales de 148 px en 1024 se ven muy altos] → Es aceptable: es el único ancho con panel de 483 px. Si molesta, se puede limitar con `lg:max-h` por canal en un change posterior.

## Migration Plan

1. Línea de base en `main` (LCP, CLS, huecos) y spike del obturador.
2. Layout del hero y del contacto, que es independiente de la animación y se puede cortar ahí si hiciera falta.
3. Datos, helpers puros, componente de texto, hook e integración.
4. Verificación medida, video, `npm run ci` y checkpoint con el usuario (capturas y video).

Rollback: los commits por hito permiten revertir la animación sin perder el arreglo de layout.
