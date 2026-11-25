# Tasks

> **Strict TDD** con `node --test "scripts/**/*.test.mjs"`. No hay Vitest ni RTL y no se agregan. Cada tarea de código sigue este ciclo, ejecutando los tests en cada paso:
> - **RED**: test o guard que falla.
> - **GREEN**: código mínimo.
> - **Triangulación**: ≥ 2 casos por comportamiento, incluido el valor o el marcado que el guard tiene que rechazar.
> - **Refactor**.
>
> Lo que `node --test` no puede probar (secuencia real, salto, foco, LCP, CLS, cuadros, video) se verifica con Playwright sobre `npm run build` + `vite preview`, con la CSP de `vercel.json` inyectada como cabecera (`page.route`). Los scripts y los resultados van al scratchpad `C:\Users\Usuario\AppData\Local\Temp\claude\10381691cee772cd\d1b93db0-d825-43a1-929c-fc9a3b5ffc9e\scratchpad`, nunca al repo.
>
> No cambian `index.html`, `vercel.json`, `src/data/logo.js`, `LogoEva.jsx`, `NavBrand.jsx`, los textos ni el layout del hero, ni `tailwind.config.js` (los keyframes van en `index.css`, design D8). Gobernanza MEDIUM: el checkpoint visual del usuario es la tarea 6.7.

## 1. Red de seguridad, línea de base y spikes

- [x] 1.1 Correr `npm test` en la rama sin cambios y anotar cuántos tests pasan. Si hay fallas previas, detenerse y reportarlas sin corregirlas. Verificación: conteo en el resumen del apply.
- [x] 1.2 Línea de base en `main` (build + preview, Playwright), mediana de 3 corridas:
  - LCP (elemento y tiempo) y CLS de `/` en 1440×900 y 375×812, con y sin `reducedMotion: 'reduce'`.
  - Ancho de `document.documentElement.clientWidth` en 1440 con barra de desplazamiento.

  Verificación: tabla en el resumen. El candidato a LCP tiene que ser el retrato en 1440 y el párrafo en 375, como en `hero-escritura`.
- [x] 1.3 Spike de LCP del hero "listo" bajo una capa opaca (design D5), sobre el build de `main`, con un script de Playwright que inyecte una capa `fixed inset-0` opaca antes del primer pintado (`addInitScript` + CSS por `page.addStyleTag`; es solo medición):
  - Con el hero completado de inmediato (simular `lista`, p. ej. con un `keydown` sintético en el primer cuadro), medir en 375 y en 1440 que la entrada de LCP del párrafo o del retrato cae en el primer cuadro.
  - A los 1500 ms, quitar la capa y forzar una reescritura del párrafo: texto transparente y revelado progresivo con un snippet en la página. Comprobar que **no** aparece una entrada de LCP nueva posterior y que el CLS queda ≤ 0,1.

  Si aparece una entrada nueva, detenerse y presentar al usuario las opciones de D5 ("texto fantasma" o aceptar el LCP móvil de la primera visita) antes de seguir. Verificación: entradas de LCP con tiempos y la decisión en el resumen.
- [x] 1.4 Spike de bloqueo de desplazamiento y clic fantasma (design D9, D10), en el build de `main` con estilos y listeners inyectados:
  - En 1440 con barra visible, alternar `html { overflow: hidden; scrollbar-gutter: stable }`. El `clientWidth` y la posición de `#presentacion h1` no cambian y no hay entradas de `layout-shift`.
  - En 375 con `hasTouch: true`, una capa que se quita en `click` y que está encima de "Ver proyectos": tras un `tap`, la URL no cambia a `#proyectos`.
  - El mismo caso con la capa quitada en `touchstart`, para documentar que ahí sí hay clic fantasma.

  Verificación: mediciones en el resumen.

## 2. Lógica pura de la compuerta (design D3, D4, D7, D9)

- [x] 2.1 RED/GREEN/TRIANGULATE de `crearLineaCompuerta` y `faseCompuerta` en el nuevo `scripts/compuerta.test.mjs`, con el nuevo `src/utils/compuerta.js` (`TIEMPOS_COMPUERTA` congelado):
  - Con los tiempos por defecto, las fases son `armado` [0, 840), `lectura` [840, 1300), `retiro` [1300, 1500), `apertura` [1500, 2000) y `abierta` desde 2000. El total es ≤ 2200.
  - Bordes exactos de cada fase (t−1, t, t+1). `t` negativo da `armado` y un `t` muy grande da `abierta`.
  - Triangular con tiempos alternativos (los tests no pueden depender de los valores por defecto).
  - Tiempos con total > 2200 o tramos que se solapan hacen que `crearLineaCompuerta` lance un error con mensaje claro.

  Verificación: tests en verde.
