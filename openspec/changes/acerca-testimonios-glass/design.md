# Design

## Context

Ver `proposal.md` (Why). Estado actual y restricciones relevantes:

- `src/components/About.jsx`: encabezado `01.` con `text-accent-green text-glow-cyan` + `font-display` (Orbitron) + divisor degradé; grilla `reveal reveal-bottom` (clases legacy) con la biografía (`text-gray-400`, resaltados `text-white`/`text-accent-green`, idiomas `text-accent-pink text-glow-magenta`) y 4 cards `rounded-lg bg-dark-card/50` con `hover:-translate-y-1 hover:box-glow-cyan`. Íconos `lucide-react` sin `aria-hidden` explícito. Sin `aria-labelledby` en la sección.
- `src/components/Testimonials.jsx`: `GlitchText` en el `h2` (línea 28), `cyber-grid` de fondo, `figure` con `rounded-lg … hover:box-glow-cyan`, estrellas `text-amber-400`/`text-gray-500` en un `role="img"` con `aria-label`, avatar `rounded-full`. `hasValidRating` e `inicialesDe` viven dentro del JSX (no testeables desde `node --test`). `if (testimonios.length === 0) return null` va **después** de `useReveal()` (orden de hooks correcto: se mantiene).
- `src/data/testimonios.js` exporta `[]` → hoy la sección **no se renderiza**. `scripts/verify-testimonials.mjs` (parte de `npm run ci`) valida forma, 3–6 elementos, nombres únicos y `isValidRating` propio.
- Base `tokens-fuentes-texturas-eva` (aplicado): `EVA_COLORS` (`src/styles/eva-tokens.js`), `--eva-*` en `:root`, `.eva-hex-grid` (pseudo-elemento `::before` con `z-index: -1` + `isolation: isolate` en el contenedor; color `var(--eva-hex-color, rgb(255 122 26 / 0.12))`), `.eva-panel`, `.eva-panel-label` (naranja opaco), `.eva-panel-code` (fondo panel opaco), `.eva-tag`, `.eva-stripes`, `.eva-reveal`/`.is-visible` con su bloque `prefers-reduced-motion`, `font-eva-display`, `.font-stretch-condensed`, `scripts/lib/contrast.mjs` (`contrastRatio`, `checkContrastPairs`).
- `navbar-brutalista-glass` (en curso en el mismo árbol): ya agregó `blendOver(fgHex, bgHex, alpha)` a `scripts/lib/contrast.mjs` (composición sRGB por canal, redondeo, devuelve hex en minúscula) y `src/utils/siteNav.js` (`NAV_LINKS` con `quien-soy` → código `'02'`, `navCode('02') === '//02'`); define `.eva-nav-glass` (`rgb(5 5 5 / 0.85)`, `blur(10px)`) con su `@supports not` opaco y suma `NAV_COMPONENTS` a `scripts/a11y-classes.test.mjs`. Su test de cristal lee el valor real del CSS: se reutiliza ese patrón.
- CSP `style-src 'self'` sin `unsafe-inline`: nada de `<style>` inyectado; la prop `style` de React y el CSSOM sí están permitidos.
- Tests: solo `node --test "scripts/**/*.test.mjs"` sin DOM; guards estáticos por tokens de clase como `a11y-classes.test.mjs`.

Gobernanza: LOW (estilos, lógica pura de presentación); MEDIUM para el material compartido `.eva-glass` y la edición del bloque `@supports` que comparte con la barra (decisión D2 expuesta).

## Goals / Non-Goals

**Goals:**
- Un único material de cristal para paneles estáticos, con su contraste verificado contra el CSS real (no contra un valor copiado en el test).
- Quién soy y Testimonios construidos solo con tokens/utilidades eva; cero hex en JSX; cero `GlitchText` en Testimonios.
- Lógica de testimonios testeable y compartida con `verify-testimonials`.

**Non-Goals:**
- Unificar `.eva-nav-glass` con `.eva-glass` (materiales con requisitos distintos, ver D2).
- Borrar `GlitchText.jsx`, `.glass`, `.cyber-grid`, `.reveal*` legacy ni tokens `accent-*` del CSS/config (`limpieza-cyberpunk`).
- Cargar testimonios reales o cambiar el contrato de `testimonios.js`.

## Decisions

