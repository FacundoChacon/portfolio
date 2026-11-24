# Proposal

## Why

La sección Stack es la última de la home que conserva por completo la estética cyberpunk: cada tecnología pinta su borde, texto y brillo con el color de su marca (`style={{ "--tech": color }}`, 12 colores fuera de la paleta), con `rounded-lg`, `box-shadow` de neón y traslación al hover. Además los módulos son `div` con `tabIndex={0}`: se pueden enfocar con Tab pero no hacen nada, lo que confunde a quien navega con teclado o lector de pantalla. El rediseño Evangelion asigna a esta sección **neumorfismo oscuro** (módulos en relieve que se hunden), cuyo riesgo conocido es el bajo contraste de bordes y fondos (WCAG 1.4.11); hay que garantizarlo con una verificación automática.

## What Changes

- **Decisión del usuario — paleta unificada**: se elimina el color de marca por tecnología (`color` en los datos y la variable `--tech`). Todos los módulos usan la paleta eva; cada tecnología se distingue por su monograma (en un único color eva), su nombre, su categoría y un código de módulo (`MOD-01`…).
- Nuevo material **neumórfico oscuro** en `src/index.css`: superficie de panel y módulos en relieve con sombra clara/oscura sobre el color de panel; al pasar el puntero el módulo **se hunde** (sombra interior, fondo más oscuro) **y cambia el color de su borde** (gris → naranja). Bordes con contraste ≥ 3:1 contra el entorno en ambos estados, verificado con un test que lee el CSS real.
- **Los módulos dejan de ser enfocables**: no son enlaces ni botones, así que se quita `tabIndex={0}` y se presentan como una lista semántica. El hundimiento queda como realimentación decorativa solo para punteros finos con hover; no se simula foco ni estado activo en táctil (ver design). Toda la información está visible en reposo. Se reescribe la frase "Tocá o pasá el cursor para verlas cobrar vida", que invita a una interacción que no existe.
- Datos extraídos a `src/data/stack.js` (mismos 12 nombres, monogramas y categorías, en el mismo orden) para poder testearlos.
- Encabezado con código de sistema alineado con la barra (`//04`) y título en la serif condensada; módulos que "se encienden" en cascada al entrar en pantalla, visibles de inmediato con `prefers-reduced-motion: reduce`; transiciones de estado instantáneas con movimiento reducido.
- Tests (`node --test`): datos, contraste del material en ambos estados con `blendOver`, guards estáticos sobre `Stack.jsx` y sobre las reglas CSS del material.

## Capabilities

### New Capabilities

- `seccion-de-stack`: catálogo de tecnologías de la home — contenido conservado, paleta unificada, módulos no interactivos y semánticos, estado hundido al pasar el puntero, contraste de los límites de los módulos en todos sus estados y movimiento reducido.

### Modified Capabilities

(ninguna)

## Impact

- **Código**: `src/components/Stack.jsx` (reescritura visual y semántica), nuevo `src/data/stack.js`, `src/index.css` (`.eva-neu-surface`, `.eva-neu-module` y su estado hundido).
- **Tests**: nuevo `scripts/stack-neumorfico.test.mjs` (datos, contraste, guards de CSS) y `scripts/stack-classes.test.mjs` (guard del componente); helper `scripts/lib/css-rules.mjs` si no existe (compartido con `acerca-testimonios-glass`); `blendOver` de `scripts/lib/contrast.mjs` (agregado por `navbar-brutalista-glass`); `scripts/a11y-classes.test.mjs` pasa a inspeccionar `Stack.jsx`.
- **Dependencias de changes**: requiere `tokens-fuentes-texturas-eva` aplicado (`EVA_COLORS`, `--eva-*`, `.eva-panel-label`, `.eva-panel-code`, `.eva-stripes`, `.eva-reveal`, `font-eva-display`). Usa `src/utils/siteNav.js` de `navbar-brutalista-glass` solo en un test (código de sección), con tolerancia si aún no existe.
- **Sin nuevas dependencias npm** ni cambios de CSP. Sin cambios de rutas ni de otras secciones.
- **Fuera de alcance**: borrar tokens `accent-*`/`dark-*`, `.reveal*` legacy o `GlitchText` (es `limpieza-cyberpunk`); íconos de marca SVG por tecnología.
