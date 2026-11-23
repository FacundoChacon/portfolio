# Tasks

## 1. Preparación y línea base

- [x] 1.1 Confirmar dependencias (design Context): `EVA_COLORS` en `src/styles/eva-tokens.js`, `--eva-panel`/`--eva-black`/`--eva-gray-dim`/`--eva-orange`/`--eva-line` en `src/index.css`, `.eva-panel-label`, `.eva-panel-code`, `.eva-stripes`, `.eva-reveal` con su bloque `prefers-reduced-motion`, `font-eva-display`, `.font-stretch-condensed`, `contrastRatio` en `scripts/lib/contrast.mjs`. Anotar si ya existen `blendOver`, `src/utils/siteNav.js`, `scripts/lib/css-rules.mjs` (y si tiene `parseShadowColors`) y `SECTION_COMPONENTS` en `scripts/a11y-classes.test.mjs`. Si falta algo de tokens, detenerse y reportar.
- [x] 1.2 Línea base: `npm test` y `npm run build` en verde; registrar N tests. Si algo falla, detenerse y reportarlo como falla preexistente (no corregirla).
- [x] 1.3 Si `blendOver` no existe: RED con los casos del design de `navbar-brutalista-glass` (D6) en `scripts/stack-neumorfico.test.mjs`; GREEN agregándolo a `scripts/lib/contrast.mjs` sin tocar los otros exports. Si existe, marcar como no aplicable.

## 2. Datos del stack (D1)

- [x] 2.1 RED: crear `scripts/stack-neumorfico.test.mjs` importando `src/data/stack.js` (inexistente): `STACK` igual a la tabla literal de los 12 `{ name, glyph, category }` actuales en orden, sin `color` ni otras claves, nombres únicos. Ejecutar `npm test` y ver el fallo por módulo inexistente.
- [x] 2.2 GREEN: crear `src/data/stack.js` con `STACK` (copiado de `Stack.jsx` sin `color`); `npm test` en verde.
- [x] 2.3 RED → GREEN: `moduleCode(0) === 'MOD-01'`, `moduleCode(9) === 'MOD-10'`, `moduleCode(11) === 'MOD-12'`. Ver fallar, implementar, JSDoc en los exports; `npm test` en verde.

## 3. Material neumórfico y su contraste (D3)

- [x] 3.1 Si `scripts/lib/css-rules.mjs` no existe: RED con CSS de ejemplo para `ruleBody(css, selector, { within })` y `parseRgbAlpha(text, property)` (contrato de `acerca-testimonios-glass` D7); GREEN creando el helper. Si `parseShadowColors` no existe: RED (`'-4px -4px 10px rgb(237 230 214 / 0.04), 4px 4px 10px rgb(5 5 5 / 0.7)'` → dos colores con su alpha e `inset: false`; con `inset` → `inset: true`) y GREEN agregándolo sin cambiar los otros exports. Marcar como no aplicable lo que ya exista.
- [x] 3.2 RED: en `scripts/stack-neumorfico.test.mjs`, función pura `evaluateNeu({ lightAlpha, darkAlpha, insetLightAlpha })` con la tabla de D3 (errores con estado, par y valor); casos `{ 0.04, 0.7, 0.04 }` → `[]` y `lightAlpha: 0.06` → error del borde en reposo contra la sombra clara. Más un test que lee `src/index.css`, extrae con `parseShadowColors` las sombras de `.eva-neu-module` y de `.eva-neu-module:hover` (dentro de `@media (hover: hover) and (pointer: fine)`), verifica que sus colores sean `EVA_COLORS.paper`/`EVA_COLORS.black` y que `evaluateNeu` con esos alphas devuelva `[]`. Ver fallar (las clases no existen).
- [x] 3.3 GREEN: agregar `.eva-neu-surface`, `.eva-neu-module`, su `:hover` dentro de `@media (hover: hover) and (pointer: fine)` y la `transition` dentro de `@media (prefers-reduced-motion: no-preference)` en `src/index.css` (`@layer components`) con los valores de D3. `npm test` en verde.
- [x] 3.4 RED → GREEN de los guards de CSS (D6): `:hover` del módulo solo en esa media query; `border-color` hundido `var(--eva-orange)` ≠ reposo `var(--eva-gray-dim)`; fondos `var(--eva-panel)`/`var(--eva-black)`; sin reglas `.eva-neu-module:focus*` ni `:active`; sin `transform` en las reglas del material; `transition` solo bajo `no-preference`. Verificar que fallan moviendo temporalmente el `:hover` fuera de la media query y que vuelven a verde al restaurarlo.

