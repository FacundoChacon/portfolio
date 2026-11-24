# Tasks

> Strict TDD con `node --test "scripts/**/*.test.mjs"` (no hay Vitest ni RTL y no se agregan). Cada tarea de código sigue el ciclo RED (test que falla) → GREEN → triangulación (≥ 2 casos por comportamiento) → refactor, ejecutando los tests en cada paso. Lo que no se puede testear con `node --test` (layout real, LCP, CLS, accesibilidad, video) se verifica con Playwright sobre `npm run build` + `vite preview`. Los scripts van al scratchpad, no al repo. Gobernanza MEDIUM: checkpoint con el usuario en 8.5. Contáctame **no** se anima. No se tocan textos, colores, tipografías, CSP ni precarga.

## 1. Red de seguridad, línea de base y spike del obturador

- [x] 1.1 Correr `npm test` en la rama sin cambios y anotar cuántos tests pasan. Si hay fallas previas, detenerse y reportarlas. Verificación: conteo en el resumen del apply.
- [x] 1.2 Línea de base medida en `main` (build + preview, Playwright): alto de la sección, fin de las acciones y fin de la columna derecha del hero, y fin del panel y del último canal de contacto, en 375/768/1024/1280/1440/1920. LCP (elemento y tiempo) y CLS de `/` en 1440×900 y 375×812, con y sin `reducedMotion: 'reduce'`, tomando la mediana de 3 corridas. Verificación: tabla en el resumen; debe coincidir con la de design (Context) salvo ruido.
- [ ] 1.3 Spike del obturador (design D4), en una página aislada del scratchpad que reproduzca la sección: `isolation: isolate`, grilla en `::before` con `z-index:-1`, `figure` con `z-index` menor y obturador encima. Medir que la `<img>` reporte LCP en el primer frame y que el obturador se confunda con el fondo y su grilla. Si alguna de las dos falla, aplicar el plan B "tarjeta en espera" de D4 y anotarlo. Verificación: entradas de LCP y captura en el resumen, con la decisión tomada.

## 2. Hueco del hero (design D1)

- [x] 2.1 RED en `scripts/hero.test.mjs`: guard de layout sobre `Hero.jsx` según D1. La `section` no tiene `min-h-screen`, la columna derecha no tiene `md:mt-16` y la ficha tiene `md:-mt-24` y `lg:-mt-36` y no `md:-mt-10`. El retrato conserva `aspect-[4/5]` y la ficha conserva `mt-10` para móvil. Triangular con un fragmento del markup anterior que el guard tiene que rechazar. Verificación: el test falla por las clases actuales.
- [x] 2.2 GREEN: aplicar D1 en `Hero.jsx`. Sacar `min-h-screen`, y también `flex`, `flex-col`, `flex-1` y `content-center` si quedan sin efecto, sin cambiar el `pt-24`/`pb-16`. Sacar `md:mt-16` y cambiar la ficha a `md:-mt-24 lg:-mt-36`. Verificación: `npm test` en verde. Playwright en 768/1024/1280/1440/1920: hueco entre el fin de las acciones y el fin de la ficha ≤ 96 px y ficha que tapa ≤ 1/3 del alto del retrato. En 375 la medición es igual a la de la línea de base. Capturas `hero-gap-despues-*.png` en el scratchpad.

## 3. Hueco de Contáctame (design D2)

- [x] 3.1 RED en `scripts/contacto.test.mjs`: guard sobre `Contact.jsx`. La `ul` de canales conserva `content-start` y suma `lg:auto-rows-fr` y `lg:content-stretch`, y `CHANNEL_CLASSES` incluye `lg:h-full`. Triangular con el markup actual, que tiene que fallar, y con una variante sin prefijo `lg:` (`auto-rows-fr` sola), que también tiene que fallar porque estiraría los canales en móvil. Verificación: el test falla.
- [x] 3.2 GREEN: aplicar D2 en `Contact.jsx`. Verificación: `npm test` en verde. Playwright en 1024/1280/1440/1920: la diferencia entre el fin del último canal y el fin del panel es ≤ 16 px y los tres canales miden lo mismo. En 375/768 los canales miden igual que en la línea de base (72 px). Hover y foco por teclado siguen visibles sobre todo el canal. Capturas `contact-gap-despues-*.png` en el scratchpad.

## 4. Datos y helpers puros de escritura (design D5)

