# Design

## Context

Ver `proposal.md` (Why) y las specs delta. Estado del código en la rama `secciones-encuadre` (base `9935e34`):

**Anclaje hoy** (`src/index.css`, `@layer base`):
- `:root { --eva-nav-h: 70px }` y `html { scroll-padding-top: calc(var(--eva-nav-h) + 1rem) }`. Con `scroll-behavior: smooth` solo sin movimiento reducido.
- Ninguna sección tiene `scroll-margin`. Toda navegación (enlaces nativos `href="#id"` de la barra, del menú móvil, de "Ver proyectos" y de "Hablemos" en `ProyectosCierre`, y el `scrollIntoView({ behavior: 'instant', block: 'start' })` de `Home.jsx` para `/#id`) deja el borde superior de la sección a 86 px del viewport: 16 px por debajo de la barra.
- El scroll-spy (`sectionObserverOptions`) usa `rootMargin: -70px 0px -60% 0px` y elige la **última** sección presente entre las que intersectan.

**Relleno y márgenes hoy:**

| Sección | Relleno vertical | Borde sup. | Encabezado → contenido | Título desde la barra |
|---|---|---|---|---|
| Quién soy (`About.jsx`) | `py-24` (96) | `border-t` (1) | grilla `mt-12` (48) | 16 + 1 + 96 = 113 |
| Proyectos (`Projects.jsx`) | `.proyectos { padding-block: 5rem }` (80, CSS sin capa) | `border-t-2` (2) | `<div className="mt-10">` (40) | 16 + 2 + 80 = 98 |
| Stack (`Stack.jsx`) | `py-24` | `border-t` | intro `mt-6` (24), superficie `mt-12` (48) | 113 |
| Testimonios (`Testimonials.jsx`) | `py-24` | `border-t` | intro `mt-6`, grilla `mt-12` | 113 |
| Contacto (`Contact.jsx`) | `pb-24` (96) en la sección, `pt-20` (80) en el contenedor | `border-t-2` + franja `h-3` (12) | grilla `mt-14` (56), pie `mt-20` (80) | 16 + 2 + 12 + 80 = 110 |

`.proyectos-panel` tiene `padding: 1rem 1rem 4.5rem` (72 px abajo, para que el LCL asome). `ProyectosCierre` va a `mt-6` del panel.

**Alto de Contacto hoy** (1280–1920, panel de 406 px y título `sm:text-6xl` de 60 px): 2 + 12 + 80 + 60 + 56 + 406 + 80 + 50 (pie) + 96 = **842 px**.

**Restricciones:**
- CSP `style-src 'self'`: nada de atributos `style` nuevos (los `transitionDelay` existentes no se tocan).
- `Hero.jsx`, `SiteNav.jsx`, `siteNav.js`, `hashTarget.js` y `Home.jsx` no cambian.
- Guards vigentes: `site-nav-classes` exige `scroll-padding-top: calc(var(--eva-nav-h)…` y `--eva-nav-h` en px igual a `NAV_HEIGHT_PX`; `foil-guard` fija el `padding-block: 1.5rem` de `.proyectos-ventana`; `contacto` y `hero` fijan clases que este change no toca.
- Tests con `node --test` y `scripts/lib/css-rules.mjs` (`ruleBody` desciende por `@layer` y por `@media` con `within`). No hay Vitest ni RTL y no se agregan.

## Goals / Non-Goals

**Goals:**
- Una sola fuente para el aire del foco y su anulación en las secciones, de modo que no puedan desincronizarse.
- El ritmo vertical común en una clase compartida, no repetido como utilidades en cada componente.
- Que cada valor nuevo quede fijado por un guard estático y que el encuadre real se verifique midiendo con Playwright.

**Non-Goals:**
- Tocar el hero, la lógica de la barra (scroll-spy, menú móvil) o el manejo de `/#id`.
- Snap de scroll (`scroll-snap-type`) ni alturas de pantalla completa para las secciones intermedias.
- Cambiar el contenido, los tamaños de títulos, la grilla de Contacto o el número de cards por vista de Proyectos.
- Garantizar que "Fin del registro" quede a la vista en pantallas de menos de 900 px de alto.

