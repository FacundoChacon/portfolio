# Tasks

## 1. Datos (`src/data/testimonios.js`)

- [x] 1.1 `export default` de `{ nombre, rol, comentario, rating }` con JSDoc (`@typedef Testimonio`), patrón data-first del repo (`configurador.js`).
- [x] 1.2 Array vacío + comentario "Cargar testimonios reales antes de activar la sección" (todavía no hay testimonios reales cargados; inventarlos está descartado).

## 2. Componente (`src/components/Testimonials.jsx`)

- [x] 2.1 Guard: `testimonios.length === 0 → return null` (la sección no renderiza nada).
- [x] 2.2 Sección `id="testimonios"`: `cyber-grid` + capa relative, header `04.` + `GlitchText("Testimonios")` + línea degradada (patrón Stack/Contact).
- [x] 2.3 Grilla `reveal reveal-bottom` 1-col mobile / 3-col `lg` con `useReveal()` default (threshold 0.15).
- [x] 2.4 Card `figure` con hover del sistema y sin `tabIndex` (no es interactiva), `blockquote` con `flex-1` y `figcaption` con avatar de iniciales `aria-hidden` + nombre + rol.
- [x] 2.5 Rating accesible: `hasValidRating` (entero 1-5; fuera de rango no renderiza estrellas), `role="img"` + `aria-label="Calificación: N de 5"`, estrellas `aria-hidden`, llenas `amber-400` / vacías `gray-500`.

## 3. Integración

- [x] 3.1 Renumerar `Contact.jsx`: `04.` → `05.` (solo el `span` del número, antes de insertar la sección nueva para que nunca coexistan dos "04.").
- [x] 3.2 `Home.jsx`: import + `<Testimonials />` entre `<Stack />` y `<Contact />`.

## 4. Verificación

- [x] 4.1 `scripts/verify-testimonials.mjs` siguiendo el patrón de `verify-catalog.mjs`: 3-6 items, nombre/rol/comentario no vacíos, rating entero 1-5, nombre único (es el key de la grilla); array vacío avisa y pasa.
- [x] 4.2 `package.json`: agregar `verify:testimonials` (section scripts) e incluirlo en `ci`.
- [x] 4.3 `npm run ci` verde (lint, verify:catalog, verify:testimonials, test, build).