- [ ] 4.1 RED/GREEN en `scripts/hero.test.mjs`: `src/data/presentacion.js` exporta `KICKER` ("01 // Presentación") y `DESCRIPCION`, con el texto exacto que hoy está en `Hero.jsx`. Triangular: no vacíos, sin espacios dobles ni saltos de línea. Mover los textos y hacer que `Hero.jsx` los use, sin cambio visual. Verificación: tests en verde y texto renderizado idéntico (Playwright `textContent` antes y después).
- [ ] 4.2 RED/GREEN/TRIANGULATE de `partirTexto(texto, visibles, direccion)` en el nuevo `scripts/escritura.test.mjs`. Casos:
  - izq→der con 0, n y largo.
  - der→izq con 0, n y largo.
  - Puntos de código: "Chacón" y "Operativo · disponible" no parten la "ó" ni el "·".
  - `visibles` fuera de rango se recorta.
  - `visible + reservado` (o `reservado + visible`) reconstruye siempre el texto.

  Verificación: tests en verde.
- [ ] 4.3 RED/GREEN/TRIANGULATE de `crearLineaDeTiempo` y `caracteresVisibles`:
  - Segmentos en orden, pausas de 30 ms y fases A → acciones → B → C con las constantes de D5.
  - Total ≤ 3500 ms.
  - Inicio de la descripción ≤ 850 ms (cota del LCP móvil).
  - `caracteresVisibles` da 0 antes del inicio, el largo después del fin y es monótona no decreciente en el medio.
  - Triangulación con constantes alternativas (los tests no pueden depender de los valores por defecto).

  Verificación: tests en verde.
- [ ] 4.4 RED/GREEN/TRIANGULATE de `faseEn`, `estadoEn`, `mismoEstado` y `debeAnimar`:
  - Bordes exactos de cada fase.
  - En la fase C, cada fila revela primero todo el valor y después la etiqueta, y las filas van en orden Rol → Stack → Ubicación → Estado.
  - `debeAnimar` es falso con movimiento reducido o si ya se ejecutó.
  - `mismoEstado` detecta cambios de un solo carácter.

  Verificación: tests en verde.
- [ ] 4.5 Refactor: constantes con nombre y JSDoc en `src/utils/escritura.js`, sin DOM ni React (test que importa el módulo en Node puro). Verificación: `npm test` y `npm run lint` en verde.

## 5. Texto escrito accesible y cursor (design D3, D7)

- [ ] 5.1 RED: guard estático en `scripts/hero.test.mjs` para el nuevo `src/components/TextoEscrito.jsx`. Tiene que:
  - Renderizar el texto completo en un `sr-only`.
  - Poner la capa visual con `aria-hidden="true"`.
  - Usar `partirTexto`.
  - Reservar el tramo oculto con `text-transparent` (no `invisible`, `hidden` ni `opacity-0`).
  - No usar `style=` ni `dangerouslySetInnerHTML`.
  - Aceptar `direccion` (`izq` / `der`) y un modo decorativo sin copia `sr-only` (kicker) o con nombre accesible externo (`h1`).

  Triangular con un componente de ejemplo que use `invisible` y otro con `style={{…}}`, que el guard tiene que rechazar. Verificación: el test falla.
- [ ] 5.2 GREEN: crear `TextoEscrito.jsx` según D3. Verificación: tests en verde.
- [ ] 5.3 RED/GREEN del cursor en `src/index.css`: clase de cursor sobre el `::before` del segundo tramo, con `position: absolute`, color `eva-primary-light` y **sin** `animation` ni keyframes de parpadeo. Con `prefers-reduced-motion: reduce` no se muestra. Guard en `scripts/hero.test.mjs` con `scripts/lib/css-rules.mjs`, y triangular con una regla que tenga `animation` para que falle. Verificación: tests en verde y `npm run build` sin errores. El guard global `limpieza-cyberpunk` sigue en verde.
- [ ] 5.4 RED/GREEN del keyframe del obturador en `tailwind.config.js` (`evaObturador`, `clip-path` en `steps`, sin `opacity` en la `<img>`). El guard de `hero.test.mjs` exige que la animación solo aparezca detrás de `motion-safe:`, con la regla existente "animate sin motion-safe". Verificación: tests en verde.

## 6. Hook `useEscrituraHero` (design D6)

- [ ] 6.1 RED: guard estático sobre `src/hooks/useEscrituraHero.js`:
  - Importa `prefersReducedMotion`/`REDUCED_MOTION_QUERY` de `utils/motion` y los helpers de `utils/escritura`.
  - Usa `requestAnimationFrame` con su `cancelAnimationFrame` en el cleanup.
  - Escucha `keydown`, `focusin` y el `change` de `matchMedia` y los remueve.
  - Tiene un flag de módulo de una sola ejecución.
  - No contiene `setInterval`, `style` ni timers sin limpiar.

  Triangular con un hook de ejemplo que no cancela el rAF, que tiene que fallar. Verificación: el test falla.
