# Tasks

> Strict TDD: en cada pieza de lógica, primero el test en RED (ejecutado y fallando), luego el mínimo código en GREEN, triangulación y refactor. Runner: `npm run test` (`node --test "scripts/**/*.test.mjs"`). Sin Vitest.

## 1. Red de seguridad y dependencias

- [x] 1.1 Correr `npm run ci` sobre la rama limpia y registrar la línea base (tests en verde, build OK); si algo falla, detenerse y reportarlo como falla preexistente.
- [x] 1.2 Instalar `@fontsource-variable/noto-serif-display`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/orbitron` y `@fontsource/rajdhani` como `dependencies`; verificar que existen `node_modules/@fontsource-variable/noto-serif-display/files/noto-serif-display-latin-wdth-normal.woff2` y los `latin` de las otras tres, y que `npm run test` sigue en verde.

## 2. Paleta `eva` y contraste

- [x] 2.1 RED: crear `scripts/contrast.test.mjs` con casos de `relativeLuminance`/`contrastRatio` (blanco/negro = 21, mismo color = 1, `#EDE6D6` sobre `#050505` ≈ 16.39, simetría a/b) importando `scripts/lib/contrast.mjs` inexistente; ejecutar y ver el fallo.
- [x] 2.2 GREEN: implementar `relativeLuminance` y `contrastRatio` en `scripts/lib/contrast.mjs` (fórmula WCAG 2.x, umbral 0.04045); verificar `npm run test` en verde.
- [x] 2.3 RED: casos de `checkContrastPairs(colors, pairs)` — un par `normal` con 4.28 devuelve un error que nombra ambos tokens, el valor y el umbral; un par `large` con 3.84 no da error; un token inexistente da error. Ejecutar y ver el fallo; luego GREEN.
- [x] 2.4 RED: test que importa `EVA_COLORS` y `EVA_CONTRAST_PAIRS` de `src/styles/eva-tokens.js` (inexistente) y exige `checkContrastPairs(...)` sin errores, que `eva-red` y `eva-purple` solo aparezcan con nivel `large`/`ui` y que el foco (`eva-green`) alcance ≥ 3 sobre `eva-black`, `eva-panel`, `#030303` y `#111116`. Ver el fallo.
- [x] 2.5 GREEN: crear `src/styles/eva-tokens.js` con los hex y los pares de la tabla de `design.md` (D1); verificar test en verde. Triangular: cambiar temporalmente `eva-orange` a un tono que baje de 4.5 sobre panel y confirmar que el test falla con mensaje legible; revertir.
- [x] 2.6 RED: test (en `scripts/sistema-visual.test.mjs`) que importa `tailwind.config.js` y exige `theme.extend.colors.eva` igual a `EVA_COLORS`, y que `accent.green`, `accent.pink`, `neon.cyan`, `neon.magenta`, `dark.*` y `muted.*` sigan con sus valores actuales. Ver el fallo (falta `eva`).
- [x] 2.7 GREEN: importar `EVA_COLORS` en `tailwind.config.js` bajo `colors.eva` sin tocar el resto; agregar en `src/index.css` (`@layer base`, `:root`) las variables `--eva-*` con `theme('colors.eva.…')` y `--eva-focus`. Verificar `npm run test` y `npm run build` en verde.

## 3. Tipografías autoalojadas