## Decisions

### D1. Anclaje uniforme: `scroll-margin-top` negativo en las secciones, atado a un token de aire

Se agrega `--eva-foco-aire: 1rem` en `:root` y `html` pasa a `scroll-padding-top: calc(var(--eva-nav-h) + var(--eva-foco-aire))` (mismo valor que hoy). Las clases de sección (D2 y D4) llevan `scroll-margin-top: calc(-1 * var(--eva-foco-aire))`.

El navegador suma el `scroll-padding` del contenedor y el `scroll-margin` del destino. Para una sección el resultado es exactamente `--eva-nav-h`: queda pegada a la barra. Para un control enfocado dentro de una sección (Shift+Tab) solo cuenta su propio `scroll-margin` (cero), así que el foco conserva los 16 px de aire. Funciona igual con enlaces nativos, con `scroll-behavior: smooth` y con el `scrollIntoView` de `Home.jsx`, sin tocar JS.

Alternativas:
- **Bajar `scroll-padding-top` a `--eva-nav-h`**: alinea las secciones, pero el foco por teclado pierde el aire que pide la spec de foco no tapado.
- **Corrección en JS** (interceptar los clics y calcular el offset): obliga a tocar `SiteNav.jsx`, `Home.jsx` y el botón "Hablemos", y rompe la navegación nativa sin JS.
- **`-1rem` literal en cada clase**: funciona, pero si alguien cambia el aire del foco las secciones quedan desalineadas. El token hace que la suma sea siempre `--eva-nav-h` y el guard lo verifica.

### D2. Ritmo común: clase `.eva-seccion` en `@layer components`

```
.eva-seccion            { scroll-margin-top: calc(-1 * var(--eva-foco-aire)); padding-block: 3rem; }
@media (min-width: 768px) { .eva-seccion { padding-block: 3.5rem; } }
```

La llevan `#quien-soy`, `#proyectos`, `#stack` y `#testimonios` en lugar de `py-24`. El título queda a 1 + 56 = 57 px de la barra (58 en Proyectos por su borde de 2 px) desde 768 px y a 49–50 px en móvil.

Separación encabezado → contenido (spec "Ritmo vertical común"):
- Quién soy: grilla `mt-12` → `mt-8`.
- Stack y Testimonios: el texto introductorio conserva `mt-6` respecto del título; el contenido pasa de `mt-12` a `mt-8` respecto del intro.
- Proyectos: `<div className="mt-10">` → `mt-6` (D3).

Se elige una clase CSS y no utilidades (`py-12 md:py-14 -scroll-mt-4`) porque el `scroll-margin` depende del token de D1, que Tailwind no conoce, y porque el guard puede fijar un único bloque en vez de cuatro listas de clases. Va en `@layer components` para que ninguna regla sin capa la pise por orden de cascada (ver D3).

Alternativas:
- **Utilidades de Tailwind en cada `<section>`**: cuatro lugares que mantener sincronizados y el negativo del `scroll-margin` desacoplado del token.
- **Selector `main > section[id]`**: alcanzaría también al hero (que no debe cambiar) y a Contacto (que tiene su propio encuadre), y oculta en el CSS qué secciones participan.
- **48/56 px vs 40/48 px**: con 40 px el título queda a 41 px y las secciones se pegan visualmente; 56 px ya cumple el encuadre en 1366×768 para Quién soy (≈ 636 px de 698 útiles) y Stack.

### D3. Proyectos: sin `padding-block` propio, panel más bajo y encabezado más cerca

- `.proyectos` pierde `padding-block: 5rem`. Es CSS sin capa: si se quedara, ganaría a `.eva-seccion` aunque esta esté declarada después. Conserva `--proyectos-gap` y `--por-vista`.
- `.proyectos-panel`: `padding: 1rem 1rem 4.5rem` → `1rem 1rem 2.5rem`. El canvas del LCL cubre todo el panel y llena 2/3 desde abajo, así que el líquido sigue asomando 40 px bajo las cards.
- Encabezado → panel: `mt-10` → `mt-6`.