### D1. Material `.eva-glass` (en `src/index.css`, `@layer components`)

```css
.eva-glass {
  position: relative;
  background-color: rgb(16 14 12 / 0.8);                                   /* eva-panel al 80% */
  background-image: linear-gradient(135deg, rgb(237 230 214 / 0.04), transparent 45%); /* brillo de vidrio: eva-paper 4% */
  border: 1px solid rgb(255 122 26 / 0.35);                                /* borde fino naranja, decorativo */
  box-shadow: inset 0 1px 0 rgb(237 230 214 / 0.06);                       /* filo superior */
  backdrop-filter: blur(8px);
}
```

- **Tinte = `eva-panel` y no `eva-black`**: sobre la grilla casi negra, un tinte de panel apenas más cálido separa el panel del fondo sin depender de un borde; mantiene el mismo color que el respaldo opaco (D3), así el panel se ve igual con y sin soporte salvo por la grilla desenfocada.
- **Peor caso** (lo que lee el test, D5). El fondo de la sección es `eva-black` y lo único más claro que puede quedar detrás es la línea de la grilla: `blendOver(orange, black, 0.12) = #231308`. El desenfoque promedia la grilla con el negro, así que el color sin desenfocar es una cota superior (peor caso honesto incluso en el respaldo de transición). Se agrega un **caso de estrés**: naranja sólido detrás (si alguien sube `--eva-hex-color`, o una `.eva-stripes` termina detrás de un panel). Con el brillo superficial (`paper` 4%) encima del tinte, valores (truncados):

  | Texto | Realista (línea hex) | Estrés (naranja sólido) | Umbral |
  |---|---|---|---|
  | paper | 14.16 | 10.29 | 4.5 |
  | gray | 6.46 | 4.69 | 4.5 |
  | orange | 6.75 | 4.90 | 4.5 |
  | green | 13.23 | 9.62 | 4.5 |
  | gray-dim (estrellas vacías, borde avatar; gráfico) | 3.05 | — | 3 |

  Con alpha **0.70** el gris de estrés cae a 3.85 y el naranja a 4.02 (fallan); con brillo **0.06** a alpha 0.8 el gris de estrés cae a 4.45: el test triangula con esos dos valores para que nadie "aclare el vidrio" sin que falle. `gray-dim` solo se exige en el caso realista (es gráfico, no texto; en el estrés el rating sigue anunciado por `aria-label`).
- **Desenfoque 8px** (≤ 12px de la spec; menor que los 10px de la barra porque el fondo es una textura fina y no contenido). Sin `transition`, `transform` ni `animation` en la regla (spec "Cristal solo en paneles estáticos").
- **Etiquetas sobre el borde**: `.eva-panel-label` (naranja opaco, `black` sobre `orange` 7.81) y `.eva-panel-code` (fondo panel opaco) se usan tal cual: son opacas, el cristal no les afecta el contraste.
- Alternativas descartadas: `bg-eva-panel/80 backdrop-blur-sm` en JSX (no permite el `@supports not` en Tailwind 3 sin plugin, y el test tendría que leer clases); tinte con `eva-paper` al 6–10% (el "cristal claro" clásico): sobre negro baja el contraste del gris/naranja y en el estrés falla.

### D2. Convivencia con `.eva-nav-glass`: dos materiales, un solo bloque de respaldo

- `.eva-nav-glass` cubre contenido **arbitrario** que se desplaza debajo (peor caso blanco → `black` al 85%). `.eva-glass` cubre una textura **controlada** y estática (peor caso línea hex / estrés naranja → `panel` al 80%). Unificarlos obligaría a usar el más opaco en ambos (paneles casi sin cristal) o a variables CSS que rompen el test de la barra (lee un `rgb()` literal en `.eva-nav-glass`). Se mantienen dos reglas.
- **Sin duplicar el respaldo**: el `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` es uno solo para ambos materiales. Si al aplicar ya existe el bloque de la barra, se agrega dentro `.eva-glass { background-color: var(--eva-panel); background-image: none; }`; si no existe, se crea con esa condición exacta y la barra suma su regla al aplicarse. Es la única edición sobre CSS "de la barra" y no altera la regla `.eva-nav-glass` (su guard sigue en verde).
- Se deja anotado para `limpieza-cyberpunk`: borrar la utilidad legacy `.glass` (Tailwind `backdrop-blur-md`), que ya no usará ninguna sección.

