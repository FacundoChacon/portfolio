# Proposal: logo-eva

## Why

facucode.dev no tiene un logo propio: la barra muestra el texto "FC", el favicon es un "FC" verde en monoespaciada que quedó de la estética anterior y la imagen para compartir solo lleva texto. Facundo tiene un glifo personal (el dibujo neón de `public/simbolo.jpeg`: círculo, triángulo alto, reloj de arena de triángulos cruzados y un triángulo chico que apunta a la izquierda) y quiere convertirlo en la marca del sitio, redibujado con trazos rectos tipo barra (ancho casi constante, extremos en escuadra y, en algunos tramos, una subida lineal mínima del grosor como relieve) y los colores del título de Evangelion (relleno amarillo saturado con contorno y sombra desplazada rojo anaranjado), sin copiar ni reproducir ese logotipo ni su tipografía.

## What Changes

- **Glifo como vector propio, fuente única**: el glifo se redibuja a mano como SVG limpio de barras rectas (no un calco del raster) en dos variantes: **completa** (todos los trazos del dibujo original) y **simple** (triángulo alto + círculo, 4 trazos, legible a 16 px). Una sola definición de la geometría alimenta el componente de React, el favicon, el ícono táctil y la imagen para compartir.
- **Colores del logo como tokens**: dos colores nuevos (relleno amarillo y filo rojo anaranjado) definidos en la paleta central, fuera de la jerarquía de roles violeta > naranja > agua, con contraste verificado contra los fondos negro y de panel. Se exponen al CSS como variables, sin clases de Tailwind propias ni hex en componentes.
- **Favicon**: `public/favicon.svg` pasa de "FC" verde a la variante simple sobre fondo negro. Se suma `apple-touch-icon.png` (180×180) generado desde la misma fuente, porque iOS no usa favicons SVG para la pantalla de inicio.
- **Barra (home y /configurador)**: `NavBrand` muestra la variante simple del glifo **a la izquierda** del texto "FC" y del código `//00`, que se conservan; el enlace a `/`, el nombre accesible y el `sr-only` no cambian y el glifo queda oculto para tecnologías de asistencia.
- **Hero**: el glifo completo aparece grande como decoración (oculto para tecnologías de asistencia, sin desplazar contenido, adaptado a móvil), con a lo sumo una entrada breve y única que respeta movimiento reducido.
- **Imagen para compartir**: la plantilla de `og-image` incorpora el glifo completo y se regenera `public/og-image.png` (sigue 1200×630, ≤ 300 KB, misma URL).
- **Boceto para aprobación**: `bocetos/logo-completo.svg` y `bocetos/favicon.svg` en este change fijan la geometría; el apply arranca solo con el boceto aprobado.

## Capabilities

### New Capabilities

- `logotipo`: el glifo de marca del sitio: geometría única con variantes completa y simple, colores del logo, favicon e ícono táctil derivados de esa fuente, y reglas de uso decorativo y accesible.

### Modified Capabilities

- `sistema-visual`: se agrega "Colores del logotipo fuera de la jerarquía" (definición central, contraste verificado, sin clases propias, sin contar en la jerarquía de roles).
- `navegacion-del-sitio`: se agrega "Glifo en la marca de la barra" (glifo junto a "FC" en la home y en `/configurador`, mismo destino y nombre accesible).
- `seccion-de-presentacion`: se agrega "Glifo decorativo en la presentación" (decorativo, sin desplazamiento de diseño, sin tapar el nombre en móvil, movimiento según preferencia).
- `metadatos-por-ruta`: se modifica "Imagen para compartir con la identidad visual vigente" para incluir el glifo con los colores del logo tomados de su fuente única.

## Impact

- **Código**: `src/styles/eva-tokens.js` (colores del logo y sus variables CSS), `tailwind.config.js` (plugin `addBase`), `src/index.css` (clases del glifo), nuevo módulo de datos con la geometría del glifo y su serializador a SVG, nuevo componente `LogoEva`, `src/components/NavBrand.jsx`, `src/components/Hero.jsx`, `scripts/lib/og-image.mjs`, `index.html` (`apple-touch-icon`).
- **Assets**: `public/favicon.svg` (reemplazo), `public/apple-touch-icon.png` (nuevo), `public/og-image.png` (regenerado). `public/simbolo.jpeg` queda como referencia (fuera de alcance borrarlo).
- **Scripts**: nuevo script manual para generar favicon e ícono táctil con el Playwright ya instalado (como `npm run og:image`); no entra en `npm run ci` ni en el build de Vercel.
- **Tests** (`node:test`): nuevo `scripts/logotipo.test.mjs`; se actualizan `scripts/og-image.test.mjs`, `scripts/site-nav-classes.test.mjs` y `scripts/hero.test.mjs`.
- **Sin impacto** en dependencias (cero paquetes nuevos), CSP (SVG inline con clases, sin `style` inline), rutas, CV/PDF ni el configurador más allá de la barra compartida.
- **Gobernanza**: LOW/MEDIUM (presentación). Sin datos de usuario ni seguridad.
