# Proposal: colores-de-marca-hover

## Why

Las secciones Stack y Contacto se ven correctas pero planas: todas las tecnologías y todos los canales comparten exactamente los mismos colores, así que nada "responde" al pasar el puntero más allá del borde naranja genérico. Queremos que cada tecnología y cada canal se **encienda en su color de marca** al interactuar (y que en pantallas táctiles, donde no hay hover, se vean siempre en color), sin romper la estética Eva ni el contraste AA que hoy está verificado automáticamente.

## What Changes

- **Colores de marca como datos**: un mapa central `EVA_BRAND_COLORS` en `src/styles/eva-tokens.js` (fuera de `EVA_COLORS` y de la jerarquía de roles, sin generar clases de Tailwind). Cada ítem de `src/data/stack.js` y cada canal de `src/data/contacto.js` declara una clave `brand` que apunta a ese mapa.
- **CSS genérico con `--brand`**: Tailwind emite en la capa base una regla `[data-brand="<clave>"] { --brand: <hex> }` por marca. Los componentes solo ponen `data-brand={...}`; el CSS de estados usa `var(--brand)`. Sin estilos inline, sin hex en componentes y sin colores arbitrarios de Tailwind.
- **Stack**: en reposo y con puntero fino sigue neutral (como hoy). Al pasar el puntero el módulo se hunde y su borde y su monograma toman el color de marca (reemplaza el borde naranja). En dispositivos táctiles (`(hover: none), (pointer: coarse)`) el borde y el monograma se ven siempre en color de marca, en relieve.
- **Contacto**: Email en rojo, GitHub en verde y LinkedIn en celeste. Neutral en reposo con puntero fino; en hover **y** en `:focus-visible` el borde, la sombra sólida, el ícono y el indicador invertido toman el color de marca (reemplaza el naranja secundario). En táctil, borde e ícono siempre en color. Se conserva el anillo de foco verde agua del sistema.
- **Contraste verificado**: test que recorre todos los colores de marca y exige ≥ 4.5:1 contra negro y panel (texto) y ≥ 3:1 contra las sombras del neumorfismo (bordes), más texto negro ≥ 4.5:1 sobre cada color (indicador invertido). Los colores oficiales que no cumplen se reemplazan por variantes más claras (MySQL, LinkedIn, CSS3).
- **Movimiento**: la transición de color solo existe con `prefers-reduced-motion: no-preference`; con movimiento reducido el cambio es instantáneo.
- **BREAKING (spec)**: se retira el requisito "Paleta unificada sin colores de marca" de `seccion-de-stack`, que hoy prohíbe explícitamente lo que este change introduce.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `seccion-de-stack`: se retira "Paleta unificada sin colores de marca"; se agregan "Color de marca por tecnología" y "Color de marca permanente en pantallas táctiles"; se modifican "Módulo hundido al pasar el puntero", "Contraste de los módulos en todos sus estados" y "Movimiento de la sección Stack".
- `seccion-de-contacto`: se agrega "Color de marca por canal"; se modifican "Estados visibles de los canales", "Contraste de la sección" y "Movimiento de la sección según preferencia".
- `sistema-visual`: se agrega "Colores de marca fuera de la jerarquía" (mapa central, contraste verificado, uso solo vía `--brand`, sin contar en la jerarquía de roles).

## Impact

- **Código**: `src/styles/eva-tokens.js` (mapa y estilos base), `tailwind.config.js` (plugin `addBase`), `src/data/stack.js`, `src/data/contacto.js`, `src/components/Stack.jsx`, `src/components/Contact.jsx`, `src/index.css` (reglas de estado de `.eva-neu-module`, `.eva-channel`, `.eva-brand-accent`).
- **Tests**: nuevo `scripts/colores-de-marca.test.mjs`; se actualizan `scripts/stack-neumorfico.test.mjs`, `scripts/stack-classes.test.mjs` y `scripts/contacto.test.mjs` (hoy exigen "sin color propio", borde naranja y hover secundario).
- **Sin impacto** en dependencias, CSP (no hay estilos inline nuevos: el color viaja en la hoja de estilos), rutas ni SEO.
- **Gobernanza**: dominio LOW/MEDIUM (presentación); sin datos de usuario ni seguridad.