### D3. Respaldo opaco

- `background-color: var(--eva-panel)` y `background-image: none` (el brillo del 4% solo tiene sentido como vidrio). Mismo borde y padding: no hay salto de layout.
- `autoprefixer` emite `-webkit-backdrop-filter` (Safari); la condición del `@supports` contempla ambos.
- Verificación: guard estático (D5) + Playwright simulando el respaldo por CSSOM (`el.style.backdropFilter = 'none'` y `backgroundColor = var(--eva-panel)`), permitido por la CSP; no se puede "apagar" `@supports` en un navegador real de Playwright.

### D4. Componentes

**Encabezados de sección** (mismo patrón en ambas, alineado con la barra): `<h2 id="…-titulo">` en `font-eva-display font-stretch-condensed font-black uppercase text-eva-paper`, precedido por un `<span aria-hidden="true">` mono `text-eva-orange` con el código, y divisor `.eva-stripes h-1` decorativo (`aria-hidden`). `<section … aria-labelledby="…-titulo">`.
- Quién soy: código `//02` = `navCode(NAV_LINKS['quien-soy'].code)` (literal en el JSX; un guard compara con `NAV_LINKS` si `src/utils/siteNav.js` existe). El encabezado `01.` actual desaparece.
- Testimonios no tiene enlace en la barra: código `//RX` (recepción), coherente con la metáfora de mensajes entrantes y sin pisar la numeración 01–05 de la barra.
- Nota: `proyectos-scroll-horizontal` (design D7) propone "02 // PROYECTOS", que choca con `//03` de la barra; se reporta al orquestador, no se toca desde acá.

**Quién soy** (`About.jsx`): `<section id="quien-soy" class="eva-hex-grid relative border-t border-eva-line bg-eva-black py-24">`.
- Biografía: `<article class="eva-glass p-6 pt-8">` con `.eva-panel-label` "EXPEDIENTE // FC" y `.eva-panel-code` "REV.26", ambos `aria-hidden`. Párrafos `text-eva-gray`, resaltados `text-eva-paper` (formación) y `text-eva-orange` (lista de tecnologías). Idiomas: `font-mono text-sm uppercase tracking-widest text-eva-green` (fósforo; sin brillo).
- Puntos fuertes: `<ul role="list">` de 4 `<li class="eva-glass p-5 pt-7">` con `.eva-panel-label` `CAP-01…04` (`aria-hidden`), ícono `text-eva-orange` con `aria-hidden="true"`, `h3` `font-eva-display font-stretch-condensed uppercase text-eva-paper` y texto `text-eva-gray`. `role="list"` porque Safari quita la semántica a `ul` con `list-style: none`.
- Los códigos `CAP-0n` se derivan del índice en el render (`String(i + 1).padStart(2, '0')`); no justifican un módulo propio.
- **Sin hover**: los paneles son información estática, no controles; el hover actual (traslación + brillo) sugería interactividad inexistente.

**Testimonios** (`Testimonials.jsx`): `<section id="testimonios" class="eva-hex-grid relative border-t border-eva-line bg-eva-black py-24" aria-labelledby="testimonios-titulo">`; sin `cyber-grid`, sin `overflow-hidden` (la grilla ya queda contenida por `isolation` + `inset: 0`).
- Intro "Lo que dicen quienes ya trabajaron conmigo." en `text-eva-gray`.
- Cards `<figure class="eva-glass flex flex-col p-5 pt-8">`:
  - `.eva-panel-label` con `messageCode(i)` (`MSG-001`) y `.eva-panel-code` "ENTRANTE", ambos `aria-hidden`.
  - Calificación (si `hasValidRating`): `role="img"` + `aria-label={ratingLabel(r)}`; estrellas llenas `text-eva-orange` (`fill="currentColor"`), vacías `text-eva-gray-dim` (≥ 3:1, gráfico), todas `aria-hidden`.
  - `<blockquote>` con `<p class="text-sm leading-relaxed text-eva-paper">`, precedido por `<span aria-hidden="true" class="font-mono text-eva-green">&gt; </span>` y seguido por el cursor `<span aria-hidden="true" class="eva-cursor">▌</span>` (`text-eva-green`).
  - `figcaption` con avatar cuadrado (sin `rounded-full`) `border border-eva-gray-dim text-eva-orange font-mono` `aria-hidden`, nombre `font-eva-display font-stretch-condensed uppercase text-eva-paper` (truncado) y rol `font-mono text-xs uppercase tracking-widest text-eva-gray`.
