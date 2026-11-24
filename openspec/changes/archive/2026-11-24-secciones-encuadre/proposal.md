# Proposal

## Why

Al navegar con la barra (01 Inicio … 05 Contáctame) las secciones no quedan bien encuadradas: el ancla deja el borde de la sección 16 px debajo de la barra y, con el `py-24` de cada sección, el título cae a **113 px** de la barra; en laptops (1366×768, 1280×800) Quién soy y Stack quedan bajas y Proyectos no entra (en 1366×768 las cards quedan cortadas 51 px y el cierre 283 px). Las alturas medidas (Quién soy 732 px, Proyectos 1046 px, Stack 717 px, Contacto 842 px, con 96 px de relleno arriba y abajo) superan o rozan el alto útil de 698–830 px que dejan esas pantallas debajo de la barra de 70 px. El usuario pidió secciones más chicas que queden centradas al navegar, sin volver a los huecos vacíos que se acaban de corregir en `hero-escritura`.

## What Changes

- **Desplazamiento uniforme al navegar:** cada sección de la home (Quién soy, Proyectos, Stack, Testimonios, Contacto) queda con su borde superior pegado al borde inferior de la barra fija y su franja (70 px) al seguir un enlace de la barra, del cierre de Proyectos, del botón "Hablemos" o al entrar por `/#id`. El aire de 1rem extra del `scroll-padding-top` se conserva para el foco por teclado (requisito de foco no tapado) y se anula solo para las secciones.
- **Ritmo vertical común y compacto:** un único relleno vertical para las secciones (48 px en móvil, 56 px desde 768 px, en lugar de 96/80 px) y márgenes entre encabezado y contenido de 32 px (antes 40–56 px). El título queda a 57 px de la barra en todas las secciones (antes 98–113 px).
- **Proyectos más compacto:** el panel reduce su margen inferior (72 → 40 px; el LCL sigue asomando bajo las cards) y el encabezado se acerca al panel (40 → 24 px). En pantallas de 768 px de alto o más, el título y las cards completas quedan a la vista al navegar; el cierre "Fin del registro" puede quedar bajo el pliegue hasta 900 px de alto.
- **Contacto como última sección:** se recorta el relleno muerto bajo el pie (96 → 32 px) y el espacio interno (80 → 56 px arriba, 56 → 32 px antes de la grilla, 80 → 48 px antes del pie). Desde 768 px de ancho, la sección ocupa al menos el alto útil de la pantalla con tope de 52rem (832 px) y centra el bloque encabezado + grilla con el pie abajo, para que al navegar quede pegada a la barra en pantallas de hasta ~900 px de alto en vez de mostrar el final de Stack encima.
- Sin cambios en el hero (ya encuadra: título a 62 px de la barra), ni en textos, colores, tipografías, tamaños de los títulos, franjas, paneles ni en la lógica de la barra (scroll-spy, menú móvil).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `navegacion-del-sitio`: el requisito de anclas y foco pasa a fijar un desplazamiento uniforme (sección pegada a la barra, foco con aire); se agrega el requisito de encuadre de la sección destino por alto de pantalla.
- `sistema-visual`: se agrega el ritmo vertical común de las secciones de la home (relleno y separación encabezado–contenido).
- `seccion-de-proyectos`: el requisito "Ancla de la sección" exige que el título y las cards completas queden a la vista al navegar en pantallas de 768 px de alto o más.
- `seccion-de-contacto`: se agrega el encuadre de Contacto como última sección (alto mínimo con tope, bloque centrado, pie abajo, sin relleno muerto bajo el pie).

## Impact

- Código: `src/index.css` (clase compartida de sección con relleno y `scroll-margin-top`, `.proyectos` sin `padding-block` propio, margen inferior de `.proyectos-panel`, clase de encuadre de Contacto), `src/components/About.jsx`, `Projects.jsx`, `Stack.jsx`, `Testimonials.jsx`, `Contact.jsx` (clases de espaciado). `Hero.jsx`, `SiteNav.jsx`, `siteNav.js`, `hashTarget.js` y `Home.jsx` no cambian.
- Tests: nuevo guard estático `scripts/secciones-encuadre.test.mjs` (con `scripts/lib/css-rules.mjs`); los guards existentes (`site-nav-classes`, `hero`, `contacto`, `panel-guard`, `foil-guard`) no fijan los valores que cambian y deben seguir en verde. Medición de layout con Playwright desde el scratchpad, como en changes anteriores.
- Sin dependencias nuevas, sin cambios de CSP, de rutas ni de datos. Riesgo bajo/medio (gobernanza MEDIUM: lógica de presentación), con checkpoint visual del usuario antes de cerrar.