- [x] 3.1 Spike: crear `src/styles/fonts.css` con un único `@font-face` de prueba (`'Noto Serif Display'`, `url('@fontsource-variable/noto-serif-display/files/noto-serif-display-latin-wdth-normal.woff2')`) importado desde `src/main.jsx` y correr `npm run build`; si el `.woff2` aparece en `dist/assets/` con hash, conservar el especificador de paquete; si no, usar ruta relativa a `node_modules`. Anotar el resultado en `design.md` (D3).
- [x] 3.2 RED: en `scripts/sistema-visual.test.mjs`, casos estáticos que fallen hoy: `index.html` no contiene `fonts.googleapis.com` ni `fonts.gstatic.com`; `src/styles/fonts.css` declara `@font-face` para `'Noto Serif Display'` (con `font-stretch: 62.5% 100%` y `font-weight: 100 900`), `'JetBrains Mono'`, `'Orbitron'` y `'Rajdhani'` (400/500/600/700, o importa los `latin-*.css` de `@fontsource/rajdhani`), y ningún `src:` apunta a un archivo que no sea `-latin-` (ni `latin-ext`, `cyrillic`, `greek`, `vietnamese`). Ver el fallo.
- [x] 3.3 GREEN: completar `src/styles/fonts.css` según D3 (solo latin, `font-display: swap`, mismos nombres de familia que hoy), importarlo en `src/main.jsx` antes de `./index.css`, quitar de `index.html` los dos `preconnect` y la hoja de Google Fonts. Verificar `npm run test` y `npm run build`; comprobar que `dist/assets/` solo contiene `.woff2` latin.
- [x] 3.4 Agregar `fontFamily['eva-display']` en `tailwind.config.js` y las utilidades `.font-stretch-condensed` / `.font-stretch-extra-condensed` en `@layer utilities`; extender el test de 2.6 para exigir `eva-display` y que `sans`, `display` y `mono` no cambiaron (RED antes de editar, luego GREEN).

## 4. Precarga de la fuente principal

- [x] 4.1 RED: crear `scripts/font-preload.test.mjs` para `findFontAssets(fileNames, stems)` de `scripts/lib/font-preload.mjs` (inexistente): encuentra `assets/rajdhani-latin-400-normal-AbC123.woff2` y devuelve `/assets/…`; lanza si el stem falta; lanza si hay dos coincidencias; no confunde `rajdhani-latin-400-normal` con `rajdhani-latin-ext-400-normal`. Ver el fallo; luego GREEN.
- [x] 4.2 RED: casos de `fontPreloadTags(hrefs)`: descriptor con `rel=preload`, `as=font`, `type=font/woff2`, `crossorigin`, `injectTo: 'head'` y ningún atributo `on*`; lista vacía → sin tags. Ver el fallo; luego GREEN. Exportar `PRELOAD_FONT_STEMS = ['rajdhani-latin-400-normal']`.
- [x] 4.3 RED: en `scripts/route-html.test.mjs`, `extractHeadMeta` devuelve `preloads` (`href`, `as`, `type`, `crossorigin`) y los orígenes externos referenciados; los fixtures actuales con Google Fonts deben reportar `fonts.googleapis.com`. Ver el fallo; luego GREEN en `scripts/lib/route-html.mjs`.
- [x] 4.4 RED: en `scripts/deploy-config.test.mjs`, `checkBuiltPages(pages, { preloadStems, assetExists })`: página sin precarga → error con URL y stem; precarga sin `crossorigin` → error; `href` con `assetExists` falso → error con la ruta; HTML con `https://fonts.googleapis.com/...` → error con URL y origen; página correcta → sin errores; llamada sin opciones conserva el comportamiento anterior (tests existentes en verde). Ver el fallo; luego GREEN en `scripts/lib/deploy-config.mjs`.
- [x] 4.5 Implementar `fontPreloadPlugin()` (transformIndexHtml `order: 'post'`, solo build, usando `ctx.bundle` + las funciones puras) y registrarlo en `vite.config.js` antes de `routeHtmlPlugin()`; pasar `preloadStems: PRELOAD_FONT_STEMS` y `assetExists` (`existsSync` sobre `dist/`) desde `scripts/verify-build.mjs`. Verificar con `npm run build && npm run verify:build` en verde y que `dist/index.html` y `dist/configurador/index.html` contienen la precarga. Si `ctx.bundle` no trae el `.woff2`, aplicar el fallback de D4/Riesgos (`writeBundle`).

## 5. CSP endurecida