- [x] 2.2 RED/GREEN/TRIANGULATE de `debeMostrarCompuerta({ reducedMotion, rutaDeEntrada, hash, sesion })`:
  - `true` solo con `/`, sin ancla válida, sesión disponible y no vista, y sin movimiento reducido.
  - `false` con cada condición por separado: movimiento reducido, `/configurador`, `#proyectos`, sesión no disponible, ya vista.
  - `#`, `''`, `#%E0%A4%A` (URI inválida) y `#1abc` (no es un id) se tratan como sin ancla, porque reutiliza `resolveHashTarget`.

  Verificación: tests en verde.
- [x] 2.3 RED/GREEN/TRIANGULATE de `leerSesion(storage)` y `marcarSesion(storage)`, con almacenamientos falsos:
  - Uno normal: lee vacío, después de marcar lee `vista`, y la clave es `facucode.compuerta`.
  - Uno cuyo `getItem` lanza: `disponible: false`.
  - Uno cuyo `setItem` lanza: `marcarSesion` devuelve `false` sin lanzar.
  - `undefined` o `null`: `disponible: false`.
  - Un *getter* de `sessionStorage` que lanza `SecurityError`, simulado con un objeto con *getter*: la función que resuelve el almacenamiento global no lanza.
  - `decidirCompuerta(entradas, storage)` marca la sesión al decidir mostrarla y devuelve `false` si la marca falla (design D4).

  Verificación: tests en verde.
- [x] 2.4 RED/GREEN/TRIANGULATE del reductor `transicionCompuerta(estado, accion)` y de `estadoHeroSegunCompuerta(fase)`:
  - `cuadro(t)` avanza la fase según la línea y nunca retrocede.
  - `saltar` y `movimiento-reducido` pasan a `abierta` desde cualquier fase, y desde `abierta` no cambian nada.
  - El modo del hero es `lista` para `armado`, `lectura` y `retiro`, `en-espera` para `apertura` y `libre` para `abierta` y para "sin compuerta".
  - `bloqueaDesplazamiento(fase)` es verdadero solo en `armado`, `lectura` y `retiro`.

  Verificación: tests en verde.
- [x] 2.5 Refactor: JSDoc y constantes con nombre en `src/utils/compuerta.js`, sin DOM ni React. Un test importa el módulo en Node puro sin `window`. Verificación: `npm test` y `npm run lint` en verde.

## 3. Escritura del hero según la compuerta (design D5, D9)

- [ ] 3.1 RED/GREEN/TRIANGULATE en `scripts/escritura.test.mjs` de `estadoInicialSegunModo(modo, linea, { reducedMotion, yaEjecutada })` en `src/utils/escritura.js`:
  - `lista` da `estadoFinal`.
  - `en-espera` da `estadoEn(0)`.
  - `libre` da lo mismo que hoy: `estadoEn(0)` si `debeAnimar` y `estadoFinal` si no.
  - Con movimiento reducido, todos los modos dan `estadoFinal`.

  Verificación: tests en verde. Los tests existentes de `escritura.test.mjs` siguen en verde.
- [ ] 3.2 RED: ampliar el guard del hook en `scripts/hero.test.mjs` (`hookEscrituraProblems`):
  - El hook acepta un tercer parámetro de modo con valor por defecto `'libre'`.
  - Solo arranca rAF y listeners en `libre`.
  - No marca `escrituraEjecutada` fuera de `libre`.
  - Ignora `keydown` con `timeStamp` anterior a su `t0`.
  - Sigue sin timers ni `style`.

  Triangular con un hook de ejemplo que arranca el rAF en `lista`, que tiene que fallar. Verificación: el test falla.
- [ ] 3.3 GREEN: implementar el modo en `useEscrituraHero.js`: estado inicial por `estadoInicialSegunModo`, efecto con `modo` en las dependencias, `t0` al pasar a `libre` (seguro ante `StrictMode`) y filtro por `timeStamp`. `Hero.jsx` recibe el modo por contexto, con `'libre'` por defecto si no hay proveedor. Verificación:
  - `npm test` y `npm run lint` (sin advertencias de `react-hooks`) en verde.
  - Guard "Hero no renderiza el glifo del logotipo" en verde.
  - Playwright en 1440 sin compuerta: la entrada escrita se comporta igual que en la línea de base (misma secuencia y duración ≤ 3,5 s).

## 4. Componente y estilos de la compuerta (design D6, D8, D10, D11)

