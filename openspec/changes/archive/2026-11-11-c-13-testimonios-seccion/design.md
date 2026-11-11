# Design

## Context

- **Insumos**: auditoría UX/UI de la home ("04. Testimonios") con contrastes medidos sobre los fondos compuestos reales — comentario `text-gray-400` sobre card 7.79:1 (AA exige 4.5:1), estrellas `amber-400` 11.85:1 y vacías `gray-500` 4.09:1 (1.4.11 exige 3:1; `gray-600` falla y se descartó), número `04.` 15.8:1.
- **Patrones existentes**: `About.jsx` (reveal-bottom + cards), `Stack.jsx` (header `03.` + grid + cards con hover), `Contact.jsx` (cyber-grid + `GlitchText` en el h2 + `04.`, container `px-5`), `Projects.jsx` (`StatusBadge` ya usa `amber-400` como token de rating/estado), `src/data/configurador.js` (data-first con JSDoc), `scripts/verify-catalog.mjs` (smoke test de forma).
- **Restricciones del contrato**: lista inviolable — configurador completo, Hero/About/Projects/Stack/SiteNav/BrandIcons/GlitchText, `index.html`/`tailwind.config.js`/`vite.config.js`/`.github/`, `package.json` solo la section scripts, de `Contact.jsx` solo el `span` del número.

## Goals / Non-Goals

**Goals**: sección de testimonios de la home entre Stack y Contact, con datos editables sin tocar UI, accesible (semántica de cita, rating que no depende solo del color) y verificable por CI.

**Non-Goals**: ancla en `SiteNav` y guard de `prefers-reduced-motion` en `GlitchText` (hallazgos de la auditoría; archivos intocables en este change → backlog); normalizar el padding `px-4`/`px-5` del resto de las secciones; quitar `tabIndex` de Stack; skip-link al contenido.

## Decisions

- **D1 — Data-first con `export default`.** `src/data/testimonios.js` exporta el array directamente (contrato del change) con JSDoc `@typedef Testimonio` documentando límites: nombre de dos palabras (alimenta el avatar), rol ~40 caracteres, comentario 80-180 (altura pareja en 3 columnas), rating entero 1-5. Cargar datos no requiere tocar UI.
- **D2 — Array vacío = sección oculta.** No hay testimonios reales cargados y uno inventado destruye exactamente la credibilidad que la sección busca. El componente hace guard (`length === 0 → null`) y el verify lo trata como estado temporario válido (aviso, no error). Activar la sección es completar los datos.
- **D3 — Semántica `figure → blockquote → figcaption`.** El `blockquote` con `flex-1` iguala la altura de las cards hermanas y ancla la atribución al fondo (patrón Projects); el nombre NO es heading; el avatar son las iniciales de las dos primeras palabras del nombre, decorativo (`aria-hidden`: el nombre es texto visible adyacente).
- **D4 — Rating accesible que no depende del color.** `hasValidRating` (entero 1-5): fuera de rango no se renderiza el bloque de estrellas (más estricto que clampear — evita mostrar un rating inválido como válido). El bloque lleva `role="img"` + `aria-label="Calificación: N de 5"` y los glifos son `aria-hidden`. Llenas `amber-400` (convención "doradas = rating", token ya usado en `StatusBadge`), vacías `gray-500` (perceptibles a 4.09:1).
- **D5 — Renumeración antes de insertar.** `Contact.jsx` pasa de `04.` a `05.` en el mismo change que inserta la sección, así nunca coexisten dos "04." y el eje izquierdo queda 01→05.
- **D6 — Card no interactiva.** El `figure` replica el hover del sistema (`-translate-y-1` + borde + glow) pero sin `tabIndex`/`focus-within`: no es clicable (hallazgo de la auditoría sobre Stack: tab stop sin acción, WCAG 2.1.1).
- **D7 — Verify tolerante al vacío, estricto con los datos.** Patrón `verify-catalog.mjs` (failures + exit 1): 3-6 items, campos no vacíos, rating entero 1-5, nombre único (es el key de React). Array vacío → aviso y exit 0, para que el CI siga verde en el estado temporario.
- **D8 — Sin `specs/`.** El change es de la home; las specs existentes son de otros dominios (configurador, navegación). No se crean deltas de specs de otro dominio.

## Risks / Trade-offs

- **Sección invisible hasta cargar datos**: el deploy no muestra nada nuevo visualmente; risk deliberado (testimonios reales pendientes). El verify avisa en cada corrida de CI.
- **Sin ancla en el nav** (backlog): la sección solo se alcanza scrolleando; `SiteNav` es intocable en este change. Un change de nav la suma en una línea del array `links`.
- **`GlitchText` sin guard de reduced-motion** (backlog): el h2 nuevo usa el mismo componente que el resto de la home; el fix debe entrar cuando se pueda tocar `GlitchText`.
- **Padding `px-5` vs `px-4` de Stack**: la spec fija `px-5` (alinea con Contact, la sección de abajo); el desalineado de 4px contra Stack es deuda preexistente documentada, la normalización global es backlog.

## Migration Plan

No aplica: sección nueva, sin datos activos. Cargar los testimonios reales en `src/data/testimonios.js` activa la sección sin más cambios.

## Open Questions

Ninguna para implementar. Pendiente externo: conseguir testimonios reales autorizados (sin eso la sección no se activa).
