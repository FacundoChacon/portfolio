# Proposal

## Why

"Quién soy" y "Testimonios" siguen con la estética cyberpunk (verde/rosa con brillo, `GlitchText` en el título de Testimonios, `cyber-grid`, cards redondeadas con `box-glow-cyan`) mientras el rediseño Evangelion ya tiene tokens, texturas y paneles listos (`tokens-fuentes-texturas-eva`) y la barra fija ya usa cristal (`navbar-brutalista-glass`). El plan del rediseño asigna a estas dos secciones **glassmorphism**: paneles HUD translúcidos sobre la grilla hexagonal. El riesgo conocido del cristal (explore, sección 4) es el contraste del texto sobre un fondo que no es un color plano; hay que garantizarlo con una verificación automática, no a ojo.

## What Changes

- Nuevo material compartido **cristal de panel** (`.eva-glass` en `src/index.css`): tinte del color de panel con opacidad suficiente para que el texto mantenga AA en el peor caso (la línea de la grilla hexagonal bajo el texto, y un caso de estrés con una textura naranja sólida), desenfoque acotado, borde fino y respaldo **opaco** con `@supports not` cuando el navegador no soporta `backdrop-filter`. Se coordina con `.eva-nav-glass` de la barra (mismo bloque de respaldo, materiales distintos por motivos de contraste; ver design).
- **Quién soy** (`src/components/About.jsx`): sección sobre grilla hexagonal; la biografía pasa a un panel de cristal tipo "expediente" con etiqueta y código de sistema; los cuatro puntos fuertes, a paneles de cristal chicos con código (`CAP-01`…). Mismos textos. Encabezado con código de sistema alineado con la barra (`//02`) y título en la serif condensada. Sin hover que mueva paneles (el cristal queda estático).
- **Testimonios** (`src/components/Testimonials.jsx`): cards de cristal como "mensajes entrantes en una consola" (código `MSG-001`…, prompt `>`, cursor que parpadea como máximo 3 veces); estrellas y avatar con la paleta eva. **Se quita el uso de `GlitchText`** del título (el componente y sus keyframes siguen existiendo: los borra `limpieza-cyberpunk`). Se mantiene `return null` con el array vacío.
- Lógica de testimonios extraída a funciones puras testeables (`hasValidRating`, `inicialesDe`, código de mensaje, texto de la calificación); `scripts/verify-testimonials.mjs` reutiliza la misma validación de calificación.
- Animaciones de entrada con `.eva-reveal` aplicadas a cada panel (nunca a un ancestro del cristal), visibles de inmediato con `prefers-reduced-motion: reduce`.
- Tests (`node --test`): contraste del cristal con `blendOver`, guards estáticos de clases sobre ambos componentes y del bloque de respaldo en el CSS, y lógica pura de testimonios.

Sin cambios de datos (`src/data/testimonios.js` sigue vacío y válido), de rutas, de CSP ni de dependencias npm.

## Capabilities

### New Capabilities

- `paneles-de-cristal`: material translúcido de los paneles estáticos del sitio — legibilidad garantizada sobre el peor fondo decorativo, respaldo opaco sin soporte de desenfoque y uso acotado a paneles que no se mueven.
- `seccion-quien-soy`: contenido, estructura accesible, códigos de sistema decorativos y revelado de la sección "Quién soy" de la home.
- `seccion-de-testimonios`: visibilidad condicionada a que haya testimonios, contenido de cada testimonio, presentación como mensajes entrantes, título estático y movimiento acotado de la sección "Testimonios".

### Modified Capabilities

(ninguna: `texto-animado` no cambia — `GlitchText` sigue cumpliendo su spec donde se use; este change solo deja de usarlo en Testimonios)

## Impact

- **Código**: `src/components/About.jsx` y `src/components/Testimonials.jsx` (reescritura visual), nuevo `src/utils/testimonios.js` (puro), `src/index.css` (`.eva-glass`, su respaldo `@supports not`, keyframes `eva-cursor-blink`), `scripts/verify-testimonials.mjs` (importa `hasValidRating`).
- **Tests**: nuevo `scripts/testimonios.test.mjs` (lógica pura), nuevo `scripts/eva-glass.test.mjs` (contraste y respaldo del cristal), nuevo `scripts/acerca-testimonios-classes.test.mjs` (guard estático), helper nuevo `scripts/lib/css-rules.mjs` (extraer reglas y colores `rgb(r g b / a)` del CSS) si no existe; `scripts/a11y-classes.test.mjs` pasa a inspeccionar también `About.jsx` y `Testimonials.jsx`.
- **Dependencias de changes**: requiere `tokens-fuentes-texturas-eva` aplicado (`.eva-hex-grid`, `.eva-panel-label`, `.eva-panel-code`, `.eva-reveal`, `--eva-*`, `EVA_COLORS`, `scripts/lib/contrast.mjs`) y usa `blendOver` (agregado por `navbar-brutalista-glass`; si no estuviera, se agrega con el mismo contrato). Convive con `navbar-brutalista-glass` en `src/index.css` y en `scripts/a11y-classes.test.mjs` (ediciones acotadas, ver design).
- **Fuera de alcance**: borrar `GlitchText.jsx`, sus keyframes, `.glass`/`.cyber-grid`/tokens `accent-*` (es `limpieza-cyberpunk`); Stack (es `stack-neumorfico-oscuro`); cargar testimonios reales.