- [ ] 4.1 RED: guard estático en `scripts/compuerta.test.mjs` sobre el nuevo `src/components/CompuertaIntro.jsx`. Tiene que:
  - Tener una raíz con `aria-hidden="true"`, `fixed inset-0`, `z-[70]` y `data-compuerta`.
  - Tener dos hojas (`compuerta-hoja-superior` y `compuerta-hoja-inferior`) con `bg-eva-panel`.
  - Armar las franjas `eva-stripes` en dos tramos por hoja.
  - Montar `<LogoEva variante="completo"` dentro de un envoltorio `compuerta-simbolo` (la animación va en el envoltorio y no en el `<svg>`).
  - Tener "FACU" y "CODE" dentro de la hoja inferior, con `font-eva-display`.
  - No tener `<a`, `<button`, `tabIndex`, `role=`, `style=`, `dangerouslySetInnerHTML` ni hex de colores.

  Triangular con un componente de ejemplo con `tabIndex={0}` y otro con `style={{…}}`, que tienen que fallar. Verificación: el test falla.
- [ ] 4.2 RED: guard de CSS en `scripts/compuerta.test.mjs` con `ruleBody` de `scripts/lib/css-rules.mjs`:
  - `html.compuerta-cerrada` tiene `overflow: hidden` y `scrollbar-gutter: stable`.
  - Los `@keyframes compuerta-*` y las reglas que los usan están solo dentro de `@media (prefers-reduced-motion: no-preference)`.
  - Las hojas animan solo `transform` y la junta y el retiro solo `clip-path`.
  - Las duraciones y demoras del CSS coinciden con `TIEMPOS_COMPUERTA`.
  - Ninguna regla tiene `infinite` ni más de una iteración.

  Triangular con un CSS donde la apertura dura 600 ms (desincronizada) y otro con `animation-iteration-count: infinite`, que tienen que fallar. Verificación: el test falla.
- [ ] 4.3 GREEN: crear `CompuertaIntro.jsx` (recibe `fase` y `onSaltar` por props o por contexto) y agregar las reglas y los keyframes en `src/index.css` según D6 y D8. Verificación: `npm test`, `npm run lint` y `npm run build` en verde, y siguen en verde los guards de `limpieza-cyberpunk` (keyframes de Tailwind intactos), `logotipo` (sin hex del logo) y `sistema-visual`.
- [ ] 4.4 Refactor: comentarios breves en `index.css` (por qué `scrollbar-gutter` y por qué los keyframes no van en Tailwind) y helpers con nombre en el guard si hay repetición. Verificación: `npm test` en verde.

## 5. Estado, salto e integración en Home (design D1, D2, D3, D9, D10)

- [ ] 5.1 RED: guard estático en `scripts/compuerta.test.mjs`:
  - `src/hooks/useCompuerta.js` usa `requestAnimationFrame` con `cancelAnimationFrame` en el cleanup, `useLayoutEffect` para la clase `compuerta-cerrada` sobre `document.documentElement`, y la quita en el cleanup.
  - Escucha `keydown`, `wheel` y `touchmove` en `window` y el `change` de `matchMedia`, y remueve cada uno. No escucha `pointerdown` ni `touchstart` para saltar.
  - Tiene una variable de módulo con la decisión por carga y captura la ruta de entrada al evaluar el módulo.
  - No usa timers ni `style`.
  - `CompuertaIntro` salta con `onClick`.
  - `Home.jsx` monta el proveedor alrededor de `SiteNav` y `main`, y renderiza `CompuertaIntro` una sola vez.
  - `index.html` no contiene "compuerta" ni ningún `<script>` sin `src`.
  - El CSP de `vercel.json` conserva `script-src 'self'` y `style-src 'self'`.
  - `package.json` no suma dependencias.

  Triangular con un hook de ejemplo que salta en `touchstart` y otro que escucha `keydown` en `document`, que tienen que fallar. Verificación: el test falla.
- [ ] 5.2 GREEN: implementar `useCompuerta.js` (proveedor, decisión cacheada, reloj desde el primer rAF, reductor, listeners, bloqueo y `consumida`) e integrar en `Home.jsx` y `Hero.jsx`. Verificación:
  - `npm test`, `npm run lint` y `npm run build` en verde.
  - `npm run dev` con `StrictMode`: sin errores en consola y la intro se ve una sola vez (sin doble arranque).
- [ ] 5.3 Comprobación rápida con Playwright sobre el build (1440×900): la compuerta aparece en el primer cuadro con contenido, se abre a los ~2 s y el hero empieza a escribirse después. Recargar no la muestra. Verificación: tres capturas en el scratchpad (`compuerta-smoke-*.png`) y los tiempos en el resumen.
- [ ] 5.4 Documentación:
  - Agregar en `knowledge-base/09_decisiones_y_supuestos.md` la entrada "Compuerta de entrada (change `compuerta-intro`)". Cubre: una vez por sesión por pestaña, sin almacenamiento no hay compuerta, sin compuerta con movimiento reducido ni con ancla, el hero "listo" bajo la compuerta por el LCP y keyframes en `index.css`.
  - Agregar al inicio de `CHANGES.md` una nota fechada `compuerta-intro`.

  Verificación: `grep -n "compuerta-intro" CHANGES.md knowledge-base/09_decisiones_y_supuestos.md` devuelve las dos menciones.