Ganancia sobre el estado actual: 41 px por el anclaje y el relleno (98 → 57) + 16 px del encabezado = 57 px, más que los 51 px que hoy quedan cortadas las cards en 1366×768. El margen inferior del panel no cuenta para ese corte, pero acerca el cierre (−32 px). `ProyectosCierre` conserva su `mt-6`; en pantallas de menos de 900 px de alto puede quedar bajo el pliegue, como acepta la proposal.

Alternativas:
- **Achicar las cards o pasar a 4 por vista**: cambia la spec del panel y el foil.
- **Sacar la barra del panel**: pierde los controles y el indicador.

### D4. Contacto: clase `.contacto-cierre` con alto mínimo topado, bloque centrado y pie abajo

```
.contacto-cierre { scroll-margin-top: calc(-1 * var(--eva-foco-aire)); padding-bottom: 2rem; }
@media (min-width: 768px) {
  .contacto-cierre {
    display: flex; flex-direction: column;
    min-height: min(calc(100vh - var(--eva-nav-h)), 52rem);
    min-height: min(calc(100svh - var(--eva-nav-h)), 52rem);
  }
}
```

Marcado en `Contact.jsx`:
- `<section>`: `pb-24` → `contacto-cierre`.
- Contenedor: `pt-20` → `pt-14` y suma `md:flex md:flex-1 md:flex-col`.
- Nuevo `<div className="md:my-auto">` que envuelve la fila del título y la grilla. La grilla pasa de `mt-14` a `mt-8`.
- Pie: `mt-20` → `mt-12`. Queda último dentro del contenedor.

Alto natural nuevo en 1280–1920: 2 + 12 + 56 + 60 + 32 + 406 + 48 + 50 + 32 = **698 px**, exactamente el alto útil de 1366×768. El sobrante hasta el mínimo (32 px en 1280×800, 132 en 1440×900, 134 en 1920×1080 con el tope de 832) se reparte por `my-auto` arriba del encabezado y entre la grilla y el pie, nunca entre los canales: la grilla conserva `lg:auto-rows-fr lg:content-stretch` de `hero-escritura` y su alto no cambia. En 1920×1080 el espacio entre el borde y el encabezado queda en 2 + 12 + 56 + 67 ≈ 137 px (spec: ≤ 160).

Se usa `svh` (no `dvh`) para que el mínimo no cambie al aparecer o esconderse la barra del navegador en tablets, con `vh` antes como respaldo, igual que `.eva-mobile-nav`. El nombre sigue el prefijo de sección (`proyectos-*`) porque la regla es exclusiva de Contacto.

Alternativas:
- **`min-h-screen`** (sin restar la barra ni tope): en 1920×1080 dejaría casi 300 px vacíos y la sección no cabría bajo la barra.
- **`justify-between` en el contenedor**: pega el bloque arriba y empuja todo el sobrante sobre el pie, que queda flotando lejos del contenido.
- **Relleno inferior grande para poder desplazar**: es justo el relleno muerto que se quiere quitar.
- **Aplicar el mínimo también en móvil**: en 375 px el contenido apilado ya supera la pantalla y el centrado no aporta; la spec pide alto natural.

### D5. Guard estático `scripts/secciones-encuadre.test.mjs`

Reutiliza `ruleBody` de `scripts/lib/css-rules.mjs` (ya existe; no hace falta agregar helpers salvo que aparezca una necesidad concreta). Fija:
- **CSS**:
  - `:root` define `--eva-foco-aire`.
  - `html` usa `calc(var(--eva-nav-h) + var(--eva-foco-aire))`.
  - `.eva-seccion` y `.contacto-cierre` usan `scroll-margin-top: calc(-1 * var(--eva-foco-aire))`.
  - `.eva-seccion` tiene relleno móvil menor que el de `@media (min-width: 768px)` y este ≤ 3.5rem.
  - `.proyectos` sin `padding-block`.
  - `.proyectos-panel` con relleno inferior de 2.5rem.
  - `.contacto-cierre`: relleno inferior ≤ 2rem y, solo dentro de `@media (min-width: 768px)`, `display: flex`, `flex-direction: column` y `min-height` con `52rem`, `vh` antes que `svh`.
