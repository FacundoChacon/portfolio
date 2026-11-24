# Proposal

## Why

La auditoría posterior al rediseño "Eva" dejó tres cabos sueltos de bajo riesgo: la barra no ofrece un acceso a la sección Testimonios (es la única sección de la home sin enlace), el origen del sitio está escrito dos veces (`src/data/seo.js` y `scripts/lib/deploy-config.mjs`) y puede divergir sin que nada falle, y la imagen que se ve al compartir el sitio (`/og-image.png`) sigue siendo la de la estética cyberpunk retirada, así que cada preview en redes y mensajería contradice la identidad visual actual.

## What Changes

- **Barra de navegación**: se agrega el enlace "Testimonios" entre "Stack" y "Contáctame" (orden de documento de la home), con código `//05`; "Contáctame" pasa a `//06`. El enlace participa del indicador de sección actual (`aria-current="location"`) como los demás.
- **Testimonios vacíos**: como la sección no se renderiza cuando no hay testimonios (hoy el array de datos está vacío), el enlace tampoco se muestra en ese caso y los códigos visibles se renumeran sin huecos (Contáctame vuelve a `//05`). Ningún enlace de la barra apunta a un ancla inexistente. El código del encabezado de la sección Contacto sigue al de su enlace.
- **Menú móvil**: con seis enlaces (más "Armá tu web" en pantallas chicas), el panel móvil queda acotado a la altura disponible bajo la barra y se desplaza, para que ningún destino quede fuera de alcance en pantallas bajas (teléfono en horizontal).
- **Origen único del sitio**: las validaciones de deploy (`checkSitemap`) toman el origen de `SITE_URL` (`src/data/seo.js`) en vez de un literal propio. Sin cambio de comportamiento.
- **Imagen para compartir**: se regenera `public/og-image.png` (1200×630, PNG, misma ruta y URL) con la paleta y las tipografías Eva, mostrando "Facundo Chacón", "Desarrollador Full Stack Java / React" y "facucode.dev". La imagen sale de una plantilla versionada que toma los colores de `src/styles/eva-tokens.js` y las fuentes del propio repo, renderizada por un script manual. Un test verifica dimensiones, formato y un tope de peso del archivo publicado.

Fuera de alcance: favicon, borrar `public/screenshot.png` o `public/simbolo.jpeg`, `noindex` de `/configurador` (sigue indexado), `cv.pdf` y Apps Script.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `navegacion-del-sitio`: la barra enlaza Testimonios cuando la sección existe (con renumeración de códigos y sin anclas rotas), el indicador de sección actual deja de usar Testimonios como ejemplo de sección no enlazada, la lista de anclas de la home incluye Testimonios y el panel móvil se mantiene alcanzable en pantallas bajas.
- `metadatos-por-ruta`: la imagen para compartir declarada en `og:image`/`twitter:image` pasa a tener requisitos propios (dimensiones, formato, peso, identidad visual vigente y textos) y se genera de forma reproducible.

## Impact

- Código: `src/utils/siteNav.js` (enlace nuevo y función pura de enlaces visibles), `src/components/SiteNav.jsx` (usa los enlaces visibles; panel móvil desplazable), `src/components/Contact.jsx` (código del encabezado derivado de la barra), `scripts/lib/deploy-config.mjs` (origen desde `seo.js`).
- Recursos: `public/og-image.png` reemplazado (misma ruta). Nuevos `scripts/lib/og-image.mjs` (plantilla y lectura de PNG, funciones puras) y `scripts/render-og-image.mjs` (render manual).
- Tests: `scripts/site-nav.test.mjs`, `scripts/site-nav-classes.test.mjs`, `scripts/contacto.test.mjs`, `scripts/deploy-config.test.mjs` y nuevo `scripts/og-image.test.mjs`.
- Dependencias: se agrega `playwright` como `devDependency` con versión exacta, usada solo por el script manual de render (no corre en `npm run ci` ni en el build de Vercel, y su instalación no descarga navegadores).
- Sin cambios en `index.html`, `src/data/seo.js` (salvo que se importe desde otro lado), `vercel.json`, CSP ni rutas públicas.