## 6. Verificación integrada y checkpoint

- [ ] 6.1 Comportamiento por sesión y entrada (Playwright, build con CSP, contexto nuevo por caso):
  - Primera carga de `/`: compuerta presente.
  - Recarga: ausente.
  - Recarga a los 800 ms (a mitad de la intro): ausente.
  - Navegar a `/configurador` y volver por la marca: ausente.
  - Pestaña nueva en el mismo contexto: presente (`sessionStorage` por pestaña).
  - `/#proyectos`: ausente, con la sección en su lugar como en la línea de base. Después `/` en la misma pestaña: presente.
  - Entrada por `/configurador` y navegación SPA a `/`: ausente.
  - `sessionStorage` que lanza (`addInitScript` que redefine el *getter*): ausente, sin errores en consola.
  - `reducedMotion: 'reduce'`: ausente y hero final desde el primer cuadro.
  - `page.emulateMedia({ reducedMotion: 'reduce' })` a los 500 ms: la compuerta desaparece en el cuadro siguiente.

  Verificación: tabla de resultados en el resumen.
- [ ] 6.2 Salto, en 1440 y en 375 con `hasTouch`:
  - Clic a los 300 ms sobre la posición de "Ver proyectos": compuerta fuera en ≤ 1 cuadro (≤ 50 ms medidos) y la URL sin `#proyectos`.
  - `tap` en 375: lo mismo.
  - `keyboard.press('Space')` y `press('Tab')`: compuerta fuera, foco visible en el salto al contenido con Tab y la escritura del hero **empieza** desde el kicker vacío (no queda completa). Una segunda tecla la completa.
  - `mouse.wheel`: compuerta fuera, y la rueda siguiente desplaza la página.
  - Gesto táctil de desplazamiento: compuerta fuera.
  - En ningún caso se ve el hero completo antes de la escritura: captura del cuadro siguiente al salto.

  Verificación: resultados y capturas en el resumen.
- [ ] 6.3 Accesibilidad, CSP y desplazamiento:
  - A los 500 ms, `ariaSnapshot` de `body` sin nada de la compuerta ("FACU CODE" ausente) y con el contenido del hero.
  - Ningún elemento de la compuerta en el orden de Tab.
  - Consola sin violaciones de CSP ni errores durante toda la intro.
  - `window.scrollBy(0, 400)` con la compuerta cerrada deja `scrollY` en 0, y después de la apertura desplaza.
  - En 1440, `clientWidth` igual al de la línea de base durante y después del bloqueo.

  Verificación: resultados en el resumen.
- [ ] 6.4 Métricas con la metodología de 1.2 (mediana de 3, sesión nueva por corrida):
  - CLS ≤ 0,1 en 1440 y 375 con la compuerta.
  - LCP de 1440 ≤ base + 10 % (el candidato sigue siendo el retrato).
  - LCP de 375 ≤ base + 1 s (el candidato sigue siendo el párrafo).
  - Con movimiento reducido, LCP ≤ base + 10 % en ambos anchos.
  - Duración medida de la compuerta ≤ 2,2 s y escritura del hero ≤ 3,5 s desde el fin de la apertura.

  Verificación: tabla antes → después en el resumen. Si una cota falla, detenerse y reportar.
- [ ] 6.5 Cuadros y video de la intro en 1440×900 y en 375×812, sin movimiento reducido, en el scratchpad:
  - PNG en los instantes clave: 0, 150, 400, 700, 1000, 1400, 1600, 1800, 2000 y 2600 ms, como `compuerta-<ancho>-<ms>.png`. La captura de los 2600 ms tiene que mostrar el hero escribiéndose.
  - Un `.webm` por ancho con `recordVideo`, de 6 s (`compuerta-1440.webm` y `compuerta-375.webm`).

  Verificación: archivos presentes y sus rutas absolutas en el resumen.
- [ ] 6.6 `npm run ci` completo en verde (lint, verify:*, tests, build y verify:build) y conteo de tests contra 1.1. Verificación: salida de `npm run ci` en el resumen.
- [ ] 6.7 **Checkpoint visual del usuario (MEDIUM). Queda para el usuario.** Presentar los cuadros y videos de 6.5 y la tabla de 6.4, y pedir visto bueno sobre:
  - El glifo que se recoge hacia la junta antes de abrir (design D6, frente a partirlo o hacerlo viajar con una hoja).
  - "FACU" en papel y "CODE" en violeta claro.
  - Hojas en `eva-panel` con franjas naranjas en la junta.
  - Curva y duración de la apertura (500 ms ease-in) y duración total (~2 s).

  Ajustar solo constantes y clases dentro de las specs según su respuesta. Verificación: respuesta del usuario anotada en esta tarea, con fecha.
