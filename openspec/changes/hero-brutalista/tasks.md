# Tasks

> Strict TDD: cada tarea de código empieza con el test en rojo (`node --test "scripts/**/*.test.mjs"`), luego el mínimo para verde, triangulación y refactor. Gobernanza LOW salvo grupo 4 y 7 (MEDIUM: precarga y LCP, exponer resultados antes de cerrar).

## 1. Precondiciones y línea base

- [ ] 1.1 Verificar que existen `eva-*`, `font-eva-display`, `.font-stretch-extra-condensed`, `.eva-hex-grid`, `.eva-stripes`, `.eva-panel(-label|-code)`, `blendOver` en `scripts/lib/contrast.mjs`, `--eva-nav-h`, y que `src/pages/Configurador.jsx` monta `NavBrand` (`font-eva-display`); `npm test` verde como red de seguridad (anotar N tests). Si falta algo de `navbar-brutalista-glass`, detenerse y reportar.
- [ ] 1.2 Medir la línea base de LCP/CLS con el hero actual según design D6 (`npm run build && npm run preview`, Playwright, 5 corridas por viewport 1440×900 y 375×812, CPU 4x + red lenta vía CDP) y anotar acá las medianas y el elemento LCP de cada viewport.

## 2. Helper de guards estáticos

- [ ] 2.1 Si no existe `scripts/lib/class-guard.mjs` (lo crea el primero de `hero-brutalista`/`contacto-brutalista`): escribir `scripts/class-guard.test.mjs` en rojo y luego `findForbiddenTokens(source, rules)` puro → `[{ rule, match }]`; triangular: detección con variantes (`hover:`, `md:`), sin falso positivo de `font-display` dentro de `font-eva-display` ni de `animate-*` con `motion-safe:`. Si ya existe, solo verificar que sus tests pasan. Verificación: `node --test scripts/class-guard.test.mjs` verde.

## 3. Datos del hero

- [ ] 3.1 Escribir en `scripts/hero.test.mjs` los tests de datos (design D1/D10) en rojo: `nombreCompleto` (caso real + triangulación con otros nombres y espacios), `FICHA` (ids y orden, estado con `tono: 'ok'` y texto), `ENLACES_PERFIL` (`https://`, ids únicos), `externalLinkProps()` exacto y `RETRATO.width/height` = cabecera VP8 de `public/profile.webp` (900×1600).
- [ ] 3.2 Crear `src/data/presentacion.js` (`PERFIL`, `FICHA`, `ENLACES_PERFIL`, `RETRATO`, `nombreCompleto`, `externalLinkProps`) hasta que 3.1 pase. Verificación: `node --test scripts/hero.test.mjs` verde.

## 4. Precarga de la fuente del título (MEDIUM)

- [ ] 4.1 En `scripts/font-preload.test.mjs`: cambiar la expectativa de `PRELOAD_FONT_STEMS` a `['noto-serif-display-latin-wdth-normal']` y agregar tests de `missingFontStems(css, stems)` (presente → `[]`, ausente → `[stem]`, `latin-ext` no cuenta) y de coherencia con `src/styles/fonts.css`; verlos fallar.
- [ ] 4.2 Implementar `missingFontStems` y cambiar `PRELOAD_FONT_STEMS` en `scripts/lib/font-preload.mjs` (actualizar el comentario de cabecera con la justificación de design D5). Verificación: `node --test scripts/font-preload.test.mjs` verde.
- [ ] 4.3 Agregar el guard "fuente precargada usada en cada ruta" (Hero y `NavBrand` usan `font-eva-display`; `Configurador.jsx` importa y monta `NavBrand`); triangular quitando `NavBrand` de una copia en memoria del fuente → el guard falla. Verificación: test verde con los archivos reales.
- [ ] 4.4 `npm run build && npm run verify:build`: verde y el HTML de `/` y `/configurador/` contiene `rel="preload"` a `/assets/noto-serif-display-latin-wdth-normal-<hash>.woff2` y ninguno a Rajdhani.

## 5. Animación de entrada