## 4. Guard estático del componente (D6)

- [x] 4.1 RED: crear `scripts/stack-classes.test.mjs` con un detector por tokens probado con fuentes de ejemplo (positivo y negativo; `font-eva-display` no cuenta como `font-display`) y las reglas de D6 sobre `src/components/Stack.jsx` (prohibidos: `--tech`, `tabIndex`, `role="button"`, `cursor-pointer`, `truncate`, tokens legacy, hex, "pasá el cursor"…; exigidos: `eva-neu-surface`, `eva-neu-module`, `eva-reveal`, `role="list"`, `id="stack"`, `aria-labelledby`, `aria-hidden`, import de `STACK`; `//04` = `navCode` de `NAV_LINKS` de `stack` si `src/utils/siteNav.js` existe). Ejecutar y ver fallar sobre el `Stack.jsx` actual.
- [x] 4.2 En `scripts/a11y-classes.test.mjs`, sumar `Stack.jsx` a `SECTION_COMPONENTS` (crear la constante e incluirla en el recorrido si no existe; extenderla si existe). `npm test`: este guard sigue en verde (hoy `Stack.jsx` no usa clases prohibidas por él).

## 5. Sección Stack (D2, D4, D5)

- [x] 5.1 GREEN: reescribir `src/components/Stack.jsx` según D5: importa `STACK` y `moduleCode`; `section#stack` con `aria-labelledby`, encabezado `//04` (`aria-hidden`) + `h2` "Stack" serif condensada + divisor `.eva-stripes` `aria-hidden`; intro nueva de D4; `.eva-neu-surface` con `.eva-panel-label` "STACK // MÓDULOS" y `.eva-panel-code` `${STACK.length}/${STACK.length}` (`aria-hidden`); `ul[role=list]` de `li.eva-reveal` con `div.eva-neu-module` (código y zócalo con monograma `aria-hidden`, nombre y categoría en `<p>`); sin `tabIndex`, sin `style` con `--tech`, sin `truncate`; layout columna `< sm` y fila desde `sm`. `npm test` (guards de 4.1 en verde) y `npm run lint` en verde.
- [x] 5.2 Cascada (D5): un `useReveal()` sobre el `ul`; `is-visible` y `transitionDelay: ${i * 50}ms` por `li` vía prop `style`. Verificar en `npm run dev` que los módulos aparecen uno tras otro y que, con el inspector, el `div.eva-neu-module` conserva su `transition` de sombra/borde/fondo (no la pisa `.eva-reveal`). `npm test` en verde.

## 6. Integración y verificación manual

- [x] 6.1 `npm run ci` completo en verde, comparado con la línea base de 1.2 (mismos tests previos + los nuevos).
- [x] 6.2 Verificar en el CSS de `dist/assets/*.css` que el `:hover` de `.eva-neu-module` sale dentro de `@media (hover:hover) and (pointer:fine)` y la `transition` dentro de `prefers-reduced-motion: no-preference`.
- [x] 6.3 Verificación manual con Playwright sobre `npm run build && npx vite preview`: (a) escritorio 1440×900 y móvil 375×812, capturas de la sección en reposo y con un módulo bajo el puntero; (b) a 375px ningún nombre recortado (`el.scrollWidth <= el.clientWidth` en cada nombre) y `document.documentElement.scrollWidth <= innerWidth`; (c) hover sobre "React 18" → `getComputedStyle(modulo).borderColor` = naranja y `boxShadow` con `inset`; los demás en gris; al salir vuelve al relieve; `cursor` computado `auto`/`default`; (d) Tab desde la intro de Stack salta directo al siguiente control fuera de la sección (ningún `li`/`div` de la sección enfocado); (e) árbol de accesibilidad (`browser_snapshot`): `h2` "Stack", lista de 12 elementos con nombre y categoría, sin monogramas ni `MOD-nn`; (f) contexto móvil con `hasTouch` + `isMobile`: tocar un módulo no cambia `borderColor` ni enfoca nada; (g) `emulateMedia({ reducedMotion: 'reduce' })` y recarga → módulos visibles en el primer render y `transitionDuration` computada `0s` en el módulo; (h) consola sin errores ni violaciones de CSP.