- Se elimina el `import GlitchText` y su uso. `if (testimonios.length === 0) return null` se conserva en el mismo lugar.

**Cursor** (`src/index.css`): `.eva-cursor { display: inline-block; }` y, solo con `@media (prefers-reduced-motion: no-preference)`, `animation: eva-cursor-blink 1s steps(1, end) 3` con `@keyframes eva-cursor-blink { 50% { opacity: 0 } }`. 3 iteraciones = 3 s (< 5 s, WCAG 2.2.2) y queda visible al terminar. Sin la media query no hay animación (con `reduce` el cursor es fijo).

### D5. Revelado sin romper el cristal

- `backdrop-filter` lee el fondo hasta el *Backdrop Root* más cercano; un ancestro con `opacity < 1`, `filter`, `mask` o `will-change` de esos corta el fondo (el cristal dejaría de ver la grilla). Por eso `.eva-reveal` va **en cada panel** (`article`, cada `li`, cada `figure`), nunca en su contenedor: la opacidad animada es del propio panel, que sí lee el fondo.
- Un solo `useReveal()` por sección sobre el contenedor (que no recibe clases de opacidad); su `visible` agrega `is-visible` a cada panel. Escalonado con `transition-delay` por índice vía `style={{ transitionDelay: \`${i * 80}ms\` }}` (CSSOM, permitido por la CSP); con `reduce`, el bloque existente de `.eva-reveal` anula la transición, así que el delay no tiene efecto.
- Se dejan de usar las clases legacy `reveal reveal-bottom`/`visible` en estas dos secciones.

### D6. Lógica pura `src/utils/testimonios.js`

```js
export function hasValidRating(rating)   // Number.isInteger(rating) && 1 <= rating <= 5
export function inicialesDe(nombre)      // primeras letras en mayúscula de las 2 primeras palabras; tolera espacios extra; '' si no hay palabras
export function messageCode(index)       // 'MSG-' + String(index + 1).padStart(3, '0')
export function ratingLabel(rating)      // `Calificación: ${rating} de 5`
```

- `Testimonials.jsx` las importa (mismo comportamiento que hoy). `scripts/verify-testimonials.mjs` reemplaza su `isValidRating` local por `hasValidRating` (una sola regla, spec "Contrato de datos"); el resto del script no cambia.
- Nombres en inglés como `motion.js`, salvo `inicialesDe` (se conserva el nombre actual para no mezclar un renombre con el rediseño).

### D7. Tests (Strict TDD, `node --test`)

