# Proposal

## Why

El rediseño de facucode.dev hacia una estética inspirada en Evangelion (terminal de mando, serif condensada y pesada, franjas de advertencia, grilla hexagonal, paneles con etiqueta/código) se parte en 9 changes; este es la base. Sin una paleta, tipografías y texturas comunes, cada sección inventaría las suyas y el resultado sería inconsistente e inaccesible. Además, hoy las fuentes vienen de Google Fonts, lo que obliga a abrir la CSP a `fonts.googleapis.com` y `fonts.gstatic.com` y agrega una dependencia de terceros en el render.

## What Changes

- Nueva paleta `eva.*` (negro, casi-negro de panel, línea, "papel", grises, naranja, rojo, violeta, verde fósforo) como tokens de Tailwind y variables CSS, con contraste WCAG verificado por test. Rojo y violeta quedan restringidos a texto grande o decoración. Los tokens `accent-*`, `neon-*`, `dark-*` y `muted-*` **no se tocan** (el configurador los usa; se eliminan en `limpieza-cyberpunk`).
- Tipografías autoalojadas (sin Google Fonts): Noto Serif Display variable con eje de ancho (`wdth` 62.5–100 %) para títulos condensados/pesados y JetBrains Mono para etiquetas/códigos. Rajdhani y Orbitron, que el sitio actual sigue usando hasta que cada sección migre, también pasan a autoalojarse (mismos nombres de familia y pesos) para poder cortar Google ya. Solo subset latin y los pesos en uso.
- Precarga (`<link rel="preload" as="font">`) de la fuente principal en el HTML de cada página pública, inyectada en el build, sin atributos `on*`.
- Se eliminan de `index.html` los `preconnect` y la hoja de Google Fonts.
- **Endurecimiento de la CSP**: `style-src 'self'` y `font-src 'self'` (se quitan `https://fonts.googleapis.com` y `https://fonts.gstatic.com`), con la verificación de deploy exigiéndolo.
- Utilidades CSS reutilizables: grilla hexagonal, franjas de advertencia, paneles de sistema (`.eva-panel` con etiqueta y código), etiquetas/tags, y utilidades de estiramiento tipográfico.
- Foco visible global con token `eva` (verde fósforo); `scroll-behavior: smooth` solo sin `prefers-reduced-motion: reduce`; utilidades de revelado con variante de movimiento reducido, reutilizando `src/utils/motion.js` y `useReveal`.
- Sin restyling de secciones ni componentes: el cambio visual de este change es mínimo (el único efecto visible es el tono del anillo de foco).

## Capabilities

### New Capabilities
- `sistema-visual`: tokens de color con contraste verificado, tipografías autoalojadas y su precarga, texturas y paneles reutilizables, foco visible y comportamiento con movimiento reducido que comparten todas las secciones del sitio.

### Modified Capabilities
- `cabeceras-de-seguridad`: la CSP deja de permitir orígenes de Google Fonts (`style-src` y `font-src` solo `'self'`), el recorrido sin violaciones pasa a exigir fuentes autoalojadas y la verificación automática falla si vuelve un origen externo de estilos o fuentes.
- `integracion-continua`: la verificación post-build exige que el HTML de cada página pública precargue la fuente principal desde el propio origen y no referencie orígenes de fuentes de terceros.

## Impact

- **Código**: `tailwind.config.js`, `src/index.css`, `src/main.jsx`, nuevo `src/styles/eva-tokens.js` y `src/styles/fonts.css`, `src/hooks/useReveal.js`, `index.html`, `vite.config.js`, `vercel.json`, `scripts/lib/deploy-config.mjs`, `scripts/lib/route-html.mjs`, `scripts/verify-build.mjs`, nuevos `scripts/lib/contrast.mjs` y `scripts/lib/font-preload.mjs`, y sus tests en `scripts/*.test.mjs`.
- **Dependencias**: `@fontsource-variable/noto-serif-display`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/orbitron`, `@fontsource/rajdhani` (todas OFL 1.1). Inter deja de cargarse (era solo fallback).
- **Seguridad**: CSP más estricta; riesgo de bloquear estilos/fuentes si queda alguna referencia externa (mitigado con tests y verificación manual en navegador).
- **Docs**: `knowledge-base/08_arquitectura_propuesta.md` (línea de la CSP).
- **Changes posteriores**: navbar, proyectos, hero, acerca/testimonios, stack, contacto y configurador consumen estos tokens/utilidades; `limpieza-cyberpunk` elimina Rajdhani/Orbitron y los tokens `accent-*`/`neon-*`.
