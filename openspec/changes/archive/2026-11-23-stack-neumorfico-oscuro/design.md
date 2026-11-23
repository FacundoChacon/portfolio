# Design

## Context

Ver `proposal.md` (Why). Estado actual y restricciones relevantes:

- `src/components/Stack.jsx` (69 líneas): array `stack` inline con `{ name, color, glyph, category }` (12 ítems); encabezado `03.` con `text-accent-green text-glow-cyan` y `font-display` (Orbitron), aunque la barra le asigna el código `04` (`src/utils/siteNav.js`); intro "Las tecnologías que uso con frecuencia. Tocá o pasá el cursor para verlas cobrar vida."; grilla `reveal reveal-right` (legacy) `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`; cada ítem es un `div` con `style={{ "--tech": tech.color }}`, `tabIndex={0}`, `rounded-lg`, y hover/`focus-within`/`active` con traslación, borde y `box-shadow` en `var(--tech)`; nombre con `truncate` (a 2 columnas en 375px "HTML5 / CSS3" y "Tailwind CSS" se recortan).
- El `div` enfocable no tiene rol ni nombre propio: Tab se detiene 12 veces sin acción posible (anti-patrón; WCAG 2.4.3/4.1.2 en espíritu).
- Base `tokens-fuentes-texturas-eva` (aplicado): `EVA_COLORS`, `--eva-*`, `.eva-panel-label`, `.eva-panel-code`, `.eva-stripes`, `.eva-reveal` (con `transition: opacity, transform` y su bloque `reduce`), `font-eva-display`, `.font-stretch-condensed`, `scripts/lib/contrast.mjs`. Pares declarados relevantes: `gray-dim` sobre `panel`/`black` es nivel `ui` (≥ 3), "bordes de componentes de UI, nunca texto".
- `navbar-brutalista-glass` (en curso): `blendOver` en `scripts/lib/contrast.mjs`, `NAV_LINKS` con `stack` → `'04'`, `NAV_COMPONENTS` en `scripts/a11y-classes.test.mjs`. `acerca-testimonios-glass` (propuesto en paralelo) crea `scripts/lib/css-rules.mjs` y `SECTION_COMPONENTS` con el mismo contrato que se usa acá.
- CSP `style-src 'self'`: la prop `style` de React (CSSOM) está permitida; no se inyecta `<style>`.
- Tests: `node --test "scripts/**/*.test.mjs"` sin DOM.

Gobernanza: LOW (estilos, datos, lógica de presentación). MEDIUM solo por la decisión de interactividad (D4), expuesta abajo.

## Goals / Non-Goals

**Goals:**
- Neumorfismo oscuro legible: bordes ≥ 3:1 en reposo y hundido, verificado contra el CSS real.
- Una sola paleta para los 12 módulos; diferenciación sin color.
- Semántica honesta: lista estática, sin foco falso.

**Non-Goals:**
- Hacer los módulos interactivos (enlaces a proyectos, detalle por tecnología).
- Íconos SVG de marca por tecnología (agregarían 12 assets y licencias de marca; el monograma ya cumple).
- Reutilizar el material neumórfico en otras secciones (Contacto va brutalista por contraste en formularios).

## Decisions

### D1. Datos en `src/data/stack.js`

```js
export const STACK = [
  { name: 'Java 17', glyph: 'Jv', category: 'Lenguaje' },
  … // los 12 actuales, mismo orden, sin `color`
]
export function moduleCode(index)   // 'MOD-' + String(index + 1).padStart(2, '0')
```

Motivo: el test de datos importa la misma fuente que el componente (no se puede importar un `.jsx` desde `node --test`); mismo criterio que `src/data/proyectos.js` de `proyectos-scroll-horizontal`. `moduleCode` vive junto a los datos porque solo tiene sentido para ellos. Alternativa descartada: códigos escritos a mano en cada ítem (se desordenan al insertar una tecnología).

### D2. Diferenciación sin color de marca (decisión del usuario)

