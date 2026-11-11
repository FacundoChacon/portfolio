# Proposal

## Why

La home cuenta la historia completa —quién soy, qué hice, con qué trabajo, cómo contactarme— pero no tiene prueba social: nada de terceros respalda los proyectos antes del CTA final. Una sección de testimonios con resultados concretos agrega esa evidencia justo antes de "Contáctame" (que pasa a ser la 05), el punto del embudo donde el visitante decide si escribe.

## What Changes

- Nuevo `src/data/testimonios.js`: fuente de verdad de los testimonios (`{ nombre, rol, comentario, rating }`, 3-6 items, `export default`). Mientras no haya testimonios reales autorizados se exporta un **array vacío**: la sección queda inactiva por diseño (guard del componente).
- Nuevo `src/components/Testimonials.jsx`: sección "04. Testimonios" de la home — header con numeración mono + `GlitchText` + línea degradada, grilla 1-col mobile / 3-col `lg` con reveal, cards `figure → blockquote → figcaption`, rating accesible (`role="img"` + `aria-label`, estrellas `aria-hidden`) y avatar de iniciales decorativo. Guard: `testimonios.length === 0 → return null`.
- `src/pages/Home.jsx`: monta `<Testimonials />` entre `<Stack />` y `<Contact />`.
- `src/components/Contact.jsx`: renumeración del header de sección `04.` → `05.` (única edición: el `span` del número).
- Nuevo `scripts/verify-testimonials.mjs` (patrón de `verify-catalog.mjs`) + script `verify:testimonials` incluido en `npm run ci`.

## Capabilities

### New Capabilities
Ninguna.

### Modified Capabilities
Ninguna. Es una sección de la home: no toca el dominio del configurador ni ninguna capability existente, por eso este change no lleva `specs/`.

## Impact

- **Código**: nuevos `src/data/testimonios.js`, `src/components/Testimonials.jsx` y `scripts/verify-testimonials.mjs`; `src/pages/Home.jsx` suma el mount; `src/components/Contact.jsx` renumera su header; `package.json` solo la section `scripts`. Sin dependencias nuevas (usa `Star` de `lucide-react` ya presente).
- **Datos**: la sección no renderiza hasta cargar testimonios reales; el array vacío pasa el CI con un aviso (estado temporario documentado, no un error).
- **Alcance deliberado**: `SiteNav` no suma el ancla `#testimonios` y `GlitchText` no recibe guard de `prefers-reduced-motion` — mejoras identificadas por la auditoría UX pero fuera del contrato de este change (archivos intocables); quedan como backlog para un change de nav/pulido.
- **Consumidores futuros**: un change de navegación puede sumar el ancla al array `links` de `SiteNav`; un change de motion puede dar el guard global de `GlitchText`.
