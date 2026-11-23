# Tasks

> Strict TDD con `node --test "scripts/**/*.test.mjs"`, sin Vitest. Cada tarea de código sigue RED (test que falla) → GREEN → triangulación → refactor, y se ejecutan los tests en cada paso. No se tocan textos visibles, ni la lógica del wizard, el webhook, el PDF, la CSP o la precarga. Antes de editar `scripts/lib/` o un guard existente, releerlos, porque otros changes pueden haberlos movido. Gobernanza LOW (borrado sin usos) y MEDIUM (fuente del cuerpo y base global, con el checkpoint de la tarea 5.3).

> El test de archivos de la tarea 2.2 queda en rojo **a propósito** hasta el grupo 6. En las tareas 3 a 5, "tests en verde" significa todos los demás tests, más ese mismo test con menos restos que en el paso anterior.

## 1. Inventario, red de seguridad y línea de base

- [x] 1.1 Verificar la precondición de design D1: `acerca-testimonios-glass` y `configurador-estilo-eva` mergeados en la rama (`Testimonials.jsx` sin `GlitchText`, `.eva-glass` en `src/index.css`, existe `scripts/configurador-estilo.test.mjs`). También están mergeados los ajustes del carrete 3D que el orquestador indique. Si falta algo, detenerse y reportar. Verificación: resultado anotado en el resumen del apply.
- [x] 1.2 Correr el inventario de design D1 (un `grep` por elemento sobre `src/` e `index.html`) y armar la tabla elemento → usos (archivo:línea) → acción (borrar / migrar base global / `PENDIENTES` / `PERMITIDOS`). Cualquier uso dentro de una sección o del configurador se reporta y **no** se migra. Verificación: tabla en el resumen del apply.
- [x] 1.3 Línea de base: `npm test` (anotar cuántos tests pasan y frenar si hay fallas previas), `npm run build` y tamaños de `dist/assets` (`.css`, `.woff2` y `.js`, crudo y gzip). Sacar capturas de `/` y `/configurador/` a 1440 y 375 px con `npm run preview`, como referencia del "antes". Verificación: baseline y capturas guardadas fuera del repo (scratchpad) y citadas en el resumen.

## 2. Guard global (rojo primero)

- [x] 2.1 RED/GREEN de `scripts/lib/legacy-guard.mjs` (`LEGACY_RULES`, `scanLegacy`, `PERMITIDOS`, `PENDIENTES`) en `scripts/limpieza-cyberpunk.test.mjs`, con la tabla de positivos y negativos de design D2. Triangular cada regla con al menos un positivo con variante (`hover:`, `md:`, `/60`) y un negativo eva (`eva-glass`, `eva-tag`, `eva-reveal`, `font-eva-display`, `font-display: swap` en CSS, `{service.tag}`, `useReveal`). Verificación: tests unitarios del guard en verde.
- [x] 2.2 Test de archivos: recorrer todo `src/` (`.js`, `.jsx`, `.css`) más `index.html` con `scanLegacy` y esperar `[]`, con un mensaje que liste `path · rule · match`. Sumar el test de vigencia de `PERMITIDOS`/`PENDIENTES` (design D2, punto 3), con las excepciones del PDF (`#00ffc3`, `#030303`) y lo que haya reportado la 1.2. Verificación: el test de archivos queda **en rojo** y nombra los restos inventariados (prueba de que el guard funciona); el de vigencia, en verde.

## 3. Base global en la paleta eva