Cada módulo muestra, en todos los casos con los mismos colores:
- **Monograma** (`Jv`, `Sp`…) dentro de un "zócalo" cuadrado hundido (`bg-eva-black`, sombra interior), `font-mono font-bold text-eva-orange` (7.81:1 sobre black). Único color de acento del módulo. `aria-hidden` (repite el nombre).
- **Nombre** `font-eva-display font-stretch-condensed uppercase text-eva-paper`.
- **Categoría** `font-mono text-[11px] uppercase tracking-widest text-eva-gray` (texto: `gray`, no `gray-dim`).
- **Código** `MOD-01` en la esquina superior, `font-mono text-[10px] text-eva-gray`, `aria-hidden`.

Alternativas descartadas: color por categoría con la paleta eva (rojo y violeta solo sirven para texto grande, quedan 3 colores útiles para 7 categorías y la distinción por color exigiría leyenda — 1.4.1); agrupar por categoría con subtítulos (cambia el orden curado de los datos y suma 7 encabezados para 12 ítems).

### D3. Material neumórfico (`src/index.css`, `@layer components`)

```css
.eva-neu-surface {                       /* bandeja que contiene la lista */
  position: relative;
  background-color: var(--eva-panel);
  border: 1px solid var(--eva-line);     /* decorativo */
}
.eva-neu-module {                        /* relieve (reposo) */
  background-color: var(--eva-panel);
  border: 1px solid var(--eva-gray-dim);
  box-shadow: -4px -4px 10px rgb(237 230 214 / 0.04), 4px 4px 10px rgb(5 5 5 / 0.7);
}
@media (hover: hover) and (pointer: fine) {
  .eva-neu-module:hover {                /* hundido */
    background-color: var(--eva-black);
    border-color: var(--eva-orange);
    box-shadow: inset 4px 4px 8px rgb(5 5 5 / 0.7), inset -4px -4px 8px rgb(237 230 214 / 0.04);
  }
}
@media (prefers-reduced-motion: no-preference) {
  .eva-neu-module { transition: box-shadow 200ms ease-out, border-color 200ms ease-out, background-color 200ms ease-out; }
}
```

- El neumorfismo clásico exige que el módulo tenga **el mismo color que la superficie** (el relieve lo dan solo las sombras): superficie y módulo usan `panel`. Sobre `panel` la sombra oscura no puede ser más oscura que `black`, por eso se usa `eva-black` al 70% (y no `#000`, fuera de la paleta).
- **El borde es lo que cumple 1.4.11**, no la sombra: una sombra difusa no tiene un color definido en el límite. En reposo `gray-dim`; hundido `orange` → el estado cambia también por color de borde, no solo por sombra.
- Contraste (truncado; el test lo recalcula desde el CSS, peor caso = sombra a opacidad completa, cota superior del desenfoque):

  | Estado | Par | Valor | Umbral |
  |---|---|---|---|
  | Reposo | borde `gray-dim` vs superficie `panel` | 3.33 | 3 |
  | Reposo | borde vs fondo del módulo `panel` | 3.33 | 3 |
  | Reposo | borde vs sombra clara (`paper` 4% sobre `panel` = `#191714`) | 3.09 | 3 |
  | Reposo | borde vs sombra oscura (`black` 70% sobre `panel` = `#080807`) | 3.47 | 3 |
  | Reposo | texto `paper`/`gray`/`orange` vs `panel` | 15.49 / 7.06 / 7.38 | 4.5 |
  | Hundido | borde `orange` vs superficie `panel` | 7.38 | 3 |
  | Hundido | borde vs fondo `black` | 7.81 | 3 |
  | Hundido | borde vs sombra interior clara (`paper` 4% sobre `black` = `#0e0e0d`) | 7.40 | 3 |
  | Hundido | texto `paper`/`gray`/`orange` vs `black` y vs `#0e0e0d` | ≥ 7.08 | 4.5 |

  Triangulación: con la sombra clara al **6%** el borde en reposo cae a 2.97 (falla) → el test protege contra "más relieve". Esa es la tensión real del neumorfismo oscuro: el relieve visible se paga con contraste del borde, y el borde gana.