- `scripts/lib/css-rules.mjs` (helper de tests, sin I/O): `ruleBody(css, selector)` devuelve el cuerpo del **primer** bloque cuyo selector es exactamente `selector` (fuera o dentro de `@supports`/`@media` según un parámetro `{ within }`), y `parseRgbAlpha(text, property)` devuelve `{ hex, alpha }` del primer `property: rgb(r g b / a)`. **Crear solo si no existe**; si `stack-neumorfico-oscuro` ya lo creó, reutilizarlo sin cambiar su contrato (mismo contrato en ambos designs). Tests propios con CSS de ejemplo (positivo, selector ausente, bloque anidado).
- `scripts/testimonios.test.mjs`: D6 con triangulación (`hasValidRating` 1/5 → `true`; 0/6/3.5/'4'/`undefined` → `false`; `inicialesDe('Ana María Pérez') === 'AM'`, `'  laura   gómez '` → `'LG'`, `'Cher'` → `'C'`, `''` → `''`; `messageCode(0) === 'MSG-001'`, `messageCode(11) === 'MSG-012'`; `ratingLabel(4)`).
- `scripts/eva-glass.test.mjs`: lee `src/index.css`; extrae tinte y alpha de `.eva-glass` (`rgb` = `EVA_COLORS.panel`), alpha del brillo (`rgb` = `EVA_COLORS.paper`) y el alpha por defecto de `--eva-hex-color` en `.eva-hex-grid::before` (`rgb` = `EVA_COLORS.orange`); calcula realista y estrés con `blendOver` y verifica la tabla de D1 con `contrastRatio`, con mensaje que nombra par, fondo y valor. Triangulación: con alpha 0.70 o brillo 0.06 la función de evaluación devuelve errores (se testea la función pura `evaluateGlass({ alpha, sheen, hexAlpha })`, no editando el CSS). Guard del material: `blur(Npx)` con N ≤ 12; la regla no contiene `transition`, `transform` ni `animation`; existe `@supports not (…backdrop-filter…)` con `.eva-glass { background-color: var(--eva-panel) … }`.
- `scripts/acerca-testimonios-classes.test.mjs` (mismo detector por tokens que `a11y-classes.test.mjs`): sobre `About.jsx` y `Testimonials.jsx` prohíbe `accent-*`, `neon-*`, `dark-*`, `*-glow-*`, `glitch`, `cyber-grid`, `rounded*`, `font-display` (Orbitron; no confunde con `font-eva-display`), `text-white`, `text-gray-*`, `text-amber-*`, hex literales, `reveal`/`reveal-bottom` legacy y `hover:*translate*`; prohíbe `import GlitchText` en `Testimonials.jsx`. Exige `eva-glass`, `eva-hex-grid`, `eva-panel-label`, `eva-reveal`, `aria-labelledby`, `id="quien-soy"`/`id="testimonios"`, `aria-hidden` en los códigos, `role="list"` en About, `testimonios.length === 0` seguido de `return null` en Testimonials y que el código `//02` coincida con `navCode` de `NAV_LINKS` (si `siteNav.js` existe). En `src/index.css`: `eva-cursor-blink` solo dentro de `prefers-reduced-motion: no-preference` y con iteraciones ≤ 5.
- `scripts/a11y-classes.test.mjs`: sumar `About.jsx` y `Testimonials.jsx` a los archivos inspeccionados (constante `SECTION_COMPONENTS`; crearla si no existe, extenderla si `stack-neumorfico-oscuro` ya la creó). Hoy `Testimonials.jsx` usa `text-gray-500` → el guard la detecta (RED natural antes del rediseño).
- Comportamiento en navegador (revelado, cursor, respaldo, foco, CSP) → Playwright manual (no hay DOM en el runner).

## Risks / Trade-offs

- [Con el array vacío no hay sección que ver en Playwright] → la verificación carga 3 testimonios de prueba **solo en el árbol local** (sin commit) y los revierte con `git checkout -- src/data/testimonios.js` al terminar; `npm run verify:testimonials` se corre con ambos estados.
- [11 elementos con `backdrop-filter` (1 + 4 + hasta 6) pueden costar en GPUs modestas] → son estáticos y chicos, blur 8px; Playwright con trazado de rendimiento a 375px. Si el scroll baja de ~50 fps, plan B sin cambiar la spec: `backdrop-filter` solo desde `md` (`@media (min-width: 768px)`), con el mismo tinte (sigue siendo legible: el test cubre el caso sin desenfoque).
- [Sobre una grilla casi negra el vidrio se percibe poco] → el brillo superficial, el filo superior y el borde naranja fino dan la lectura de "vidrio"; subir la luminosidad del tinte está bloqueado a propósito por el test de estrés.
- [Edición concurrente de `src/index.css` y `scripts/a11y-classes.test.mjs` con `navbar-brutalista-glass` y `stack-neumorfico-oscuro`] → cambios acotados a bloques nuevos (`.eva-glass`, `.eva-cursor`, una regla dentro del `@supports not` compartido, una constante de lista); antes de editar, releer el archivo y no reformatear lo ajeno.
- [`blendOver` ausente si la barra no se aplicó] → la tarea 1.1 lo detecta; se agrega con el contrato de `navbar-brutalista-glass` (D6 de su design) y su test.
- [Safari < 15.4 sin `@supports` con `or` anidado] → sintaxis soportada desde Safari 9; el respaldo se verifica en el CSS del build.

## Migration Plan

1. Aplicar sobre `rediseno-evangelion` después de `tokens-fuentes-texturas-eva` (y preferentemente después de `navbar-brutalista-glass`, por `blendOver` y el bloque `@supports`).
2. `npm run ci` en verde; Playwright manual (tarea final).
3. Rollback: revertir el commit (sin datos ni CSP afectados; `testimonios.js` no cambia).
