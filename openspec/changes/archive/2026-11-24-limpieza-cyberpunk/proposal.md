# Proposal

## Why

Con este change termina el rediseño Evangelion (change 9 de 9). Las secciones de la home y el configurador ya usan la paleta y las texturas eva. Igual quedan restos de la estética cyberpunk: `GlitchText`, los keyframes `glitch-*`/`scan`/`flicker`, las clases `.cyber-grid`, `.gradient-text`, `.glass`, `*-glow-*`, los tokens `accent-*`/`neon-*`/`dark-*`/`muted-*` y las fuentes Orbitron y Rajdhani. Esos restos tienen tres costos: (1) se sirven `@font-face` y CSS que ya no hace falta, (2) el cuerpo del texto sigue saliendo en Rajdhani (`font-sans`), y (3) la spec `sistema-visual` todavía exige que convivan las dos paletas. Mientras esa exigencia siga en pie, nada impide que la estética vieja vuelva a entrar.

## What Changes

- **BREAKING (interno)**: se borra `src/components/GlitchText.jsx` y se retira la capability `texto-animado`. Ningún componente vuelve a animar texto con glitch.
- Se eliminan de `src/index.css` y `tailwind.config.js` los keyframes y animaciones cyberpunk (`glitch-subtle`, `glitch-rgb`, `glitch-slice-visual`, `glitch-line`, `scan`, `flicker`, más `fade-in`/`slide-up`/`pulse-slow` si no tienen usos) y las clases heredadas: `.cyber-grid`, `.gradient-text`, `.gradient-border`, `.duotone-wrap`, `.glass`, `.glass-hover`, `.glow-*`, `.text-glow-*`, `.box-glow-*`, `.section-title`, `.section-desc`, `.tag` (la reemplaza `.eva-tag`) y `.reveal*` (la reemplaza `.eva-reveal`). **Solo se borra lo que el inventario muestre con 0 usos**. Lo que todavía tenga usos se reporta y queda.
- **BREAKING (tokens)**: se quitan de Tailwind `accent-*`, `neon-*`, `dark-*` y `muted-*`. La familia `display` (Orbitron) también sale.
- Se retiran Orbitron y Rajdhani: sus `@font-face` en `src/styles/fonts.css` y los paquetes `@fontsource-variable/orbitron` y `@fontsource/rajdhani`.
- Nueva familia de cuerpo (`font-sans`): la **pila de sistema** (`system-ui`, `-apple-system`, `"Segoe UI"`, `Roboto`, …). No descarga ningún archivo y se lee bien en párrafos largos. La justificación está en el design (D3).
- Se migra a la paleta eva la base global que ningún change anterior tocó: fondo y texto de `<body>` (`index.html` e `index.css`), `<main>` de la home, el spinner de carga diferida de `App.jsx`, el scrollbar, `::selection` y `<meta name="theme-color">`.
- Los guards se invierten. El test que protegía los tokens viejos (`scripts/sistema-visual.test.mjs`, "conserva los tokens anteriores") pasa a exigir que **no existan**. Se suma un guard estático global sobre todo `src/` e `index.html` que prohíbe `accent-`, `neon-`, tokens `dark-*`, `muted-*`, `glow`, `glitch`, `Orbitron`, `Rajdhani`, la clase `font-display`, las clases heredadas y los hex de la paleta anterior. Tiene una sola excepción declarada: el `#00ffc3` del PDF.
- Documentación: `knowledge-base/` (arquitectura y decisiones visuales: DD-07, RN-EX-02, árbol de componentes) y `CHANGES.md`, con una nota que lista los 9 changes del rediseño Eva.
- Cierre con regresión visual en Playwright de `/` y `/configurador/` a 1440 y 375 px: nada sin estilo, consola sin errores de CSP, y peso de CSS y fuentes antes→después.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `texto-animado`: se retira por completo (REMOVED de sus dos requisitos). Ya no existe texto con efecto glitch en el sitio.
- `sistema-visual`: se elimina el requisito "Coexistencia con la paleta anterior" (REMOVED). Se modifica "Tipografías servidas desde el propio origen": sin familias heredadas, con la pila de sistema como cuerpo. Se agregan dos requisitos: "Sin restos de la estética anterior" (guard global) y "Base del documento en la paleta del sistema". La capability todavía no está en `openspec/specs/` (la crea `tokens-fuentes-texturas-eva` y la modifica `configurador-estilo-eva`), así que este change se archiva **después** de esos dos.

## Impact

- **Código**: `tailwind.config.js`, `src/index.css`, `src/styles/fonts.css`, `index.html`, `src/App.jsx`, `src/pages/Home.jsx`. Se borra `src/components/GlitchText.jsx`. Ajustes de comentario en `scripts/lib/font-preload.mjs` (el plan B ya no puede volver a Rajdhani).
- **Tests**: `scripts/sistema-visual.test.mjs` (se invierte), un nuevo `scripts/limpieza-cyberpunk.test.mjs` (guard global y helpers puros en `scripts/lib/`), y fixtures de `font-preload.test.mjs`/`deploy-config.test.mjs` que usan el stem de Rajdhani como dato de prueba (se cambian por un stem neutro para que nada mencione la familia retirada).
- **Dependencias**: se quitan `@fontsource-variable/orbitron` y `@fontsource/rajdhani` de `package.json` y `package-lock.json`.
- **Build**: el CSS baja (keyframes y clases sin uso; Tailwind ya purga las utilidades de tokens que nadie usa, así que la baja grande está en `@layer components` y en las reglas fuera de capa) y desaparecen los `.woff2` de Orbitron y Rajdhani (unos 73 KB en `dist/assets`: Rajdhani 4 pesos ~61 KB + Orbitron ~12 KB). La CSP no cambia.
- **Dependencias de orden**: requiere que estén mergeados en `rediseno-evangelion` los changes `acerca-testimonios-glass`, `configurador-estilo-eva` y los ajustes del carrete 3D. El apply arranca con un inventario que lo verifica (design D1).
- **Fuera de alcance**: el `#00ffc3` del PDF (`src/utils/pdfDocument.js`) y el `favicon.svg` (`#00FF88`). Quedan como preguntas abiertas.