- Sin `transform` en ningún estado (el hundimiento es solo sombra/fondo/borde): no hay movimiento que reducir más allá de la transición, que con `reduce` no existe (cambio instantáneo).
- Alternativas descartadas: borde `gray` (#A39C8E, 7.06) en reposo (cumple de sobra pero anula el efecto blando del neumorfismo); sin borde y solo sombras (falla 1.4.11 y la consigna); clases Tailwind arbitrarias `shadow-[…]` en el JSX (el test tendría que parsear JSX y el estado por `@media (hover)` no se expresa sin plugin).

### D4. Interactividad: módulos no enfocables, hundimiento solo con puntero fino

- Los módulos **no hacen nada** al activarse: no son enlaces ni botones. Mantener `tabIndex={0}` crea 12 paradas de Tab sin acción ni rol (foco "falso"). Se quita y no se agrega `role="button"`.
- El hundimiento es **realimentación decorativa** de puntero: no revela información (todo está visible en reposo), así que no hay contenido que un usuario de teclado o táctil se pierda (2.1.1 y 1.4.13 no aplican porque no aparece nada nuevo).
- Se limita a `@media (hover: hover) and (pointer: fine)`: en táctil `:hover` queda "pegado" tras un toque y simularía una selección; tampoco se usa `:active` (un elemento que reacciona al toque sugiere que hace algo). No hay `:focus`/`:focus-within` porque nada dentro es enfocable.
- Para no sugerir clic: sin `cursor-pointer` (cursor por defecto), sin subrayados ni flechas, y la intro pasa a "Módulos en uso frecuente: lenguajes, frameworks y herramientas con los que construyo." (sin "tocá o pasá el cursor").
- Alternativas descartadas: convertir cada módulo en `<button>` que muestre un detalle (no hay contenido de detalle; inventarlo excede el alcance); hacerlos enlaces a la documentación oficial (sacan al visitante del portfolio; 12 enlaces externos más en el orden de Tab); quitar todo efecto de hover (pierde la metáfora del neumorfismo pedida para la sección).

### D5. Estructura y semántica (`Stack.jsx`)

```
<section id="stack" aria-labelledby="stack-titulo" class="relative border-t border-eva-line bg-eva-black py-24">
  header: <span aria-hidden>//04</span> <h2 id="stack-titulo">Stack</h2> + divisor .eva-stripes aria-hidden
  <p> intro (text-eva-gray)
  <div class="eva-neu-surface p-4 pt-8 sm:p-6 sm:pt-10">
    .eva-panel-label "STACK // MÓDULOS" (aria-hidden) · .eva-panel-code "12/12" (aria-hidden, de STACK.length)
    <ul role="list" ref={revealRef} class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <li class="eva-reveal [is-visible]" style={{ transitionDelay }}>          ← revelado
        <div class="eva-neu-module …">                                         ← material
          código MOD-nn (aria-hidden) · zócalo con monograma (aria-hidden) · <p>nombre</p> · <p>categoría</p>
```

- **`li` (revelado) y `div` (material) separados**: `.eva-reveal` declara `transition: opacity, transform` y `.eva-neu-module` declara `transition: box-shadow, …`; en el mismo elemento una pisaría a la otra.
- `role="list"` porque Safari quita la semántica de lista a `ul` con `list-style: none` (preflight de Tailwind).
- Layout del módulo: en `< sm` columna (código, zócalo arriba, nombre y categoría debajo, sin `truncate`, con `break-words`); desde `sm` fila (zócalo a la izquierda). Así ningún nombre se recorta a 375px (spec).
- Cascada: un `useReveal()` sobre el `ul`; cada `li` recibe `is-visible` y `transitionDelay: ${i * 50}ms` (máx. 550ms). Con `reduce`, el bloque de `.eva-reveal` anula la transición y `useReveal` revela en el primer render.
- Código de sección `//04` literal en el JSX; un test lo compara con `navCode` del `NAV_LINKS` de `stack` (si `src/utils/siteNav.js` existe). Corrige el `03.` actual, desalineado con la barra.

### D6. Tests (Strict TDD, `node --test`)

- `scripts/lib/css-rules.mjs` (helper de tests): `ruleBody(css, selector, { within })` y `parseRgbAlpha(text, property)` con el contrato de `acerca-testimonios-glass` (design D7). **Crear solo si no existe**; si ya existe, reutilizarlo sin cambiar el contrato. Para las sombras se agrega (si falta) `parseShadowColors(text)` → lista de `{ hex, alpha, inset }` de un `box-shadow` con colores `rgb(r g b / a)`; se documenta como extensión compatible.
- `scripts/stack-neumorfico.test.mjs`:
  - Datos: `STACK` tiene exactamente los 12 `{ name, glyph, category }` actuales en orden (comparación con una tabla literal en el test), ningún ítem tiene `color` ni claves fuera de esas tres, nombres únicos; `moduleCode(0) === 'MOD-01'`, `moduleCode(11) === 'MOD-12'`.
  - Contraste: función pura `evaluateNeu({ lightAlpha, darkAlpha, insetLightAlpha })` que arma la tabla de D3 con `blendOver`/`contrastRatio` y devuelve errores legibles (estado, par, valor). Casos: valores de D3 → `[]`; `lightAlpha: 0.06` → error del borde en reposo (triangulación). Test que lee `src/index.css`, extrae con `parseShadowColors` los colores/alphas reales de `.eva-neu-module` (reposo) y de `.eva-neu-module:hover` (dentro de `@media (hover: hover) and (pointer: fine)`), verifica que sean `EVA_COLORS.paper`/`black` y que `evaluateNeu` devuelva `[]`.
  - Guards de CSS: el `:hover` del módulo solo existe dentro de esa media query; el `border-color` del hundido es `var(--eva-orange)` y distinto del de reposo (`var(--eva-gray-dim)`); fondos `var(--eva-panel)` / `var(--eva-black)`; ninguna regla `.eva-neu-module:focus*` ni `:active`; ninguna `transform` en las reglas del material; la `transition` de `.eva-neu-module` solo dentro de `@media (prefers-reduced-motion: no-preference)`.
- `scripts/stack-classes.test.mjs` (detector por tokens como `a11y-classes.test.mjs`, probado con ejemplos positivos/negativos): sobre `Stack.jsx` prohíbe `--tech`, `tabIndex`, `role="button"`, `cursor-pointer`, `truncate`, `accent-*`, `neon-*`, `dark-*`, `*-glow-*`, `glitch`, `rounded*`, `font-display`, `text-white`, `text-gray-*`, hex literales, `reveal`/`reveal-right` legacy y la frase "pasá el cursor"; exige `eva-neu-surface`, `eva-neu-module`, `eva-reveal`, `role="list"`, `id="stack"`, `aria-labelledby`, `aria-hidden` en código y monograma, importación de `STACK` desde `../data/stack`, y que `//04` coincida con `NAV_LINKS` (si existe `siteNav.js`).
- `scripts/a11y-classes.test.mjs`: sumar `Stack.jsx` a `SECTION_COMPONENTS` (crearla si no existe, extenderla si `acerca-testimonios-glass` ya la creó).
- Comportamiento en navegador (hover real, táctil, Tab, lector, reduced-motion, 375px, CSP) → Playwright manual.

## Risks / Trade-offs

- [El relieve con sombra clara al 4% es sutil en pantallas con brillo bajo] → el cambio de borde gris → naranja hace evidente el estado; el test impide subir la sombra a costa del contraste del borde. Si se quiere más relieve, la palanca segura es la sombra oscura (más alpha no baja el contraste del borde: 3.47 → 3.51 al 90%).
- [Hover en un elemento no interactivo puede sugerir que es clickeable] → sin `cursor-pointer`, intro reescrita y efecto solo con puntero fino; se valida en Playwright que el cursor computado sea `auto`/`default`.
- [`hover: hover` mal reportado en algunos híbridos (laptop táctil)] → en el peor caso el módulo se hunde al apoyar el mouse; no hay acción asociada, así que no hay daño.
- [Edición concurrente de `src/index.css`, `scripts/lib/css-rules.mjs` y `scripts/a11y-classes.test.mjs` con `acerca-testimonios-glass`/`navbar-brutalista-glass`] → bloques nuevos y acotados; releer el archivo antes de editar; respetar el contrato del helper si ya existe.
- [`blendOver` ausente si la barra no se aplicó] → la tarea 1.1 lo detecta y se agrega con el contrato de `navbar-brutalista-glass` (D6 de su design).
- [El cambio del código de sección `03.` → `//04` y la frase de la intro son cambios de contenido] → alineados con la barra y con la decisión de no simular interacción; reversibles en el JSX.

## Migration Plan

1. Aplicar sobre `rediseno-evangelion` después de `tokens-fuentes-texturas-eva` (y preferentemente después de `navbar-brutalista-glass`).
2. `npm run ci` en verde; Playwright manual (tarea final).
3. Rollback: revertir el commit (sin datos de usuario, CSP ni dependencias afectadas).