- [ ] 6.2 GREEN: implementar el hook. Estado inicial síncrono, `t0` en `ref` (seguro ante `StrictMode`), `setState` solo si `!mismoEstado` y salida `{ fase, visibles }`. Verificación: tests en verde, `npm run lint` sin advertencias de `react-hooks` y `npm run dev` sin errores en consola con `StrictMode`.

## 7. Integración en el hero (design D4, D7)

- [ ] 7.1 RED: reescribir en `scripts/hero.test.mjs` el test "el retrato y el h1 no se animan ni se ocultan" al nuevo contrato:
  - La etiqueta `<img>` no lleva `animate-`, `opacity-`, `invisible`, `hidden` ni `clip`, y mantiene `fetchpriority="high"`.
  - El `<h1>` mantiene su `aria-label` y no lleva clases de animación ni de ocultamiento.
  - Existe un obturador `aria-hidden` dentro de la `figure`.
  - La sección expone `data-escritura`.
  - Las acciones y la ficha usan `opacity-0` y nunca `invisible` ni `hidden`.
  - Los cuatro textos de la columna izquierda y las ocho celdas de la ficha usan `TextoEscrito`.

  Sumar un guard de `package.json` que falle si aparecen `gsap`, `framer-motion`, `motion`, `typed.js` o `react-type-animation`. Verificación: el test falla.
- [ ] 7.2 GREEN: integrar en `Hero.jsx` el hook, `TextoEscrito` en el kicker, el nombre, el subtítulo, la descripción y en `dt`/`dd` de la ficha (der→izq, primero el valor y después la etiqueta), las acciones con `opacity-0` → `motion-safe:animate-eva-boot`, la ficha por fases y el obturador según el resultado de 1.3. La franja inferior conserva su `eva-boot`. Verificación: `npm test`, `npm run lint` y `npm run build` en verde.
- [ ] 7.3 Actualizar `knowledge-base/` (el archivo que describe el hero y el motion) y agregar al inicio de `CHANGES.md` una nota fechada `hero-escritura`. La nota cubre los huecos del hero y del contacto arreglados, la entrada escrita en tres fases, que no revive `texto-animado` y el trade-off de LCP de D4. Verificación: las dos menciones presentes y `grep -n "hero-escritura" CHANGES.md` devuelve la nota.

## 8. Verificación integrada y checkpoint

- [ ] 8.1 Playwright sobre el build con la CSP de `vercel.json` inyectada como cabecera (`page.route`):
  - Sin movimiento reducido, en 1440 y 375: secuencia A → acciones → B → C en el orden de la spec, la duración total hasta el último carácter de la ficha ≤ 3,5 s y consola sin violaciones de CSP ni errores.
  - Con `reducedMotion: 'reduce'`: primer frame en estado final, sin obturador.
  - Navegar a `/configurador/` y volver a `/` por SPA: sin reescritura.
  - Tab a los 300 ms: estado final inmediato y foco visible en "Ver proyectos".

  Verificación: resultados en el resumen.
- [ ] 8.2 Accesibilidad y SEO durante la fase A (a ~500 ms):
  - El `ariaSnapshot` de `#presentacion` contiene el nombre "Facundo Chacón", el rol, la descripción completa y las cuatro filas de la ficha completas, sin fragmentos ni el cursor.
  - El `textContent` de la sección en el primer render ya incluye todos esos textos.

  Verificación: snapshots en el resumen.
- [ ] 8.3 Métricas con la misma metodología que 1.2 (mediana de 3):
  - CLS ≤ 0,1 en 1440 y 375.
  - LCP de 1440 ≤ base + 10 % (el candidato sigue siendo el retrato).
  - LCP de 375 ≤ base + 1 s.
  - Con movimiento reducido, LCP ≤ base + 10 % en ambos anchos.

  Si el LCP de 375 supera la cota, aplicar el plan B "texto fantasma" de D4 y volver a medir. Verificación: tabla antes → después en el resumen.
- [ ] 8.4 Grabar con Playwright (`recordVideo`) la entrada completa del hero en 1440×900 y en 375×812 (5 s cada una, sin movimiento reducido), y guardarla en el scratchpad como `hero-escritura-1440.webm` y `hero-escritura-375.webm`. Sumar capturas finales del hero y del contacto en 375/768/1024/1440/1920. Verificación: archivos presentes con sus rutas absolutas en el resumen.
- [ ] 8.5 `npm run ci` completo en verde (lint, verify:*, tests, build, verify:build) y conteo de tests contra 1.1. Checkpoint MEDIUM: presentar al usuario los videos, las capturas antes → después y la tabla de métricas, y esperar su visto bueno antes de cerrar. Verificación: salida de `npm run ci` y respuesta del usuario anotadas en el resumen.