- [x] 5.1 RED: en `scripts/deploy-config.test.mjs`, cambiar `CSP_OK` a `style-src 'self'` y `font-src 'self'` y agregar casos: `style-src 'self' https://fonts.googleapis.com` → error que nombra `style-src` y el host; `font-src 'self' https://fonts.gstatic.com` → error que nombra `font-src` y el host; CSP sin `font-src` → error "falta la directiva font-src". Ver el fallo (hoy se aceptan).
- [x] 5.2 GREEN: agregar `'style-src': ["'self'"]` y `'font-src': ["'self'"]` a `REQUIRED_CSP` en `scripts/lib/deploy-config.mjs`; confirmar que el test existente de fuentes inseguras sigue en verde.
- [x] 5.3 Actualizar la CSP de `vercel.json` exactamente como D5 ("DESPUÉS") y verificar `npm run verify:deploy` en verde (y en rojo si se reintroduce un host de Google, probado a mano y revertido).
- [x] 5.4 Actualizar la línea CSP de `knowledge-base/08_arquitectura_propuesta.md` y verificar que coincide carácter a carácter con `vercel.json`.

## 6. Texturas, foco y movimiento

- [x] 6.1 RED: en `scripts/motion.test.mjs`, casos de `shouldRevealImmediately({ reducedMotion, hasIntersectionObserver })` de `src/utils/motion.js`: `true` con movimiento reducido, `true` sin IntersectionObserver, `false` sin ninguna de las dos. Ver el fallo; luego GREEN.
- [x] 6.2 Usar `shouldRevealImmediately` + `prefersReducedMotion()` en `src/hooks/useReveal.js` (si es `true`, `setVisible(true)` sin crear el observer); verificar `npm run lint` y `npm run test` en verde.
- [x] 6.3 RED: en `scripts/sistema-visual.test.mjs`, guards estáticos sobre `src/index.css`: `scroll-behavior: smooth` aparece solo dentro de `@media (prefers-reduced-motion: no-preference)`; `:focus-visible` usa `var(--eva-focus)` y ya no `#00ffc3`; `.eva-reveal` tiene override (sin transición, visible) dentro de `prefers-reduced-motion: reduce`; existen `.eva-hex-grid`, `.eva-stripes`, `.eva-panel`, `.eva-panel-label`, `.eva-panel-code` y `.eva-tag`; la grilla hex usa `data:` y `pointer-events: none`; no hay `url(http`. Ver el fallo.
- [x] 6.4 GREEN: implementar en `src/index.css` el foco (D8), el `scroll-behavior` condicionado, `.eva-reveal`/`.is-visible` con su variante reducida, y las texturas/paneles/tags de D7 en `@layer components`, sin modificar `.reveal*`, `.tag`, `.glass` ni `.cyber-grid`. Verificar `npm run test`, `npm run lint` y `npm run build` en verde.
- [x] 6.5 Revisión visual de utilidades en `npm run dev` con una página/fragmento de prueba temporal (NO commitear): grilla hex detrás de texto sin capturar clics, franjas, panel con label/código legible, tag, `font-eva-display` + `font-stretch-condensed` + `font-black` mostrando la serif estrecha sin fuente de respaldo. Borrar el fragmento y confirmar `git status` sin restos.

## 7. Verificación integral

- [x] 7.1 Correr `npm run ci` completo en verde y comparar con la línea base de 1.1 (mismos tests previos + los nuevos).
- [ ] 7.2 Verificación manual en navegador sobre `npm run build && npm run preview` (y luego sobre el deploy de preview de Vercel, que aplica la CSP real): home y `/configurador` se ven igual que antes (familias, pesos, colores; foco verde visible al tabular); en DevTools > Network no hay peticiones a `fonts.googleapis.com`/`fonts.gstatic.com` y solo se descargan `.woff2` latin; consola sin violaciones de CSP ni advertencia de precarga no usada; con "Emulate prefers-reduced-motion: reduce" los anclas saltan sin animación; envío de lead del configurador funciona sin bloqueos de CSP. Dejar constancia del resultado en el resumen del apply.