- [x] 3.1 RED: en `scripts/sistema-visual.test.mjs`, el `theme-color` de `index.html` tiene que ser igual a `EVA_COLORS.black`, y `<body>` tiene que usar `bg-eva-black text-eva-paper`. Sumar el par `::selection` (negro sobre naranja ≥ 3:1) y el texto del `LoadingFallback` (`gray` sobre `black` ≥ 4.5:1) a `checkContrastPairs`. GREEN: migrar `index.html` según design D4. Verificación: tests en verde.
- [x] 3.2 RED/GREEN en `src/index.css`: `body` con `@apply bg-eva-black text-eva-paper`, scrollbar con `var(--eva-*)` sin `border-radius`, `scrollbar-color` en `html` y `::selection` naranja con texto negro. Verificar con `blockBody` que no quedan hex ni `rgba` viejos en esos bloques. Verificación: tests y `npm run build` en verde.
- [x] 3.3 Migrar `src/pages/Home.jsx` (`bg-dark` → `bg-eva-black`, sin tocar el resto del `<main>`) y `LoadingFallback` de `src/App.jsx` (design D4). Verificación: esos archivos desaparecen de la salida del test 2.2, y `npm test` corre sin fallas nuevas.

## 4. Borrado de CSS, tokens y componente

- [x] 4.1 Borrar de `src/index.css` las clases y keyframes con 0 usos según 1.2 (`.glass`, `.glass-hover`, `.gradient-text`, `.gradient-border`, `.glow-*`, `.section-*`, `.tag`, `.duotone-wrap`, `.cyber-grid`, `.text-glow-*`, `.box-glow-*`, `.animate-scan`, `.animate-glitch-*`, `@keyframes scan`/`glitch-*`, `.reveal*`). Dejar el bloque `prefers-reduced-motion: reduce` con solo selectores que existan. Invertir en `scripts/sistema-visual.test.mjs` el test "no se tocaron .reveal, .tag, .glass ni .cyber-grid" a "no quedan selectores heredados" (RED antes de borrar). Verificación: tests y `npm run build` en verde, y se mantiene el test de `.eva-reveal` en reduce.
- [x] 4.2 RED: invertir en `scripts/sistema-visual.test.mjs` "conserva los tokens anteriores" (`Object.keys(colors)` es `['eva']`) y sumar a `limpieza-cyberpunk.test.mjs` las verificaciones de `tailwind.config.js` de design D2, punto 4. GREEN: quitar `dark`, `accent`, `neon`, `muted` y las animaciones y keyframes sin uso (`flicker` y, según 1.2, `fade-in`/`slide-up`/`pulse-slow`), conservando `eva-boot`. Verificación: tests y `npm run build` en verde, sin errores de `@apply`.
- [x] 4.3 Borrar `src/components/GlitchText.jsx` (confirmar 0 importadores con `grep`). Verificación: `npm run lint`, `npm test` y `npm run build` en verde.

## 5. Tipografías

- [x] 5.1 RED: en `scripts/sistema-visual.test.mjs`, `fonts.sans` tiene que ser `EVA_FONT_SANS`, exportado por `src/styles/eva-tokens.js` con la pila de design D3 (con `system-ui` primero y `sans-serif` al final). No tiene que existir `fonts.display`, y `mono` y `eva-display` no cambian. GREEN: exportar `EVA_FONT_SANS` e importarlo en `tailwind.config.js`, y quitar `display`. Verificación: tests y build en verde.
- [x] 5.2 RED: el test de `fonts.css` pasa a exigir exactamente las familias Noto Serif Display y JetBrains Mono, sin `rajdhani`/`orbitron`, con `font-display: swap` y solo latin. Sumar a `limpieza-cyberpunk.test.mjs` la verificación de `package.json` (design D2, punto 5). GREEN: borrar los `@font-face` de Orbitron y Rajdhani y su comentario, y correr `npm uninstall @fontsource-variable/orbitron @fontsource/rajdhani`. Ajustar los fixtures de `scripts/font-preload.test.mjs` y `scripts/deploy-config.test.mjs` a stems de familias vivas sin cambiar qué verifican, y el comentario del plan B en `scripts/lib/font-preload.mjs` (design D6). Verificación: `npm test`, `npm run build` y `npm run verify:build` en verde. `dist/assets` no tiene `.woff2` de Orbitron ni Rajdhani.
- [x] 5.3 Checkpoint MEDIUM: capturas después del cambio en 1440 y 375 px de la biografía, los testimonios, el Stack, el contacto y los pasos del configurador, comparadas con las de 1.3. Corregir en el archivo del componente, con utilidades eva, cualquier desborde o corte nuevo por la fuente del sistema, y listar cada ajuste. Verificación: comparativa antes→después en el resumen del apply para que la revise el usuario.

