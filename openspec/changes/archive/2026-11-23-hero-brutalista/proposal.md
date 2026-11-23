# Proposal

## Why

El hero es lo primero que se ve de facucode.dev y todavía conserva la estética cyberpunk (grilla cian, manchas difuminadas, marco con brillo, `animate-flicker` en el apellido) mientras el resto del sitio migra al sistema visual inspirado en Evangelion (`tokens-fuentes-texturas-eva`, `navbar-brutalista-glass`, `proyectos-scroll-horizontal`). Es también la sección que define el LCP (el retrato `profile.webp`) y la que justifica precargar la serif de títulos: hasta que el hero no use Noto Serif Display, el build sigue precargando Rajdhani (decisión D4 del change de tokens).

## What Changes

- Rediseño brutalista de `src/components/Hero.jsx`: nombre enorme en Noto Serif Display condensada y pesada (`font-eva-display` + `font-stretch-*`), composición asimétrica en grilla de 12 columnas, retrato con marco duro, etiqueta y código (`.eva-panel-label` / `.eva-panel-code`), franja de advertencia `.eva-stripes`, panel de "sistema" con datos (rol, stack, ubicación, estado "OPERATIVO") y CTAs como bloques duros con sombra sólida desplazada.
- Se eliminan del hero los efectos cyberpunk: `cyber-grid`, manchas `blur-[120px]`, marco con degradado difuminado, `box-glow-cyan`, `text-glow-cyan`, `animate-flicker` y todo token `accent-*`/`dark-*`/`font-display` (Orbitron). Las clases globales y keyframes **no** se borran (los usan otras secciones hasta `limpieza-cyberpunk`).
- Datos del hero (nombre, rol, filas del panel, enlaces sociales) en un módulo puro `src/data/presentacion.js` con tests.
- El retrato conserva su carga prioritaria y gana `fetchpriority="high"` y dimensiones intrínsecas (`width`/`height`), sin `loading="lazy"`; el título se compone en líneas fijas para que el cambio de fuente (swap) no altere su alto (CLS).
- Animación de entrada solo para elementos secundarios (franja, panel de sistema, CTAs) con CSS `motion-safe:`; nunca sobre el retrato ni el `h1` (candidatos a LCP). Con movimiento reducido, todo visible y estático desde el primer frame.
- `PRELOAD_FONT_STEMS` (`scripts/lib/font-preload.mjs`) pasa de `rajdhani-latin-400-normal` a `noto-serif-display-latin-wdth-normal` (reemplazo, no suma): una sola precarga, la de la fuente del título. Justificación en design D5.
- Guards estáticos y tests de contraste nuevos (`node --test`); `scripts/a11y-classes.test.mjs` suma `Hero.jsx` a su lista.

## Capabilities

### New Capabilities
- `seccion-de-presentacion`: contenido, jerarquía, accesibilidad, carga prioritaria del retrato y movimiento de la sección de presentación (hero) de la home.

### Modified Capabilities
Ninguna. La spec `sistema-visual` (creada por `tokens-fuentes-texturas-eva`, aún sin archivar) ya exige "precargar la fuente principal del primer render" sin nombrar la familia, y su escenario "Sin advertencia de precarga ociosa" se sigue cumpliendo: Noto Serif Display se usa en el primer render de `/` (título del hero y marca `NavBrand`) y de `/configurador` (`NavBrand` en su cabecera, de `navbar-brutalista-glass`). `navegacion-del-sitio` no cambia: el ancla `#presentacion` y el enlace "Inicio" se mantienen. `texto-animado` no aplica (el hero no usa `GlitchText`).

## Impact

- Código: `src/components/Hero.jsx` (reescritura visual), `src/data/presentacion.js` (nuevo), `scripts/lib/font-preload.mjs` (constante y comentario), `tailwind.config.js` (keyframe/animación de entrada `eva-boot`), `scripts/lib/class-guard.mjs` (helper de guards estáticos compartido con `contacto-brutalista`, lo crea el primero que se aplique). Reutiliza `blendOver` de `scripts/lib/contrast.mjs` (agregado por `navbar-brutalista-glass`).
- Tests: `scripts/hero.test.mjs` (nuevo: datos, guard de clases, contraste), `scripts/font-preload.test.mjs` (expectativa de la constante + coherencia con `fonts.css` y uso en `/configurador`), `scripts/a11y-classes.test.mjs` (lista de archivos).
- Build/verificación: `verify:build` toma la nueva constante sin cambios de código; el HTML de `/` y `/configurador` precarga ~76 KB (Noto `wdth`) en lugar de ~15 KB (Rajdhani 400).
- Rendimiento: LCP y CLS del hero se miden antes y después (Playwright); criterio de aceptación en design D6.
- Dependencias: requiere `tokens-fuentes-texturas-eva` aplicado y `navbar-brutalista-glass` aplicado (NavBrand en `/configurador`, `--eva-nav-h`). Sin dependencias npm nuevas. Sin cambios de CSP.