- [ ] 5.1 Test en rojo en `scripts/hero.test.mjs`: `tailwind.config.js` define `animation['eva-boot']` con `evaBoot`, duración ≤ 0.4s, y el keyframe solo usa `clip-path` (sin propiedades de layout).
- [ ] 5.2 Agregar `keyframes.evaBoot` y `animation['eva-boot']` en `tailwind.config.js` (aditivo, sin tocar las entradas existentes) hasta verde; `sistema-visual.test.mjs` sigue verde.

## 6. Rediseño del componente

- [ ] 6.1 Escribir en `scripts/hero.test.mjs` el guard de `src/components/Hero.jsx` (lista de prohibidos y requeridos de design D10, usando `findForbiddenTokens`) y el chequeo de un solo `<h1` en los componentes de `Home.jsx`; verlo fallar contra el Hero actual (debe nombrar `accent-`, `glow`, `flicker`, `blur-`, `order-`, falta de `fetchpriority`, etc.).
- [ ] 6.2 Escribir el test de contraste (design D9): `HERO_CONTRAST_PAIRS` con `checkContrastPairs` → `[]`; texto sobre la grilla con el alpha leído de `--eva-hex-color` en `src/index.css` vía `blendOver` ≥ 4.5; triangulación con alpha 0.6 → `gray` falla. Verificación: verde (no depende del JSX).
- [ ] 6.3 Reescribir `Hero.jsx` según design D2–D4 y D7–D8: grilla 12 columnas con orden DOM = visual, `h1` en dos `span` `block whitespace-nowrap` con `font-eva-display font-stretch-extra-condensed font-black uppercase leading-[0.86]` y tamaños de D4, retrato con `RETRATO` + `fetchpriority="high"` + `decoding="async"` + `aspect-[4/5]`, marco duro con label/código `aria-hidden`, franjas `aria-hidden`, ficha `<dl>` desde `FICHA`, acciones como bloques duros (texto visible + `sr-only` de pestaña nueva vía `externalLinkProps`), animaciones solo `motion-safe:` fuera del `img`/`h1`. Verificación: 6.1 verde.
- [ ] 6.4 Sumar `src/components/Hero.jsx` a los archivos de `scripts/a11y-classes.test.mjs` (sin quitar los que agregaron otros changes). Verificación: test verde.
- [ ] 6.5 `npm run ci` completo verde (lint, tests, build, verify:build). Refactor final con tests verdes tras cada paso.

## 7. Verificación manual con Playwright (integración, MEDIUM)

- [ ] 7.1 Escritorio 1440×900 y móvil 375×812 sobre `npm run preview`: composición asimétrica en escritorio, apilado en móvil en orden DOM, sin scroll horizontal (`scrollWidth === innerWidth`), ficha y franjas visibles, sin efectos cyberpunk; capturas de ambos anchos.
- [ ] 7.2 Teclado: Tab desde el salto al contenido recorre "Ver proyectos", GitHub y LinkedIn con anillo verde visible y no tapado por la barra; Enter en "Ver proyectos" lleva a `#proyectos`; los externos abren pestaña nueva. Lector (árbol de accesibilidad de Playwright): un solo `h1` "Facundo Chacón", sin códigos ni franjas expuestos, nombres "GitHub (se abre en una pestaña nueva)" y "LinkedIn (…)".
- [ ] 7.3 `prefers-reduced-motion: reduce` (`browser_emulate_media`): sin animación de entrada ni traslación en hover; todo visible desde el primer frame. Sin `reduce`: la entrada termina en < 1 s y el `img`/`h1` no se animan.
- [ ] 7.4 Repetir la medición de design D6 y comparar con 1.2: mediana de LCP ≤ base × 1.10 en cada viewport, CLS ≤ 0.1, elemento LCP en 1440 = `profile.webp`; corrida con el `.woff2` de Noto bloqueado a 375 y 768: sin scroll horizontal y mismo alto del `h1`. Si el LCP empeora más del margen, aplicar el plan B de D5 y re-medir. Anotar resultados acá.
- [ ] 7.5 Consola en `/` y `/configurador/` (preview y, si está disponible, preview de Vercel con la CSP de producción): sin violaciones de CSP, sin "preloaded but not used", sin advertencias de React por `fetchpriority`.