## 6. Guard en verde

- [x] 6.1 Correr `scripts/limpieza-cyberpunk.test.mjs` completo. El test de archivos tiene que dar `[]` y `PENDIENTES` solo puede contener lo reportado en 1.2, con motivo. Volver a correr el inventario de 1.2 por si la rama se movió durante el apply. Verificación: `npm run ci` en verde.

## 7. Documentación

- [x] 7.1 Actualizar `knowledge-base/`:
  - `08_arquitectura_propuesta.md`: árbol de componentes sin `GlitchText` y con los componentes y módulos eva; tipografías (Noto Serif Display, JetBrains Mono, pila de sistema); `src/styles/eva-tokens.js` y los guards.
  - `09_decisiones_y_supuestos.md`: DD-07 pasa a ser la estética Evangelion, y se suma una DD nueva para la fuente de cuerpo de sistema (design D3).
  - `05_reglas_de_negocio.md`: RN-EX-02 con la paleta eva.
  - `01_vision_y_objetivos.md`: deja de decir "cyber/neón".
  - `10_preguntas_abiertas.md`: preguntas del PDF y del favicon/og-image.

  Verificación: `grep -niE "cyber|neón|00ffc3|orbitron|rajdhani|glitch" knowledge-base/` solo devuelve las menciones históricas marcadas como tales o las preguntas abiertas.
- [x] 7.2 Agregar al inicio de `CHANGES.md` una nota fechada "Rediseño Evangelion" con los changes en orden: `tokens-fuentes-texturas-eva`, `navbar-brutalista-glass`, `proyectos-scroll-horizontal` (reemplazado por `proyectos-carrete-3d`), `hero-brutalista`, `acerca-testimonios-glass`, `stack-neumorfico-oscuro`, `contacto-brutalista`, `configurador-estilo-eva` y `limpieza-cyberpunk`. Cada uno con una línea de qué cambió, más la mención de lo retirado (paleta y fuentes cyberpunk, `GlitchText`, spec `texto-animado`). Verificación: nota presente y nombres iguales a los de `openspec/changes/archive/`.

## 8. Regresión visual final y cierre

- [x] 8.1 Escribir RED/GREEN de `scripts/lib/asset-weights.mjs` (`resumirPesos`, design D7), con triangulación: lista vacía y mezcla de extensiones. Agregar el CLI `scripts/pesos-build.mjs`. Correr Playwright sobre `npm run build && npm run preview` según design D7:
  - Webhook mockeado antes de navegar y CSP de `vercel.json` inyectada en el documento.
  - `/` y `/configurador/` en 1440×900 y 375×812, con recorrido de secciones y pasos (éxito y error con el mock).
  - Clases huérfanas = `[]`, consola sin errores, 0 `securitypolicyviolation` y ninguna advertencia de precarga ociosa.
  - Ninguna petición a Orbitron, Rajdhani u orígenes externos, y párrafo de cuerpo con `font-family` que empieza con `system-ui`.

  Verificación: tabla de pesos CSS y fuentes antes→después (crudo y gzip), lista de capturas y resultado de cada chequeo en el resumen del apply.
- [ ] 8.2 Antes de archivar este change, confirmar que `tokens-fuentes-texturas-eva` y `configurador-estilo-eva` estén archivados (crean y modifican `sistema-visual` en `openspec/specs/`). Si no, archivarlos primero. Verificación: existe `openspec/specs/sistema-visual/spec.md` con el requisito "Coexistencia con la paleta anterior".
- [ ] 8.3 Después del archive, si `openspec/specs/texto-animado/` quedó sin requisitos, borrar el directorio y correr `openspec validate --strict --specs`. Verificación: validación en verde y `texto-animado` ausente de `openspec list --specs`.