- **JSX**:
  - Las cuatro secciones llevan `eva-seccion` y ninguna utilidad `py-`/`pt-`/`pb-` en el `<section>`.
  - Márgenes encabezado → contenido ≤ `mt-8` (sin `mt-10`, `mt-12` ni `mt-14` en esos bloques).
  - Contacto con `contacto-cierre`, sin `pb-24`, contenedor `pt-14` y `md:flex-1`, envoltorio `md:my-auto`, grilla `mt-8` y pie `mt-12`.
  - `Hero.jsx` no usa `eva-seccion`.

Cada bloque se triangula con el valor anterior (`padding-block: 5rem`, `py-24`, `-1rem` literal, `min-height` sin tope, `min-height` fuera del `@media`) para que el guard demuestre que rechaza la regresión.

### D6. Verificación medida con Playwright

Script en el scratchpad sobre `npm run build` + `vite preview` (Chromium), antes (línea de base en la rama sin cambios) y después. Viewports: 1366×768, 1280×800, 1440×900, 1920×1080 y 375×812 (menú móvil). Mide:
- Para cada enlace de la barra: `top` de la sección − borde inferior de la barra (0 ±2 px), `top` del título − barra (≤ 64 px y misma distancia ±16 px entre secciones), fin del contenido ≤ `innerHeight` cuando cabe, y enlace activo en la barra.
- Proyectos: fin de las cards visibles y de su botón "Repositorio" ≤ `innerHeight` desde 768 px de alto.
- Contacto: `top` pegado a la barra, alto (≥ útil, = 832 ±2 en 1920), distancia borde → encabezado (≤ 160), fin del último canal vs fin del panel (≤ 16) y alto natural en 375.
- Rellenos computados (`getComputedStyle`) iguales en las cuatro secciones, ≤ 56 px en 1440 y menores en 375.
- Entrada directa por `/#stack` con la misma posición que el clic, y "Hablemos" y "Ver proyectos".
- Shift+Tab hacia un control por encima del viewport: el contorno queda visible bajo la barra.
- Capturas antes → después por sección y viewport para el checkpoint del usuario.

## Risks / Trade-offs

- [Algún navegador ignora `scroll-margin` negativo o no lo suma al `scroll-padding`] → Está en la spec CSS (solo `scroll-padding` prohíbe negativos) y Chromium, Firefox y Safari lo aplican en anclas y `scrollIntoView`. La tarea 1.3 lo comprueba en Chromium antes de tocar código. Si falla, el peor caso es el comportamiento actual (16 px de aire), no un corte.
- [Con la sección exactamente en el borde de la barra, la anterior también "intersecta" por adyacencia y el scroll-spy marca la equivocada] → `activeSection` elige la última en orden entre las que intersectan, que es la de destino. Se verifica midiendo el enlace activo en D6.
- [En 1920×1080 Contacto no puede pegarse a la barra (la página termina antes)] → Es la excepción que prevé la spec ("salvo cuando el final de la página impide desplazar más"); el tope de 52rem mantiene el bloque compacto y el escenario de la spec solo pide alto y contenido a la vista.
- [Proyectos queda con poco margen en 1366×768 (≈ 6 px entre el botón "Repositorio" y el borde)] → Está medido en D3. Si la tipografía o las cards crecen, el guard no lo detecta: lo detecta la medición D6, que se vuelve a correr en cualquier change que toque el panel.
- [Menos relleno hace que las secciones se lean pegadas] → Los bordes superiores y las franjas siguen separando, y 56 px es el máximo que permite el encuadre. Es lo que valida el checkpoint visual.
- [El LCL se ve menos con 40 px bajo las cards] → El tanque cubre todo el panel; el líquido sigue detrás de la mitad inferior de las cards. Se revisa en las capturas.

## Migration Plan

1. Línea de base medida y comprobación de `scroll-margin` negativo.
2. Token y anclaje (D1), clase `.eva-seccion` (D2) y su uso en las cuatro secciones.
3. Proyectos (D3) y Contacto (D4).
4. Medición, `npm run ci` y checkpoint visual del usuario.

Rollback: es solo CSS y clases. Revertir el commit restaura el encuadre anterior sin efectos en datos ni rutas.
