# Proposal

## Why

La barra de navegación es lo primero que se ve y lo único presente en todo el recorrido de la home, pero sigue con la estética cyberpunk (`<FC/>` con brillo, bordes redondeados verde/rosa) mientras el resto del rediseño Evangelion ya tiene tokens, fuentes y utilidades listos (`tokens-fuentes-texturas-eva`). Además arrastra deudas de accesibilidad: el menú móvil no se cierra con Escape ni devuelve el foco, no indica la sección actual y, al ser fija, tapa el título de la sección (y el foco) cuando se sigue un ancla como `#proyectos` (WCAG 2.4.11 Focus Not Obscured).

## What Changes

- Rediseño "brutalismo + cristal" de `SiteNav` (barra fija de la home): bordes naranja duros de 2px, sin radios; etiquetas en mono mayúscula con códigos de sistema (`FC//00`, `//01 INICIO`…); fondo negro translúcido con desenfoque de 8–12px y respaldo opaco cuando el navegador no soporta `backdrop-filter`; franja de advertencia decorativa debajo de la barra.
- Indicador de sección actual: el enlace de la sección visible se muestra como bloque sólido invertido (negro sobre naranja) y se anuncia con `aria-current`.
- Hover con desplazamiento duro (sombra sólida sin desenfoque); sin movimiento con `prefers-reduced-motion: reduce`.
- Menú móvil brutalista: panel opaco, cierre con Escape devolviendo el foco al botón, cierre al elegir un destino o al pasar a escritorio; se conservan `aria-expanded`/`aria-controls` y el comportamiento actual.
- Enlace "Saltar al contenido" como primer elemento enfocable en `/` y `/configurador`.
- Desplazamiento a anclas y foco compensados por la altura de la barra fija (`scroll-padding-top`), para que la sección y el control enfocado no queden debajo.
- `/configurador` **no usa** `SiteNav`: tiene su propia cabecera estática (logo + "Volver al inicio"). Se le aplica el mismo cromado (marca, bordes, cristal) sin volverla fija ni tocar el cuerpo del configurador (eso es `configurador-estilo-eva`).
- Lógica extraída a funciones puras testeables (enlaces con códigos, sección activa, opciones del observador, teclas del menú) y guards estáticos de clases/estilos.

Sin cambios funcionales de destinos: mismos enlaces, mismo CTA "Armá tu web" con navegación cliente, mismo CV y "Hablemos".

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `navegacion-del-sitio`: se agregan requisitos sobre la barra de navegación (indicador de sección actual, menú móvil operable por teclado, salto al contenido, anclas no tapadas por la barra fija, cromado consistente en `/configurador`, legibilidad del fondo translúcido y movimiento reducido). Los requisitos existentes de enrutado no cambian.

## Impact

- **Código**: `src/components/SiteNav.jsx` (reescritura visual + scroll-spy + teclado), nuevo `src/components/NavBrand.jsx`, nuevo `src/utils/siteNav.js` (puro), cabecera de `src/pages/Configurador.jsx` (solo el `<header>` y el `id` del `<main>`), `id` del `<main>` en `src/pages/Home.jsx`, `src/index.css` (`.eva-nav-glass`, `--eva-nav-h`, `scroll-padding-top`).
- **Tests**: nuevo `scripts/site-nav.test.mjs` (lógica pura + contraste del cristal en el peor caso) y `scripts/site-nav-classes.test.mjs` (guard estático); `scripts/a11y-classes.test.mjs` pasa a inspeccionar también `SiteNav.jsx` y `NavBrand.jsx`.
- **Dependencia**: requiere `tokens-fuentes-texturas-eva` aplicado (paleta `eva.*`, `--eva-focus`, `.eva-stripes`, `font-eva-display`, `.font-stretch-*`, `scripts/lib/contrast.mjs`).
- **Sin nuevas dependencias npm** ni cambios de CSP (todo es CSS del propio origen y clases de Tailwind).
- **Fuera de alcance**: el resto de las secciones de la home (hero, proyectos, etc.) y el cuerpo de `/configurador`.
